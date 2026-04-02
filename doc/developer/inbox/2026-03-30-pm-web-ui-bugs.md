---
from: pm
to: developer
date: 2026-03-30
subject: Web UI bugs — user feedback, 7 issues
status: new
priority: high
---

# Web UI Bug Report — User Feedback

We received user feedback identifying 7 issues with the web visualization UI. I've triaged them below with root cause analysis and suggested fixes. Please address all of these on a feature branch.

---

## Bug 1: Scrubber does nothing (live mode)

**Symptom:** The timeline scrubber slider has no effect.

**Root cause:** In `app.ts:149`, `controls.onSeek` is assigned a no-op in live mode. The scrubber is visible and interactive but does nothing.

**Fix:** Either disable/gray out the scrubber in live mode (since seeking isn't meaningful for a live sim), or implement seeking through the recorded buffer (since `LiveSimulation` records automatically).

**Recommendation:** Disable it in live mode — simplest and most honest UX.

---

## Bug 2: Speed dropdown (0.25x–4x) does nothing (live mode)

**Symptom:** Changing the speed dropdown has no effect on the simulation.

**Root cause:** In `app.ts:145-147`, `controls.onSpeedChange` is a no-op in live mode. The speed multiplier only works in playback mode (`app.ts:187`).

**Fix:** In live mode, apply the speed multiplier to the simulation timestep. In `LiveSimulation.loop()`, multiply the accumulated time or dt by the speed factor. Store the speed on the LiveSimulation instance and expose a `setSpeed()` method.

---

## Bug 3: Select / Force / Break / Drop tool buttons do nothing

**Symptom:** Clicking tool buttons highlights them visually but has no effect on simulation interaction.

**Root cause:** The `InteractionManager` class (`src/viz/interaction.ts`) is fully implemented but **never instantiated** in `app.ts`. The `controls.onToolChange` callback fires (ui.ts:203-208) but no handler is assigned in `app.ts`.

**Fix:** In `setLive()`:
1. Create an `InteractionManager(live, renderer)`.
2. Wire `controls.onToolChange` to call `interactionManager.setTool(tool)`.
3. Attach canvas mouse event listeners that delegate to `interactionManager.onMouseDown/Move/Up`.
4. Wire `controls.onDropTypeChange` to set `interactionManager.dropObjectType`.

---

## Bug 4: Box/Circle dropdown does nothing

**Symptom:** Changing the drop object type selector has no effect.

**Root cause:** Same as Bug 3 — `onDropTypeChange` is never assigned a handler in `app.ts`.

**Fix:** Part of the Bug 3 fix. Wire `controls.onDropTypeChange` to `interactionManager.dropObjectType = type`.

---

## Bug 5: Debug checkbox does nothing

**Symptom:** Toggling the debug checkbox has no visible effect.

**Root cause:** The checkbox IS wired to `renderer.setShowContacts()` (`app.ts:64-71`). However, in live mode the `captureSnapshot()` call in `LiveSimulation.loop()` may not include contact data, or the renderer's `renderFrame()` path may not be rendering contacts. Check:
- Does `captureSnapshot()` include the contacts array?
- Does `CanvasRenderer.renderFrame()` call `renderContact()` when `showContacts` is true?

**Fix:** Verify the full pipeline: snapshot must include contacts, renderer must check `showContacts` flag and render them. If contact data isn't in snapshots, add it.

---

## Bug 6: Play/Stop buttons don't update when switching demos

**Symptom:** Clicking "Bouncing", "Car Crash", or "Rain" restarts the simulation, but the Play button still shows its previous state (e.g., "Play" while sim is running).

**Root cause:** `setLive()` calls `live.start()` and `startUI()` (app.ts:154-155), but never resets the `isPlaying` state variable inside `createControls()`. That state is a private closure variable (`ui.ts:131`) with no external setter.

**Fix:** Add a `setPlaying(playing: boolean)` method to `UIControls` that updates `isPlaying` and the button text. Call it from `setLive()` after auto-starting.

---

## Bug 7: Canvas oscillates horizontally

**Symptom:** The canvas area rapidly jitters left-right by ~10-20 pixels during simulation. Appears correlated with the Frame counter text changing width.

**Root cause:** The `#app` container has no fixed width — it sizes to its content. The canvas is 800px fixed, but the controls bar uses `flex-wrap: wrap`. As the frame counter text grows (e.g., "Frame 999 / 999" → "Frame 1000 / 1000"), the controls bar width can exceed the canvas width, widening the `#app` container. Since the body centers `#app` with flexbox, the whole block shifts horizontally. On the next frame the width may shrink again, causing oscillation.

**Fix:** Set a fixed width on the controls container to match the canvas width, or set `width: <canvas-width>px` on the `#app` container. The simplest fix: in `createControls()` or in `app.ts`, set `controls.container.style.width = canvas.width + 'px'` and add `overflow: hidden`. Alternatively, give `#app` a fixed width matching the canvas in the CSS.

---

## Priority Order

I'd suggest tackling them in this order:
1. **Bug 7** (oscillation) — most disorienting, easy fix
2. **Bug 6** (Play/Stop state) — confusing UX, easy fix
3. **Bug 3+4** (interaction tools) — biggest feature gap, code exists but needs wiring
4. **Bug 2** (speed in live mode) — useful feature
5. **Bug 1** (scrubber) — disable in live mode
6. **Bug 5** (debug) — investigate pipeline

Please create a branch `developer/web-ui-fixes` for this work. Let me know if you have questions on any of these.
