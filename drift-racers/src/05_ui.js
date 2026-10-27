// ===== UI =====
const $ui = document.getElementById('ui'), $touch = document.getElementById('touch');
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const kw2hp = w => Math.round(w / 1000 * 1.341);
const spdU = v => SAVE.settings.units === 'mph' ? Math.round(v * 2.237) : Math.round(v * 3.6);
const unitN = () => SAVE.settings.units === 'mph' ? 'MPH' : 'KM/H';

const UI = {
  screen: 'main', gTab: 'cars', partCat: 'engine', dealerSel: null, lastCfg: null, hudEls: null,
  set(html) { $ui.innerHTML = html; this.hudEls = null; },
  cashTag() { return `<div class="cash">${fmtMoney(SAVE.cash)}</div>`; },
  back(to) { return `<button data-a="go" data-to="${to || 'main'}">&lt; Back</button>`; },
  toast(msg) { for (const o of document.querySelectorAll('.toast')) o.remove(); const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 1800); },
  ensureAttract() {
    if (!Game.session || !Game.session.attract) { const ids = Object.keys(TRACKS); Game.session = new Session({mode: 'attract', track: ids[(Math.random() * ids.length) | 0]}); }
    Game.paused = false; this.refreshTouch();
  },
  go(to, arg) {
    this.screen = to;
    if (to !== 'game') this.ensureAttract();
    Sfx.beep(520, 0.04, 'square', 0.05);
    ({main: () => this.main(), events: () => this.events(), free: () => this.free(), garage: () => this.garage(arg), dealer: () => { this.lotOpen = false; this.dealer(); }, settings: () => this.settings(), online: () => { Game.netMenu = false; Net.list = null; Net.refreshList(); this.online(); }, mechanic: () => { this.mzone = null; this.mMode = arg || 'repair'; this.dynoOpen = false; this.mechanic(); }, used: () => { this.usedSel = null; this.used(); }, shop: () => { this.shopSel = null; this.shop(); }, cashpacks: () => this.cashpacks()})[to]();
  },

  main() {
    const cs = SAVE.cars[SAVE.current], sp = buildSpec(cs);
    this.set(`<div class="screen clear">
      <div style="margin-top:auto;margin-bottom:auto">
        <h1 class="title">PIXEL DRIFT<br><span>RACERS</span></h1>
        <div class="sub">Driving: ${esc(CAR_BY_ID[cs.id].name)} &middot; PR ${rating(sp)} &middot; Condition <span style="color:${carHealth(cs) > 60 ? 'var(--green)' : carHealth(cs) > 30 ? 'var(--gold)' : 'var(--red)'}">${carHealth(cs)}%</span> &middot; <span style="color:var(--gold)">${fmtMoney(SAVE.cash)}</span></div>
        <div class="menu">
          <button class="hot" data-a="go" data-to="events">Career Events</button>
          <button data-a="go" data-to="free">Free Drift</button>
          <button data-a="go" data-to="garage">Garage</button>
          <button data-a="go" data-to="shop">Parts Shop</button>
          ${IAP.enabled ? '<button data-a="go" data-to="cashpacks" style="color:var(--gold)">$ Cash Packs</button>' : ''}
          <button data-a="go" data-to="mechanic">Mechanic &amp; Tuning${carHealth(cs) < 50 ? ' <span style="color:var(--red)">!</span>' : ''}</button>
          <button data-a="go" data-to="dealer">Car Dealer</button>
          <button data-a="go" data-to="online">Online${Net.peer ? ' <span style="color:var(--green)">&#9679;</span>' : ''}</button>
          <button data-a="go" data-to="settings">Settings</button>
        </div>
        <div class="portrait-hint">Turn your phone sideways for the best view.</div>
        ${Store.persistent ? '' : '<div class="sub">Progress can\'t be saved in this view, so it resets when you close it.</div>'}
      </div></div>`);
  },

  cashpacks() {
    const cards = CASH_PACKS.map(p => `<div class="card">${p.tag ? `<span class="badge" style="color:var(--gold);border-color:var(--gold)">${p.tag}</span>` : ''}<h3>${esc(p.n)}</h3>
      <div class="meta"><span class="price" style="font-size:20px">${fmtMoney(p.cash)}</span> in-game cash</div>
      <div class="row" style="margin-top:8px"><button class="hot" data-a="iapbuy" data-id="${p.id}" ${IAP.busy || !IAP.ready ? 'disabled' : ''}>${IAP.busy === p.id ? 'Buying...' : esc(IAP.price(p))}</button></div></div>`).join('');
    this.set(`<div class="screen"><div class="top">${this.back()}<h2>Cash Packs</h2>${this.cashTag()}</div>
      ${IAP.test ? '<div class="sub" style="margin:0 0 8px;color:var(--gold)">TEST MODE: no real money is charged.</div>' : ''}
      <div class="sub" style="margin:0 0 8px">Cash goes straight to your wallet. Spend it on cars, parts and repairs.${IAP.ready ? '' : ' Connecting to the store...'}</div><div class="grid">${cards}</div></div>`);
  },

  events() {
    const sp = buildSpec(SAVE.cars[SAVE.current]), pr = rating(sp);
    const f = this.evFilter || 'all';
    const tabs = ['all', 'drift', 'tandem', 'race'].map(t => `<button class="${f === t ? 'sel' : ''}" data-a="evf" data-t="${t}">${t}</button>`).join('');
    const cards = EVENTS.filter(ev => f === 'all' || ev.type === f).map(ev => {
      const T = TRACKS[ev.track], b = SAVE.best[ev.id], fee = ev.fee || 0;
      let best = '<span style="color:var(--dim)">Not attempted</span>';
      if (b && ev.type === 'race') best = `Best: ${b.pos === 1 ? '<span style="color:var(--gold)">1st</span>' : ordinal(b.pos)}`;
      if (b && ev.type !== 'race') best = `Best: <span class="medal m${b.medal}"></span>${b.score.toLocaleString()}`;
      const rew = ev.type === 'race' ? `1st ${fmtMoney(ev.reward[0])}` : `Gold ${fmtMoney(ev.reward[2])}`;
      const warn = pr < ev.pr ? 'color:var(--red)' : 'color:var(--green)';
      const ai = ev.type === 'race' ? ' &middot; vs ' + ev.ai + ' racers' : ev.type === 'tandem' ? ' &middot; chase the lead car' : '';
      const wk = eventWeather(ev), wx = WEATHER[wk];
      return `<div class="card"><span class="badge b-${ev.type}">${ev.type}</span><span class="badge" style="color:var(--dim)">${ev.laps} lap${ev.laps > 1 ? 's' : ''}</span><span class="badge wx" style="color:${wx.col};border-color:${wx.col}" title="${esc(wx.d)}">${wxIcon(wk)} ${wx.n}${wx.pay > 1 ? ' +' + Math.round((wx.pay - 1) * 100) + '%' : ''}</span>
        <h3>${esc(ev.name)}</h3><div class="meta">${esc(T.name)}${ai}<br>
        Reward: <span class="price">${rew}</span> &middot; Entry: ${fee ? `<span style="color:${SAVE.cash >= fee ? 'var(--ink)' : 'var(--red)'}">${fmtMoney(fee)}</span>` : '<span style="color:var(--green)">FREE</span>'}<br>Recommended PR <span style="${warn}">${ev.pr}</span><br>${best}</div>
        <div class="row" style="margin-top:8px"><button class="hot" data-a="start" data-ev="${ev.id}" ${SAVE.cash < fee ? 'disabled' : ''}>${fee ? 'Enter ' + fmtMoney(fee) : 'Start'}</button></div></div>`;
    }).join('');
    this.set(`<div class="screen"><div class="top">${this.back()}<h2>Career</h2><span class="sub" style="margin:0">Your PR: ${pr}</span>${this.cashTag()}</div><div class="tabs">${tabs}</div>
      <div class="sub" style="margin:0 0 8px">Drift events are free. Races and tandems cost an entry fee but pay big. Bad weather pays a cash bonus, and the weather changes after every event.</div><div class="grid">${cards}</div></div>`);
  },

  free() {
    const cards = Object.entries(TRACKS).map(([id, t]) => `<div class="card mapcard" data-a="startfree" data-tr="${id}"><img class="mapimg" src="${trackThumb(id)}" alt=""><span class="badge b-free">free</span><h3>${esc(t.name)}</h3>
      <div class="meta">No timer, no pressure. Practise your lines and tune your car.</div><div class="row" style="margin-top:8px"><button class="ok" data-a="startfree" data-tr="${id}">Drive</button></div></div>`).join('');
    const fw = this.freeWx || 'clear', wxs = [...Object.keys(WEATHER), 'random'].map(k => `<button class="${fw === k ? 'sel' : ''}" data-a="fwx" data-w="${k}" ${WEATHER[k] ? `style="color:${WEATHER[k].col}"` : ''}>${k === 'random' ? '? Random' : wxIcon(k) + ' ' + WEATHER[k].n}</button>`).join('');
    this.set(`<div class="screen"><div class="top">${this.back()}<h2>Free Drift</h2>${this.cashTag()}</div><div class="sub" style="margin:0 0 4px">Weather</div><div class="tabs wxpick">${wxs}</div>
      <div class="sub" style="margin:0 0 8px">${fw === 'random' ? 'A surprise every time you drive.' : esc(WEATHER[fw].d.replace(/ \+\d+% cash/, ''))}</div><div class="grid">${cards}</div></div>`);
  },

  srvList(busy) { return Net.list && Net.list.length ? `<div class="list" style="margin-top:6px">${Net.list.map(r => `<div class="item srv"><img src="${TRACKS[r.map] ? trackThumb(r.map) : ''}" alt=""><div class="nm">${esc(r.name)}'s server<small>${esc(TRACKS[r.map] ? TRACKS[r.map].name : r.map)} &middot; <span style="color:${WEATHER[r.weather] ? WEATHER[r.weather].col : 'var(--dim)'}">${WEATHER[r.weather] ? WEATHER[r.weather].n : ''}</span> &middot; ${r.players}/${r.max}</small></div><button class="ok" data-a="njoin" data-code="${esc(r.code)}" ${busy || r.players >= r.max ? 'disabled' : ''}>${r.players >= r.max ? 'Full' : 'Join'}</button></div>`).join('')}</div>`
            : `<div class="meta" style="margin-top:6px">${esc(Net.listErr || (Net.list ? 'No servers right now. Host one!' : 'Loading...'))}</div>`; },
  showSrvList() { const el = document.getElementById('srvlist'); if (el && this.screen === 'online') el.innerHTML = this.srvList(!!(Net.peer && !Net.myId)); },
  saveNetName() { const i = document.getElementById('nname'); if (i) { SAVE.settings.name = Net.cleanName(i.value); persist(); } },
  mapGrid(sel, act) { return `<div class="mapgrid">${Object.entries(TRACKS).map(([id, t]) => `<div class="mapcard ${sel === id ? 'sel' : ''}" data-a="${act}" data-tr="${id}"><img class="mapimg" src="${trackThumb(id)}" alt=""><div class="mapn">${esc(t.name)}</div></div>`).join('')}</div>`; },
  wxRow(sel, act) { return `<div class="tabs wxpick">${Object.keys(WEATHER).map(k => `<button class="${sel === k ? 'sel' : ''}" data-a="${act}" data-w="${k}" style="color:${WEATHER[k].col}">${wxIcon(k)} ${WEATHER[k].n}</button>`).join('')}</div>`; },
  // ---- online: host a room or join one with a code ----
  online() {
    this.screen = 'online';
    const on = !!(Net.peer && Net.myId), busy = !!(Net.peer && !Net.myId), map = this.mapSel || (Net.cfg && Net.cfg.track) || 'lot', wx = this.netWx || (Net.cfg && Net.cfg.weather) || 'clear';
    this.mapSel = map; this.netWx = wx;
    const err = Net.err ? `<div class="card" style="border-color:var(--red);color:var(--red);margin-bottom:8px">${esc(Net.err)}</div>` : '';
    let body;
    if (on) {
      const ppl = Net.roster().map(q => `<div class="item"><div class="nm">${esc(q.name)}<small>${q.id === 'host' || (q.me && Net.host) ? 'Host' : 'Driver'}</small></div><span style="color:var(--gold)">${q.score.toLocaleString()}</span></div>`).join('');
      body = `<div class="split"><div class="left" style="overflow-y:auto"><div class="card"><div class="meta">${Net.host ? 'You are hosting. Tell your friends this room code:' : 'You are in room:'}</div>
          <div class="roomcode" data-a="ncopy" title="Copy">${esc(Net.code)}</div><div class="meta">Map: <b>${esc(TRACKS[Net.cfg.track].name)}</b> &middot; Weather: <b style="color:${WEATHER[Net.cfg.weather].col}">${WEATHER[Net.cfg.weather].n}</b></div>
          <div class="row" style="margin-top:8px"><button class="hot" data-a="ndrive">Drive</button><button data-a="netleave">${Net.host ? 'Close room' : 'Leave room'}</button></div></div>
          <div class="sub" style="margin:8px 0 4px">Players (${Object.keys(Net.players).length + 1}/${NET_MAX})</div><div class="list">${ppl}</div></div>
        <div class="right">${Net.host ? `<div class="sub" style="margin:0 0 4px">Change map</div>${this.mapGrid(map, 'nmap')}<div class="sub" style="margin:6px 0 4px">Weather</div>${this.wxRow(wx, 'nwx')}
          <button class="gold" data-a="napply" style="margin-top:6px">Switch everyone to ${esc(TRACKS[map].name)} &middot; ${WEATHER[wx].n}</button>` : '<div class="card"><div class="meta">The host picks the map and weather. When they change it, you will be moved there.</div></div>'}</div></div>`;
    } else {
      body = `${err}<div class="split"><div class="left" style="overflow-y:auto"><div class="card" style="margin-bottom:8px"><div class="row" style="align-items:center"><h3 style="margin:0">Public servers</h3><button data-a="nrefresh" style="margin-left:auto">Refresh</button></div>
          <div id="srvlist">${this.srvList(busy)}</div></div><div class="card"><h3 style="margin:0 0 6px">Your name</h3><input id="nname" class="ninput" maxlength="14" value="${esc(Net.name())}" autocomplete="off"></div>
          <div class="card" style="margin-top:8px"><h3 style="margin:0 0 6px">Join a room</h3><div class="meta">Type the 5 letter code from your friend.</div>
          <div class="row" style="margin-top:6px"><input id="ncode" class="ninput" maxlength="5" placeholder="CODE" autocomplete="off" style="text-transform:uppercase;width:110px;letter-spacing:3px"><button class="hot" data-a="njoin" ${busy ? 'disabled' : ''}>Join</button></div></div>
          ${busy || Net.status ? `<div class="sub" style="margin-top:8px;color:var(--gold)">${esc(Net.status)}</div>` : ''}

          <div class="sub" style="margin-top:8px">Everyone drives their own car in Free Drift together, with a live drift leaderboard. No damage online.</div></div>
        <div class="right"><div class="card"><h3 style="margin:0 0 6px">Host a server</h3><div class="sub" style="margin:0 0 4px">Pick a map</div>${this.mapGrid(map, 'nmap')}
          <div class="sub" style="margin:6px 0 4px">Weather</div>${this.wxRow(wx, 'nwx')}
          <label class="sub" style="display:flex;gap:6px;align-items:center;margin:8px 0 0;cursor:pointer"><input type="checkbox" id="npub" ${Net.isPublic ? 'checked' : ''}> Public: show in the server list so anyone can join</label><button class="gold" data-a="nhost" style="margin-top:8px" ${busy ? 'disabled' : ''}>Host ${esc(TRACKS[map].name)}</button></div></div></div>`;
    }
    const conn = busy ? `<div class="lotcard"><div class="panel" style="width:min(420px,100%);text-align:center"><h3 style="margin:0 0 8px"><span class="spin"></span>${Net.host || /Opening/.test(Net.status) ? 'Starting server' : 'Connecting'}</h3><div class="meta">${esc(Net.status || 'Please wait...')}</div><div class="lbar"><i style="width:100%;animation:lpulse 1s steps(5) infinite"></i></div><button data-a="netleave">Cancel</button></div></div>` : '';
    this.set(`<div class="screen"><div class="top">${this.back()}<h2>Online</h2>${this.cashTag()}</div>${body}</div>${conn}`);
    clearInterval(this.listTimer); if (!on) this.listTimer = setInterval(() => { if (this.screen === 'online' && !(Net.peer && Net.myId)) Net.refreshList(); else clearInterval(this.listTimer); }, 8000);
  },

  // ---- garage ----
  preview(cs, bay) {
    const pv = document.getElementById('pv'), spr = makeCarSprite(cs);
    const bw = Math.max(200, pv.clientWidth - 20), bh = Math.max(110, pv.clientHeight - 30), P = 6;
    const sc = Math.max(3, Math.floor(Math.min(bw * 0.85 / (spr.width + P * 2), bh * 0.9 / (spr.height + P * 2))));
    const c = mkCanvas((spr.width + P * 2) * sc, (spr.height + P * 2) * sc), g = c.getContext('2d'), o = sc * P;
    g.imageSmoothingEnabled = false;
    if (bay) { // top-down service bay: concrete, yellow bay lines, lift pads under the wheels
      const R = rng(9); g.fillStyle = '#585766'; g.fillRect(0, 0, c.width, c.height);
      for (let i = 0; i < c.width * c.height / (sc * sc * 3); i++) { g.fillStyle = R() < 0.5 ? '#615f70' : '#4f4e5c'; g.fillRect(((R() * c.width / sc) | 0) * sc, ((R() * c.height / sc) | 0) * sc, sc, sc); }
      g.fillStyle = '#f2c230'; g.fillRect(sc, sc, c.width - sc * 2, sc); g.fillRect(sc, c.height - sc * 2, c.width - sc * 2, sc);
      for (let x = sc; x < c.width - sc; x += sc * 4) { g.fillStyle = '#111'; g.fillRect(x, sc, sc * 2, sc); g.fillRect(x, c.height - sc * 2, sc * 2, sc); }
      const L = CAR_BY_ID[cs.id].len, Wd = CAR_BY_ID[cs.id].wid;
      for (const ax of [Math.round(L * 0.2), Math.round(L * 0.76)]) for (const y of [-2, Wd + 1]) { g.fillStyle = '#2a2a33'; g.fillRect(o + (3 + ax - 2) * sc, o + (3 + y) * sc, 5 * sc, 2 * sc); g.fillStyle = '#c0392b'; g.fillRect(o + (3 + ax - 1) * sc, o + (3 + y) * sc, 3 * sc, sc); }
    }
    if (cs.glow) { const gl = makeGlow(spr, COSMETICS.glow.opts[cs.glow]); g.drawImage(gl, o - 10 * sc, o - 10 * sc, gl.width * sc, gl.height * sc); }
    g.drawImage(makeShadow(spr), o + sc, o + sc, spr.width * sc, spr.height * sc);
    g.drawImage(spr, o, o, spr.width * sc, spr.height * sc);
    pv.appendChild(c);
  },
  statsHTML(sp, cmp) {
    const top = topSpeed(sp), rows = [
      ['Power', kw2hp(sp.power) + ' hp', sp.power / 900000, cmp && cmp.power / 900000],
      ['Weight', Math.round(sp.mass) + ' kg', 1 - (sp.mass - 600) / 1400, cmp && 1 - (cmp.mass - 600) / 1400],
      ['Grip', ((sp.muF + sp.muR) / 2).toFixed(2) + ' g', ((sp.muF + sp.muR) / 2 - 0.6) / 1, cmp && ((cmp.muF + cmp.muR) / 2 - 0.6)],
      ['Top Speed', spdU(top) + ' ' + unitN().toLowerCase(), top / 110, cmp && topSpeed(cmp) / 110],
      ['Steer Lock', Math.round(sp.steerMax * 180 / Math.PI) + ' deg', (sp.steerMax * 180 / Math.PI - 20) / 50, cmp && (cmp.steerMax * 180 / Math.PI - 20) / 50],
      ['Diff Lock', Math.round(sp.lock * 100) + '%', sp.lock, cmp && cmp.lock],
    ];
    return `<div class="stats">${rows.map(r => `<span>${r[0]}</span><div class="bar"><i style="width:${clamp(r[2], 0.02, 1) * 100}%"></i>${r[3] != null && r[3] > r[2] ? `<b style="left:${clamp(r[2], 0, 1) * 100}%;width:${clamp(r[3] - r[2], 0, 1) * 100}%"></b>` : ''}</div><span>${r[1]}</span>`).join('')}</div>`;
  },
  garage(tab) {
    if (tab && ['cars', 'parts', 'paint'].includes(tab)) this.gTab = tab;
    if (!['cars', 'parts', 'paint'].includes(this.gTab)) this.gTab = 'cars';
    const cs = SAVE.cars[SAVE.current];
    const tabs = [['cars', 'Car'], ['parts', 'Parts'], ['paint', 'Body']].map(([t, n]) => `<button class="${this.gTab === t ? 'sel' : ''}" data-a="gtab" data-t="${t}">${n}</button>`).join('');
    let body = '';
    if (this.gTab === 'cars') body = this.garageCars();
    if (this.gTab === 'parts') body = this.garageParts(cs);
    if (this.gTab === 'paint') body = this.garagePaint(cs);
    this.set(`<div class="screen workshop" style="background-image:linear-gradient(rgba(13,11,30,.35),rgba(13,11,30,.7)),url(${Art.get('workshop')})"><div class="top">${this.back()}<h2>Garage</h2>${this.cashTag()}</div>
      <div class="split"><div class="left"><div class="gscene" id="gscene"></div><div class="sub" style="text-align:center;margin:4px 0 0">Tap a car to drive it. ${Object.keys(SAVE.cars).length} car${Object.keys(SAVE.cars).length > 1 ? 's' : ''} in your garage.</div></div>
      <div class="right"><div class="tabs">${tabs}</div>${body}</div></div></div>`);
    this.garageScene();
  },
  // top-down garage: every car you own parked nose-up in its own bay, plus an empty bay to fill
  garageScene() {
    const el = document.getElementById('gscene'); if (!el) return;
    const list = Object.values(SAVE.cars), slots = list.length + 1, cols = Math.min(5, Math.max(4, Math.ceil(slots / 2))), rows = Math.ceil(slots / cols);
    const BW = 22, BH = 36, M = 3, TOP = 14, W = M * 2 + cols * BW + 1, H = TOP + rows * BH + 4;
    const cv = mkCanvas(W, H), g = cv.getContext('2d'), R = rng(77), r = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x | 0, y | 0, w | 0, h | 0); };
    g.imageSmoothingEnabled = false;
    // epoxy floor
    r(0, 0, W, H, '#3d3c4c'); for (let i = 0; i < W * H / 5; i++) r(R() * W, R() * H, 1, 1, R() < 0.5 ? '#454456' : '#363544');
    // back wall from above: tool chests, tyre stacks and benches
    r(0, 0, W, TOP - 3, '#22203a'); r(0, TOP - 3, W, 1, '#121020');
    for (let x = 2; x < W - 10;) { const t = R();
      if (t < 0.3) { r(x, 2, 8, 6, '#b8322e'); r(x, 2, 8, 1, '#e0574f'); r(x + 1, 4, 6, 1, '#7a1f1c'); r(x + 1, 6, 6, 1, '#7a1f1c'); x += 10; }
      else if (t < 0.55) { for (const dx of [0, 4]) { r(x + dx, 2, 4, 4, '#121216'); r(x + dx + 1, 3, 2, 2, '#2b2b33'); } x += 10; }
      else if (t < 0.8) { r(x, 3, 11, 5, '#6b4a2e'); r(x, 3, 11, 1, '#8a6440'); for (let k = 0; k < 4; k++) r(x + 1 + k * 3, 4, 1, 2, ['#c7cbd6', '#ffd23d', '#3d8bff', '#ff3d7f'][k]); x += 13; }
      else { r(x, 2, 6, 7, '#2b3a4a'); r(x + 1, 3, 4, 2, '#3df2ff'); x += 8; } }
    // bays
    const cur = SAVE.current, wrap = document.createElement('div'); wrap.className = 'gwrap';
    for (let i = 0; i < rows * cols; i++) {
      const x0 = M + (i % cols) * BW, y0 = TOP + Math.floor(i / cols) * BH, cs = list[i];
      if (i < slots) { r(x0, y0, 1, BH - 3, '#e8e4d0'); r(x0 + BW, y0, 1, BH - 3, '#e8e4d0'); r(x0 + 6, y0 + 1, BW - 11, 1, '#f2c230'); }
      if (!cs) { if (i < slots) { r(x0 + 8, y0 + 14, 5, 3, '#2c2b36'); r(x0 + 10, y0 + 17, 3, 2, '#2c2b36'); } continue; }
      if (cs.id === cur) { g.fillStyle = 'rgba(255,236,180,.13)'; g.fillRect(x0 + 1, y0, BW - 1, BH - 3); g.fillStyle = 'rgba(255,236,180,.08)'; g.fillRect(x0 + 3, y0 + 2, BW - 5, BH - 7); }
      const spr = makeCarSprite(cs), shd = makeShadow(spr), cx = x0 + 11, cy = y0 + 16;
      g.save(); g.translate(cx, cy); g.rotate(-Math.PI / 2);
      g.drawImage(shd, -(spr.width >> 1) - 1, -(spr.height >> 1) + 1); g.drawImage(spr, -(spr.width >> 1), -(spr.height >> 1)); g.restore();
    }
    r(0, H - 2, W, 2, '#f2c230'); for (let x = 0; x < W; x += 4) r(x, H - 2, 2, 2, '#16161c');
    let sc = Math.min((el.clientWidth - 8) / W, (el.clientHeight - 8) / H) || 2; sc = sc >= 4 ? Math.floor(sc) : Math.max(1.5, Math.floor(sc * 4) / 4);
    if (sc < 4) wrap.classList.add('small');
    cv.style.width = W * sc + 'px'; cv.style.height = H * sc + 'px'; wrap.style.width = W * sc + 'px'; wrap.style.height = H * sc + 'px'; wrap.appendChild(cv);
    for (let i = 0; i < slots; i++) {
      const x0 = M + (i % cols) * BW, y0 = TOP + Math.floor(i / cols) * BH, cs = list[i], d = document.createElement('div');
      d.style.cssText = `left:${(x0 + 1) * sc}px;top:${y0 * sc}px;width:${(BW - 1) * sc}px;height:${(BH - 3) * sc}px`;
      if (cs) { const c = CAR_BY_ID[cs.id], on = cs.id === cur; d.className = 'gbay' + (on ? ' sel' : ''); d.dataset.a = 'gpick'; d.dataset.id = cs.id; d.title = c.name;
        d.innerHTML = `<span><i>${esc(c.name)}</i><b>${on ? 'DRIVING' : 'PR ' + rating(buildSpec(cs))}</b></span>`; }
      else { d.className = 'gbay empty'; d.dataset.a = 'go'; d.dataset.to = 'dealer'; d.innerHTML = '<span><i>Empty bay</i><b>+ Buy a car</b></span>'; }
      wrap.appendChild(d);
    }
    el.innerHTML = ''; el.appendChild(wrap);
  },
  garageCars() {
    const cs = SAVE.cars[SAVE.current], c = CAR_BY_ID[cs.id], sp = buildSpec(cs), hl = carHealth(cs);
    return `<div class="card"><div class="row" style="align-items:baseline"><h3 style="margin:0">${esc(c.name)}</h3><span style="margin-left:auto;color:var(--gold)">PR ${rating(sp)}</span></div>
      <div class="meta">${kw2hp(sp.power)} hp &middot; ${Math.round(sp.mass)} kg &middot; condition <b style="color:${hl > 60 ? 'var(--green)' : hl > 30 ? 'var(--gold)' : 'var(--red)'}">${hl}%</b></div>
      <div class="flabel" style="margin:6px 0 4px">${focusLabel(buildFocus(sp))}</div>${this.statsHTML(sp)}<div class="sub">${esc(c.blurb)}</div>
      <div class="row" style="margin-top:8px"><button class="hot" data-a="go" data-to="mechanic">Mechanic &amp; Tuning &gt;</button><button data-a="go" data-to="shop">Parts Shop &gt;</button><button data-a="go" data-to="dealer">Buy cars &gt;</button></div></div>`;
  },
  garageParts(cs) {
    const cats = PART_GROUPS.map(([g, ks]) => `<div class="pgroup"><span>${g}</span><div class="tabs">${ks.map(k => `<button class="${this.partCat === k ? 'sel' : ''} ${cs.parts[k] ? 'up' : ''}" data-a="pcat" data-k="${k}" title="${esc(PARTS[k].name)}">${PARTS[k].icon}</button>`).join('')}</div></div>`).join('');
    const k = this.partCat, P = PARTS[k];
    const rows = P.levels.map((lv, i) => {
      const owned = cs.owned[k].includes(i), inst = cs.parts[k] === i, price = partPrice(cs.id, k, i);
      const test = JSON.parse(JSON.stringify(cs)); test.parts[k] = i; const pr = rating(buildSpec(test)), cur = rating(buildSpec(cs));
      const delta = pr - cur, dTxt = delta ? `<span style="color:${delta > 0 ? 'var(--green)' : 'var(--red)'}">PR ${delta > 0 ? '+' : ''}${delta}</span>` : '';
      let act = inst ? '<span style="color:var(--green)">INSTALLED</span>' : owned ? `<button class="ok" data-a="install" data-k="${k}" data-i="${i}">Install</button>`
        : `<button data-a="shoppart" data-k="${k}" data-i="${i}">Shop ${fmtMoney(price)}</button>`;
      return `<div class="item ${inst ? 'on' : ''}"><div class="nm">${esc(lv.n)} ${dTxt}<small>${esc(lv.d || 'Factory part')}</small></div>${act}</div>`;
    }).join('');
    return `<div class="card" style="margin-bottom:8px"><div class="flabel">${focusLabel(buildFocus(buildSpec(cs)))}</div>${this.focusHTML(buildFocus(buildSpec(cs)))}
      <button class="hot" data-a="go" data-to="shop" style="margin-top:8px">Visit the Parts Shop &gt;</button></div>${cats}<div class="sub" style="margin:4px 0 6px;font-size:15px;color:var(--ink)">${esc(P.name)}</div><div class="list">${rows}</div>`;
  },
  garageTune(cs) {
    const c = CAR_BY_ID[cs.id];
    const rows = TUNES.filter(t => !t.gb).map(t => {
      const on = t.req(cs.parts), v = on ? clamp(cs.tune[t.k] ?? t.def(c), t.min, tuneMax(t, cs.parts)) : t.def(c);
      return `<div class="slider ${on ? '' : 'locked'}"><div class="lab"><span>${t.n}</span><span id="tv_${t.k}">${on ? t.fmt(v) : 'LOCKED'}</span></div>
        <input type="range" min="${t.min}" max="${tuneMax(t, cs.parts)}" step="${t.step}" value="${v}" data-tune="${t.k}" ${on ? '' : 'disabled'}>
        <div class="lab"><small>${on ? t.help : t.why}</small></div></div>`;
    }).join('');
    return `<div class="list">${rows}<div class="row"><button data-a="tunereset">Reset to default</button><button class="hot" data-a="testdrive">Test drive</button></div></div>`;
  },
  garageGearbox(cs, sp) {
    const c = CAR_BY_ID[cs.id], p = cs.parts, fOn = p.gearbox >= 1, gOn = gearsTunable(p), ft = TUNES.find(t => t.k === 'final');
    const gears = sp.gears, maxV = gearTop(sp, gears[gears.length - 1]);
    const chart = gears.map((g, i) => { const v = gearTop(sp, g); return `<span>G${i + 1}</span><div class="bar"><i style="width:${clamp(v / Math.max(maxV, 1), 0.02, 1) * 100}%;background:${['#5dff6a', '#b6ff3d', '#ffd23d', '#ff7b2d', '#ff3d7f', '#9b4dff'][i]}"></i></div><span>${spdU(v)} ${unitN().toLowerCase()}</span>`; }).join('');
    const final = `<div class="slider ${fOn ? '' : 'locked'}"><div class="lab"><span>Final Drive</span><span id="tv_final">${fOn ? ft.fmt(sp.final) : 'LOCKED'}</span></div>
      <input type="range" min="${ft.min}" max="${ft.max}" step="${ft.step}" value="${sp.final}" data-tune="final" ${fOn ? '' : 'disabled'}>
      <div class="lab"><small>${fOn ? ft.help : ft.why}</small></div></div>`;
    const gs = gears.map((g, i) => `<div class="slider ${gOn ? '' : 'locked'}"><div class="lab"><span>Gear ${i + 1}</span><span id="gv_${i}">${gOn ? g.toFixed(2) : 'LOCKED'}</span></div>
      <input type="range" min="${GEAR_MIN}" max="${GEAR_MAX}" step="0.01" value="${g}" data-gear="${i}" ${gOn ? '' : 'disabled'}></div>`).join('');
    const pre = gOn ? `<div class="row">${[['stock', 'Stock'], ['accel', 'Acceleration'], ['drift', 'Close Ratio (drift)'], ['top', 'Top Speed']].map(([k, n]) => `<button data-a="gpreset" data-k="${k}">${n}</button>`).join('')}</div>` : '';
    return `<div class="list"><div class="slider"><div class="lab"><span>Speed in each gear (at redline ${Math.round(sp.redline)} rpm)</span></div><div class="stats" style="margin-top:4px">${chart}</div></div>
      ${final}${gOn ? '' : `<div class="item"><div class="nm">Individual gear ratios are locked<small>Buy a Sequential, Dog Box or DCT gearbox in the Parts Shop to tune every gear.</small></div><button data-a="gotopart" data-k="gearbox">Parts &gt;</button></div>`}
      ${pre}${gs}<div class="row"><button class="hot" data-a="testdrive">Test drive</button></div></div>`;
  },
  garagePaint(cs) {
    const sw = (list, key, cur) => `<div class="swatches">${list.map(col => `<div class="sw ${cur === col ? 'sel' : ''}" style="background:${col}" data-a="cos" data-k="${key}" data-v="${col}"></div>`).join('')}</div>`;
    const opt = key => { const C = COSMETICS[key]; return `<div class="slider"><div class="lab"><span>${C.n}</span><small>${fmtMoney(C.p)} to change</small></div><div class="row" style="margin-top:4px">${C.opts.map((o, i) =>
      `<button class="${cs[key] === i ? 'sel' : ''}" data-a="cos" data-k="${key}" data-v="${i}" ${key === 'glow' && i ? `style="color:${o}"` : ''}>${key === 'glow' && i ? 'Glow ' + i : esc(o)}</button>`).join('')}</div></div>`; };
    return `<div class="list">${this.garageKits(cs)}${this.garageLiveries(cs)}<div class="slider"><div class="lab"><span>Body Paint</span><small>${fmtMoney(PAINT_COST)} per colour</small></div>${sw(PAINTS, 'paint', cs.paint)}</div>
      ${opt('stripe')}<div class="slider"><div class="lab"><span>Stripe Colour</span><small>free</small></div>${sw(PAINTS, 'stripeColor', cs.stripeColor)}</div>
      ${opt('spoiler')}${opt('hood')}${opt('glow')}</div>`;
  },

  // ---- parts shop ----
  refreshTune() { if (this.screen === 'mechanic') this.mechanic(); else this.garage(); },
  refreshParts() { if (this.screen === 'shop') this.shop(); else this.garage(); },
  focusHTML(f, cmp) {
    return `<div class="focus">${FOCUS.map(([k, n, col]) => { const d = cmp ? f[k] - cmp[k] : 0;
      return `<span>${n}</span><div class="bar"><i style="width:${Math.max(2, f[k])}%;background:${col}"></i></div><span>${f[k]}${d ? ` <span style="color:${d > 0 ? 'var(--green)' : 'var(--red)'}">${d > 0 ? '+' : ''}${d}</span>` : ''}</span>`; }).join('')}</div>`;
  },
  // how installing level i of category k changes the current car
  // (compared with what's fitted now, or with stock if this part is already fitted; "best for" is always vs stock)
  partEffect(cs, k, i) {
    const withLv = l => { const t = JSON.parse(JSON.stringify(cs)); t.parts[k] = l; if (k === 'gearbox') t.tune.gears = defaultGears(CAR_BY_ID[cs.id], t.parts); return buildSpec(t); };
    const stock = withLv(0), b = withLv(i), a = cs.parts[k] === i ? stock : buildSpec(cs), fs = buildFocus(stock), fa = buildFocus(a), fb = buildFocus(b);
    let best = null, bd = 0; for (const [fk] of FOCUS) { const d = fb[fk] - fs[fk]; if (d > bd) { bd = d; best = fk; } }
    return {a, b, fa, fb, best, vsStock: cs.parts[k] === i};
  },
  shop() {
    const cs = SAVE.cars[SAVE.current], c = CAR_BY_ID[cs.id], sp = buildSpec(cs), f = buildFocus(sp);
    const aisle = this.aisle ?? 0, ff = this.shopFocus || 'all';
    const aisles = PART_GROUPS.map(([g], i) => `<button class="${aisle === i ? 'sel' : ''}" data-a="aisle" data-i="${i}">${g}</button>`).join('');
    const fcol = Object.fromEntries(FOCUS.map(x => [x[0], x[2]]));
    const filt = [['all', 'All parts'], ...FOCUS.map(x => [x[0], 'Best for ' + x[1]])].map(([k, n]) => `<button class="${ff === k ? 'sel' : ''}" data-a="sfocus" data-k="${k}">${n}</button>`).join('');
    const shelves = PART_GROUPS[aisle][1].map(k => {
      const P = PARTS[k], tiles = P.levels.map((lv, i) => [lv, i]).filter(x => x[1]).sort((x, y) => x[0].p - y[0].p).map(([lv, i]) => {
        const e = this.partEffect(cs, k, i), own = cs.owned[k].includes(i), inst = cs.parts[k] === i, price = partPrice(cs.id, k, i);
        const tag = inst ? '<div class="pt inst">INSTALLED</div>' : own ? '<div class="pt own">OWNED</div>' : `<div class="pt">${fmtMoney(price)}</div>`;
        const dim = ff !== 'all' && e.best !== ff ? ' dim' : '';
        return `<div class="ptile${dim}" data-a="part" data-k="${k}" data-i="${i}" title="${esc(lv.n)}">${e.best ? `<span class="dot" style="background:${fcol[e.best]}"></span>` : ''}<img src="${Art.partIcon(k, i)}" alt=""><div class="pn">${esc(lv.n)}</div>${tag}</div>`;
      }).join('');
      return `<div class="shelf"><h4>${esc(P.name)} <b>${esc(PARTS[k].levels[cs.parts[k]].n)}</b></h4><div class="ptiles">${tiles}</div></div>`;
    }).join('');
    this.set(`<div class="screen shop" style="background-image:linear-gradient(rgba(13,11,30,.2),rgba(13,11,30,.55)),url(${Art.get('shop')})"><div class="top">${this.back()}<h2>Parts Shop</h2>${this.cashTag()}</div>
      <div class="shopwrap"><div class="side"><div class="card"><h3>${esc(c.name)}</h3><div class="meta">PR ${rating(sp)} &middot; ${kw2hp(sp.power)} hp &middot; ${Math.round(sp.mass)} kg</div>
        <div class="flabel" style="margin:6px 0 4px">${focusLabel(f)}</div>${this.focusHTML(f)}
        <div class="meta" style="margin-top:6px">A higher Drift rating also gives up to +25% drift points.</div></div>
        <details class="card"><summary style="cursor:pointer;text-transform:uppercase">Build guides</summary><div class="meta" style="margin-top:6px">${FOCUS.map(([k, n, col]) => `<b style="color:${col}">${n}:</b> ${RECIPES[k]}`).join('<br><br>')}</div></details>
        <button data-a="go" data-to="garage">Garage &gt;</button></div>
      <div class="main"><div class="tabs">${aisles}</div><div class="tabs">${filt}</div>
        <div class="sub" style="margin:0 0 6px">Tap a part to see what it does to your car. The coloured dot shows what it's best for.</div>${shelves}</div></div></div>`);
    if (this.shopSel) this.partCard(this.shopSel.k, this.shopSel.i);
  },
  partCard(k, i) {
    const cs = SAVE.cars[SAVE.current], c = CAR_BY_ID[cs.id], P = PARTS[k], lv = P.levels[i], e = this.partEffect(cs, k, i);
    const own = cs.owned[k].includes(i), inst = cs.parts[k] === i, price = partPrice(cs.id, k, i);
    const row = (n, va, vb, fmt, hiGood = true) => { const d = vb - va, cls = Math.abs(d) < 1e-6 ? '' : (d > 0) === hiGood ? 'up' : 'dn';
      return `<span>${n}</span><span>${fmt(va)}</span><span>&rarr;</span><span class="${cls}">${fmt(vb)}</span>`; };
    const fname = Object.fromEntries(FOCUS.map(x => [x[0], x])), best = e.best ? fname[e.best] : null;
    const d = document.createElement('div'); d.className = 'lotcard partcard'; d.id = 'partcard';
    d.innerHTML = `<div class="panel" style="width:min(640px,100%)"><div class="row" style="gap:14px;align-items:flex-start;flex-wrap:wrap">
      <img class="big" src="${Art.partIcon(k, i)}" alt=""><div style="flex:1;min-width:220px">
      <div class="sub" style="margin:0;color:var(--dim)">${esc(P.name)} &middot; tier ${lv.tier || 0} of 5</div>
      <h2 style="margin:2px 0 4px">${esc(lv.n)}</h2><div class="sub" style="margin:0">${esc(lv.d || '')}</div>
      ${best ? `<div style="margin-top:6px"><span class="badge" style="color:${best[2]};border-color:${best[2]}">Best for ${best[1]}</span></div>` : ''}
      <div class="lotprice" style="margin-top:6px">${inst ? '<span style="color:var(--green)">INSTALLED</span>' : own ? '<span style="color:var(--green)">OWNED</span>' : fmtMoney(price)}</div></div></div>
      ${inst ? `<div class="sub" style="margin:4px 0 0">Condition <b style="color:${condOf(cs, k) > 60 ? 'var(--green)' : condOf(cs, k) > 30 ? 'var(--gold)' : 'var(--red)'}">${Math.round(condOf(cs, k))}%</b>. Repair it at the Mechanic.</div>` : ''}
      <div class="sub" style="margin:8px 0 0;color:var(--ink)">On your ${esc(c.name)}${e.vsStock ? ' (compared with stock)' : ''}:</div>
      <div class="cmp">${row('Power', e.a.power, e.b.power, v => kw2hp(v) + ' hp')}${row('Weight', e.a.mass, e.b.mass, v => Math.round(v) + ' kg', false)}
        ${row('Grip', (e.a.muF + e.a.muR) / 2, (e.b.muF + e.b.muR) / 2, v => v.toFixed(2) + ' g')}${row('Top Speed', topSpeed(e.a), topSpeed(e.b), v => spdU(v) + ' ' + unitN().toLowerCase())}
        ${row('PR', rating(e.a), rating(e.b), v => v)}</div>
      ${this.focusHTML(e.fb, e.fa)}
      <div class="row" style="margin-top:10px">${inst ? '' : own ? `<button class="ok" data-a="install" data-k="${k}" data-i="${i}">Install</button>` :
        `<button class="gold" data-a="buypart" data-k="${k}" data-i="${i}" ${SAVE.cash < price ? 'disabled' : ''}>${SAVE.cash < price ? 'Need ' + fmtMoney(price - SAVE.cash) + ' more' : 'Buy &amp; install ' + fmtMoney(price)}</button>`}
        <button data-a="partclose">Close</button></div></div>`;
    d.addEventListener('click', ev => { if (ev.target === d) this.act('partclose', {}); });
    $ui.appendChild(d);
  },
  carThumb(cs, sc) { const spr = makeCarSprite(cs), cv = mkCanvas(spr.width * sc, spr.height * sc), g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(spr, 0, 0, cv.width, cv.height); return cv.toDataURL(); },
  garageLiveries(cs) {
    const own = cs.liveries || [0];
    return `<div class="slider"><div class="lab"><span>Liveries</span><small>Fit any livery on any car</small></div><div class="kits" style="margin-top:6px">${LIVERIES.map((l, i) => {
      const on = (cs.livery || 0) === i, has = own.includes(i);
      return `<div class="kit ${on ? 'on' : ''}" data-a="livery" data-i="${i}"><img src="${this.carThumb(Object.assign({}, cs, {livery: i}), 4)}" alt=""><div class="kn">${esc(l.n)}</div>${l.d ? `<div class="meta" style="font-size:11px;color:var(--dim)">${esc(l.d)}</div>` : ''}
        <div style="margin-top:4px;font-size:12px">${on ? '<span style="color:var(--green)">FITTED</span>' : has ? 'Owned &middot; tap to fit' : `<span style="color:${SAVE.cash >= l.p ? 'var(--gold)' : 'var(--red)'}">${fmtMoney(l.p)}</span>`}</div></div>`;
    }).join('')}</div></div>`;
  },
  garageKits(cs) {
    const kits = carKits(cs.id), own = cs.kits || [0];
    return `<div class="slider"><div class="lab"><span>Body Kits</span><small>Made for the ${esc(CAR_BY_ID[cs.id].name)}</small></div><div class="kits" style="margin-top:6px">${kits.map((k, i) => {
      const t = Object.assign({}, cs, {kit: i}), spr = makeCarSprite(t), cv = mkCanvas(spr.width * 4, spr.height * 4), g = cv.getContext('2d');
      g.imageSmoothingEnabled = false; g.drawImage(spr, 0, 0, cv.width, cv.height);
      const on = (cs.kit || 0) === i, has = own.includes(i);
      return `<div class="kit ${on ? 'on' : ''}" data-a="kit" data-i="${i}"><img src="${cv.toDataURL()}" alt=""><div class="kn">${esc(k.n)}</div><div class="meta" style="font-size:11px;color:var(--dim)">${esc(k.d)}</div>
        <div style="margin-top:4px;font-size:12px">${on ? '<span style="color:var(--green)">FITTED</span>' : has ? 'Owned &middot; tap to fit' : `<span style="color:${SAVE.cash >= k.p ? 'var(--gold)' : 'var(--red)'}">${fmtMoney(k.p)}</span>`}</div></div>`;
    }).join('')}</div></div>`;
  },

  // ---- mechanic: car on the lift, click an area to fix it; dyno in a pop-up ----
  mechanic() {
    const cs = SAVE.cars[SAVE.current], c = CAR_BY_ID[cs.id], hl = carHealth(cs), mode = this.mMode || 'repair';
    const zw = z => MECH_ZONES.find(q => q.id === z);
    if (!this.mzone) this.mzone = MECH_ZONES.slice().sort((a, b) => zoneCond(cs, a) - zoneCond(cs, b))[0].id;
    const Z = zw(this.mzone), col = v => v > 60 ? 'var(--green)' : v > 30 ? 'var(--gold)' : 'var(--red)';
    const bar = v => `<div class="cbar"><i style="width:${Math.max(2, v)}%;background:${col(v)}"></i></div>`;
    let rows = '', zcost = 0;
    if (Z.id === 'body') { const b = Math.round(cs.body ?? 100), bc = bodyCost(cs); zcost = bc;
      rows = `<div class="crow"><img src="${this.carThumb(cs, 2)}" alt="" style="width:auto;height:28px;background:#585766"><div class="cn">Body panels<small>${b > 75 ? 'Looking clean' : b > 45 ? 'Scratched up' : b > 20 ? 'Dented and in primer' : 'Falling apart! The kit falls off at 0%'}</small></div>${bar(b)}<span class="cp" style="color:${col(b)}">${b}%</span>${b >= 100 ? '<span class="cok">OK</span>' : `<button data-a="repairbody" ${SAVE.cash < bc ? 'disabled' : ''}>${fmtMoney(bc)}</button>`}</div>`;
    } else rows = Z.parts.map(k => [k, condOf(cs, k)]).sort((a, b) => a[1] - b[1]).map(([k, v]) => { const lvN = cs.parts[k], cost = repairCost(cs, k), r = Math.round(v); zcost += cost;
      return `<div class="crow"><img src="${Art.partIcon(k, lvN)}" alt=""><div class="cn">${esc(PARTS[k].levels[lvN].n)}<small>${esc(PARTS[k].name)}${r < 20 && lvN ? ' &middot; <b style="color:var(--red)">ABOUT TO BREAK</b>' : ''}</small></div>
        ${bar(v)}<span class="cp" style="color:${col(v)}">${r}%</span>${r >= 100 ? '<span class="cok">OK</span>' : `<button data-a="repair" data-k="${k}" ${SAVE.cash < cost ? 'disabled' : ''}>${fmtMoney(cost)}</button>`}</div>`; }).join('');
    let total = bodyCost(cs); for (const k of PART_ORDER) if (WEAR[k]) total += repairCost(cs, k);
    this.set(`<div class="screen mech" style="background-image:linear-gradient(rgba(13,11,30,.15),rgba(13,11,30,.45)),url(${Art.get('mechShop')})"><div class="top">${this.back()}<h2>Mechanic &amp; Tuning</h2>${this.cashTag()}</div>
      <div class="split"><div class="left"><div class="lift" id="lift"></div>
        <div class="sub" style="text-align:center;margin:4px 0 0">Tap part of the car to inspect it.</div></div>
      <div class="right"><div class="card"><div class="row" style="align-items:center"><div><div class="flabel">${esc(c.name)} &middot; ${hl}%</div><div class="meta">${worstParts(cs)[0][1] < 20 || (cs.body ?? 100) < 20 ? '<span style="color:var(--red)">Something is about to break!</span>' : hl > 80 ? 'Running sweet.' : hl > 50 ? 'Could use some love.' : 'Needs work before it lets you down!'}</div></div>
          <div class="row" style="margin-left:auto"><button data-a="dynoopen">Dyno</button><button class="gold" data-a="repairall" ${total <= 0 || SAVE.cash < total ? 'disabled' : ''}>${total > 0 ? 'Fix all ' + fmtMoney(total) : 'All good'}</button></div></div></div>
        <div class="tabs mtabs" style="margin-top:6px">${[['repair', 'Repairs'], ['tune', 'Tuning'], ['gearbox', 'Gearbox']].map(([m, n]) => `<button class="${mode === m ? 'sel' : ''}" data-a="mmode" data-m="${m}">${n}</button>`).join('')}</div>
        ${mode === 'tune' ? `<div class="meta" style="margin:0 0 6px">Set up how the car drives. Parts unlock more sliders.</div>${this.garageTune(cs)}` : mode === 'gearbox' ? this.garageGearbox(cs, buildSpec(cs)) : `
        <div class="tabs">${MECH_ZONES.map(z => { const v = Math.round(zoneCond(cs, z)); return `<button class="${z.id === Z.id ? 'sel' : ''}" data-a="mzone" data-z="${z.id}">${z.n} <span style="color:${col(v)}">${v}%</span></button>`; }).join('')}</div>
        <div class="card" style="margin-bottom:6px"><div class="row" style="align-items:center"><h3 style="margin:0">${Z.n}</h3>${zcost > 0 ? `<button class="ok" data-a="repairzone" data-z="${Z.id}" style="margin-left:auto" ${SAVE.cash < zcost ? 'disabled' : ''}>Fix area ${fmtMoney(zcost)}</button>` : '<span style="margin-left:auto;color:var(--green)">ALL OK</span>'}</div><div class="meta">${Z.d}</div></div>
        <div class="list">${rows}</div>`}</div></div></div>`);
    this.liftView(cs, mode === 'repair' ? Z.id : null);
    if (this.dynoOpen) this.dynoCard();
  },
  // big top-down car on the lift with clickable areas
  liftView(cs, sel) {
    const el = document.getElementById('lift'); if (!el) return;
    const car = CAR_BY_ID[cs.id], L = car.len, Wd = car.wid, spr = makeCarSprite(cs), pad = 3, P = 4;
    const sc = Math.max(4, Math.floor(Math.min((el.clientWidth - 16) / (spr.width + P * 2), (el.clientHeight - 16) / (spr.height + P * 2))));
    const cv = mkCanvas((spr.width + P * 2) * sc, (spr.height + P * 2) * sc), g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    // bay floor with hazard lines and lift pads
    const R = rng(9); g.fillStyle = '#4e4d59'; g.fillRect(0, 0, cv.width, cv.height);
    for (let i = 0; i < cv.width * cv.height / (sc * sc * 3); i++) { g.fillStyle = R() < 0.5 ? '#56556a' : '#46455a'; g.fillRect(((R() * cv.width / sc) | 0) * sc, ((R() * cv.height / sc) | 0) * sc, sc, sc); }
    for (let x = 0; x < cv.width; x += sc * 2) { g.fillStyle = (x / sc / 2) % 2 ? '#111' : '#f2c230'; g.fillRect(x, 0, sc * 2, sc); g.fillRect(x, cv.height - sc, sc * 2, sc); }
    const o = P * sc, fa = Math.round(L * (car.style === 'super' ? 0.74 : 0.76)), ra = Math.round(L * 0.2);
    for (const ax of [ra, fa]) for (const y of [-3, Wd + 1]) { g.fillStyle = '#2a2a33'; g.fillRect(o + (pad + ax - 2) * sc, o + (pad + y) * sc, 5 * sc, 2 * sc); g.fillStyle = '#c0392b'; g.fillRect(o + (pad + ax - 1) * sc, o + (pad + y) * sc, 3 * sc, sc); }
    if ((cs.body ?? 100) < 100 || true) g.drawImage(makeShadow(spr), o + sc, o + sc, spr.width * sc, spr.height * sc);
    g.drawImage(spr, o, o, spr.width * sc, spr.height * sc);
    el.innerHTML = ''; const wrap = document.createElement('div'); wrap.className = 'liftwrap'; wrap.style.width = cv.width + 'px'; wrap.style.height = cv.height + 'px'; wrap.appendChild(cv);
    // hotspots in sprite pixels
    const spot = (z, x, y, w, h, label) => { const v = Math.round(zoneCond(cs, MECH_ZONES.find(q => q.id === z))), d = document.createElement('div');
      d.className = 'hot' + (z === sel ? ' sel' : '') + (v < 20 ? ' crit' : ''); d.dataset.a = 'mzone'; d.dataset.z = z;
      d.style.cssText = `left:${o + (pad + x) * sc}px;top:${o + (pad + y) * sc}px;width:${w * sc}px;height:${h * sc}px;--zc:${v > 60 ? '#5dff6a' : v > 30 ? '#ffd23d' : '#ff4d4d'}`;
      if (label) d.innerHTML = `<span>${label} ${v}%</span>`; wrap.appendChild(d); };
    spot('rear', -1, 1, Math.round(L * 0.26) + 1, Wd - 2, 'REAR');
    spot('cabin', Math.round(L * 0.3), 2, Math.round(L * 0.34), Wd - 4, 'CABIN');
    spot('engine', Math.round(L * 0.66), 1, L - Math.round(L * 0.66) + 1, Wd - 2, 'ENGINE');
    spot('body', Math.round(L * 0.3), -0.5, Math.round(L * 0.34), 2, ''); spot('body', Math.round(L * 0.3), Wd - 1.5, Math.round(L * 0.34), 2, 'BODY');
    spot('wheels', fa - 2, -2.5, 5, 3, 'WHEELS'); for (const [x, y] of [[ra - 2, -2.5], [fa - 2, Wd - 0.5], [ra - 2, Wd - 0.5]]) spot('wheels', x, y, 5, 3, '');
    el.appendChild(wrap);
  },
  dynoCard() {
    const cs = SAVE.cars[SAVE.current], last = cs.dyno, d = document.createElement('div'); d.className = 'lotcard'; d.id = 'dynocard';
    d.innerHTML = `<div class="panel" style="width:min(620px,100%)"><h3 style="margin:0 0 4px">Dyno &middot; ${esc(CAR_BY_ID[cs.id].name)}</h3><div class="dyno"><canvas id="dyno" width="360" height="190"></canvas></div>
      <div class="meta" id="dynoRes">${last ? `Last pull: <b style="color:var(--hot)">${last.hp} whp</b> @ ${last.hpRpm} rpm &middot; <b style="color:var(--cyan)">${last.tq} Nm</b> @ ${last.tqRpm} rpm` : 'Strap the car to the rollers and see what it really makes at the wheels.'}</div>
      <div class="row" style="margin-top:8px"><button class="hot" data-a="dyno" ${SAVE.cash < DYNO_COST ? 'disabled' : ''}>Run dyno (${fmtMoney(DYNO_COST)})</button><button data-a="dynoclose">Close</button></div></div>`;
    d.addEventListener('click', ev => { if (ev.target === d) this.act('dynoclose', {}); });
    $ui.appendChild(d); this.drawDyno(last ? last.pts : null, null, 1);
  },
  // draws the dyno chart; cur is the curve being pulled (revealed up to frac), ghost is the last run
  drawDyno(ghost, cur, frac) {
    const cv = document.getElementById('dyno'); if (!cv) return; const g = cv.getContext('2d'), W = cv.width, H = cv.height, P = 26;
    const sp = buildSpec(SAVE.cars[SAVE.current]), maxR = Math.max(sp.redline, ghost ? ghost[ghost.length - 1].rpm : 0) + 200;
    const all = (cur || []).concat(ghost || []), maxHp = Math.max(100, ...all.map(q => q.hp)) * 1.15, maxTq = Math.max(150, ...all.map(q => q.tq)) * 1.15;
    g.fillStyle = '#0b0920'; g.fillRect(0, 0, W, H); g.strokeStyle = '#231e4a'; g.lineWidth = 1; g.font = '9px monospace'; g.fillStyle = '#6a63a0';
    for (let r = 1000; r < maxR; r += 1000) { const x = P + (r / maxR) * (W - P * 2); g.beginPath(); g.moveTo(x + 0.5, 6); g.lineTo(x + 0.5, H - 16); g.stroke(); g.fillText((r / 1000) + 'k', x - 5, H - 4); }
    for (let i = 1; i < 5; i++) { const y = 6 + (H - 22) * i / 5; g.beginPath(); g.moveTo(P, y + 0.5); g.lineTo(W - P, y + 0.5); g.stroke(); }
    g.fillText('HP', 2, 14); g.fillText('NM', W - 22, 14);
    const line = (pts, key, max, color, n) => { if (!pts || !pts.length) return; g.strokeStyle = color; g.lineWidth = 2; g.beginPath();
      pts.slice(0, n).forEach((q, i) => { const x = P + (q.rpm / maxR) * (W - P * 2), y = H - 16 - (q[key] / max) * (H - 22); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); };
    line(ghost, 'hp', maxHp, 'rgba(255,61,127,.3)', 999); line(ghost, 'tq', maxTq, 'rgba(61,242,255,.3)', 999);
    if (cur) { const n = Math.max(2, Math.round(cur.length * frac)); line(cur, 'hp', maxHp, '#ff3d7f', n); line(cur, 'tq', maxTq, '#3df2ff', n); }
  },
  runDyno() {
    const cs = SAVE.cars[SAVE.current]; if (SAVE.cash < DYNO_COST || this.dynoBusy) return;
    SAVE.cash -= DYNO_COST; persist(); this.dynoBusy = true;
    const sp = buildSpec(cs), pts = dynoCurve(sp), ghost = cs.dyno ? cs.dyno.pts : null, t0 = performance.now(), T = 2600;
    const btn = document.querySelector('[data-a="dyno"]'); if (btn) { btn.disabled = true; btn.textContent = 'Pulling...'; }
    const tick = () => {
      const f = Math.min(1, (performance.now() - t0) / T);
      if (this.screen !== 'mechanic' || !document.getElementById('dyno')) { this.dynoBusy = false; return; }
      this.drawDyno(ghost, pts, f);
      if (Math.random() < 0.5) Sfx.beep(90 + f * 420, 0.05, 'sawtooth', 0.025);
      if (f < 1) return requestAnimationFrame(tick);
      const pk = pts.reduce((a, q) => q.hp > a.hp ? q : a), pt = pts.reduce((a, q) => q.tq > a.tq ? q : a);
      const res = {hp: Math.round(pk.hp), hpRpm: pk.rpm, tq: Math.round(pt.tq), tqRpm: pt.rpm, pts: pts.filter((q, i) => i % 2 === 0 || i === pts.length - 1).map(q => ({rpm: q.rpm, hp: Math.round(q.hp), tq: Math.round(q.tq)}))};
      const prev = cs.dyno; cs.dyno = res; persist(); this.dynoBusy = false;
      const d = prev ? res.hp - prev.hp : 0;
      const el = document.getElementById('dynoRes');
      if (el) el.innerHTML = `<b style="color:var(--hot)">${res.hp} whp</b> @ ${res.hpRpm} rpm &middot; <b style="color:var(--cyan)">${res.tq} Nm</b> @ ${res.tqRpm} rpm${prev ? ` &middot; <span style="color:${d >= 0 ? 'var(--green)' : 'var(--red)'}">${d >= 0 ? '+' : ''}${d} whp vs last pull</span>` : ''}`;
      if (btn) { btn.disabled = SAVE.cash < DYNO_COST; btn.textContent = 'Run dyno (' + fmtMoney(DYNO_COST) + ')'; }
      const cash = document.querySelector('.cash'); if (cash) cash.textContent = fmtMoney(SAVE.cash);
      Sfx.beep(880, 0.12, 'square', 0.08);
    };
    requestAnimationFrame(tick);
  },

  dealer() {
    const stalls = CARS.map(k => {
      const own = !!SAVE.cars[k.id], afford = SAVE.cash >= k.price;
      const tag = own ? '<div class="tag own">OWNED</div>' : `<div class="tag ${afford ? '' : 'poor'}">${fmtMoney(k.price)}</div>`;
      return `<div class="stall ${k.id === this.dealerSel && this.lotOpen ? 'sel' : ''}" data-a="dsel" data-id="${k.id}"><div class="spot" id="st_${k.id}"></div><div class="lbl">${esc(k.name)}</div>${tag}</div>`;
    }).join('');
    this.set(`<div class="screen lot" style="background-image:url(${Art.get('asphalt')})"><div class="top">${this.back()}<h2>Car Lot</h2>${this.lotTabs('new')}${this.cashTag()}</div>
      <div class="lothead"><div class="flags" style="background-image:url(${Art.get('bunting')})"></div><div class="lotsign">PIXEL DRIFT <span>MOTORS</span></div><div class="sub" style="margin:2px 0 0">Tap a car to see its stats and price.</div><div class="flags" style="background-image:url(${Art.get('bunting')})"></div></div>
      <div class="stalls">${stalls}</div></div>`);
    for (const k of CARS) { const el = document.getElementById('st_' + k.id), cs = SAVE.cars[k.id] || newCarState(k.id); if (el) el.appendChild(stallSprite(cs, 4)); }
    if (this.lotOpen && this.dealerSel) this.lotCard(this.dealerSel);
  },
  lotTabs(on) { return `<div class="tabs" style="margin:0"><button class="${on === 'new' ? 'sel' : ''}" data-a="go" data-to="dealer">New</button><button class="${on === 'used' ? 'sel' : ''}" data-a="go" data-to="used">Used</button></div>`; },
  used() {
    const stock = usedStock();
    const stalls = stock.map(l => { const c = CAR_BY_ID[l.cs.id], afford = SAVE.cash >= l.price;
      return `<div class="stall ${l.key === this.usedSel ? 'sel' : ''}" data-a="usel" data-k="${l.key}"><div class="spot" id="us_${l.key.replace(':', '_')}"></div><div class="lbl">${esc(c.name)}</div><div class="tag ${afford ? '' : 'poor'}">${fmtMoney(l.price)}</div><div class="was">new ${fmtMoney(l.newPrice)}</div></div>`; }).join('');
    this.set(`<div class="screen lot used" style="background-image:url(${Art.get('gravel')})"><div class="top">${this.back()}<h2>Car Lot</h2>${this.lotTabs('used')}${this.cashTag()}</div>
      <div class="lothead"><div class="lotsign usedsign">USED <span>BARGAINS</span></div><div class="sub" style="margin:2px 0 0">Built cars with liveries and random parts, cheaper than new. New stock arrives after every event you finish.</div></div>
      ${stock.length ? `<div class="stalls">${stalls}</div>` : '<div class="card" style="margin:auto"><h3>Sold out!</h3><div class="meta">Finish an event and new stock will roll in.</div></div>'}</div>`);
    for (const l of stock) { const el = document.getElementById('us_' + l.key.replace(':', '_')); if (el) el.appendChild(stallSprite(l.cs, 4)); }
    const sel = stock.find(l => l.key === this.usedSel); if (sel) this.usedCard(sel); else this.usedSel = null;
  },
  usedCard(l) {
    const c = CAR_BY_ID[l.cs.id], sp = buildSpec(l.cs), f = buildFocus(sp);
    const ups = PART_ORDER.filter(k => l.cs.parts[k]).map(k => PARTS[k].levels[l.cs.parts[k]].n);
    const kit = carKits(l.cs.id)[l.cs.kit || 0], liv = LIVERIES[l.cs.livery || 0];
    const d = document.createElement('div'); d.className = 'lotcard'; d.id = 'lotcard';
    d.innerHTML = `<div class="panel"><div class="split"><div class="left"><div class="preview bay" id="pv"><div class="pname">${esc(c.name)}</div><div class="pr">PR ${rating(sp)}</div></div>
      <div class="flabel" style="margin:8px 0 4px">${focusLabel(f)}</div>${this.focusHTML(f)}</div>
      <div class="right" style="overflow:visible"><div class="lotprice">${fmtMoney(l.price)} <small style="font-size:14px;color:var(--dim);text-decoration:line-through">${fmtMoney(l.newPrice)}</small></div>
      <div class="sub" style="margin:0">${(l.miles).toLocaleString()} km &middot; ${esc(kit.n)} &middot; ${liv.n === 'None' ? 'plain paint' : esc(liv.n) + ' livery'}</div>
      ${this.statsHTML(sp)}
      <div class="sub" style="color:var(--ink);margin:8px 0 2px">${ups.length} upgrades fitted (worth ${fmtMoney(l.buildValue)} new):</div>
      <div class="meta" style="font-size:12px;color:var(--dim);line-height:1.5">${ups.length ? ups.map(esc).join(' &middot; ') : 'Bone stock.'}</div>
      <div class="row" style="margin-top:10px"><button class="gold" data-a="buyused" data-k="${l.key}" ${SAVE.cash < l.price ? 'disabled' : ''}>${SAVE.cash < l.price ? 'Need ' + fmtMoney(l.price - SAVE.cash) + ' more' : 'Buy for ' + fmtMoney(l.price)}</button>
        <button data-a="uclose">Close</button></div></div></div></div>`;
    d.addEventListener('click', ev => { if (ev.target === d) this.act('uclose', {}); });
    $ui.appendChild(d); this.preview(l.cs, true);
  },
  lotCard(id) {
    const c = CAR_BY_ID[id], own = !!SAVE.cars[id], cs = SAVE.cars[id] || newCarState(id), sp = buildSpec(newCarState(id));
    const d = document.createElement('div'); d.className = 'lotcard'; d.id = 'lotcard';
    d.innerHTML = `<div class="panel"><div class="split"><div class="left"><div class="preview bay" id="pv"><div class="pname">${esc(c.name)}</div><div class="pr">PR ${rating(sp)}</div></div></div>
      <div class="right" style="overflow:visible"><div class="lotprice">${own ? '<span style="color:var(--green)">OWNED</span>' : fmtMoney(c.price)}</div>
      ${this.statsHTML(sp)}<div class="sub">${esc(c.blurb)}</div>
      <div class="sub">${c.gears.length}-speed &middot; ${c.redline} rpm redline &middot; rear-wheel drive</div>
      <div class="row" style="margin-top:10px">${own ? `<button class="ok" data-a="selcar" data-id="${id}">Drive this car</button>` :
        `<button class="gold" data-a="buycar" data-id="${id}" ${SAVE.cash < c.price ? 'disabled' : ''}>${SAVE.cash < c.price ? 'Need ' + fmtMoney(c.price - SAVE.cash) + ' more' : 'Buy for ' + fmtMoney(c.price)}</button>`}
        <button data-a="lotclose">Close</button></div></div></div></div>`;
    $ui.appendChild(d); this.preview(cs, true);
  },
  settings() {
    const ch = (k, opts, lab, help) => `<div class="item"><div class="nm">${lab}<small>${help}</small></div>${opts.map(v => `<button class="${SAVE.settings[k] === v ? 'sel' : ''}" data-a="set" data-k="${k}" data-v="${v}">${v}</button>`).join('')}</div>`;
    const presetOn = k => Object.entries(ASSIST_PRESETS[k]).every(([q, v]) => SAVE.settings[q] === v);
    const s = SAVE.settings, tg = (k, a, b, lab, help) => `<div class="item"><div class="nm">${lab}<small>${help}</small></div>
      <button class="${s[k] === a ? 'sel' : ''}" data-a="set" data-k="${k}" data-v="${a}">${a === true ? 'On' : a}</button><button class="${s[k] === b ? 'sel' : ''}" data-a="set" data-k="${k}" data-v="${b}">${b === false ? 'Off' : b}</button></div>`;
    this.set(`<div class="screen"><div class="top">${this.back()}<h2>Settings</h2></div><div class="list" style="max-width:620px">
      <div class="card"><h3>Drift Assists</h3><div class="meta">Make drifting as easy or as hard as you like. Assists never lower your score.</div>
        <div class="row" style="margin-top:8px">${[['easy', 'Max Easy'], ['normal', 'Default'], ['pro', 'Pro (all off)']].map(([k, n]) => `<button class="${presetOn(k) ? 'sel' : ''}" data-a="apreset" data-k="${k}">${n}</button>`).join('')}</div></div>
      ${ch('cs', ['off', 'low', 'normal', 'max'], 'Countersteer Assist', 'Steers against the slide for you so you catch it.')}
      ${ch('hold', ['off', 'normal', 'strong'], 'Angle Hold', 'Keep the gas down and the car holds its drift angle.')}
      ${tg('spin', true, false, 'Spin Guard', 'Stops the car from over-rotating and spinning out.')}
      ${tg('kick', true, false, 'Auto Drift Start', 'Steer hard on the gas at speed and the back kicks out, no handbrake needed.')}
      ${tg('speedHold', true, false, 'Speed Hold', 'Keeps your speed up through long drifts.')}
      ${tg('softWalls', true, false, 'Soft Walls', 'Bounce gently off walls without losing much speed or your combo.')}
      ${tg('easyHandling', true, false, 'Easy Handling', 'Arcade grip: the car steers itself away from walls, won\'t snap-spin, and lifting off the gas straightens you out.')}
      ${tg('combo', true, false, 'Combo Saver', 'Longer time to link drifts, and gravel or light taps don\'t end your combo.')}
      ${ch('steerSpd', ['slow', 'normal', 'fast'], 'Steering Speed', 'How quickly the wheels turn when you steer.')}
      ${tg('sound', true, false, 'Sound', 'Engine, tyres and menu sounds.')}
      <div class="item"><div class="nm">Music<small>Menu and race music volume.</small></div>${Object.keys(MUSIC_LEVELS).map(v => `<button class="${(s.music || 'normal') === v ? 'sel' : ''}" data-a="set" data-k="music" data-v="${v}">${v}</button>`).join('')}</div>
      <div class="card"><h3>Race Music</h3><div class="meta">Shuffle plays a different track each race. Tap a track to hear it.</div>
        <div class="row" style="margin-top:8px;flex-wrap:wrap">${[['mix', 'Shuffle'], ...RACE_TRACKS.map(k => [k, MUSIC_TRACKS[k].name])].map(([k, n]) => `<button class="${(s.raceMusic || 'mix') === k ? 'sel' : ''}" data-a="set" data-k="raceMusic" data-v="${k}">${n}</button>`).join('')}</div></div>
      ${tg('units', 'kmh', 'mph', 'Speed Units', '')}
      <div class="item"><div class="nm">Touch Controls<small>Auto shows them when you touch the screen.</small></div>${['auto', 'on', 'off'].map(v => `<button class="${s.touch === v ? 'sel' : ''}" data-a="set" data-k="touch" data-v="${v}">${v}</button>`).join('')}</div>
      <div class="card"><h3>Controls</h3><div class="meta">
        Steer <kbd>A</kbd><kbd>D</kbd> or <kbd>&larr;</kbd><kbd>&rarr;</kbd> &middot; Gas <kbd>W</kbd>/<kbd>&uarr;</kbd> &middot; Brake/Reverse <kbd>S</kbd>/<kbd>&darr;</kbd><br>
        Handbrake <kbd>Space</kbd> &middot; Nitrous <kbd>Shift</kbd>/<kbd>N</kbd> &middot; Reset car <kbd>R</kbd> &middot; Pause <kbd>Esc</kbd><br>
        Gamepad: RT gas, LT brake, A handbrake, X nitrous, stick steers.<br><br>
        Drift tip: turn in, tap the handbrake (or lift and floor it), then countersteer and balance the slide with the throttle.</div></div>
      ${STORE_BUILD ? '' : `<div class="item"><div class="nm">Codes<small>Enter a code to redeem a reward.</small></div><input id="codein" type="text" maxlength="24" placeholder="Enter code" autocomplete="off" style="font:inherit;padding:6px 8px;background:#151526;color:#fff;border:1px solid #555;border-radius:4px;width:140px"><button data-a="redeem">Redeem</button></div>`}
      <button data-a="tutorial" style="align-self:flex-start">Replay tutorial</button>
      <button data-a="wipe" style="align-self:flex-start;border-color:var(--red)">Reset all progress</button></div></div>`);
  },

  welcome() {
    const d = document.createElement('div'); d.className = 'screen'; d.id = 'welcome';
    d.innerHTML = `<div style="margin:auto;text-align:center;max-width:560px"><h1 class="title" style="font-size:clamp(30px,7vw,52px)">WELCOME,<br><span>DRIFTER</span></h1>
      <div class="meta" style="line-height:1.7;margin:14px 0">Here's your first car, the <b>Hachi AE</b>, and ${fmtMoney(SAVE.cash)} to spend.<br>
      Take a quick lesson on the Skidpad Lot to learn the controls and how to drift. Finish it for a <span style="color:var(--gold)">$500 bonus</span>.</div>
      <div class="row" style="justify-content:center"><button class="hot" data-a="tutorial">Start tutorial</button><button data-a="skiptut">Skip</button></div>
      <div class="sub">You can replay it any time from Settings.</div></div>`;
    $ui.appendChild(d);
  },
  tutorialEnd(first) {
    if (this.screen !== 'game') return;
    Game.paused = true; this.refreshTouch();
    for (const id of ['hud', 'pauseBtn']) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }
    if (first) Sfx.cash();
    Guide.finale(first);
  },

  startEvent(cfg) { // charges the entry fee (races and tandems) then starts
    const fee = (cfg.event && cfg.event.fee) || 0;
    if (fee) { if (SAVE.cash < fee) { this.toast('Not enough cash for the ' + fmtMoney(fee) + ' entry fee'); return; } SAVE.cash -= fee; persist(); this.toast('Entry fee paid: ' + fmtMoney(fee)); }
    this.startSession(cfg);
  },
  // loading screen before each drive: track picture, weather and a tip while the world holds still
  loading(cfg) {
    const old = document.getElementById('loadscr'); if (old) old.remove();
    const T = TRACKS[cfg.track], wx = WEATHER[cfg.weather] || WEATHER.clear, ev = cfg.event, d = document.createElement('div'); d.id = 'loadscr';
    const what = ev ? ev.name : cfg.mode === 'online' ? 'Online &middot; Room ' + esc(Net.code) : 'Free Drift';
    d.innerHTML = `<div class="loadin"><img src="${trackThumb(cfg.track)}" alt=""><div class="sub" style="margin:8px 0 0;color:var(--gold)">${what}</div><h2>${esc(T.name)}</h2>
      <div class="sub" style="margin:0;color:${wx.col}">${wxIcon(cfg.weather || 'clear')} ${wx.n}${wx.grip < 1 ? ' &middot; less grip' : ''}</div><div class="lbar"><i id="loadbar"></i></div><div class="tip">TIP: ${LOAD_TIPS[(Math.random() * LOAD_TIPS.length) | 0]}</div></div>`;
    document.body.appendChild(d); Game.loading = true;
    const bar = d.querySelector('#loadbar'), t0 = performance.now(), dur = 1100;
    const step = () => { const k = Math.min(1, (performance.now() - t0) / dur); bar.style.width = Math.round(k * 100) + '%';
      if (k < 1 && document.body.contains(d)) return setTimeout(step, 60);
      Game.loading = false; Game.last = 0; d.classList.add('gone'); setTimeout(() => d.remove(), 350); };
    setTimeout(step, 30);
  },
  // ---- gameplay ----
  startSession(cfg) {
    this.lastCfg = cfg; this.screen = 'game'; Game.paused = false;
    Game.session = new Session(cfg); if (cfg.mode !== 'tutorial') this.loading(cfg);
    this.set(`<div class="hud" id="hud" style="inset:0">
      <div class="tl"><div id="h_a" class="big"></div><div id="h_b"></div><div id="h_c" style="color:var(--dim)"></div></div>
      <div class="tr"><div id="h_d" class="big"></div><div id="h_e"></div></div>
      <div class="drift" id="h_drift"><div class="pts" id="h_pts"></div><div class="mul" id="h_mul"></div><div class="tot" id="h_tot"></div></div>
      <div class="pop" id="h_pop"></div><div class="tut" id="h_tut"></div><div class="msg" id="h_msg"></div>
      <div class="spd"><div class="v" id="h_v">0</div><div>${unitN()} &middot; <span id="h_g">1</span></div><div class="rpm"><i id="h_r"></i></div><div class="nos" id="h_nw"><i id="h_n"></i></div></div>
    </div><button id="pauseBtn" data-a="pause">II</button>`);
    this.refreshTouch();
  },
  hud(s) {
    if (this.screen !== 'game') return;
    if (!this.hudEls) { this.hudEls = {}; for (const id of ['h_a', 'h_b', 'h_c', 'h_d', 'h_e', 'h_pts', 'h_mul', 'h_tot', 'h_pop', 'h_msg', 'h_v', 'h_g', 'h_r', 'h_n', 'h_nw', 'h_drift', 'h_tut']) this.hudEls[id] = document.getElementById(id); }
    const E = this.hudEls, p = s.player, T = s.track; if (!E.h_v) return;
    const setT = (el, v) => { if (el && el._v !== v) { el._v = v; el.innerHTML = v; } };
    const lap = clamp(Math.floor(p.totS / T.len) + 1, 1, s.laps || 999);
    if (s.mode === 'race') {
      const ahead = s.ais.filter(a => a.totS > p.totS).length;
      setT(E.h_a, `${ahead + 1}<small>/${s.ais.length + 1}</small>`); setT(E.h_b, `LAP ${lap}/${s.laps}`);
    } else if (s.mode === 'tandem') {
      setT(E.h_a, s.drift.total.toLocaleString()); setT(E.h_b, `LAP ${lap}/${s.laps}`);
      const g = s.tandemGap, m = Math.round(Math.abs(g));
      setT(E.h_c, g < -2 ? '<span style="color:var(--red)">YOU PASSED THE LEAD</span>' : s.tandemF > 1 ? `<span style="color:var(--gold)">TANDEM x${s.tandemF.toFixed(1)} &middot; ${m}m</span>` : `CATCH THE LEAD! ${m}m`);
    } else if (s.mode === 'drift') {
      setT(E.h_a, s.drift.total.toLocaleString()); setT(E.h_b, `LAP ${lap}/${s.laps}`);
      const nx = s.targets.find(t => s.drift.total < t); setT(E.h_c, nx ? `Next medal: ${nx.toLocaleString()}` : 'GOLD!');
    } else if (s.online) {
      setT(E.h_a, s.drift.total.toLocaleString()); setT(E.h_b, Net.peer ? `ROOM <span style="color:var(--gold)">${Net.code}</span> &middot; ${Object.keys(Net.players).length + 1} online` : 'OFFLINE');
      setT(E.h_c, Net.roster().slice(0, 5).map((q, i) => `<div style="color:${q.me ? 'var(--cyan)' : 'var(--ink)'}">${i + 1}. ${esc(q.name)} ${q.score.toLocaleString()}</div>`).join(''));
    } else { setT(E.h_a, s.drift.total.toLocaleString()); setT(E.h_b, `LAP ${lap}`); setT(E.h_c, s.tut ? 'Tutorial' : 'Free drift'); }
    if (s.tut && E.h_tut) {
      const t = s.tut, st = t.step;
      setT(E.h_tut, t.finished || !st ? '' : `<img class="gface" src="${Art.guide(t.doneT > 0 ? 2 : 0)}" alt=""><div class="tbody"><div class="tstep">${GUIDE_NAME} &middot; STEP ${t.i + 1}/${TUTORIAL.length}${t.doneT > 0 ? ' &middot; <span style="color:var(--green)">DONE!</span>' : ''}</div><div class="ttitle">${st.title}</div><div class="ttext">${st.text()}</div></div>`);
      E.h_tut.classList.toggle('ok', t.doneT > 0);
    }
    setT(E.h_d, fmtTime(s.time - s.lapStart)); setT(E.h_e, isFinite(s.bestLap) ? 'BEST ' + fmtTime(s.bestLap) : '');
    const d = s.drift;
    setT(E.h_pts, d.active ? Math.round(d.pts * d.mult).toLocaleString() : '');
    setT(E.h_mul, d.active ? `x${d.mult.toFixed(1)} &middot; ${Math.round(d.angle)}&deg;` : '');
    setT(E.h_tot, d.active ? `<div class="abar"><i style="width:${Math.round(clamp(d.angle / 70, 0, 1) * 100)}%"></i></div>` : '');
    setT(E.h_pop, s.popups.map(u => `<div style="color:${u.color};opacity:${Math.min(1, u.t * 2).toFixed(2)}">${esc(u.text)}</div>`).join(''));
    let msg = '';
    if (s.state === 'count') msg = s.count > 3 ? 'READY' : s.count > 0 ? String(Math.ceil(s.count)) : '';
    else if (s.time < 1 && s.mode !== 'free') msg = 'GO!';
    if (s.state === 'done') msg = 'FINISH';
    const vf = p.vx * Math.cos(p.th) + p.vy * Math.sin(p.th);
    if (s.state === 'run' && p.speed > 4 && vf < -2 && p.thr < 0.1) msg = '';
    if (!msg && s.alert && s.alert.t > 0) msg = `<span class="alert">${esc(s.alert.text)}</span>`;
    setT(E.h_msg, msg);
    setT(E.h_v, String(spdU(p.speed))); setT(E.h_g, vf < -0.5 ? 'R' : String(p.gear));
    E.h_r.style.width = clamp(p.rpm / p.spec.redline, 0, 1) * 100 + '%';
    E.h_nw.style.display = p.spec.nos ? '' : 'none'; if (p.spec.nos) E.h_n.style.width = p.nos * 100 + '%';
  },
  togglePause() {
    const s = Game.session; if (!s || s.attract || s.state === 'done' || this.screen !== 'game') return;
    if (s.online) { Game.netMenu = !Game.netMenu; Game.paused = false; } else Game.paused = !Game.paused;
    const old = document.getElementById('pausemenu'); if (old) old.remove();
    if (s.online && Game.netMenu) {
      const d = document.createElement('div'); d.id = 'pausemenu'; d.className = 'screen';
      d.innerHTML = `<div style="margin:auto;text-align:center"><h1 class="title" style="font-size:40px">ROOM ${esc(Net.code)}</h1><div class="sub">The game keeps running while this menu is open.</div><div class="menu" style="margin:16px auto">
        <button class="hot" data-a="pause">Resume</button><button data-a="reset">Reset car</button><button data-a="netroom">${Net.host ? 'Change map / weather' : 'Players'}</button><button data-a="netleave">Leave room</button></div></div>`;
      $ui.appendChild(d);
    } else if (Game.paused) {
      const d = document.createElement('div'); d.id = 'pausemenu'; d.className = 'screen';
      d.innerHTML = `<div style="margin:auto;text-align:center"><h1 class="title" style="font-size:44px">PAUSED</h1><div class="menu" style="margin:16px auto">
        <button class="hot" data-a="pause">Resume</button><button data-a="reset">Reset car</button>${s.tut ? '<button data-a="skiptut">Skip tutorial</button>' : `<button data-a="restart">Restart${s.cfg.event && s.cfg.event.fee ? ' (' + fmtMoney(s.cfg.event.fee) + ')' : ''}</button>`}<button data-a="quit">Quit to menu</button></div></div>`;
      $ui.appendChild(d);
    }
    this.refreshTouch();
  },
  showResults(r) {
    if (this.screen !== 'game') return;
    const ev = r.event, fee = ev.fee || 0; let head = '', detail = '';
    if (r.mode === 'race') {
      head = r.pos === 1 ? 'YOU WIN!' : ordinal(r.pos) + ' PLACE';
      detail = `Finished ${ordinal(r.pos)} of ${r.field} &middot; Time ${fmtTime(r.time)} &middot; Best lap ${fmtTime(r.bestLap)}`;
      SAVE.usedSeed = (SAVE.usedSeed || 1) + 1; // fresh stock at the used lot
      const b = SAVE.best[ev.id]; if (!b || r.pos < b.pos) SAVE.best[ev.id] = {pos: r.pos};
      SAVE.stats.races++; if (r.pos === 1) SAVE.stats.wins++;
    } else {
      const names = ['NO MEDAL', 'BRONZE', 'SILVER', 'GOLD'];
      head = names[r.medal];
      detail = `Score ${r.score.toLocaleString()} &middot; Biggest drift ${r.bestCombo.toLocaleString()}<br>` + r.targets.map((t, i) => `<span class="medal m${i + 1}"></span>${t.toLocaleString()}`).join(' &nbsp; ');
      SAVE.usedSeed = (SAVE.usedSeed || 1) + 1;
      const b = SAVE.best[ev.id]; if (!b || r.score > b.score) SAVE.best[ev.id] = {score: r.score, medal: r.medal};
      SAVE.stats.bestDrift = Math.max(SAVE.stats.bestDrift, r.bestCombo);
    }
    SAVE.cash += r.reward; persist(); if (r.reward) Sfx.cash();
    const S = Game.session, dmg = S && S.cond0 ? this.damageReport(S) : '';
    Game.paused = true; this.refreshTouch();
    for (const id of ['hud', 'pauseBtn']) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }
    const d = document.createElement('div'); d.className = 'screen';
    d.innerHTML = `<div style="margin:auto;text-align:center;max-width:640px"><div class="sub">${esc(ev.name)}</div><div class="res-big">${head}</div>
      <div class="meta" style="line-height:1.7">${detail}</div><div style="font-size:26px;color:var(--gold);margin:10px 0 2px;text-shadow:3px 3px 0 #000">+${fmtMoney(r.reward)}</div>${r.wxBonus ? `<div class="sub" style="margin:0 0 6px;color:${WEATHER[r.weather].col}">Includes ${WEATHER[r.weather].n} bonus +${fmtMoney(r.wxBonus)}</div>` : ''}
      ${fee ? `<div class="sub" style="margin:0 0 10px">Entry fee ${fmtMoney(fee)} &middot; Profit <span style="color:${r.reward - fee >= 0 ? 'var(--green)' : 'var(--red)'}">${r.reward - fee >= 0 ? '+' : '-'}${fmtMoney(Math.abs(r.reward - fee))}</span></div>` : ''}
      ${dmg}<div class="row" style="justify-content:center"><button data-a="restart" ${SAVE.cash < fee ? 'disabled' : ''}>Retry${fee ? ' (' + fmtMoney(fee) + ')' : ''}</button><button data-a="go" data-to="mechanic">Mechanic</button><button class="hot" data-a="go" data-to="events">Continue</button></div></div>`;
    $ui.appendChild(d);
  },
  damageReport(S) {
    const cs = SAVE.cars[SAVE.current], out = [], b0 = S.cond0.body, b1 = cs.body ?? 100;
    if (b0 - b1 >= 1) out.push(`Body -${Math.round(b0 - b1)}%`);
    const drops = PART_ORDER.map(k => [k, (S.cond0.cond[k] ?? 100) - condOf(cs, k)]).filter(x => x[1] >= 1).sort((a, b) => b[1] - a[1]).slice(0, 3);
    for (const [k, d] of drops) out.push(`${PARTS[k].name} -${Math.round(d)}%`);
    if (!out.length && !S.broken.length) return '';
    return `<div class="sub" style="margin:0 0 10px">${S.broken.length ? `<b style="color:var(--red)">BROKE: ${S.broken.map(esc).join(', ')}</b><br>` : ''}Wear: ${out.join(' &middot; ')} &middot; Car condition ${carHealth(cs)}%</div>`;
  },
  refreshTouch() {
    const s = Game.session, mode = SAVE.settings.touch;
    const show = s && !s.attract && !Game.paused && this.screen === 'game' && (mode === 'on' || (mode === 'auto' && usingTouch));
    $touch.classList.toggle('show', !!show); Game.touchUI = !!show;
    const hud = document.getElementById('hud'); if (hud) hud.classList.toggle('touchmode', !!show);
    const nos = document.getElementById('tb_nos'); if (nos && s && s.player) nos.style.display = s.player.spec.nos ? '' : 'none';

    if (!show) releaseTouch();
  },
  buildTouch() {
    const B = [['left', '&#9664;', 'left:2vmin;bottom:5vmin;width:19vmin;height:24vmin'], ['right', '&#9654;', 'left:23vmin;bottom:5vmin;width:19vmin;height:24vmin'],
      ['gas', 'GAS', 'right:2vmin;bottom:5vmin;width:17vmin;height:34vmin'], ['brake', 'BRAKE', 'right:21vmin;bottom:5vmin;width:17vmin;height:15vmin'],
      ['hand', 'E-BRAKE', 'right:21vmin;bottom:23vmin;width:17vmin;height:16vmin;font-size:12px'], ['nos', 'NOS', 'right:2vmin;bottom:42vmin;width:17vmin;height:11vmin']];
    $touch.innerHTML = B.map(b => `<div class="tb" id="tb_${b[0]}" data-k="${b[0]}" style="${b[2]}">${b[1]}</div>`).join('');
    // fingers: every touch event rebuilds the held set from e.touches, so a lost touchend can't leave a button stuck
    const btns = [...$touch.querySelectorAll('.tb')], hit = (x, y) => {
      for (const el of btns) { if (el.style.display === 'none') continue; const r = el.getBoundingClientRect(); if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return el.dataset.k; }
      return null;
    };
    const sync = e => {
      e.preventDefault();
      const live = new Set();
      for (const t of e.touches) {
        live.add(t.identifier);
        const k = hit(t.clientX, t.clientY);
        if (k) TouchFingers.set(t.identifier, k);
      }
      for (const id of [...TouchFingers.keys()]) if (!live.has(id)) TouchFingers.delete(id);
      updTouch();
    };
    for (const ev of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) $touch.addEventListener(ev, sync, {passive: false});
    // mouse/pen (touch buttons forced on in Settings)
    for (const el of btns) {
      const k = el.dataset.k;
      el.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') return; e.preventDefault(); TouchPointers.set(e.pointerId, k); try { el.setPointerCapture(e.pointerId); } catch (x) {} updTouch(); });
      const off = e => { if (TouchPointers.delete(e.pointerId)) updTouch(); };
      el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('lostpointercapture', off);
      el.addEventListener('contextmenu', e => e.preventDefault());
    }
  },

  // ---- actions ----
  act(a, ds) {
    const cs = SAVE.cars[SAVE.current];
    switch (a) {
      case 'go': this.go(ds.to, ds.t); break;
      case 'start': { const ev = EVENTS.find(e => e.id === ds.ev); this.startEvent({mode: ev.type, weather: eventWeather(ev), track: ev.track, laps: ev.laps, ai: ev.ai, aiSkill: ev.aiSkill, aiTop: ev.aiTop, event: ev}); break; }
      case 'evf': this.evFilter = ds.t; this.events(); break;
      case 'startfree': { let w = this.freeWx || 'clear'; if (w === 'random') { const ks = Object.keys(WEATHER); w = ks[(Math.random() * ks.length) | 0]; } this.startSession({mode: 'free', track: ds.tr, weather: w}); break; }
      case 'fwx': this.freeWx = ds.w; Sfx.beep(620, 0.04); this.free(); break;
      case 'tutorial': Guide.start(); break;
      case 'skiptut': { const d = document.getElementById('welcome'); if (d) d.remove(); SAVE.tutorialDone = true; persist(); Game.paused = false; Game.session = null; this.go('main'); break; }
      case 'testdrive': this.startSession({mode: 'free', track: 'lot'}); break;
      case 'pause': this.togglePause(); break;
      case 'reset': if (Game.session) Game.session.resetPlayer(); this.togglePause(); break;
      case 'netroom': Game.netMenu = false; this.go('online'); break;
      case 'netleave': Game.netMenu = false; Net.leave(true); Net.status = ''; Game.session = null; this.go('online'); break;
      case 'nhost': this.saveNetName(); { const pb = document.getElementById('npub'); if (pb) Net.isPublic = pb.checked; } Net.hostRoom({track: this.mapSel || 'lot', weather: this.netWx || 'clear'}); break;
      case 'njoin': { this.saveNetName(); const i = document.getElementById('ncode'); Net.joinRoom(ds.code || (i && i.value)); break; }
      case 'nrefresh': Net.refreshList(); this.online(); break;
      case 'nmap': this.saveNetName(); this.mapSel = ds.tr; Sfx.beep(620, 0.04); this.online(); break;
      case 'nwx': this.saveNetName(); this.netWx = ds.w; Sfx.beep(620, 0.04); this.online(); break;
      case 'napply': Net.setCfg({track: this.mapSel || 'lot', weather: this.netWx || 'clear'}); break;
      case 'ndrive': Net.start(); break;
      case 'ncopy': try { navigator.clipboard.writeText(Net.code); this.toast('Room code copied'); } catch (e) {} break;
      case 'restart': this.startEvent(this.lastCfg); break;
      case 'quit': if (Game.session && Game.session.online) Net.leave(true); Game.netMenu = false; Game.paused = false; Game.session = null; persist(); this.go('main'); break;
      case 'gtab': this.garage(ds.t); break;
      case 'pcat': this.partCat = ds.k; this.garage(); break;
      case 'selcar': SAVE.current = ds.id; persist(); this.go('garage', 'cars'); break;
      case 'buypart': { const k = ds.k, i = +ds.i, price = partPrice(cs.id, k, i); if (SAVE.cash < price) return;
        SAVE.cash -= price; cs.owned[k].push(i); cs.parts[k] = i; cs.cond[k] = 100; if (k === 'gearbox') cs.tune.gears = defaultGears(CAR_BY_ID[cs.id], cs.parts); persist(); Sfx.cash(); this.toast(PARTS[k].levels[i].n + ' installed'); this.refreshParts(); break; }
      case 'part': this.shopSel = {k: ds.k, i: +ds.i}; Sfx.beep(620, 0.05); this.shop(); break;
      case 'partclose': this.shopSel = null; this.shop(); break;
      case 'aisle': this.aisle = +ds.i; this.shop(); break;
      case 'sfocus': this.shopFocus = ds.k; this.shop(); break;
      case 'shoppart': { this.aisle = PART_GROUPS.findIndex(g => g[1].includes(ds.k)); this.screen = 'shop'; this.shopSel = {k: ds.k, i: +ds.i}; this.shop(); break; }
      case 'livery': { const i = +ds.i, l = LIVERIES[i]; cs.liveries = cs.liveries || [0]; if (!l || (cs.livery || 0) === i) return;
        if (!cs.liveries.includes(i)) { if (SAVE.cash < l.p) { this.toast('Not enough cash'); return; } SAVE.cash -= l.p; cs.liveries.push(i); Sfx.cash(); this.toast(l.n + ' livery applied'); } else Sfx.beep(700, 0.06);
        cs.livery = i; persist(); this.garage(); break; }
      case 'usel': this.usedSel = ds.k; Sfx.beep(620, 0.05); this.used(); break;
      case 'uclose': this.usedSel = null; this.used(); break;
      case 'buyused': { const l = usedStock().find(x => x.key === ds.k); if (!l || SAVE.cash < l.price) return;
        SAVE.cash -= l.price; SAVE.cars[l.cs.id] = l.cs; SAVE.current = l.cs.id; SAVE.usedSold = (SAVE.usedSold || []).concat(l.key).slice(-40);
        persist(); Sfx.cash(); this.toast(CAR_BY_ID[l.cs.id].name + ' is in your garage'); this.usedSel = null; this.used(); break; }
      case 'dyno': this.runDyno(); break;
      case 'dynoopen': this.dynoOpen = true; this.dynoCard(); break;
      case 'dynoclose': this.dynoOpen = false; { const d = document.getElementById('dynocard'); if (d) d.remove(); } break;
      case 'mzone': this.mzone = ds.z; this.mMode = 'repair'; Sfx.beep(620, 0.04); this.mechanic(); break;
      case 'repairzone': { const Z = MECH_ZONES.find(z => z.id === ds.z); let c = 0; if (Z.id === 'body') c = bodyCost(cs); else for (const k of Z.parts) c += repairCost(cs, k); if (SAVE.cash < c || !c) return;
        SAVE.cash -= c; if (Z.id === 'body') cs.body = 100; else for (const k of Z.parts) cs.cond[k] = 100; persist(); Sfx.cash(); this.toast(Z.n + ' fixed'); this.mechanic(); break; }
      case 'repair': { const c = repairCost(cs, ds.k); if (SAVE.cash < c) return; SAVE.cash -= c; cs.cond[ds.k] = 100; persist(); Sfx.cash(); this.mechanic(); break; }
      case 'repairbody': { const c = bodyCost(cs); if (SAVE.cash < c) return; SAVE.cash -= c; cs.body = 100; persist(); Sfx.cash(); this.toast('Body repaired'); this.mechanic(); break; }
      case 'repairall': { let c = bodyCost(cs); for (const k of PART_ORDER) if (WEAR[k]) c += repairCost(cs, k); if (SAVE.cash < c) return;
        SAVE.cash -= c; cs.body = 100; for (const k of PART_ORDER) cs.cond[k] = 100; persist(); Sfx.cash(); this.toast('Good as new!'); this.mechanic(); break; }
      case 'kit': { const i = +ds.i, k = carKits(cs.id)[i]; cs.kits = cs.kits || [0]; if (!k || (cs.kit || 0) === i) return;
        if (!cs.kits.includes(i)) { if (SAVE.cash < k.p) { this.toast('Not enough cash'); return; } SAVE.cash -= k.p; cs.kits.push(i); Sfx.cash(); this.toast(k.n + ' fitted'); } else Sfx.beep(700, 0.06);
        cs.kit = i; persist(); this.garage(); break; }
      case 'gotopart': this.aisle = PART_GROUPS.findIndex(g => g[1].includes(ds.k)); this.go('shop'); break;
      case 'gpick': if (SAVE.current !== ds.id) { SAVE.current = ds.id; persist(); Sfx.beep(760, 0.06); } this.garage(); break;
      case 'mmode': this.mMode = ds.m; Sfx.beep(620, 0.04); this.mechanic(); break;
      case 'gpreset': {
        const c = CAR_BY_ID[cs.id], dg = defaultGears(c, cs.parts), ft = TUNES.find(t => t.k === 'final');
        if (ds.k === 'stock') { cs.tune.gears = dg; cs.tune.final = c.final; }
        if (ds.k === 'accel') { cs.tune.gears = dg; cs.tune.final = clamp(+(c.final * 1.15).toFixed(2), ft.min, ft.max); }
        if (ds.k === 'top') { cs.tune.gears = dg; cs.tune.final = clamp(+(c.final * 0.86).toFixed(2), ft.min, ft.max); }
        if (ds.k === 'drift') { const N = dg.length, a = dg[0] * 0.9, b2 = dg[N - 1] * 1.12; cs.tune.gears = dg.map((g, i) => +(a * Math.pow(b2 / a, i / (N - 1))).toFixed(2)); cs.tune.final = clamp(+(c.final * 1.05).toFixed(2), ft.min, ft.max); }
        persist(); Sfx.beep(700, 0.06); this.refreshTune(); break; }
      case 'install': cs.parts[ds.k] = +ds.i; if (ds.k === 'gearbox') cs.tune.gears = defaultGears(CAR_BY_ID[cs.id], cs.parts); persist(); Sfx.beep(700, 0.06); this.refreshParts(); break;
      case 'tunereset': for (const t of TUNES) if (!t.gb) cs.tune[t.k] = t.def(CAR_BY_ID[cs.id]); persist(); this.refreshTune(); break;
      case 'cos': {
        const k = ds.k, v = k === 'paint' || k === 'stripeColor' ? ds.v : +ds.v; if (cs[k] === v) return;
        const cost = k === 'paint' ? PAINT_COST : k === 'stripeColor' ? 0 : COSMETICS[k].p;
        if (SAVE.cash < cost) { this.toast('Not enough cash'); return; }
        SAVE.cash -= cost; cs[k] = v; persist(); Sfx.beep(cost ? 990 : 700, 0.06); this.garage(); break; }
      case 'dsel': this.dealerSel = ds.id; this.lotOpen = true; this.dealer(); Sfx.beep(620, 0.05); break;
      case 'lotclose': this.lotOpen = false; this.dealer(); break;
      case 'buycar': { const c = CAR_BY_ID[ds.id]; if (SAVE.cash < c.price || SAVE.cars[c.id]) return;
        SAVE.cash -= c.price; SAVE.cars[c.id] = newCarState(c.id); SAVE.current = c.id; persist(); Sfx.cash(); this.toast(c.name + ' is in your garage'); this.dealer(); break; }
      case 'apreset': Object.assign(SAVE.settings, ASSIST_PRESETS[ds.k]); persist(); Sfx.beep(700, 0.06); this.toast('Assists set to ' + {easy: 'Max Easy', normal: 'Default', pro: 'Pro'}[ds.k]); this.settings(); break;
      case 'set': { let v = ds.v; if (v === 'true') v = true; if (v === 'false') v = false; SAVE.settings[ds.k] = v; persist(); if (ds.k === 'sound') Sfx.setOn(v); if (ds.k === 'raceMusic') Music.preview = MUSIC_TRACKS[v] ? v : null; this.settings(); break; }
      case 'iapbuy': IAP.buy(ds.id); break;
      case 'redeem': { if (STORE_BUILD) return; const inp = document.getElementById('codein'), code = (inp && inp.value || '').trim().toLowerCase(), r = CODES[code];
        if (!r) { this.toast(code ? 'Invalid code' : 'Type a code first'); Sfx.beep(220, 0.08); return; }
        SAVE.cash += r.cash; persist(); Sfx.cash(); this.toast('Code redeemed: +' + fmtMoney(r.cash)); this.settings(); break; }
      case 'wipe': if (confirmSafe('Reset all progress? Cars, parts and cash will be lost.')) { SAVE = defaultSave(); persist(); this.go('main'); } break;
    }
  },
};
const thumbCache = {};
function trackThumb(id) {
  if (thumbCache[id]) return thumbCache[id];
  const T = getTrack(id), W = 240, H = 140, c = mkCanvas(W, H), g = c.getContext('2d'), sc = Math.max(W / T.W, H / T.H);
  g.imageSmoothingEnabled = true; g.drawImage(T.canvas, (W - T.W * sc) / 2, (H - T.H * sc) / 2, T.W * sc, T.H * sc);
  return (thumbCache[id] = c.toDataURL());
}
// little text symbols for each kind of weather
function wxIcon(k) { return {clear: '&#9728;', sunset: '&#9680;', night: '&#9790;', fog: '&#8776;', rain: '&#9748;', storm: '&#9889;', snow: '&#10052;'}[k] || ''; }
function ordinal(n) { return n + (n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th'); }
function confirmSafe(msg) { try { return window.confirm(msg); } catch (e) { return true; } }

$ui.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (!b || b.disabled) return; UI.act(b.dataset.a, b.dataset); });
$ui.addEventListener('input', e => {
  const ds = e.target.dataset || {};
  if (ds.gear != null) { // keep ratios in descending order
    const cs = SAVE.cars[SAVE.current], i = +ds.gear, g = buildSpec(cs).gears;
    let v = parseFloat(e.target.value); const hi = i > 0 ? g[i - 1] - 0.05 : GEAR_MAX, lo = i < g.length - 1 ? g[i + 1] + 0.05 : GEAR_MIN;
    v = +clamp(v, lo, hi).toFixed(2); g[i] = v; cs.tune.gears = g; e.target.value = v;
    const lab = document.getElementById('gv_' + i); if (lab) lab.textContent = v.toFixed(2); return;
  }
  const k = ds.tune; if (!k) return;
  const cs = SAVE.cars[SAVE.current], t = TUNES.find(x => x.k === k); cs.tune[k] = parseFloat(e.target.value);
  const lab = document.getElementById('tv_' + k); if (lab) lab.textContent = t.fmt(cs.tune[k]);
});
$ui.addEventListener('change', e => { const ds = e.target.dataset || {}; if (ds.tune || ds.gear != null) { persist(); UI.refreshTune(); } });

// ===== boot =====
// loading screen while every track and background is drawn once, so menus and races don't stutter later
loadSave(); Sfx.on = SAVE.settings.sound;
resize(); UI.buildTouch(); try { IAP.init(); } catch (e) { IAP.enabled = false; }
try { usingTouch = matchMedia('(pointer:coarse)').matches; } catch (e) {}
(function boot() {
  const jobs = Object.keys(TRACKS).map(id => ['Building ' + TRACKS[id].name, () => { getTrack(id); trackThumb(id); }])
    .concat([['Opening the garage', () => Art.get('workshop')], ['Stocking the parts shop', () => Art.get('shop')], ['Waking up the mechanic', () => Art.get('mechShop')], ['Parking cars on the lot', () => Art.get('bunting')]]);
  const bar = document.getElementById('bootbar'), msg = document.getElementById('bootmsg'), el = document.getElementById('boot');
  let i = 0;
  const next = () => {
    if (i < jobs.length) { if (msg) msg.textContent = jobs[i][0] + '...'; try { jobs[i][1](); } catch (e) {} i++; if (bar) bar.style.width = Math.round(i / jobs.length * 100) + '%'; return setTimeout(next, 16); }
    UI.go('main'); if (!SAVE.tutorialDone) Guide.start(); requestAnimationFrame(frame);
    if (el) { el.classList.add('gone'); setTimeout(() => el.remove(), 450); }
  };
  setTimeout(next, 30);
})();
