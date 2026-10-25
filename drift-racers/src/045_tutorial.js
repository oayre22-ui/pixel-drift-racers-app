// ===== first-launch tutorial (guided lesson on the Skidpad Lot) =====
const k2 = (key, touch) => usingTouch ? touch : key;
const TUTORIAL = [
  {title: 'Get moving', text: () => `Welcome to the Skidpad Lot! Hold ${k2('<kbd>W</kbd> or <kbd>&uarr;</kbd>', '<b>GAS</b>')} to accelerate. Get her up to 40 ${unitN().toLowerCase()}.`,
   check: (s, t) => spdU(s.player.speed) >= 40},
  {title: 'Steering', text: () => `Steer with ${k2('<kbd>A</kbd> <kbd>D</kbd> or <kbd>&larr;</kbd> <kbd>&rarr;</kbd>', 'the <b>&#9664; &#9654;</b> buttons')}. Follow the track around the bend. Smooth hands!`,
   check: (s, t) => { if (Math.abs(s.player.steer) > 0.15 && s.player.speed > 5) t.acc += s.dt; return t.acc > 2.5; }},
  {title: 'Braking', text: () => `Press ${k2('<kbd>S</kbd> or <kbd>&darr;</kbd>', '<b>BRAKE</b>')} to slow down. (Hold it when stopped to reverse.)`,
   check: (s, t) => { if (s.input.brake > 0.5 && s.player.speed > 1.5) t.acc += s.dt; return t.acc > 0.5; }},
  {title: 'Your first drift', text: () => `Get some speed, steer into a corner and tap ${k2('<kbd>Space</kbd>', '<b>E-BRAKE</b>')} to kick the back end out. Keep your foot in it!`,
   check: (s, t) => s.drift.active && s.drift.t > 1.2},
  {title: 'Hold the slide', text: () => `Steer the <b>opposite way</b> (countersteer) and balance the gas to keep sliding. Floor it and the slide holds. Bank <b>800</b> drift points.`,
   check: (s, t) => s.drift.total >= 800},
  {title: 'Combos', text: () => `Longer drifts raise your multiplier up to <b>x5</b>, and switching direction gives a transition bonus. Hitting a wall or going on the gravel loses the combo. Show me <b>2,500</b> points!`,
   check: (s, t) => s.drift.total >= 2500},
];
class Tutorial {
  constructor() { this.i = 0; this.state = {acc: 0}; this.doneT = 0; this.finished = false; this.flash = 0; }
  get step() { return TUTORIAL[this.i]; }
  update(s, dt) {
    if (this.finished) return;
    if (this.doneT > 0) { this.doneT -= dt; if (this.doneT <= 0) { this.i++; this.state = {acc: 0}; if (this.i >= TUTORIAL.length) this.complete(s); } return; }
    if (this.step.check(s, this.state)) { this.doneT = 1.2; this.flash = 1.2; Sfx.beep(990, 0.12, 'square', 0.1); s.pop('NICE!', '#5dff6a'); }
  }
  complete(s) {
    this.finished = true; s.state = 'done';
    const first = !SAVE.tutorialDone; SAVE.tutorialDone = true; if (first) SAVE.cash += 500; persist();
    setTimeout(() => UI.tutorialEnd(first), 900);
  }
}

// ===== Coach Taka: menu tour (Pixel Car Racer style guide at the side of the screen) =====
const GUIDE_NAME = 'COACH TAKA';
const GUIDE_TOUR = [
  {go: ['main'], text: "Hey rookie! I'm Coach Taka. Welcome to Pixel Drift Racers! Before you hit the track, let me show you around."},
  {go: ['main'], hi: '[data-to="events"]', text: 'Career Events is where you earn money. Drift events are free to enter. Races and tandems cost an entry fee, but they pay big.'},
  {go: ['events'], hi: '.tabs', text: 'Pick Drift, Tandem or Race up here. In Tandem you chase an AI lead car. The closer you stay, the more points you score.'},
  {go: ['events'], hi: '.grid .card', text: "Every event shows its reward, entry fee and a recommended PR. PR is your car's performance rating. Green means you're ready."},
  {go: ['free'], hi: '.grid .card', text: 'Free Drift: any track, no timer, no pressure. Great for practice and for testing your tune.'},
  {go: ['garage', 'cars'], hi: '#gscene', text: 'This is your Garage. Every car you own gets its own bay. Tap a car to drive it, and buy more cars to fill the empty bays.'},
  {go: ['garage', 'paint'], hi: '[data-a="gtab"][data-t="paint"]', text: 'Body: paint, liveries and body kits made for each car. Make it yours!'},
  {go: ['shop'], hi: '.shopwrap .main', text: "The Parts Shop! Tap any part to see what it does before you buy. The coloured dot shows if it's best for Drift, Grip or Speed."},
  {go: ['shop'], hi: '.shopwrap .side .card', text: 'Your build rating lives here. Mix parts for a Drift, Grip or Speed build. Drift builds even earn bonus drift points.'},
  {go: ['mechanic'], hi: '#lift', text: "The Mechanic! Your car goes up on the lift. Tap any part of it to check it. Parts wear out as you drive, so fix them here. If an upgrade hits 0% it breaks and you lose it! The Dyno shows your real power curve."},
  {go: ['mechanic', 'tune'], hi: '[data-a="mmode"][data-m="tune"]', text: 'Tuning is at the Mechanic too. Parts unlock sliders for boost, tyre pressure, camber, springs and more. Small changes make a big difference.'},
  {go: ['mechanic', 'gearbox'], hi: '[data-a="mmode"][data-m="gearbox"]', text: 'The Gearbox tuner. Buy a better gearbox and you can set the final drive and every gear ratio.'},
  {go: ['dealer'], hi: '.stalls', text: 'The Car Lot. Tap any car to see its stats and price.'},
  {go: ['used'], hi: '.lotsign', text: 'Short on cash? The Used lot sells built cars with liveries and random parts, way cheaper than new. Fresh stock after every event.'},
  {go: ['settings'], hi: '[data-a="tutorial"]', text: 'Settings has drift assists to make drifting way easier, plus sound and codes. You can replay this tour from here any time.'},
  {go: ['main'], hi: '[data-to="free"]', text: "Alright, enough talk. Let's head to Free Drift and I'll teach you how to drive!", last: true},
];
const Guide = {
  i: 0, on: false, typeT: 0,
  start() { this.on = true; this.i = 0; this.mount(); this.show(); },
  mount() {
    this.unmount();
    const blk = document.createElement('div'); blk.id = 'gblock'; document.body.appendChild(blk);
    const hi = document.createElement('div'); hi.id = 'ghi'; document.body.appendChild(hi);
    const d = document.createElement('div'); d.id = 'guide';
    d.innerHTML = `<img class="gchar" id="gimg" alt=""><div class="gbub"><div class="gname">${GUIDE_NAME}</div><div class="gtext" id="gtext"></div>
      <div class="row" id="gbtns"></div></div>`;
    document.body.appendChild(d);
    d.addEventListener('click', e => { const b = e.target.closest('[data-g]'); if (b) this.act(b.dataset.g); });
    if (!this._rs) { this._rs = () => this.place(); addEventListener('resize', this._rs); }
  },
  unmount() { for (const id of ['gblock', 'ghi', 'guide']) { const el = document.getElementById(id); if (el) el.remove(); } clearInterval(this.anim); },
  say(text, btns, frame) { // typewriter text while the coach bobs his head
    const t = document.getElementById('gtext'), img = document.getElementById('gimg'); if (!t) return;
    document.getElementById('gbtns').innerHTML = btns; clearInterval(this.anim);
    let n = 0; t.textContent = '';
    this.anim = setInterval(() => {
      n += 2; t.textContent = text.slice(0, n); img.src = Art.guide(n < text.length ? ((n >> 2) % 2) : frame);
      if (n >= text.length) { clearInterval(this.anim); t.textContent = text; }
      if (n % 6 === 0 && n < text.length) Sfx.beep(300 + (n % 5) * 40, 0.02, 'square', 0.02);
    }, 22);
  },
  show() {
    const st = GUIDE_TOUR[this.i];
    if (st.go && (UI.screen !== st.go[0] || st.go[1])) UI.go(st.go[0], st.go[1]);
    const btns = `${this.i ? '<button data-g="prev">&lt;</button>' : ''}<button class="hot" data-g="${st.last ? 'drive' : 'next'}">${st.last ? "Let's drive!" : 'Next &gt;'}</button>
      <button data-g="skip">Skip tour</button><span class="gstep">${this.i + 1}/${GUIDE_TOUR.length}</span>`;
    this.say(st.text, btns, st.hi ? 2 : 0);
    setTimeout(() => this.place(), 30);
  },
  place() { // move the highlight box over the target
    const hi = document.getElementById('ghi'); if (!hi || !this.on) return;
    const st = GUIDE_TOUR[this.i], el = st && st.hi ? document.querySelector('#ui ' + st.hi) : null;
    if (!el) { hi.style.display = 'none'; return; }
    try { el.scrollIntoView({block: 'nearest'}); } catch (e) {}
    const b = el.getBoundingClientRect(); hi.style.display = 'block';
    Object.assign(hi.style, {left: b.left - 6 + 'px', top: b.top - 6 + 'px', width: b.width + 12 + 'px', height: b.height + 12 + 'px'});
  },
  end() { this.on = false; this.unmount(); },
  act(a) {
    Sfx.beep(520, 0.04, 'square', 0.05);
    if (a === 'next') { this.i = Math.min(GUIDE_TOUR.length - 1, this.i + 1); this.show(); }
    if (a === 'prev') { this.i = Math.max(0, this.i - 1); this.show(); }
    if (a === 'skip') { this.end(); SAVE.tutorialDone = true; persist(); UI.go('main'); }
    if (a === 'drive') { this.end(); UI.startSession({mode: 'tutorial', track: 'lot'}); }
    if (a === 'close') { this.end(); }
    if (a === 'career') { this.end(); UI.go('events'); }
    if (a === 'menu') { this.end(); UI.go('main'); }
  },
  // after the driving lesson
  finale(first) {
    this.on = true; this.mount(); const blk = document.getElementById('gblock'); if (blk) blk.style.background = 'rgba(5,4,14,.55)';
    document.getElementById('ghi').style.display = 'none';
    this.say(`That's how it's done! ${first ? "Here's $500 to get your build started. " : ''}Hit the Parts Shop for a diff and some tyres, then go win some Career Events. Press R if you ever get stuck. See you on the track!`,
      `<button class="hot" data-g="career">Start Career</button><button data-g="menu">Main menu</button>`, 0);
  },
};
