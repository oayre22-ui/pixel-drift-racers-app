// ===== pixel car sprites (top-down, facing +x) =====
function damageStage(body) { return body > 75 ? 0 : body > 45 ? 1 : body > 20 ? 2 : 3; }
function makeCarSprite(cs) {
  const c = CAR_BY_ID[cs.id], L = c.len, Wd = c.wid, pad = 3, cv = mkCanvas(L + pad * 2, Wd + pad * 2), g = cv.getContext('2d');
  const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(pad + x, pad + y, w, h); };
  const paint = cs.paint, dark = shade(paint, 0.55), light = shade(paint, 1.35), glass = '#1c2238', glassHi = '#3a4a70';
  const st = c.style;
  // wheels
  const fa = Math.round(L * (st === 'super' ? 0.74 : 0.76)), ra = Math.round(L * 0.2);
  const kitF = cs.kit ? (carKits(cs.id)[cs.kit] || {f: []}).f : [], has = f => kitF.includes(f);
  const wideK = has('wide') || has('flare'), wo = wideK ? 1 : 0; // widebody pushes the wheels out a pixel
  for (const ax of [fa, ra]) { px(ax - 1, -1 - wo, 3, 2, '#0b0b0e'); px(ax - 1, Wd - 1 + wo, 3, 2, '#0b0b0e'); }
  if (has('skirt')) { px(ra + 2, -1, fa - ra - 3, 1, '#16161c'); px(ra + 2, Wd, fa - ra - 3, 1, '#16161c'); }
  // body with clipped corners + outline
  px(1, 0, L - 2, Wd, dark); px(0, 1, L, Wd - 2, dark);
  px(1, 1, L - 2, Wd - 2, paint);
  px(1, 1, L - 2, 1, light); // highlight along the top edge
  px(1, Wd - 2, L - 2, 1, shade(paint, 0.8));
  // hood
  const cab = {kei: [0.18, 0.78], coupe: [0.28, 0.66], fastback: [0.22, 0.64], muscle: [0.22, 0.58], gt: [0.26, 0.64], super: [0.3, 0.66],
    van: [0.06, 0.8], roadster: [0.3, 0.55], hatch: [0.12, 0.62], wagon: [0.1, 0.62], sedan: [0.22, 0.64], truck: [0.42, 0.66]}[st] || [0.28, 0.66];
  const c0 = Math.round(L * cab[0]), c1 = Math.round(L * cab[1]);
  if (cs.hood === 1) { for (let x = c1 + 1; x < L - 2; x++) for (let y = 2; y < Wd - 2; y++) px(x, y, 1, 1, (x + y) % 2 ? '#1a1a1f' : '#2a2a33'); }
  if (cs.hood === 2) { px(c1 + 2, 2, 2, 1, '#111'); px(c1 + 2, Wd - 3, 2, 1, '#111'); }
  // stripes (under glass)
  const sc = cs.stripeColor || '#1d1d27';
  if (cs.stripe === 1) px(1, (Wd >> 1) - 1, L - 2, 2, sc);
  if (cs.stripe === 2) { px(1, (Wd >> 1) - 2, L - 2, 1, sc); px(1, (Wd >> 1) + 1, L - 2, 1, sc); }
  if (cs.stripe === 3) { px(2, 1, L - 4, 1, sc); px(2, Wd - 2, L - 4, 1, sc); }
  // cabin: rear glass, roof, windscreen
  const rw = Math.max(1, Math.round((c1 - c0) * 0.22)), ws = Math.max(2, Math.round((c1 - c0) * 0.3));
  px(c0, 1, c1 - c0, Wd - 2, shade(paint, 0.7));
  px(c0, 2, rw, Wd - 4, glass);
  px(c0 + rw, 2, c1 - c0 - rw - ws, Wd - 4, shade(paint, 1.12));
  px(c1 - ws, 2, ws, Wd - 4, glass); px(c1 - ws, 2, 1, 1, glassHi);
  // livery: painted over the body but not the glass
  const lv = LIVERIES[cs.livery || 0];
  if (lv && cs.livery) for (let x = 1; x < L - 1; x++) for (let y = 1; y < Wd - 1; y++) {
    if (y >= 2 && y < Wd - 2 && ((x >= c0 && x < c0 + rw) || (x >= c1 - ws && x < c1))) continue;
    const col = lv.f(x, y, L, Wd, paint); if (col) px(x, y, 1, 1, col);
  }
  // side mirrors
  px(c1 - ws, 0, 1, 1, dark); px(c1 - ws, Wd - 1, 1, 1, dark);
  // lights
  px(L - 1, 1, 1, 2, '#fff7c2'); px(L - 1, Wd - 3, 1, 2, '#fff7c2');
  px(0, 1, 1, 2, '#ff2a2a'); px(0, Wd - 3, 1, 2, '#ff2a2a');
  if (st === 'muscle') { px(c1 + 2, (Wd >> 1) - 1, 3, 2, '#222'); }
  if (st === 'super') { px(c0 - 3, 2, 2, Wd - 4, '#151515'); }
  if (st === 'roadster') { px(c0 + rw, 2, c1 - c0 - rw - ws, Wd - 4, '#2a1f24'); px(c0 + rw + 1, 2, 2, (Wd >> 1) - 2, '#111'); px(c0 + rw + 1, (Wd >> 1) + 1, 2, (Wd >> 1) - 3, '#111'); }
  if (st === 'truck') { px(2, 2, c0 - 3, Wd - 4, '#26262e'); px(2, 2, c0 - 3, 1, '#3a3a46'); for (let x = 4; x < c0 - 2; x += 3) px(x, 3, 1, Wd - 6, '#1b1b22'); }
  if (st === 'van') { px(c0 + 2, 1, Math.round((c1 - c0) * 0.6), 1, shade(paint, 1.25)); }
  if (st === 'wagon') { px(c0 + rw, 1, 1, Wd - 2, dark); px(c0 + rw, (Wd >> 1), c1 - c0 - rw - ws, 1, shade(paint, 0.85)); }
  // body kit pieces
  if (wideK) for (const ax of [fa, ra]) {
    const fc = has('wide') ? paint : '#1b1b22', ec = has('wide') ? dark : '#0e0e12';
    px(ax - 2, -1, 5, 1, fc); px(ax - 2, Wd, 5, 1, fc); px(ax - 2, -1, 1, 1, ec); px(ax + 2, -1, 1, 1, ec); px(ax - 2, Wd, 1, 1, ec); px(ax + 2, Wd, 1, 1, ec);
    if (has('flare')) { px(ax - 1, -1, 1, 1, '#8d93a0'); px(ax + 1, -1, 1, 1, '#8d93a0'); px(ax - 1, Wd, 1, 1, '#8d93a0'); px(ax + 1, Wd, 1, 1, '#8d93a0'); }
  }
  if (has('lip')) { px(L, 1, 1, Wd - 2, '#111116'); }
  if (has('canard')) { px(L - 2, -1, 2, 1, '#111116'); px(L - 2, Wd, 2, 1, '#111116'); }
  if (has('diffuser')) { px(-1, 2, 1, Wd - 4, '#111116'); for (let y = 3; y < Wd - 3; y += 2) px(-1, y, 1, 1, '#3a3a46'); }
  if (has('vents')) for (let x = c1 + 2; x < L - 3; x += 2) { px(x, 2, 1, (Wd >> 1) - 2, '#141418'); px(x, (Wd >> 1) + 1, 1, (Wd >> 1) - 3, '#141418'); }
  if (has('scoop')) { const mx = c0 + ((c1 - c0) >> 1); px(mx - 1, (Wd >> 1) - 1, 3, 2, '#141418'); px(mx + 1, (Wd >> 1) - 1, 1, 2, '#3a3a46'); }
  if (has('tow')) { px(L, Wd - 3, 1, 1, '#ff3d3d'); px(-1, 2, 1, 1, '#ff3d3d'); }
  if (has('bash')) { px(L, 0, 1, Wd, '#26262c'); px(L + 1, 1, 1, Wd - 2, '#3a3a46'); }
  if (has('rack')) { const x0 = c0 + rw, w = Math.max(2, c1 - c0 - rw - ws); px(x0, 2, w, 1, '#222'); px(x0, Wd - 3, w, 1, '#222');
    for (let x = x0; x < x0 + w; x += 2) px(x, 3, 1, Wd - 6, '#2c2c33'); px(c1 - ws - 1, 2, 1, Wd - 4, '#fff7c2'); }
  // crash damage gets worse in stages: scratches -> dents, primer and a cracked light -> crumpled corners,
  // a hanging bumper and a cracked windscreen
  const dmg = damageStage(cs.body ?? 100);
  if (dmg) {
    const R = rng(c.len * 131 + c.wid * 7), side = () => (R() < 0.5 ? 1 + ((R() * 2) | 0) : Wd - 2 - ((R() * 2) | 0));
    for (let i = 0; i < [8, 14, 20][dmg - 1]; i++) px(1 + ((R() * (L - 2)) | 0), side(), 1 + (R() < 0.4), 1, R() < 0.5 ? '#c7cbd6' : '#3a3a44'); // scratches
    if (dmg >= 2) {
      for (let i = 0; i < 4; i++) { const x = 2 + ((R() * (L - 5)) | 0), y = side(); px(x, y, 2, 1, shade(paint, 0.45)); px(x, y + (y < Wd / 2 ? 1 : -1), 1, 1, shade(paint, 0.6)); } // dents
      const dx = Math.round(L * 0.45); px(dx, Wd - 2, 3, 1, '#8a8f99'); px(dx + 1, Wd - 3, 2, 1, '#9aa0aa'); // primer patch on a door
      px(L - 1, 1, 1, 2, '#4a4a40'); px(L - 2, 0, 2, 1, shade(paint, 0.4)); // smashed headlight, bent corner
    }
    if (dmg >= 3) {
      g.clearRect(pad + L - 1, pad, 1, 2); g.clearRect(pad, pad + Wd - 2, 1, 2); // crumpled corners
      px(-1, 2, 1, Wd - 3, shade(paint, 0.5)); px(-2, Wd - 3, 1, 2, shade(paint, 0.5)); // rear bumper hanging off
      px(0, 1, 1, 2, '#3a1010'); px(2, 1, 4, 1, '#8a8f99'); px(L - 6, Wd - 2, 4, 1, '#8a8f99'); // dead tail light, more primer
      const wsx = c1 - Math.max(2, Math.round((c1 - c0) * 0.3)); px(wsx, 3, 1, 1, '#e8f0ff'); px(wsx + 1, 4, 1, 1, '#e8f0ff'); px(wsx, Wd - 4, 1, 1, '#e8f0ff'); // cracked windscreen
    }
  }
  // spoiler
  if (cs.spoiler === 1) px(0, 1, 2, Wd - 2, dark);
  if (cs.spoiler === 2) { g.fillStyle = '#111'; g.fillRect(pad - 2, pad - 1, 2, Wd + 2); px(0, 2, 1, 1, '#333'); px(0, Wd - 3, 1, 1, '#333'); }
  return cv;
}
function makeGlow(spr, col) {
  const pad = 10, c = mkCanvas(spr.width + pad * 2, spr.height + pad * 2), g = c.getContext('2d');
  g.translate(c.width / 2, c.height / 2); g.scale(c.width / c.height, 1);
  const r = c.height / 2, gr = g.createRadialGradient(0, 0, 1, 0, 0, r);
  gr.addColorStop(0, col); gr.addColorStop(0.55, col + '88'); gr.addColorStop(1, col + '00');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
  return c;
}
function makeShadow(spr) {
  const c = mkCanvas(spr.width, spr.height), g = c.getContext('2d');
  g.drawImage(spr, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgba(0,0,0,.42)'; g.fillRect(0, 0, c.width, c.height);
  return c;
}

// ===== car physics =====
// Bicycle model with Pacejka-lite tyres, friction circle on the driven rear axle,
// weight transfer and an automatic gearbox. Units: metres/seconds; positions in world px.
// All state lives in plain fields so a future network layer can snapshot/apply it.
let ASSIST_K = 0.9, STAB_K = 1.4, DRIFT_HOLD = 1.6;
// front keeps more grip past the peak than the rear, so slides are catchable but self-sustaining
// assist settings: a boolean (old style: countersteer + angle hold) or an object from driftAssists()
function assistCfg(a) { if (a && typeof a === 'object') return a; return {cs: a ? 1 : 0, hold: a ? 1 : 0, spin: 0, kick: 0, speed: 0, wall: 0, arc: 0, steer: 1}; }
function tyre(alpha, B, D, C) { return D * Math.sin(C * Math.atan(B * alpha)); }

class CarSim {
  constructor(spec, cs) {
    this.spec = spec; this.cs = cs;
    this.x = 0; this.y = 0; this.th = 0; this.vx = 0; this.vy = 0; this.w = 0;
    this.steer = 0; this.gear = 1; this.rpm = 1000; this.shiftT = 0; this.ax = 0;
    this.nos = spec.nos ? 1 : 0; this.nosOn = false;
    this.slipR = 0; this.slipF = 0; this.beta = 0; this.surf = 0; this.thr = 0; this.hand = 0;
    this.idx = -1; this.lat = 0; this.totS = 0; this.prevS = null; this.wallHit = 0; this.offRoad = 0;
  }
  snapshot() { const {x, y, th, vx, vy, w, steer, gear, rpm} = this; return {x, y, th, vx, vy, w, steer, gear, rpm}; }
  apply(s) { Object.assign(this, s); }
  place(track, s, lat) {
    const p = track.posAt(s, lat); this.x = p.x; this.y = p.y; this.th = p.ang; this.vx = this.vy = this.w = 0;
    const n = track.nearest(this.x, this.y, -1); this.idx = n.idx; this.prevS = n.s; this.totS = s; this.gear = 1;
  }
  get speed() { return Math.hypot(this.vx, this.vy); }

  step(dt, inp, track, assist) {
    const A = assistCfg(assist), sp = this.spec, c = Math.cos(this.th), s = Math.sin(this.th);
    let vf = this.vx * c + this.vy * s, vl = -this.vx * s + this.vy * c;
    const speed = Math.hypot(vf, vl);
    // surface
    const n = track.nearest(this.x, this.y, this.idx, 12); this.idx = n.idx; this.lat = n.lat;
    this.surf = track.surface(n.lat);
    const sg = this.surf === 2 ? (A.arc ? 0.92 : 0.75) : this.surf === 1 ? 0.97 : 1;
    // steering (speed-sensitive, rate limited) + optional countersteer assist
    const beta = speed > 2 ? Math.atan2(vl, Math.abs(vf)) : 0; this.beta = beta;
    // speed-sensitive steering while gripping; full lock available once sliding so you can countersteer
    const sens = lerp(1 / (1 + Math.max(0, speed - 8) * 0.018), 1, clamp(Math.abs(beta) / 0.25, 0, 1));
    let target = inp.steer * sp.steerMax * sens;
    if (A.cs && vf > 4) target += clamp(beta, -sp.steerMax, sp.steerMax) * ASSIST_K * A.cs * (1 - Math.abs(inp.steer) * 0.3);
    target = clamp(target, -sp.steerMax, sp.steerMax);
    const rate = 7 * A.steer * dt; this.steer += clamp(target - this.steer, -rate, rate);
    const d = this.steer;
    // gears / engine
    const gr = sp.gears[this.gear - 1] * sp.final;
    const wmax = sp.redline * TAU / 60;
    let we = Math.abs(vf) / sp.wheelR * gr;
    const spinning = inp.throttle > 0.1 && Math.abs(this.slipR) > 0.2;
    const rpmTarget = Math.max(950, we * 60 / TAU * (spinning ? 1.25 : 1), inp.throttle > 0.1 && this.gear === 1 && vf < 6 ? sp.redline * 0.55 : 0);
    this.rpm = lerp(this.rpm, Math.min(rpmTarget, sp.redline * 1.02), clamp(dt * 14, 0, 1));
    const r = clamp(we / wmax, 0.25, 1);
    if (this.shiftT > 0) this.shiftT -= dt;
    else if (vf > 0.5) {
      if (we >= wmax * 0.97 && this.gear < sp.gears.length) { this.gear++; this.shiftT = sp.shift; }
      else if (this.gear > 1 && we < wmax * 0.5 && we * sp.gears[this.gear - 2] / sp.gears[this.gear - 1] < wmax * 0.88) { this.gear--; this.shiftT = sp.shift * 0.5; }
    }
    if (vf < 0.5 && this.gear > 1 && speed < 3) this.gear = 1;
    this.nosOn = inp.nitro && this.nos > 0 && inp.throttle > 0.1;
    if (this.nosOn) this.nos = Math.max(0, this.nos - dt / sp.nosDur * (sp.nosShot / 0.6));
    const pw = sp.power * (this.nosOn ? 1 + sp.nosShot : 1);
    const torque = pw * torqueShape(r, sp.turbo) / (0.91875 * wmax);
    let Fdrive = 0;
    const reversing = inp.brake > 0.1 && vf < 1.0 && inp.throttle < 0.1;
    if (this.shiftT <= 0 && we < wmax * 1.0) Fdrive = inp.throttle * torque * gr / sp.wheelR * 0.85;
    if (reversing) Fdrive = -inp.brake * sp.mass * 3.0;
    // loads with longitudinal weight transfer
    const m = sp.mass, L = sp.L;
    let Nf = m * G * sp.b / L - m * this.ax * sp.h / L; Nf = clamp(Nf, m * G * 0.15, m * G * 0.85);
    let Nr = m * G - Nf;
    Nf += sp.dfF * speed * speed; Nr += sp.dfR * speed * speed; // aero downforce
    const muF = sp.muF * sg * (A.arc ? 1.15 : 1), muR = sp.muR * sg; // easy handling: sharper turn-in, easier to catch
    // braking
    let FbF = 0, FbR = 0;
    if (inp.brake > 0 && vf > 0.5) { FbF = inp.brake * sp.brake * sp.bias; FbR = inp.brake * sp.brake * (1 - sp.bias); }
    const hb = inp.hand > 0.5 && Math.abs(vf) > 0.5;
    if (hb) FbR += muR * Nr * sp.hbForce;
    // rear longitudinal force limited by traction
    let FxR = Fdrive - FbR * Math.sign(vf);
    const capR = muR * Nr * (hb ? 0.55 : 1);
    FxR = clamp(FxR, -capR, capR);
    // slip angles
    const vden = Math.max(Math.abs(vf), 3);
    const aF = Math.atan2(vl + this.w * sp.a, vden) - d * Math.sign(vf || 1);
    const aR = Math.atan2(vl - this.w * sp.b, vden);
    this.slipF = aF; this.slipR = aR;
    // friction circle: drive/brake on the rear eats lateral grip (more with a locked diff)
    const k = 0.86 + 0.66 * sp.lock;
    const used = clamp(Math.abs(FxR) * k / (muR * Nr), 0, 0.98);
    let DR = muR * Nr * Math.sqrt(1 - used * used) * (hb ? sp.hbGrip : 1);
    if (A.kick) { // auto drift start: a little clutch-kick when you steer hard on the gas at speed
      this.kickCd = (this.kickCd || 0) - dt; this.kickT = (this.kickT || 0) - dt;
      if (this.kickCd <= 0 && Math.abs(beta) < 0.15 && speed > 11 && Math.abs(inp.steer) > 0.8 && inp.throttle > 0.6) { this.kickT = 0.3; this.kickCd = 1.2; }
      if (this.kickT > 0) DR *= 0.45;
    }
    const DF = muF * Nf * Math.sqrt(1 - clamp(FbF / (muF * Nf), 0, 0.95) ** 2);
    const FyF = -tyre(aF, sp.BF, DF, 1.22), FyR = -tyre(aR, sp.BR, DR, 1.62);
    // resistive forces
    const cr = this.surf === 2 ? 0.9 : 0.12;
    const Fx = FxR - FbF * Math.sign(vf) - FyF * Math.sin(d) - sp.drag * vf * speed - cr * m * 0.1 * vf;
    const Fy = FyF * Math.cos(d) + FyR - sp.drag * vl * speed - cr * m * 0.1 * vl;
    let Tz = sp.a * FyF * Math.cos(d) - sp.b * FyR;
    // arcade stability: gentle weathervane while sliding, firm soft-limit past the car's max angle
    // (more steering lock = higher max angle, which is what the Angle Kit buys you)
    const maxA = A.arc ? Math.min(sp.steerMax + 0.15, 0.9) : A.spin ? Math.min(sp.steerMax + 0.3, 1.1) : sp.steerMax + 0.3, excess = beta - clamp(beta, -maxA, maxA);
    // drift hold (assist on): while sliding on the gas, ease off the straightening torque and nudge toward a
    // comfortable angle so the slide holds itself. Steering into the drift asks for more angle, countersteer for less.
    let stab = STAB_K;
    if (A.hold && Math.abs(beta) > 0.12 && inp.throttle > 0.3 && speed > 7) {
      const into = -inp.steer * Math.sign(beta); // +1 = steering into the slide's rotation
      const want = Math.sign(beta) * clamp(0.45 + 0.2 * into, 0.25, maxA - 0.1);
      stab *= 1 - Math.min(0.9, 0.7 * A.hold) * inp.throttle;
      Tz += sp.I * DRIFT_HOLD * A.hold * (want - beta) * -1 * inp.throttle * clamp((speed - 7) / 6, 0, 1);
    }
    if (A.arc && inp.throttle < 0.3 && !hb) stab *= 2.2; // easy handling: lift off and the car straightens itself
    Tz += sp.I * (stab * beta + (A.arc ? 30 : A.spin ? 18 : 7) * excess) * clamp(speed / 10, 0, 1);
    this.dbg = [FyF, FyR, DF, DR, FxR, Nf, aF, aR];
    let axl = Fx / m, ayl = Fy / m;
    // speed hold: keeps the car moving through long slides instead of scrubbing off all its speed
    if (A.speed && Math.abs(beta) > 0.15 && inp.throttle > 0.3 && vf > 3) axl += 3 * inp.throttle * (speed < 28 ? 1 : 0.3);
    this.ax = lerp(this.ax, axl, clamp(dt * 8, 0, 1));
    vf += axl * dt; // world-frame integration: re-projection next step handles frame rotation
    vl += ayl * dt;
    this.w += Tz / sp.I * dt;
    this.w *= 1 - clamp(dt * (speed < 3 ? 6 : 0.35), 0, 1);
    if (speed < 0.6 && inp.throttle < 0.05 && !reversing) { vf *= 0.9; vl *= 0.9; this.w *= 0.85; }
    this.vx = vf * c - vl * s; this.vy = vf * s + vl * c;
    this.th = wrapAng(this.th + this.w * dt);
    if (A.arc) this.keepOnRoad(dt, track, n);
    this.x += this.vx * PPM * dt; this.y += this.vy * PPM * dt;
    this.thr = inp.throttle; this.hand = hb ? 1 : 0;
    this.collide(track, A);
  }
  // easy handling: near the edge of the road, gently turn the car (heading and travel together, so the
  // drift angle is kept) back along the road and bleed off the speed heading into the barrier
  keepOnRoad(dt, track, n) {
    const edge = ROAD_W / 2 - 6, lim = ROAD_W / 2 + RUNOFF - 2, a = Math.abs(n.lat), speed = this.speed;
    if (a < edge || speed < 4) return;
    const sgn = Math.sign(n.lat), nx = -track.ty[n.idx] * sgn, ny = track.tx[n.idx] * sgn;
    const vn = this.vx * nx + this.vy * ny; if (vn <= 0) return; // already heading back in
    const k = clamp((a - edge) / (lim - edge), 0, 1) * 0.7 + 0.3;
    let ta = track.ang[n.idx]; const va = Math.atan2(this.vy, this.vx);
    if (Math.abs(wrapAng(ta - va)) > Math.PI / 2) ta += Math.PI;
    const rot = clamp(wrapAng(ta - va), -1, 1) * clamp(dt * 4.5 * k, 0, 1), c = Math.cos(rot), s = Math.sin(rot);
    const vx = this.vx * c - this.vy * s, vy = this.vx * s + this.vy * c; this.vx = vx; this.vy = vy;
    this.th = wrapAng(this.th + rot);
    const vn2 = this.vx * nx + this.vy * ny; if (vn2 > 0) { this.vx -= nx * vn2 * clamp(dt * 3 * k, 0, 1); this.vy -= ny * vn2 * clamp(dt * 3 * k, 0, 1); }
  }
  // walls + lap progress (shared by both driving models)
  collide(track, A) {
    // barrier
    const n2 = track.nearest(this.x, this.y, this.idx, 6), lim = ROAD_W / 2 + RUNOFF - 2;
    if (Math.abs(n2.lat) > lim) {
      const sgn = Math.sign(n2.lat), nx = -track.ty[n2.idx] * sgn, ny = track.tx[n2.idx] * sgn; // outward normal
      const over = Math.abs(n2.lat) - lim; this.x -= nx * over; this.y -= ny * over;
      const vn = this.vx * nx + this.vy * ny;
      if (vn > 0 && A.arc) { // easy handling: slide along the wall keeping your speed, barely a scratch
        this.vx -= vn * nx; this.vy -= vn * ny; this.vx *= 0.99; this.vy *= 0.99; this.w *= 0.7; this.wallHit = Math.max(this.wallHit, vn * 0.2);
        let ta = track.ang[n2.idx]; if (Math.abs(wrapAng(ta - this.th)) > Math.PI / 2) ta += Math.PI;
        this.th = wrapAng(this.th + wrapAng(ta - this.th) * 0.5);
      } else if (vn > 0) { const sw = A.wall; this.vx -= (sw ? 1.05 : 1.2) * vn * nx; this.vy -= (sw ? 1.05 : 1.2) * vn * ny; this.vx *= sw ? 0.97 : 0.9; this.vy *= sw ? 0.97 : 0.9; this.w *= sw ? 0.75 : 0.5; this.wallHit = Math.max(this.wallHit, sw ? vn * 0.4 : vn);
        // glance off: nudge the nose toward the barrier's direction so you don't stay pinned
        let ta = track.ang[n2.idx]; if (Math.abs(wrapAng(ta - this.th)) > Math.PI / 2) ta += Math.PI;
        this.th = wrapAng(this.th + wrapAng(ta - this.th) * 0.4); }
    }
    // progress along track (unwrapped)
    const nn = track.nearest(this.x, this.y, this.idx, 6); this.idx = nn.idx;
    if (this.prevS != null) { let ds = nn.s - this.prevS; if (ds < -track.len / 2) ds += track.len; if (ds > track.len / 2) ds -= track.len; this.totS += ds; }
    this.prevS = nn.s;
  }
}

// ===== AI racer (kinematic line follower with visual drift) =====
class AICar {
  constructor(track, cs, skill, top, s0, lane, seed) {
    this.cs = cs; this.track = track; this.skill = skill; this.top = top; this.totS = s0; this.v = 0;
    this.lane = lane; this.laneT = lane; this.R = rng(seed); this.th = 0; this.x = 0; this.y = 0; this.slipR = 0; this.beta = 0;
    this.finished = false; this.finishT = 0; this.bump = 0; this.pose();
  }
  pose(dt) {
    const t = this.track, p = t.posAt(this.totS, this.lane), cv = t.curv[p.i];
    // tandem lead drivers hold big, smooth angles; racers only kick out a little
    const max = this.lead ? 0.85 : 0.55, k = this.lead ? 2.2 : 0.9;
    const target = this.v > 6 ? clamp(cv * this.v * this.v * k, -max, max) : 0;
    this.dA = dt ? lerp(this.dA || 0, target, clamp(dt * (this.lead ? 3 : 8), 0, 1)) : target;
    const drift = this.dA;
    this.beta = -drift; this.slipR = Math.abs(drift) > 0.15 ? drift : 0; this.sliding = this.slipR !== 0;
    this.x = p.x; this.y = p.y; this.th = p.ang + drift;
  }
  update(dt, leadS) {
    const t = this.track, i = ((Math.floor(this.totS / t.ds) % t.N) + t.N) % t.N;
    let vt = this.top;
    for (let o = 0; o < 80; o += 4) { // look ahead and brake for corners
      const j = (i + o) % t.N, dist = o * t.ds / PPM, vc = t.vCurve[j] * this.skill * 1.05;
      vt = Math.min(vt, Math.sqrt(vc * vc + 2 * 9 * dist));
    }
    if (this.lead && leadS != null) { // tandem lead: wait for the chase car, pull away if it gets alongside
      const gap = (this.totS - leadS) / PPM; vt *= clamp(1.25 - gap * 0.015, 0.5, 1.3);
    } else // mild rubber band
    if (leadS != null) { const gap = (this.totS - leadS) / PPM; vt *= clamp(1 - gap * 0.0012, 0.9, 1.06); }
    if (this.finished && !this.lead) vt *= 0.4;
    if (this.v < vt) this.v = Math.min(vt, this.v + clamp(7 - this.v * 0.06, 2, 7) * this.skill * dt);
    else this.v = Math.max(vt, this.v - 11 * dt);
    if (this.bump > 0) { this.bump -= dt; this.v *= 1 - dt * 0.8; }
    if (!this.lead && this.R() < dt * 0.3) this.laneT = (this.R() - 0.5) * 26;
    this.lane += clamp(this.laneT - this.lane, -8 * dt, 8 * dt);
    this.totS += this.v * PPM * dt;
    this.pose(dt);
  }
  get speed() { return this.v; }
}
