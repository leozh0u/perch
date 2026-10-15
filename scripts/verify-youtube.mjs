import { _electron as electron } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'output/playwright'); await fs.mkdir(output, { recursive: true });
const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'perch-youtube-'));
let application;
try {
  application = await electron.launch({ args: [root, '--perch-test'], env: { ...process.env, PERCH_TEST_DATA: directory } });
  const page = await application.firstWindow();
  await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].hide());
  await page.waitForSelector('#links');
  await page.locator('#links').fill('https://www.youtube.com/watch?v=aqz-KE-bpKQ');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  let played = false;
  try { await page.waitForFunction(() => [...document.querySelectorAll('video')].some(video => video.currentTime > 2 && video.readyState >= 2 && video.videoWidth > 0), null, { timeout: 45000 }); played = true; } catch {}
  await page.mouse.move(240, 200);
  await page.screenshot({ path: path.join(output, played ? 'youtube.png' : 'youtube-failure.png') });
  const evidence = await page.evaluate(() => ({ title: document.title, url: location.href, video: [...document.querySelectorAll('video')].map(video => ({ currentTime: video.currentTime, duration: video.duration, width: video.videoWidth, paused: video.paused, error: video.error?.message })), text: document.body.innerText.slice(0, 4000) }));
  await fs.writeFile(path.join(output, 'youtube-result.json'), JSON.stringify({ played, ...evidence }, null, 2));
  console.log(JSON.stringify({ played, title: evidence.title, video: evidence.video, text: played ? undefined : evidence.text }, null, 2));
  if (played) {
    await page.locator('#perch-player').getByRole('button', { name: 'Pause', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('video')?.paused === true);
    await page.locator('#perch-player').getByRole('button', { name: 'Forward 10 seconds', exact: true }).click();
    if (await page.locator('video').evaluate(video => video.paused)) await page.locator('#perch-player').getByRole('button', { name: 'Play', exact: true }).click();
    const started = await page.locator('video').evaluate(video => video.currentTime);
    try {
      await page.waitForFunction(previous => { const video = document.querySelector('#movie_player video.html5-main-video') || document.querySelector('video'); return video && video.currentTime > previous + 35 && video.readyState >= 2; }, started, { timeout: 60000 });
    } catch (error) {
      const after = await page.evaluate(() => ({ video: [...document.querySelectorAll('video')].map(v => ({ time: v.currentTime, paused: v.paused, ready: v.readyState, error: v.error?.message })), text: document.body.innerText.slice(0, 4000) }));
      await fs.writeFile(path.join(output, 'youtube-result.json'), JSON.stringify({ ...evidence, played, started, after, longPlaybackConfirmed: false }, null, 2));
      await page.screenshot({ path: path.join(output, 'youtube-failure.png') });
      throw error;
    }
    await fs.writeFile(path.join(output, 'youtube-result.json'), JSON.stringify({ played: true, longPlaybackConfirmed: true, ...evidence, checkedAt: new Date().toISOString() }, null, 2));
    await page.evaluate(() => getSelection()?.removeAllRanges());
    await page.mouse.move(220, 220);
    await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('#perch-player').shadowRoot.querySelector('.top')).opacity) > .99);
    await page.screenshot({ path: path.join(output, 'youtube.png') });
    const queuePromise = application.waitForEvent('window');
    await page.locator('#perch-player').getByRole('button', { name: 'Open queue', exact: true }).click();
    const queue = await queuePromise; await queue.waitForSelector('#links');
    await queue.locator('#links').fill('https://www.youtube.com/watch?v=Z4E6ZT-M2gA'); await queue.getByRole('button', { name: 'Add to queue', exact: true }).click();
    await queue.waitForFunction(() => !document.querySelectorAll('.item-title')[1]?.textContent.startsWith('YouTube ·'), { timeout: 8000 }).catch(() => {});
    await queue.screenshot({ path: path.join(output, 'youtube-queue.png') });
  } else process.exitCode = 1;
} finally { await application?.close(); await fs.rm(directory, { recursive: true, force: true }); }
