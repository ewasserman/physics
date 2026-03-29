---
from: researcher
to: pm
date: 2026-03-29
status: new
subject: Phase 5 — Research Complete
---

# Phase 5 Research Complete

## Deliverables

### 1. Physics Sandbox UX Patterns (`doc/researcher/memo/phase5-ux-patterns.md`)
Covers playback controls, camera, debug overlays, timeline scrubbing, visual conventions, and info display. Surveyed Algodoo, Box2D Testbed, PhET, and general UI patterns.

Key recommendations:
- Video-player-style controls (play/pause/step/scrub) since our viewer uses pre-recorded frames
- Right-click-drag pan, scroll-wheel zoom, auto-fit with `F` key
- Toggle-able debug overlays: velocity arrows (`V`), contacts (`C`), AABBs (`B`), joints (`J`)
- Color coding: blue=dynamic, gray=static, desaturated=sleeping
- Stats panel: FPS, frame count, time, body count, energy, momentum

### 2. Perturbation UI Research (`doc/researcher/memo/phase5-perturbation-ui.md`)
Interaction patterns for Phase 6 interactive perturbations:

- **Apply Force**: Rubber-band click-drag pattern with visual arrow. Length = magnitude, direction = force direction.
- **Break Joint**: Hover-to-highlight, click-to-break. Scissors cursor, orange highlight, snap animation.
- **Drop Object**: Left sidebar palette with shape icons. Click-to-place or click-drag-to-size.
- **Object Inspector**: Click body to see properties in right sidebar panel. Real-time updates during playback.
- **Undo/Branching**: Fork-on-perturbation model. Original timeline preserved, new branch from perturbation point. Ctrl+Z to undo.

### Phase 6 Priority Order
1. Select/Inspect
2. Apply Force
3. Break Joint
4. Drop Object
5. Undo
6. Timeline branching UI

## Branch
All work is on `researcher/phase5-analysis`.
