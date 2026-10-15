import { icon } from './icons.js';
const api = window.perch;
document.body.className =
  new URLSearchParams(location.search).get('view') === 'queue' ? 'queue-view' : 'home-view';
const links = document.querySelector('#links');
const message = document.querySelector('#message');
let lastQueueSignature = '';
const list = document.querySelector('#queue');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const queueDragType = 'application/x-perch-queue-item';
let queueIds = [];
let queueDrag = null;
let suppressPlayUntil = 0;
const reorderAnimations = new Map();
const queueStatus = document.createElement('p');
queueStatus.id = 'queue-status';
queueStatus.className = 'sr-only';
queueStatus.setAttribute('role', 'status');
list.after(queueStatus);
links.addEventListener('input', () => {
  message.textContent = '';
});
async function add(playNow) {
  const result = await api.add(links.value, playNow);
  if (result.error) {
    message.dataset.error = 'true';
    message.textContent = result.error;
    return;
  }
  links.value = '';
  message.dataset.error = 'false';
  message.textContent = result.added
    ? `${result.added} ${result.added === 1 ? 'video' : 'videos'} added.`
    : 'Already in your queue.';
}
document.querySelector('#add-form').addEventListener('submit', (event) => {
  event.preventDefault();
  add(true);
});
document.querySelector('#add-button').addEventListener('click', () => add(false));
document.querySelector('#open-queue').addEventListener('click', () => api.action('queue'));
document.querySelector('#hide').addEventListener('click', () => api.action('hide'));
links.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    add(true);
  }
});
document
  .querySelector('#auto-next')
  .addEventListener('change', (event) => api.action('autoNext', event.target.checked));
function showSettings() {
  if (document.body.classList.contains('home-view')) {
    api.action('settings');
    return;
  }
  document.querySelector('#settings').hidden = false;
  document.querySelector('#settings-button').setAttribute('aria-expanded', 'true');
}
api.onSettings(showSettings);
document.querySelector('#settings-button').addEventListener('click', () => {
  if (document.body.classList.contains('home-view')) return showSettings();
  const node = document.querySelector('#settings');
  node.hidden = !node.hidden;
  document.querySelector('#settings-button').setAttribute('aria-expanded', String(!node.hidden));
});
document
  .querySelector('#allow-two')
  .addEventListener('change', (event) => api.action('allowTwo', event.target.checked));
document.querySelector('#help-button').addEventListener('click', (event) => {
  const panel = document.querySelector('#help');
  panel.hidden = !panel.hidden;
  event.target.setAttribute('aria-expanded', String(!panel.hidden));
});
function isQueueDrag(event) {
  return Boolean(queueDrag || [...(event.dataTransfer?.types || [])].includes(queueDragType));
}
function clearInsertion() {
  list.querySelector('.drop-before')?.classList.remove('drop-before');
  list.classList.remove('drop-at-end');
  if (queueDrag) queueDrag.over = false;
}
function finishQueueDrag() {
  clearInsertion();
  list.querySelector('.dragging')?.classList.remove('dragging');
  document.body.classList.remove('queue-dragging');
  if (queueDrag) suppressPlayUntil = performance.now() + 300;
  queueDrag = null;
}
function insertionAt(y) {
  return (
    [...list.children].find((row) => {
      if (row.dataset.id === queueDrag.id) return false;
      const bounds = row.getBoundingClientRect();
      return y < bounds.top + bounds.height / 2;
    })?.dataset.id || null
  );
}
function markInsertion(beforeId) {
  clearInsertion();
  queueDrag.beforeId = beforeId;
  queueDrag.over = true;
  const row = [...list.children].find((row) => row.dataset.id === beforeId);
  if (row) row.classList.add('drop-before');
  else list.classList.add('drop-at-end');
}
list.addEventListener('dragover', (event) => {
  if (!queueDrag) return;
  event.preventDefault();
  event.stopPropagation();
  event.dataTransfer.dropEffect = 'move';
  markInsertion(insertionAt(event.clientY));
});
list.addEventListener('drop', (event) => {
  if (!queueDrag) return;
  event.preventDefault();
  event.stopPropagation();
  const { id } = queueDrag;
  const beforeId = insertionAt(event.clientY);
  finishQueueDrag();
  api.action('reorder', { id, beforeId });
});
for (const event of ['dragenter', 'dragover'])
  document.addEventListener(event, (e) => {
    e.preventDefault();
    if (isQueueDrag(e)) {
      document.body.classList.remove('drop-active');
      if (!list.contains(e.target)) clearInsertion();
      return;
    }
    document.body.classList.add('drop-active');
  });
document.addEventListener('dragleave', (event) => {
  if (!event.relatedTarget) {
    document.body.classList.remove('drop-active');
    clearInsertion();
  }
});
document.addEventListener('drop', (event) => {
  event.preventDefault();
  document.body.classList.remove('drop-active');
  if (isQueueDrag(event)) {
    finishQueueDrag();
    return;
  }
  const text =
    event.dataTransfer.getData('text/uri-list') || event.dataTransfer.getData('text/plain');
  links.value = text
    .split('\n')
    .filter((line) => !line.startsWith('#'))
    .join('\n');
  links.focus();
});
document.addEventListener('dragend', finishQueueDrag);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && queueDrag) finishQueueDrag();
});
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) {
    for (const animation of reorderAnimations.values()) animation.cancel();
    reorderAnimations.clear();
  }
});

function createQueueRow(item) {
  const row = document.createElement('div');
  row.className = 'queue-item';
  row.dataset.id = item.id;
  row.draggable = true;
  row.setAttribute('role', 'listitem');
  const grip = document.createElement('span');
  grip.className = 'item-grip';
  grip.title = 'Drag to reorder, or use Move up and Move down';
  grip.setAttribute('aria-hidden', 'true');
  grip.innerHTML =
    '<svg viewBox="0 0 8 16" fill="currentColor"><circle cx="2" cy="4" r="1"/><circle cx="6" cy="4" r="1"/><circle cx="2" cy="8" r="1"/><circle cx="6" cy="8" r="1"/><circle cx="2" cy="12" r="1"/><circle cx="6" cy="12" r="1"/></svg>';
  const button = document.createElement('button');
  button.className = 'item-play';
  button.dataset.id = item.id;
  button.dataset.action = 'play';
  const number = document.createElement('span');
  number.className = 'item-index';
  number.setAttribute('aria-hidden', 'true');
  const copy = document.createElement('span');
  copy.className = 'item-copy';
  const title = document.createElement('span');
  title.className = 'item-title';
  const source = document.createElement('span');
  source.className = 'item-source';
  copy.append(title, source);
  button.append(number, copy);
  button.addEventListener('click', () => {
    if (!queueDrag && performance.now() >= suppressPlayUntil) api.action('play', item.id);
  });
  const actions = document.createElement('div');
  actions.className = 'item-actions';
  for (const [name, label, action, value] of [
    ['up', 'Move up', 'move', { id: item.id, direction: -1 }],
    ['down', 'Move down', 'move', { id: item.id, direction: 1 }],
    ['close', 'Remove video', 'remove', item.id],
  ]) {
    const control = document.createElement('button');
    control.className = 'icon-button';
    control.dataset.id = item.id;
    control.dataset.action = label;
    control.title = label;
    control.innerHTML = icon(name);
    control.addEventListener('click', () => api.action(action, value));
    actions.append(control);
  }
  row.append(grip, button, actions);
  let canDrag = true;
  row.addEventListener('pointerdown', (event) => {
    canDrag = !event.target.closest('.item-actions');
  });
  row.addEventListener('dragstart', (event) => {
    if (!canDrag || !queueIds.includes(item.id)) {
      event.preventDefault();
      return;
    }
    for (const animation of reorderAnimations.values()) animation.cancel();
    reorderAnimations.clear();
    queueDrag = { id: item.id, beforeId: null, over: false };
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(queueDragType, item.id);
    document.body.classList.remove('drop-active');
    document.body.classList.add('queue-dragging');
    row.classList.add('dragging');
  });
  return row;
}
function animateReorder(previousPositions) {
  if (reducedMotion.matches || queueDrag) return;
  for (const row of list.children) {
    const previous = previousPositions.get(row.dataset.id);
    if (previous === undefined) continue;
    const delta = Math.max(-120, Math.min(120, previous - row.getBoundingClientRect().top));
    if (Math.abs(delta) < 1) continue;
    const animation = row.animate(
      [{ transform: `translateY(${delta}px)` }, { transform: 'translateY(0)' }],
      { duration: 180, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    );
    reorderAnimations.set(row.dataset.id, animation);
    animation.onfinish = () => {
      if (reorderAnimations.get(row.dataset.id) === animation)
        reorderAnimations.delete(row.dataset.id);
    };
  }
}

function render(state) {
  if (!state) return;
  document.querySelector('#auto-next').checked = state.autoNext;
  document.querySelector('#allow-two').checked = state.allowTwo;
  document.querySelector('#queue-count').textContent = state.queue.length
    ? String(state.queue.length)
    : '';
  document.querySelector('#empty').hidden = Boolean(state.queue.length);
  if (state.toggleShortcutAvailable === false)
    document.querySelector('#keyboard-hint').textContent =
      'Option+Space is in use. Use the menu bar icon.';
  else if (state.muteShortcutAvailable === false)
    document.querySelector('#keyboard-hint').textContent =
      'Option+M is in use. Use M in the player or the menu bar.';
  const signature = JSON.stringify([
    state.currentId,
    state.queue.map((item) => [item.id, item.title]),
    state.players,
    state.media.error,
  ]);
  if (signature === lastQueueSignature) return;
  lastQueueSignature = signature;
  const nextIds = state.queue.map((item) => item.id);
  const reordered =
    queueIds.length === nextIds.length &&
    queueIds.every((id) => nextIds.includes(id)) &&
    queueIds.some((id, index) => id !== nextIds[index]);
  const previousPositions = new Map();
  if (reordered && !queueDrag && !reducedMotion.matches)
    for (const row of list.children)
      previousPositions.set(row.dataset.id, row.getBoundingClientRect().top);
  if (reordered) {
    for (const animation of reorderAnimations.values()) animation.cancel();
    reorderAnimations.clear();
  }
  queueIds = nextIds;
  if (queueDrag && !queueIds.includes(queueDrag.id)) finishQueueDrag();
  const focused = document.activeElement?.dataset;
  const focusedId = focused?.id,
    focusedAction = focused?.action;
  const rows = new Map([...list.children].map((row) => [row.dataset.id, row]));
  for (const [id, row] of rows) if (!queueIds.includes(id)) row.remove();
  state.queue.forEach((item, index) => {
    const row = rows.get(item.id) || createQueueRow(item);
    row.classList.toggle('current', state.activeIds.includes(item.id));
    const button = row.querySelector('.item-play');
    button.setAttribute('aria-label', `Play ${item.title}`);
    const number = row.querySelector('.item-index');
    if (state.activeIds.includes(item.id)) number.innerHTML = icon('play');
    else number.textContent = String(index + 1);
    const title = row.querySelector('.item-title');
    title.textContent = item.title;
    title.title = item.title;
    row.querySelector('.item-source').textContent =
      item.id === state.currentId && state.media.error
        ? state.media.error
        : new URL(item.url).hostname.replace('www.', '') +
          (state.players.some((player) => player.id === item.id)
            ? ` · Player ${state.players.find((player) => player.id === item.id).number}`
            : '');
    for (const control of row.querySelectorAll('.item-actions button')) {
      control.setAttribute('aria-label', `${control.dataset.action}: ${item.title}`);
      control.disabled =
        control.dataset.action === 'Move up'
          ? index === 0
          : control.dataset.action === 'Move down'
            ? index === state.queue.length - 1
            : false;
    }
    // Keep the dragged DOM node alive through media/title state updates.
    if (list.children[index] !== row) list.insertBefore(row, list.children[index] || null);
  });
  if (queueDrag?.over) {
    const beforeId = queueIds.includes(queueDrag.beforeId) ? queueDrag.beforeId : null;
    markInsertion(beforeId);
  }
  if (reordered) {
    animateReorder(previousPositions);
    queueStatus.textContent = 'Queue order updated.';
  }
  if (focusedId && document.activeElement?.dataset.id !== focusedId)
    [...list.querySelectorAll('button')]
      .find((button) => button.dataset.id === focusedId && button.dataset.action === focusedAction)
      ?.focus();
}
api.onState(render);
api.getState().then(render);
links.focus();

if (document.body.classList.contains('home-view')) {
  const header = document.querySelector('header');
  header.style.webkitAppRegion = 'no-drag';
  let dragging = false;
  header.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || !event.isTrusted || event.target.closest('button')) return;
    event.preventDefault();
    dragging = true;
    header.setPointerCapture(event.pointerId);
    api.action('drag', { phase: 'start', x: event.screenX, y: event.screenY });
  });
  document.addEventListener(
    'pointermove',
    (event) => {
      if (dragging && event.isTrusted)
        api.action('drag', { phase: 'move', x: event.screenX, y: event.screenY });
    },
    true,
  );
  const stop = () => {
    if (dragging) {
      dragging = false;
      api.action('drag', { phase: 'end' });
    }
  };
  document.addEventListener('pointerup', stop, true);
  document.addEventListener('pointercancel', stop, true);
  window.addEventListener('blur', stop);
}
