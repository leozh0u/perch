# Security and code review

Reviewed 14 October 2026. Baseline: `eb296cde291239a250e87060464278ec5cc0eb5e`. Fixes are included in 0.1.2.

This was a scoped source/package review with separate read-only security and code reviewers, followed by regression checks. No critical, high or medium vulnerability was established in the reviewed paths. Two low-risk hardening findings were corrected. That result and a clean dependency audit do not establish that the app is free of vulnerabilities.

## System and trust boundaries

One local Mac user pastes HTTPS video URLs into a bundled local shell. The main process owns windows, queue/settings and OS shortcuts; remote websites execute inside sandboxed Chromium renderers. The privileged bridge is exposed only at the exact bundled shell URL, and main-process IPC also checks the registered window and main frame. Perch has no backend, accounts, analytics or automatic updater. Website traffic and optional YouTube title requests still leave the Mac.

## Security findings

### SEC-01: local settings callback forwarded an Electron event (low, fixed)

The baseline passed the renderer callback directly to `ipcRenderer.on`. This exposed an unnecessary Electron event argument to trusted local UI. No remote-page exploit was established. [src/preload.js:18](../src/preload.js#L18) now wraps the callback and returns an unsubscribe function; the actual-Electron check asserts that the callback receives zero arguments. This follows [Electron's IPC guidance](https://www.electronjs.org/docs/latest/api/ipc-renderer#ipcrendereronchannel-listener).

### SEC-02: production retained unused Electron execution/debug features (low, fixed)

The baseline package retained RunAsNode, NodeOptions and inspector features. A malicious remote page was not shown to reach them, but the app does not need these entry points in distribution. [scripts/package.mjs:40](../scripts/package.mjs#L40) now disables them before signing, enables embedded ASAR validation and limits app loading to ASAR. Packager embeds the matching integrity metadata. Readback of the packaged binary and strict/deep codesign verification confirm those settings.

An explicitly separate test package under ignored `output/test-app/` retains the inspector for Playwright. The packaging script refuses to ZIP it. The production app was also opened through native Mac controls, independently of the inspectable test package. See [Electron's fuse documentation](https://www.electronjs.org/docs/latest/tutorial/fuses).

## Correctness and usability fixes

| Finding | Evidence and fix | Regression |
| --- | --- | --- |
| A syntactically valid `null` state file crashed startup | Reproduced in a temporary profile. [src/store.cjs:13](../src/store.cjs#L13) accepts only a non-null record as the state root. | Null, primitive, array and malformed JSON roots recover safely. |
| A removed video could remain selected and keep controls bound to detached media | Source trace confirmed a retained detached element; the app now pauses it, removes listeners and restarts missing-video recovery. | Remove the active video, observe an actionable error, insert a replacement and recover playback. |
| Error actions lost keyboard focus on each status update | The badge rebuilt its buttons every second. It now rebuilds only when its message/action state changes. | Focus stays on the same recovery action across periodic updates. |

The cleanup kept the existing window/session model rather than adding layers. CSS moved from long JavaScript strings into ordinary stylesheet source, still bundled as text for the sandboxed preload. Source formatting is checked in CI. The extra global Command+Shift+P shortcut was removed; Option+Space and Option+M remain global.

## Coverage

| Surface | Coverage |
| --- | --- |
| Renderer isolation and IPC | Source review; actual sandbox/context-isolation/Node flags and absence of the remote privileged bridge checked; settings event wrapper checked. |
| URL handling, navigation and external opening | Parser unit tests and source trace; hostile fixture attempts at popups, downloads and local-file navigation denied. External opening uses a stored, validated HTTPS source. |
| Permissions | Request/check handlers deny permissions by source inspection. OS camera, microphone and location prompts were not triggered. |
| DOM content and CSP | Local CSP inspected. Titles use textContent; remote controls use DOM constructors under Trusted Types. Local icon HTML is constant source. |
| Queue, two-player state and recovery | Ten actual-Electron workflow groups and six unit groups pass, including duplicate reuse, capacity checks, hidden auto-next, corruption and dynamic media recovery. |
| Dependencies | Locked direct versions and integrity hashes; `npm audit` reports zero known advisories. This does not audit dependency internals or provenance. |
| Production package | ASAR/fuse readback, ad-hoc signature verification and native launch checked. Inspectable test package separately launches under Playwright. |
| Public distribution | Direct ZIP guide, checksum and first-open limitation documented. Private vulnerability reporting enabled on GitHub. |

## Remaining limits

- The app is ad-hoc signed, not Apple Developer ID signed or notarised. A fresh downloaded copy may be blocked by Gatekeeper. No Developer ID certificate was available on this Mac; the documented first-open flow is a user decision.
- Video sites remain untrusted content. Browser/runtime vulnerabilities and future website changes remain possible. Keep the Electron runtime and app updated; this version has no updater.
- Sign-in is outside the supported workflow. The persistent media partition retains Electron's default cookie-store fuse; encrypted credential storage is not promised. Enabling cookie encryption needs stable-signing/Keychain testing, as it is a one-way migration, so it was not changed during this cleanup.
- IPC payloads have bounded/typed fields in several paths, but not a complete schema layer. Remote content has no general IPC bridge; no independent exploit from the remaining partial validation was established.
- No dedicated subframe-IPC exploit test, binary penetration test, Chromium exploit research or independent supply-chain audit was performed. Intel Macs, other macOS releases, DRM/login flows and long-term battery use were not verified.

Sources used: [Electron security guidance](https://www.electronjs.org/docs/latest/tutorial/security), [Electron fuses](https://www.electronjs.org/docs/latest/tutorial/fuses), [Apple app-opening guidance](https://support.apple.com/en-us/102445), current repository source, packaged fuse readback and recorded test outputs. Native results from earlier builds remain labelled by build in [VERIFICATION.md](VERIFICATION.md).

## 0.1.5 focused review — 15 October 2026

Ponytail and security-best-practices guidance were applied to the fullscreen/chapter diff; an independent static diff review found no blocking findings. Visibility IPC accepts only visible/hidden from the owning player’s main frame and exposes no remote bridge. Chapters are read from the loaded page, bounded to 600 candidate elements/200 entries, filtered to the current video, deduplicated and checked against duration. Titles use textContent; links are never followed. Malformed URLs and unrelated/invalid chapters are rejected. Chapter selection uses the existing clamped seek action, preserving pause/rate. No new dependency, OS permission, backend or network API was added.

The Electron fixture covers hostile chapter text, malformed links, duplicates, late availability, ad states and selector separation. This is a focused review of changed code, not a fresh penetration test or dependency-source audit. Earlier distribution/runtime limits still apply.
