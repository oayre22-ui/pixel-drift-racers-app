// ===== music: original chiptune tracks, generated live with WebAudio (no files, royalty free) =====
// Each track is a key, chord loop, drum/bass/arp patterns and a seeded lead melody. Songs loop through a
// form of 8-bar sections (intro / A / B / break) so they don't feel like a 4-bar loop.
const CHORD_Q = {M: [0, 4, 7], m: [0, 3, 7], M7: [0, 4, 7, 11], m7: [0, 3, 7, 10], '7': [0, 4, 7, 10]};
const MUSIC_SCALES = {minor: [0, 2, 3, 5, 7, 8, 10], major: [0, 2, 4, 5, 7, 9, 11], dorian: [0, 2, 3, 5, 7, 9, 10]};
const MUSIC_TRACKS = {
  garage: {name: 'Garage Lights', bpm: 90, swing: 0.12, key: 57, scale: 'minor', seed: 11,
    prog: [[8, 'M7'], [7, 'm7'], [5, 'm7'], [3, 'M7']], form: ['intro', 'A', 'B', 'break', 'A', 'B'],
    drums: {k: 'x.......x.x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', vol: 0.6},
    bass: {wave: 'square', cut: 420, pat: 'x.......x.5.....', vol: 0.1},
    arp: {wave: 'triangle', pat: '0.1.2.3.2.1.0.2.', oct: 12, vol: 0.05},
    pad: 0.03,
    lead: {wave: 'triangle', vol: 0.13, oct: 12, echo: 1, rhythm: ['x...x...x.x.....', 'x..x..x.....x...', 'x.......x...x.x.', '..x.x...x.......']}},
  lobby: {name: 'Night Lot', bpm: 100, swing: 0.18, key: 62, scale: 'dorian', seed: 23,
    prog: [[0, 'm7'], [5, '7'], [2, 'm7'], [7, 'm7']], form: ['intro', 'A', 'B', 'A', 'break', 'B'],
    drums: {k: 'x..x....x.x.....', s: '....x.......x...', h: 'x.xxx.x.x.xxx.x.', o: '..............x.', vol: 0.6},
    bass: {wave: 'square', cut: 600, pat: 'x..o..x.x..5..o.', vol: 0.1},
    arp: {wave: 'square', pat: '..c.......c..c..', oct: 0, vol: 0.022, cut: 1400},
    pad: 0.022,
    lead: {wave: 'square', cut: 1800, vol: 0.07, oct: 12, echo: 1, rhythm: ['x.x...x..x......', '..x.x.x...x.x...', 'x...x..x..x.....', 'x.x.x.....x..x..']}},
  touge: {name: 'Midnight Touge', race: 1, bpm: 150, swing: 0, key: 64, scale: 'minor', seed: 37,
    prog: [[0, 'm'], [8, 'M'], [10, 'M'], [7, 'm']], form: ['intro', 'A', 'B', 'A', 'B', 'break'],
    drums: {k: 'x...x...x...x...', s: '....x.......x...', h: 'xx.xxx.xxx.xxx.x', o: '..x...x...x...x.', vol: 0.75},
    bass: {wave: 'sawtooth', cut: 900, pat: 'x.o.x.o.x.o.x.o.', vol: 0.1},
    arp: {wave: 'square', pat: '0123012301230123', oct: 12, vol: 0.028, cut: 2500},
    lead: {wave: 'sawtooth', dbl: 1, cut: 3200, vol: 0.06, oct: 12, echo: 1, rhythm: ['x.x.x.xx..x.x.x.', 'x..x..x.x.x.x...', 'x.xxx.x.x...x.x.', 'x...x.x.x.x.xx..']}},
  sprint: {name: 'Neon Sprint', race: 1, bpm: 164, swing: 0, key: 62, scale: 'major', seed: 41,
    prog: [[0, 'M'], [9, 'm'], [5, 'M'], [7, 'M']], form: ['intro', 'A', 'B', 'A', 'break', 'B'],
    drums: {k: 'x.....x...x.x...', s: '....x..x....x...', h: 'x.x.x.x.x.x.x.x.', vol: 0.75},
    bass: {wave: 'square', cut: 1100, pat: 'x.x.o.x.x.x.o.x.', vol: 0.09},
    arp: {wave: 'square', pat: '0121012101210121', oct: 12, vol: 0.026, cut: 3000},
    lead: {wave: 'square', cut: 4000, vol: 0.07, oct: 12, echo: 0, rhythm: ['x.x.x...x.x.x...', 'xxx.x.x.x...x...', 'x..x..x.x.x.x.x.', 'x.x.xx.x..x.....']}},
  harbor: {name: 'Harbor Heat', race: 1, bpm: 124, swing: 0.08, key: 55, scale: 'minor', seed: 53,
    prog: [[0, 'm7'], [8, 'M7'], [5, 'm7'], [7, '7']], form: ['intro', 'A', 'B', 'break', 'A', 'B'],
    drums: {k: 'x...x...x...x...', c: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', o: '..x...x...x...x.', vol: 0.75},
    bass: {wave: 'sawtooth', cut: 700, pat: 'x..x..x...x.o..x', vol: 0.11},
    arp: {wave: 'square', pat: '...c.....c..c...', oct: 0, vol: 0.022, cut: 1500},
    pad: 0.018,
    lead: {wave: 'square', cut: 2200, vol: 0.07, oct: 12, echo: 1, rhythm: ['x...x.x...x.x...', '..x..x..x...x...', 'x.x...x.x..x....', 'x..x.x....x.x.x.']}},
};
const RACE_TRACKS = Object.keys(MUSIC_TRACKS).filter(k => MUSIC_TRACKS[k].race);
const MUSIC_LEVELS = {off: 0, low: 0.35, normal: 0.65, high: 1};

// precompute an 8-bar lead line for a section: a 2-bar motif, repeated, sequenced up, then resolved to the tonic
function musicMelody(T, R, up) {
  const sc = MUSIC_SCALES[T.scale], semi = d => sc[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7);
  const tones = bar => { const [r, q] = T.prog[bar % T.prog.length]; return CHORD_Q[q].map(i => (r + i) % 12); };
  const snap = (d, bar) => { for (const o of [0, -1, 1, -2, 2]) if (tones(bar).includes(semi(d + o) % 12)) return d + o; return d; };
  const rh = T.lead.rhythm[(R() * 4) | 0] + T.lead.rhythm[(R() * 4) | 0], motif = [];
  let d = 4 + up;
  for (let i = 0; i < 32; i++) if (rh[i] === 'x') { d = clamp(d + [-2, -1, -1, 0, 1, 1, 2, 3, -3][(R() * 9) | 0], 0, 11); motif.push({st: i, d}); }
  if (!motif.length) motif.push({st: 0, d: 4});
  const out = new Array(128).fill(null);
  for (let ph = 0; ph < 4; ph++) {
    motif.forEach((n, j) => {
      const st = ph * 32 + n.st, bar = st >> 4, last = j === motif.length - 1;
      let dd = n.d + (ph === 1 ? 1 : 0);
      if (ph === 3 && last) dd = dd > 3 ? 7 : 0; else if (n.st % 8 === 0 || last) dd = snap(dd, bar);
      const nx = j + 1 < motif.length ? motif[j + 1].st : 32 + (ph === 3 ? 8 : motif[0].st);
      out[st] = {m: T.key + T.lead.oct - 12 + semi(dd), len: Math.min(8, nx - n.st)};
    });
  }
  return out;
}

const Music = {
  out: null, bus: null, cur: null, step: 0, next: 0, sess: null, raceId: null, preview: null, built: {},
  raceN: (Math.random() * 3) | 0,
  level() { try { return MUSIC_LEVELS[SAVE.settings.music] ?? MUSIC_LEVELS.normal; } catch (e) { return 0; } },
  setup() {
    if (this.out) return true;
    const ctx = Sfx.ctx; if (!ctx) return false;
    try {
      this.out = ctx.createGain(); this.out.gain.value = 0;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4;
      this.out.connect(comp); comp.connect(ctx.destination);
      // echo send for the lead
      const dly = ctx.createDelay(1), fb = ctx.createGain(), lp = ctx.createBiquadFilter(), wet = ctx.createGain();
      lp.type = 'lowpass'; lp.frequency.value = 2400; fb.gain.value = 0.3; wet.gain.value = 0.3;
      dly.connect(lp); lp.connect(fb); fb.connect(dly); lp.connect(wet); wet.connect(this.out);
      this.dly = dly;
    } catch (e) { this.out = null; }
    return !!this.out;
  },
  build(id) {
    if (this.built[id]) return this.built[id];
    const T = MUSIC_TRACKS[id], R = rng(T.seed);
    return (this.built[id] = {T, sd: 60 / T.bpm / 4, mel: {A: musicMelody(T, R, 0), B: musicMelody(T, R, 2)}});
  },
  // what should be playing right now
  pick() {
    const s = typeof Game !== 'undefined' && Game.session;
    if (s && !s.attract && UI.screen === 'game') {
      if (s !== this.sess) { this.sess = s; const p = SAVE.settings.raceMusic; this.raceId = MUSIC_TRACKS[p] ? p : RACE_TRACKS[this.raceN++ % RACE_TRACKS.length]; }
      return this.raceId;
    }
    this.sess = null;
    if (UI.screen === 'settings' && this.preview) return this.preview;
    this.preview = null;
    return UI.screen === 'online' ? 'lobby' : 'garage';
  },
  start(id, t) {
    const ctx = Sfx.ctx;
    if (this.bus) { const old = this.bus; try { old.gain.setTargetAtTime(0, t, 0.25); } catch (e) {} setTimeout(() => { try { old.disconnect(); } catch (e) {} }, 2500); }
    this.cur = id; this.step = 0; this.next = t + 0.05;
    const B = this.build(id);
    this.bus = ctx.createGain(); this.bus.gain.setValueAtTime(0.0001, t); this.bus.gain.linearRampToValueAtTime(1, t + 1); this.bus.connect(this.out);
    try { this.dly.delayTime.setValueAtTime(B.sd * 3, t); } catch (e) {}
  },
  tick() {
    if (!this.setup()) return;
    const ctx = Sfx.ctx; if (ctx.state !== 'running') return;
    const t = ctx.currentTime, hidden = typeof document !== 'undefined' && document.hidden;
    let lv = hidden ? 0 : this.level();
    const s = Game.session, racing = s && !s.attract && UI.screen === 'game';
    if (racing && (Game.paused || s.state === 'done')) lv *= 0.45;
    try { this.out.gain.setTargetAtTime(lv * (racing ? 0.5 : 0.75), t, 0.3); } catch (e) {} // sit under the engine while driving
    if (!lv) { if (this.level() === 0) this.cur = null; return; }
    const id = this.pick();
    if (id !== this.cur) this.start(id, t);
    const B = this.built[this.cur];
    if (this.next < t) this.next = t + 0.05; // tab was asleep
    while (this.next < t + 0.25) { this.play(B, this.step, this.next); this.next += B.sd * (this.step % 2 ? 1 - B.T.swing : 1 + B.T.swing); this.step++; }
  },
  play(B, step, t) {
    const T = B.T, sec = T.form[Math.floor(step / 128) % T.form.length], bar = (step >> 4) % 8, i = step % 16;
    const [root, q] = T.prog[bar % T.prog.length], ch = CHORD_Q[q], sd = B.sd, D = T.drums, dv = D.vol;
    const fill = bar === 7 && sec !== 'break' && i >= 12;
    // drums
    if (sec !== 'break') {
      if (D.k[i] === 'x' && !(fill && i > 12)) this.kick(t, dv);
      if (sec !== 'intro') {
        if (fill) this.snare(t, dv * (0.4 + (i - 12) * 0.15));
        else { if (D.s && D.s[i] === 'x') this.snare(t, dv); if (D.c && D.c[i] === 'x') this.clap(t, dv); }
        if (D.o && D.o[i] === 'x') this.hat(t, dv * 0.7, 0.16);
      }
    }
    if (D.h[i] === 'x' && (sec !== 'break' || i % 4 === 2)) this.hat(t, dv * (i % 4 === 0 ? 0.55 : 0.4), 0.035);
    // bass
    const bp = T.bass.pat[i];
    if (bp !== '.' && (sec !== 'break' || i === 0)) {
      let m = T.key - 24 + root; if (root > 6) m -= 12;
      m += bp === 'o' ? 12 : bp === '5' ? 7 : 0;
      this.tone(t, m, sd * (sec === 'break' ? 14 : 1.6), T.bass.wave, T.bass.vol, T.bass.cut, 0, 0);
    }
    // arp / chord stabs
    const ap = T.arp.pat[i];
    if (ap !== '.') {
      const base = T.key + T.arp.oct + root - (root > 6 ? 12 : 0), pan = i % 2 ? 0.35 : -0.35;
      if (ap === 'c') for (const n of ch) this.tone(t, base + n, sd * 1.2, T.arp.wave, T.arp.vol, T.arp.cut || 0, pan, 0);
      else { const k = +ap; this.tone(t, base + ch[k % ch.length] + 12 * Math.floor(k / ch.length), sd * 0.9, T.arp.wave, T.arp.vol, T.arp.cut || 0, pan, 0); }
    }
    // pad on each bar (menu tracks, and every break)
    if (i === 0 && (T.pad || sec === 'break')) {
      const pv = T.pad || 0.025, base = T.key + root - (root > 6 ? 12 : 0);
      for (const n of ch) this.pad(t, base + n, sd * 16, pv);
    }
    // lead
    if (sec === 'A' || sec === 'B') {
      const n = B.mel[sec][(step % 128)];
      if (n) { const L = T.lead; this.tone(t, n.m, sd * n.len * 0.9, L.wave, L.vol, L.cut || 0, 0, L.echo, L.dbl); }
    }
  },
  // ---- instruments ----
  hz: m => 440 * Math.pow(2, (m - 69) / 12),
  dest(g, pan) {
    const ctx = Sfx.ctx;
    if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(this.bus); } else g.connect(this.bus);
  },
  tone(t, m, dur, wave, vol, cut, pan, echo, dbl) {
    try {
      const ctx = Sfx.ctx, g = ctx.createGain(), f = this.hz(m), oscs = [ctx.createOscillator()];
      if (dbl) { oscs.push(ctx.createOscillator()); oscs[1].detune.value = 9; }
      let into = g;
      if (cut) { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(cut * 2.2, t); lp.frequency.exponentialRampToValueAtTime(cut, t + 0.09); lp.connect(g); into = lp; }
      for (const o of oscs) { o.type = wave; o.frequency.value = f; o.connect(into); o.start(t); o.stop(t + dur + 0.25); }
      const v = dbl ? vol * 0.7 : vol;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.setTargetAtTime(v * 0.6, t + 0.01, Math.max(0.03, dur * 0.4)); g.gain.setTargetAtTime(0.0001, t + dur, 0.04);
      this.dest(g, pan);
      if (echo) g.connect(this.dly);
    } catch (e) {}
  },
  pad(t, m, dur, vol) {
    try {
      const ctx = Sfx.ctx, g = ctx.createGain(), lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 1100; lp.connect(g);
      for (const dt of [-7, 7]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = this.hz(m); o.detune.value = dt; o.connect(lp); o.start(t); o.stop(t + dur + 0.6); }
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.25); g.gain.setTargetAtTime(0.0001, t + dur * 0.9, 0.15);
      this.dest(g, 0);
    } catch (e) {}
  },
  noise(t, type, freq, q, vol, dec, pan) {
    try {
      const ctx = Sfx.ctx, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = Sfx.noiseBuf; f.type = type; f.frequency.value = freq; f.Q.value = q;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dec);
      s.connect(f); f.connect(g); this.dest(g, pan); s.start(t, Math.random() * 0.5); s.stop(t + dec + 0.05);
    } catch (e) {}
  },
  kick(t, v) {
    try {
      const ctx = Sfx.ctx, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.12);
      g.gain.setValueAtTime(0.55 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.connect(g); this.dest(g, 0); o.start(t); o.stop(t + 0.32);
    } catch (e) {}
  },
  snare(t, v) {
    this.noise(t, 'bandpass', 1900, 0.7, 0.2 * v, 0.16, 0);
    try { const ctx = Sfx.ctx, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(150, t + 0.08); g.gain.setValueAtTime(0.12 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.1); o.connect(g); this.dest(g, 0); o.start(t); o.stop(t + 0.12); } catch (e) {}
  },
  clap(t, v) { for (let k = 0; k < 3; k++) this.noise(t + k * 0.011, 'bandpass', 1300, 1.2, 0.16 * v, k === 2 ? 0.14 : 0.02, 0); },
  hat(t, v, dec) { this.noise(t, 'highpass', 7500, 0.5, 0.09 * v, dec, 0.2); },
};
setInterval(() => { try { Music.tick(); } catch (e) {} }, 40);
