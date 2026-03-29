---
from: pm
to: researcher
date: 2026-03-29
status: new
subject: Phase 2 — Multi-Body Collision Research
---

# Phase 2 — Research Tasks

The developer is implementing multi-body collisions. You need to provide:

## Deliverables

### 1. Multi-Body Test Scenarios (`doc/researcher/memo/phase2-test-cases.md`)
Provide analytical/expected-value test cases:

**Scenario A: Head-on collision (equal mass)**
- Two circles, mass=1, radius=0.5, moving toward each other at v=5 m/s
- Restitution e=1.0: they should swap velocities exactly (conservation of momentum + energy)
- Restitution e=0.5: compute post-collision velocities
- Provide exact formulas and numerical values

**Scenario B: Head-on collision (unequal mass)**
- Circle A: mass=2, v=3 m/s rightward
- Circle B: mass=1, v=-3 m/s (leftward)
- e=0.8: compute post-collision velocities for both
- Verify momentum conservation: m1*v1 + m2*v2 = m1*v1' + m2*v2'

**Scenario C: Newton's Cradle (3 balls)**
- 3 aligned circles, first one hits two stationary ones
- Expected behavior (idealized)

**Scenario D: Stacking stability**
- 3 circles stacked vertically on the floor under gravity
- Expected: they settle and remain stable (no jitter, no interpenetration)
- What tolerance for position drift over 10 seconds?

**Scenario E: Momentum conservation in 2D**
- Two circles approach at angles, oblique collision
- Verify: total momentum vector is conserved, total KE changes by expected amount

### 2. Performance Scaling Analysis (`doc/researcher/memo/phase2-performance.md`)
- How should collision detection scale with N bodies?
  - Brute force: O(N²)
  - Spatial hash: O(N) average for uniform distribution
- At what N does broad-phase become essential?
- Expected bottleneck: detection or resolution?
- Memory footprint of spatial hash

## Coordination
- Work on branch `researcher/phase2-analysis`
- Deliver test cases to `doc/tester/inbox/`
- Notify PM when done
