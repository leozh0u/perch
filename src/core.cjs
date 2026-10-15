const { randomUUID } = require('node:crypto');

function normalizeSource(input, allowLocal = false) {
  const text = String(input || '').trim();
  if (!text || text.length > 4096) throw new Error('Paste a video link.');
  let url;
  try {
    url = new URL(/^[a-z][\w+.-]*:/i.test(text) ? text : `https://${text}`);
  } catch {
    throw new Error('That link is not valid.');
  }
  const local =
    allowLocal && url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
  if (url.protocol !== 'https:' && !local) throw new Error('Use an HTTPS video link.');
  if (url.username || url.password || (!url.hostname.includes('.') && !local))
    throw new Error('Use a public video link without sign-in details.');
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, '');
  if (host === 'youtu.be' || host === 'youtube.com') {
    const id =
      host === 'youtu.be'
        ? url.pathname.slice(1).split('/')[0]
        : url.searchParams.get('v') || url.pathname.match(/^\/(?:shorts|live|embed)\/([^/]+)/)?.[1];
    if (!id || !/^[\w-]{11}$/.test(id))
      throw new Error('Paste a link to a YouTube video, rather than a channel or search page.');
    const result = new URL('https://www.youtube.com/watch');
    result.searchParams.set('v', id);
    const time = url.searchParams.get('t') || url.searchParams.get('start');
    if (time && /^[\dhms]+$/.test(time)) result.searchParams.set('t', time);
    return result.href;
  }
  url.hash = '';
  return url.href;
}

function parseLinks(text, allowLocal = false) {
  const values = String(text).split(/\s+/).filter(Boolean);
  if (!values.length) throw new Error('Paste at least one video link.');
  if (values.length > 100) throw new Error('Add up to 100 links at a time.');
  return [...new Set(values.map((value) => normalizeSource(value, allowLocal)))];
}

function addItems(queue, urls) {
  const known = new Set(queue.map((item) => item.url));
  const additions = urls
    .filter((url) => !known.has(url))
    .map((url) => {
      const source = new URL(url);
      const title =
        source.hostname === 'www.youtube.com'
          ? `YouTube · ${source.searchParams.get('v')}`
          : source.hostname.replace('www.', '');
      return { id: randomUUID(), url, title, position: 0 };
    });
  if (queue.length + additions.length > 100)
    throw new Error('The queue holds up to 100 videos. Remove a few before adding more.');
  return [...queue, ...additions];
}

function recoverBounds(bounds, displays) {
  const areas = displays.map((display) => display.workArea || display);
  const fallback = areas[0] || { x: 0, y: 0, width: 1440, height: 900 };
  const valid =
    bounds && ['x', 'y', 'width', 'height'].every((key) => Number.isFinite(bounds[key]));
  const source = valid
    ? bounds
    : {
        x: fallback.x + fallback.width - 504,
        y: fallback.y + fallback.height - 300,
        width: 480,
        height: 270,
      };
  const overlap = (area) =>
    Math.max(
      0,
      Math.min(source.x + source.width, area.x + area.width) - Math.max(source.x, area.x),
    ) *
    Math.max(
      0,
      Math.min(source.y + source.height, area.y + area.height) - Math.max(source.y, area.y),
    );
  const area = areas.reduce(
    (best, next) => (overlap(next) > overlap(best) ? next : best),
    fallback,
  );
  const width = Math.round(Math.min(Math.max(320, source.width), area.width));
  const height = Math.round(Math.min((width * 9) / 16, area.height));
  return {
    x: Math.round(Math.max(area.x, Math.min(source.x, area.x + area.width - width))),
    y: Math.round(Math.max(area.y, Math.min(source.y, area.y + area.height - height))),
    width,
    height,
  };
}

function timeLabel(value) {
  if (!Number.isFinite(value) || value < 0) return '0:00';
  const seconds = Math.floor(value);
  return seconds >= 3600
    ? `${Math.floor(seconds / 3600)}:${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
    : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

module.exports = { normalizeSource, parseLinks, addItems, recoverBounds, timeLabel };
