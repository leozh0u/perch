# Build and contribute

Perch is plain JavaScript, HTML and CSS inside Electron. There is no backend or application framework to set up.

## Run locally

On a Mac, install [Node.js](https://nodejs.org/) 22.12 or newer and [Git](https://git-scm.com/), then open Terminal:

```sh
git clone https://github.com/leozh0u/perch.git
cd perch
npm ci
npm start
```

The first install downloads Electron. If npm asks about dependency install scripts, allow Electron and esbuild, which need their native executables.

## Check a change

```sh
npm run format:check
npm test
npm run verify
npm audit
```

`npm run verify` needs [FFmpeg](https://ffmpeg.org/) to generate a synthetic video. It drives the actual Electron app in a temporary profile, with invisible windows, no test tray icon and native audio silenced to avoid test noise. It does not read your browser cookies. `npm run format` formats the source.

For changes to website/media integration, also run:

```sh
node scripts/verify-youtube.mjs --visible
```

Quit your normal Perch first. This is an explicit visible native session with a temporary profile, one test app, normal browser audio and working shortcuts. Invisible website runs changed YouTube media behaviour on this Mac, so they are not used as the playback test. The synthetic workflow checks above stay invisible and silent. YouTube availability can affect the result. Raw evidence stays in ignored `output/`; selected public evidence goes in `docs/evidence/`.

## Build a Mac app

```sh
npm run package
```

On Apple Silicon, the app appears at `release/Perch-darwin-arm64/Perch.app`. On Intel the path is `release/Perch-darwin-x64/Perch.app`, but Intel builds have not been tested. Move it into Applications to use it without a terminal.

```sh
npm run dist
```

This also creates `release/Perch-mac-arm64.zip` on Apple Silicon. Production builds disable Electron's Node execution/environment and inspector entry points, validate the ASAR archive and only load the packaged ASAR. Fuses are set before the ad-hoc signature. No Apple account credentials or notarisation are used.

For an inspectable package used only in local native tests:

```sh
npm run package:test
node scripts/native-session.mjs
```

It goes under ignored `output/test-app/`, retains the inspector for Playwright, and cannot be zipped by the packaging script. Quit your normal Perch first if you want to test global shortcut registration. The native session lasts at most ten minutes; Command+Q ends it. Do not distribute that test package.

The public YouTube check captures the player and queue in `output/playwright/`. When refreshing README screenshots, inspect them first, copy the selected images into `docs/images/`, and preserve the film attribution. Use an isolated test profile; do not capture personal queues or desktop content.

## Icons

The chair/play mark is in `assets/logo.svg`. The matching small UI path is in `src/icons.js` and `src/index.html`. To regenerate the native app and menu bar icons on a Mac:

```sh
swift scripts/make-icons.swift assets
iconutil -c icns assets/icon.iconset -o assets/icon.icns
```

The menu bar uses the 36-pixel template at 18 points. Keep that size when changing the mark.

## Before a pull request

Keep changes focused and describe the behaviour you changed and the checks you ran. Preserve the one-player default, explicit dual-player opt-in, normal keyboard controls and remote-page isolation. Never commit cookies, personal queue data, credentials, `output/` or packaged binaries.
