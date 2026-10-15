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
