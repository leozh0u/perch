const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  normalizeSource,
  parseLinks,
  addItems,
  recoverBounds,
  timeLabel,
} = require('../src/core.cjs');
const { createStore } = require('../src/store.cjs');

test('canonicalise common YouTube links and retain timestamps', () => {
  assert.equal(
    normalizeSource('https://youtu.be/aqz-KE-bpKQ?t=1m20s&si=tracking'),
    'https://www.youtube.com/watch?v=aqz-KE-bpKQ&t=1m20s',
  );
  assert.equal(
    normalizeSource('youtube.com/shorts/aqz-KE-bpKQ'),
    'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
  );
  assert.equal(
    normalizeSource('https://m.youtube.com/watch?v=aqz-KE-bpKQ'),
    'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
  );
});
test('reject unsafe protocols, embedded credentials and nonvideo YouTube pages', () => {
  for (const value of [
    'javascript:alert(1)',
    'file:///etc/passwd',
    'http://example.com/a',
    'https://me:password@example.com',
    'https://youtube.com/@channel',
    'https://youtu.be/wrong',
    'words',
  ])
    assert.throws(() => normalizeSource(value));
  assert.throws(() => normalizeSource('http://localhost:5123/video'));
  assert.equal(normalizeSource('http://127.0.0.1:5123/video', true), 'http://127.0.0.1:5123/video');
});
test('batch validation is atomic, deduplicates canonical links and caps queue size', () => {
  assert.throws(() => parseLinks('https://youtu.be/aqz-KE-bpKQ\nnot-a-link'));
  const links = parseLinks('https://youtu.be/aqz-KE-bpKQ\nhttps://youtube.com/watch?v=aqz-KE-bpKQ');
  assert.equal(links.length, 1);
  const queue = addItems([], links);
  assert.equal(addItems(queue, links).length, 1);
  assert.equal(queue[0].id.length, 36);
  assert.throws(() =>
    addItems(
      Array.from({ length: 100 }, (_, n) => ({ url: `https://example.com/${n}` })),
      ['https://example.com/new'],
    ),
  );
});
test('recover geometry on negative-coordinate secondary monitors and unplugged displays', () => {
  const areas = [
    { x: 0, y: 25, width: 1440, height: 875 },
    { x: -1920, y: 0, width: 1920, height: 1080 },
  ];
  const onSecond = recoverBounds({ x: -1500, y: 500, width: 480, height: 270 }, areas);
  assert.equal(onSecond.x, -1500);
  const disconnected = recoverBounds(onSecond, [areas[0]]);
  assert.equal(disconnected.x, 0);
  assert.ok(disconnected.y >= 25);
  const huge = recoverBounds({ x: 9000, y: 9000, width: 9999, height: 9999 }, areas);
  assert.ok(huge.width <= 1440);
  assert.ok(huge.y + huge.height <= 900);
  assert.ok(Number.isFinite(recoverBounds({ x: NaN }, areas).x));
});
test('persist local state and recover safely from invalid records or damaged JSON', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'perch-unit-'));
  try {
    const store = createStore(dir);
    assert.equal(store.state.pinned, false);
    assert.equal(store.state.allowTwo, false);
    store.state.queue = addItems([], ['https://example.com/video']);
    store.state.currentId = store.state.queue[0].id;
    store.save();
    assert.equal(createStore(dir).state.currentId, store.state.currentId);
    fs.writeFileSync(
      path.join(dir, 'perch-state.json'),
      JSON.stringify({ queue: [{ id: 'bad', url: 'file:///private' }], currentId: 'bad' }),
    );
    assert.deepEqual(createStore(dir).state.queue, []);
    assert.equal(createStore(dir).state.currentId, null);
    for (const root of [null, [], 42, 'text', true]) {
      fs.writeFileSync(path.join(dir, 'perch-state.json'), JSON.stringify(root));
      assert.deepEqual(createStore(dir).state.queue, []);
    }
    fs.writeFileSync(path.join(dir, 'perch-state.json'), '{broken');
    assert.deepEqual(createStore(dir).state.queue, []);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
test('time formatting handles hours and unknown durations', () => {
  assert.equal(timeLabel(80), '1:20');
  assert.equal(timeLabel(3661), '1:01:01');
  assert.equal(timeLabel(Infinity), '0:00');
});
