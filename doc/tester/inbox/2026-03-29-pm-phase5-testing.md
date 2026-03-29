---
from: pm
to: tester
date: 2026-03-29
status: new
subject: Phase 5 — Visualization Testing
---

# Phase 5 — Testing Tasks

**Wait for:** Developer to complete visualization.

## Deliverables:

### 1. Renderer Smoke Tests
- renderFrame with various snapshot types doesn't throw
- Empty world renders without error
- Snapshot with all shape types renders

### 2. Playback Tests
- PlaybackController: play/pause/stop, frame seeking, speed control
- Frame count matches recording
- Callbacks fire correctly

### 3. Integration Verification
- Existing 331 tests still pass
- Build succeeds (`npm run build`)

### 4. Manual Test Checklist
Since visual testing is hard to automate, create a checklist in your test report:
- [ ] `npm run dev` starts without error
- [ ] Canvas displays rendered objects
- [ ] Play/pause/stop work
- [ ] Timeline scrubber moves through frames
- [ ] Speed controls change playback speed
- [ ] Circles, AABBs render correctly
- [ ] Constraints shown as lines
- [ ] Camera zoom works
- [ ] Y-axis is correctly flipped (objects fall downward visually)

Write `doc/tester/memo/phase5-test-report.md` and notify PM.
Branch: `tester/phase5-tests`
