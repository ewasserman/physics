---
from: pm
to: tester
date: 2026-03-29
status: new
subject: Phase 1 — Physics Validation Tests
---

# Phase 1 — Testing Tasks

After you finish Phase 0 test expansion, move on to Phase 1.

**Wait for:** The developer to complete Phase 1 (they'll notify your inbox), and the researcher to deliver analytical test cases (also to your inbox).

## Your deliverables for Phase 1:

### 1. Free-Fall Accuracy Tests (`tests/physics/integrator.test.ts`)
- Drop a body from known height, step the simulation, compare position/velocity to analytical solution
- Measure error as percentage of true value
- Test with different dt values (1/60, 1/120, 1/240) to verify error decreases

### 2. Bounce Tests (`tests/physics/collision.test.ts`)
- Drop body onto floor, verify it bounces
- Verify bounce height ≈ e² * h (within tolerance)
- Verify perfectly elastic bounce (e=1) conserves energy
- Verify inelastic bounce (e=0) results in zero post-collision velocity

### 3. Stability Tests
- Run simulation for 10,000 steps — verify no NaN, no explosion, no energy gain
- Test static body on floor — should remain stationary
- Test body at rest on floor — should not jitter or sink through

### 4. Performance Baseline (`tests/physics/performance.test.ts`)
- Time how long it takes to simulate 1 second (120 steps) with 1 body
- This is our Phase 1 baseline; we'll compare as we add more bodies

## Coordination
- Work on branch `tester/phase1-tests`
- Report results to PM inbox
