# Perch build ledger

Updated 14 October 2026 (America/Chicago).

## Objective and confirmed decisions
Build a polished standalone Electron video player on this Mac, following Leo across applications and Spaces. Create public leozh0u/perch and provide a screenshot-led README. Leo approved the name and core scope. Later additions: queued links and next/previous; conventional YouTube shortcuts; simple YouTube-like UI. Trackpad/mouse dragging and Option+Space global hide/show (keep playing); close pauses/hides. Paste UI must be very basic: plain input, Play, queue, no slogan/intro copy. Later: two simultaneous videos only after explicitly enabling Settings; default stays one. Option+Space hides/shows both without pausing. Fix oversized tray icon from Leo's screenshot to a native 18-point template icon. Suggestions steer this task and do not replace it.

## Plan
1. Research reference behavior and Mac window mechanics. Save observations separately from documentation claims.
2. Build one sandboxed Chromium player in a native Mac panel. Use HTMLMediaElement playback, not a separate decoder or downloaded YouTube streams.
3. Add a local queue companion, persistent position/size/queue, hover controls, drag/resize, shortcuts and recovery.
4. Exercise actual Electron playback and native window settings with synthetic local media, then public YouTube. Inspect actual app screenshots and Mac application switching/fullscreen.
5. Independent read-only review against the acceptance matrix. At most three improvement rounds. Fix material failures and rerun affected checks.
6. Package a self-contained .app, verify it, document screenshots and limits, commit/push as Leo and verify the public repository.

## Acceptance matrix
- [done] Paste a public YouTube link and play actual video; link drop is implemented. Public playback, pause/seek and continued playback after seek verified.
- [done] Independent Electron playback; no Chrome tab/extension dependency. Active-desktop foreground switching remains part of the native observation below.
- [done] Drag, resize, preserve useful bounds, recover offscreen geometry. Native pointer input and telemetry recorded; monitor recovery calculations tested.
- [done] Optional pin and all-Spaces/fullscreen configuration; native movement/resize observed. Leo confirmed installed-app Option+Space, continued audio and fullscreen YouTube behaviour. New installs now start unpinned by request.
- [done] Hover/focus controls; pause, seek, timeline, volume, mute, speed; keyboard alternatives.
- [done] Multiple queued links, previous/next, automatic next at end, remove and reorder safely.
- [done] Invalid URL, missing video/network error, no-video page, unavailable media, repeated actions and recovery.
- [done] Remote pages sandboxed; no Node or privileged bridge; narrow IPC and navigation policy.
- [done] Packaged app installed and running in Applications; actual screenshots and Mac guide published. Public source and v0.1.0 Apple Silicon preview uploaded as leozh0u, Leo Zhou <zhouleo2007@gmail.com>.

## Status
Research complete enough to implement; reference demo's hosted media fails to load, so it is not playback evidence. DB native panel pattern inspected read-only. Core implementation, dual-player expansion, 9 actual-Electron groups and 6 unit groups complete. Screenshot-led README and native evidence recorded. Installed build is in Applications. Final tests passed, updated app installed, public source/release published, and GitHub Actions passed. Leo confirmed physical Option+M mute/unmute from another app in the installed 0.1.1 build. No claim of zero bugs or universal streaming-site compatibility.

## Review rounds
Cap: three. Round 1 independent review found that auto-next revealed a hidden player. Fixed with per-player visibility preservation and an actual-Electron regression. User then expanded the stable bar to opt-in dual players and a compact 18-point tray icon; the next review includes those additions.

Round 2 found selected duplicate Play reloaded the page. Fixed with source reuse; actual-Electron tests assert unchanged document and pause state. Round 3 confirmed both fixes and close-during-loading suppression; flagged sustained YouTube playback evidence and publication as pending. The subsequent public YouTube run passed more than 35 seconds after seek. Three-round cap reached; no fourth critic run.

## Latest refinements
New installs start unpinned; users can pin explicitly. Option+M mutes/unmutes all players from any app without pausing; focused M still affects one player. Actual-Electron regression passes for both players, preserving play/pause state. The updated installed app reports no shortcut conflict; Leo confirmed physical Option+M mute/unmute from another app on 14 October. A shortcut-disabled test instance caused a misleading user test; all such processes were closed and Leo confirmed Option+Space works in the installed normal app. No claim that the interim failure never happened.

## Delivery evidence
Public repository: https://github.com/leozh0u/perch. Preview: https://github.com/leozh0u/perch/releases/tag/v0.1.0. The uploaded 127,436,723-byte ZIP digest matches the local SHA-256: `a9353fc79e3efbd2da048ef1b2a14329440d04811dbebcc2d4af0fab9833dff3`. The installed app passes strict/deep codesign verification with its ad-hoc signature. Source checks: 6 unit groups, 9 actual-Electron groups, sustained public YouTube after seek, zero npm audit findings. GitHub Actions run 38675833984 passed install/build/unit/audit on macOS. All temporary test processes exited; one normal installed app remains. Three independent review rounds used; later refinements were self-reviewed with regression checks. No LinkedIn post was published.

## 0.1.1 follow-up
Leo reported Option+M does not work although Option+Space works. Installed source includes its handler, no conflict is reported, and the saved player volume was zero. Fix mute/unmute to treat zero volume as silent and restore last audible volume; do not claim the physical shortcut is fixed until rechecked. Leo also requested hold/drag from any non-control overlay/video region, with quick taps toggling playback. Both changes are implemented. Nine actual-Electron groups and six unit groups pass, including tap/hold gestures, zero-volume recovery in two players, keys after clicking controls, and late site playback/ended events after close. Current YouTube playback and zero-volume recovery passed. Native center dragging and tap-to-pause passed in the installed app. Leo subsequently confirmed physical Option+M mutes and unmutes correctly from another app in the patched installed build; the brief message remains useful feedback. The final bundle is installed and no test process remains. This is follow-up work within the original task; three independent critique rounds remain the recorded cap.

Patch artifact: Perch 0.1.1, Apple Silicon, ad-hoc signed. ZIP SHA-256 `a677a4f65aa892410c6feebbddde25e0d0fe0041c56a51577545800a2d402df0`. The previously open physical Option+M check passed through Leo’s direct confirmation on 14 October 2026 after the earlier failure report.

The [0.1.1 preview](https://github.com/leozh0u/perch/releases/tag/v0.1.1) is published. GitHub reports the same ZIP digest as the installed local artifact. No temporary Electron test process remains; one normal /Applications/Perch.app process is open. The physical Option+M check is complete; no requested acceptance item remains open.

Patch source CI passed: [38677195931](https://github.com/leozh0u/perch/actions/runs/38677195931) (macOS install, build, unit tests and dependency audit).

## Completion
14 October 2026: Leo answered “It mutes and unmutes correctly” to the installed-app Option+M check from another app. The original scope and subsequent additions are delivered in the installed app, public source and 0.1.1 preview. Remaining distribution/platform limitations are documented in VERIFICATION.md; they are not claims of universal compatibility. Three independent review rounds were used, with later refinements covered by regression and native checks.

## Public release cleanup pass
14 October 2026: Leo requested a clean public repository, Ponytail simplification, a security audit, an easy download/install guide and an image/video demo for sharing the free app. No LinkedIn posting or resume edit is authorised by this request. One read-only code pass and one read-only security pass completed on eb296cd; root owns fixes, docs, demo and verification. Open: fix null-state startup, detached-media recovery and error-button focus; strip Electron event from local settings callback; harden production fuses with an explicit inspectable test package; format source; capture and inspect a public demo; simplify README installation; add concise contributor/security guidance and metadata; verify source/package/release and commit/push as Leo. Existing installed 0.1.1 remains confirmed while this pass runs.

Additional cleanup: Leo asked why Command+Shift+P keeps opening Perch. It was an extra global show shortcut added during the initial build; remove that binding and its documentation so other apps can use their command palettes. Keep only Option+Space and Option+M as global Perch bindings.

Latest addition: Leo requested a YouTube-like play button perched on a chair. Implemented as original SVG geometry plus native AppKit icon generation, with matching monochrome UI and 18-point tray variants. Refresh public media and the final package before marking complete.

0.1.2 status: all code/security findings above corrected; 10 actual-Electron groups, 6 unit groups, formatting and dependency audit pass. The new chair/play artwork is implemented in vector/native/UI assets and installed. Production fuse readback and strict/deep signature verification pass. Current YouTube normal-audio sustained playback and global zero-volume recovery pass; two interim native-silenced test runs failed, so that setting is removed from the public-site check and failures retain diagnostics. Current public screenshots include the new mark and valid Big Buck Bunny/Sintel queue links. Remaining delivery work: inspect the refreshed animation, commit/push, publish/check the 0.1.2 asset and CI, then update the canonical project record.

Refreshed 88-frame, 11-second GIF completed and its beginning, pause and unmute frames were inspected. Native icon PNG dimensions are checked (1024 app, 36 tray); ICNS generation succeeds. README has a 96px logo, 640px animated player and 400px queue image, with separate end-user and contributor flows. Link/asset validation and a scoped secret-pattern scan passed. Publishing 0.1.2 is the remaining delivery step.

## 0.1.2 delivery complete

14 October 2026: source commit `7cd317511fab9b3688b22d49d1a536a1624c42aa` is pushed as verified GitHub user leozh0u, Leo Zhou <zhouleo2007@gmail.com>. [CI 38680001984](https://github.com/leozh0u/perch/actions/runs/38680001984) passed. The [0.1.2 preview](https://github.com/leozh0u/perch/releases/tag/v0.1.2) is published; GitHub's digest for the 127,293,299-byte Apple Silicon ZIP matches local `3338e1670c3ce7789ae9f1abe14d4d2d3050372a7764bdcde9a011c0f12948bd`. The production app with chair/play artwork is installed in Applications and opens normally. Only the normal installed Perch remains; temporary app test processes exited.

The actual public GitHub README was opened and visually checked: compact chair logo, animated app demo, direct 0.1.2 download, four-step install guide, smaller queue screenshot, source/contributor and security links. Private vulnerability reporting is enabled. The original request and all available additions were audited against the delivered app, docs and evidence; no actionable requested item is left open. No LinkedIn post or resume edit was made. Remaining platform/distribution limits are explicit in VERIFICATION.md and SECURITY_REVIEW.md, including no Developer ID/notarisation, Intel testing or universal streaming-site guarantee.

## Screenshot follow-up

14 October 2026: Leo rejected the looping GIF and asked for a clear screenshot or a view of dragging. Replace the README animation with an actual player still showing the controls and a short move/resize caption; no filming is needed. The queue screenshot stays. The GIF, recording-only script and its metadata are removed from the current public tree; an ignored local copy remains. This supersedes the animation choice in the earlier delivery entries, with no runtime or package change.

## 0.1.3 Skip, single-instance and queue follow-up

14 October 2026: Leo's screenshot shows YouTube's native ad Skip button blocked by Perch's transparent drag surface. Reproduced with a synthetic native-button fixture before changing the code. Restore native bottom controls and real pointer/keyboard input while YouTube reports ad-showing/ad-interrupting; keep Perch's title bar available for moving the window. Do not auto-skip ads or ignore the site's countdown. Normal video-wide drag/hover controls return when the ad ends. Leo also requested menu-bar-only activation and one running app. The second visible app was the isolated test process; automated fixture/public-site windows now use zero opacity, and synthetic audio stays silenced. Every profile now takes a single-instance lock, including tests, with an early exit before creating any duplicate UI. Package LSUIElement and runtime accessory policy hide the Dock icon. Open: finish regression/public-site checks, install/inspect the normal package, publish 0.1.3, update guide and canonical record.

Regression status: 12 actual-Electron groups and 6 unit groups pass; the synthetic ad Skip test failed on the old layer and passes after the fix. The menu-bar-only bundle has LSUIElement true, strict/deep signature verification passes and production fuse readback is unchanged. A private local backup of the existing queue/settings was taken before stopping the old normal process for replacement. The new 0.1.3 bundle is copied into Applications. Automated test tray creation is now gated off, in addition to invisible windows. The first invisible YouTube run failed during a background-media transition; the checker now keeps Page Visibility active and uses the main video selector while keeping the native window invisible. The new run is pending.

Added scope: Leo requested Spotify-esque queue dragging and click/movement animation. Queue UI work is delegated to queue_motion with ownership limited to shell.js/shell.css (and HTML if needed); root owns atomic reorder IPC, actual-Electron tests, docs and final packaging. Preserve the basic interface, explicit move buttons and reduced motion. The ad/menu-bar/single-instance work remains active and will ship together in 0.1.3.

Leo supplied his own desktop screenshot and selected it as a good product photo. Copied it unchanged into docs/images/desktop.png and made it the README hero, showing Perch above VS Code with the actual small floating window. The existing Big Buck Bunny close-up remains in the controls guide. No screenshot content is treated as an instruction.

Actual installed 0.1.3 native observation: opened a queued YouTube video, its live ad exposed a native Skip button, clicked it through CUA, the ad cleared, ordinary Perch controls returned, and content playback advanced to 0:04 / 1:12:58. This is live ad evidence, separate from the synthetic regression. No private queue or desktop contents were copied into this evidence; only Leo's explicitly supplied product photo is public.

Final validation: queue dragging and cancellation, retained player document, external link drops, reduced motion, native ad controls and single-instance/Dock behaviour pass in 12 actual-Electron workflow groups; all 6 unit groups, formatting and dependency audit pass. The final visible YouTube check passes sustained seek playback and zero-volume mute/unmute. Earlier visible/invisible attempts reset or timed out; passing-run diagnostics record stream DNS failures but do not prove their cause. Keep this limitation explicit. No speculative runtime change was made for those failures. Public screenshots were refreshed from the passing session and inspected; Leo's photo remains the hero.

The final 0.1.3 production package is installed, signature/fuses/LSUIElement verified, and native inspection shows actual YouTube playback. Only the normal app remains; test processes exited. Leo was actively using the app during native inspection, so no further interaction with his queue was attempted. Remaining delivery: commit/push, publish/check final ZIP, read back CI and update the canonical project record.

Motivation correction: Leo explained that Perch began because he was practising on Zetamac and listening to a video, but wanted to watch it in his peripheral vision too. README now uses this account, with concise semiformal wording.

## 0.1.3 delivery complete

14 October 2026: source commit `8fb1bbb57a4eb904ae59596cf46fd4645852c12b` is pushed as leozh0u with Leo's verified author identity. [CI 38683022508](https://github.com/leozh0u/perch/actions/runs/38683022508) passed. The [0.1.3 preview](https://github.com/leozh0u/perch/releases/tag/v0.1.3) contains the final 127,296,222-byte ZIP; GitHub's digest matches local `20df0fb85e0593e55f2d0a9a09c999e3b14fe474d42c4340daa713f1b4c2b568`. ASAR extraction confirms packaged runtime files/preload match current source. Final app is installed and playing; there is one normal parent process and no test process.

Final request audit covered the original scope and all available additions: Mac standalone player, basic paste UI, familiar focused keys/global hide/mute, video-wide tap/hold dragging, opt-in dual players, compact tray/chair logo, screenshot/install guide/public repository, ad Skip, menu-bar-only/single-instance behaviour, queue drag/press motion, and Leo's Zetamac motivation. All requested implementation and publication work is complete. Earlier per-build confirmations remain labelled; no universal bug-free/streaming guarantee is claimed. Outstanding distribution/platform limits: Developer ID/notarisation, Intel/older macOS coverage, and intermittent public YouTube failures of unestablished cause. No LinkedIn post or resume edit was made.

## 0.1.4 captions

15 October 2026: Leo requested captions when available. Add a top-row CC toggle with an on/off indicator and focused C shortcut, using YouTube's existing subtitle button and standard HTML caption/subtitle text tracks. Unavailable/ad states disable the control; toggle must preserve playback, selected language and non-caption tracks. Keep the compact UI, isolate players and preserve the earlier ad/single-instance fixes. Open: actual-Electron regression, live YouTube check, package/install and public release/docs.

Caption implementation and native check pass: existing YouTube captions toggled off/on with C and the CC button, with paused playback/time unchanged. A live source inspection found native right-side buttons hidden by YouTube's narrow responsive layout; use explicit button state rather than computed display. Added a regression for that distinction. Fresh isolated public-site runs have not certified subtitle delivery: one showed a site error, another changed the native toggle but delivered no cues. Keep this distinct from the passing installed-session check. A visual check also found captions overlapping hover controls; the source caption pane now reserves 52 points while Perch controls are visible. Final offset regression, visual confirmation, package and publication remain open.

Final offset regression and confirmation complete: all 13 actual-Electron groups, 6 unit groups, formatting and audit pass. The corrected caption pane clears the visible controls in the native app; the final bundle is installed and signature-verified. Only normal Perch remains. Public-site attempts remain labelled separately from the passing installed-session/native check. Remaining delivery: push source, publish/check 0.1.4 asset and CI, update canonical context.

## 0.1.4 delivery complete

15 October 2026: runtime source `8c1ce55700ca6b5e5dc2e0c2654467513d2c5c11` is pushed as leozh0u with Leo Zhou <zhouleo2007@gmail.com> attribution. [CI 38687814041](https://github.com/leozh0u/perch/actions/runs/38687814041) passed. The [0.1.4 preview](https://github.com/leozh0u/perch/releases/tag/v0.1.4) is public; its 127,297,948-byte ZIP has GitHub digest `c53dd55103756bd4c96107683704723a06e78d79e298b27f849ce8b0d1e8ccd3`, matching the local artifact. The installed app's runtime/preload matches final source; signature and production fuses pass. Only one normal Perch process remains, with the saved queue intact and video paused after the check.

Request audit complete: available captions option, focused C, correct on/off state, unchanged playback, standard text-track fallback, caption clearance and existing ad/drag controls are implemented and checked. README/help/contributor steps are updated, source and downloadable app are published, and the canonical context record is updated. The earlier broader task remains delivered. Caption delivery in fresh isolated YouTube sessions is still limited as recorded above; no translation/language picker or universal streaming-site promise was added.

## 0.1.5 fullscreen recovery (open)

15 October 2026: Leo reports Perch no longer appears above fullscreen Chrome/ChatGPT and Option+Space does not reveal it. Urgent bug work takes priority; the semiformal fun LinkedIn draft for Perch, From Scratch and BlunderNet remains pending. Current installed process is 0.1.4, saved pin is off, and no duplicate/test process was found. Current reveal only calls showInactive without raising the window; toggle treats an occluded-but-visible window as something to hide. Repeated all-Spaces calls also use the default process-type transformation despite the app already being accessory/UIElement.

Candidate fix: preserve accessory process type during workspace calls, use the established DB screen-saver level when pinned, explicitly raise on reveal without changing pin/focus, and use renderer visibility when deciding whether an occluded player needs revealing. Need regression, actual fullscreen/global-shortcut verification and final package/publication before closing. Shortcut registration must be checked in the native session rather than assumed from source.

Fullscreen follow-up: Leo confirmed Option+Space reveals/hides in fullscreen while Notch Apple remains running, first in the synthetic native session and then in the final installed 0.1.5 app with audio continuing. Only one normal Perch remains. Notch Apple's source and stored shortcuts use Command+Shift+H/I, its media tap excludes ordinary key events, and its high-level panel occupies only the notch area. No demonstrated conflict; its concurrent Spotify/calendar work was preserved. Show/hide intent is now tracked from native window events rather than relying on macOS native visibility, with page occlusion reported separately, including the paste screen. All 13 Electron workflows, 6 unit groups, format and audit pass. The first invisible run timed out on a removed-video recovery timer; disabling background throttling only in invisible/silent fixtures made the full check pass. Production throttling remains unchanged.

Added scope: Leo requested video chapter timestamps if straightforward, followed by a final repository/README update and bounded code/security review without excessive token use. The live YouTube page already contains the complete named chapter list in its DOM. Implement a compact source-backed chapter picker and timeline separators; no replay heatmap, backend, scraping service or private player API. Chapters and final packaging/release remain open; fullscreen delivery stays part of this release. The earlier LinkedIn draft remains pending.


Chapter implementation and review complete: 14 Electron workflows, 6 unit groups, format and audit pass. Live YouTube DOM provides all 13 chapters; selection assigns 1:05 and preserves pause. A second public check could not certify decoded playback after seeking, so no new streaming guarantee is made. Native selector and timeline separators were visually checked at 480/320 points; captions reserve the extra row's height. Independent static review found no blocking findings. Final 0.1.5 chapter build is installed, source/ASAR/signature/fuses match, and only the normal app remains. README now explains chapters and reveal/pinning, retains Leo's desktop hero, and links the 0.1.5 download. Remaining: push, publish/check asset and CI, canonical context, then the pending concise LinkedIn draft.


## 0.1.5 delivery complete

15 October 2026: runtime source `b3d9bfd8cfddb64b72b3a4485c29559e25550b25` is pushed as leozh0u, Leo Zhou <zhouleo2007@gmail.com>. [CI 38695296539](https://github.com/leozh0u/perch/actions/runs/38695296539) passed. The [0.1.5 preview](https://github.com/leozh0u/perch/releases/tag/v0.1.5) is public; its 127,299,855-byte ZIP has GitHub digest `f6965618022521bd8f58ba9fd8243df24ad7bd61b9511d70665911fbec6e9a06`, matching the local artifact. The final chapter build is installed; only normal Perch and Notch Apple remain, with no test parent. Test browser tab was already removed by session cleanup. The private canonical project record is updated.

Final request audit: fullscreen/Option+Space regression fixed and physically confirmed with continued audio alongside Notch Apple; no demonstrated Notch conflict or Notch edits. Optional source chapters, timestamp picker and separators are implemented and tested; replay heatmap is excluded as stated. Repository, README guide/photo, verification/security notes and downloadable build are updated. Independent focused code/security review is complete. The concise semiformal LinkedIn draft for Perch, From Scratch and BlunderNet is prepared for the chat reply; no post is published and no resume file is edited. Existing public YouTube streaming, notarisation and platform-coverage limits remain explicit.


## 0.1.6 source-layout offset (open)

15 October 2026: Leo supplied a screenshot of the video displaced inside an otherwise intact Perch window. Native inspection found YouTube's internal mini-player controls (Close/Expand) on the homepage, with the source paused at 6:24. A regression using transformed/contained source ancestors and an offset video container failed on 0.1.5 with video x=272 instead of zero. This is a content-layout issue, separate from native window position.

Fix: remove fixed-position containing-block effects only along the selected video's ancestor chain, and anchor YouTube's video container to its player. Keep the original video/player DOM and playback state. The regression now passes through shifted ancestors, source style changes, resizing and return to generic layout; ad/caption/chapter controls also pass. Fifteen Electron workflows, six unit groups and formatting pass. A fresh source-page load had normal initial geometry, so the exact original transition was not captured; a separate public mini-player transition check is pending. Install, source/ASAR checks and public release/docs remain open. No new feature, dependency or permission is added.


0.1.6 native recovery confirmed: the final app is installed. The original queued video resumed near the saved 6:24 position and was left paused/unmuted around 6:27. Native I toggled into YouTube's internal mini-player/homepage route with the video still filling the window, then back to the watch page. This is a direct installed-app check, separate from the isolated public button-transition attempt that timed out. ASAR/source, signature and fuse verification pass. No private source/title/screenshot is published. Remaining: push, public release/digest/CI and dated canonical record.


## 0.1.6 delivery complete

15 October 2026: runtime source `55d513eda0ef6db9923c43d897fa4648df39318a` is pushed as leozh0u with Leo Zhou <zhouleo2007@gmail.com> attribution. The [0.1.6 preview](https://github.com/leozh0u/perch/releases/tag/v0.1.6) is published. GitHub's 127,300,163-byte ZIP digest matches `3050ecde0e575a59457de65cf500374ddeb35529676a8f8208909fdc2f4e18a7`. README download links point to this version. The fixed app is installed, the original queue is intact, native nested mini-player entry/exit was checked, and only one normal Perch remains. The private canonical record is updated. Fifteen local Electron workflows, six unit groups and formatting pass; [Source CI 38794312466](https://github.com/leozh0u/perch/actions/runs/38794312466) passed.

The available request is fulfilled: recover the offset video and prevent the reproduced source-layout failure. No unrelated code or app settings were changed. Exact original spontaneous triggering interaction was not captured; native entry/exit and layout regressions provide the recorded coverage. Existing streaming, signing and platform limits remain unchanged.


## 0.1.7 reveal/shortcut recovery (open)

15 October 2026: Leo reports audio playing with no visible player and Option+Space failing, and asks for a durable fix. The running 0.1.6 process was single-instance with on-screen saved bounds and pin off. The exact failing process's internal shortcut registration could not be inspected through the hardened production build. Do not claim its precise OS trigger is proven.

A new regression showed the old explicit reveal does not focus the player after it is hidden. Replace inactive showing with show/focus semantics for explicit reveal and first launch, preserve unpinned state, and restore macOS app-level hiding before reveal. Separately, the existing lifecycle only registered keys at startup; wake/unlock now refresh owned Option+Space/M registrations and report conflicts. No periodic polling or new global shortcuts. Automated shortcut fixtures omit the tray even when exercising registrations.

Leo then explicitly requested playback stop. Normal Perch was terminated and its parent process was verified gone. All tests remain silent/invisible. Do not restart his video or queue item. Install the patch and leave normal Perch closed. New tests cover hidden-app reveal/focus without pause, lost shortcut registrations before wake/unlock, and keeping hidden players hidden during lifecycle recovery. Final test/package/release verification pending.


0.1.7 implementation/tests complete: isolated native-panel checks exposed missed show/hide events, so the fix now records show/hide intent directly in the commands as well as focusing explicit reveal. A focused player also overrides lagging page visibility. Six successive recovered toggles alternate correctly. Seventeen Electron workflows, six unit groups and formatting pass. Wake/unlock recovery is checked with deliberately removed registrations and simulated Electron power-monitor events. Final package is installed and source/ASAR/signature/fuses match. A silent home launch focused its field; physical shortcut input was interrupted by concurrent user input and is not counted as a pass. The app was quit again; no saved video was restarted. Remaining: push/release/digest/CI and canonical context. Do not claim the original production flags or physical sleep/fullscreen trigger were captured.
