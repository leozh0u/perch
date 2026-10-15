# Verification

14 October 2026. Apple Silicon Mac, macOS 26.6.2, Electron 44.7.2.

## Automated checks

`npm test`: 6 passing unit groups for YouTube URL forms/timestamps, unsafe schemes/credentials, atomic batch validation and queue limits, disconnected/negative-coordinate display recovery, local-state corruption recovery and duration formatting.

`npm run verify`: 12 passing actual-Electron workflow groups using a generated 40-second H.264/AAC video in an isolated temporary profile. The fixture enforces Trusted Types with no allowed policy, exercising the same DOM-construction constraint encountered on YouTube.

- Invalid URLs do not change the queue.
- Batch links produce real video playback. Remote pages have no Node `require` or Perch bridge. A hostile fixture cannot open a popup, download a file or navigate to a local file; the settings callback receives no Electron event.
- Space/K, arrows/J/L, pause/play, seek buttons, timeline, mute and speed work. Playback keys keep working after a button click, and holding a toggle key does not repeatedly flip its state. Slider arrows do not also seek the video.
- Queue reorder retains identity while playback continues.
- Hover hides controls; keyboard focus keeps them accessible.
- Native window flags, unpinned default, pin toggle, pointer dragging, sandbox settings and minimum 320 x 180 size are checked through Electron. These checks establish configuration, not physical fullscreen parity.
- Next, genuine ended-event auto-next, hidden auto-next, active-item removal and empty-queue recovery work.
- No-video and failed-network pages retain an actionable error and recover through the queue. Removing the selected media pauses it and restores missing-video recovery; a replacement video resumes, and Retry keeps keyboard focus across status updates. Closing during a delayed page load suppresses later autoplay, including a subsequent site play attempt and late ended event.
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

## 0.1.2 public cleanup

The follow-up adds the chair/play mark, actual player screenshots and a four-step end-user download guide. Source/contributor instructions are separate from the download flow. Command+Shift+P no longer opens Perch; only Option+Space and Option+M are globally registered.

A read-only code pass and a separate security pass found three correctness/usability issues and two low-risk hardening items, all corrected and regression-checked. See [SECURITY_REVIEW.md](SECURITY_REVIEW.md). No fourth round of the earlier three-round design critique was run.

Current source passes 10 actual-Electron workflow groups, 6 unit groups, formatting and a zero-advisory dependency audit. Production fuse readback confirms RunAsNode, NodeOptions and CLI inspector disabled, ASAR integrity validation and ASAR-only loading enabled. A separate inspectable test package launches under Playwright; the production app opens through native macOS controls without that inspector. The new installed app's chair mark and basic link screen were visually checked. The 36-pixel tray image is displayed at 18 points.

The production app passes strict/deep ad-hoc signature verification and is installed at `/Applications/Perch.app`. ZIP SHA-256: `3338e1670c3ce7789ae9f1abe14d4d2d3050372a7764bdcde9a011c0f12948bd`. Earlier physical shortcut/fullscreen observations remain labelled by build above; this pass does not claim a new physical hardware check of every gesture.

Public YouTube was rechecked after branding: more than 35 seconds after seek and zero-volume mute/unmute recovery passed. Two interim runs with native test-only audio silencing failed playback-state assertions; the final check uses normal browser audio and retains failure diagnostics. This is documented as a test-setting limitation, not proof that every background/site configuration works.

The [0.1.2 preview](https://github.com/leozh0u/perch/releases/tag/v0.1.2) is public. GitHub's asset digest matches the local ZIP above. [CI 38680001984](https://github.com/leozh0u/perch/actions/runs/38680001984) passed format/build/unit/audit for source commit `7cd3175`. The public README's logo and download/install guide were visually checked in Chrome; the initial animated demo was subsequently replaced with a still at Leo's request.

Screenshot follow-up: Leo preferred a still image. The current README replaces the animation with an inspected frame of the actual app, showing the chair mark and playback controls, plus a drag/resize caption. The earlier animation evidence describes the previous revision; the current public tree uses screenshots. The app and ZIP are unchanged.

## 0.1.3 ad controls and menu bar

Leo reported an unclickable YouTube ad Skip button. A regression fixture reproduced the drag layer covering the site button before the fix. CSS now yields the video surface and bottom controls to the site's native controls while #movie_player has ad-showing/ad-interrupting; the title bar stays available for dragging. The keyboard handler also yields during ads, so a focused native Skip button receives Space. No automatic clicking, skip countdown changes or ad bypass were added.

The actual-Electron regression checks a disabled skip countdown, trusted pointer click, trusted keyboard activation, no pause/queue change, no auto-next from an ad ending, and restoration of normal Perch controls afterwards. Both YouTube ad markers are covered. This fixture is separate from a later live observation: the installed app exposed YouTube's native Skip button, a CUA click cleared the ad, Perch controls returned and the main video advanced to 0:04 / 1:12:58.

A second regression launches the same app/profile again, confirms the second process exits, the first keeps its single-instance lock and only one window remains. Every profile takes that lock; secondary processes return before setting up UI. Runtime accessory activation and the package's LSUIElement flag remove the Dock icon. The optional two-player setting remains separate from app-instance duplication. Automated tests now keep their windows invisible and omit the tray; bounded manual native sessions remain explicitly visible.

Twelve actual-Electron workflow groups and six unit groups passed. An earlier run was interrupted when its visible test window was closed; the invisible rerun completed. The final package and public-site checks are recorded below.

Queue follow-up: real drag-and-drop reorders rows without changing current video or replacing its document. The same workflow checks cancellation outside the list, rejection of a missing ID, empty link input after an internal drag, external URL import, and no spatial reorder animation under reduced motion. The native explicit move buttons remain. The bounded mechanical UI detector reported advisory token/documentation differences, with no blocking finding; the older machine-readable design snapshot is not refreshed as an unrelated task.

Final 0.1.3 check: the explicitly visible public YouTube session passed more than 35 seconds of playback after seeking and global mute/unmute recovery from zero volume. The refreshed player/queue screenshots come from that session; the README hero is Leo's supplied desktop photo. Earlier invisible and visible attempts intermittently reset or timed out. Instrumentation in the passing run recorded six stream DNS failures, one unchanged main video and no unexpected pause; this does not establish the cause of the earlier failures. No speculative playback-selection change was made. These remain a public-site reliability limitation, rather than a claim that every session succeeds.

The final production package passes strict/deep ad-hoc signature verification; LSUIElement is true, version is 0.1.3, and production fuse readback retains disabled Node execution/environment/inspector and enabled ASAR integrity/ASAR-only loading. Installed at `/Applications/Perch.app`; native accessibility inspection confirmed the installed app opens and plays a YouTube video with the expected controls. No isolated test process remains. ZIP SHA-256: `20df0fb85e0593e55f2d0a9a09c999e3b14fe474d42c4340daa713f1b4c2b568`.

The [0.1.3 preview](https://github.com/leozh0u/perch/releases/tag/v0.1.3) is public. GitHub reports a 127,296,222-byte ZIP whose SHA-256 matches the final artifact above. [CI 38683022508](https://github.com/leozh0u/perch/actions/runs/38683022508) passed format, build, six unit groups and dependency audit for runtime source commit `8fb1bbb`. The public README hero, queue guidance and download/install instructions were checked in Chrome.

## 0.1.4 captions

15 October 2026: CC in the top controls and focused C toggle captions using YouTube's own subtitle control or standard HTML caption/subtitle tracks. Native track selection is retained across off/on; metadata tracks remain untouched. Disabled/unavailable/ad states and repeated keys are covered by the actual-Electron regression. YouTube's narrow layout hides native right-hand buttons with a responsive CSS rule even when captions work; availability checks the button's explicit state instead of mistaking that layout rule for missing tracks.

Native installed-app observation: existing YouTube subtitles were visible, C turned them off and removed their text, and C restored them. After revealing controls, the CC button toggled off too. Playback stayed paused at 0:17 through those toggles. Sanitised results are in [captions-native.json](evidence/captions-native.json). This is separate from fresh isolated public-site attempts: one returned YouTube's “Something went wrong” page; another toggled the source button but did not deliver caption text. No caption extraction, downloading or site-access bypass was added. Availability still depends on the source session.

The controls are inspected at 480 × 270 and 320 × 180. YouTube's caption pane moves above the bottom playback controls while they are shown, then returns to the source position when they fade. The bounded mechanical design check reported existing token/documentation advisories, with no blocking finding. The older machine-readable design snapshot was left unchanged.

Final captions build: 13 actual-Electron workflow groups, 6 unit groups, formatting and dependency audit pass. The caption-pane clearance assertion passes, and a second native visual check confirms real subtitles remain above the visible timeline/control row. The final 0.1.4 app is installed and passes strict/deep signature verification. ZIP SHA-256: `c53dd55103756bd4c96107683704723a06e78d79e298b27f849ce8b0d1e8ccd3`. The production runtime's source/ASAR integrity and inspector protections are retained.

References: [YouTube's C shortcut](https://support.google.com/youtube/answer/7631406?hl=en), [HTML textTracks](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/textTracks), and [TextTrack modes](https://developer.mozilla.org/en-US/docs/Web/API/TextTrack/mode). The YouTube DOM integration is checked against observed site behaviour rather than treated as a stable public API.

The [0.1.4 preview](https://github.com/leozh0u/perch/releases/tag/v0.1.4) is public. GitHub reports a 127,297,948-byte ZIP whose digest matches the final SHA-256 above. [CI 38687814041](https://github.com/leozh0u/perch/actions/runs/38687814041) passed for runtime source `8c1ce55`.

## 0.1.5 fullscreen recovery and chapters

15 October 2026: 14 actual-Electron workflows and 6 unit groups pass, along with formatting and dependency audit (zero known advisories). The new chapter fixture covers late source data, timestamp selection, preserved pause/rate, duplicate/invalid/unrelated entries, malformed URLs, plain-text hostile titles, ad suppression and 320/480-point layouts. Production background throttling is unchanged; invisible/silent fixtures explicitly disable it to avoid background timer budgets during error-recovery assertions.

Perch now tracks requested native show/hide independently of page occlusion, raises on explicit reveal without taking focus, and preserves the existing accessory process type when applying all-Spaces behaviour. Pinning uses the established screen-saver level. New installs remain unpinned. Leo confirmed Option+Space reveal/hide over fullscreen Chrome/ChatGPT with audio continuing while Notch Apple remained running. The final chapter build keeps this verified window code unchanged. No Notch Apple shortcut conflict was found; its Command+Shift+H/I bindings, media-key-only tap and notch-sized window were inspected without changing its concurrent work.

The public YouTube page supplied all 13 chapters for NeetCode's Dynamic Programming 1D video. Selecting Climbing Stairs assigned 1:05 while keeping playback paused. A separate confirmation timed out waiting for a decoded frame after that seek, so this is not evidence of successful post-seek streaming; the earlier intermittent public-site streaming limitation remains. Chapter parsing uses the page's existing DOM, not an extra API. Automatic/creator chapters appear only when the source exposes them. Screenshots at both supported widths were inspected once; the README keeps Leo's selected desktop photo.

A focused Ponytail/security review and independent static diff review found no blocking findings. Visibility IPC retains owning-main-frame checks; chapter titles remain plain text and links are never followed. No new dependency, OS permission or service was introduced. See [sanitised evidence](evidence/0.1.5.json) and [workflow results](evidence/workflows.json). No new blanket security or streaming guarantee is claimed.

Final ZIP SHA-256: `f6965618022521bd8f58ba9fd8243df24ad7bd61b9511d70665911fbec6e9a06`. Strict/deep signature verification passes, packaged runtime/preload matches source, and production fuse protections remain enabled. The normal app is installed at `/Applications/Perch.app`.

The [0.1.5 preview](https://github.com/leozh0u/perch/releases/tag/v0.1.5) is published. GitHub’s asset digest matches the final ZIP above. [CI 38695296539](https://github.com/leozh0u/perch/actions/runs/38695296539) passed for source `b3d9bfd8cfddb64b72b3a4485c29559e25550b25`.

## 0.1.6 video offset recovery

15 October 2026: Leo reported a video shifted/cropped inside the native window. The affected installed session showed YouTube's internal mini-player controls and homepage route. A synthetic regression failed on 0.1.5 with x=272 rather than x=0 after transformed/contained ancestors and an offset .html5-video-container were introduced. Source effects can establish a new containing block for fixed-position descendants; see [MDN's containing-block rules](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Display/Containing_block).

The stylesheet now neutralises those effects only on the selected video's ancestor chain and anchors YouTube's inner video container to the player. The source video stays in its original DOM; no video replacement, reload, playback command or navigation is part of the layout correction. The regression checks full-window geometry through source style changes, a 320-point resize and return to a generic page. Fifteen Electron workflows and six unit groups pass, including ad Skip, captions and chapters; formatting passes.

Native installed 0.1.6 confirmation: reopened the same queued video near the saved position and observed it fill the window. Pressing I entered YouTube's internal mini-player/homepage route; the video continued to fill Perch instead of shifting. Pressing I again returned to the normal watch page. The video was left paused and unmuted near its saved position. No private queue URL, title or screenshot is published. A separate isolated public button-driven mini-player check timed out and is not counted as a pass. Sanitised results: [layout-0.1.6.json](evidence/layout-0.1.6.json).

Release and installed ASAR runtime/preload match source; strict/deep signature and production fuse checks pass. ZIP SHA-256: `3050ecde0e575a59457de65cf500374ddeb35529676a8f8208909fdc2f4e18a7`. Existing platform, distribution and public streaming limits still apply.

The [0.1.6 preview](https://github.com/leozh0u/perch/releases/tag/v0.1.6) is public; GitHub’s ZIP digest matches the recorded checksum. [CI 38794312466](https://github.com/leozh0u/perch/actions/runs/38794312466) passed for source `55d513eda0ef6db9923c43d897fa4648df39318a`.
