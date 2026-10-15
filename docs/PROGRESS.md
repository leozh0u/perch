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
