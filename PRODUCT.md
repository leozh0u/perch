# Perch

<!-- impeccable:product-schema 1 -->

## Platform
web

Desktop Electron app for macOS, using native panels and Chromium video playback.

## Stack
Electron, plain JavaScript, HTML and CSS. Leo selected an Electron desktop app on 14 October 2026. No backend or account required by Perch.

## Users and purpose
Leo wants to watch videos beside his work in any Mac application. Open a link, move or resize the player, and keep watching when switching applications or desktop Spaces.

## Capabilities and constraints
One floating player by default, two only after enabling Settings > Allow two players; hover and keyboard controls; play/pause, 5-second arrow seeks, 10-second J/L seeks, timeline, mute, volume, speed, multiple queued links, previous/next, queue editing, return to the browser. Use existing browser media primitives. Source sites still control access, ads, login, DRM and video availability. Perch must not bypass those restrictions.

## Brand commitments
Name: Perch. Simple, familiar YouTube-like player controls. The video leads; avoid a dashboard or decorative UI. Name is not globally unique.

## Delivery
Public repository leozh0u/perch, under ~/Projects/Technical Projects/perch. A runnable Mac application, README with actual screenshots, setup, rationale, architecture, controls and honest tested limitations. Suitable to share as a personal project; no LinkedIn publication requested.

14 October refinement: new installs start unpinned; the pin remains optional. Option+M globally mutes all open players if any is unmuted, or unmutes all when all are muted, without pausing. Focused M keeps controlling one player.

Follow-up: a quick tap on the video plays/pauses; hold or drag any non-control video/overlay region to move the window. Buttons/sliders retain their actions. Global mute must treat zero volume as silent and restore the last audible volume on unmute.

14 October branding: use a play button perched on a chair. Keep the menu bar icon at 18 points; use the matching mark in the app, README and download.

14 October queue/menu refinement: run in the menu bar without a Dock entry; reopening reuses the existing app. Drag queue rows with an insertion marker and brief reorder/press feedback, while keeping explicit move buttons and reduced-motion support. Yield native YouTube ad controls while ads play. Use Leo's supplied desktop screenshot as the README hero.

14 October motivation, supplied by Leo: he was practising on Zetamac while listening to a video and wanted to watch it in his peripheral vision too. Use this explanation in the README; keep public explanations concise, humanised and semiformal.

15 October captions: Leo requested captions when available. Add a compact CC toggle and focused C shortcut; use the source’s native captions or HTML caption/subtitle tracks, with an unavailable state.

15 October chapters: use YouTube’s existing chapter list for a compact timestamp/title picker and timeline separators. Show it only when available; seeking preserves pause and playback speed. No replay heatmap or chapter generation.
