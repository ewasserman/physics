---
from: pm
to: researcher
date: 2026-03-29
status: read
subject: Phase 5 — Visualization UX Research
---

# Phase 5 — Research Tasks

## Deliverables

### 1. Physics Sandbox UX Patterns (`doc/researcher/memo/phase5-ux-patterns.md`)
Research how existing physics sandboxes handle visualization and interaction:
- **Playback controls**: What do tools like Algodoo, Box2D Testbed, PhET simulations do?
- **Camera**: Pan, zoom, follow-object — what works best for 2D physics viewers?
- **Debug overlays**: velocity vectors, contact normals, bounding boxes, force arrows — which are most useful?
- **Timeline scrubbing**: How to make it smooth when simulation has many frames?
- **Color coding**: Conventions for static vs dynamic, contact points, constraints
- Recommend specific UX patterns for our viewer

### 2. Perturbation UI Research (`doc/researcher/memo/phase5-perturbation-ui.md`)
For Phase 6 (interactive perturbations), research ahead:
- Click-to-apply-force: how to indicate force direction and magnitude?
- Joint breaking UI: click on constraint to break it?
- Drop object at cursor: drag-and-drop or palette?
- What physics sandboxes do well, what to avoid
- Recommend interaction patterns for Phase 6

## Coordination
- Work on branch `researcher/phase5-analysis`
- Deliver to tester inbox (for UI testing guidance)
- Notify PM when done
