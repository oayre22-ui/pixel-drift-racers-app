# Pixel Drift Racers: phone app

This folder turns the web game into an iPhone and Android app with Capacitor.
The game code itself still lives in `../drift-racers/src/`. This folder only wraps it.

## Build it (on a Mac)
1. Install Node.js (nodejs.org) and Xcode (Mac App Store).
2. Copy this whole `app-store` folder and the `drift-racers` folder next to each other on the Mac.
3. In Terminal, inside `app-store`: `npm install`, then `npm run ios`. Xcode opens.
4. In Xcode, click **App** > **Signing & Capabilities**: pick your team, and check the Bundle Identifier
   (`com.pixeldriftracers.game` right now; it must match the app you make in App Store Connect).
5. Click **+ Capability** and add **In-App Purchase**.
6. Product > Archive, then Distribute App > App Store Connect.

Every time the game changes: `npm run ios` again (it rebuilds `www/index.html` from the game source and copies it in).
Android: `npm run android` opens Android Studio instead.

## Cash Packs (in-app purchases)
Make these as **Consumable** in-app purchases in App Store Connect (and as in-app products in Google Play),
with exactly these Product IDs:

| Product ID | Name | Cash | Price |
|---|---|---|---|
| pdr.cash.small | Pocket Change | $25,000 | $0.99 |
| pdr.cash.medium | Wad of Cash | $90,000 | $2.99 |
| pdr.cash.large | Briefcase | $175,000 | $4.99 |
| pdr.cash.huge | Armored Truck | $400,000 | $9.99 |
| pdr.cash.mega | Bank Vault | $1,000,000 | $19.99 |

The list is `CASH_PACKS` in `../drift-racers/src/048_iap.js`. Opening `www/index.html` in a browser runs the shop in
TEST MODE (no money, just asks to confirm). The real app always uses Apple / Google.
To test real purchases before release, use a Sandbox tester (App Store Connect > Users and Access > Sandbox).

## What's different from the web site
- Cash Packs button on the main menu.
- Codes box removed, and no cheat codes in the app.
- Server list talks to https://pixel-drift-racers.netlify.app/api/rooms.
- Landscape only, no status bar.

## Privacy policy
`privacy.html` needs your contact email in place of `CONTACT_EMAIL`, then it has to be online
(for example https://pixel-drift-racers.netlify.app/privacy.html) so you can paste the link into App Store Connect.
