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
- [open] Packaged Mac app launches, actual screenshots, clear README, public repository and attributed commits.

## Status
Research complete enough to implement; reference demo's hosted media fails to load, so it is not playback evidence. DB native panel pattern inspected read-only. Core implementation, dual-player expansion, 9 actual-Electron groups and 6 unit groups complete. Screenshot-led README and native evidence recorded. Installed build is in Applications. Final Option+M verification, updated package and public commit/release remain. No claim of zero bugs or universal streaming-site compatibility.

## Review rounds
Cap: three. Round 1 independent review found that auto-next revealed a hidden player. Fixed with per-player visibility preservation and an actual-Electron regression. User then expanded the stable bar to opt-in dual players and a compact 18-point tray icon; the next review includes those additions.

Round 2 found selected duplicate Play reloaded the page. Fixed with source reuse; actual-Electron tests assert unchanged document and pause state. Round 3 confirmed both fixes and close-during-loading suppression; flagged sustained YouTube playback evidence and publication as pending. The subsequent public YouTube run passed more than 35 seconds after seek. Three-round cap reached; no fourth critic run.

## Latest refinements
New installs start unpinned; users can pin explicitly. Option+M mutes/unmutes all players from any app without pausing; focused M still affects one player. Actual-Electron regression and installed-app shortcut check required before completion. A shortcut-disabled test instance caused a misleading user test; all such processes were closed and Leo confirmed Option+Space works in the installed normal app. No claim that the interim failure never happened.
