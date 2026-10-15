# Perch

Read PRODUCT.md, DESIGN.md, docs/PROGRESS.md and docs/VERIFICATION.md before changing behaviour. Preserve the intentionally basic paste UI and conventional YouTube controls.

This is a macOS Electron app. Default to one unpinned player. Option+M globally toggles all players muted together without pausing. Two simultaneous players require the explicit Settings opt-in; cap at two and reuse an existing source. Option+Space changes visibility only, including during automatic advancement. Each player owns its commands and source generation. Close stops that player's playback. Never enable Node or expose the local UI bridge to remote pages.

Run `npm test`, `npm run build` and affected actual-Electron checks in `npm run verify`. Run public YouTube separately when changing page/media integration. Use isolated temporary profiles and synthetic local video for native window checks. Keep raw test artifacts in ignored output/playwright. A configured topmost/all-Spaces flag is not proof of live fullscreen behaviour. Record actual observations and untested surfaces.

Package with `npm run dist`. The app is locally signed, not Developer ID signed or notarised. Do not represent a preview as universally compatible or bug-free. Update screenshots, README and evidence when behaviour changes; retain third-party film attribution. Do not add a server, analytics, auto-updater, startup task or broad OS permissions as a side effect.

Production packages disable Node execution/environment and inspector fuses and validate/load only ASAR. Use `npm run package:test` for the inspectable native-test bundle in ignored output/test-app; never distribute it or weaken production fuses for Playwright. Keep only Option+Space and Option+M globally registered. Run format:check before publishing.

Preserve native YouTube ad controls: yield the video surface/bottom controls and keyboard input during ad-showing/ad-interrupting; never auto-skip or alter the site's countdown. Perch is menu-bar-only with one instance per profile. Automated test windows must stay invisible and omit their tray; only explicit native sessions may show test UI. Quit normal Perch before `node scripts/verify-youtube.mjs --visible`, then restore the installed app afterwards so there is only one user-visible instance.

Captions use the source subtitle toggle or standard caption/subtitle text tracks. Preserve metadata tracks, playback state and selected track when toggling. Test late availability, unavailable/ad states and focused C without repeats; public integration check: `node scripts/verify-captions.mjs --visible` with normal Perch quit.
