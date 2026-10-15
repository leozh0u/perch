import { _electron as electron } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const visible = process.argv.includes('--visible');
const videoURL =
  process.argv.find((arg) => arg.startsWith('--url='))?.slice(6) ||
  'https://www.youtube.com/watch?v=aircAruvnKk';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'output/playwright');
const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'perch-captions-'));
await fs.mkdir(output, { recursive: true });
let application, page;
try {
  application = await electron.launch({
    args: [root, '--perch-test', ...(visible ? ['--perch-test-shortcuts'] : [])],
    env: { ...process.env, PERCH_TEST_DATA: directory },
  });
  if (!visible)
    await application.evaluate(({ BrowserWindow }) => {
      for (const win of BrowserWindow.getAllWindows()) {
        win.setOpacity(0);
        win.webContents.setAudioMuted(true);
      }
    });
  page = await application.firstWindow();
  await page.waitForSelector('#links');
  await page.locator('#links').fill(videoURL);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.waitForFunction(
    () => {
      const cc = document
        .querySelector('#perch-player')
        ?.shadowRoot.querySelector('[data-action=captions]');
      return cc && !cc.disabled;
    },
    null,
    { timeout: 60000 },
  );
  await page.waitForFunction(() => {
    const video = document.querySelector('#movie_player video.html5-main-video');
    return video && video.readyState >= 2;
  });
  const overlay = page.locator('#perch-player');
  if (await page.locator('#movie_player video.html5-main-video').evaluate((v) => v.paused))
    await overlay.getByRole('button', { name: 'Play', exact: true }).click();
  await page.waitForFunction(() => {
    const video = document.querySelector('#movie_player video.html5-main-video');
    return video && !video.paused && video.currentTime > 3;
  });
  await page.mouse.move(240, 100);
  const cc = page.locator('#perch-player').getByRole('button', { name: 'Captions', exact: true });
  if ((await cc.getAttribute('aria-pressed')) === 'true') await cc.click();
  const paused = await page
    .locator('#movie_player video.html5-main-video')
    .evaluate((v) => v.paused);
  await cc.click();
  await page.waitForFunction(
    () => document.querySelector('.ytp-subtitles-button')?.getAttribute('aria-pressed') === 'true',
  );
  await page.waitForFunction(
    () => [...document.querySelectorAll('.ytp-caption-segment')].some((n) => n.textContent.trim()),
    null,
    { timeout: 30000 },
  );
  const caption = await page.locator('.ytp-caption-segment').allTextContents();
  await page.mouse.move(220, 220);
  await page.screenshot({ path: path.join(output, 'youtube-captions.png') });
  await application.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].setSize(320, 180),
  );
  await page.screenshot({ path: path.join(output, 'youtube-captions-small.png') });
  await cc.press('c');
  await page.waitForFunction(
    () => document.querySelector('.ytp-subtitles-button')?.getAttribute('aria-pressed') === 'false',
  );
  const after = await page
    .locator('#movie_player video.html5-main-video')
    .evaluate((v) => v.paused);
  if (paused !== after) throw new Error('Toggling captions changed playback state');
  const result = {
    checkedAt: new Date().toISOString(),
    title: await page.title(),
    available: true,
    toggleOn: true,
    toggleOff: true,
    captionVisible: caption.some(Boolean),
    playbackUnchanged: true,
  };
  await fs.writeFile(path.join(output, 'youtube-captions.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  if (page) {
    const diagnostic = await page.evaluate(() => ({
      title: document.title,
      nativeButton: document.querySelector('.ytp-subtitles-button')?.outerHTML,
      playerClass: document.querySelector('#movie_player')?.className,
      text: document.body.innerText.slice(0, 1500),
    }));
    await fs.writeFile(
      path.join(output, 'youtube-captions-failure.json'),
      JSON.stringify(diagnostic, null, 2),
    );
    await page
      .screenshot({ path: path.join(output, 'youtube-captions-failure.png'), timeout: 5000 })
      .catch(() => {});
  }
  throw error;
} finally {
  await application?.close();
  await fs.rm(directory, { recursive: true, force: true });
}
