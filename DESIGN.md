---
name: Perch
description: Basic Mac video utility with familiar playback controls.
colors:
  primary: "#ff4b4b"
  primary-hover: "#ff7272"
  canvas: "#181818"
  video-fallback: "#121212"
  field: "#242424"
  text: "#f5f5f5"
  muted: "#b8b8b8"
  button-text: "#141414"
  field-border: "#555"
  current-item: "#2c2525"
  error-text: "#ffabab"
typography:
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "13px"
    fontWeight: 400
  label:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "12px"
    fontWeight: 400
  wordmark:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "13px"
    fontWeight: 650
  time:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "11px"
    fontWeight: 400
rounded:
  shell-control: "5px"
  player-control: "6px"
  row: "7px"
  field: "10px"
spacing:
  control-gap: "3px"
  compact: "7px"
  control-inset: "12px"
  shell-inset: "13px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.button-text}"
    rounded: "{rounded.row}"
    padding: "8px 14px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-shell-icon:
    textColor: "{colors.text}"
    rounded: "{rounded.shell-control}"
    padding: "5px"
    width: "28px"
    height: "28px"
  link-field:
    backgroundColor: "{colors.field}"
    textColor: "{colors.text}"
    rounded: "{rounded.field}"
    padding: "8px 9px 8px 11px"
  queue-row-current:
    backgroundColor: "{colors.current-item}"
    textColor: "{colors.text}"
    rounded: "{rounded.row}"
    padding: "7px 6px"
---

# Design System: Perch

## Overview

**Creative North Star: "Familiar YouTube-like controls"**

Perch uses a compact dark interface for pasting links, starting playback and managing a queue. The confirmed direction is basic: a paste field, Play and familiar video controls. The video occupies the player; controls appear over its edges.

This record captures the current implementation in `src/shell.css` and `src/player-ui.js`. It preserves system typography, flat surfaces and the existing red accent. No additional visual identity is implied by the name.

**Key Characteristics:**

- Compact system text and labelled icon controls.
- Dark shell and video overlays with one red accent.
- A separate queue window with explicit playback and reorder actions.
- Controls that fade after inactivity and return with pointer movement or keyboard focus.

## Colors

The palette uses dark neutral surfaces, light text and a red playback accent. The frontmatter records the implemented values.

### Primary

- **Playback red:** Play, the timeline, range controls, active pin and current-item play icon.
- **Hover red:** The Play button's hover state.

### Neutral

- **Shell charcoal:** Home and queue backgrounds.
- **Video near-black:** Player fallback while no video is present.
- **Field charcoal:** The paste field and queue-count badge.
- **Primary light text:** Main labels and controls.
- **Muted grey:** Source labels, hints and supporting controls.
- **Dark button text:** Play's text against red.
- **Field grey:** Paste-field border and scrollbar thumb.
- **Current-item charcoal:** The queue row for the current video.
- **Error pink:** A shell message flagged as an error.

## Typography

**Body Font:** macOS system font, followed by BlinkMacSystemFont, Segoe UI and sans-serif fallbacks. There are no remote font dependencies.

### Hierarchy

- **Body:** The base interface uses the body token; queue headings use the same size at weight 600.
- **Wordmark:** The shell uses the wordmark token; the player title is smaller (12px, weight 600).
- **Label:** Queue titles, sources, hints, text actions and playback speed use the label size. Queue titles use weight 500.
- **Time:** Playback time uses the time token with tabular numerals; it reduces to 10px in the narrow player.
- **Count:** The small queue-count badge uses 10px text and a 13px line height.

## Layout

A quick video tap plays/pauses. Holding for 180ms or moving at least 5 points starts a drag from any non-control part of the video/overlay; controls keep their own interactions. New installs start unpinned.

The player defaults to 480 × 270px and keeps a 16:9 aspect ratio, with a minimum size of 320 × 180px. The queue is a separate 400 × 520px window with a minimum size of 360 × 360px. These are window dimensions, not web page breakpoints.

The home shell places the multiline paste field and Play in one horizontal row, with a short hint and Add to queue beneath. Its main padding is 8px vertically and 20px horizontally. The queue view uses a vertical list with 3px gaps and rows at least 48px high. Titles and source labels truncate on one line; row actions remain alongside them.

The player's top overlay is 54px high, with title, pin, browser, queue and hide controls. Bottom controls use a full-width timeline above a single control row. The default player button is 32 × 32px. Its volume slider expands from zero width to 52px on hover or focus within.

At a maximum shell width of 370px, shell padding and queue text widths reduce. At a maximum player width of 390px, row gaps disappear, bottom padding narrows to 8px, buttons become 29px wide, time text reduces and the expanded volume slider becomes 35px wide.

## Elevation & Depth

There are no CSS box shadows. The queue uses background changes for hover and current state. Over video, a black-to-transparent top gradient and transparent-to-black bottom gradient preserve control readability. The title has a small black text shadow (0 1px 3px). Loading and error badges use translucent dark backgrounds. macOS supplies the native window frame and shadow.

## Shapes

Controls and rows have modest rounded corners, using the frontmatter radius tokens. The paste field has the largest radius and a thin grey border; focus within changes that border to muted grey. The timeline uses a 3px track and a round 10px thumb. Icons use a 24px viewbox with rounded caps and joins; the shared player icons use 1.8px strokes, while shell control icons use 1.7px strokes. The Perch mark uses a heavier stroke.

## Components

### Buttons

Play is a solid red button with dark, weight-650 text. It changes to the hover-red token on hover. Shell icon buttons are transparent with a translucent white hover background; player buttons use a stronger translucent hover background. Disabled shell buttons reduce to 35% opacity and disabled player buttons to 30%. Keyboard focus uses a white 2px outline, offset by 3px in the shell and 2px in the player.

### Inputs / Fields

The multiline paste field shares its container with Play. It has a transparent textarea, red caret, muted placeholder and an 18px line height. The textarea can resize vertically between 34px and 90px. Focus changes the enclosing border; it does not add a separate textarea outline. Dropping links highlights the container with a red 2px outline, offset by 4px.

### Queue rows

Each row groups its index or active play icon, title, source and explicit move/remove controls. Hover adds a faint white background; the current row uses the current-item token. The row's play action stays visually separate from its smaller edit controls.

### Player controls

Playback actions follow the familiar order: previous, play/pause, back 10 seconds, forward 10 seconds, next, time, volume and speed. The timeline shows red progress over a translucent track. Controls become unavailable when the required video or seek range is missing. Speed choices run from 0.5× to 2×.

The top and bottom overlays fade with `opacity .18s ease-out` after 2.3 seconds of inactivity. Pointer movement and focus restore them; visible keyboard focus keeps them accessible. Volume expansion uses 150ms width and opacity transitions. Notices fade over 150ms and remain visible for 1.2 seconds. Reduced-motion preferences disable transitions.

### Status and recovery

Loading or error text appears in a centred translucent badge. Errors expose Retry, Queue and Open in browser. Shell status text uses the muted colour, changing to error pink when flagged. Short playback notices appear below the top controls.

## Do's and Don'ts

### Do:

- **Do** preserve the basic paste field, Play and queue flow.
- **Do** use system text, familiar video icons and visible keyboard focus.
- **Do** keep gradients behind video controls where they improve readability.
- **Do** honour reduced-motion preferences and restore controls on focus.

### Don't:

- **Don't** introduce a dashboard or decorative UI around the player.
- **Don't** add remote fonts, decorative artwork or decorative gradients.
- **Don't** replace explicit queue actions with undiscoverable gestures.
