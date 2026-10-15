import { icon } from './icons.js';
const api = window.perch;
document.body.className = new URLSearchParams(location.search).get('view') === 'queue' ? 'queue-view' : 'home-view';
const links = document.querySelector('#links');
const message = document.querySelector('#message');
let lastQueueSignature = '';
links.addEventListener('input', () => { message.textContent = ''; });
async function add(playNow) {
  const result = await api.add(links.value, playNow);
  if (result.error) { message.dataset.error = 'true'; message.textContent = result.error; return; }
  links.value = ''; message.dataset.error = 'false'; message.textContent = result.added ? `${result.added} ${result.added === 1 ? 'video' : 'videos'} added.` : 'Already in your queue.';
}
document.querySelector('#add-form').addEventListener('submit', event => { event.preventDefault(); add(true); });
document.querySelector('#add-button').addEventListener('click', () => add(false));
document.querySelector('#open-queue').addEventListener('click', () => api.action('queue'));
document.querySelector('#hide').addEventListener('click', () => api.action('hide'));
links.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); add(true); } });
document.querySelector('#auto-next').addEventListener('change', event => api.action('autoNext', event.target.checked));
function showSettings() { if (document.body.classList.contains('home-view')) { api.action('settings'); return; } document.querySelector('#settings').hidden = false; document.querySelector('#settings-button').setAttribute('aria-expanded', 'true'); }
api.onSettings(showSettings);
document.querySelector('#settings-button').addEventListener('click', () => { if (document.body.classList.contains('home-view')) return showSettings(); const node = document.querySelector('#settings'); node.hidden = !node.hidden; document.querySelector('#settings-button').setAttribute('aria-expanded', String(!node.hidden)); });
document.querySelector('#allow-two').addEventListener('change', event => api.action('allowTwo', event.target.checked));
document.querySelector('#help-button').addEventListener('click', event => { const panel = document.querySelector('#help'); panel.hidden = !panel.hidden; event.target.setAttribute('aria-expanded', String(!panel.hidden)); });
for (const event of ['dragenter', 'dragover']) document.addEventListener(event, e => { e.preventDefault(); document.body.classList.add('drop-active'); });
document.addEventListener('dragleave', event => { if (!event.relatedTarget) document.body.classList.remove('drop-active'); });
document.addEventListener('drop', event => { event.preventDefault(); document.body.classList.remove('drop-active'); const text = event.dataTransfer.getData('text/uri-list') || event.dataTransfer.getData('text/plain'); links.value = text.split('\n').filter(line => !line.startsWith('#')).join('\n'); links.focus(); });

function render(state) {
  if (!state) return;
  document.querySelector('#auto-next').checked = state.autoNext;
  document.querySelector('#allow-two').checked = state.allowTwo;
  document.querySelector('#queue-count').textContent = state.queue.length ? String(state.queue.length) : '';
  document.querySelector('#empty').hidden = Boolean(state.queue.length);
  if (state.toggleShortcutAvailable === false) document.querySelector('#keyboard-hint').textContent = 'Option+Space is in use. Use the menu bar icon.';
  else if (state.muteShortcutAvailable === false) document.querySelector('#keyboard-hint').textContent = 'Option+M is in use. Use M in the player or the menu bar.';
  else if (state.shortcutAvailable === false) document.querySelector('#keyboard-hint').textContent = 'Global shortcut is in use. Use the menu bar icon.';
  const signature = JSON.stringify([state.currentId, state.queue.map(item => [item.id, item.title]), state.players, state.media.error]);
  if (signature === lastQueueSignature) return;
  lastQueueSignature = signature;
  const list = document.querySelector('#queue');
  const focused = document.activeElement?.dataset;
  const focusedId = focused?.id, focusedAction = focused?.action;
  list.replaceChildren();
  state.queue.forEach((item, index) => {
    const row = document.createElement('div'); row.className = `queue-item${state.activeIds.includes(item.id) ? ' current' : ''}`; row.setAttribute('role', 'listitem');
    const button = document.createElement('button'); button.className = 'item-play'; button.dataset.id = item.id; button.dataset.action = 'play'; button.setAttribute('aria-label', `Play ${item.title}`);
    const number = document.createElement('span'); number.className = 'item-index'; if (state.activeIds.includes(item.id)) number.innerHTML = icon('play'); else number.textContent = String(index + 1);
    const copy = document.createElement('span'); copy.className = 'item-copy';
    const title = document.createElement('span'); title.className = 'item-title'; title.textContent = item.title; title.title = item.title;
    const source = document.createElement('span'); source.className = 'item-source'; source.textContent = item.id === state.currentId && state.media.error ? state.media.error : new URL(item.url).hostname.replace('www.', '') + (state.players.some(player => player.id === item.id) ? ` · Player ${state.players.find(player => player.id === item.id).number}` : '');
    copy.append(title, source); button.append(number, copy); button.addEventListener('click', () => api.action('play', item.id)); row.append(button);
    const actions = document.createElement('div'); actions.className = 'item-actions';
    for (const [name, label, action, value, disabled] of [['up', 'Move up', 'move', { id: item.id, direction: -1 }, index === 0], ['down', 'Move down', 'move', { id: item.id, direction: 1 }, index === state.queue.length - 1], ['close', 'Remove video', 'remove', item.id, false]]) {
      const control = document.createElement('button'); control.className = 'icon-button'; control.dataset.id = item.id; control.dataset.action = label; control.setAttribute('aria-label', `${label}: ${item.title}`); control.title = label; control.innerHTML = icon(name); control.disabled = disabled; control.addEventListener('click', () => api.action(action, value)); actions.append(control);
    }
    row.append(actions); list.append(row);
  });
  if (focusedId) [...list.querySelectorAll('button')].find(button => button.dataset.id === focusedId && button.dataset.action === focusedAction)?.focus();
}
api.onState(render);
api.getState().then(render);
links.focus();

if (document.body.classList.contains('home-view')) {
  const header = document.querySelector('header'); header.style.webkitAppRegion = 'no-drag';
  let dragging = false;
  header.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isTrusted || event.target.closest('button')) return;
    event.preventDefault();
    dragging = true; header.setPointerCapture(event.pointerId); api.action('drag', { phase: 'start', x: event.screenX, y: event.screenY });
  });
  document.addEventListener('pointermove', event => { if (dragging && event.isTrusted) api.action('drag', { phase: 'move', x: event.screenX, y: event.screenY }); }, true);
  const stop = () => { if (dragging) { dragging = false; api.action('drag', { phase: 'end' }); } };
  document.addEventListener('pointerup', stop, true); document.addEventListener('pointercancel', stop, true); window.addEventListener('blur', stop);
}
