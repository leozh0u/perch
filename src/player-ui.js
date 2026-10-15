import { iconNode } from './icons.js';
const time = value => {
  const s = Math.max(0, Math.floor(Number(value) || 0));
  return s >= 3600 ? `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export function createPlayerUI(onAction) {
  const host = document.createElement('div');
  host.id = 'perch-player';
  host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none;';
  const root = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = `
    :host{font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#f5f5f5;--accent:#ff4b4b;--muted:#b8b8b8;color-scheme:dark}
    *{box-sizing:border-box}button,input,select{font:inherit}button,select{color:inherit;cursor:pointer}button{width:32px;height:32px;border:0;background:transparent;border-radius:6px;display:grid;place-items:center;padding:6px;flex:none}button:hover,select:hover{background:#ffffff24}button:disabled{opacity:.3;cursor:default}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid white;outline-offset:2px}svg{width:20px;height:20px}button svg{pointer-events:none}
    .top,.bottom{position:absolute;left:0;right:0;pointer-events:auto;opacity:1;transition:opacity .18s ease-out}.top{top:0;height:54px;padding:7px 8px;display:flex;gap:5px;align-items:flex-start;background:linear-gradient(#000c,transparent);-webkit-app-region:no-drag}.top button,.top select{-webkit-app-region:no-drag}.brand{display:flex;gap:5px;align-items:center;min-width:0;flex:1;height:30px;font-size:12px;font-weight:600}.brand>svg{width:18px;height:18px}.title{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;text-shadow:0 1px 3px #000}.bottom{bottom:0;padding:24px 12px 7px;background:linear-gradient(transparent,#000e)}.row{display:flex;align-items:center;gap:3px}.spacer{flex:1}.time{font-size:11px;font-variant-numeric:tabular-nums;white-space:nowrap;margin:0 4px;color:white}.timeline{display:block;width:100%;height:15px;margin:0 0 1px;cursor:pointer;accent-color:var(--accent)}input[type=range]{accent-color:var(--accent);padding:0}.timeline{appearance:none;background:transparent}.timeline::-webkit-slider-runnable-track{height:3px;border-radius:2px;background:linear-gradient(to right,var(--accent) var(--progress,0%),#ffffff66 var(--progress,0%))}.timeline::-webkit-slider-thumb{appearance:none;width:10px;height:10px;border-radius:50%;background:var(--accent);margin-top:-3.5px}select{border:0;border-radius:5px;background:transparent;appearance:none;text-align:center;padding:5px 3px;width:42px;font-size:12px}.volume{display:flex;align-items:center}.volume input{width:0;opacity:0;transition:width .15s,opacity .15s}.volume:hover input,.volume:focus-within input{width:52px;opacity:1;margin-right:5px}.quiet .top,.quiet .bottom{opacity:0;pointer-events:none}.quiet:has(:focus-visible) .top,.quiet:has(:focus-visible) .bottom{opacity:1;pointer-events:auto}.badge{position:absolute;left:0;right:0;top:50%;text-align:center;color:white;font-size:13px;pointer-events:none}.badge>span{display:inline-block;padding:8px 13px;border-radius:7px;background:#121212e8;max-width:85%}.notice{position:absolute;top:56px;left:50%;transform:translateX(-50%);white-space:nowrap;background:#181818e8;padding:7px 12px;border-radius:6px;font-size:12px;opacity:0;transition:opacity .15s}.notice.visible{opacity:1}.pin[aria-pressed=true]{color:var(--accent)}.queue-label{font-size:10px;position:absolute;margin:17px 0 0 19px;background:#242424;border-radius:7px;padding:0 3px;line-height:13px}.queue-button{position:relative}.scrub-label{color:var(--muted)}.error-actions{display:flex;justify-content:center;margin-top:8px;gap:6px;pointer-events:auto}.error-actions button{width:auto;padding:5px 10px;background:#ffffff20}.video-missing{position:absolute;inset:0;background:#121212;z-index:-1}
    @media(max-width:390px){.row{gap:0}.bottom{padding-inline:8px}.time{font-size:10px;margin:0 3px}.row button{width:29px;padding:5px}.volume:hover input,.volume:focus-within input{width:35px}.title{max-width:160px}}
    @media(prefers-reduced-motion:reduce){*{transition:none!important}}
`;
  root.append(style);
  const make = (tag, className, parent, attrs = {}) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    parent.append(node); return node;
  };
  const button = (parent, action, label, name, title = label, value) => {
    const node = make('button', '', parent, { 'data-action': action, 'aria-label': label, title });
    if (value !== undefined) node.dataset.value = value;
    node.append(iconNode(name)); return node;
  };
  const panel = make('div', 'chrome', root);
  const top = make('div', 'top', panel);
  const brand = make('div', 'brand', top); brand.append(iconNode('perch'));
  make('span', 'title', brand).textContent = 'Perch';
  const pin = button(top, 'pin', 'Keep on top', 'pin'); pin.className = 'pin'; pin.setAttribute('aria-pressed', 'true');
  button(top, 'external', 'Open in browser', 'external');
  const queueButton = button(top, 'queue', 'Open queue', 'queue', 'Queue / Open links (⌘O)'); queueButton.className = 'queue-button';
  make('span', 'queue-label', queueButton).textContent = '0';
  button(top, 'hide', 'Pause and hide', 'close');
  make('div', 'video-missing', panel);
  make('div', 'badge', panel, { role: 'status' });
  make('div', 'notice', panel, { role: 'status' });
  const bottom = make('div', 'bottom', panel);
  make('input', 'timeline', bottom, { 'aria-label': 'Video timeline', type: 'range', min: '0', max: '100', step: '.1', value: '0', disabled: '' });
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
  make('input', 'volume-range', volume, { type: 'range', 'aria-label': 'Volume', min: '0', max: '1', step: '.05', value: '1' });
  const rate = make('select', '', row, { 'aria-label': 'Playback speed', title: 'Playback speed' });
  for (const value of [.5, .75, 1, 1.25, 1.5, 1.75, 2]) { const option = make('option', '', rate, { value: String(value) }); option.textContent = `${value}×`; }
  rate.value = '1';
  document.documentElement.append(host);
  // A transparent surface catches video gestures above the site's own controls.
  // Our buttons/sliders remain above it and keep their native interactions.
  const dragHandle = document.createElement('div');
  dragHandle.id = 'perch-drag'; dragHandle.tabIndex = -1;
  dragHandle.setAttribute('role', 'group'); dragHandle.setAttribute('aria-label', 'Video surface');
  dragHandle.style.cssText = 'position:fixed;inset:0;z-index:2147483646;touch-action:none;user-select:none;outline:none;';
  document.documentElement.append(dragHandle);
  host.style.userSelect = 'none';
  let gesture, holdTimer;
  const isControl = event => event.composedPath().some(node => node?.matches?.('button,input,select,a,[contenteditable=true]'));
  const isSurface = event => event.composedPath().includes(dragHandle) || event.composedPath().includes(host);
  const startDrag = () => {
    if (!gesture || gesture.dragging) return;
    gesture.dragging = true; clearTimeout(holdTimer);
    dragHandle.style.cursor = 'grabbing';
    onAction('drag', { phase: 'start', x: gesture.x, y: gesture.y });
  };
  document.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isTrusted || !isSurface(event) || isControl(event)) return;
    event.preventDefault(); event.stopImmediatePropagation();
    reveal();
    gesture = { id: event.pointerId, x: event.screenX, y: event.screenY, dragging: false };
    dragHandle.focus({ preventScroll: true }); dragHandle.setPointerCapture(event.pointerId);
    holdTimer = setTimeout(startDrag, 180);
  }, true);
  document.addEventListener('pointermove', event => {
    if (!gesture || event.pointerId !== gesture.id || !event.isTrusted) return;
    if (Math.hypot(event.screenX - gesture.x, event.screenY - gesture.y) >= 5) startDrag();
    if (gesture.dragging) onAction('drag', { phase: 'move', x: event.screenX, y: event.screenY });
  }, true);
  const stopGesture = tap => {
    if (!gesture) return;
    const previous = gesture; gesture = null; clearTimeout(holdTimer); dragHandle.style.cursor = '';
    if (dragHandle.hasPointerCapture(previous.id)) dragHandle.releasePointerCapture(previous.id);
    if (previous.dragging) onAction('drag', { phase: 'end' });
    else if (tap) onAction('toggle');
  };
  document.addEventListener('pointerup', event => { if (gesture && event.pointerId === gesture.id) { event.preventDefault(); event.stopImmediatePropagation(); stopGesture(true); } }, true);
  document.addEventListener('pointercancel', () => stopGesture(false), true);
  window.addEventListener('blur', () => stopGesture(false));
  document.addEventListener('click', event => { if (isSurface(event) && !isControl(event)) { event.preventDefault(); event.stopImmediatePropagation(); } }, true);
  let hideTimer, toastTimer, scrubbing = false, hoveringControls = false;
  const chrome = root.querySelector('.chrome');
  const timeline = root.querySelector('.timeline');
  function reveal() {
    chrome.classList.remove('quiet'); clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { if (!hoveringControls && !root.activeElement?.matches(':focus-visible')) chrome.classList.add('quiet'); }, 2300);
  }
  function toast(message) { const node = root.querySelector('.notice'); node.textContent = message; node.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove('visible'), 1200); reveal(); }
  root.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button || !event.isTrusted) return;
    onAction(button.dataset.action, button.dataset.value ? Number(button.dataset.value) : undefined);
    reveal();
  });
  root.addEventListener('pointermove', reveal);
  root.addEventListener('focusin', reveal);
  root.addEventListener('focusout', reveal);
  for (const surface of root.querySelectorAll('.top,.bottom')) {
    surface.addEventListener('pointerenter', () => { hoveringControls = true; reveal(); });
    surface.addEventListener('pointerleave', () => { hoveringControls = false; reveal(); });
  }
  document.addEventListener('pointermove', reveal, { passive: true });
  timeline.addEventListener('input', () => { scrubbing = true; root.querySelector('.time').textContent = `${time(timeline.value)} / ${time(timeline.max)}`; reveal(); });
  timeline.addEventListener('change', () => { onAction('seekTo', Number(timeline.value)); scrubbing = false; });
  root.querySelector('.volume-range').addEventListener('input', event => onAction('volume', Number(event.target.value)));
  root.querySelector('select').addEventListener('change', event => onAction('rate', Number(event.target.value)));
  function update(state) {
    const video = state.video;
    root.querySelector('.title').textContent = state.title || 'Perch';
    root.querySelector('.pin').setAttribute('aria-pressed', String(state.pinned !== false));
    const close = root.querySelector('[data-action=hide]');
    close.setAttribute('aria-label', state.multiplePlayers ? 'Close player' : 'Pause and hide');
    close.title = state.multiplePlayers ? 'Close player' : 'Pause and hide';
    root.querySelector('.queue-label').textContent = String(state.queueCount || 0);
    root.querySelector('[data-action=next]').disabled = !state.hasNext;
    root.querySelector('[data-action=previous]').disabled = !state.hasPrevious;
    const badge = root.querySelector('.badge');
    badge.replaceChildren();
    const message = state.error || (!video ? 'Finding video…' : video.error ? 'This video could not play. Open it in your browser or choose another link.' : video.readyState < 2 ? 'Loading video…' : '');
    if (message) {
      const span = document.createElement('span'); span.textContent = message; badge.append(span);
      if (state.error || video?.error) {
        const actions = document.createElement('div'); actions.className = 'error-actions';
        for (const [label, action] of [['Retry', 'retry'], ['Queue', 'queue'], ['Open in browser', 'external']]) {
          const button = document.createElement('button'); button.textContent = label; button.addEventListener('click', event => { if (event.isTrusted) onAction(action); }); actions.append(button);
        }
        badge.append(actions);
      }
    }
    root.querySelector('.video-missing').hidden = Boolean(video);
    const toggle = root.querySelector('[data-action=toggle]');
    toggle.replaceChildren(iconNode(video && !video.paused ? 'pause' : 'play')); toggle.setAttribute('aria-label', video && !video.paused ? 'Pause' : 'Play');
    for (const node of root.querySelectorAll('[data-action=toggle],[data-action=seek],[data-action=mute],.volume-range,select')) node.disabled = !video;
    const seekable = video && Number.isFinite(video.duration) && video.duration > 0 && video.seekable.length > 0;
    timeline.disabled = !seekable;
    timeline.style.setProperty('--progress', `${seekable ? video.currentTime / video.duration * 100 : 0}%`);
    for (const button of root.querySelectorAll('[data-action=seek]')) button.disabled = !seekable;
    if (video) {
      if (!scrubbing) { timeline.max = seekable ? video.duration : 100; timeline.value = seekable ? video.currentTime : 0; root.querySelector('.time').textContent = `${time(video.currentTime)} / ${video.duration === Infinity ? 'LIVE' : Number.isFinite(video.duration) && video.duration > 0 ? time(video.duration) : '--:--'}`; }
      root.querySelector('.volume-range').value = video.muted ? 0 : video.volume;
      root.querySelector('select').value = String(video.playbackRate);
      const mute = root.querySelector('[data-action=mute]'); mute.replaceChildren(iconNode(video.muted || video.volume === 0 ? 'mute' : 'volume')); mute.setAttribute('aria-label', video.muted || video.volume === 0 ? 'Unmute' : 'Mute');
    }
  }
  reveal();
  return { update, toast, reveal, root };
}
