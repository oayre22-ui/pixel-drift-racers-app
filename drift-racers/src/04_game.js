// ===== input =====
const Keys = {};
const TouchState = {left: 0, right: 0, gas: 0, brake: 0, hand: 0, nos: 0};
let usingTouch = false;
addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT') { if (e.key === 'Enter') { const b = document.querySelector('[data-a="redeem"]'); if (b) b.click(); } return; }
  Keys[e.code] = true; Sfx.init();
  if (Game.session && !Game.session.attract && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  if ((e.code === 'Escape' || e.code === 'KeyP') && Game.session && !Game.session.attract) UI.togglePause();
  if (e.code === 'KeyR' && Game.session && Game.session.player && !Game.paused) Game.session.resetPlayer();
});
addEventListener('keyup', e => { Keys[e.code] = false; });
addEventListener('blur', () => { for (const k in Keys) Keys[k] = false; });
addEventListener('pointerdown', () => Sfx.init(), {passive: true});
addEventListener('touchstart', () => { if (!usingTouch) { usingTouch = true; UI.refreshTouch(); } }, {passive: true});

function readGamepad() {
  try {
    const pads = navigator.getGamepads ? navigator.getGamepads() : null; if (!pads) return null;
    for (const p of pads) if (p && p.connected) {
      const b = i => (p.buttons[i] ? (p.buttons[i].value || (p.buttons[i].pressed ? 1 : 0)) : 0);
      const ax = Math.abs(p.axes[0] || 0) > 0.12 ? p.axes[0] : 0;
      const inp = {steer: ax || (b(15) - b(14)), throttle: b(7), brake: b(6), hand: b(0) || b(1), nitro: b(2), start: b(9)};
      if (inp.start && !readGamepad.lastStart && Game.session && !Game.session.attract) UI.togglePause();
      readGamepad.lastStart = inp.start;
      return inp;
    }
  } catch (e) {}
  return null;
}
function readInput() {
  const k = c => Keys[c] ? 1 : 0;
  let steer = (k('ArrowRight') || k('KeyD')) - (k('ArrowLeft') || k('KeyA'));
  let throttle = k('ArrowUp') || k('KeyW'), brake = k('ArrowDown') || k('KeyS');
  let hand = k('Space'), nitro = k('ShiftLeft') || k('ShiftRight') || k('KeyN');
  steer += TouchState.right - TouchState.left; throttle = Math.max(throttle, TouchState.gas); brake = Math.max(brake, TouchState.brake);
  hand = Math.max(hand, TouchState.hand); nitro = Math.max(nitro, TouchState.nos);
  const gp = readGamepad();
  if (gp) { steer += gp.steer; throttle = Math.max(throttle, gp.throttle); brake = Math.max(brake, gp.brake); hand = Math.max(hand, gp.hand); nitro = Math.max(nitro, gp.nitro); }
  return {steer: clamp(steer, -1, 1), throttle, brake, hand, nitro};
}

// ===== game session =====
const trackCache = {};
function getTrack(id) { if (!trackCache[id]) { const t = new Track(id); t.render(); trackCache[id] = t; } return trackCache[id]; }
function driftTargets(ev, track) { const m = ev.laps * track.len / PPM * ev.tf; return [Math.round(m * 2.2 / 100) * 100, Math.round(m * 4.5 / 100) * 100, Math.round(m * 7.5 / 100) * 100]; }
function randomAICar(R, i) {
  const pool = CARS.filter(c => c.tier <= 3), c = pool[(R() * pool.length) | 0], cs = newCarState(c.id);
  cs.paint = PAINTS[(R() * PAINTS.length) | 0]; cs.stripe = (R() * 4) | 0; cs.spoiler = (R() * 3) | 0; cs.stripeColor = R() < 0.5 ? '#f4f1ff' : '#1d1d27';
  if (R() < 0.6) { cs.livery = 1 + ((R() * (LIVERIES.length - 1)) | 0); cs.stripe = 0; }
  return cs;
}
const AI_NAMES = ['K. Tsuchi', 'R. Vega', 'M. Okafor', 'J. Lindqvist', 'S. Park', 'D. Moreau', 'T. Haas', 'L. Costa'];

class Session {
  constructor(cfg) {
    this.cfg = cfg; this.mode = cfg.mode; this.attract = cfg.mode === 'attract';
    this.track = getTrack(cfg.track); const T = this.track;
    this.wxId = WEATHER[cfg.weather] ? cfg.weather : 'clear'; this.wx = WEATHER[this.wxId]; this.wet = ['rain', 'storm'].includes(this.wxId);
    this.laps = cfg.laps || 0; this.time = 0; this.state = this.attract || this.mode === 'free' || this.mode === 'tutorial' || this.mode === 'online' ? 'run' : 'count';
    this.online = this.mode === 'online'; this.remoteCars = [];
    if (this.online) Net.send({t: 'look', look: Net.look()}); // others see the car you're driving now
    if (this.mode === 'tutorial') this.tut = new Tutorial(); this.count = 3.5;
    this.skid = mkCanvas(T.W, T.H); this.sk = this.skid.getContext('2d');
    this.parts = []; this.ais = []; this.popups = []; this.lapTimes = []; this.lapStart = 0; this.bestLap = Infinity;
    this.drift = {active: false, pts: 0, mult: 1, t: 0, lost: 0, dir: 0, total: 0, best: 0, angle: 0};
    this.acc = 0; this.camX = 0; this.camY = 0; this.shake = 0;
    const R = rng((Date.now() & 0xffff) + 7);
    const slot = q => ({s: -(40 + q * 36), lat: (q % 2 ? 1 : -1) * 12});
    const tandem = this.mode === 'tandem';
    const nAI = this.attract ? 4 : this.mode === 'race' ? cfg.ai : tandem ? 1 : 0;
    for (let q = 0; q < nAI; q++) {
      const cs = randomAICar(R, q), sl = slot(q), sk = this.attract ? 0.85 + R() * 0.1 : cfg.aiSkill * (1 - q * 0.025);
      const a = new AICar(T, cs, sk, this.attract ? 50 : cfg.aiTop * (1 - q * 0.02) * this.wx.ai, tandem ? -40 : sl.s, tandem ? 0 : sl.lat, 99 + q * 31 + (R() * 1000 | 0));
      if (tandem) { a.lead = true; a.pose(); }
      a.name = AI_NAMES[(q + (R() * 8 | 0)) % 8]; cs.kit = (R() * 4) | 0; a.sprite = makeCarSprite(cs); a.shadow = makeShadow(a.sprite); a.glow = 0;
      this.ais.push(a);
    }
    if (!this.attract) {
      const cs = SAVE.cars[SAVE.current], sp = buildSpec(cs);
      this.player = new CarSim(this.wxSpec(sp), cs); const sl = tandem ? {s: -150, lat: 0} : this.online ? {s: -(20 + Math.random() * 160), lat: (Math.random() - 0.5) * 16} : slot(this.mode === 'race' ? nAI : 0); // online: spread players out
      this.player.place(T, sl.s, sl.lat);
      // wear & damage (not in the tutorial or online)
      this.wearOn = this.mode !== 'tutorial' && !this.online; this.use = {}; this.wearT = 0; this.broken = []; this.lastGear = 1;
      this.cond0 = {body: cs.body ?? 100, cond: Object.assign({}, cs.cond)}; this.bodyStage = damageStage(cs.body ?? 100);
      this.driftBonus = 1 + 0.25 * buildFocus(sp).drift / 100; // drift-focused builds score a bit more
      this.player.sprite = makeCarSprite(cs); this.player.shadow = makeShadow(this.player.sprite);
      this.player.glow = cs.glow ? makeGlow(this.player.sprite, COSMETICS.glow.opts[cs.glow]) : 0;
      if (this.mode === 'drift' || tandem) this.targets = driftTargets(cfg.event, T);
      this.camX = this.player.x; this.camY = this.player.y;
    } else { this.camX = this.ais[0].x; this.camY = this.ais[0].y; }
    this.lastBeep = 4;
    this.crowd = !!cfg.event; this.tandemF = 1; this.tandemGap = 0; this.cheerCd = 0;
    const wn = {rain: 160, storm: 300, snow: 140}[this.wxId] || 0; // falling rain/snow in screen space
    this.drops = Array.from({length: wn}, () => ({x: Math.random(), y: Math.random(), v: 0.6 + Math.random() * 0.6, ph: Math.random() * 6}));
    this.flash = 0; this.boltT = 3 + Math.random() * 5;
    if (this.wxId !== 'clear' && !this.attract) this.pop(this.wx.n.toUpperCase() + (this.wx.grip < 1 ? '  LESS GRIP' : ''), this.wx.col);
    this.petals = T.theme === 'sakura' ? Array.from({length: 70}, () => ({x: Math.random(), y: Math.random(), v: 0.3 + Math.random() * 0.5, ph: Math.random() * 6})) : null;
  }
  // weather takes grip away from the tyres and brakes
  wxSpec(sp) { const g = this.wx.grip; if (g === 1) return sp; return Object.assign({}, sp, {muF: sp.muF * g, muR: sp.muR * g, brake: sp.brake * (0.4 + 0.6 * g)}); }
  get focus() { return this.player || this.ais[0]; }
  resetPlayer() {
    const p = this.player, T = this.track; if (!p || this.state === 'done') return;
    const n = T.nearest(p.x, p.y, p.idx, 20), pos = T.posAt(n.idx * T.ds, 0);
    p.x = pos.x; p.y = pos.y; p.th = pos.ang; p.vx = p.vy = p.w = 0; p.steer = 0; p.gear = 1; p.prevS = n.idx * T.ds;
    this.loseDrift('RESET');
  }
  nearCrowd(c, r) { return this.track.stands.some(st => Math.hypot(c.x - st.x, c.y - st.y) < r); }
  pop(text, color) { this.popups.push({text, color: color || '#ffd23d', t: 1.6}); if (this.popups.length > 3) this.popups.shift(); }
  loseDrift(why) {
    const d = this.drift; if (d.active && d.pts > 50) { this.pop(why + '  -' + Math.round(d.pts), '#ff4d4d'); Sfx.beep(140, 0.25, 'sawtooth', 0.1); }
    d.active = false; d.pts = 0; d.t = 0; d.mult = 1; d.lost = 0; d.dir = 0;
  }
  bankDrift() {
    const d = this.drift; if (!d.active) return;
    const v = Math.round(d.pts * d.mult);
    if (v > 800 && this.crowd && this.player && this.nearCrowd(this.player, 260)) { Sfx.cheer(Math.min(1, v / 3000)); this.cheerT = 2; }
    if (v > 0) { d.total += v; d.best = Math.max(d.best, v); this.pop('+' + v.toLocaleString() + (v > 3000 ? '  HUGE!' : v > 1200 ? '  NICE!' : ''), '#ffd23d'); Sfx.beep(880, 0.08, 'square', 0.07); }
    d.active = false; d.pts = 0; d.t = 0; d.mult = 1; d.lost = 0; d.dir = 0;
  }
  tandemCheck() { // closer behind the lead car = bigger bonus
    const p = this.player, a = this.ais[0]; if (!a) return;
    const gap = (a.totS - p.totS) / PPM, dist = Math.hypot(a.x - p.x, a.y - p.y) / PPM;
    this.tandemGap = gap;
    this.tandemF = gap < -2 ? 0.5 : dist < 6 ? 2.5 : dist < 12 ? 2 : dist < 20 ? 1.6 : dist < 32 ? 1.25 : 1;
  }
  // collect how hard the car is being used, and apply it to part condition once a second
  trackWear(p, inp, dt) {
    const u = this.use, add = (k, v) => { u[k] = (u[k] || 0) + v; }, spd = p.speed;
    if (p.wallHit > 2.5) add('hit', p.wallHit - 2.5);
    if (p.rpm > p.spec.redline * 0.8 && p.thr > 0.5) add('rev', dt);
    if (p.nosOn) add('nos', dt);
    if (Math.abs(p.beta) > 0.15 && spd > 5) add('slide', dt);
    if (inp.brake > 0.3 && spd > 2) add('brake', dt);
    if (inp.hand > 0.5 && spd > 2) add('hb', dt);
    if (p.gear === 1 && p.thr > 0.8 && spd < 8 && Math.abs(p.slipR) > 0.2) add('launch', dt);
    add('drive', spd * dt);
    if (p.gear > this.lastGear) add('shift', 1); this.lastGear = p.gear;
    this.wearT += dt; if (this.wearT < 1 && !(u.hit > 4)) return;
    this.wearT = 0; const cs = p.cs, before = Object.assign({}, cs.cond), parts0 = Object.assign({}, cs.parts), kit0 = cs.kit, broke = applyWear(cs, u); this.use = {};
    this.warned = this.warned || {};
    for (const k of PART_ORDER) { // warnings as parts get tired
      const b = before[k] ?? 100, c = condOf(cs, k);
      if (cs.parts[k] === parts0[k] && b >= 25 && c < 25 && !this.warned[k]) { this.warned[k] = 1; this.pop(PARTS[k].name.toUpperCase() + ' WORN ' + Math.round(c) + '%', '#ffd23d'); Sfx.beep(330, 0.15, 'square', 0.06); }
      if (cs.parts[k] !== parts0[k]) this.breakFx(p, k);
    }
    if (kit0 && !cs.kit) this.breakFx(p, 'kit');
    for (const n of broke) { this.pop(n.toUpperCase() + ' BROKE!', '#ff4d4d'); Sfx.thud(0.8); this.shake = 7; this.broken.push(n); this.alert = {text: n.toUpperCase() + ' BROKE!', t: 2.2}; }
    p.spec = this.wxSpec(buildSpec(cs)); // worn parts perform worse straight away
    const st = damageStage(cs.body ?? 100);
    if (st !== this.bodyStage || broke.length) { this.bodyStage = st; p.sprite = makeCarSprite(cs); p.shadow = makeShadow(p.sprite); }
    if (broke.length || Math.random() < 0.1) persist();
  }
  // a big visible moment when something breaks: smoke for engine parts, a blowout for tyres, bits flying off for the body
  breakFx(p, k) {
    const c = Math.cos(p.th), s = Math.sin(p.th), L = CAR_BY_ID[p.cs.id].len, burst = (ox, n, col, spd, life, size, spark) => {
      for (let i = 0; i < n; i++) this.parts.push({x: p.x + c * ox, y: p.y + s * ox, vx: (Math.random() - 0.5) * spd + p.vx * 0.3, vy: (Math.random() - 0.5) * spd + p.vy * 0.3,
        life: life * (0.6 + Math.random() * 0.6), max: life, size, col: typeof col === 'function' ? col() : col, nos: spark ? 1 : 0}); };
    const eng = ['engine', 'internals', 'cams', 'turbo', 'intercooler', 'intake', 'ecu', 'fuel', 'nitrous'].includes(k);
    if (eng) { burst(L * 0.3, 40, '35,35,40', 30, 2.2, 3); burst(L * 0.3, 20, () => Math.random() < 0.5 ? '255,140,40' : '255,220,90', 90, 0.4, 1.5, 1); Sfx.beep(70, 0.5, 'sawtooth', 0.15); }
    else if (k === 'tires' || k === 'wheels') { burst(-L * 0.3, 30, () => Math.random() < 0.6 ? '255,200,80' : '255,255,255', 110, 0.35, 1.5, 1); burst(-L * 0.3, 25, '200,200,210', 25, 1.4, 3); Sfx.beep(200, 0.25, 'square', 0.12); }
    else if (k === 'exhaust' || k === 'diff' || k === 'aero') { burst(-L * 0.45, 20, '60,60,66', 40, 1.5, 3); burst(-L * 0.45, 12, '255,160,60', 80, 0.3, 1.5, 1); }
    else if (k === 'kit') { burst(0, 26, () => Math.random() < 0.5 ? '40,40,48' : '140,140,150', 70, 0.9, 2, 1); }
    else burst(0, 16, '120,120,130', 50, 0.8, 2, 1);
  }
  scoreDrift(dt) {
    if (this.mode === 'tandem') this.tandemCheck();
    const p = this.player, d = this.drift, sp = p.speed, ang = Math.abs(p.beta) * 180 / Math.PI;
    const vf = p.vx * Math.cos(p.th) + p.vy * Math.sin(p.th);
    d.angle = ang;
    if (p.wallHit > (SAVE.settings.combo ? 9 : 5)) { if (d.active) this.loseDrift('WALL'); }
    if (p.surf === 2 && d.active && d.lost > (SAVE.settings.combo ? 1.6 : 0.5)) { this.loseDrift('OFF ROAD'); return; }
    const drifting = sp > 6 && ang > 7 && ang < 115 && vf > 2 && p.surf !== 2;
    if (drifting) {
      const dir = Math.sign(p.beta);
      if (d.active && d.dir && dir !== d.dir && d.t > 0.6) { d.pts += 250; this.pop('TRANSITION +250', '#3df2ff'); }
      d.active = true; d.dir = dir; d.lost = 0; d.t += dt;
      d.mult = Math.min(5, 1 + Math.floor(d.t / 2) * 0.5);
      d.pts += (Math.min(ang, 70) - 6) * sp * dt * 0.25 * (p.surf === 1 ? 1.2 : 1) * (this.mode === 'tandem' ? this.tandemF : 1) * (this.driftBonus || 1);
    } else if (d.active) { d.lost += dt; if (d.lost > (SAVE.settings.combo ? 2.2 : 1.2)) this.bankDrift(); }
  }
  step(dt) {
    const T = this.track;
    if (this.state === 'count') {
      this.count -= dt; const c = Math.ceil(this.count);
      if (c < this.lastBeep && c >= 0) { this.lastBeep = c; Sfx.beep(c === 0 ? 880 : 440, c === 0 ? 0.4 : 0.15, 'square', 0.12); }
      if (this.count <= 0) { this.state = 'run'; this.lapStart = 0; }
    }
    const running = this.state === 'run';
    if (running) this.time += dt;
    const p = this.player;
    if (p) {
      const raw = this.online && Game.netMenu ? {steer: 0, throttle: 0, brake: 0.6, hand: 0, nitro: 0} : readInput(), inp = running ? raw : {steer: raw.steer, throttle: 0, brake: 1, hand: 0, nitro: 0};
      if (this.state === 'done') { inp.throttle = 0; inp.brake = 0.3; inp.hand = 0; inp.steer = 0; }
      p.wallHit = 0;
      if (this.state === 'count') { p.thr = raw.throttle; p.rpm = lerp(p.rpm, 1000 + raw.throttle * p.spec.redline * 0.8, dt * 6); } // rev on the line
      else p.step(dt, inp, T, driftAssists());
      if (p.wallHit > 3) { this.shake = Math.min(6, p.wallHit * 0.5); Sfx.thud(p.wallHit / 25); }
      if (this.wearOn && this.state !== 'count') this.trackWear(p, inp, dt);
      if (running) this.scoreDrift(dt);
      if (this.tut) { this.dt = dt; this.input = inp; this.tut.update(this, dt); }
      // laps
      const lap = Math.floor(p.totS / T.len);
      if (running && lap >= 1 && lap > this.lapTimes.length) {
        const lt = this.time - this.lapStart; this.lapTimes.push(lt); this.lapStart = this.time; this.bestLap = Math.min(this.bestLap, lt);
        if (this.laps && lap >= this.laps) this.finish(); else { this.pop('LAP ' + (lap + 1) + (this.laps ? '/' + this.laps : '') + '  ' + fmtTime(lt), '#f4f1ff'); Sfx.beep(660, 0.1); }
      }
      this.fx(p, dt, inp);
    }
    if (this.online) { // other players: send ours, smooth theirs, bump into them
      Net.tick(this, dt); this.remoteCars = Net.remotes(dt);
      for (const r of this.remoteCars) { this.fx(r, dt, null);
        if (p) { const dx = p.x - r.x, dy = p.y - r.y, dd = Math.hypot(dx, dy), R = 14;
          if (dd < R && dd > 0.01) { const nx = dx / dd, ny = dy / dd, rvn = (p.vx - r.vx) * nx + (p.vy - r.vy) * ny; p.x += nx * (R - dd) * 0.5; p.y += ny * (R - dd) * 0.5;
            if (rvn < 0) { p.vx -= 0.6 * rvn * nx; p.vy -= 0.6 * rvn * ny; if (-rvn > 3) { Sfx.thud(-rvn / 30); this.shake = 2; } } } } }
    }
    const leadS = p ? p.totS : null;
    for (const a of this.ais) {
      if (this.state !== 'count') a.update(dt, this.attract ? null : leadS);
      if (!a.finished && this.laps && a.totS >= this.laps * T.len) { a.finished = true; a.finishT = this.time; }
      if (this.attract && a.totS > T.len * 50) a.totS -= T.len * 40;
      this.fx(a, dt, null);
      if (p) { // contact with the player
        const dx = p.x - a.x, dy = p.y - a.y, dd = Math.hypot(dx, dy), R = 14;
        if (dd < R && dd > 0.01) {
          const nx = dx / dd, ny = dy / dd; p.x += nx * (R - dd); p.y += ny * (R - dd);
          const avx = Math.cos(a.th) * a.v, avy = Math.sin(a.th) * a.v, rvn = (p.vx - avx) * nx + (p.vy - avy) * ny;
          if (rvn < 0) { p.vx -= 1.2 * rvn * nx; p.vy -= 1.2 * rvn * ny; a.bump = 0.6; if (-rvn > 2) { Sfx.thud(-rvn / 30); this.shake = 3; if (this.wearOn) this.use.hit = (this.use.hit || 0) + Math.max(0, -rvn - 3) * 0.5; if (this.drift.active) this.loseDrift('CONTACT'); } }
        }
      }
    }
    for (const q of this.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.97; q.vy *= 0.97; q.life -= dt; q.size = Math.min(q.size + dt * (q.nos ? 5 : 7), q.nos ? 5 : 8); }
    if (this.parts.length) this.parts = this.parts.filter(q => q.life > 0);
    if (this.alert) this.alert.t -= dt;
    for (const u of this.popups) u.t -= dt; this.popups = this.popups.filter(u => u.t > 0);
    this.shake *= 0.9;
  }
  fx(car, dt, inp) {
    if (car === this.player && this.wearOn) {
      const ec = condOf(car.cs, 'engine'), L = CAR_BY_ID[car.cs.id].len, cc = Math.cos(car.th), ss = Math.sin(car.th);
      if (ec < 35 && this.parts.length < 500 && Math.random() < dt * (ec < 15 ? 45 : 14) * (0.4 + car.thr)) {
        const heavy = ec < 15; this.parts.push({x: car.x + cc * L * 0.3, y: car.y + ss * L * 0.3, vx: (Math.random() - 0.5) * 10 - car.vx * 0.5, vy: (Math.random() - 0.5) * 10 - car.vy * 0.5,
          life: heavy ? 1.6 : 1.0, max: heavy ? 1.6 : 1.0, size: 2, col: heavy ? '30,30,34' : '120,120,128'});
      }
      if (car.cs.parts.turbo && condOf(car.cs, 'turbo') < 20 && car.thr < 0.2 && car.rpm > car.spec.redline * 0.5 && Math.random() < dt * 6) {
        for (let i = 0; i < 6; i++) this.parts.push({x: car.x - cc * L * 0.5, y: car.y - ss * L * 0.5, vx: -cc * 50 + (Math.random() - 0.5) * 30, vy: -ss * 50 + (Math.random() - 0.5) * 30, life: 0.2, max: 0.2, size: 1.5, col: '255,150,40', nos: 1});
        Sfx.beep(110, 0.06, 'square', 0.08);
      }
    }
    const slip = Math.abs(car.slipR), spd = car.speed, c = Math.cos(car.th), s = Math.sin(car.th);
    const spec = car.spec, half = CAR_BY_ID[car.cs.id].wid / 2 - 0.5, back = CAR_BY_ID[car.cs.id].len * 0.3;
    const sliding = (slip > 0.16 && spd > 3) || (car.hand && spd > 2) || (inp && inp.throttle > 0.5 && car.gear === 1 && spd < 9 && spd > 0.3);
    car.sliding = sliding;
    if (sliding) {
      const g = this.sk; g.fillStyle = car.surf === 2 ? 'rgba(90,70,40,.28)' : this.wxId === 'snow' ? 'rgba(40,40,52,.22)' : this.wet ? 'rgba(18,18,22,.12)' : 'rgba(18,18,22,.30)';
      for (const side of [-1, 1]) {
        const wx = car.x - c * back - s * half * side, wy = car.y - s * back + c * half * side;
        g.fillRect(Math.round(wx), Math.round(wy), 1, 1);
        if (this.parts.length < 500 && Math.random() < dt * (20 + spd * 2) * Math.min(1, slip * 2 + 0.3)) {
          const dust = car.surf === 2, spray = this.wet && !dust, snow = this.wxId === 'snow' && !dust;
          this.parts.push({x: wx, y: wy, vx: (Math.random() - 0.5) * (spray ? 30 : 14) - car.vx * (spray ? 0.3 : 0.6), vy: (Math.random() - 0.5) * (spray ? 30 : 14) - car.vy * (spray ? 0.3 : 0.6), life: (spray ? 0.3 : 0.6) + Math.random() * (spray ? 0.4 : 0.9), max: 1.5, size: 2, col: dust ? '170,140,90' : spray ? '170,190,215' : snow ? '245,248,255' : '225,225,235'});
        }
      }
    }
    if (car.nosOn && Math.random() < 0.8) this.parts.push({x: car.x - c * (back + 6), y: car.y - s * (back + 6), vx: -c * 60, vy: -s * 60, life: 0.15, max: 0.15, size: 1.5, col: Math.random() < 0.5 ? '61,242,255' : '255,210,61', nos: 1});
  }
  finish() {
    this.bankDrift(); this.state = 'done';
    const p = this.player, T = this.track, res = {mode: this.mode, event: this.cfg.event, time: this.time, laps: this.lapTimes.slice(), bestLap: this.bestLap};
    if (this.mode === 'race') {
      const ahead = this.ais.filter(a => a.finished && a.finishT <= this.time).length;
      res.pos = ahead + 1; res.field = this.ais.length + 1;
      res.reward = this.cfg.event.reward[res.pos - 1] || 0;
    } else if (this.mode === 'drift' || this.mode === 'tandem') {
      res.score = this.drift.total; res.targets = this.targets; res.medal = this.targets.filter(t => res.score >= t).length;
      res.reward = res.medal ? this.cfg.event.reward[res.medal - 1] : Math.round(res.score / 40);
      res.bestCombo = this.drift.best;
    }
    if (res.reward && this.wx.pay !== 1) { res.wxBonus = Math.round(res.reward * (this.wx.pay - 1)); res.reward += res.wxBonus; } res.weather = this.wxId;
    this.result = res;
    setTimeout(() => UI.showResults(res), 1600);
  }
  // weather on top of the world: tint, darkness with headlights, fog, rain, snow and lightning
  drawWeather(ctx, ox, oy, W, H, cars) {
    const id = this.wxId; if (id === 'clear') return;
    const dt = 1 / 60;
    if (id === 'sunset') { const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(255,120,40,.22)'); gr.addColorStop(1, 'rgba(120,40,120,.18)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); return; }
    if (id === 'rain' || id === 'storm') { ctx.fillStyle = id === 'storm' ? 'rgba(10,20,45,.38)' : 'rgba(20,35,70,.22)'; ctx.fillRect(0, 0, W, H); }
    if (id === 'snow') { ctx.fillStyle = 'rgba(225,235,255,.26)'; ctx.fillRect(0, 0, W, H); }
    if (id === 'night' || id === 'fog' || id === 'storm') { // a dark/fog layer with holes cut for headlights
      const L = this.lightLayer && this.lightLayer.width === W && this.lightLayer.height === H ? this.lightLayer : (this.lightLayer = mkCanvas(W, H)), g = L.getContext('2d');
      g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H);
      g.fillStyle = id === 'fog' ? 'rgba(200,205,215,.82)' : id === 'storm' ? 'rgba(4,6,16,.45)' : 'rgba(4,4,18,.78)'; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'destination-out';
      for (const c of cars) {
        const x = c.x - ox, y = c.y - oy, cs = Math.cos(c.th), sn = Math.sin(c.th);
        if (id === 'fog') { const r = c === this.player ? 70 : 26, gr = g.createRadialGradient(x, y, 4, x, y, r); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); continue; }
        const gr = g.createRadialGradient(x, y, 4, x, y, 90); gr.addColorStop(0, 'rgba(0,0,0,.95)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr;
        g.beginPath(); g.moveTo(x + cs * 4, y + sn * 4); const a = c.th, sp = 0.42; g.arc(x, y, 90, a - sp, a + sp); g.closePath(); g.fill();
        const gl = g.createRadialGradient(x, y, 0, x, y, 16); gl.addColorStop(0, 'rgba(0,0,0,.7)'); gl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gl; g.beginPath(); g.arc(x, y, 16, 0, TAU); g.fill();
      }
      ctx.drawImage(L, 0, 0);
      if (id !== 'fog') for (const c of cars) { const x = Math.round(c.x - ox), y = Math.round(c.y - oy), cs = Math.cos(c.th), sn = Math.sin(c.th), hl = CAR_BY_ID[c.cs.id].len / 2;
        ctx.fillStyle = 'rgba(255,60,60,.8)'; ctx.fillRect(Math.round(x - cs * hl) - 1, Math.round(y - sn * hl) - 1, 2, 2); }
    }
    if (this.drops.length) { // rain streaks blown sideways, or slowly drifting snow
      const snow = id === 'snow'; ctx.fillStyle = snow ? 'rgba(255,255,255,.85)' : 'rgba(170,200,255,.55)';
      for (const q of this.drops) {
        if (snow) { q.y += q.v * 0.003; q.x += Math.sin(this.time + q.ph) * 0.0012; } else { q.y += q.v * 0.03; q.x -= q.v * 0.008; }
        if (q.y > 1) { q.y -= 1; q.x = Math.random(); } if (q.x < 0) q.x += 1; if (q.x > 1) q.x -= 1;
        const x = Math.round(q.x * W), y = Math.round(q.y * H);
        if (snow) ctx.fillRect(x, y, q.v > 0.9 ? 2 : 1, q.v > 0.9 ? 2 : 1); else { ctx.fillRect(x, y, 1, 3); ctx.fillRect(x - 1, y + 3, 1, 2); }
      }
    }
    if (id === 'storm') { // lightning
      this.boltT -= dt; if (this.boltT <= 0 && !Game.paused) { this.flash = 1; this.boltT = 4 + Math.random() * 7; setTimeout(() => Sfx.thud(0.9), 300 + Math.random() * 600); }
      if (this.flash > 0) { ctx.fillStyle = `rgba(230,235,255,${(this.flash * 0.6).toFixed(2)})`; ctx.fillRect(0, 0, W, H); this.flash = Math.max(0, this.flash - dt * 2.5); }
    }
  }
  drawCrowd(ctx, ox, oy, W, H) {
    const p = this.player, t = this.time, shirts = ['#ff3d3d', '#3d8bff', '#ffd23d', '#5dff6a', '#f4f1ff', '#ff3d7f', '#ff7b2d', '#9b4dff', '#1d1d27'];
    if (this.cheerT > 0) this.cheerT -= 1 / 60;
    for (const st of this.track.stands) {
      if (st.x < ox - 80 || st.x > ox + W + 80 || st.y < oy - 80 || st.y > oy + H + 80) continue;
      const near = p && Math.hypot(p.x - st.x, p.y - st.y) < 240, hype = near && (this.drift.active || this.cheerT > 0);
      ctx.save(); ctx.translate(Math.round(st.x), Math.round(st.y)); ctx.rotate(st.ang); ctx.scale(1, st.side);
      const R = rng(st.seed + 1);
      for (let row = 0; row < 5; row++) for (let x = -st.len / 2 + 2; x < st.len / 2 - 2; x += 3) {
        if (R() < 0.12) continue;
        const ph = R() * 6, jump = hype ? (Math.sin(t * 14 + ph) > 0 ? 1 : 0) : (Math.sin(t * 2 + ph * 3) > 0.97 ? 1 : 0);
        const y = row * 4 + 2 - jump;
        ctx.fillStyle = shirts[(R() * shirts.length) | 0]; ctx.fillRect(x, y + 1, 2, 2);
        ctx.fillStyle = R() < 0.5 ? '#f1c27d' : '#8d5524'; ctx.fillRect(x, y, 2, 1);
        if (hype && R() < 0.3) { ctx.fillStyle = ctx.fillStyle; ctx.fillRect(x + (R() < 0.5 ? -1 : 2), y - 1, 1, 1); } // arms up
      }
      ctx.restore();
    }
  }
  update(frameDt) {
    this.acc = Math.min(this.acc + frameDt, 0.1); const h = 1 / 120;
    while (this.acc >= h) { this.step(h); this.acc -= h; }
  }

  // ---- render ----
  render(ctx, W, H) {
    const T = this.track, f = this.focus;
    const lookX = (f.vx !== undefined ? f.vx : Math.cos(f.th) * f.v) * PPM * 0.55, lookY = (f.vy !== undefined ? f.vy : Math.sin(f.th) * f.v) * PPM * 0.55;
    const tx = f.x + clamp(lookX, -W * 0.3, W * 0.3), ty = f.y + clamp(lookY, -H * 0.3, H * 0.3);
    this.camX = lerp(this.camX, tx, 0.08); this.camY = lerp(this.camY, ty, 0.08);
    const sx = (Math.random() - 0.5) * this.shake, sy = (Math.random() - 0.5) * this.shake;
    const ox = Math.round(this.camX - W / 2 + sx), oy = Math.round(this.camY - H / 2 + sy);
    ctx.fillStyle = '#151520'; ctx.fillRect(0, 0, W, H);
    // track + skid layers (manually clipped source rect)
    const x0 = Math.max(0, ox), y0 = Math.max(0, oy), x1 = Math.min(T.W, ox + W), y1 = Math.min(T.H, oy + H);
    if (x1 > x0 && y1 > y0) {
      ctx.drawImage(T.canvas, x0, y0, x1 - x0, y1 - y0, x0 - ox, y0 - oy, x1 - x0, y1 - y0);
      ctx.drawImage(this.skid, x0, y0, x1 - x0, y1 - y0, x0 - ox, y0 - oy, x1 - x0, y1 - y0);
    }
    ctx.save(); ctx.translate(-ox, -oy);
    if (this.crowd) this.drawCrowd(ctx, ox, oy, W, H);
    const cars = this.ais.concat(this.remoteCars || []); if (this.player) cars.push(this.player);
    for (const c of cars) { // shadows + underglow
      ctx.save(); ctx.translate(Math.round(c.x) + 2, Math.round(c.y) + 2); ctx.rotate(c.th); ctx.drawImage(c.shadow, -c.shadow.width / 2, -c.shadow.height / 2); ctx.restore();
      if (c.glow) { ctx.save(); ctx.translate(Math.round(c.x), Math.round(c.y)); ctx.rotate(c.th); ctx.globalAlpha = 0.75 + Math.sin(this.time * 6) * 0.15; ctx.drawImage(c.glow, -c.glow.width / 2, -c.glow.height / 2); ctx.restore(); }
    }
    for (const c of cars) { ctx.save(); ctx.translate(Math.round(c.x), Math.round(c.y)); ctx.rotate(c.th); ctx.drawImage(c.sprite, -c.sprite.width / 2, -c.sprite.height / 2);
      if (c.brakeLit) { ctx.fillStyle = '#ff5050'; } ctx.restore(); }
    for (const q of this.parts) { // chunky round-ish smoke puffs that grow and fade
      const a = clamp(q.life / q.max, 0, 1) * (q.nos ? 1 : 0.5), s = q.size | 0, x = Math.round(q.x - s / 2), y = Math.round(q.y - s / 2); ctx.fillStyle = `rgba(${q.col},${a.toFixed(2)})`;
      if (s < 4) ctx.fillRect(x, y, s, s); else { ctx.fillRect(x + 1, y, s - 2, s); ctx.fillRect(x, y + 1, s, s - 2); } }
    // AI name tags in races
    if (this.mode === 'tandem' && this.ais[0]) { const a = this.ais[0]; ctx.font = '6px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffd23d'; ctx.fillText('LEAD', Math.round(a.x), Math.round(a.y) - 11); }
    if (this.online) { ctx.font = '6px monospace'; ctx.textAlign = 'center'; for (const r of this.remoteCars) { const t = r.pl.name + (r.pl.combo ? '  +' + r.pl.combo.toLocaleString() : '');
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillText(t, Math.round(r.x) + 1, Math.round(r.y) - 10); ctx.fillStyle = r.pl.combo ? '#ffd23d' : '#3df2ff'; ctx.fillText(t, Math.round(r.x), Math.round(r.y) - 11); } }
    if (!this.attract && this.mode === 'race') { ctx.font = '6px monospace'; ctx.textAlign = 'center'; for (const a of this.ais) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillText(a.name, Math.round(a.x) + 1, Math.round(a.y) - 10); ctx.fillStyle = '#f4f1ff'; ctx.fillText(a.name, Math.round(a.x), Math.round(a.y) - 11); } }
    ctx.restore();
    this.drawWeather(ctx, ox, oy, W, H, cars);
    if (this.petals) { // cherry blossom petals drifting across the screen
      ctx.fillStyle = '#ffc4dc';
      for (const q of this.petals) { q.y += q.v * 0.004; q.x += Math.sin(this.time * 1.5 + q.ph) * 0.0015 + 0.0008; if (q.y > 1) { q.y = 0; q.x = Math.random(); } if (q.x > 1) q.x = 0;
        ctx.fillRect(Math.round(q.x * W), Math.round(q.y * H), q.v > 0.6 ? 2 : 1, 1); }
    }
    // minimap
    if (!this.attract) {
      const ms = Math.min(70, H * (Game.touchUI ? 0.26 : 0.32)) / Math.max(T.mini.width, T.mini.height), mw = T.mini.width * ms, mh = T.mini.height * ms, mx = 4, my = Game.touchUI ? Math.round(H * 0.3) : H - mh - 4;
      ctx.globalAlpha = 0.85; ctx.drawImage(T.mini, mx, my, mw, mh); ctx.globalAlpha = 1;
      const dot = (c, col) => { ctx.fillStyle = col; ctx.fillRect(Math.round(mx + (c.x * T.miniScale + 3) * ms) - 1, Math.round(my + (c.y * T.miniScale + 3) * ms) - 1, 3, 3); };
      for (const a of this.ais) dot(a, '#ff3d7f'); if (this.player) dot(this.player, '#3df2ff');
    }
  }
}

// ===== main loop & canvas sizing =====
const Game = {session: null, paused: false, last: 0, W: 0, H: 0};
const canvas = document.getElementById('game'), ctx = canvas.getContext('2d');
function resize() {
  const vw = window.innerWidth || 800, vh = window.innerHeight || 450;
  const scale = Math.max(1, Math.round(Math.min(vh / 220, vw / 300)));
  Game.W = Math.ceil(vw / scale); Game.H = Math.ceil(vh / scale);
  canvas.width = Game.W; canvas.height = Game.H; canvas.style.width = Game.W * scale + 'px'; canvas.style.height = Game.H * scale + 'px';
  ctx.imageSmoothingEnabled = false;
}
addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 200));
function frame(t) {
  const dt = Math.min(0.05, (t - (Game.last || t)) / 1000); Game.last = t;
  const s = Game.session;
  if (s) {
    if (!Game.paused && !Game.loading) s.update(dt);
    ctx.imageSmoothingEnabled = false; s.render(ctx, Game.W, Game.H);
    if (s.player && !Game.paused) { const p = s.player; Sfx.engine(clamp(p.rpm / p.spec.redline, 0, 1), p.thr, p.spec.loud); Sfx.squeal(p.sliding ? clamp(Math.abs(p.slipR) * 2, 0.2, 1) : 0); }
    else Sfx.silence();
    if (s.player) UI.hud(s);
  }
  requestAnimationFrame(frame);
}
