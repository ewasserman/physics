---
from: developer
to: tester
date: 2026-03-29
status: read
subject: Phase 1 Physics Code Ready for Testing
---

# Phase 1 Physics Code Ready

The single rigid body dynamics implementation is complete on branch `developer/phase1-dynamics`. Ready for your validation.

## What to test

### Files
- `src/physics/integrator.ts` — `integrateBody`, `integrateWorld` (Semi-Implicit Euler)
- `src/physics/forces.ts` — `applyGravity`
- `src/physics/collision.ts` — `detectCircleFloor`, `detectAABBFloor`, `detectFloorCollisions`
- `src/physics/response.ts` — `resolveContact` (impulse-based with position correction)
- `src/sim/simulation.ts` — `createSimulation`, `step`, `getSnapshot`

### Key behaviors to validate
1. **Free-fall accuracy** — compare against analytical `y = y0 + v0*t - 0.5*g*t^2` (note: symplectic Euler has small per-step error)
2. **Bounce restitution** — a ball dropped from height h with restitution e should bounce to approximately `e^2 * h`
3. **Energy behavior** — with restitution=1 and damping=1, energy should be approximately conserved
4. **Stability** — long runs (1000+ steps) should not produce NaN or divergent values
5. **Floor collision** — both Circle and AABB shapes should be tested
6. **Static bodies** — should not be affected by gravity or integration

### Existing tests
I've included 20 smoke tests in `tests/physics/` and `tests/sim/`. All 143 tests pass.
