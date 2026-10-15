import playerStyles from './player.css';
import { iconNode } from './icons.js';
const time = (value) => {
  const s = Math.max(0, Math.floor(Number(value) || 0));
  return s >= 3600
    ? `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
    : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export function createPlayerUI(onAction) {
  const host = document.createElement('div');
  host.id = 'perch-player';
  host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none;';
  const root = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = playerStyles;
  root.append(style);
  const make = (tag, className, parent, attrs = {}) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    parent.append(node);
    return node;
  };
  const button = (parent, action, label, name, title = label, value) => {
    const node = make('button', '', parent, { 'data-action': action, 'aria-label': label, title });
    if (value !== undefined) node.dataset.value = value;
    node.append(iconNode(name));
    return node;
  };
  const panel = make('div', 'chrome', root);
  const top = make('div', 'top', panel);
  const brand = make('div', 'brand', top);
  brand.append(iconNode('perch'));
  make('span', 'title', brand).textContent = 'Perch';
  const captions = button(top, 'captions', 'Captions', 'captions', 'Captions (C)');
  captions.className = 'captions';
  captions.setAttribute('aria-pressed', 'false');
  captions.disabled = true;
  const pin = button(top, 'pin', 'Keep on top', 'pin');
  pin.className = 'pin';
  pin.setAttribute('aria-pressed', 'true');
  button(top, 'external', 'Open in browser', 'external');
  const queueButton = button(top, 'queue', 'Open queue', 'queue', 'Queue / Open links (⌘O)');
  queueButton.className = 'queue-button';
  make('span', 'queue-label', queueButton).textContent = '0';
  button(top, 'hide', 'Pause and hide', 'close');
  make('div', 'video-missing', panel);
  make('div', 'badge', panel, { role: 'status' });
  make('div', 'notice', panel, { role: 'status' });
  const bottom = make('div', 'bottom', panel);
  make('input', 'timeline', bottom, {
    'aria-label': 'Video timeline',
    type: 'range',
    min: '0',
    max: '100',
    step: '.1',
    value: '0',
    disabled: '',
  });
  const row = make('div', 'row', bottom);
  button(row, 'previous', 'Previous video', 'previous', 'Previous video (⌘⇧←)');
  button(row, 'toggle', 'Play', 'play', 'Play / Pause (Space, K)');
  button(row, 'seek', 'Back 10 seconds', 'back', 'Back 10 seconds (J)', '-10');
  button(row, 'seek', 'Forward 10 seconds', 'forward', 'Forward 10 seconds (L)', '10');
  button(row, 'next', 'Next video', 'next', 'Next video (⌘⇧→)');
  make('span', 'time', row).textContent = '0:00 / 0:00';
  make('span', 'spacer', row);
  const volume = make('div', 'volume', row);
  button(volume, 'mute', 'Mute', 'volume', 'Mute (M)');
  make('input', 'volume-range', volume, {
    type: 'range',
    'aria-label': 'Volume',
    min: '0',
    max: '1',
    step: '.05',
    value: '1',
  });
  const rate = make('select', '', row, { 'aria-label': 'Playback speed', title: 'Playback speed' });
  for (const value of [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]) {
    const option = make('option', '', rate, { value: String(value) });
    option.textContent = `${value}×`;
  }
  rate.value = '1';
  document.documentElement.append(host);
  // A transparent surface catches video gestures above the site's own controls.
  // Our buttons/sliders remain above it and keep their native interactions.
  const dragHandle = document.createElement('div');
  dragHandle.id = 'perch-drag';
  dragHandle.tabIndex = -1;
  dragHandle.setAttribute('role', 'group');
  dragHandle.setAttribute('aria-label', 'Video surface');
  dragHandle.style.cssText =
    'position:fixed;inset:0;z-index:2147483646;touch-action:none;user-select:none;outline:none;';
  document.documentElement.append(dragHandle);
  host.style.userSelect = 'none';
  let gesture, holdTimer;
  const isControl = (event) =>
    event
      .composedPath()
      .some((node) => node?.matches?.('button,input,select,a,[contenteditable=true]'));
  const isSurface = (event) =>
    event.composedPath().includes(dragHandle) || event.composedPath().includes(host);
  const startDrag = () => {
    if (!gesture || gesture.dragging) return;
    gesture.dragging = true;
    clearTimeout(holdTimer);
    dragHandle.style.cursor = 'grabbing';
    onAction('drag', { phase: 'start', x: gesture.x, y: gesture.y });
  };
  document.addEventListener(
    'pointerdown',
    (event) => {
      if (event.button !== 0 || !event.isTrusted || !isSurface(event) || isControl(event)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      reveal();
      gesture = { id: event.pointerId, x: event.screenX, y: event.screenY, dragging: false };
      dragHandle.focus({ preventScroll: true });
      dragHandle.setPointerCapture(event.pointerId);
      holdTimer = setTimeout(startDrag, 180);
    },
    true,
  );
  document.addEventListener(
    'pointermove',
    (event) => {
      if (!gesture || event.pointerId !== gesture.id || !event.isTrusted) return;
      if (Math.hypot(event.screenX - gesture.x, event.screenY - gesture.y) >= 5) startDrag();
      if (gesture.dragging) onAction('drag', { phase: 'move', x: event.screenX, y: event.screenY });
    },
    true,
  );
  const stopGesture = (tap) => {
    if (!gesture) return;
    const previous = gesture;
    gesture = null;
    clearTimeout(holdTimer);
    dragHandle.style.cursor = '';
    if (dragHandle.hasPointerCapture(previous.id)) dragHandle.releasePointerCapture(previous.id);
    if (previous.dragging) onAction('drag', { phase: 'end' });
    else if (tap) onAction('toggle');
  };
  document.addEventListener(
    'pointerup',
    (event) => {
      if (gesture && event.pointerId === gesture.id) {
        event.preventDefault();
        event.stopImmediatePropagation();
        stopGesture(true);
      }
    },
    true,
  );
  document.addEventListener('pointercancel', () => stopGesture(false), true);
  window.addEventListener('blur', () => stopGesture(false));
  document.addEventListener(
    'click',
    (event) => {
      if (isSurface(event) && !isControl(event)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true,
  );
  let hideTimer,
    toastTimer,
    scrubbing = false,
    hoveringControls = false;
  const chrome = root.querySelector('.chrome');
  const timeline = root.querySelector('.timeline');
  function reveal() {
    chrome.classList.remove('quiet');
    host.setAttribute('data-controls-visible', '');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (!hoveringControls && !root.activeElement?.matches(':focus-visible')) {
        chrome.classList.add('quiet');
        host.removeAttribute('data-controls-visible');
      }
    }, 2300);
  }
  function toast(message) {
    const node = root.querySelector('.notice');
    node.textContent = message;
    node.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove('visible'), 1200);
    reveal();
  }
  root.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button || !event.isTrusted) return;
    onAction(
      button.dataset.action,
      button.dataset.value ? Number(button.dataset.value) : undefined,
    );
    reveal();
  });
  root.addEventListener('pointermove', reveal);
  root.addEventListener('focusin', reveal);
  root.addEventListener('focusout', reveal);
  for (const surface of root.querySelectorAll('.top,.bottom')) {
    surface.addEventListener('pointerenter', () => {
      hoveringControls = true;
      reveal();
    });
    surface.addEventListener('pointerleave', () => {
      hoveringControls = false;
      reveal();
    });
  }
  document.addEventListener('pointermove', reveal, { passive: true });
  timeline.addEventListener('input', () => {
    scrubbing = true;
    root.querySelector('.time').textContent = `${time(timeline.value)} / ${time(timeline.max)}`;
    reveal();
  });
  timeline.addEventListener('change', () => {
    onAction('seekTo', Number(timeline.value));
    scrubbing = false;
  });
  root
    .querySelector('.volume-range')
    .addEventListener('input', (event) => onAction('volume', Number(event.target.value)));
  root
    .querySelector('select')
    .addEventListener('change', (event) => onAction('rate', Number(event.target.value)));
  let badgeSignature;
  function update(state) {
    const video = state.video;
    root.querySelector('.title').textContent = state.title || 'Perch';
    captions.disabled = !state.captions?.available;
    captions.setAttribute(
      'aria-pressed',
      String(Boolean(state.captions?.available && state.captions.enabled)),
    );
    captions.title = state.captions?.available ? 'Captions (C)' : 'No captions available';
    root.querySelector('.pin').setAttribute('aria-pressed', String(state.pinned !== false));
    const close = root.querySelector('[data-action=hide]');
    close.setAttribute('aria-label', state.multiplePlayers ? 'Close player' : 'Pause and hide');
    close.title = state.multiplePlayers ? 'Close player' : 'Pause and hide';
    root.querySelector('.queue-label').textContent = String(state.queueCount || 0);
    root.querySelector('[data-action=next]').disabled = !state.hasNext;
    root.querySelector('[data-action=previous]').disabled = !state.hasPrevious;
    const badge = root.querySelector('.badge');
    const message =
      state.error ||
      (!video
        ? 'Finding video…'
        : video.error
          ? 'This video could not play. Open it in your browser or choose another link.'
          : video.readyState < 2
            ? 'Loading video…'
            : '');
    const signature = `${message}\0${Boolean(state.error || video?.error)}`;
    if (signature !== badgeSignature) {
      badgeSignature = signature;
      badge.replaceChildren();
      if (message) {
        const span = document.createElement('span');
        span.textContent = message;
        badge.append(span);
        if (state.error || video?.error) {
          const actions = document.createElement('div');
          actions.className = 'error-actions';
          for (const [label, action] of [
            ['Retry', 'retry'],
            ['Queue', 'queue'],
            ['Open in browser', 'external'],
          ]) {
            const button = document.createElement('button');
            button.textContent = label;
            button.addEventListener('click', (event) => {
              if (event.isTrusted) onAction(action);
            });
            actions.append(button);
          }
          badge.append(actions);
        }
      }
    }
    root.querySelector('.video-missing').hidden = Boolean(video);
    const toggle = root.querySelector('[data-action=toggle]');
    toggle.replaceChildren(iconNode(video && !video.paused ? 'pause' : 'play'));
    toggle.setAttribute('aria-label', video && !video.paused ? 'Pause' : 'Play');
    for (const node of root.querySelectorAll(
      '[data-action=toggle],[data-action=seek],[data-action=mute],.volume-range,select',
    ))
      node.disabled = !video;
    const seekable =
      video && Number.isFinite(video.duration) && video.duration > 0 && video.seekable.length > 0;
    timeline.disabled = !seekable;
    timeline.style.setProperty(
      '--progress',
      `${seekable ? (video.currentTime / video.duration) * 100 : 0}%`,
    );
    for (const button of root.querySelectorAll('[data-action=seek]')) button.disabled = !seekable;
    if (video) {
      if (!scrubbing) {
        timeline.max = seekable ? video.duration : 100;
        timeline.value = seekable ? video.currentTime : 0;
        root.querySelector('.time').textContent =
          `${time(video.currentTime)} / ${video.duration === Infinity ? 'LIVE' : Number.isFinite(video.duration) && video.duration > 0 ? time(video.duration) : '--:--'}`;
      }
      root.querySelector('.volume-range').value = video.muted ? 0 : video.volume;
      root.querySelector('select').value = String(video.playbackRate);
      const mute = root.querySelector('[data-action=mute]');
      mute.replaceChildren(iconNode(video.muted || video.volume === 0 ? 'mute' : 'volume'));
      mute.setAttribute('aria-label', video.muted || video.volume === 0 ? 'Unmute' : 'Mute');
    }
  }
  reveal();
  return { update, toast, reveal, root };
}
