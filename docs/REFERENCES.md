# Reference behavior and evidence

Research date: 14 October 2026. Independent implementation; no reference app assets or code copied.

| Reference | Entry/action | Result | Evidence type | Confidence / gap |
| --- | --- | --- | --- | --- |
| [Safari PiP](https://support.apple.com/en-au/guide/safari/ibrw27291639/mac) | Play video, enter PiP | Floating window, resize, corner movement, follow desktop Spaces, restore/close, 10-second seek | Apple documentation | Documented; not live-tested in this task |
| [Chrome Document PiP](https://developer.chrome.com/docs/web-platform/document-picture-in-picture) | Request window after user gesture | Custom HTML controls, topmost, source-tab lifetime, manual position | Official API documentation | Documented; unsuitable as a standalone app lifecycle |
| [Official Chrome demo](https://chrome.dev/document-picture-in-picture-api/) | Open demo on this Mac | Player reports media could not be loaded | Direct browser observation | High; no successful reference playback to compare |
| DB Electron project, current local source | Inspect BrowserWindow configuration | Native panel, topmost/all-Spaces flags, showInactive, tray shortcuts | Read-only source inspection | Configuration only; no fresh DB window test |
| [Electron window API](https://www.electronjs.org/docs/latest/api/browser-window) | Configure native panel | Supports all workspaces and visibility above fullscreen | Official API documentation | Actual Perch behavior requires Mac observation |
| [Floating](https://apps.apple.com/us/app/floating-picture-in-picture/id1508833245?mt=12) | Store listing | Existing floating web/video app | Developer listing | Product claims, not direct observation |

## Requested differences
Perch runs independently of Chrome. It has an editable queue and conventional YouTube keyboard controls. Closing the player pauses and hides it; the tray can reopen it. Quit ends playback. The queue and window bounds persist locally.

## Behavior specification
Actor: one local Mac user. Inputs: public HTTPS video/page URLs, queue commands, pointer and keyboard controls. States: home, loading, playable/paused/playing, ended, no-video/error, hidden and quitting. Invariants: one player by default, at most two after explicit opt-in; no accidental duplicate sources or audio when replacing a video; preserve queue identities during reorder/removal; do not apply stale media state to a new source; never grant remote pages Node or a privileged shell bridge. On error keep queue available and offer retry or another item. Nonseekable/live media must not show a misleading timeline. Close pauses; Option+Space changes visibility without pausing. Option+M mutes/unmutes all players without changing playback. Automatic next runs only after a genuine ended event and preserves hidden visibility. New installs start unpinned.

## Skill discovery
Installed workflows selected: reverse-engineer-app, until-good, finish-the-task, Impeccable for interface checks, leo-voice and humanizer for public prose. Searched skills.sh for Chrome-extension, SwiftUI and Electron workflows. Browser-extension candidates became irrelevant after Leo selected Electron. Electron automation candidates require another agent-browser installation; existing computer-control and Electron/Playwright testing cover that need. Read the original electron-dev SKILL.md and MIT licence in jamditis/claude-skills-journalism at commit e3e2172f760b8f13c7d827092c03bdb58e40b263; its Electron isolation guidance matches the official docs, while its PTY/WebRTC/React scope is unnecessary here. No bundled executable was run, and no third-party skill was installed. API decisions use current official Electron documentation rather than generic skill claims.
