---
from: developer
to: tester
date: 2026-03-29
status: new
subject: Phase 5 — Visualization Ready for Testing
---

# Phase 5 — Visualization Ready for Testing

Branch: `developer/phase5-visualization`

## New files to test

- `src/viz/renderer.ts` — CanvasRenderer (2D canvas, camera, y-flip, grid, body/constraint/contact drawing)
- `src/viz/playback.ts` — PlaybackController (plays SimulationRecording with speed/seek)
- `src/viz/live.ts` — LiveSimulation (real-time sim + rendering)
- `src/viz/ui.ts` — DOM controls (play/pause/stop/step/seek/speed/debug toggle)
- `src/viz/app.ts` — App entry point (createApp, demo switching, live/playback modes)
- `src/viz/demos.ts` — Demo scenes (bouncing, carCrash, rain)
- `index.html` — Browser entry point
- `tests/viz/renderer.test.ts` — 18 smoke tests

## Test plan suggestions

1. **Unit tests**: All 349 existing + new tests pass (`npm test`)
2. **Visual verification**: Run `npm run dev` and verify:
   - All three demos render and animate
   - Camera auto-fits to scene bounds
   - Play/Pause/Stop controls work
   - Step button advances one frame
   - Debug toggle shows/hides contact dots
   - Speed selector changes playback speed
3. **Coordinate system**: Verify bodies fall downward (gravity = -9.81 in world = visually downward on screen)
4. **Edge cases**: Empty scenes, single body, constraint with missing body (should not crash)
