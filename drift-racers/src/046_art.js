// ===== pixel-art scenery for menus (generated once, cached as data URLs) =====
const Art = {cache: {}};
Art.get = function (name) { if (!this.cache[name]) { try { this.cache[name] = this[name]().toDataURL(); } catch (e) { this.cache[name] = ''; } } return this.cache[name]; };

// Side-view workshop: roll-up door, pegboard of tools, tool chest, tyre racks, concrete floor.
Art.workshop = function () {
  const W = 320, H = 180, c = mkCanvas(W, H), g = c.getContext('2d'), R = rng(4242), FL = 116;
  const r = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x | 0, y | 0, w | 0, h | 0); };
  // back wall panels
  r(0, 0, W, FL, '#2b2842'); for (let x = 0; x < W; x += 32) r(x, 0, 1, FL, '#232037');
  for (let i = 0; i < 400; i++) r(R() * W, R() * FL, 1, 1, R() < 0.5 ? '#2f2c48' : '#27243c');
  r(0, 0, W, 5, '#1a1829'); r(0, 5, W, 1, '#3a3658');
  // brick wainscot
  r(0, 92, W, FL - 92, '#5a3434');
  for (let y = 92; y < FL; y += 4) { r(0, y, W, 1, '#3e2424'); for (let x = ((y / 4) % 2) * 4; x < W; x += 8) r(x, y, 1, 4, '#3e2424'); }
  // ceiling lights + light cones
  for (const lx of [36, 150, 262]) {
    g.fillStyle = 'rgba(255,248,215,.05)'; g.beginPath(); g.moveTo(lx - 12, 9); g.lineTo(lx + 12, 9); g.lineTo(lx + 44, H); g.lineTo(lx - 44, H); g.fill();
    r(lx - 1, 0, 1, 6, '#555'); r(lx - 14, 6, 28, 3, '#9a9aa8'); r(lx - 12, 9, 24, 1, '#fffbe0');
  }
  // roll-up door with hazard frame
  const dx = 6, dy = 22, dw = 74, dh = FL - dy;
  for (let x = dx - 3; x < dx + dw + 3; x++) for (let y = dy - 3; y < FL; y++) {
    const edge = x < dx || x >= dx + dw || y < dy; if (edge) r(x, y, 1, 1, ((x + y) >> 2) % 2 ? '#111' : '#f2c230');
  }
  r(dx, dy, dw, dh, '#6c7382'); for (let y = dy + 3; y < FL; y += 5) { r(dx, y, dw, 1, '#535968'); r(dx, y + 1, dw, 1, '#7d8494'); }
  r(dx + dw / 2 - 5, FL - 8, 10, 2, '#2a2a33');
  // neon sign (tiny bitmap font so it stays crisp)
  const FONT = {W: '101101101111101', O: '111101101101111', R: '110101110101101', K: '101110100110101', S: '111100111001111', H: '101101111101101', P: '110101110100100'};
  const word = 'WORKSHOP', sx0 = 114, sy0 = 8;
  for (const [col, off, a] of [['rgba(255,61,127,.35)', 1, 1], ['#ff8fb5', 0, 0]]) {
    g.fillStyle = col;
    [...word].forEach((ch, i) => { const f = FONT[ch]; for (let k = 0; k < 15; k++) if (f[k] === '1') { const x = sx0 + i * 8 + (k % 3) * 2, y = sy0 + ((k / 3) | 0) * 2; g.fillRect(x - off, y - off, 2 + off * 2, 2 + off * 2); } });
  }
  // pegboard + tools
  const px0 = 96, py0 = 26, pw = 100, ph = 46;
  r(px0 - 2, py0 - 2, pw + 4, ph + 4, '#5c3f22'); r(px0, py0, pw, ph, '#b98a52');
  for (let y = py0 + 2; y < py0 + ph; y += 4) for (let x = px0 + 2; x < px0 + pw; x += 4) r(x, y, 1, 1, '#8e6538');
  const wrench = (x, y, len) => { r(x, y + 2, 2, len, '#c7cbd6'); r(x - 1, y, 4, 3, '#c7cbd6'); r(x, y, 2, 1, '#b98a52'); r(x - 1, y + len + 1, 4, 3, '#c7cbd6'); r(x, y + len + 3, 2, 1, '#9aa0ad'); };
  for (let i = 0; i < 7; i++) wrench(px0 + 6 + i * 6, py0 + 4, 10 + i * 2);
  r(px0 + 50, py0 + 5, 3, 22, '#7a4a22'); r(px0 + 46, py0 + 3, 11, 5, '#8d93a0'); // hammer
  for (let i = 0; i < 5; i++) { const col = ['#ff3d3d', '#ffd23d', '#3d8bff', '#5dff6a', '#ff7b2d'][i]; r(px0 + 64 + i * 6, py0 + 4, 3, 8, col); r(px0 + 65 + i * 6, py0 + 12, 1, 12, '#c7cbd6'); }
  r(px0 + 62, py0 + 30, 30, 2, '#c7cbd6'); r(px0 + 62, py0 + 34, 30, 2, '#9aa0ad'); r(px0 + 8, py0 + 34, 18, 7, '#2b6cb0'); r(px0 + 9, py0 + 35, 16, 2, '#3d8bff');
  // workbench with an engine block on it
  r(px0 - 4, 78, pw + 8, 4, '#7a5a3a'); r(px0 - 4, 78, pw + 8, 1, '#9b7650'); r(px0, 82, 3, FL - 82, '#4a3522'); r(px0 + pw - 3, 82, 3, FL - 82, '#4a3522');
  r(px0 + 30, 66, 26, 12, '#7d8494'); r(px0 + 30, 66, 26, 2, '#9aa0ad'); for (let i = 0; i < 4; i++) r(px0 + 33 + i * 6, 63, 4, 3, '#5a606c');
  r(px0 + 70, 72, 10, 6, '#555b66'); r(px0 + 72, 68, 6, 4, '#6c7382'); // vise
  r(px0 + 8, 72, 6, 6, '#c0392b'); r(px0 + 15, 73, 5, 5, '#2b6cb0'); // oil cans
  // posters
  r(206, 28, 24, 32, '#ff3d7f'); r(208, 30, 20, 28, '#2a1530'); r(210, 44, 16, 5, '#f4f1ff'); r(212, 42, 6, 2, '#1c2238'); r(210, 34, 16, 2, '#ffd23d');
  r(236, 30, 20, 26, '#3df2ff'); r(238, 32, 16, 22, '#13283a'); for (let i = 0; i < 4; i++) r(240, 36 + i * 4, 12 - i * 2, 2, '#3df2ff');
  // tool chest
  const tx = 202, ty = 82;
  r(tx, ty, 40, FL - ty + 2, '#c0392b'); r(tx, ty, 40, 2, '#e05545');
  for (let y = ty + 5; y < FL; y += 6) { r(tx + 2, y, 36, 1, '#7d1f17'); r(tx + 16, y + 2, 8, 1, '#d8dbe2'); }
  r(tx + 2, FL + 2, 4, 3, '#222'); r(tx + 34, FL + 2, 4, 3, '#222');
  // shelving with tyres and boxes
  const sx = 262, sw = 54;
  r(sx, 22, 2, FL - 22, '#4d4d58'); r(sx + sw - 2, 22, 2, FL - 22, '#4d4d58');
  for (const y of [48, 78, 108]) r(sx, y, sw, 2, '#77778a');
  const tyreS = (x, y) => { r(x, y - 12, 12, 12, '#151518'); r(x + 3, y - 9, 6, 6, '#2c2c33'); r(x + 4, y - 8, 4, 4, '#8d93a0'); r(x + 1, y - 12, 10, 1, '#26262c'); };
  for (let i = 0; i < 4; i++) tyreS(sx + 3 + i * 12, 48);
  r(sx + 4, 66, 14, 12, '#e67e22'); r(sx + 4, 70, 14, 1, '#b85f13'); r(sx + 20, 68, 12, 10, '#2980b9'); r(sx + 34, 62, 14, 16, '#8e44ad'); r(sx + 34, 68, 14, 1, '#6a2f85');
  for (let i = 0; i < 5; i++) r(sx + 4 + i * 9, 100, 6, 8, ['#ffd23d', '#ff3d3d', '#ffd23d', '#5dff6a', '#ff3d3d'][i]);
  // concrete floor
  r(0, FL, W, H - FL, '#585766');
  for (let i = 0; i < 900; i++) r(R() * W, FL + R() * (H - FL), 1, 1, R() < 0.5 ? '#615f70' : '#4f4e5c');
  r(0, FL, W, 2, '#3c3b48');
  for (let x = 0; x < W; x += 64) r(x, FL + 2, 1, H - FL, '#4c4b58');
  r(0, 150, W, 1, '#4c4b58');
  for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(15,12,20,.35)'; g.beginPath(); g.ellipse(30 + R() * 260, 128 + R() * 44, 6 + R() * 10, 2 + R() * 3, 0, 0, TAU); g.fill(); }
  // tyre stack on the floor
  for (let i = 0; i < 4; i++) { r(86, FL + 4 - i * 6 - 6, 14, 6, '#151518'); r(86, FL + 4 - i * 6 - 6, 14, 1, '#2c2c33'); }
  // floor jack
  r(250, 136, 26, 5, '#f2c230'); r(250, 136, 26, 1, '#ffe27a'); r(270, 128, 3, 9, '#d4a514'); r(246, 141, 4, 3, '#222'); r(270, 141, 4, 3, '#222'); r(232, 137, 18, 1, '#999');
  return c;
};

// Top-down asphalt texture for the car lot.
Art.asphalt = function () {
  const c = mkCanvas(64, 64), g = c.getContext('2d'), R = rng(77);
  g.fillStyle = '#3a3a46'; g.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 500; i++) { const v = R(); g.fillStyle = v < 0.45 ? '#34343f' : v < 0.9 ? '#41414e' : '#4c4c5a'; g.fillRect((R() * 64) | 0, (R() * 64) | 0, 1, 1); }
  return c;
};
// String of dealership pennant flags.
Art.bunting = function () {
  const c = mkCanvas(40, 12), g = c.getContext('2d'), cols = ['#ff3d3d', '#ffd23d', '#3d8bff', '#5dff6a', '#ff3d7f'];
  g.fillStyle = '#ddd'; g.fillRect(0, 1, 40, 1);
  for (let i = 0; i < 5; i++) { g.fillStyle = cols[i]; g.beginPath(); g.moveTo(i * 8, 2); g.lineTo(i * 8 + 7, 2); g.lineTo(i * 8 + 3.5, 10); g.fill(); }
  return c;
};
// Car sprite turned nose-up for parking stalls, scaled up with crisp pixels.
function stallSprite(cs, sc) {
  const spr = makeCarSprite(cs), sh = makeShadow(spr), c = mkCanvas((spr.height + 3) * sc, (spr.width + 3) * sc), g = c.getContext('2d');
  g.imageSmoothingEnabled = false; g.translate(c.width / 2, c.height / 2); g.rotate(-Math.PI / 2);
  g.drawImage(sh, -spr.width / 2 * sc + sc * 1.5, -spr.height / 2 * sc + sc * 1.5, spr.width * sc, spr.height * sc);
  g.drawImage(spr, -spr.width / 2 * sc, -spr.height / 2 * sc, spr.width * sc, spr.height * sc);
  return c;
}

// 16x16 pixel icons for each part category; the accent colour shows the part's level.
const LEVEL_COL = ['#8d93a0', '#5dff6a', '#3df2ff', '#ffd23d', '#ff3d7f', '#9b4dff'];
Art.partIcon = function (k, lvl) {
  const key = 'pi_' + k + '_' + lvl;
  if (!this.cache[key]) {
    const c = mkCanvas(16, 16), g = c.getContext('2d'), lv = PARTS[k].levels[lvl] || {}, A = LEVEL_COL[lv.tier ?? Math.min(lvl, 5)];
    const r = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const M = '#c7cbd6', D = '#6c7382', K = '#1b1b22', S = '#9aa0ad';
    const disc = (cx, cy, rr, col) => { for (let y = -rr; y <= rr; y++) for (let x = -rr; x <= rr; x++) if (x * x + y * y <= rr * rr + rr * 0.6) r(cx + x, cy + y, 1, 1, col); };
    const D_ = {
      engine: () => { r(2, 6, 12, 8, D); r(2, 6, 12, 1, M); for (let i = 0; i < 4; i++) r(3 + i * 3, 3, 2, 3, A); r(1, 9, 1, 3, K); r(14, 9, 1, 3, K); r(4, 9, 8, 2, K); },
      internals: () => { r(5, 2, 6, 6, M); r(5, 3, 6, 1, A); r(5, 5, 6, 1, A); r(7, 8, 2, 6, S); r(6, 13, 4, 2, D); },
      cams: () => { r(1, 7, 14, 2, S); for (let i = 0; i < 4; i++) { r(2 + i * 3, 5, 2, 6, M); r(2 + i * 3, 4, 2, 1, A); } },
      turbo: () => lv.sc ? (r(2, 5, 12, 9, D), r(2, 5, 12, 1, M), r(3, 2, 10, 3, S), r(4, 3, 8, 1, K), r(5, 7, 6, 5, A), r(1, 9, 1, 3, K), r(14, 9, 1, 3, K)) : (disc(7, 8, 5, D), disc(7, 8, 3, M), disc(7, 8, 1, A), r(11, 3, 4, 3, S), r(2, 12, 3, 3, S)),
      intercooler: () => { r(1, 4, 14, 9, D); for (let x = 2; x < 14; x += 2) r(x, 5, 1, 7, M); r(1, 4, 14, 1, A); r(1, 12, 14, 1, A); },
      intake: () => { r(2, 5, 7, 7, A); for (let y = 6; y < 11; y += 2) r(3, y, 5, 1, K); r(9, 7, 6, 3, M); },
      exhaust: () => { r(1, 7, 10, 3, S); r(1, 7, 10, 1, M); r(10, 5, 5, 7, M); r(11, 6, 3, 5, K); r(10, 5, 5, 1, A); },
      ecu: () => { r(3, 3, 10, 10, K); r(4, 4, 8, 8, '#2b3a2b'); r(6, 6, 4, 4, A); for (let i = 0; i < 4; i++) { r(1, 4 + i * 2, 2, 1, M); r(13, 4 + i * 2, 2, 1, M); } },
      fuel: () => { r(3, 4, 10, 11, A); r(4, 5, 8, 9, shade(A, 0.7)); r(8, 1, 4, 3, D); r(4, 2, 4, 2, K); r(5, 8, 6, 1, A); },
      nitrous: () => { r(5, 4, 6, 11, '#2b6cb0'); r(5, 4, 6, 1, '#5aa0f0'); r(6, 1, 4, 3, M); r(5, 8, 6, 2, A); r(10, 2, 4, 1, S); },
      gearbox: () => { r(2, 6, 12, 8, D); r(2, 6, 12, 1, M); r(7, 1, 2, 6, S); disc(8, 2, 1, A); r(4, 9, 2, 2, K); r(10, 9, 2, 2, K); },
      clutch: () => { disc(8, 8, 6, D); disc(8, 8, 4, A); disc(8, 8, 2, K); },
      flywheel: () => { disc(8, 8, 6, S); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; r(8 + Math.round(Math.cos(a) * 6), 8 + Math.round(Math.sin(a) * 6), 1, 1, K); } disc(8, 8, 2, A); },
      diff: () => { disc(8, 9, 5, D); disc(8, 9, 3, M); r(0, 8, 3, 2, S); r(13, 8, 3, 2, S); r(7, 1, 2, 4, S); disc(8, 9, 1, A); },
      suspension: () => { r(7, 1, 2, 14, S); for (let y = 3; y < 13; y += 2) r(4, y, 8, 1, A); r(5, 0, 6, 2, D); r(5, 14, 6, 2, D); },
      swaybar: () => { r(2, 4, 2, 9, M); r(12, 4, 2, 9, M); r(2, 11, 12, 2, M); r(3, 7, 10, 1, A); r(1, 3, 4, 2, D); r(11, 3, 4, 2, D); },
      brace: () => { r(1, 3, 2, 11, A); r(13, 3, 2, 11, A); r(1, 3, 14, 2, A); for (let i = 0; i < 10; i++) r(3 + i, 5 + i * 0.9, 1, 1, M); },
      brakes: () => { disc(7, 8, 6, S); disc(7, 8, 2, K); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; r(7 + Math.round(Math.cos(a) * 4), 8 + Math.round(Math.sin(a) * 4), 1, 1, D); } r(11, 3, 4, 10, A); },
      handbrake: () => { r(3, 10, 10, 4, D); r(8, 2, 3, 10, S); r(7, 1, 5, 3, A); r(4, 11, 3, 2, K); },
      steering: () => { disc(8, 8, 6, K); disc(8, 8, 4, '#00000000'); g.clearRect(5, 5, 6, 6); r(7, 7, 2, 2, A); r(3, 7, 10, 1, K); r(7, 8, 2, 5, K); r(6, 2, 4, 1, A); },
      weight: () => { r(2, 5, 12, 9, D); r(2, 5, 12, 1, M); r(6, 2, 4, 3, S); r(4, 8, 2, 4, A); r(7, 8, 1, 4, A); r(8, 9, 1, 1, A); r(9, 8, 1, 1, A); r(9, 11, 1, 1, A); r(10, 8, 2, 4, A); },
      wheels: () => { disc(8, 8, 7, K); disc(8, 8, 5, S); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; r(8 + Math.round(Math.cos(a) * 3), 8 + Math.round(Math.sin(a) * 3), 2, 2, D); } disc(8, 8, 1, A); },
      tires: () => { disc(8, 8, 7, K); disc(8, 8, 4, '#2c2c33'); disc(8, 8, 2, D); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; r(8 + Math.round(Math.cos(a) * 6), 8 + Math.round(Math.sin(a) * 6), 1, 1, A); } },
      aero: () => { r(1, 4, 14, 3, A); r(1, 4, 14, 1, shade(A, 1.3)); r(3, 7, 2, 6, D); r(11, 7, 2, 6, D); r(1, 3, 1, 5, K); r(14, 3, 1, 5, K); r(2, 13, 12, 2, M); },
    };
    try { (D_[k] || D_.engine)(); } catch (e) {}
    this.cache[key] = c.toDataURL();
  }
  return this.cache[key];
};

// Parts shop interior: shelving full of boxes, a counter, and a neon PARTS sign.
Art.shop = function () {
  const W = 320, H = 180, c = mkCanvas(W, H), g = c.getContext('2d'), R = rng(5150), FL = 132;
  const r = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x | 0, y | 0, w | 0, h | 0); };
  r(0, 0, W, FL, '#24304a'); for (let i = 0; i < 500; i++) r(R() * W, R() * FL, 1, 1, R() < 0.5 ? '#283552' : '#202b42');
  r(0, 0, W, 6, '#151c2c');
  for (const lx of [50, 160, 270]) { g.fillStyle = 'rgba(220,240,255,.05)'; g.beginPath(); g.moveTo(lx - 14, 8); g.lineTo(lx + 14, 8); g.lineTo(lx + 50, H); g.lineTo(lx - 50, H); g.fill(); r(lx - 16, 6, 32, 2, '#cfe6ff'); }
  // shelving units
  const boxCols = ['#c0392b', '#2980b9', '#e67e22', '#8e44ad', '#27ae60', '#f1c40f', '#7f8c8d', '#d35400'];
  for (const sx of [6, 112, 218]) {
    r(sx, 26, 96, FL - 26, '#1a2236'); r(sx, 26, 3, FL - 26, '#3c4a6a'); r(sx + 93, 26, 3, FL - 26, '#3c4a6a');
    for (let y = 48; y < FL; y += 24) {
      r(sx, y, 96, 3, '#5a6a8a'); let x = sx + 5;
      while (x < sx + 88) { const w = 8 + (R() * 10 | 0), h = 8 + (R() * 11 | 0); if (x + w > sx + 91) break; const col = boxCols[(R() * boxCols.length) | 0];
        if (R() < 0.18) { r(x, y - 12, 12, 12, '#151518'); r(x + 3, y - 9, 6, 6, '#2c2c33'); r(x + 4, y - 8, 4, 4, '#8d93a0'); x += 14; continue; } // tyre
        r(x, y - h, w, h, col); r(x, y - h, w, 1, shade(col, 1.3)); r(x + 1, y - h + 3, w - 2, 2, '#f4f1ff'); x += w + 2; }
    }
  }
  // neon sign
  const FONT = {P: '110101110100100', A: '010101111101101', R: '110101110101101', T: '111010010010010', S: '111100111001111'};
  const word = 'PARTS', sx0 = 136, sy0 = 9;
  for (const [col, off] of [['rgba(61,242,255,.35)', 1], ['#9ff8ff', 0]]) { g.fillStyle = col;
    [...word].forEach((ch, i) => { const f = FONT[ch]; for (let k = 0; k < 15; k++) if (f[k] === '1') { const x = sx0 + i * 10 + (k % 3) * 2, y = sy0 + ((k / 3) | 0) * 2; g.fillRect(x - off, y - off, 2 + off * 2, 2 + off * 2); } }); }
  // floor
  r(0, FL, W, H - FL, '#3a3a48'); for (let y = FL; y < H; y += 8) for (let x = ((y - FL) / 8 % 2) * 8; x < W; x += 16) r(x, y, 8, 8, '#434354');
  r(0, FL, W, 2, '#22222c');
  return c;
};

// Dusty gravel for the used lot.
Art.gravel = function () {
  const c = mkCanvas(64, 64), g = c.getContext('2d'), R = rng(313);
  g.fillStyle = '#6b5f4e'; g.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 700; i++) { const v = R(); g.fillStyle = v < 0.4 ? '#5e5343' : v < 0.8 ? '#7a6d5a' : v < 0.95 ? '#8a7d68' : '#4a4236'; g.fillRect((R() * 64) | 0, (R() * 64) | 0, 1 + (R() < 0.2), 1); }
  return c;
};

// Coach Taka, the tutorial guide: full-face race helmet and a sponsor-patched racing jacket.
// frame 0 = idle, 1 = talking (head bob, visor glint moves), 2 = pointing
Art.guide = function (frame) {
  const key = 'guide' + frame;
  if (!this.cache[key]) {
    const W = 44, H = 52, c = mkCanvas(W, H), g = c.getContext('2d');
    const r = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const JR = '#d62d3a', JD = '#8e1c26', JB = '#1b1b22', JL = '#ff6b75', WH = '#f4f1ff';
    const bob = frame === 1 ? 1 : 0;
    // torso / jacket
    for (let y = 30; y < H; y++) { const hw = Math.min(17, 11 + (y - 30) * 0.6) | 0; r(22 - hw, y, hw * 2, 1, JR); r(22 - hw, y, 3, 1, JB); r(22 + hw - 3, y, 3, 1, JB); }
    r(21, 31, 2, H - 31, '#c7cbd6'); // zip
    r(15, 30, 6, 2, WH); r(23, 30, 6, 2, WH); r(16, 32, 4, 1, JB); r(24, 32, 4, 1, JB); // collar with stripe
    r(13, 37, 6, 4, '#ffd23d'); r(14, 38, 4, 2, JB); // sponsor patch
    r(26, 37, 7, 3, '#3df2ff'); r(27, 38, 5, 1, '#13283a'); // sponsor patch
    r(25, 42, 6, 3, WH); r(26, 43, 1, 1, JR); r(28, 43, 1, 1, JR); r(30, 43, 0, 1, JR); // number patch
    r(9, 46, 26, 1, JD); // jacket shading
    // arms
    r(5, 34, 5, 14, JR); r(5, 34, 5, 2, JL); r(5, 44, 5, 2, WH); r(5, 46, 5, 3, JB); // left arm, glove
    if (frame === 2) { // right arm raised and pointing right
      r(34, 30, 4, 6, JR); r(36, 26, 6, 5, JR); r(36, 26, 6, 1, JL); r(41, 25, 3, 4, JB); r(43, 26, 1, 2, JB);
    } else { r(34, 34, 5, 14, JR); r(34, 34, 5, 2, JL); r(34, 44, 5, 2, WH); r(34, 46, 5, 3, JB); }
    // neck
    r(18, 27 + bob, 8, 4, JB);
    // helmet: rounded shell
    const cx = 22, top = 3 + bob;
    for (let y = 0; y < 25; y++) { const t = (y - 11) / 13, hw = Math.round(12 * Math.sqrt(Math.max(0, 1 - t * t * (y < 11 ? 1 : 0.55)))); if (hw > 0) r(cx - hw, top + y, hw * 2, 1, WH); }
    for (let y = 0; y < 25; y++) { const t = (y - 11) / 13, hw = Math.round(12 * Math.sqrt(Math.max(0, 1 - t * t * (y < 11 ? 1 : 0.55)))); if (hw > 0) { r(cx - hw, top + y, 1, 1, '#9aa0ad'); r(cx + hw - 1, top + y, 1, 1, '#9aa0ad'); } }
    r(cx - 2, top, 4, 12, JR); r(cx - 4, top + 1, 1, 9, '#2b3fd6'); r(cx + 3, top + 1, 1, 9, '#2b3fd6'); // stripes over the top
    // visor
    r(cx - 9, top + 11, 18, 6, '#1c2238'); r(cx - 10, top + 12, 20, 4, '#1c2238'); r(cx - 9, top + 17, 18, 1, '#0d1020');
    const gl = frame === 1 ? 4 : 0; r(cx - 7 + gl, top + 12, 4, 1, '#9ff8ff'); r(cx - 6 + gl, top + 13, 2, 1, '#5aa0c0');
    // chin bar + vents
    r(cx - 7, top + 19, 14, 4, '#e3e0ee'); r(cx - 3, top + 20, 6, 1, JB); r(cx - 3, top + 22, 6, 1, JB);
    r(cx - 11, top + 14, 2, 3, JR); r(cx + 9, top + 14, 2, 3, JR); // visor pivots
    r(cx - 10, top + 7, 3, 2, '#ffd23d'); // sticker
    this.cache[key] = c.toDataURL();
  }
  return this.cache[key];
};

// Mechanic shop, seen from above like the cars: tool walls, chests, tyre stacks, oil drums and a neon sign.
Art.mechShop = function () {
  const W = 320, H = 180, c = mkCanvas(W, H), g = c.getContext('2d'), R = rng(8080);
  const r = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x | 0, y | 0, w | 0, h | 0); };
  const disc = (cx, cy, rr, col) => { g.fillStyle = col; g.beginPath(); g.arc(cx, cy, rr, 0, TAU); g.fill(); };
  // concrete floor with joints, stains and drain
  r(0, 0, W, H, '#55545f'); for (let i = 0; i < 2600; i++) r(R() * W, R() * H, 1, 1, R() < 0.5 ? '#5d5c68' : '#4d4c57');
  for (let x = 0; x < W; x += 80) r(x, 24, 1, H, '#46454f'); for (let y = 24; y < H; y += 52) r(0, y, W, 1, '#46454f');
  for (let i = 0; i < 10; i++) { g.fillStyle = 'rgba(12,10,18,.3)'; g.beginPath(); g.ellipse(20 + R() * 280, 40 + R() * 130, 5 + R() * 12, 3 + R() * 6, R() * 3, 0, TAU); g.fill(); }
  r(150, 168, 20, 6, '#2b2b33'); for (let x = 151; x < 170; x += 2) r(x, 169, 1, 4, '#121218');
  // back wall with pegboards and a neon sign
  r(0, 0, W, 24, '#2b2842'); r(0, 22, W, 2, '#1a1829');
  for (const px0 of [8, 216]) { r(px0, 3, 96, 16, '#b98a52'); for (let y = 5; y < 18; y += 3) for (let x = px0 + 2; x < px0 + 95; x += 3) r(x, y, 1, 1, '#8e6538');
    for (let i = 0; i < 9; i++) { r(px0 + 6 + i * 10, 5, 2, 9 + (i % 3) * 2, i % 2 ? '#c7cbd6' : '#9aa0ad'); r(px0 + 5 + i * 10, 4, 4, 2, '#c7cbd6'); } }
  const FONT = {M: '101111111101101', E: '111100110100111', C: '111100100100111', H: '101101111101101', A: '010101111101101', N: '110101101101101', I: '111010010010111'};
  const word = 'MECHANIC', sx0 = 124, sy0 = 6;
  for (const [col, off] of [['rgba(255,123,45,.35)', 1], ['#ffb37a', 0]]) { g.fillStyle = col;
    [...word].forEach((ch, i) => { const f = FONT[ch]; for (let k = 0; k < 15; k++) if (f[k] === '1') g.fillRect(sx0 + i * 9 + (k % 3) * 2 - off, sy0 + ((k / 3) | 0) * 2 - off, 2 + off * 2, 2 + off * 2); }); }
  // red tool chests along the left, seen from above
  for (const [x, y] of [[6, 32], [6, 70]]) { r(x, y, 26, 30, '#c0392b'); r(x, y, 26, 2, '#e05545'); for (let k = 0; k < 4; k++) r(x + 3, y + 6 + k * 6, 20, 1, '#7d1f17'); r(x + 2, y + 1, 22, 1, '#ff7a6a'); }
  r(38, 40, 14, 22, '#3a3a46'); r(40, 42, 10, 8, '#22222c'); r(41, 52, 8, 2, '#f2c230'); // tool cart
  // tyre stacks and oil drums on the right
  for (const [x, y] of [[292, 44], [292, 70], [270, 150], [296, 150]]) { disc(x, y, 11, '#141418'); disc(x, y, 6, '#2c2c33'); disc(x, y, 3, '#8d93a0'); }
  for (const [x, y, col] of [[266, 40, '#2b6cb0'], [266, 62, '#1f8a4c']]) { disc(x, y, 8, col); disc(x, y, 6, shade(col, 1.25)); disc(x + 2, y - 2, 1.5, '#222'); }
  // air compressor and hose
  r(12, 140, 24, 16, '#f2c230'); r(14, 142, 20, 4, '#d4a514'); disc(24, 150, 3, '#333');
  g.strokeStyle = '#1c1c22'; g.lineWidth = 2; g.beginPath(); g.moveTo(36, 148); g.bezierCurveTo(60, 170, 90, 130, 110, 160); g.stroke();
  // lift posts at the bay
  for (const [x, y] of [[74, 34], [238, 34], [74, 150], [238, 150]]) { r(x, y, 8, 8, '#3a3a46'); r(x + 1, y + 1, 6, 6, '#8d93a0'); r(x + 3, y + 3, 2, 2, '#222'); }
  return c;
};
