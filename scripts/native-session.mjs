// Bounded manual Mac verification session. Use CUA/native inputs while this runs.
import { _electron as electron } from 'playwright';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fixtureServer } from './fixture-server.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'output/playwright');
await fs.mkdir(output, { recursive: true });
const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'perch-native-'));
const fixture = await fixtureServer(path.join(output, 'sample.mp4'));
const samples = [];
let application,
  done = false;
try {
  application = await electron.launch({
    executablePath: path.join(
      root,
      `output/test-app/Perch-darwin-${process.arch}/Perch.app/Contents/MacOS/Perch`,
    ),
    args: ['--perch-test', '--perch-test-shortcuts'],
    env: { ...process.env, PERCH_TEST_DATA: directory },
  });
  await application.evaluate(({ BrowserWindow }) => {
    globalThis.perchNativeEvents = [];
    const win = BrowserWindow.getAllWindows()[0];
    for (const name of ['show', 'hide', 'focus', 'blur'])
      win.on(name, () => globalThis.perchNativeEvents.push({ name, at: Date.now() }));
  });
  const page = await application.firstWindow();
  await page.waitForSelector('#links');
  await page.locator('#links').fill(`${fixture.base}/first\n${fixture.base}/second`);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('video')?.currentTime > 2);
  await page.locator('#perch-player').getByLabel('Volume', { exact: true }).focus();
  await page.locator('#perch-player').getByLabel('Volume', { exact: true }).fill('0.05');
  application.on('close', () => {
    done = true;
  });
  console.log(
    'Native session ready. Telemetry: output/playwright/native-live.json. Cmd+Q ends the session.',
  );
  for (let tick = 0; tick < 600 && !done; tick++) {
    const window = await application.evaluate(({ BrowserWindow, screen, globalShortcut }) => {
      const win = BrowserWindow.getAllWindows()[0];
      return {
        visible: win.isVisible(),
        bounds: win.getBounds(),
        alwaysOnTop: win.isAlwaysOnTop(),
        allSpaces: win.isVisibleOnAllWorkspaces(),
        optionSpaceRegistered: globalShortcut.isRegistered('Alt+Space'),
        focused: win.isFocused(),
        events: globalThis.perchNativeEvents.slice(-12),
        display: screen.getPrimaryDisplay().workArea,
      };
    });
    const video = await page.evaluate(() => {
      const video = document.querySelector('video');
      return {
        currentTime: video?.currentTime,
        paused: video?.paused,
        muted: video?.muted,
        volume: video?.volume,
        documentVisibility: document.visibilityState,
      };
    });
    const sample = { at: new Date().toISOString(), ...window, ...video };
    samples.push(sample);
    await fs.writeFile(path.join(output, 'native-live.json'), JSON.stringify(sample, null, 2));
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
} catch (error) {
  if (!done) console.log(error.message);
} finally {
  await fs.writeFile(path.join(output, 'native-session.json'), JSON.stringify(samples, null, 2));
  await application?.close().catch(() => {});
  await fixture.close();
  await fs.rm(directory, { recursive: true, force: true });
}
