const fs = require('node:fs');
const path = require('node:path');
const { normalizeSource } = require('./core.cjs');

function createStore(directory, allowLocal = false) {
  const filename = path.join(directory, 'perch-state.json');
  let restored = {};
  try { restored = JSON.parse(fs.readFileSync(filename, 'utf8')); } catch { /* First launch or damaged state: recover to an empty queue. */ }
  const queue = (Array.isArray(restored.queue) ? restored.queue : []).slice(0, 100).flatMap(item => {
    try {
      return [{ id: typeof item.id === 'string' ? item.id : require('node:crypto').randomUUID(), url: normalizeSource(item.url, allowLocal), title: String(item.title || 'Video').slice(0, 240), position: Math.max(0, Number(item.position) || 0) }];
    } catch { return []; }
  });
  const state = { queue, currentId: queue.some(item => item.id === restored.currentId) ? restored.currentId : null, bounds: restored.bounds, pinned: restored.pinned === true, muted: restored.muted === true, volume: Number.isFinite(restored.volume) ? Math.max(0, Math.min(1, restored.volume)) : 1, rate: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].includes(restored.rate) ? restored.rate : 1, autoNext: restored.autoNext !== false, allowTwo: restored.allowTwo === true };
  function save() {
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(`${filename}.tmp`, JSON.stringify(state, null, 2), { mode: 0o600 });
    fs.renameSync(`${filename}.tmp`, filename);
  }
  return { state, save };
}

module.exports = { createStore };
