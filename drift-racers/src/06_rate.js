// ===== Rate the game (app only) =====
// Shows Apple's own "Enjoying Pixel Drift Racers?" stars pop-up (SKStoreReviewController, through the
// @capacitor-community/in-app-review plugin, name InAppReview). No custom dialog. On the web site nothing happens.
// When: on the results screen, after the 3rd finished event or later, only after a good one (top 3 in a race, or any
// medal in a drift event). After asking, wait 20 more events and 30 days before asking again.
// Apple itself shows it at most 3 times a year, and never in TestFlight.
(() => {
  const C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform()) return;
  const R = (C.Plugins && C.Plugins.InAppReview) || (C.registerPlugin && C.registerPlugin('InAppReview'));
  if (!R) return;
  const base = UI.showResults;
  UI.showResults = function (r) {
    const shown = this.screen === 'game';
    const out = base.apply(this, arguments);
    if (!shown || !r) return out;
    const s = SAVE.rate = SAVE.rate || {n: 0, asked: 0, at: 0};
    s.n++;
    const good = r.mode === 'race' ? r.pos <= 3 : r.medal >= 1;
    const waited = !s.asked || (s.n - s.at >= 20 && Date.now() - s.asked > 30 * 864e5);
    if (s.n >= 3 && good && waited) {
      s.asked = Date.now(); s.at = s.n;
      setTimeout(() => { try { R.requestReview().catch(() => {}); } catch (e) {} }, 1500);
    }
    persist();
    return out;
  };
})();
