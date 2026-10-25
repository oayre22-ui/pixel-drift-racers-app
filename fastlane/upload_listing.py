#!/usr/bin/env python3
"""Fill in the App Store listing for version 1.0 straight through the App Store Connect API.

Reads fastlane/metadata and fastlane/screenshots, so it replaces `fastlane deliver` (whose Ruby/OpenSSL
setup on Codemagic rejects the key). Does NOT submit for review.
Needs APP_STORE_CONNECT_KEY_IDENTIFIER, APP_STORE_CONNECT_ISSUER_ID, APP_STORE_CONNECT_PRIVATE_KEY.
"""
import base64, hashlib, json, os, re, sys, textwrap, time, urllib.error, urllib.request
import jwt  # PyJWT
from cryptography.hazmat.primitives import serialization

BUNDLE_ID = "com.pixeldriftracers.game"
VERSION = "1.0"
LOCALE = "en-US"
HERE = os.path.dirname(os.path.abspath(__file__))
META = os.path.join(HERE, "metadata")
SHOTS = os.path.join(HERE, "screenshots", LOCALE)
# file prefix -> App Store Connect screenshot slot
SLOTS = {
    "iphone63": "APP_IPHONE_61",          # iPhone with Dynamic Island (medium display), required
    "iphone69": "APP_IPHONE_67",          # iPhone with Dynamic Island (large display)
    "ipadpro129": "APP_IPAD_PRO_3GEN_129",  # iPad 13-inch, required
}
API = "https://api.appstoreconnect.apple.com"
errors = []


def clean_pem(raw):
    raw = raw.strip()
    # Codemagic-style references: "@file:/path/AuthKey.p8" or "@env:VAR"
    if raw.startswith("@file:"):
        raw = open(os.path.expanduser(raw[6:]), encoding="utf-8").read()
    elif raw.startswith("@env:"):
        raw = os.environ[raw[5:]]
    raw = raw.replace("\\n", "\n")
    if "BEGIN" not in raw:  # maybe the whole .p8 file was base64-encoded
        try:
            decoded = base64.b64decode(re.sub(r"\s", "", raw) + "===").decode("utf-8")
            if "BEGIN" in decoded:
                raw = decoded
        except Exception:
            pass
    body = re.sub(r"-----(BEGIN|END)[A-Z ]*-----", "", raw)
    body = re.sub(r"[^A-Za-z0-9+/=]", "", body)
    return "-----BEGIN PRIVATE KEY-----\n" + "\n".join(textwrap.wrap(body, 64)) + "\n-----END PRIVATE KEY-----\n"


def describe_key(raw):
    """Shape of the key value without revealing it."""
    raw = raw.strip()
    kind = "file reference" if raw.startswith("@file:") else "env reference" if raw.startswith("@env:") else \
        "PEM" if "BEGIN" in raw else "no PEM header"
    return f"{kind}, {len(raw)} chars, {raw.count(chr(10)) + 1} lines"


RAW_KEY = os.environ["APP_STORE_CONNECT_PRIVATE_KEY"]
print("Key value looks like:", describe_key(RAW_KEY))
KEY = clean_pem(RAW_KEY)
serialization.load_pem_private_key(KEY.encode(), password=None)  # fail early with a clear error
print("Key loads OK")
KEY_ID = os.environ["APP_STORE_CONNECT_KEY_IDENTIFIER"].strip()
ISSUER = os.environ["APP_STORE_CONNECT_ISSUER_ID"].strip()
_token = [None, 0]


def token():
    if time.time() > _token[1] - 60:
        now = int(time.time())
        _token[0] = jwt.encode({"iss": ISSUER, "iat": now, "exp": now + 1000, "aud": "appstoreconnect-v1"},
                               KEY, algorithm="ES256", headers={"kid": KEY_ID, "typ": "JWT"})
        _token[1] = now + 1000
    return _token[0]


def api(method, path, body=None):
    url = path if path.startswith("http") else API + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method,
                                 headers={"Authorization": "Bearer " + token(), "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as r:
            txt = r.read()
            return json.loads(txt) if txt else {}
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"{method} {path} -> HTTP {e.code}: {e.read().decode(errors='replace')[:800]}")


def step(name, fn):
    try:
        fn()
        print("OK   ", name)
    except Exception as e:  # keep going so one bad field doesn't hide the rest
        print("FAIL ", name, "\n     ", e)
        errors.append(name)


def meta(name, locale=True):
    p = os.path.join(META, LOCALE, name) if locale else os.path.join(META, name)
    return open(p, encoding="utf-8").read().strip() if os.path.exists(p) else None


def patch(kind, obj_id, attrs):
    attrs = {k: v for k, v in attrs.items() if v}
    api("PATCH", f"/v1/{kind}/{obj_id}", {"data": {"type": kind, "id": obj_id, "attributes": attrs}})


app = api("GET", f"/v1/apps?filter[bundleId]={BUNDLE_ID}")["data"][0]
app_id = app["id"]
print("App:", app["attributes"]["name"], app_id)

versions = api("GET", f"/v1/apps/{app_id}/appStoreVersions?filter[platform]=IOS&filter[versionString]={VERSION}")["data"]
if not versions:
    sys.exit(f"Version {VERSION} not found in App Store Connect")
version_id = versions[0]["id"]

step("Content rights", lambda: patch("apps", app_id, {"contentRightsDeclaration": "DOES_NOT_USE_THIRD_PARTY_CONTENT"}))
step("Copyright", lambda: patch("appStoreVersions", version_id, {"copyright": meta("copyright.txt", locale=False)}))

vlocs = api("GET", f"/v1/appStoreVersions/{version_id}/appStoreVersionLocalizations")["data"]
vloc = next((l for l in vlocs if l["attributes"]["locale"] == LOCALE), None)
if vloc is None:
    sys.exit(f"No {LOCALE} localization on version {VERSION}")
step("Description, keywords, support URL", lambda: patch("appStoreVersionLocalizations", vloc["id"], {
    "description": meta("description.txt"), "keywords": meta("keywords.txt"), "supportUrl": meta("support_url.txt"),
    "marketingUrl": meta("marketing_url.txt"), "promotionalText": meta("promotional_text.txt")}))


def app_info_fields():
    infos = api("GET", f"/v1/apps/{app_id}/appInfos")["data"]
    live = ("READY_FOR_DISTRIBUTION", "READY_FOR_SALE")
    info = next((i for i in infos if i["attributes"].get("state", i["attributes"].get("appStoreState")) not in live), infos[0])
    ilocs = api("GET", f"/v1/appInfos/{info['id']}/appInfoLocalizations")["data"]
    iloc = next(l for l in ilocs if l["attributes"]["locale"] == LOCALE)
    patch("appInfoLocalizations", iloc["id"], {"privacyPolicyUrl": meta("privacy_url.txt"), "subtitle": meta("subtitle.txt")})


step("Privacy policy URL and subtitle", app_info_fields)


def upload_shots(prefix, display_type):
    files = sorted(f for f in os.listdir(SHOTS) if f.startswith(prefix + "-") and f.endswith(".png"))
    if not files:
        return
    sets = api("GET", f"/v1/appStoreVersionLocalizations/{vloc['id']}/appScreenshotSets")["data"]
    sset = next((s for s in sets if s["attributes"]["screenshotDisplayType"] == display_type), None)
    if sset:
        for old in api("GET", f"/v1/appScreenshotSets/{sset['id']}/appScreenshots")["data"]:
            api("DELETE", f"/v1/appScreenshots/{old['id']}")
    else:
        sset = api("POST", "/v1/appScreenshotSets", {"data": {
            "type": "appScreenshotSets", "attributes": {"screenshotDisplayType": display_type},
            "relationships": {"appStoreVersionLocalization": {"data": {"type": "appStoreVersionLocalizations", "id": vloc["id"]}}}}})["data"]
    for f in files:
        blob = open(os.path.join(SHOTS, f), "rb").read()
        shot = api("POST", "/v1/appScreenshots", {"data": {
            "type": "appScreenshots", "attributes": {"fileName": f, "fileSize": len(blob)},
            "relationships": {"appScreenshotSet": {"data": {"type": "appScreenshotSets", "id": sset["id"]}}}}})["data"]
        for op in shot["attributes"]["uploadOperations"]:
            chunk = blob[op["offset"]:op["offset"] + op["length"]]
            req = urllib.request.Request(op["url"], data=chunk, method=op["method"],
                                         headers={h["name"]: h["value"] for h in op["requestHeaders"]})
            urllib.request.urlopen(req).read()
        api("PATCH", f"/v1/appScreenshots/{shot['id']}", {"data": {"type": "appScreenshots", "id": shot["id"],
            "attributes": {"uploaded": True, "sourceFileChecksum": hashlib.md5(blob).hexdigest()}}})
        print("      uploaded", f)


for prefix, display_type in SLOTS.items():
    step(f"Screenshots {display_type}", lambda p=prefix, d=display_type: upload_shots(p, d))

if errors:
    sys.exit("Failed: " + ", ".join(errors))
print("All done. Nothing was submitted for review.")
