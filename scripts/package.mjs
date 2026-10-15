import { packager } from '@electron/packager';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apps = await packager({ dir: root, name: 'Perch', appBundleId: 'io.github.leozh0u.perch', appCategoryType: 'public.app-category.video', platform: 'darwin', arch: process.arch, out: path.join(root, 'release'), overwrite: true, asar: true, icon: path.join(root, 'assets/icon.icns'), ignore: [/^\/(output|release|docs|tests|scripts|\.git|\.impeccable)(\/|$)/, /^\/(PRODUCT|DESIGN|README)\.md$/, /^\/assets\/icon\.iconset(\/|$)/], prune: true });
for (const directory of apps) {
  const bundle = path.join(directory, 'Perch.app');
  await fs.copyFile(path.join(root, 'assets/icon.icns'), path.join(bundle, 'Contents/Resources/perch.icns'));
  execFileSync('/usr/libexec/PlistBuddy', ['-c', 'Set :CFBundleIconFile perch.icns', path.join(bundle, 'Contents/Info.plist')]);
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', bundle], { stdio: 'inherit' });
  if (process.argv.includes('--zip')) execFileSync('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', bundle, path.join(root, `release/Perch-mac-${process.arch}.zip`)]);
  console.log(bundle);
}
