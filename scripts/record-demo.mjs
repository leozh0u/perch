// Records only Perch's own viewport with a fresh profile, never the desktop.
import { _electron as electron } from 'playwright';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const frames = path.join(root, 'output/demo-frames');
await fs.mkdir(frames, { recursive: true });
const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'perch-demo-'));
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let application,
  index = 0;
try {
  application = await electron.launch({
    args: [root, '--perch-test'],
    env: { ...process.env, PERCH_TEST_DATA: profile },
  });
  const page = await application.firstWindow();
  await page.waitForSelector('#links');
  await page.locator('#links').fill('https://www.youtube.com/watch?v=aqz-KE-bpKQ&t=30');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.waitForFunction(
    () => {
      const v = document.querySelector('video');
      return (
        v && v.currentTime > 32 && v.readyState >= 3 && v.videoWidth > 0 && !v.paused && !v.seeking
      );
    },
    null,
    { timeout: 45000 },
  );
  const controls = page.locator('#perch-player');
  if (await controls.getByRole('button', { name: 'Unmute', exact: true }).count())
    await controls.getByRole('button', { name: 'Unmute', exact: true }).click();
  await page.waitForFunction(() => {
    const v = document.querySelector('video');
    return v && !v.muted && v.volume > 0 && !v.paused;
  });
  async function capture(seconds) {
    const start = performance.now();
    for (let frame = 0; frame < seconds * 8; frame++) {
      await page.screenshot({
        path: path.join(frames, `frame-${String(index++).padStart(4, '0')}.png`),
      });
      await delay(Math.max(0, start + (frame + 1) * 125 - performance.now()));
    }
  }
  await page.mouse.move(220, 220);
  await capture(3);
  await controls.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('video').paused);
  await capture(1);
  await controls.getByRole('button', { name: 'Forward 10 seconds', exact: true }).click();
  await capture(2);
  await controls.getByRole('button', { name: 'Play', exact: true }).click();
  await capture(3);
  await controls.getByRole('button', { name: 'Mute', exact: true }).click();
  await capture(1);
  await controls.getByRole('button', { name: 'Unmute', exact: true }).click();
  await capture(1);
  await fs.writeFile(
    path.join(root, 'output/demo.json'),
    JSON.stringify(
      {
        recordedAt: new Date().toISOString(),
        source: page.url(),
        frames: index,
        fps: 8,
        method: 'Actual app viewport screenshots; no desktop capture or downloaded video file',
        audio: 'GIF has no audio track; playback uses normal browser audio during capture',
      },
      null,
      2,
    ),
  );
} finally {
  await application?.close();
  await fs.rm(profile, { recursive: true, force: true });
}
execFileSync(
  'ffmpeg',
  [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-framerate',
    '8',
    '-i',
    path.join(frames, 'frame-%04d.png'),
    '-frames:v',
    String(index),
    '-filter_complex',
    'scale=640:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer',
    '-loop',
    '0',
    path.join(root, 'docs/images/demo.gif'),
  ],
  { stdio: 'inherit' },
);
console.log(`Recorded ${index} app frames to docs/images/demo.gif`);
