// ===== utils =====
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const TAU = Math.PI * 2;
const wrapAng = a => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
const fmtMoney = n => '$' + Math.round(n).toLocaleString('en-US');
const fmtTime = t => { if (!isFinite(t)) return '--:--.--'; const m = Math.floor(t / 60), s = t - m * 60; return m + ':' + (s < 10 ? '0' : '') + s.toFixed(2); };
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (f < 1) { r *= f; g *= f; b *= f; } else { r += (255 - r) * (f - 1); g += (255 - g) * (f - 1); b += (255 - b) * (f - 1); }
  return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
}
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0); return c; }

// ===== safe storage (file:// and sandboxed iframes may throw) =====
const Store = (() => {
  let ls = null, mem = {};
  try { const t = window.localStorage; t.setItem('__dr', '1'); t.removeItem('__dr'); ls = t; } catch (e) { ls = null; }
  return {
    get(k) { try { if (ls) return ls.getItem(k); } catch (e) {} return mem[k] ?? null; },
    set(k, v) { mem[k] = v; try { if (ls) ls.setItem(k, v); } catch (e) {} },
    persistent: !!ls,
  };
})();

// ===== audio (guarded; starts on first gesture) =====
const Sfx = {
  ctx: null, on: true, eng: null,
  init() {
    if (this.ctx) { try { if (this.ctx.state === 'suspended') this.ctx.resume(); } catch (e) {} return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      const ctx = new AC(); this.ctx = ctx;
      this.master = ctx.createGain(); this.master.gain.value = this.on ? 0.5 : 0; this.master.connect(ctx.destination);
      // engine
      const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o1.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; f.frequency.value = 700; g.gain.value = 0;
      o1.connect(f); o2.connect(f); f.connect(g); g.connect(this.master); o1.start(); o2.start();
      this.eng = {o1, o2, f, g};
      // tyre squeal: filtered noise
      const len = ctx.sampleRate * 1, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const n = ctx.createBufferSource(); n.buffer = buf; n.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 3;
      const sg = ctx.createGain(); sg.gain.value = 0; n.connect(bp); bp.connect(sg); sg.connect(this.master); n.start();
      this.sq = {bp, g: sg};
      this.noiseBuf = buf;
    } catch (e) { this.ctx = null; }
  },
  setOn(v) { this.on = v; try { if (this.master) this.master.gain.value = v ? 0.5 : 0; } catch (e) {} },
  engine(rpmN, thr, loud) {
    if (!this.eng) return;
    try {
      const t = this.ctx.currentTime, f = 38 + rpmN * 190;
      this.eng.o1.frequency.setTargetAtTime(f, t, 0.03); this.eng.o2.frequency.setTargetAtTime(f * 0.5, t, 0.03);
      this.eng.f.frequency.setTargetAtTime(400 + thr * 1600 + loud * 600, t, 0.05);
      this.eng.g.gain.setTargetAtTime(0.05 + thr * 0.09 + loud * 0.03, t, 0.05);
    } catch (e) {}
  },
  squeal(a) { if (!this.sq) return; try { const t = this.ctx.currentTime; this.sq.g.gain.setTargetAtTime(a * 0.12, t, 0.05); this.sq.bp.frequency.setTargetAtTime(1200 + a * 600, t, 0.1); } catch (e) {} },
  silence() { this.engine(0, 0, 0); if (this.eng) try { this.eng.g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05); } catch (e) {} this.squeal(0); },
  beep(freq, dur, type, vol) {
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type || 'square'; o.frequency.value = freq; g.gain.setValueAtTime(vol || 0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.02);
    } catch (e) {}
  },
  thud(v) {
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime, s = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
      s.buffer = this.noiseBuf; f.type = 'lowpass'; f.frequency.value = 300; g.gain.setValueAtTime(clamp(v, 0.05, 0.5), t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + 0.3);
    } catch (e) {}
  },
  cheer(v) {
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime, s = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
      s.buffer = this.noiseBuf; f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.8;
      g.gain.setValueAtTime(0.001, t); g.gain.linearRampToValueAtTime(0.12 * v, t + 0.15); g.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
      s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + 1.5);
    } catch (e) {}
  },
  cash() { [660, 880, 1320].forEach((f, i) => setTimeout(() => this.beep(f, 0.12, 'square', 0.08), i * 70)); },
};

// ===== save game =====
const SAVE_KEY = 'driftracers_save_v1';
function newCarState(id) {
  const c = CAR_BY_ID[id], parts = {}, owned = {}, tune = {};
  for (const k of PART_ORDER) { parts[k] = 0; owned[k] = [0]; }
  for (const t of TUNES) tune[t.k] = t.def(c);
  tune.gears = c.gears.slice();
  return {id, parts, owned, tune, paint: c.color, stripe: 0, spoiler: 0, hood: 0, glow: 0, stripeColor: '#1d1d27', kit: 0, kits: [0], livery: 0, liveries: [0], body: 100, cond: Object.fromEntries(PART_ORDER.map(k => [k, 100]))};
}
function defaultSave() {
  return {cash: 2000, cars: {hachi: newCarState('hachi')}, current: 'hachi', best: {},
    tutorialDone: false, usedSeed: 1, usedSold: [], settings: {sound: true, assist: true, touch: 'auto', units: 'kmh', cs: 'normal', hold: 'normal', spin: true, kick: false, speedHold: false, softWalls: false, combo: false, steerSpd: 'normal', easyHandling: false}, stats: {races: 0, wins: 0, bestDrift: 0}};
}
let SAVE = defaultSave();
function loadSave() {
  try {
    const raw = Store.get(SAVE_KEY); if (!raw) return;
    const s = JSON.parse(raw), d = defaultSave();
    SAVE = Object.assign(d, s); SAVE.settings = Object.assign(d.settings, s.settings || {});
    delete SAVE.settings.arcade; // Arcade Drift was tried and removed
    if (s.settings && !('easyHandling' in s.settings)) SAVE.settings.easyHandling = !!(s.settings.cs === 'max' && s.settings.hold === 'strong' && s.settings.softWalls); // Max Easy players get Easy Handling too
    if (s.settings && s.settings.assist === false && !('cs' in s.settings)) { SAVE.settings.cs = 'off'; SAVE.settings.hold = 'off'; } // old saves SAVE.stats = Object.assign(d.stats, s.stats || {});
    for (const id in SAVE.cars) { // fill in any fields added in later versions
      if (!CAR_BY_ID[id]) { delete SAVE.cars[id]; continue; }
      const base = newCarState(id), cs = SAVE.cars[id];
      SAVE.cars[id] = Object.assign(base, cs, {parts: Object.assign(base.parts, cs.parts), owned: Object.assign(base.owned, cs.owned), tune: Object.assign(base.tune, cs.tune), cond: Object.assign(base.cond, cs.cond)});
    }
    if (!SAVE.cars[SAVE.current]) SAVE.current = Object.keys(SAVE.cars)[0] || 'hachi';
    if (!SAVE.cars.hachi && !Object.keys(SAVE.cars).length) SAVE.cars.hachi = newCarState('hachi');
  } catch (e) { SAVE = defaultSave(); }
}
function persist() { Store.set(SAVE_KEY, JSON.stringify(SAVE)); }

// ===== spec builder: car + parts + tune -> physics parameters =====
function partLv(cs, k) { return PARTS[k].levels[cs.parts[k] || 0]; }
function partPrice(carId, k, lv) { return Math.round((PARTS[k].levels[lv].p || 0) * TIER_COST[CAR_BY_ID[carId].tier]); }
function buildSpec(cs) {
  const c = CAR_BY_ID[cs.id], p = cs.parts, t = cs.tune, lv = k => partLv(cs, k);
  const cf = k => clamp(((cs.cond && cs.cond[k]) ?? 100) / 100, 0, 1), wf = (k, lo) => lo + (1 - lo) * cf(k); // worn parts work worse
  const tv = k => { const d = TUNES.find(x => x.k === k); if (!d.req(p)) return d.def(c); const v = t[k] ?? d.def(c); return clamp(v, d.min, tuneMax(d, p)); };
  let pow = c.power * 1000, rev = 0, massM = 1, resp = 1, shiftMul = 1;
  let gain = 0; // power upgrades add up (not multiply) so fully built cars stay drivable
  for (const k of PART_ORDER) { const L = lv(k); if (L.pow) gain += (L.pow - 1) * wf(k, 0.3); if (L.rev) rev += L.rev; if (L.mass) massM *= L.mass; if (L.resp) resp *= L.resp; if (L.shiftMul) shiftMul *= L.shiftMul; }
  const tb = lv('turbo').boost || 0;
  if (tb) gain += (tb * tv('boost') + (lv('intercooler').ic || 1) - 1 + (lv('fuel').ic || 1) - 1) * wf('turbo', 0.25);
  pow *= (1 + gain) * wf('engine', 0.8);
  const mass = c.mass * massM;
  const tyre = lv('tires');
  let muF = c.grip * tyre.muF * wf('tires', 0.9), muR = c.grip * tyre.muR * wf('tires', 0.9);
  const tpF = tv('tpF'), tpR = tv('tpR');
  muF *= 1 + 0.005 * (32 - tpF); muR *= 1 + 0.005 * (32 - tpR);
  const camG = cam => 1.04 - 0.016 * (cam + 2.5) * (cam + 2.5);
  muF *= camG(tv('camF')); muR *= camG(tv('camR'));
  const sF = tv('sprF'), sR = tv('sprR'), bal = (sF - sR) / 9, stiff = (sF + sR) / 20;
  muF *= 1 - 0.07 * bal; muR *= 1 + 0.07 * bal;
  const arb = (tv('arbF') - tv('arbR')) / 9; muF *= 1 - 0.045 * arb; muR *= 1 + 0.045 * arb;
  resp *= (0.92 + 0.16 * stiff) * wf('suspension', 0.93) * wf('steering', 0.96);
  const BF = 13 * resp * (1 + 0.012 * (tpF - 32)), BR = 13 * resp * (1 + 0.012 * (tpR - 32));
  const h = c.h * (0.8 + 0.04 * tv('height')) * (1.15 - 0.3 * stiff);
  const lock = (lv('diff').adj ? tv('diff') : lv('diff').lock) * wf('diff', 0.7);
  const aero = lv('aero'), wing = aero.dfR ? tv('wing') : 0;
  const dg = defaultGears(c, p), tg = t.gears;
  const gears = gearsTunable(p) && Array.isArray(tg) && tg.length === dg.length ? tg.slice() : dg;
  const L = c.a + c.b;
  return {
    id: c.id, name: c.name, power: pow, mass, a: c.a, b: c.b, L, h, I: mass * (c.a * c.a + c.b * c.b) * 0.6,
    muF, muR, BF, BR, redline: c.redline + rev + tv('rev'), gears, final: tv('final'), wheelR: c.wheelR,
    shift: lv('gearbox').shift * shiftMul / (wf('gearbox', 0.6) * wf('clutch', 0.7)), brake: mass * G * 1.05 * lv('brakes').br * wf('brakes', 0.7), bias: tv('bias') / 100,
    steerMax: tv('steer') * Math.PI / 180, lock, drag: (c.drag + (aero.dfF || 0) * 0.02 + wing * 0.006) * (1 + 0.12 * (1 - clamp((cs.body ?? 100) / 100, 0, 1))),
    dfF: (aero.dfF || 0) * 1.2 * wf('aero', 0.4), dfR: (aero.dfR || 0) * (0.5 + wing / 10) * 1.2 * wf('aero', 0.4),
    hbGrip: lv('handbrake').hb, hbForce: lv('handbrake').hbF * wf('handbrake', 0.75),
    nos: (lv('nitrous').nos || 0) > 0, nosDur: lv('nitrous').nos || 4, nosShot: tv('nosShot') / 100,
    loud: lv('exhaust').loud || 0,
    turbo: tb > 0 && !lv('turbo').sc ? (lv('turbo').spool || 1) : 0, // turbo lag (bigger = laggier); superchargers have none
  };
}
function gearTop(sp, g) { return (sp.redline * TAU / 60) / (g * sp.final) * sp.wheelR; } // m/s at redline
function topSpeed(sp) { // m/s: min of gear limit and power/drag limit
  const gearV = (sp.redline * TAU / 60) / (sp.gears[sp.gears.length - 1] * sp.final) * sp.wheelR;
  const dragV = Math.cbrt(sp.power * 0.85 / sp.drag);
  return Math.min(gearV, dragV);
}
function rating(sp) { // a single "PR" number for event matching
  const pw = sp.power / sp.mass; // W/kg
  const grip = (sp.muF + sp.muR) / 2;
  return Math.round(pw * 1.2 + grip * 60 + topSpeed(sp) * 0.6 - 20 + (sp.nos ? 10 : 0));
}

// ===== track =====
class Track {
  constructor(id) {
    const def = TRACKS[id]; this.id = id; this.def = def; this.name = def.name; this.theme = def.theme;
    this.build(def.pts);
  }
  build(P) {
    const n = P.length, raw = [];
    for (let i = 0; i < n; i++) {
      const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
      for (let s = 0; s < 40; s++) {
        const t = s / 40, t2 = t * t, t3 = t2 * t;
        raw.push([
          0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
      }
    }
    // resample at uniform spacing
    const DS = 4, xs = [], ys = [];
    let acc = 0; xs.push(raw[0][0]); ys.push(raw[0][1]);
    for (let i = 1; i <= raw.length; i++) {
      const a = raw[i - 1], b = raw[i % raw.length];
      let seg = Math.hypot(b[0] - a[0], b[1] - a[1]), pos = 0;
      while (acc + (seg - pos) >= DS) {
        pos += DS - acc; acc = 0; const t = pos / seg;
        xs.push(a[0] + (b[0] - a[0]) * t); ys.push(a[1] + (b[1] - a[1]) * t);
      }
      acc += seg - pos;
    }
    if (Math.hypot(xs[xs.length - 1] - xs[0], ys[ys.length - 1] - ys[0]) < DS * 0.5) { xs.pop(); ys.pop(); }
    const N = xs.length; this.N = N; this.ds = DS; this.len = N * DS; // px
    this.x = new Float32Array(xs); this.y = new Float32Array(ys);
    this.tx = new Float32Array(N); this.ty = new Float32Array(N); this.ang = new Float32Array(N); this.curv = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N, k = (i - 1 + N) % N;
      let dx = xs[j] - xs[k], dy = ys[j] - ys[k], l = Math.hypot(dx, dy) || 1;
      this.tx[i] = dx / l; this.ty[i] = dy / l; this.ang[i] = Math.atan2(dy, dx);
    }
    for (let i = 0; i < N; i++) { // signed curvature (1/px), smoothed
      let s = 0; for (let o = -6; o <= 6; o++) { const a = (i + o - 1 + N * 2) % N, b = (i + o + 1) % N; s += wrapAng(this.ang[(b + N) % N] - this.ang[a]) / (2 * DS); }
      this.curv[i] = s / 13;
    }
    let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
    for (let i = 0; i < N; i++) { minx = Math.min(minx, xs[i]); miny = Math.min(miny, ys[i]); maxx = Math.max(maxx, xs[i]); maxy = Math.max(maxy, ys[i]); }
    const M = 220; this.ox = Math.floor(minx - M); this.oy = Math.floor(miny - M);
    for (let i = 0; i < N; i++) { this.x[i] -= this.ox; this.y[i] -= this.oy; }
    this.W = Math.ceil(maxx - minx + 2 * M); this.H = Math.ceil(maxy - miny + 2 * M);
    // AI speed profile (m/s per unit grip): v = sqrt(a_lat * R)
    this.vCurve = new Float32Array(N);
    for (let i = 0; i < N; i++) { let c = 0; for (let o = 0; o < 10; o++) c = Math.max(c, Math.abs(this.curv[(i + o) % N])); const R = 1 / Math.max(c, 1e-5) / PPM; this.vCurve[i] = Math.sqrt(G * R); }
  }
  // nearest sample search around hint index; returns idx, signed lateral offset (px, + = right of travel)
  nearest(px, py, hint, range) {
    const N = this.N; let best = hint, bd = 1e18;
    if (hint < 0) { for (let i = 0; i < N; i++) { const d = (px - this.x[i]) ** 2 + (py - this.y[i]) ** 2; if (d < bd) { bd = d; best = i; } } }
    else for (let o = -range; o <= range; o++) { const i = (hint + o + N) % N, d = (px - this.x[i]) ** 2 + (py - this.y[i]) ** 2; if (d < bd) { bd = d; best = i; } }
    const dx = px - this.x[best], dy = py - this.y[best];
    const along = dx * this.tx[best] + dy * this.ty[best];
    const lat = -dx * this.ty[best] + dy * this.tx[best];
    return {idx: best, lat, along, s: best * this.ds + along};
  }
  posAt(s, lat) { // s in px along the centreline
    const N = this.N, f = ((s / this.ds) % N + N) % N, i = Math.floor(f), j = (i + 1) % N, t = f - i;
    const x = lerp(this.x[i], this.x[j], t), y = lerp(this.y[i], this.y[j], t);
    const tx = lerp(this.tx[i], this.tx[j], t), ty = lerp(this.ty[i], this.ty[j], t), l = Math.hypot(tx, ty) || 1;
    return {x: x - (ty / l) * lat, y: y + (tx / l) * lat, ang: Math.atan2(ty, tx), i};
  }
  surface(lat) { const a = Math.abs(lat), hw = ROAD_W / 2; return a < hw ? 0 : a < hw + CURB ? 1 : a < hw + RUNOFF ? 2 : 3; }

  render() {
    const W = this.W, H = this.H, cv = mkCanvas(W, H), g = cv.getContext('2d'), th = this.theme, R = rng(this.id.length * 977 + W);
    const pal = {
      harbor: {grass: [58, 120, 64], run: '#b9a77a', asph: [74, 74, 86]},
      forest: {grass: [40, 98, 46], run: '#8a7a5a', asph: [66, 66, 74]},
      city: {grass: [46, 46, 58], run: '#5f5f70', asph: [56, 56, 68]},
      lot: {grass: [70, 70, 80], run: '#7a7a88', asph: [84, 84, 96]},
      mountain: {grass: [74, 98, 72], run: '#8d8778', asph: [70, 70, 78]},
      sakura: {grass: [84, 142, 74], run: '#c9b48a', asph: [72, 70, 82]},
      desert: {grass: [196, 160, 104], run: '#d8b98a', asph: [82, 76, 74]},
    }[th];
    // ground noise
    const img = g.createImageData(W, H), d = img.data, gc = pal.grass;
    for (let i = 0; i < W * H; i++) { const r = R(), v = r < 0.08 ? -14 : r < 0.16 ? 12 : r < 0.18 ? 24 : 0; d[i * 4] = gc[0] + v; d[i * 4 + 1] = gc[1] + v; d[i * 4 + 2] = gc[2] + v; d[i * 4 + 3] = 255; }
    if (th === 'city' || th === 'lot') for (let y = 0; y < H; y += 48) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; d[i] += 10; d[i + 1] += 10; d[i + 2] += 10; }
    g.putImageData(img, 0, 0);
    if (th === 'lot') { // painted parking bays
      g.fillStyle = 'rgba(235,235,235,.55)';
      for (let y = 30; y < H - 40; y += 70) for (let x = 20; x < W - 20; x += 14) { g.fillRect(x, y, 1, 26); }
      for (let y = 30; y < H - 40; y += 70) g.fillRect(20, y + 26, W - 40, 1);
    }
    if (th === 'mountain') { // snow patches and bare rock
      for (let i = 0; i < 90; i++) { const x = R() * W, y = R() * H, r0 = 6 + R() * 18; g.fillStyle = R() < 0.6 ? 'rgba(232,238,245,.85)' : 'rgba(110,110,120,.6)'; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(x + (R() - 0.5) * r0, y + (R() - 0.5) * r0, r0 * (0.4 + R() * 0.4), 0, TAU); g.fill(); } }
    }
    if (th === 'sakura') { g.fillStyle = '#ffb7d5'; for (let i = 0; i < W * H / 300; i++) g.fillRect((R() * W) | 0, (R() * H) | 0, 1, 1); g.fillStyle = '#ffd6e7'; for (let i = 0; i < W * H / 900; i++) g.fillRect((R() * W) | 0, (R() * H) | 0, 1, 1); }
    if (th === 'desert') { g.fillStyle = 'rgba(150,110,60,.35)'; for (let i = 0; i < 260; i++) { const x = R() * W, y = R() * H; g.fillRect(x | 0, y | 0, (20 + R() * 60) | 0, 1); } }
    if (th === 'harbor') { // water band along the top-left
      g.fillStyle = '#1d4f8a'; g.fillRect(0, 0, W, 90); g.fillRect(0, 0, 70, H);
      g.fillStyle = '#2f6fb3'; for (let i = 0; i < 400; i++) { const x = R() * W, y = R() * 90; g.fillRect(x | 0, y | 0, 4, 1); }
      for (let i = 0; i < 200; i++) { g.fillRect((R() * 70) | 0, (R() * H) | 0, 4, 1); }
    }
    const pat = (base, n) => { const c = mkCanvas(32, 32), x = c.getContext('2d'); x.fillStyle = `rgb(${base})`; x.fillRect(0, 0, 32, 32);
      for (let i = 0; i < n; i++) { const v = R() < 0.5 ? -10 : 10; x.fillStyle = `rgb(${base.map(q => q + v)})`; x.fillRect((R() * 32) | 0, (R() * 32) | 0, 1, 1); } return g.createPattern(c, 'repeat'); };
    const path = () => { g.beginPath(); g.moveTo(this.x[0], this.y[0]); for (let i = 1; i < this.N; i++) g.lineTo(this.x[i], this.y[i]); g.closePath(); };
    g.lineJoin = 'round'; g.lineCap = 'round';
    // barrier
    path(); g.lineWidth = ROAD_W + RUNOFF * 2 + 10; g.strokeStyle = '#151520'; g.stroke();
    path(); g.lineWidth = ROAD_W + RUNOFF * 2 + 6; g.strokeStyle = '#eeeeee'; g.stroke();
    g.lineCap = 'butt'; g.setLineDash([6, 6]); path(); g.strokeStyle = th === 'city' ? '#3df2ff' : th === 'sakura' ? '#ff8fb5' : '#d8303a'; g.stroke(); g.setLineDash([]); g.lineCap = 'round';
    // run-off
    path(); g.lineWidth = ROAD_W + RUNOFF * 2; g.strokeStyle = pat(pal.run.match(/\w\w/g).map(h => parseInt(h, 16)), 160); g.stroke();
    // curbs
    path(); g.lineWidth = ROAD_W + CURB * 2; g.strokeStyle = '#f2f2f2'; g.stroke();
    g.lineCap = 'butt'; g.setLineDash([8, 8]); path(); g.strokeStyle = '#e0303a'; g.stroke(); g.setLineDash([]); g.lineCap = 'round';
    // asphalt + edge lines
    const ap = pat(pal.asph, 220);
    path(); g.lineWidth = ROAD_W; g.strokeStyle = ap; g.stroke();
    path(); g.lineWidth = ROAD_W - 4; g.strokeStyle = '#d8d8d8'; g.stroke();
    path(); g.lineWidth = ROAD_W - 6; g.strokeStyle = ap; g.stroke();
    if (th !== 'lot') { g.setLineDash([10, 12]); path(); g.lineWidth = 1; g.strokeStyle = 'rgba(240,220,120,.55)'; g.stroke(); g.setLineDash([]); }
    // start line + grid
    g.save(); g.translate(this.x[0], this.y[0]); g.rotate(this.ang[0]);
    for (let r = 0; r < 2; r++) for (let k = -ROAD_W / 2 + 3; k < ROAD_W / 2 - 3; k += 3) { g.fillStyle = ((k / 3 | 0) + r) % 2 ? '#111' : '#fff'; g.fillRect(-3 + r * 3, k, 3, 3); }
    g.restore();
    for (let q = 0; q < 6; q++) { const p = this.posAt(-(40 + q * 36), (q % 2 ? 1 : -1) * 12); g.save(); g.translate(p.x, p.y); g.rotate(p.ang); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(8, -6, 1, 12); g.fillRect(2, -6, 6, 1); g.fillRect(2, 5, 6, 1); g.restore(); }
    // decoration outside the barrier
    const minD = (x, y) => { let b = 1e9; for (let i = 0; i < this.N; i += 3) { const dd = (x - this.x[i]) ** 2 + (y - this.y[i]) ** 2; if (dd < b) b = dd; } return Math.sqrt(b); };
    const clear = ROAD_W / 2 + RUNOFF + 10;
    // grandstands: one by the start, the rest on the outside of the tightest corners
    this.stands = [];
    const cand = [Math.round(this.N * 0.05)], used = [];
    const byCurv = [...Array(this.N).keys()].sort((a, b) => Math.abs(this.curv[b]) - Math.abs(this.curv[a]));
    for (const i of byCurv) { if (cand.length >= 5) break; if (cand.every(j => Math.min(Math.abs(i - j), this.N - Math.abs(i - j)) > this.N / 7)) cand.push(i); }
    for (const i of cand) {
      const side = i === cand[0] ? -1 : (this.curv[i] > 0 ? -1 : 1), len = 84, dep = 22, off = ROAD_W / 2 + RUNOFF + 8;
      const ok = [-len / 2, 0, len / 2].every(a => [0, dep].every(b => { const q = this.posAt(i * this.ds + a, side * (off + b)); return minD(q.x, q.y) > off - 4 && q.x > 4 && q.y > 4 && q.x < W - 4 && q.y < H - 4; }));
      if (!ok) continue;
      const q = this.posAt(i * this.ds, side * off);
      this.stands.push({x: q.x, y: q.y, ang: this.ang[i], len, dep, side, seed: i});
    }
    for (const st of this.stands) {
      g.save(); g.translate(st.x, st.y); g.rotate(st.ang); g.scale(1, st.side);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-st.len / 2 + 3, 3, st.len, st.dep);
      for (let r = 0; r < st.dep; r += 4) { g.fillStyle = (r / 4) % 2 ? '#7c7c8c' : '#9a9aab'; g.fillRect(-st.len / 2, r, st.len, 4); }
      g.fillStyle = '#d8303a'; g.fillRect(-st.len / 2, st.dep - 3, st.len, 3); g.fillStyle = '#ddd'; g.fillRect(-st.len / 2, 0, st.len, 1);
      for (let x = -st.len / 2; x <= st.len / 2; x += 21) { g.fillStyle = '#444'; g.fillRect(x, 0, 1, st.dep); }
      g.restore();
    }
    const nearStand = (x, y, r) => this.stands.some(st => Math.hypot(x - st.x, y - st.y) < st.len / 2 + st.dep + r);
    const items = [];
    const count = {forest: 900, city: 260, harbor: 320, mountain: 760, sakura: 1100, desert: 300}[th] || 120;
    for (let n = 0; n < count; n++) {
      const x = R() * W, y = R() * H, md = minD(x, y);
      if (th === 'harbor' && (y < 100 || x < 80)) continue;
      const kind = th === 'mountain' ? (R() < 0.72 ? 'pine' : 'rock') : th === 'sakura' ? (R() < 0.7 ? 'sakura' : R() < 0.45 ? 'lantern' : 'tree') : th === 'desert' ? (R() < 0.5 ? 'cactus' : 'mesa') :
        th === 'city' ? (R() < 0.75 ? 'bld' : 'tree') : th === 'harbor' ? (R() < 0.45 ? 'box' : 'tree') : th === 'lot' ? (R() < 0.5 ? 'cone' : 'tree') : 'tree';
      const sz = kind === 'bld' ? 22 + R() * 30 : kind === 'box' ? 12 : kind === 'cone' ? 2 : kind === 'lantern' ? 3 : kind === 'mesa' ? 8 + R() * 16 : kind === 'cactus' ? 5 : kind === 'sakura' ? 8 + R() * 6 : 6 + R() * 5;
      if (md < clear + sz + 2 || nearStand(x, y, sz)) continue;
      items.push({x, y, kind, sz, r: R()});
    }
    items.sort((a, b) => a.y - b.y);
    for (const it of items) {
      const x = it.x | 0, y = it.y | 0, s = it.sz | 0;
      if (it.kind === 'tree') {
        g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.arc(x + 3, y + 3, s, 0, TAU); g.fill();
        g.fillStyle = th === 'forest' ? '#1e5a2a' : '#2a6e35'; g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill();
        g.fillStyle = th === 'forest' ? '#2f7a3a' : '#3d8c45'; g.beginPath(); g.arc(x - s * 0.3, y - s * 0.3, s * 0.6, 0, TAU); g.fill();
        g.fillStyle = '#56a85a'; g.fillRect(x - s * 0.5 | 0, y - s * 0.5 | 0, 2, 2);
      } else if (it.kind === 'bld') {
        const w = s, h = (s * (0.7 + it.r * 0.6)) | 0, cols = ['#3a3550', '#2c2a40', '#45405e', '#2a3448'];
        g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(x + 5, y + 5, w, h);
        g.fillStyle = cols[(it.r * 4) | 0]; g.fillRect(x, y, w, h);
        g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x, y, w, 2);
        g.fillStyle = it.r < 0.5 ? '#ff3d7f' : '#3df2ff'; for (let k = 4; k < w - 4; k += 6) for (let m = 5; m < h - 4; m += 7) if (R() < 0.35) g.fillRect(x + k, y + m, 2, 2);
        g.fillStyle = '#1a1828'; g.fillRect(x + 3, y + 3, 6, 4);
      } else if (it.kind === 'box') {
        const cols = ['#c0392b', '#2980b9', '#27ae60', '#e67e22', '#8e44ad'], c = cols[(it.r * 5) | 0], w = 24, h = 10, rot = it.r < 0.5;
        const ww = rot ? h : w, hh = rot ? w : h;
        g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x + 3, y + 3, ww, hh); g.fillStyle = c; g.fillRect(x, y, ww, hh);
        g.fillStyle = 'rgba(0,0,0,.25)'; for (let k = 2; k < (rot ? hh : ww); k += 3) rot ? g.fillRect(x, y + k, ww, 1) : g.fillRect(x + k, y, 1, hh);
      } else if (it.kind === 'pine') {
        g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.arc(x + 3, y + 3, s, 0, TAU); g.fill();
        for (const [f, col] of [[1, '#1d4a2e'], [0.68, '#2a6038'], [0.36, '#3a7a48']]) { g.fillStyle = col; g.beginPath(); g.arc(x - (1 - f) * 1.5, y - (1 - f) * 1.5, s * f, 0, TAU); g.fill(); }
        if (it.r < 0.4) { g.fillStyle = '#e8eef5'; g.fillRect(x - 2, y - 3, 2, 1); g.fillRect(x + 2, y, 1, 1); g.fillRect(x - 1, y + 2, 2, 1); }
      } else if (it.kind === 'rock' || it.kind === 'mesa') {
        const c1 = it.kind === 'mesa' ? ['#7a4126', '#9c5b34', '#c47a48'] : ['#55555f', '#6e6e7a', '#8e8e9a'];
        g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.arc(x + 3, y + 3, s, 0, TAU); g.fill();
        g.fillStyle = c1[0]; g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill();
        g.fillStyle = c1[1]; g.beginPath(); g.arc(x - s * 0.2, y - s * 0.2, s * 0.75, 0, TAU); g.fill();
        g.fillStyle = c1[2]; g.fillRect(x - s * 0.5 | 0, y - s * 0.5 | 0, Math.max(2, s * 0.4) | 0, 2);
      } else if (it.kind === 'cactus') {
        g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x - 1, y + 1, 9, 3);
        g.fillStyle = '#2f7a3a'; g.fillRect(x - 2, y - 2, 4, 4); g.fillRect(x - 5, y - 1, 3, 2); g.fillRect(x + 2, y - 1, 3, 2); g.fillRect(x - 5, y - 3, 2, 2); g.fillRect(x + 3, y + 1, 2, 2);
        g.fillStyle = '#4fa35a'; g.fillRect(x - 1, y - 1, 2, 2);
      } else if (it.kind === 'sakura') {
        g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.arc(x + 3, y + 3, s, 0, TAU); g.fill();
        g.fillStyle = '#c96a95'; g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill();
        g.fillStyle = '#e88fb5'; g.beginPath(); g.arc(x - s * 0.15, y - s * 0.15, s * 0.82, 0, TAU); g.fill();
        g.fillStyle = '#f7b2cf'; g.beginPath(); g.arc(x - s * 0.3, y - s * 0.3, s * 0.5, 0, TAU); g.fill();
        g.fillStyle = '#ffe1ee'; for (let k = 0; k < 5; k++) g.fillRect(x + (R() - 0.6) * s | 0, y + (R() - 0.6) * s | 0, 1, 1);
      } else if (it.kind === 'lantern') {
        g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x - 1, y - 1, 7, 7); g.fillStyle = '#8a8a96'; g.fillRect(x - 2, y - 2, 6, 6); g.fillStyle = '#ffd23d'; g.fillRect(x, y, 2, 2);
      } else if (it.kind === 'cone') { g.fillStyle = '#ff7b2d'; g.fillRect(x, y, 3, 3); g.fillStyle = '#fff'; g.fillRect(x + 1, y + 1, 1, 1); }
    }
    this.canvas = cv;
    // minimap
    const ms = 110 / Math.max(W, H), mc = mkCanvas(W * ms + 6, H * ms + 6), m = mc.getContext('2d');
    m.lineJoin = 'round'; m.beginPath(); for (let i = 0; i < this.N; i += 2) { const X = this.x[i] * ms + 3, Y = this.y[i] * ms + 3; i ? m.lineTo(X, Y) : m.moveTo(X, Y); } m.closePath();
    m.strokeStyle = 'rgba(0,0,0,.7)'; m.lineWidth = 5; m.stroke(); m.strokeStyle = '#f4f1ff'; m.lineWidth = 2; m.stroke();
    this.mini = mc; this.miniScale = ms;
  }
}

// drift / grip / speed ratings (0-100) so players can see which way a build leans
function buildFocus(sp) {
  const pw = sp.power / sp.mass, mu = (sp.muF + sp.muR) / 2, deg = sp.steerMax * 180 / Math.PI;
  const drift = 22 * clamp(pw / 450, 0, 1) + 22 * clamp((deg - 30) / 42, 0, 1) + 20 * sp.lock + 18 * clamp((sp.muF / sp.muR - 0.95) / 0.3, 0, 1)
    + 10 * clamp((sp.hbForce - 0.5) / 0.25, 0, 1) + 8 * clamp(1 - (sp.dfF + sp.dfR) / 2.2, 0, 1);
  const grip = 38 * clamp((mu - 0.9) / 0.55, 0, 1) + 22 * clamp((sp.dfF + sp.dfR) / 2.2, 0, 1) + 14 * clamp((sp.BF / 13 - 0.9) / 0.4, 0, 1)
    + 12 * clamp((sp.brake / (sp.mass * G * 1.05) - 1) / 0.7, 0, 1) + 14 * clamp(1 - sp.lock * 0.8, 0, 1) - 8 * clamp((sp.muF / sp.muR - 1) / 0.25, 0, 1);
  const speed = 50 * clamp((topSpeed(sp) - 45) / 60, 0, 1) + 40 * clamp(pw / 700, 0, 1) + 10 * clamp((0.3 - sp.shift) / 0.26, 0, 1);
  return {drift: Math.round(clamp(drift, 0, 100)), grip: Math.round(clamp(grip, 0, 100)), speed: Math.round(clamp(speed, 0, 100))};
}
function focusLabel(f) { const v = FOCUS.map(x => f[x[0]]); if (Math.max(...v) - Math.min(...v) < 12) return 'Balanced build'; const best = FOCUS.slice().sort((a, b) => f[b[0]] - f[a[0]])[0]; return best[1] + ' build'; }

// ===== used car lot =====  pre-built cars with random parts, kits and liveries. New stock after every event.
function partsValue(cs) { let v = 0; for (const k of PART_ORDER) for (const i of cs.owned[k]) v += partPrice(cs.id, k, i); return v; }
function usedStock() {
  const seed = SAVE.usedSeed || 1, R = rng(seed * 7919 + 13), out = [], seen = new Set();
  for (let q = 0; q < 10 && out.length < 7; q++) {
    const pool = CARS.filter(c => c.price > 0 && (c.tier < 4 || R() < 0.35)), c = pool[(R() * pool.length) | 0];
    const cs = newCarState(c.id), key = seed + ':' + q, quality = R(); // quality: how built-up the car is
    for (const k of PART_ORDER) { const n = PARTS[k].levels.length; if (R() < 0.15 + quality * 0.45) { const l = 1 + ((R() * (n - 1)) | 0); cs.parts[k] = l; cs.owned[k] = [0, l]; } }
    cs.tune.gears = defaultGears(c, cs.parts);
    cs.paint = PAINTS[(R() * PAINTS.length) | 0]; cs.kit = (R() * 4) | 0; cs.kits = [0, cs.kit].filter((v, i, a) => a.indexOf(v) === i);
    cs.livery = R() < 0.85 ? 1 + ((R() * (LIVERIES.length - 1)) | 0) : 0; cs.liveries = [0, cs.livery].filter((v, i, a) => a.indexOf(v) === i);
    for (const k of PART_ORDER) cs.cond[k] = Math.round(35 + R() * 60); cs.body = Math.round(40 + R() * 60);
    cs.spoiler = (R() * 3) | 0; cs.glow = R() < 0.25 ? 1 + ((R() * 5) | 0) : 0;
    const miles = Math.round(20 + R() * 180) * 1000, wear = 0.42 + 0.18 * R() + Math.min(0.12, 30000 / miles * 0.05);
    const price = Math.max(800, Math.round(Math.min(c.price * 0.85, c.price * wear + partsValue(cs) * 0.06) / 50) * 50); // always under new price
    if (seen.has(c.id)) continue; seen.add(c.id);
    out.push({key, cs, price, miles, newPrice: c.price, buildValue: partsValue(cs)});
  }
  return out.filter(l => !SAVE.cars[l.cs.id] && !(SAVE.usedSold || []).includes(l.key));
}

// ===== drift assists (Settings) =====
const ASSIST_PRESETS = {
  easy: {cs: 'max', hold: 'strong', spin: true, kick: true, speedHold: true, softWalls: true, combo: true, steerSpd: 'normal', easyHandling: true},
  normal: {cs: 'normal', hold: 'normal', spin: true, kick: false, speedHold: false, softWalls: false, combo: false, steerSpd: 'normal', easyHandling: false},
  pro: {cs: 'off', hold: 'off', spin: false, kick: false, speedHold: false, softWalls: false, combo: false, steerSpd: 'normal', easyHandling: false},
};
function driftAssists() {
  const st = SAVE.settings;
  return {cs: {off: 0, low: 0.5, normal: 1, max: 1.4}[st.cs] ?? 1, hold: {off: 0, normal: 1, strong: 1.8}[st.hold] ?? 1, spin: st.spin ? 1 : 0,
    kick: st.kick ? 1 : 0, speed: st.speedHold ? 1 : 0, wall: st.softWalls ? 1 : 0, arc: st.easyHandling ? 1 : 0, steer: {slow: 0.7, normal: 1, fast: 1.45}[st.steerSpd] ?? 1};
}

// ===== damage & wear =====  every part has a condition (0-100%). Worn parts work worse (see buildSpec);
// an upgraded part that hits 0% breaks and is gone, and the car falls back to a tired stock part.
// Rates are % lost per second of use (rev/nos/slide/brake/hb/launch), per upshift (shift), or per m/s of impact (hit).
const WEAR = { // tuned so parts last many events; a quarter of the original rates
  engine: {rev: 0.012, nos: 0.06}, internals: {rev: 0.01, nos: 0.15}, cams: {rev: 0.009}, turbo: {rev: 0.018, nos: 0.05}, intercooler: {rev: 0.006, hit: 0.08},
  intake: {rev: 0.005}, exhaust: {rev: 0.006, hit: 0.05}, ecu: {rev: 0.0025}, fuel: {rev: 0.0075}, nitrous: {nos: 0.55},
  gearbox: {shift: 0.03, slide: 0.005}, clutch: {shift: 0.045, launch: 0.15, slide: 0.0075}, flywheel: {shift: 0.015}, diff: {slide: 0.022},
  suspension: {hit: 0.22, slide: 0.0025}, swaybar: {hit: 0.12}, brace: {hit: 0.09}, brakes: {brake: 0.06}, handbrake: {hb: 0.11}, steering: {hit: 0.15, slide: 0.004},
  weight: {hit: 0.04}, wheels: {hit: 0.25}, tires: {slide: 0.08, launch: 0.12, drive: 0.001}, aero: {hit: 0.4},
};
const BODY_HIT = 0.45; // body % per m/s of wall impact over 2.5 m/s
function condOf(cs, k) { return cs.cond && cs.cond[k] != null ? cs.cond[k] : 100; }
// usage: {rev, nos, slide, brake, hb, launch, drive (seconds), shift (count), hit (impact m/s)}; returns names of anything that broke
function applyWear(cs, use) {
  cs.cond = cs.cond || {}; const broke = [];
  for (const k of PART_ORDER) {
    const w = WEAR[k]; if (!w) continue; let d = 0;
    for (const u in w) if (use[u]) d += w[u] * use[u];
    if (!d) continue;
    const c = Math.max(0, condOf(cs, k) - d); cs.cond[k] = c;
    if (c <= 0 && cs.parts[k] > 0) { // it broke: the part is gone
      const lvN = cs.parts[k]; broke.push(PARTS[k].levels[lvN].n);
      cs.owned[k] = cs.owned[k].filter(i => i !== lvN); cs.parts[k] = 0; cs.cond[k] = 45;
      if (k === 'gearbox') cs.tune.gears = defaultGears(CAR_BY_ID[cs.id], cs.parts);
    }
  }
  if (use.hit) {
    cs.body = Math.max(0, (cs.body ?? 100) - BODY_HIT * use.hit);
    if (cs.body <= 0 && cs.kit) { const kn = carKits(cs.id)[cs.kit].n; broke.push(kn); cs.kits = (cs.kits || [0]).filter(i => i !== cs.kit); cs.kit = 0; cs.body = 20; }
  }
  return broke;
}
// repair prices: a share of what the part cost new (stock parts priced like a cheap service)
function repairCost(cs, k) {
  const lvN = cs.parts[k], base = lvN ? partPrice(cs.id, k, lvN) : Math.max(100, partPrice(cs.id, k, 1) * 0.3);
  return Math.round(base * 0.12 * (100 - condOf(cs, k)) / 100 / 5) * 5; // fully worn costs about an eighth of the part's price
}
function bodyCost(cs) { return Math.round((600 + CAR_BY_ID[cs.id].price * 0.02) * (100 - (cs.body ?? 100)) / 100 / 5) * 5; }
function carHealth(cs) { let s = cs.body ?? 100, n = 1; for (const k of PART_ORDER) if (WEAR[k]) { s += condOf(cs, k); n++; } return Math.round(s / n); }
function worstParts(cs) { return PART_ORDER.filter(k => WEAR[k]).map(k => [k, condOf(cs, k)]).sort((a, b) => a[1] - b[1]); }
// dyno: torque/power at the wheels across the rev range, from the same engine model the physics uses
// engine torque vs rev fraction: falls away toward redline, softer right off idle, and turbos build boost through the mid-range
function torqueShape(r, turbo) { return (2.1 - 1.2 * r) * Math.min(1, 0.62 + 1.1 * r) * (turbo ? clamp(0.5 + (r - 0.25) * 1.6 / turbo, 0.5, 1) : 1); }
function dynoCurve(sp) {
  const wmax = sp.redline * TAU / 60, pts = [];
  for (let rpm = 2000; rpm <= sp.redline; rpm += 100) {
    const r = clamp(rpm / sp.redline, 0.25, 1), tq = sp.power * torqueShape(r, sp.turbo) / (0.91875 * wmax) * 0.85; // Nm at the wheels (15% drivetrain loss)
    pts.push({rpm, tq, hp: kw2hpC(tq * rpm * TAU / 60)});
  }
  return pts;
}
function kw2hpC(w) { return w / 1000 * 1.341; }

// mechanic areas: tap a part of the car on the lift to see and fix these
const MECH_ZONES = [
  {id: 'engine', n: 'Engine Bay', parts: ['engine', 'internals', 'cams', 'turbo', 'intercooler', 'intake', 'ecu', 'fuel', 'nitrous'], d: 'Wears from holding high revs, boost and nitrous. A tired engine smokes and loses power.'},
  {id: 'wheels', n: 'Wheels', parts: ['tires', 'wheels', 'brakes', 'suspension', 'swaybar', 'steering'], d: 'Tyres wear while drifting. Wall hits bend wheels, suspension and steering.'},
  {id: 'cabin', n: 'Drivetrain', parts: ['gearbox', 'clutch', 'flywheel', 'handbrake', 'brace', 'weight'], d: 'Shifting, launches and handbrake use wear these down.'},
  {id: 'rear', n: 'Rear End', parts: ['exhaust', 'diff', 'aero'], d: 'Long drifts work the diff hard. Wings and exhausts get smashed in crashes.'},
  {id: 'body', n: 'Body', parts: [], d: 'Panels get scratched, dented and crumpled in crashes. At 0% the body kit falls off.'},
];
function zoneCond(cs, z) { if (z.id === 'body') return cs.body ?? 100; return Math.min(...z.parts.map(k => condOf(cs, k))); }

// each event's weather, rerolled after every event you finish
function eventWeather(ev) {
  let h = 7; for (const ch of ev.id) h = (h * 131 + ch.charCodeAt(0) * 977) >>> 0;
  const R = rng(h * 131 + (SAVE.usedSeed || 1) * 7907), ks = Object.keys(WEATHER), tot = ks.reduce((a, k) => a + WEATHER[k].w, 0);
  for (let i = 0; i < 5; i++) R(); // shake off the seed so neighbouring events differ
  let x = R() * tot; for (const k of ks) { x -= WEATHER[k].w; if (x < 0) return k; } return 'clear';
}
