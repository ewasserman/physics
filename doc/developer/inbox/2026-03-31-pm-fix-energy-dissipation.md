---
status: done
from: pm
to: developer
date: 2026-03-31
subject: Fix unphysical energy dissipation in simulation loop
---

# Fix Unphysical Energy Dissipation

## Problem

Energy is not conserved in constraint-based simulations (double pendulum, chain). The double pendulum dampens to hanging straight down within seconds. This is non-physical.

## Research

The researcher has fully analyzed the issue. Read their memo for details:
**`doc/researcher/memo/2026-03-31-energy-dissipation-analysis.md`**

## What to fix (in priority order)

### P1: Fix the damping fallback (one-line fix)

`src/sim/simulation.ts` line 84 — change:
```ts
const damping = sim.config.damping > 0 ? (1 - sim.config.damping) : 0.999;
```
to:
```ts
const damping = sim.config.damping > 0 ? (1 - sim.config.damping) : 1.0;
```

This alone eliminates ~62% of kinetic energy loss per second.

### P2: Split constraint solver into velocity-only and position-only phases

`src/physics/constraints.ts` — the current solver mixes position and velocity corrections in the same pass, causing the velocity correction to act as a drag force (applied 256×/frame for double pendulum).

Implement a proper split solver following Box2D's approach:
1. **Velocity phase**: compute constraint impulses at the velocity level only, with Baumgarte bias folding in position error: `impulse = -(relVel + (beta/dt) * posError) / effectiveMass`
2. **Position phase**: separate post-stabilization pass that only moves positions, never touches velocities

Update `src/sim/simulation.ts` step function to call these as separate phases.

### P3: Verify energy conservation

Add a simple energy computation (see researcher memo for formula) and verify:
- Double pendulum maintains total energy within 1-2% over 30 seconds
- Double pendulum exhibits sustained chaotic motion
- Existing demos still work (bouncing, rain, car crash may need explicit `damping` values if they relied on the implicit 0.999)

## Branch

Work on `developer/fix-energy-dissipation`.

## Tests

Ensure existing tests pass. Add a test that verifies energy conservation for a simple pendulum (single body on a revolute constraint, no collisions) over ~10 seconds of sim time.
