import { _electron as electron } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
if (!process.argv.includes('--visible'))
  throw new Error('Quit normal Perch, then run: node scripts/verify-youtube.mjs --visible');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'output/playwright');
await fs.mkdir(output, { recursive: true });
const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'perch-youtube-'));
let application;
try {
  application = await electron.launch({
    args: [root, '--perch-test', '--perch-test-shortcuts'],
    env: { ...process.env, PERCH_TEST_DATA: directory },
  });
  const page = await application.firstWindow();
  const diagnostics = [];
  page.on('requestfailed', (request) => {
    if (new URL(request.url()).hostname.endsWith('googlevideo.com'))
      diagnostics.push({ event: 'stream-request-failed', error: request.failure()?.errorText });
  });
  page.on('response', (response) => {
    if (response.status() >= 400 && new URL(response.url()).hostname.endsWith('googlevideo.com'))
      diagnostics.push({ event: 'stream-response', status: response.status() });
  });
  const checkpoint = async (label) => {
    const state = await page.evaluate(() => ({
      visibility: document.visibilityState,
      events: window.__perchMediaLog,
      playerClass: document.querySelector('#movie_player')?.className,
      media: [...document.querySelectorAll('video')].map((v) => ({
        time: v.currentTime,
        paused: v.paused,
        ready: v.readyState,
        muted: v.muted,
        volume: v.volume,
        hasSource: Boolean(v.currentSrc),
        error: v.error?.message,
        className: v.className,
        parent: v.parentElement?.outerHTML.slice(0, 2200),
      })),
    }));
    diagnostics.push({ label, ...state });
    await fs.writeFile(
      path.join(output, 'youtube-diagnostics.json'),
      JSON.stringify(diagnostics, null, 2),
    );
  };
  await page.waitForSelector('#links');
  await page.locator('#links').fill('https://www.youtube.com/watch?v=aqz-KE-bpKQ');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  let played = false;
  try {
    await page.waitForFunction(
      () =>
        !document.querySelector('#movie_player.ad-showing,#movie_player.ad-interrupting') &&
        [...document.querySelectorAll('video')].some(
          (video) => video.currentTime > 2 && video.readyState >= 2 && video.videoWidth > 0,
        ),
      null,
      { timeout: 45000 },
    );
    played = true;
  } catch {}
  await page.mouse.move(240, 200);
  await page.screenshot({
    path: path.join(output, played ? 'youtube.png' : 'youtube-failure.png'),
  });
  const evidence = await page.evaluate(() => ({
    title: document.title,
    url: location.href,
    video: [...document.querySelectorAll('video')].map((video) => ({
      currentTime: video.currentTime,
      duration: video.duration,
      width: video.videoWidth,
      paused: video.paused,
      error: video.error?.message,
    })),
    text: document.body.innerText.slice(0, 4000),
  }));
  await fs.writeFile(
    path.join(output, 'youtube-result.json'),
    JSON.stringify({ played, ...evidence }, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        played,
        title: evidence.title,
        video: evidence.video,
        text: played ? undefined : evidence.text,
      },
      null,
      2,
    ),
  );
  if (played) {
    await page.evaluate(() => {
      window.__perchMediaLog = [];
      let nextId = 0;
      const ids = new WeakMap();
      for (const name of [
        'play',
        'pause',
        'emptied',
        'loadstart',
        'loadedmetadata',
        'seeking',
        'seeked',
        'volumechange',
        'error',
      ])
        document.addEventListener(
          name,
          (e) => {
            const v = e.target;
            if (!(v instanceof HTMLVideoElement)) return;
            if (!ids.has(v)) ids.set(v, ++nextId);
            window.__perchMediaLog.push({
              event: name,
              id: ids.get(v),
              t: performance.now(),
              time: v.currentTime,
              ready: v.readyState,
              paused: v.paused,
              className: v.className,
              connected: v.isConnected,
              main: v.closest('#movie_player') !== null,
            });
            window.__perchMediaLog = window.__perchMediaLog.slice(-150);
          },
          true,
        );
    });
    await page.locator('#perch-player').getByRole('button', { name: 'Pause', exact: true }).click();
    await page.waitForFunction(
      () => document.querySelector('#movie_player video.html5-main-video')?.paused === true,
    );
    await page
      .locator('#perch-player')
      .getByRole('button', { name: 'Forward 10 seconds', exact: true })
      .click();
    if (
      await page.locator('#movie_player video.html5-main-video').evaluate((video) => video.paused)
    )
      await page
        .locator('#perch-player')
        .getByRole('button', { name: 'Play', exact: true })
        .click();
    const started = await page
      .locator('#movie_player video.html5-main-video')
      .evaluate((video) => video.currentTime);
    try {
      await page.waitForFunction(
        (previous) => {
          const video = document.querySelector('#movie_player video.html5-main-video');
          return video && video.currentTime > previous + 35 && video.readyState >= 2;
        },
        started,
        { timeout: 60000 },
      );
    } catch (error) {
      await checkpoint('long-playback-failure');
      const after = await page.evaluate(() => ({
        video: [...document.querySelectorAll('video')].map((v) => ({
          time: v.currentTime,
          paused: v.paused,
          ready: v.readyState,
          error: v.error?.message,
          className: v.className,
          parent: v.parentElement?.outerHTML.slice(0, 2200),
        })),
        text: document.body.innerText.slice(0, 4000),
      }));
      await fs.writeFile(
        path.join(output, 'youtube-result.json'),
        JSON.stringify(
          { ...evidence, played, started, after, diagnostics, longPlaybackConfirmed: false },
          null,
          2,
        ),
      );
      await page.screenshot({ path: path.join(output, 'youtube-failure.png') });
      throw error;
    }
    await fs.writeFile(
      path.join(output, 'youtube-result.json'),
      JSON.stringify(
        {
          played: true,
          longPlaybackConfirmed: true,
          ...evidence,
          checkedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
    await page.evaluate(() => getSelection()?.removeAllRanges());
    await page.mouse.move(220, 220);
    await page.waitForFunction(
      () =>
        Number(
          getComputedStyle(document.querySelector('#perch-player').shadowRoot.querySelector('.top'))
            .opacity,
        ) > 0.99,
    );
    await page.screenshot({ path: path.join(output, 'youtube.png') });
    await checkpoint('before-queue');
    const queuePromise = application.waitForEvent('window');
    await page
      .locator('#perch-player')
      .getByRole('button', { name: 'Open queue', exact: true })
      .click();
    const queue = await queuePromise;
    await queue.waitForSelector('#links');
    await checkpoint('queue-open');
    await page.locator('#perch-player').getByLabel('Volume', { exact: true }).focus();
    await page.locator('#perch-player').getByLabel('Volume', { exact: true }).fill('0');
    await checkpoint('before-mute-command');
    await queue.evaluate(() => window.perch.action('muteAll'));
    await page.waitForFunction(() => {
      const v = document.querySelector('#movie_player video.html5-main-video');
      return v && !v.muted && v.volume > 0 && !v.paused;
    });
    await checkpoint('before-mute-command');
    await queue.evaluate(() => window.perch.action('muteAll'));
    await page.waitForFunction(
      () => document.querySelector('#movie_player video.html5-main-video')?.muted === true,
    );
    await checkpoint('before-mute-command');
    await queue.evaluate(() => window.perch.action('muteAll'));
    await page.waitForFunction(() => {
      const v = document.querySelector('#movie_player video.html5-main-video');
      return v && !v.muted && v.volume > 0 && !v.paused;
    });
    await page.waitForTimeout(3000);
    const afterUnmute = await page
      .locator('#movie_player video.html5-main-video')
      .evaluate((v) => ({
        muted: v.muted,
        volume: v.volume,
        paused: v.paused,
        currentTime: v.currentTime,
        readyState: v.readyState,
      }));
    if (afterUnmute.muted || afterUnmute.volume === 0 || afterUnmute.paused) {
      await page.screenshot({ path: path.join(output, 'youtube-failure.png') });
      await fs.writeFile(
        path.join(output, 'youtube-result.json'),
        JSON.stringify(
          { ...evidence, afterUnmute, zeroVolumeRecovery: false, diagnostics },
          null,
          2,
        ),
      );
      throw new Error(`YouTube did not retain audible playback: ${JSON.stringify(afterUnmute)}`);
    }
    await fs.writeFile(
      path.join(output, 'youtube-result.json'),
      JSON.stringify(
        {
          played: true,
          longPlaybackConfirmed: true,
          zeroVolumeRecovery: true,
          diagnostics,
          ...evidence,
          checkedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
    await queue.locator('#links').fill('https://www.youtube.com/watch?v=eRsGyueVLvQ');
    await queue.getByRole('button', { name: 'Add to queue', exact: true }).click();
    await queue
      .waitForFunction(
        () => !document.querySelectorAll('.item-title')[1]?.textContent.startsWith('YouTube ·'),
        null,
        { timeout: 8000 },
      )
      .catch(() => {});
    await queue.screenshot({ path: path.join(output, 'youtube-queue.png') });
  } else process.exitCode = 1;
} finally {
  await application?.close();
  await fs.rm(directory, { recursive: true, force: true });
}
