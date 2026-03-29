---
from: researcher
to: tester
date: 2026-03-29
status: read
subject: Phase 5 — UI Testing Guidance
---

# UI Testing Guidance for Phase 5 Viewer

Based on UX research in `doc/researcher/memo/phase5-ux-patterns.md` and `doc/researcher/memo/phase5-perturbation-ui.md`, here are the key areas to test.

## Playback Controls

### Functional tests
- Play/pause toggles correctly (spacebar and button)
- Step forward advances exactly one frame
- Step backward goes back exactly one frame
- Speed changes (0.25x, 0.5x, 1x, 2x, 4x) affect playback rate correctly
- Rewind-to-start jumps to frame 0
- Frame counter and timestamp update accurately during playback
- Playback stops at last frame (does not overflow)

### Edge cases
- Rapid play/pause toggling
- Step forward at last frame (should do nothing or stay at last frame)
- Step backward at frame 0 (should do nothing)
- Speed change during playback (should take effect immediately)

## Camera Controls

### Functional tests
- Right-click drag pans the viewport
- Scroll wheel zooms in/out
- Zoom targets cursor position (not center of screen)
- Auto-fit (`F` key) shows all bodies with margin
- Zoom clamps at min/max limits

### Edge cases
- Pan while playing (should work smoothly)
- Zoom to extreme levels (very close, very far)
- Auto-fit with single body vs many spread-out bodies
- Pan/zoom during scrubbing

## Debug Overlays

### Functional tests
- Each overlay toggle (`V`, `C`, `B`, `J`) activates/deactivates correctly
- Velocity arrows point in correct direction and scale with speed
- Contact points appear at actual collision locations
- AABB outlines match body bounding boxes
- Joint lines connect correct anchor points

### Visual verification
- Overlays render on top of bodies (correct z-order)
- Overlays update per frame during playback
- No visual artifacts when toggling overlays on/off
- Arrow scaling is consistent across zoom levels

## Timeline Scrubbing

### Functional tests
- Dragging scrub bar playhead updates the displayed frame
- Scrub bar snaps to integer frame indices
- Releasing scrub bar at a position shows that exact frame
- Frame counter matches scrub bar position

### Performance tests
- Rapid scrubbing (fast mouse movement across bar) remains responsive
- No dropped frames or rendering lag during scrub
- Memory does not grow during extended scrubbing sessions

## Color Coding and Visual Conventions

### Verification
- Dynamic bodies are blue/colored
- Static bodies are dark gray
- Sleeping bodies (if implemented) are desaturated
- Selected body has yellow outline
- Constraint lines are visible and correctly positioned

## Stats Display

### Functional tests
- FPS counter shows reasonable value (~60)
- Body count matches actual number of bodies
- Energy values (KE, PE) match frame data
- Stats update each rendered frame
- Toggle stats panel with `I` key

## Phase 6 Perturbation UI (preview testing areas)

When perturbation features are implemented, test:

1. **Apply Force**: Arrow appears on drag, direction and magnitude correct, impulse applies on release
2. **Break Joint**: Hover highlights correct joint, click breaks it, undo restores it
3. **Drop Object**: Object appears at click position with correct shape and default properties
4. **Inspector**: Shows correct properties for clicked body, updates during playback
5. **Undo**: Ctrl+Z reverses last perturbation, Ctrl+Y re-applies

### Interaction conflicts to watch for
- Force tool should not trigger pan (both use mouse drag)
- Clicking empty space in force mode should not apply force
- Break tool should not activate when hovering over bodies (only joints)
- Place tool should pause simulation automatically
