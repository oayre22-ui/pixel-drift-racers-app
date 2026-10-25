// ===== Cash Packs (real-money in-app purchases) =====
// Only shows in the app build. The web site never sees it unless window.STORE_BUILD is set.
// In the iPhone/Android app it uses cordova-plugin-purchase (window.CdvPurchase), which talks to Apple / Google.
// Without the plugin (store build opened in a browser) it runs in TEST MODE: buying just asks to confirm and gives the cash.
// Product ids must match the ones made in App Store Connect / Google Play Console.
const CASH_PACKS = [
  {id: 'pdr.cash.small', n: 'Pocket Change', cash: 25000, usd: '$0.99'},
  {id: 'pdr.cash.medium', n: 'Wad of Cash', cash: 90000, usd: '$2.99', tag: '+20%'},
  {id: 'pdr.cash.large', n: 'Briefcase', cash: 175000, usd: '$4.99', tag: '+40%'},
  {id: 'pdr.cash.huge', n: 'Armored Truck', cash: 400000, usd: '$9.99', tag: 'Popular'},
  {id: 'pdr.cash.mega', n: 'Bank Vault', cash: 1000000, usd: '$19.99', tag: 'Best value'},
];
const IS_NATIVE = (() => { try { return !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform()); } catch (e) { return false; } })();
const STORE_BUILD = !!window.STORE_BUILD || IS_NATIVE;

const IAP = {
  enabled: STORE_BUILD, test: true, ready: false, busy: null,
  init() {
    if (!this.enabled) return;
    const C = window.CdvPurchase;
    if (!C || !C.store) {
      if (!IS_NATIVE) { this.ready = true; return; } // test mode
      // in the app the plugin loads a moment after the game, so wait for it (no test mode in the real app)
      this.test = false;
      if (!this.waiting) { this.waiting = true; document.addEventListener('deviceready', () => this.init(), false); }
      return;
    }
    this.test = false;
    const {store, ProductType, Platform} = C, plat = /android/i.test(navigator.userAgent) ? Platform.GOOGLE_PLAY : Platform.APPLE_APPSTORE;
    store.register(CASH_PACKS.map(p => ({id: p.id, type: ProductType.CONSUMABLE, platform: plat})));
    // approved fires for new purchases and for any paid-but-not-delivered ones from last time, so cash is never lost
    store.when().approved(t => { for (const p of t.products || []) this.grant(p.id, t.transactionId); t.finish(); })
      .productUpdated(() => { if (UI.screen === 'cashpacks') UI.cashpacks(); });
    store.error(e => { this.busy = null; if (e && e.code !== C.ErrorCode.PAYMENT_CANCELLED) UI.toast('Store error: ' + (e.message || 'try again')); if (UI.screen === 'cashpacks') UI.cashpacks(); });
    store.initialize([plat]).then(() => { this.ready = true; if (UI.screen === 'cashpacks') UI.cashpacks(); });
  },
  price(p) {
    if (this.test) return p.usd;
    const sp = window.CdvPurchase.store.get(p.id), o = sp && sp.pricing;
    return o ? o.price : '...';
  },
  buy(id) {
    const p = CASH_PACKS.find(x => x.id === id); if (!p || this.busy) return;
    if (this.test) { if (confirmSafe('TEST MODE: no real money.\nGive yourself ' + fmtMoney(p.cash) + '?')) this.grant(id, 'test-' + Date.now()); return; }
    const sp = window.CdvPurchase.store.get(id), offer = sp && sp.getOffer();
    if (!offer) { UI.toast('Store not ready yet'); return; }
    this.busy = id; UI.cashpacks();
    offer.order().then(r => { if (r && r.isError) this.busy = null; UI.cashpacks(); });
  },
  grant(id, tx) {
    const p = CASH_PACKS.find(x => x.id === id); if (!p) return;
    SAVE.iapTx = SAVE.iapTx || [];
    if (tx && SAVE.iapTx.includes(tx)) return; // already delivered
    if (tx) { SAVE.iapTx.push(tx); if (SAVE.iapTx.length > 200) SAVE.iapTx.shift(); }
    SAVE.cash += p.cash; persist(); Sfx.cash(); this.busy = null;
    UI.toast(p.n + ': +' + fmtMoney(p.cash));
    if (UI.screen === 'cashpacks') UI.cashpacks();
  },
};
