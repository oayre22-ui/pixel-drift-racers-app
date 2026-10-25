// ===== Online multiplayer =====
// The host's game is the server: friends connect to it straight from their browser (WebRTC through PeerJS).
// Everyone drives their own car; positions are shared about 20 times a second and the host passes them on.
const NET_PREFIX = 'pxdriftracers-', NET_MAX = 8, NET_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const Net = {
  peer: null, host: false, isPublic: true, beatT: 0, list: null, listErr: '', listT: 0, code: '', conns: {}, players: {}, cfg: null, myId: '', status: '', err: '', sendT: 0, hostConn: null,
  opts() { return Object.assign({debug: 0}, window.NET_SERVER || {}); }, // NET_SERVER lets tests point at a local signalling server
  name() { return String(SAVE.settings.name || 'Driver').replace(/[<>&"]/g, '').slice(0, 14) || 'Driver'; },
  look() { const cs = SAVE.cars[SAVE.current]; return {id: cs.id, paint: cs.paint, stripe: cs.stripe, stripeColor: cs.stripeColor, spoiler: cs.spoiler, hood: cs.hood, glow: cs.glow, kit: cs.kit, livery: cs.livery, body: cs.body}; },
  // only trust a few known fields from other players
  cleanLook(l) {
    l = l || {}; const cs = newCarState(CAR_BY_ID[l.id] ? l.id : CARS[0].id), int = (v, n) => clamp(Math.floor(+v || 0), 0, n), col = v => /^#[0-9a-fA-F]{3,8}$/.test(v || '') ? v : null;
    cs.paint = col(l.paint) || cs.paint; cs.stripeColor = col(l.stripeColor) || cs.stripeColor; cs.stripe = int(l.stripe, 3); cs.spoiler = int(l.spoiler, COSMETICS.spoiler.opts.length - 1);
    cs.hood = int(l.hood, COSMETICS.hood.opts.length - 1); cs.glow = int(l.glow, COSMETICS.glow.opts.length - 1); cs.kit = int(l.kit, carKits(cs.id).length - 1); cs.livery = int(l.livery, LIVERIES.length - 1);
    cs.body = clamp(+l.body || 100, 0, 100); return cs;
  },
  cleanCfg(c) { c = c || {}; return {track: TRACKS[c.track] ? c.track : 'lot', weather: WEATHER[c.weather] ? c.weather : 'clear'}; },
  cleanName(n) { return String(n || 'Driver').replace(/[<>&"]/g, '').slice(0, 14) || 'Driver'; },
  newCode() { let c = ''; for (let i = 0; i < 5; i++) c += NET_CODE_CHARS[(Math.random() * NET_CODE_CHARS.length) | 0]; return c; },
  setStatus(s, err) { this.status = s; this.err = err || ''; if (UI.screen === 'online') UI.online(); },
  ready() { return typeof Peer === 'function'; },
  // public server list (a small Netlify function); only there when the game is on a website
  lobbyURL() { return window.NET_LOBBY || (/^https?:$/.test(location.protocol) ? '/api/rooms' : ''); },
  beat() {
    clearTimeout(this.beatT); const u = this.lobbyURL(); if (!this.host || !this.isPublic || !u || !this.cfg) return;
    fetch(u, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({code: this.code, name: this.name(), map: this.cfg.track, weather: this.cfg.weather, players: Object.keys(this.players).length + 1, max: NET_MAX})}).catch(() => {});
    this.beatT = setTimeout(() => this.beat(), 12000);
  },
  unlist(code) { const u = this.lobbyURL(); clearTimeout(this.beatT); if (u && code) try { fetch(u + '?code=' + code, {method: 'DELETE', keepalive: true}).catch(() => {}); } catch (e) {} },
  refreshList() {
    const u = this.lobbyURL(); if (!u) { this.list = null; this.listErr = 'The server list works once the game is on the website. You can still join with a code.'; return; }
    this.listT = Date.now();
    fetch(u).then(r => r.json()).then(d => { this.list = (d.rooms || []).filter(r => r.code !== this.code); this.listErr = ''; UI.showSrvList(); })
      .catch(() => { this.listErr = 'Could not load the server list.'; UI.showSrvList(); });
  },

  hostRoom(cfg, tries = 0) {
    this.leave(true); if (!this.ready()) return this.setStatus('', 'Online play could not load.');
    this.code = this.newCode(); this.cfg = cfg; this.setStatus('Opening your server...');
    const p = this.peer = new Peer(NET_PREFIX + this.code, this.opts());
    p.on('open', () => { this.host = true; this.myId = 'host'; this.setStatus('Hosting'); this.beat(); this.start(); });
    p.on('connection', c => this.accept(c));
    p.on('error', e => { if (e.type === 'unavailable-id' && tries < 3) return this.hostRoom(cfg, tries + 1); this.fail(e); });
    p.on('disconnected', () => { if (this.peer === p && !p.destroyed) try { p.reconnect(); } catch (e) {} });
  },
  accept(c) {
    c.on('data', m => this.onHost(c, m));
    c.on('close', () => this.drop(c.peer)); c.on('error', () => this.drop(c.peer));
  },
  onHost(c, m) {
    if (!m || typeof m !== 'object') return;
    if (m.t === 'hi') {
      if (Object.keys(this.players).length >= NET_MAX - 1) { c.send({t: 'full'}); setTimeout(() => c.close(), 300); return; }
      const pl = this.addPlayer(c.peer, m.name, m.look); this.conns[c.peer] = c;
      c.send({t: 'welcome', you: c.peer, cfg: this.cfg, players: [{id: 'host', name: this.name(), look: this.look()}].concat(Object.values(this.players).filter(q => q.id !== c.peer).map(q => ({id: q.id, name: q.name, look: q.look})))});
      this.sendAll({t: 'join', id: c.peer, name: pl.name, look: m.look}, c.peer); this.joined(pl); this.beat();
    } else if (m.t === 's') { this.onState(c.peer, m); m.id = c.peer; this.sendAll(m, c.peer); }
    else if (m.t === 'look') { this.setLook(c.peer, m.look); this.sendAll({t: 'look', id: c.peer, look: m.look}, c.peer); }
  },
  drop(id) {
    if (!this.conns[id] && !this.players[id]) return;
    const pl = this.players[id]; delete this.conns[id]; delete this.players[id];
    if (this.host) { this.sendAll({t: 'left', id}); this.beat(); }
    if (pl) { const s = Game.session; if (s && s.mode === 'online') s.pop(pl.name + ' left', '#9a94c8'); } if (UI.screen === 'online') UI.online();
  },

  joinRoom(code) {
    code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length !== 5) return this.setStatus('', 'Room codes are 5 letters and numbers.');
    this.leave(true); if (!this.ready()) return this.setStatus('', 'Online play could not load.');
    this.code = code; this.setStatus('Looking for room ' + code + '...');
    const p = this.peer = new Peer(undefined, this.opts());
    p.on('open', () => {
      const c = this.hostConn = p.connect(NET_PREFIX + code, {reliable: true});
      c.on('open', () => { this.setStatus('Joining...'); c.send({t: 'hi', name: this.name(), look: this.look()}); });
      c.on('data', m => this.onClient(m));
      c.on('close', () => { if (this.peer === p) { this.leave(true); this.setStatus('', 'The host closed the room.'); if (UI.screen === 'game') { Game.paused = false; Game.session = null; UI.go('online'); } } });
      setTimeout(() => { if (this.peer === p && !this.myId) { this.leave(true); this.setStatus('', 'Could not reach room ' + code + '. Check the code and try again.'); } }, 15000);
    });
    p.on('error', e => this.fail(e));
  },
  onClient(m) {
    if (!m || typeof m !== 'object') return;
    if (m.t === 'welcome') { this.myId = m.you; this.cfg = this.cleanCfg(m.cfg); for (const q of m.players || []) this.addPlayer(q.id, q.name, q.look); this.setStatus('Connected'); this.start(); }
    else if (m.t === 'full') { this.leave(true); this.setStatus('', 'That room is full (' + NET_MAX + ' players).'); }
    else if (m.t === 'join') { const pl = this.addPlayer(m.id, m.name, m.look); this.joined(pl); }
    else if (m.t === 'left') this.drop(m.id);
    else if (m.t === 'cfg') { this.cfg = this.cleanCfg(m.cfg); this.start(); }
    else if (m.t === 's' && m.id) this.onState(m.id, m);
    else if (m.t === 'look' && m.id) this.setLook(m.id, m.look);
  },
  fail(e) {
    const t = e && e.type, msg = t === 'peer-unavailable' ? 'Room ' + this.code + ' was not found. Check the code.' : t === 'network' || t === 'server-error' || t === 'socket-error' ? 'Could not reach the online server. Check your internet.'
      : t === 'browser-incompatible' ? 'This browser does not support online play.' : 'Connection problem' + (t ? ' (' + t + ')' : '') + '.';
    const wasIn = UI.screen === 'game' && Game.session && Game.session.mode === 'online';
    this.leave(true); this.setStatus('', msg); if (wasIn) { Game.paused = false; Game.session = null; UI.go('online'); }
  },
  leave(quiet) {
    try { for (const c of Object.values(this.conns)) c.close(); if (this.hostConn) this.hostConn.close(); } catch (e) {}
    if (this.host) this.unlist(this.code);
    const p = this.peer; this.peer = null; if (p) try { p.destroy(); } catch (e) {}
    this.host = false; this.conns = {}; this.players = {}; this.myId = ''; this.hostConn = null; this.cfg = null;
    if (!quiet) this.setStatus('');
  },

  addPlayer(id, name, look) {
    const cs = this.cleanLook(look), pl = this.players[id] = {id, name: this.cleanName(name), look, score: 0, car: null};
    pl.car = this.makeCar(cs, pl); return pl;
  },
  setLook(id, look) { const pl = this.players[id]; if (!pl) return; const old = pl.car; pl.look = look; pl.car = this.makeCar(this.cleanLook(look), pl); if (old) Object.assign(pl.car, {x: old.x, y: old.y, th: old.th, tx: old.tx, ty: old.ty, tth: old.tth, seen: old.seen}); },
  makeCar(cs, pl) {
    const sprite = makeCarSprite(cs);
    return {cs, pl, sprite, shadow: makeShadow(sprite), glow: cs.glow ? makeGlow(sprite, COSMETICS.glow.opts[cs.glow]) : 0, x: 0, y: 0, th: 0, tx: 0, ty: 0, tth: 0, vx: 0, vy: 0, v: 0,
      slipR: 0, beta: 0, hand: 0, nosOn: false, gear: 3, surf: 0, seen: false, last: 0, get speed() { return this.v; }, get spec() { return {}; }};
  },
  joined(pl) { const s = Game.session; if (s && s.mode === 'online') s.pop(pl.name + ' joined!', '#5dff6a'); Sfx.beep(880, 0.1); if (UI.screen === 'online') UI.online(); },
  onState(id, m) {
    const pl = this.players[id]; if (!pl || !pl.car) return; const c = pl.car, num = v => isFinite(+v) ? +v : 0;
    c.tx = num(m.x); c.ty = num(m.y); c.tth = num(m.th); c.vx = num(m.vx); c.vy = num(m.vy); c.v = Math.hypot(c.vx, c.vy); c.slipR = num(m.sl); c.hand = m.h ? 1 : 0; c.nosOn = !!m.n;
    pl.score = Math.max(0, Math.floor(num(m.sc))); pl.combo = Math.max(0, Math.floor(num(m.d))); c.last = performance.now();
    if (!c.seen || Math.hypot(c.tx - c.x, c.ty - c.y) > 200) { c.x = c.tx; c.y = c.ty; c.th = c.tth; c.seen = true; } // first sighting or respawn: snap
  },

  start() {
    if (!this.cfg) return; const cfg = {mode: 'online', track: TRACKS[this.cfg.track] ? this.cfg.track : 'lot', weather: WEATHER[this.cfg.weather] ? this.cfg.weather : 'clear'};
    for (const pl of Object.values(this.players)) if (pl.car) pl.car.seen = false;
    const d = document.getElementById('pausemenu'); if (d) d.remove();
    UI.startSession(cfg);
  },
  setCfg(cfg) { if (!this.host) return; this.cfg = cfg; this.sendAll({t: 'cfg', cfg}); this.beat(); this.start(); },
  sendAll(m, except) { for (const [id, c] of Object.entries(this.conns)) if (id !== except && c.open) try { c.send(m); } catch (e) {} },
  send(m) { if (this.host) this.sendAll(Object.assign({id: 'host'}, m)); else if (this.hostConn && this.hostConn.open) try { this.hostConn.send(m); } catch (e) {} },
  // called every physics step while driving online
  tick(s, dt) {
    const p = s.player; this.sendT += dt; if (this.sendT < 0.05 || !p) return; this.sendT = 0;
    const r = v => Math.round(v * 100) / 100, d = s.drift;
    this.send({t: 's', x: r(p.x), y: r(p.y), th: r(p.th), vx: r(p.vx), vy: r(p.vy), sl: r(p.slipR), h: p.hand ? 1 : 0, n: p.nosOn ? 1 : 0, sc: d.total, d: d.active ? Math.round(d.pts * d.mult) : 0});
  },
  // smooth other players towards their latest position
  remotes(dt) {
    const out = [], now = performance.now();
    for (const pl of Object.values(this.players)) { const c = pl.car; if (!c || !c.seen) continue;
      const age = Math.min(0.25, (now - c.last) / 1000); // predict a little ahead from their speed
      const px = c.tx + c.vx * PPM * age, py = c.ty + c.vy * PPM * age, k = Math.min(1, dt * 14);
      c.x += (px - c.x) * k; c.y += (py - c.y) * k; c.th += wrapAng(c.tth - c.th) * k; c.beta = c.slipR;
      if (now - c.last < 5000) out.push(c); }
    return out;
  },
  roster() { return [{id: this.myId || 'me', name: this.name() + ' (you)', score: Game.session && Game.session.mode === 'online' ? Game.session.drift.total : 0, me: true}].concat(Object.values(this.players)).sort((a, b) => b.score - a.score); },
};

window.addEventListener('pagehide', () => { if (Net.host) Net.unlist(Net.code); });
