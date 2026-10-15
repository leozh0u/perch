import { _electron as electron } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'output/playwright');
await fs.mkdir(output, { recursive: true });
const userData = await fs.mkdtemp(path.join(os.tmpdir(), 'perch-e2e-'));
const sample = path.join(output, 'sample.mp4');
execFileSync('ffmpeg', [
  '-hide_banner',
  '-loglevel',
  'error',
  '-y',
  '-f',
  'lavfi',
  '-i',
  'testsrc2=size=960x540:rate=24',
  '-f',
  'lavfi',
  '-i',
  'sine=frequency=440:sample_rate=44100',
  '-t',
  '40',
  '-c:v',
  'libx264',
  '-pix_fmt',
  'yuv420p',
  '-c:a',
  'aac',
  '-movflags',
  '+faststart',
  sample,
]);
const sampleBuffer = await fs.readFile(sample);
const server = http.createServer((req, res) => {
  if (req.url === '/download') {
    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename=perch-test.txt',
    });
    res.end('synthetic download');
    return;
  }
  if (req.url.startsWith('/sample.mp4')) {
    const range = req.headers.range?.match(/bytes=(\d+)-(\d*)/);
    const start = range ? Number(range[1]) : 0,
      end = range?.[2] ? Number(range[2]) : sampleBuffer.length - 1;
    res.writeHead(range ? 206 : 200, {
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      ...(range ? { 'Content-Range': `bytes ${start}-${end}/${sampleBuffer.length}` } : {}),
    });
    res.end(sampleBuffer.subarray(start, end + 1));
    return;
  }
  if (req.url.startsWith('/slow')) {
    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(
        '<!doctype html><title>Slow video</title><video playsinline src="/sample.mp4"></video>',
      );
    }, 1500);
    return;
  }
  const noVideo = req.url.startsWith('/empty');
  res.writeHead(200, {
    'Content-Type': 'text/html',
    'Content-Security-Policy': "require-trusted-types-for 'script'; trusted-types 'none'",
  });
  res.end(
    `<!doctype html><title>${req.url.includes('second') ? 'Second video' : 'Perch test video'}</title>${noVideo ? '<h1>No video here</h1>' : '<video playsinline src="/sample.mp4"></video>'}`,
  );
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let application;
const results = [];
async function check(name, callback) {
  await callback();
  results.push({ name, status: 'pass' });
  console.log(`PASS ${name}`);
}
try {
  application = await electron.launch({
    args: [root, '--perch-test'],
    env: { ...process.env, PERCH_TEST_DATA: userData },
  });
  await application.evaluate(({ app, BrowserWindow }) => {
    const quiet = (win) => {
      win.setOpacity(0);
      win.webContents.setAudioMuted(true);
    };
    for (const win of BrowserWindow.getAllWindows()) quiet(win);
    app.on('browser-window-created', (_event, win) => quiet(win));
  });
  const player = await application.firstWindow();
  const errors = [];
  player.on('pageerror', (error) => errors.push(error.message));
  await player.waitForSelector('#links');
  await check('reopening reuses one instance without a Dock icon', async () => {
    assert.equal(await application.evaluate(({ app }) => app.hasSingleInstanceLock()), true);
    if (process.platform === 'darwin')
      assert.equal(await application.evaluate(({ app }) => app.dock.isVisible()), false);
    const executable = await application.evaluate(({ app }) => app.getPath('exe'));
    execFileSync(executable, [root, '--perch-test'], {
      env: { ...process.env, PERCH_TEST_DATA: userData },
      timeout: 10000,
    });
    assert.equal(application.windows().length, 1, 'A second launch must reuse the existing player');
    assert.equal(await application.evaluate(({ app }) => app.hasSingleInstanceLock()), true);
  });
  await check('reject unsafe and invalid URLs without mutating queue', async () => {
    await player.locator('#links').fill('file:///etc/passwd');
    await player.getByRole('button', { name: 'Play', exact: true }).click();
    await player.getByRole('status').filter({ hasText: 'HTTPS' }).waitFor();
    assert.equal((await player.evaluate(() => window.perch.getState())).queue.length, 0);
  });
  await check('batch queue and real media playback', async () => {
    await player.locator('#links').fill(`${base}/first\n${base}/second`);
    await player.getByRole('button', { name: 'Play', exact: true }).click();
    await player.waitForFunction(() => document.querySelector('video')?.currentTime > 0);
    assert.equal(await player.evaluate(() => typeof window.perch), 'undefined');
    assert.equal(await player.evaluate(() => typeof window.require), 'undefined');
    await player
      .locator('#perch-player')
      .getByRole('button', { name: 'Pause', exact: true })
      .click();
    assert.equal(await player.locator('video').evaluate((video) => video.paused), true);
    await player.locator('#perch-drag').focus();
    await player.keyboard.press('Space');
    assert.equal(await player.locator('video').evaluate((video) => video.paused), false);
    await player.keyboard.press('k');
    assert.equal(await player.locator('video').evaluate((video) => video.paused), true);
  });
  await check(
    'remote pages cannot open popups, download files or navigate to local files',
    async () => {
      const windows = application.windows().length;
      assert.equal(await player.evaluate(() => window.open('https://example.com') === null), true);
      assert.equal(application.windows().length, windows);
      const downloads = path.join(userData, 'downloads');
      await fs.mkdir(downloads);
      await application.evaluate(
        ({ app }, directory) => app.setPath('downloads', directory),
        downloads,
      );
      await player.evaluate(() => {
        location.href = '/download';
      });
      await player.waitForTimeout(300);
      assert.deepEqual(await fs.readdir(downloads), []);
      await player.evaluate(() => {
        location.href = 'file:///tmp/perch-denied.html';
      });
      await player.waitForTimeout(200);
      assert.equal(player.url(), `${base}/first`);
      assert.equal(await player.evaluate(() => typeof window.perch), 'undefined');
    },
  );
  await check('buttons, conventional keyboard seeks, volume, speed and scrubber', async () => {
    const overlay = player.locator('#perch-player');
    await player.locator('#perch-drag').click({ position: { x: 220, y: 120 } });
    assert.equal(
      await player.locator('video').evaluate((video) => video.paused),
      false,
      'Video tap must play',
    );
    await player.locator('#perch-drag').click({ position: { x: 220, y: 120 } });
    assert.equal(
      await player.locator('video').evaluate((video) => video.paused),
      true,
      'Video tap must pause',
    );
    await player.mouse.move(220, 120);
    await player.mouse.down();
    await player.waitForTimeout(250);
    await player.mouse.up();
    assert.equal(
      await player.locator('video').evaluate((video) => video.paused),
      true,
      'Holding must not toggle playback',
    );
    await overlay.getByRole('button', { name: 'Forward 10 seconds', exact: true }).click();
    assert.ok((await player.locator('video').evaluate((video) => video.currentTime)) >= 10);
    await overlay.getByRole('button', { name: 'Forward 10 seconds', exact: true }).press('k');
    assert.equal(
      await player.locator('video').evaluate((video) => video.paused),
      false,
      'K must work after clicking a control',
    );
    await overlay.getByRole('button', { name: 'Forward 10 seconds', exact: true }).press('Space');
    assert.equal(
      await player.locator('video').evaluate((video) => video.paused),
      true,
      'Space must pause even when a seek button has focus',
    );
    await player.locator('#perch-drag').focus();
    await player.keyboard.press('ArrowRight');
    assert.ok((await player.locator('video').evaluate((video) => video.currentTime)) >= 15);
    await player.keyboard.press('j');
    assert.ok((await player.locator('video').evaluate((video) => video.currentTime)) < 7);
    await player.keyboard.press('l');
    assert.ok((await player.locator('video').evaluate((video) => video.currentTime)) >= 15);
    await overlay.getByLabel('Playback speed').selectOption('1.5');
    assert.equal(await player.locator('video').evaluate((video) => video.playbackRate), 1.5);
    await overlay.getByRole('button', { name: 'Mute', exact: true }).click();
    assert.equal(await player.locator('video').evaluate((video) => video.muted), true);
    await overlay.getByLabel('Volume', { exact: true }).focus();
    await overlay.getByLabel('Volume', { exact: true }).fill('0');
    await overlay.getByRole('button', { name: 'Unmute', exact: true }).click();
    assert.ok(
      (await player.locator('video').evaluate((video) => video.volume)) > 0,
      'Unmute must restore audible volume after zero',
    );
    await overlay.getByLabel('Video timeline').fill('20');
    await overlay.getByLabel('Video timeline').dispatchEvent('change');
    assert.ok((await player.locator('video').evaluate((video) => video.currentTime)) >= 19);
    await overlay.getByLabel('Video timeline').press('ArrowRight');
    assert.ok((await player.locator('video').evaluate((video) => video.currentTime)) < 22);
  });
  await check('YouTube ad controls accept native clicks and keyboard input', async () => {
    const overlay = player.locator('#perch-player');
    const paused = await player.locator('video').evaluate((video) => video.paused);
    const url = player.url();
    await player.evaluate(() => {
      const video = document.querySelector('video');
      const site = document.createElement('div');
      site.id = 'movie_player';
      site.className = 'ad-showing';
      site.dataset.skips = '0';
      video.before(site);
      site.append(video);
      const native = document.createElement('div');
      native.className = 'ytp-chrome-bottom';
      native.style.cssText = 'position:absolute;bottom:0;left:0;right:0;height:35px';
      site.append(native);
      const skip = document.createElement('button');
      skip.textContent = 'Skip ad';
      skip.disabled = true;
      skip.style.cssText = 'position:absolute;bottom:40px;right:12px;width:100px;height:36px';
      skip.addEventListener('click', (event) => {
        if (!event.isTrusted) return;
        site.dataset.skips = String(Number(site.dataset.skips) + 1);
        site.className = '';
      });
      site.append(skip);
    });
    const skip = player.getByRole('button', { name: 'Skip ad', exact: true });
    await skip.waitFor({ state: 'visible' });
    assert.equal(await skip.isDisabled(), true, 'The site owns the skip countdown');
    assert.equal(await player.locator('#perch-drag').isVisible(), false);
    assert.equal(await overlay.getByLabel('Video timeline').isVisible(), false);
    assert.equal(
      await overlay.getByRole('button', { name: 'Open queue', exact: true }).isVisible(),
      true,
    );
    assert.equal(
      await player
        .locator('.ytp-chrome-bottom')
        .evaluate((node) => getComputedStyle(node).visibility),
      'visible',
    );
    await player.evaluate(() => document.querySelector('video').dispatchEvent(new Event('ended')));
    await player.waitForTimeout(200);
    assert.equal(player.url(), url, 'An ad ending must not advance the video queue');
    assert.equal(await player.locator('#movie_player').getAttribute('data-skips'), '0');
    await player.evaluate(() => (document.querySelector('#movie_player button').disabled = false));
    await skip.click();
    assert.equal(await player.locator('#movie_player').getAttribute('data-skips'), '1');
    assert.equal(await player.locator('video').evaluate((video) => video.paused), paused);
    await player.evaluate(
      () => (document.querySelector('#movie_player').className = 'ad-interrupting'),
    );
    await skip.press('Space');
    assert.equal(
      await player.locator('#movie_player').getAttribute('data-skips'),
      '2',
      'Space must activate the native Skip button',
    );
    assert.equal(await player.locator('video').evaluate((video) => video.paused), paused);
    assert.equal(await player.locator('#perch-drag').isVisible(), true);
    assert.equal(await overlay.getByLabel('Video timeline').isVisible(), true);
    await player.evaluate(() => {
      const site = document.querySelector('#movie_player');
      site.before(site.querySelector('video'));
      site.remove();
    });
  });
  await check(
    'queue remains editable while video plays; stable identity through reorder',
    async () => {
      const queuePromise = application.waitForEvent('window');
      await player
        .locator('#perch-player')
        .getByRole('button', { name: 'Open queue', exact: true })
        .click();
      const queue = await queuePromise;
      await queue.waitForSelector('.queue-item');
      assert.equal(await queue.locator('.queue-item').count(), 2);
      const settingArgs = queue.evaluate(
        () => new Promise((resolve) => window.perch.onSettings((...args) => resolve(args.length))),
      );
      await queue.evaluate(() => window.perch.action('settings'));
      assert.equal(
        await settingArgs,
        0,
        'The settings callback must not expose Electron event objects',
      );
      const initial = await queue.evaluate(() => window.perch.getState());
      await queue
        .getByRole('button', { name: /^Move up:/ })
        .nth(1)
        .click();
      const changed = await queue.evaluate(() => window.perch.getState());
      assert.equal(changed.currentId, initial.currentId);
      assert.equal(changed.queue[0].id, initial.queue[1].id);
      await queue
        .getByRole('button', { name: /^Move down:/ })
        .nth(0)
        .click();
      const documentIdentity = await player.evaluate(
        () => (window.queueDocumentIdentity = performance.now()),
      );
      const rows = queue.locator('.queue-item');
      await rows.nth(1).dragTo(rows.nth(0), {
        sourcePosition: { x: 100, y: 20 },
        targetPosition: { x: 70, y: 3 },
      });
      await queue.waitForFunction(
        async (id) => (await window.perch.getState()).queue[0].id === id,
        initial.queue[1].id,
      );
      const dragged = await queue.evaluate(() => window.perch.getState());
      assert.equal(
        dragged.currentId,
        initial.currentId,
        'Dragging must not start a different video',
      );
      assert.equal(
        await player.evaluate(() => window.queueDocumentIdentity),
        documentIdentity,
        'Dragging must preserve the playing document',
      );
      assert.equal(
        await queue.locator('#links').inputValue(),
        '',
        'Queue dragging must not paste an internal ID',
      );
      await rows.nth(0).dragTo(queue.locator('#links'), { sourcePosition: { x: 100, y: 20 } });
      assert.deepEqual(
        (await queue.evaluate(() => window.perch.getState())).queue.map((item) => item.id),
        dragged.queue.map((item) => item.id),
        'Dropping outside the list cancels reorder',
      );
      assert.equal(await queue.locator('.dragging').count(), 0);
      assert.equal(await queue.locator('#links').inputValue(), '');
      await queue.evaluate(() => window.perch.action('reorder', { id: 'missing', beforeId: null }));
      assert.deepEqual(
        (await queue.evaluate(() => window.perch.getState())).queue.map((item) => item.id),
        dragged.queue.map((item) => item.id),
      );
      await queue.emulateMedia({ reducedMotion: 'reduce' });
      await queue.evaluate(({ id, beforeId }) => window.perch.action('reorder', { id, beforeId }), {
        id: initial.queue[0].id,
        beforeId: initial.queue[1].id,
      });
      await queue.waitForFunction(
        (id) => document.querySelector('.queue-item')?.dataset.id === id,
        initial.queue[0].id,
      );
      assert.equal(
        await queue.evaluate(() =>
          [...document.querySelectorAll('.queue-item')].some((row) => row.getAnimations().length),
        ),
        false,
        'Reduced motion must avoid spatial reorder animations',
      );
      await queue.emulateMedia({ reducedMotion: 'no-preference' });
      const transfer = await queue.evaluateHandle(() => {
        const data = new DataTransfer();
        data.setData('text/uri-list', 'https://example.com/video.mp4');
        return data;
      });
      await queue.locator('#links').dispatchEvent('drop', { dataTransfer: transfer });
      assert.equal(
        await queue.locator('#links').inputValue(),
        'https://example.com/video.mp4',
        'External link drops must still work',
      );
      await queue.locator('#links').fill('');
      await queue.screenshot({ path: path.join(output, 'queue.png') });
      await queue.close();
    },
  );
  await check('hover hides controls and keyboard focus keeps controls visible', async () => {
    // Queue closure can restore keyboard focus to a player control. Move focus
    // onto the video before checking the separate pointer-idle behaviour.
    await player.locator('#perch-drag').focus();
    await player.mouse.move(200, 110);
    await player.waitForFunction(() =>
      document
        .querySelector('#perch-player')
        .shadowRoot.querySelector('.chrome')
        .classList.contains('quiet'),
    );
    await player.mouse.move(210, 111);
    await player.waitForFunction(
      () =>
        !document
          .querySelector('#perch-player')
          .shadowRoot.querySelector('.chrome')
          .classList.contains('quiet'),
    );
    await player.locator('#perch-player').getByLabel('Playback speed').focus();
    await player.waitForTimeout(2500);
    assert.equal(
      await player.evaluate(() =>
        document
          .querySelector('#perch-player')
          .shadowRoot.querySelector('.chrome')
          .classList.contains('quiet'),
      ),
      false,
    );
  });
  await check('native panel flags, resize and pin toggle', async () => {
    const settings = await application.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      return {
        top: win.isAlwaysOnTop(),
        spaces: win.isVisibleOnAllWorkspaces(),
        resizable: win.isResizable(),
        prefs: win.webContents.getLastWebPreferences(),
      };
    });
    assert.equal(settings.top, false);
    assert.equal(settings.spaces, true);
    assert.equal(settings.resizable, true);
    assert.equal(settings.prefs.sandbox, true);
    assert.equal(settings.prefs.nodeIntegration, false);
    assert.equal(settings.prefs.contextIsolation, true);
    await application.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0].setBounds({ x: 300, y: 200, width: 480, height: 270 }),
    );
    await player.mouse.move(80, 18);
    await player.mouse.down();
    await player.mouse.move(180, 60, { steps: 4 });
    await player.mouse.up();
    const dragged = await application.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0].getBounds(),
    );
    assert.ok(
      dragged.x !== 300 || dragged.y !== 200,
      'Pointer dragging must move the native window',
    );
    await application.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0].setSize(320, 180),
    );
    await player.mouse.move(160, 100);
    await player.screenshot({ path: path.join(output, 'player-small.png') });
    await player
      .locator('#perch-player')
      .getByRole('button', { name: 'Keep on top', exact: true })
      .click();
    assert.equal(
      await application.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows()[0].isAlwaysOnTop(),
      ),
      true,
    );
    await player
      .locator('#perch-player')
      .getByRole('button', { name: 'Keep on top', exact: true })
      .click();
    await application.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0].setSize(480, 270),
    );
    await player.screenshot({ path: path.join(output, 'player.png') });
  });
  await check('next, automatic advance, active removal and empty recovery', async () => {
    await player
      .locator('#perch-player')
      .getByRole('button', { name: 'Next video', exact: true })
      .click();
    await player.waitForURL(`${base}/second`);
    await player.waitForFunction(() => document.querySelector('video')?.currentTime > 0);
    const queuePromise = application.waitForEvent('window');
    await player
      .locator('#perch-player')
      .getByRole('button', { name: 'Open queue', exact: true })
      .click();
    const queue = await queuePromise;
    await queue.waitForSelector('.queue-item');
    await queue.getByRole('button', { name: /^Play Perch test video$/ }).click();
    await player.waitForURL(`${base}/first`);
    await player.waitForFunction(() => document.querySelector('video')?.readyState >= 2);
    await player.locator('#perch-player').getByLabel('Video timeline').fill('39.8');
    await player.locator('#perch-player').getByLabel('Video timeline').dispatchEvent('change');
    if (await player.locator('video').evaluate((video) => video.paused))
      await player
        .locator('#perch-player')
        .getByRole('button', { name: 'Play', exact: true })
        .click();
    await application.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()
        .find((win) => !win.webContents.getURL().includes('view=queue'))
        .hide(),
    );
    await player.waitForURL(`${base}/second`, { timeout: 15000 });
    assert.equal(
      await application.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows()
          .find((win) => !win.webContents.getURL().includes('view=queue'))
          .isVisible(),
      ),
      false,
      'Automatic next must preserve hidden visibility',
    );
    await application.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()
        .find((win) => !win.webContents.getURL().includes('view=queue'))
        .showInactive(),
    );
    await queue
      .getByRole('button', { name: /^Remove video:/ })
      .last()
      .click();
    await player.waitForURL(`${base}/first`);
    await queue.getByRole('button', { name: /^Remove video:/ }).click();
    await player.waitForSelector('#links');
    assert.equal((await queue.evaluate(() => window.perch.getState())).queue.length, 0);
    await queue.close();
  });
  await check(
    'two players require Settings opt-in, cap at two, avoid duplicates, isolate controls',
    async () => {
      const queued = application.waitForEvent('window');
      await player.getByRole('button', { name: 'Open queue', exact: true }).click();
      const queue = await queued;
      await queue.waitForSelector('#links');
      await queue.locator('#links').fill(`${base}/first`);
      await queue.getByRole('button', { name: 'Play', exact: true }).click();
      await player.waitForURL(`${base}/first`);
      await player.waitForFunction(() => document.querySelector('video')?.currentTime > 0);
      await queue.locator('#links').fill(`${base}/second`);
      await queue.getByRole('button', { name: 'Play', exact: true }).click();
      await player.waitForURL(`${base}/second`);
      assert.equal(application.windows().length, 2, 'Default must replace rather than duplicate');
      await queue.getByRole('button', { name: 'Settings', exact: true }).click();
      await queue.getByLabel('Allow two players', { exact: true }).check();
      const secondPromise = application.waitForEvent('window');
      await queue.locator('#links').fill(`${base}/first`);
      await queue.getByRole('button', { name: 'Play', exact: true }).click();
      const second = await secondPromise;
      await second.waitForFunction(() => document.querySelector('video')?.currentTime > 0);
      assert.equal(application.windows().length, 3);
      await queue.locator('#links').fill(`${base}/third`);
      await queue.getByRole('button', { name: 'Play', exact: true }).click();
      await queue.getByRole('status').filter({ hasText: 'Two players are already open' }).waitFor();
      assert.equal(application.windows().length, 3);
      assert.equal((await queue.evaluate(() => window.perch.getState())).queue.length, 2);
      await queue.locator('#links').fill(`${base}/first`);
      await queue.getByRole('button', { name: 'Play', exact: true }).click();
      assert.equal(application.windows().length, 3, 'Repeated Play must reuse an existing source');
      await second.locator('#perch-drag').focus();
      await second.keyboard.press('k');
      assert.equal(await second.locator('video').evaluate((video) => video.paused), true);
      const origin = await second.evaluate(() => performance.timeOrigin);
      await queue.locator('#links').fill(`${base}/first`);
      await queue.getByRole('button', { name: 'Play', exact: true }).click();
      await queue.getByRole('status').filter({ hasText: 'Already in your queue' }).waitFor();
      assert.equal(
        await second.evaluate(() => performance.timeOrigin),
        origin,
        'Duplicate selected source must not reload',
      );
      assert.equal(
        await second.locator('video').evaluate((video) => video.paused),
        true,
        'Duplicate selected source must preserve pause',
      );
      assert.equal(await player.locator('video').evaluate((video) => video.paused), false);
      if (await player.locator('video').evaluate((video) => video.muted))
        await player
          .locator('#perch-player')
          .getByRole('button', { name: 'Unmute', exact: true })
          .click();
      await queue.evaluate(() => window.perch.action('muteAll'));
      await player.waitForFunction(() => document.querySelector('video').muted);
      await second.waitForFunction(() => document.querySelector('video').muted);
      assert.equal(
        await second.locator('video').evaluate((video) => video.paused),
        true,
        'Global mute must preserve pause',
      );
      await queue.evaluate(() => window.perch.action('muteAll'));
      await player.waitForFunction(() => !document.querySelector('video').muted);
      await second.waitForFunction(() => !document.querySelector('video').muted);
      for (const page of [player, second]) {
        await page.locator('#perch-player').getByLabel('Volume', { exact: true }).focus();
        await page.locator('#perch-player').getByLabel('Volume', { exact: true }).fill('0');
      }
      await queue.evaluate(() => window.perch.action('muteAll'));
      for (const page of [player, second])
        await page.waitForFunction(
          () =>
            !document.querySelector('video').muted && document.querySelector('video').volume > 0,
        );
      await queue.getByLabel('Allow two players', { exact: true }).uncheck();
      await second.waitForTimeout(100);
      assert.equal(
        application.windows().length,
        2,
        'Disabling dual mode must destroy the extra player',
      );
      await queue.screenshot({ path: path.join(output, 'queue-settings.png') });
      await queue.close();
    },
  );
  await check('no-video and network failures recover through the same queue', async () => {
    const survivor = application.windows()[0];
    const queuePromise = application.waitForEvent('window');
    await survivor
      .locator('#perch-player')
      .getByRole('button', { name: 'Open queue', exact: true })
      .click();
    const queue = await queuePromise;
    await queue.waitForSelector('#links');
    await queue.locator('#links').fill(`${base}/empty`);
    await queue.getByRole('button', { name: 'Play', exact: true }).click();
    await survivor
      .locator('#perch-player')
      .getByText('No playable video found.', { exact: false })
      .waitFor({ timeout: 25000 });
    await queue.locator('#links').fill('http://127.0.0.1:1/unavailable');
    await queue.getByRole('button', { name: 'Play', exact: true }).click();
    await queue.locator('.item-source').filter({ hasText: 'This page could not load' }).waitFor();
    await queue.locator('#links').fill(`${base}/first`);
    await queue.getByRole('button', { name: 'Play', exact: true }).click();
    await survivor.waitForURL(`${base}/first`);
    await survivor.waitForFunction(() => document.querySelector('video')?.currentTime > 0);
    const removed = await survivor.locator('video').elementHandle();
    await removed.evaluate((video) => video.remove());
    await survivor
      .locator('#perch-player')
      .getByText('No playable video found.', { exact: false })
      .waitFor({ timeout: 25000 });
    assert.equal(
      await removed.evaluate((video) => video.paused),
      true,
      'Removed media must stop playing',
    );
    const retry = survivor
      .locator('#perch-player')
      .getByRole('button', { name: 'Retry', exact: true });
    await retry.focus();
    await survivor.waitForTimeout(2200);
    assert.equal(
      await retry.evaluate((button) => button === button.getRootNode().activeElement),
      true,
      'Recovery actions must retain focus across status refreshes',
    );
    await survivor.evaluate(() => {
      const video = document.createElement('video');
      video.src = '/sample.mp4';
      document.body.append(video);
    });
    await survivor.waitForFunction(() => document.querySelector('video')?.currentTime > 0);
    await queue.locator('#links').fill(`${base}/slow`);
    await queue.getByRole('button', { name: 'Play', exact: true }).click();
    await application.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()
        .find((win) => !win.webContents.getURL().includes('view=queue'))
        .close(),
    );
    await survivor.waitForFunction(() => document.querySelector('video')?.readyState >= 2);
    await survivor.locator('video').evaluate((video) => video.play().catch(() => {}));
    await survivor.waitForFunction(() => document.querySelector('video').paused);
    await survivor.locator('video').evaluate((video) => video.dispatchEvent(new Event('ended')));
    await survivor.waitForTimeout(200);
    assert.equal(
      survivor.url(),
      `${base}/slow`,
      'A late site event after close must not advance the queue',
    );
    assert.equal(
      await survivor.locator('video').evaluate((video) => video.paused),
      true,
      'Closing while loading must suppress later autoplay',
    );
    assert.equal(
      await application.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows()
          .find((win) => !win.webContents.getURL().includes('view=queue'))
          .isVisible(),
      ),
      false,
    );
    await queue.close();
  });
  assert.deepEqual(errors, []);
  await fs.writeFile(
    path.join(output, 'results.json'),
    JSON.stringify(
      { date: new Date().toISOString(), platform: process.platform, results },
      null,
      2,
    ),
  );
  console.log(`Verified ${results.length} actual-Electron workflows. Evidence: ${output}`);
} catch (error) {
  await fs.writeFile(path.join(output, 'failure.txt'), error.stack || String(error));
  throw error;
} finally {
  await application?.close();
  await new Promise((resolve) => server.close(resolve));
  await fs.rm(userData, { recursive: true, force: true });
}
