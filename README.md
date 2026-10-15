# Perch

A small floating video player for macOS. Paste a YouTube link, put it beside your work, and keep watching as you switch apps.

![Perch playing a YouTube video](docs/images/player.png)

## Why I built it

I wanted the little video window from my phone on my Mac, with familiar keyboard controls and a queue of things to watch. Safari and Chrome already have picture-in-picture. Perch puts this workflow in a separate Mac app, so I can close the browser tab and keep watching.

There are controls for playback, seeking, volume and speed. They appear on hover and stay available when using the keyboard. Option+Space hides the window while the video and audio continue, then brings it back. There is also an optional second player, disabled by default.

## Install on a Mac

Perch is **macOS-specific**. The downloadable build is for **Apple Silicon** (M1 or newer), with macOS 13 or later required by its Electron runtime. It has been tested on an Apple Silicon Mac running macOS 26.6.2. Windows, Linux and Intel Mac builds have not been tested.

1. Download `Perch-mac-arm64.zip` from [Releases](https://github.com/leozh0u/perch/releases).
2. Unzip it and drag `Perch.app` into Applications.
3. Open Perch, paste a video link, and press Play or Return.

The current release is a personal project with an ad-hoc signature, not an Apple Developer ID signature or Apple notarisation. A downloaded copy may be blocked by Gatekeeper. If you choose to run it, use macOS's normal **System Settings > Privacy & Security > Open Anyway** process, or build it from source below. No changes to system security settings are required by Perch itself. Developer ID signing and notarisation remain a distribution improvement.

No Node.js, terminal, browser extension, Perch account or API key is needed for the packaged app. An internet connection is needed for online videos.

## Open and queue videos

Paste a public YouTube video link, a supported HTTPS video URL, or a webpage containing a standard HTML video. Press Play. Drag a link into the link field if you prefer.

To line up more videos, open the queue button or press **Command+O**. Paste several links, one per line. **Add to queue** keeps the current video playing. **Play** starts the first pasted link. Click a queued item to play it; use the small arrows to reorder it or the × button to remove it. Auto-next can advance through the queue when a video finishes. At the end of the queue, playback stops.

![Perch's link input and queue](docs/images/queue.png)

Duplicate links are merged, and a batch with an invalid link is rejected before changing the queue. Up to 100 videos can be queued. YouTube titles load when available; an unavailable title does not prevent playback. The queue, preferences and window position are saved locally. On relaunch, Perch opens its link screen rather than automatically playing audio.

## Move, resize and hide

Drag anywhere on the video or the empty parts of its overlay using a mouse or trackpad. A quick click plays or pauses; holding or moving starts a drag. Buttons, sliders and menus keep their normal actions. Drag a window edge or corner to resize it. The player keeps a 16:9 shape and a minimum size of 320 × 180 points. It starts unpinned. Click the pin button to keep it above other apps. It follows desktop Spaces; enable the pin to keep it above other apps, including fullscreen apps.

**Option+Space** hides or shows all player windows. It keeps video and audio running, including when auto-next changes videos. The close button pauses playback; with two players open, it closes that player and frees the slot. The last player stays available from the menu bar. **Command+Q** quits and stops playback.

If the global shortcut is already used by another app, Perch reports the conflict rather than replacing that app's shortcut. Use Perch's menu bar icon instead. **Reset position** in that menu recovers a window that is difficult to find.

## Keyboard controls

Playback keys apply to the focused player. They do not intercept typing in other apps or in Perch's link field.

| Key | Action |
| --- | --- |
| Space or K | Play / pause |
| Left / Right | Back / forward 5 seconds |
| J / L | Back / forward 10 seconds |
| Up / Down | Increase / decrease volume |
| M | Mute / unmute focused player |
| Option+M | Mute / unmute all players from any app |
| Command+Shift+Right / Left | Next / previous queued video |
| Command+O | Open queue and links |
| Command+, | Settings |
| Option+Space | Hide / show all players, keep playing |
| Command+Shift+P | Show players |
| Command+Q | Quit |

The timeline, speed selector and controls are keyboard accessible. Arrow keys on a focused slider adjust that slider rather than also seeking the video. Unseekable streams disable the timeline and seek buttons.

## Two videos at once

Open **Settings** and select **Allow two players**. It is off by default. Once enabled, pasting a new link and pressing Play while one video is open creates a second independent player. Both may play audio, and each has its own playback controls. Option+Space hides or shows both together. Option+M mutes both if either is unmuted; press it again to unmute both. Muting does not pause playback. Unmuting a player at zero volume restores its last audible volume.

A third player is refused with an explanation. Repeated Play on a link already open reuses its window. Clicking a queued video selects or replaces a player instead of opening more windows. Automatic queue advancement skips a video that is already open in the other player. Turning the setting off closes the other player and keeps the selected one.

## Run from source

Install [Node.js](https://nodejs.org/) **22.12 or newer**, then run on a Mac:

```sh
git clone https://github.com/leozh0u/perch.git
cd perch
npm ci
npm start
```

The first install downloads Electron. If your npm installation asks about dependency install scripts, allow the project dependencies Electron and esbuild; the build needs Electron's binary and esbuild's native executable.

Build a self-contained app for your Mac's architecture:

```sh
npm run package
```

The app appears in `release/Perch-darwin-arm64/Perch.app` on Apple Silicon, or `release/Perch-darwin-x64/Perch.app` on Intel. The Intel path is supported by the packaging script but remains untested. Move the resulting app into Applications. You do not need to keep a terminal or development server running.

```sh
npm run dist
```

This also makes a ZIP in `release/`. Packaging uses the included icon and an ad-hoc local code signature. It does not notarise the app or require Apple account credentials. Changing the app after signing requires packaging again.

## How it works

Electron provides Chromium playback inside a native macOS panel. `setAlwaysOnTop` and `setVisibleOnAllWorkspaces({ visibleOnFullScreen: true })` provide the floating-window behaviour. The app uses the page's existing `HTMLMediaElement` for play/pause, time, volume and speed. It does not download YouTube streams or run a separate decoder.

A sandboxed preload attaches the compact controls in a Shadow DOM and fits the video to the window. It uses DOM constructors so it works with YouTube's Trusted Types policy. The main process owns windows, queue state, shortcuts and local persistence. Each player has its own source and generation identifier, so stale events from a replaced page cannot update a different video.

Remote pages have no Node integration or privileged `window.perch` bridge. That bridge is only present on Perch's bundled local UI. IPC checks its sender, links are validated, and new windows, downloads and permission requests are denied. Perch adds no analytics or backend. Video websites still receive their normal playback traffic; queued YouTube links also use YouTube's oEmbed endpoint for titles.

| File | Responsibility |
| --- | --- |
| `src/main.cjs` | Native panels, two-player limit, queue coordination, shortcuts and IPC |
| `src/preload.js` | Isolated media discovery and commands |
| `src/player-ui.js` | Hover controls and keyboard-accessible player UI |
| `src/shell.js` | Link field, queue and settings |
| `src/core.cjs` | URL validation, queue creation and display-bounds recovery |
| `src/store.cjs` | Local settings and queue persistence |
| `scripts/package.mjs` | Mac app packaging and local signing |

## Verification and limits

```sh
npm test
npm run verify
```

The first command checks URL safety, queue limits, persistence and multi-display bounds calculations. The second drives the actual Electron app with generated video, exercising playback, focused shortcuts, seeking, volume, speed, hover, queue edits, automatic advancement, hidden advancement, window flags, and opt-in dual-player behaviour. It requires [FFmpeg](https://ffmpeg.org/) to create the synthetic test video. Tests use temporary profiles and do not read browser cookies.

`node scripts/verify-youtube.mjs` checks public YouTube playback separately. `node scripts/native-session.mjs`, after packaging and running `npm run verify`, starts a bounded session for manual Mac tests and records window/playback telemetry in `output/playwright/`. These scripts are development checks, not features or background services. See [verification evidence](docs/VERIFICATION.md) for what was observed and what remains untested.

YouTube can change its page structure. Public YouTube playback is the main supported workflow; generic HTML-video pages are best effort. DRM services, private/age-restricted videos, sign-in flows, captions, playlist URLs, full browser-tab mirroring and every streaming site are not promised. Site ads and access restrictions still apply. There is no automatic updater or login item in this version.

## Credits and licence

Perch source is [MIT licensed](LICENSE). The screenshots show *Big Buck Bunny*: (c) copyright 2008, Blender Foundation / [www.bigbuckbunny.org](https://www.bigbuckbunny.org/), [CC BY 3.0](https://peach.blender.org/about/). The film is shown inside the app for demonstration; it is not bundled with Perch. Electron and other dependencies retain their own licences.
