const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, globalShortcut, screen, shell, powerMonitor, net } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { parseLinks, addItems, recoverBounds } = require('./core.cjs');
const { createStore } = require('./store.cjs');

const testing = process.argv.includes('--perch-test');
if (testing && process.env.PERCH_TEST_DATA) app.setPath('userData', process.env.PERCH_TEST_DATA);
app.setName('Perch');
if (!testing && !app.requestSingleInstanceLock()) app.quit();

const players = new Map();
const securedSessions = new WeakSet();
let queueWindow, tray, store, saveTimer, quitting = false, lastActive = null;
let shortcutAvailable = true, toggleShortcutAvailable = true, muteShortcutAvailable = true, lastMediaSave = 0;
const homePath = path.join(__dirname, 'index.html');
const homeURL = pathToFileURL(homePath).href;
const preload = path.join(__dirname, '../dist/preload.cjs');
const active = () => players.get(lastActive) || players.values().next().value;
const itemFor = session => store.state.queue.find(item => item.id === session?.itemId);
const sessionFor = event => event.senderFrame === event.sender.mainFrame ? players.get(event.sender.id) : undefined;
function trusted(event) {
  return event.senderFrame === event.sender.mainFrame && event.senderFrame.url.split('?')[0] === homeURL && (players.has(event.sender.id) || event.sender.id === queueWindow?.webContents.id);
}
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { try { store.save(); } catch (error) { console.error('Could not save Perch state:', error.message); } }, 250);
}
function snapshot(session = active()) {
  const playing = [...players.values()].filter(entry => entry.itemId);
  return { ...store.state, currentId: session?.itemId || null, media: session?.media || {}, active: Boolean(session?.itemId), shortcutAvailable, toggleShortcutAvailable, muteShortcutAvailable,
    players: playing.map(entry => ({ id: entry.itemId, number: entry.number, paused: entry.media.paused !== false })), activeIds: playing.map(entry => entry.itemId) };
}
function broadcast() {
  for (const session of players.values()) if (!session.win.isDestroyed()) session.win.webContents.send('perch-state', snapshot(session));
  if (queueWindow && !queueWindow.isDestroyed()) queueWindow.webContents.send('perch-state', snapshot());
}
function floating(win) {
  win.setAlwaysOnTop(store.state.pinned, 'floating');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
}
function send(session, command, value) { if (session && !session.win.isDestroyed()) session.win.webContents.send('media-command', { command, value }); }
function reveal(session) {
  if (!session || session.win.isDestroyed()) return;
  session.win.setBounds(recoverBounds(session.win.getBounds(), screen.getAllDisplays()));
  floating(session.win); session.win.showInactive();
}
function showPlayers() { if (!players.size) createPlayer(); for (const session of players.values()) reveal(session); }
function togglePlayers() {
  if ([...players.values()].some(session => session.win.isVisible())) for (const session of players.values()) session.win.hide();
  else showPlayers();
}
function closePlayer(session) {
  if (!session) return;
  session.autoplay = false;
  send(session, 'pause');
  if (players.size > 1) session.win.destroy(); else session.win.hide();
}
function secureContents(contents, localOnly = false) {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  const check = (event, url) => {
    try {
      const parsed = new URL(url);
      const localTest = testing && parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname);
      if (localOnly || parsed.protocol !== 'https:' && !localTest || parsed.username || parsed.password) event.preventDefault();
    } catch { event.preventDefault(); }
  };
  contents.on('will-navigate', check); contents.on('will-redirect', check);
  if (!securedSessions.has(contents.session)) {
    securedSessions.add(contents.session);
    contents.session.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
    contents.session.setPermissionCheckHandler(() => false);
    contents.session.on('will-download', event => event.preventDefault());
  }
}
function createPlayer(home = true) {
  const anchor = active()?.win.getBounds() || store.state.bounds;
  const desired = players.size && anchor ? { ...anchor, x: anchor.x - 40, y: anchor.y - 40 } : anchor;
  const win = new BrowserWindow({ ...recoverBounds(desired, screen.getAllDisplays()), minWidth: 320, minHeight: 180, frame: false, type: 'panel', title: 'Perch', backgroundColor: '#121212', roundedCorners: true, resizable: true, minimizable: false, fullscreenable: false, show: false, acceptFirstMouse: true,
    webPreferences: { preload, contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true, partition: testing ? 'perch-test' : 'persist:perch-media', additionalArguments: [`--perch-home=${homeURL}`] } });
  const contentsId = win.webContents.id;
  const session = { win, itemId: null, generation: 0, autoplay: true, number: [1, 2].find(number => ![...players.values()].some(entry => entry.number === number)) || 1, media: {} };
  players.set(contentsId, session); lastActive = contentsId;
  win.setAspectRatio(16 / 9); floating(win); secureContents(win.webContents);
  if (home) { win.loadFile(homePath); win.once('ready-to-show', () => win.showInactive()); }
  win.webContents.on('did-finish-load', broadcast);
  win.webContents.on('did-fail-load', (_event, code, _description, _url, mainFrame) => {
    if (!mainFrame || code === -3) return;
    session.media = { ...session.media, error: 'This page could not load. Check your connection, then try again.' }; lastActive = contentsId; openQueue(); broadcast();
  });
  win.webContents.on('render-process-gone', () => { session.media = { error: 'The player stopped unexpectedly. Choose a video to reload it.' }; lastActive = contentsId; openQueue(); broadcast(); });
  win.on('focus', () => { lastActive = contentsId; store.state.currentId = session.itemId; broadcast(); });
  const boundsChanged = () => { store.state.bounds = win.getBounds(); persist(); };
  win.on('moved', boundsChanged); win.on('resized', boundsChanged);
  win.on('close', event => { if (!quitting) { event.preventDefault(); closePlayer(session); } });
  win.on('closed', () => { players.delete(contentsId); if (lastActive === contentsId) lastActive = players.keys().next().value; store.state.currentId = active()?.itemId || null; persist(); broadcast(); });
  return session;
}
function openQueue(settings = false) {
  if (queueWindow && !queueWindow.isDestroyed()) { queueWindow.show(); queueWindow.focus(); broadcast(); if (settings) queueWindow.webContents.send('perch-settings'); return; }
  queueWindow = new BrowserWindow({ width: 400, height: 520, minWidth: 360, minHeight: 360, title: 'Perch · Queue', backgroundColor: '#181818', titleBarStyle: 'hiddenInset', show: false,
    webPreferences: { preload, contextIsolation: true, sandbox: true, nodeIntegration: false, additionalArguments: [`--perch-home=${homeURL}`] } });
  secureContents(queueWindow.webContents, true); floating(queueWindow);
  queueWindow.loadFile(homePath, { query: { view: 'queue' } });
  queueWindow.once('ready-to-show', () => { queueWindow.show(); if (settings) queueWindow.webContents.send('perch-settings'); });
  queueWindow.webContents.on('did-finish-load', broadcast);
  queueWindow.on('closed', () => { queueWindow = null; });
}
function playItem(id, { target = active(), revealWindow = true, newPlayer = false, reload = false } = {}) {
  const item = store.state.queue.find(entry => entry.id === id);
  if (!item) return;
  const existing = [...players.values()].find(session => session.itemId === id);
  if (existing) {
    target = existing;
    if (!reload && !existing.media.error) { lastActive = existing.win.webContents.id; if (revealWindow) reveal(existing); return; }
  }
  if (newPlayer && store.state.allowTwo && target?.itemId && target.itemId !== id) {
    if ([...players.values()].filter(session => session.itemId).length >= 2) throw new Error('Two players are already open. Close one, or click a queued video to replace the selected player.');
    target = createPlayer(false);
  }
  if (!target) target = createPlayer(false);
  target.itemId = id; target.generation += 1; lastActive = target.win.webContents.id; store.state.currentId = id;
  target.autoplay = true;
  target.media = { loading: true, title: item.title, paused: true };
  target.win.webContents.loadURL(item.url).catch(() => {});
  if (revealWindow) reveal(target);
  persist(); broadcast();
}
function step(session, direction, automatic = false) {
  if (!session) return;
  const index = store.state.queue.findIndex(item => item.id === session.itemId);
  const occupied = new Set([...players.values()].filter(entry => entry !== session).map(entry => entry.itemId));
  let next = index + direction;
  while (next >= 0 && next < store.state.queue.length && occupied.has(store.state.queue[next].id)) next += direction;
  if (next >= 0 && next < store.state.queue.length) playItem(store.state.queue[next].id, { target: session, revealWindow: !automatic });
  else if (!automatic) { session.media.notice = direction > 0 ? 'No more queued videos.' : 'This is the first available video.'; broadcast(); }
}
async function resolveTitle(item) {
  if (new URL(item.url).hostname !== 'www.youtube.com') return;
  try {
    const response = await net.fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(item.url)}&format=json`, { signal: AbortSignal.timeout(6000) });
    if (!response.ok) return;
    const metadata = await response.json(), queued = store.state.queue.find(entry => entry.id === item.id);
    if (queued && typeof metadata.title === 'string') { queued.title = metadata.title.slice(0, 240); persist(); broadcast(); }
  } catch { /* Optional metadata must not block playback. */ }
}
function action(name, value, target = active()) {
  switch (name) {
    case 'drag': {
      if (!target || !value) break;
      if (value.phase === 'end') { target.drag = null; target.win.setBounds(recoverBounds(target.win.getBounds(), screen.getAllDisplays())); break; }
      if (!Number.isFinite(value.x) || !Number.isFinite(value.y)) break;
      if (value.phase === 'start') target.drag = { x: value.x, y: value.y, bounds: target.win.getBounds() };
      else if (value.phase === 'move' && target.drag) target.win.setPosition(Math.round(target.drag.bounds.x + value.x - target.drag.x), Math.round(target.drag.bounds.y + value.y - target.drag.y));
      break;
    }
    case 'muteAll': {
      const playing = [...players.values()].filter(session => session.itemId);
      if (!playing.length) break;
      const muted = playing.some(session => session.media.muted !== true && session.media.volume !== 0);
      store.state.muted = muted;
      for (const session of playing) send(session, 'setMuted', muted);
      persist(); break;
    }
    case 'queue': openQueue(); break;
    case 'settings': openQueue(true); break;
    case 'hide': closePlayer(target); break;
    case 'show': showPlayers(); break;
    case 'play': playItem(String(value), { target }); break;
    case 'next': step(target, 1); break;
    case 'previous': step(target, -1); break;
    case 'pin': store.state.pinned = !store.state.pinned; for (const session of players.values()) floating(session.win); if (queueWindow) floating(queueWindow); persist(); broadcast(); break;
    case 'autoNext': store.state.autoNext = Boolean(value); persist(); broadcast(); break;
    case 'allowTwo': {
      store.state.allowTwo = Boolean(value);
      if (!store.state.allowTwo) for (const session of [...players.values()]) if (session !== target) { send(session, 'pause'); session.win.destroy(); }
      persist(); broadcast(); break;
    }
    case 'external': if (itemFor(target)) shell.openExternal(itemFor(target).url); break;
    case 'retry': if (target?.itemId) playItem(target.itemId, { target, reload: true }); break;
    case 'home': {
      if (!target) break;
      send(target, 'pause'); target.itemId = null; target.generation += 1; target.media = {}; target.win.loadFile(homePath); store.state.currentId = null; persist(); broadcast(); break;
    }
    case 'remove': {
      const index = store.state.queue.findIndex(item => item.id === value);
      if (index < 0) break;
      store.state.queue.splice(index, 1);
      for (const session of [...players.values()]) if (session.itemId === value) {
        const occupied = new Set([...players.values()].filter(entry => entry !== session).map(entry => entry.itemId));
        const replacement = [...store.state.queue.slice(index), ...store.state.queue.slice(0, index)].find(item => !occupied.has(item.id));
        if (replacement) playItem(replacement.id, { target: session, revealWindow: session.win.isVisible() });
        else if (players.size > 1) session.win.destroy(); else action('home', undefined, session);
      }
      persist(); broadcast(); break;
    }
    case 'move': {
      const index = store.state.queue.findIndex(item => item.id === value?.id), destination = index + (value?.direction === -1 ? -1 : 1);
      if (index < 0 || destination < 0 || destination >= store.state.queue.length) break;
      const [item] = store.state.queue.splice(index, 1); store.state.queue.splice(destination, 0, item); persist(); broadcast(); break;
    }
    default: if (['toggle', 'pause', 'seek', 'seekTo', 'volume', 'mute', 'rate', 'reveal'].includes(name)) send(target, name, value);
  }
}

ipcMain.handle('perch:get', event => trusted(event) ? snapshot(players.get(event.sender.id) || active()) : null);
ipcMain.handle('perch:action', (event, name, value) => { if (trusted(event)) action(name, value, players.get(event.sender.id) || active()); });
ipcMain.handle('perch:add', (event, text, playNow) => {
  if (!trusted(event)) return { error: 'Not available on this page.' };
  try {
    const urls = parseLinks(text, testing), target = players.get(event.sender.id) || active();
    // Capacity is checked before mutating the queue, including repeated Play clicks.
    const requested = store.state.queue.find(item => item.url === urls[0]);
    const alreadyPlaying = requested && [...players.values()].some(session => session.itemId === requested.id);
    if (playNow && store.state.allowTwo && target?.itemId && !alreadyPlaying && [...players.values()].filter(session => session.itemId).length >= 2) return { error: 'Two players are already open. Close one, or click a queued video to replace the selected player.' };
    const before = store.state.queue.length; store.state.queue = addItems(store.state.queue, urls);
    for (const item of store.state.queue.slice(before)) resolveTitle(item);
    const id = store.state.queue.find(item => item.url === urls[0]).id;
    if (playNow || ![...players.values()].some(session => session.itemId)) playItem(id, { target, newPlayer: Boolean(playNow) });
    persist(); broadcast(); return { added: store.state.queue.length - before };
  } catch (error) { return { error: error.message }; }
});
ipcMain.on('player-action', (event, name, value) => { const session = sessionFor(event); if (session) { lastActive = event.sender.id; action(name, value, session); } });
ipcMain.on('media-ready', event => {
  const session = sessionFor(event); if (!session) return;
  event.sender.send('media-init', { ...snapshot(session), generation: session.generation, autoplay: session.autoplay, resumeAt: itemFor(session)?.position || 0 });
});
ipcMain.on('media-state', (event, state) => {
  const session = sessionFor(event); if (!session || !state || state.generation !== session.generation) return;
  // Chromium's internal error document also runs the preload. Its empty media
  // status must not erase the actionable network failure recorded above.
  if (!/^https?:/.test(event.senderFrame.url)) return;
  session.media = { title: String(state.title || 'Video').slice(0, 240), currentTime: Number(state.currentTime) || 0, duration: Number.isFinite(state.duration) ? state.duration : 0, paused: Boolean(state.paused), muted: Boolean(state.muted), volume: Number.isFinite(state.volume) ? state.volume : 1, loading: Boolean(state.loading), seekable: Boolean(state.seekable), error: typeof state.error === 'string' ? state.error.slice(0, 300) : null };
  const item = itemFor(session); if (item) { item.title = session.media.title; item.position = session.media.currentTime; }
  store.state.muted = Boolean(state.muted);
  if (Number.isFinite(state.volume)) { store.state.volume = Math.max(0, Math.min(1, state.volume)); if (store.state.volume > 0) store.state.audibleVolume = store.state.volume; }
  if ([0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].includes(state.rate)) store.state.rate = state.rate;
  if (Date.now() - lastMediaSave > 10000) { persist(); lastMediaSave = Date.now(); }
  broadcast();
});
ipcMain.on('media-ended', (event, generation) => {
  const session = sessionFor(event); if (!session || generation !== session.generation) return;
  if (itemFor(session)) itemFor(session).position = 0;
  if (store.state.autoNext && session.autoplay !== false) step(session, 1, true);
  persist(); broadcast();
});

app.whenReady().then(() => {
  store = createStore(app.getPath('userData'), testing); createPlayer();
  const icon = nativeImage.createFromPath(path.join(__dirname, '../assets/trayTemplate.png')).resize({ width: 18, height: 18 }); icon.setTemplateImage(true);
  tray = new Tray(icon); tray.setToolTip('Perch');
  tray.setContextMenu(Menu.buildFromTemplate([{ label: 'Show / Hide', accelerator: 'Alt+Space', click: togglePlayers }, { label: 'Queue…', click: () => openQueue() }, { label: 'Settings…', click: () => openQueue(true) }, { label: 'Mute / Unmute', accelerator: 'Alt+M', click: () => action('muteAll') }, { type: 'separator' }, { label: 'Reset position', click: () => { let offset = 0; for (const session of players.values()) { const bounds = recoverBounds(null, [screen.getPrimaryDisplay()]); session.win.setBounds({ ...bounds, x: bounds.x - offset, y: bounds.y - offset }); offset += 40; reveal(session); } } }, { type: 'separator' }, { label: 'Quit Perch', click: () => app.quit() }]));
  Menu.setApplicationMenu(Menu.buildFromTemplate([{ label: 'Perch', submenu: [{ role: 'about' }, { type: 'separator' }, { label: 'Show players', accelerator: 'CommandOrControl+Shift+P', click: showPlayers }, { label: 'Queue / Open links', accelerator: 'CommandOrControl+O', click: () => openQueue() }, { label: 'Settings', accelerator: 'CommandOrControl+,', click: () => openQueue(true) }, { type: 'separator' }, { role: 'quit' }] }, { role: 'editMenu' }, { label: 'Playback', submenu: [{ label: 'Play / Pause', click: () => send(active(), 'toggle') }, { label: 'Next video', accelerator: 'CommandOrControl+Shift+Right', click: () => step(active(), 1) }, { label: 'Previous video', accelerator: 'CommandOrControl+Shift+Left', click: () => step(active(), -1) }] }]));
  if (!testing || process.argv.includes('--perch-test-shortcuts')) { shortcutAvailable = globalShortcut.register('CommandOrControl+Shift+P', showPlayers); toggleShortcutAvailable = globalShortcut.register('Alt+Space', togglePlayers); muteShortcutAvailable = globalShortcut.register('Alt+M', () => action('muteAll'));  }
  const recover = () => { for (const session of players.values()) { session.win.setBounds(recoverBounds(session.win.getBounds(), screen.getAllDisplays())); floating(session.win); } };
  for (const event of ['display-added', 'display-removed', 'display-metrics-changed']) screen.on(event, recover);
  powerMonitor.on('resume', recover); powerMonitor.on('unlock-screen', recover);
});
app.on('activate', () => { if (store) showPlayers(); });
app.on('second-instance', showPlayers);
app.on('window-all-closed', () => {});
app.on('before-quit', () => { quitting = true; clearTimeout(saveTimer); if (store) { try { store.save(); } catch {} } });
app.on('will-quit', () => globalShortcut.unregisterAll());
