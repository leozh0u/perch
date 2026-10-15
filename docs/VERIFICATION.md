# Verification

14 October 2026. Apple Silicon Mac, macOS 26.6.2, Electron 44.7.2.

## Automated checks

`npm test`: 6 passing unit groups for YouTube URL forms/timestamps, unsafe schemes/credentials, atomic batch validation and queue limits, disconnected/negative-coordinate display recovery, local-state corruption recovery and duration formatting.

`npm run verify`: 9 passing actual-Electron workflow groups using a generated 40-second H.264/AAC video in an isolated temporary profile. The fixture enforces Trusted Types with no allowed policy, exercising the same DOM-construction constraint encountered on YouTube.

- Invalid URLs do not change the queue.
- Batch links produce real video playback. Remote pages have no Node `require` or Perch bridge.
- Space/K, arrows/J/L, pause/play, seek buttons, timeline, mute and speed work. Playback keys keep working after a button click, and holding a toggle key does not repeatedly flip its state. Slider arrows do not also seek the video.
- Queue reorder retains identity while playback continues.
- Hover hides controls; keyboard focus keeps them accessible.
- Native window flags, unpinned default, pin toggle, pointer dragging, sandbox settings and minimum 320 x 180 size are checked through Electron. These checks establish configuration, not physical fullscreen parity.
- Next, genuine ended-event auto-next, hidden auto-next, active-item removal and empty-queue recovery work.
- No-video and failed-network pages retain an actionable error and recover through the queue. Closing during a delayed page load suppresses later autoplay, including a subsequent site play attempt and late ended event.
- Single-player default, Settings opt-in, maximum two, atomic third-player rejection, duplicate reuse, independent pause, global mute/unmute without changing pause, and disabling dual mode are checked. Selected duplicate Play preserves the document and pause state. Zero-volume global unmute restores audible volume in both players.

Generated screenshots and machine results are kept in ignored `output/playwright/`; selected public screenshots are copied to `docs/images/`. Tests use synthetic profiles and do not import browser cookies.

## Public YouTube

Public Big Buck Bunny played through YouTube with video dimensions, advancing currentTime, pause and 10-second seek observed. The current-source recheck confirmed more than 35 seconds of continued playback after seeking, plus global mute/unmute recovery from zero volume without pausing. Sanitised evidence is in [youtube.json](evidence/youtube.json). YouTube login, age restrictions, live streams, ads, DRM providers and every possible page layout are not certified.

## Native Mac checks

The packaged .app launches and its actual control UI was inspected through the Mac accessibility interface. Tray sizing was corrected to an 18 x 18 template image after Leo supplied an oversized-icon screenshot.

Native pointer input moved the packaged player from (1008, 626) to (808, 527), preserving its 480 × 270 size. Corner resizing changed it to 400 × 225. Release stopped dragging. In 0.1.1, dragging from the middle of the video moved the native window from (936, 105) to (816, 65) without pausing; a quick tap paused it. Telemetry also recorded hidden playback continuing without pausing. See [native evidence](evidence/native.json).

Leo confirmed Option+Space and fullscreen behaviour directly on this Mac. A later failure report occurred after switching to a shortcut-disabled test process; all test processes were then closed, the normal app was installed in Applications, and Leo confirmed the shortcut works from fullscreen YouTube there. This confirmation applies to that installed build, not every app or macOS version. Leo also confirmed Option+M mutes and unmutes correctly from another app in the installed 0.1.1 patch. This is direct user confirmation, separate from the automated media-state checks. No unlock or security setting was automated.

Bounds recovery for multiple displays is unit-tested. Actual display unplug/replug, system wake, long-duration battery usage, Intel Macs and older supported macOS releases have not been tested.

## Independent review

Three rounds completed, using a read-only critic. Round 1 found automatic next could reveal a hidden player; fixed and regression-tested. Round 2 found selected duplicate Play reloaded the source; fixed and regression-tested. Round 3 confirmed these fixes and close-during-load suppression, and flagged sustained YouTube playback evidence and publication as pending. The final YouTube run subsequently passed after the test waited for pause before resuming. The later unpinned-default and Option+M additions are covered by the actual-Electron tests and installed-app shortcut registration/conflict reporting. Human Option+M verification failed on 0.1.0; 0.1.1 passes zero-volume recovery checks on fixtures and YouTube, and Leo subsequently confirmed physical Option+M mute/unmute from another app on 14 October; they did not receive a fourth critic round.

## Build and dependencies

The Apple Silicon app is packaged with ASAR and an ad-hoc local signature. Runtime minimum in the bundle is macOS 13. Developer ID signing/notarisation remain undone. `npm audit` reports zero known vulnerabilities in the current dependency lockfile. No updater or startup service is installed.

## Published build

The public [v0.1.0 preview](https://github.com/leozh0u/perch/releases/tag/v0.1.0) contains the Apple Silicon ZIP. Its GitHub-reported SHA-256 matches the local artifact: `a9353fc79e3efbd2da048ef1b2a14329440d04811dbebcc2d4af0fab9833dff3`. The same packaged app is installed in Applications and launches without a development server. GitHub Actions run [38675833984](https://github.com/leozh0u/perch/actions/runs/38675833984) passed install, build, unit tests and dependency audit.

The 0.1.1 patch adds video-wide tap/hold dragging, keeps focused playback keys working after control clicks, restores nonzero volume on unmute, and suppresses late site play/ended events after close. The installed bundle passes codesign verification. ZIP SHA-256: `a677a4f65aa892410c6feebbddde25e0d0fe0041c56a51577545800a2d402df0`. Native center dragging and quick-tap pause passed; Leo confirmed physical Option+M mute/unmute from another app in the patched installed build on 14 October, resolving the earlier open check.

The [0.1.1 preview ZIP](https://github.com/leozh0u/perch/releases/tag/v0.1.1) is uploaded and its GitHub-reported digest matches the local artifact. The 0.1.0 release is labelled superseded.

Patch source CI passed: [38677195931](https://github.com/leozh0u/perch/actions/runs/38677195931) (macOS install, build, unit tests and dependency audit).
