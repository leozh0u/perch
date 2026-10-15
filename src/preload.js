import mediaStyles from './media.css';
import { contextBridge, ipcRenderer } from 'electron';
import { createPlayerUI } from './player-ui.js';

const trustedURL = process.argv
  .find((arg) => arg.startsWith('--perch-home='))
  ?.slice('--perch-home='.length);
if (location.href.split('?')[0] === trustedURL) {
  contextBridge.exposeInMainWorld('perch', {
    getState: () => ipcRenderer.invoke('perch:get'),
    add: (text, playNow) => ipcRenderer.invoke('perch:add', text, playNow),
    action: (name, value) => ipcRenderer.invoke('perch:action', name, value),
    onState: (callback) => {
      const listener = (_event, state) => callback(state);
      ipcRenderer.on('perch-state', listener);
      return () => ipcRenderer.removeListener('perch-state', listener);
    },
    onSettings: (callback) => {
      const listener = () => callback();
      ipcRenderer.on('perch-settings', listener);
      return () => ipcRenderer.removeListener('perch-settings', listener);
    },
  });
} else {
  let video = null,
    ui,
    init = null,
    state = {},
    timer,
    missingTimer,
    generation = -1,
    error = null,
    restored = false,
    positionRestored = false;
  let desiredVolume = 1,
    desiredRate = 1,
    desiredMuted = false,
    audibleVolume = 1;
  let requestedPause = false;
  let videoEvents,
    lastProgress = Date.now();
  const action = (name, value) => {
    if (
      ['queue', 'hide', 'pin', 'external', 'next', 'previous', 'retry', 'size', 'drag'].includes(
        name,
      )
    ) {
      ipcRenderer.send('player-action', name, value);
      return;
    }
    if (name === 'pause') {
      requestedPause = true;
      video?.pause();
      publish();
      return;
    }
    if (name === 'setMuted') {
      desiredMuted = Boolean(value);
      if (video) {
        if (video.volume > 0) audibleVolume = video.volume;
        if (!desiredMuted && video.volume === 0) video.volume = desiredVolume = audibleVolume;
        video.muted = desiredMuted;
      }
      ui?.toast(desiredMuted ? 'Muted' : 'Unmuted');
      publish();
      return;
    }
    if (!video) return;
    try {
      switch (name) {
        case 'toggle':
          if (video.paused) {
            requestedPause = false;
            video.play().catch(() => ui.toast('Press play on the video to continue.'));
          } else {
            requestedPause = true;
            video.pause();
          }
          break;
        case 'seek':
          if (Number.isFinite(video.duration) && video.seekable.length) {
            video.currentTime = Math.max(
              video.seekable.start(0),
              Math.min(
                video.currentTime + Number(value),
                video.seekable.end(video.seekable.length - 1),
              ),
            );
            ui.toast(`${value > 0 ? '+' : ''}${value} seconds`);
          }
          break;
        case 'seekTo':
          if (Number.isFinite(value) && video.seekable.length)
            video.currentTime = Math.max(
              video.seekable.start(0),
              Math.min(value, video.seekable.end(video.seekable.length - 1)),
            );
          break;
        case 'volume':
          if (Number.isFinite(value)) {
            desiredVolume = Math.max(0, Math.min(1, value));
            desiredMuted = false;
            video.volume = desiredVolume;
            video.muted = false;
          }
          break;
        case 'mute':
          action('setMuted', !(video.muted || video.volume === 0));
          return;
        case 'rate':
          if ([0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].includes(value)) {
            desiredRate = value;
            video.playbackRate = value;
          }
          break;
        case 'reveal':
          ui.reveal();
          break;
      }
      publish();
    } catch {
      ui.toast('That control is not available for this video.');
    }
  };
  function title() {
    return document.title.replace(/\s*[-|]\s*YouTube$/, '').trim() || 'Video';
  }
  function render() {
    if (!ui) return;
    const index = (state.queue || []).findIndex((item) => item.id === state.currentId);
    const available = (item) => !(state.activeIds || []).includes(item.id);
    ui.update({
      video,
      error,
      title: title(),
      pinned: state.pinned,
      multiplePlayers: state.players?.length > 1,
      queueCount: state.queue?.length,
      hasPrevious: index > 0 && state.queue.slice(0, index).some(available),
      hasNext: index >= 0 && state.queue.slice(index + 1).some(available),
    });
  }
  function publish() {
    render();
    if (generation < 0) return;
    ipcRenderer.send('media-state', {
      generation,
      title: title(),
      currentTime: video?.currentTime || 0,
      duration: video?.duration || 0,
      paused: video?.paused ?? true,
      muted: video?.muted ?? desiredMuted,
      loading: !video || video.readyState < 2,
      seekable: Boolean(video?.seekable.length),
      error:
        error ||
        (video?.error
          ? 'This video could not play. Try another link or open it in your browser.'
          : null),
      volume: video?.volume,
      rate: video?.playbackRate,
    });
  }
  function restore() {
    if (!video || !init || restored || video.readyState < 1) return;
    restored = true;
    if (desiredVolume > 0) audibleVolume = desiredVolume;
    video.volume = desiredVolume;
    video.muted = desiredMuted;
    video.playbackRate = desiredRate;
    if (
      !positionRestored &&
      init.resumeAt > 0 &&
      Number.isFinite(video.duration) &&
      video.seekable.length
    )
      video.currentTime = Math.min(init.resumeAt, Math.max(0, video.duration - 1));
    positionRestored = true;
    if (requestedPause) video.pause();
    else
      video.play().catch(() => {
        ui.toast('Press play to start.');
        publish();
      });
  }
  function watchMissingVideo() {
    clearTimeout(missingTimer);
    missingTimer = setTimeout(() => {
      if (!video) {
        error = 'No playable video found. Try a video link, or open this page in your browser.';
        publish();
      }
    }, 18000);
  }
  function findVideo() {
    const youtubeVideo = document.querySelector('#movie_player video.html5-main-video');
    const candidates = [...document.querySelectorAll('video')];
    const next =
      youtubeVideo ||
      (video?.isConnected
        ? video
        : candidates.sort(
            (a, b) =>
              (b.videoWidth * b.videoHeight || b.clientWidth * b.clientHeight) -
              (a.videoWidth * a.videoHeight || a.clientWidth * a.clientHeight),
          )[0]);
    if (!next) {
      if (video && !video.isConnected) {
        videoEvents?.abort();
        video.pause();
        video.classList.remove('perch-video');
        video = null;
        restored = false;
        error = null;
        lastProgress = Date.now();
        watchMissingVideo();
        publish();
      }
      return;
    }
    if (next === video) return;
    videoEvents?.abort();
    videoEvents = new AbortController();
    const listen = (event, handler) =>
      next.addEventListener(event, handler, { signal: videoEvents.signal });
    if (video) {
      video.classList.remove('perch-video');
      video.pause();
    }
    video = next;
    restored = false;
    video.classList.add('perch-video');
    error = null;
    clearTimeout(missingTimer);
    for (const event of [
      'play',
      'pause',
      'loadedmetadata',
      'canplay',
      'seeking',
      'seeked',
      'volumechange',
      'ratechange',
      'error',
    ])
      listen(event, () => {
        if (event === 'play' && requestedPause) next.pause();
        restore();
        publish();
      });
    listen('ended', () => {
      publish();
      // YouTube uses the same media element for ads. Only advance for the content video.
      if (!document.querySelector('.ad-showing,.ad-interrupting'))
        ipcRenderer.send('media-ended', generation);
    });
    restore();
    publish();
  }
  ipcRenderer.on('media-command', (_event, payload) => action(payload.command, payload.value));
  ipcRenderer.on('perch-state', (_event, next) => {
    state = next;
    if (next.media?.notice) ui?.toast(next.media.notice);
    render();
  });
  ipcRenderer.on('media-init', (_event, next) => {
    init = next;
    state = next;
    generation = next.generation;
    desiredVolume = next.volume;
    audibleVolume = next.audibleVolume || 1;
    desiredRate = next.rate;
    desiredMuted = Boolean(next.muted);
    requestedPause = next.autoplay === false;
    if (next.media?.error) error = next.media.error;
    restore();
    publish();
  });
  window.addEventListener(
    'DOMContentLoaded',
    () => {
      const style = document.createElement('style');
      style.textContent = mediaStyles;
      document.documentElement.append(style);
      ui = createPlayerUI(action);
      findVideo();
      const observer = new MutationObserver(findVideo);
      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true,
      });
      timer = setInterval(() => {
        findVideo();
        restore();
        if (video?.readyState >= 2) {
          lastProgress = Date.now();
          error = null;
        } else if (video && Date.now() - lastProgress > 30000)
          error =
            'This video is not loading. Check your connection, then retry or choose another link.';
        publish();
      }, 1000);
      if (!video) watchMissingVideo();
      ipcRenderer.send('media-ready');
      window.addEventListener(
        'pagehide',
        () => {
          observer.disconnect();
          clearInterval(timer);
          clearTimeout(missingTimer);
        },
        { once: true },
      );
      document.addEventListener(
        'keydown',
        (event) => {
          const target = event.composedPath()[0];
          if (target?.matches?.('input,textarea,select,[contenteditable=true]')) return;
          // YouTube owns ad interactions; Space must still activate its focused Skip button.
          if (document.querySelector('#movie_player.ad-showing,#movie_player.ad-interrupting'))
            return;
          if (event.metaKey || event.ctrlKey || event.altKey) return;
          const key = event.key.toLowerCase();
          const commands = {
            ' ': ['toggle'],
            k: ['toggle'],
            arrowleft: ['seek', -5],
            arrowright: ['seek', 5],
            j: ['seek', -10],
            l: ['seek', 10],
            m: ['mute'],
            arrowup: ['volume', (video?.volume || 0) + 0.05],
            arrowdown: ['volume', (video?.volume || 0) - 0.05],
            escape: ['reveal'],
          };
          if (commands[key]) {
            event.preventDefault();
            event.stopImmediatePropagation();
            if (!event.repeat || ![' ', 'k', 'm'].includes(key)) action(...commands[key]);
            ui.reveal();
          }
        },
        true,
      );
    },
    { once: true },
  );
}
