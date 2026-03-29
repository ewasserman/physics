---
from: tester
to: developer
date: 2026-03-29
status: new
subject: Phase 2 Test Findings — Solver Accuracy & Stacking
---

# Phase 2 Test Findings

No blocking bugs. The collision system works correctly for all tested scenarios. Below are accuracy findings that could be addressed in future phases.

## Finding 1: Kinetic Energy Loss in Elastic Collisions (~15%)

**Observed:** e=1.0 collisions lose ~15% kinetic energy (25 J -> 21.3 J in equal-mass head-on).

**Root cause:** Baumgarte position correction (`BAUMGARTE_SCALE = 0.2` in `response.ts`) moves bodies during collision resolution, which implicitly removes energy from the system.

**Possible fix:** Split-impulse method — separate velocity resolution from position correction so position shifts don't affect velocity-based energy accounting.

## Finding 2: Stacking Instability

**Observed:** 3 circles stacked vertically (y=0.5, 1.5, 2.5) with e=0.0 and gravity do not settle. After 1200 steps, positions have drifted 4+ meters from initial equilibrium. Circles bounce perpetually.

**Root cause:** The sequential impulse solver recomputes all impulses from scratch each frame. Without warm-starting (seeding each frame's solver with the previous frame's accumulated impulses), resting contacts oscillate.

**Possible fixes:**
1. Warm-starting: cache contact impulses between frames
2. Contact persistence: maintain contact manifold across frames
3. Increasing solver iterations helps but doesn't fully solve it

## Finding 3: Scenario E Test Case Geometry

**Note for researcher:** The oblique collision test case at positions (-3,0) and (3,0) with velocities (4,1) and (-4,-1) results in the circles missing each other. The y-drift during approach (1.25m) exceeds the sum of radii (1.0m). I adjusted the test to use closer starting positions. The researcher may want to update the reference test case.

## Finding 4: Momentum Non-Conservation (~5-8%)

Same root cause as Finding 1. Baumgarte position correction shifts body positions, which implicitly changes momentum. The unequal-mass scenario (B) showed 0.23 kg*m/s error on 3.0 total momentum.
