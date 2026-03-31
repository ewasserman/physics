# Energy Dissipation Analysis: Constraint-Based Simulations

**Date:** 2026-03-31
**From:** Researcher
**Re:** PM request — Investigate unphysical energy dissipation in double pendulum and chain demos

---

## Executive Summary

The double pendulum demo loses nearly all its energy within seconds and dampens to rest. I identified **five distinct sources of unphysical energy loss** in the simulation loop. The two dominant sources are (1) velocity damping applied even when `damping=0`, and (2) the constraint solver's velocity correction acting as a drag force due to repeated over-application across iterations. Together these account for the vast majority of the dissipation. The remaining three sources (position-based constraint correction without velocity compensation, Baumgarte position correction in collision response, and angular velocity damping) are secondary contributors but still non-physical.

---

## Source 1: Velocity Damping — The 0.999 Fallback (CRITICAL)

**File:** `src/sim/simulation.ts`, line 84
**Code:**
```ts
const damping = sim.config.damping > 0 ? (1 - sim.config.damping) : 0.999;
```

**Problem:** When `damping` is configured as `0` (as in the double pendulum demo), the code falls back to `0.999` instead of `1.0`. This multiplier is applied to both linear and angular velocity **every substep**.

**Quantification:**
- With 8 substeps at 60fps, the multiplier is applied 480 times per second.
- Per second: `0.999^480 = 0.619` — **38.1% of velocity magnitude is lost every second**.
- For kinetic energy (proportional to v^2): `0.619^2 = 0.383` — **61.7% of kinetic energy is lost every second**.
- After 3 seconds: velocity is at `0.999^1440 = 0.237`, meaning ~94% of kinetic energy is gone.

This single bug is the primary reason the double pendulum stops within seconds.

**Fix:** When `damping` is configured as `0`, use `1.0` (no damping). The line should be:
```ts
const damping = sim.config.damping > 0 ? (1 - sim.config.damping) : 1.0;
```

---

## Source 2: Constraint Velocity Correction as Drag (MAJOR)

**File:** `src/physics/constraints.ts`, lines 115-144 (revolute constraint)

**Problem:** The constraint solver applies velocity corrections to zero out relative velocity at the joint anchor, scaled by `stiffness` (which is `1.0`). This is done in a loop of `solverIterations` (32) times per substep (8), for a total of **256 applications per frame**.

The velocity correction on lines 132-133:
```ts
const velCorrection = -relVelAxis * stiffness / effectiveMass;
```

This computes the full impulse needed to zero relative velocity along each axis, then applies it. But this is done iteratively — each iteration recomputes the relative velocity (which has been partially corrected by previous iterations) and applies another correction. With `stiffness=1.0`, each iteration fully corrects the remaining error.

However, the problem is more subtle: each iteration recomputes `rA` and `rB` from the **position-corrected** bodies (line 116-117), but the velocity correction treats the full remaining relative velocity as an error. In a multi-body chain (like a double pendulum), correcting one joint's velocities disturbs the other joint's velocities. With 256 total applications, the solver over-damps the system — it aggressively kills any velocity that is "out of alignment" at the joint, even when that velocity is physically correct motion.

**Why this drains energy:** A revolute joint should only constrain the *positional drift* of the anchor points. It should NOT zero out relative velocity at the joint — the joint is a hinge, and relative velocity at the anchor should be zero only in the *normal* direction (maintaining zero separation), but the current solver applies corrections along both X and Y axes, which effectively kills tangential motion as well.

Actually, zeroing relative velocity at the anchor point IS correct for a revolute joint (both anchor points should move identically). The real issue is that the position correction on lines 105-113 moves the bodies without adjusting their velocities to compensate, and then the velocity solver independently tries to zero the relative velocity. The position correction creates a "phantom" velocity error that the velocity solver then dissipates.

**Quantification:** Difficult to quantify precisely without instrumentation, but with 256 applications per frame, even tiny over-corrections compound. I estimate this contributes 10-30% additional energy loss per second on top of Source 1.

**Fix (proper approach):** See the "Recommended Fix Strategy" section. The position and velocity corrections need to be properly separated, following the approach used by Box2D and Bullet.

---

## Source 3: Position Correction Without Velocity Compensation (MODERATE)

**File:** `src/physics/constraints.ts`, lines 105-113

**Problem:** The position correction directly moves bodies to satisfy the constraint:
```ts
const correction = error.scale(stiffness / totalInvMass);
bodyA.position = bodyA.position.add(correction.scale(bodyA.inverseMass));
bodyB.position = bodyB.position.sub(correction.scale(bodyB.inverseMass));
```

This teleports the bodies to a new position without adding corresponding velocity. The bodies gain potential energy (or lose kinetic energy) depending on the direction of correction. Over many iterations and substeps, this systematically drains energy because:

1. During integration, bodies drift apart slightly at joints (position error accumulates).
2. The solver pushes them back together by moving positions.
3. The velocity that caused the drift is still present, and the velocity correction then damps it.
4. Net effect: kinetic energy is converted to nothing.

In proper physics engines, position-level corrections are applied in a **separate pass** (Box2D's "position solver") that does NOT interact with the velocity solver at all.

**Quantification:** This interacts multiplicatively with Source 2. The position error created each substep is small (~1e-4 to 1e-3 meters for the double pendulum), but the velocity correction amplifies the effect.

---

## Source 4: Baumgarte Stabilization in Collision Response (MINOR for pendulum)

**File:** `src/physics/response.ts`, lines 83-84

**Problem:** The Baumgarte velocity bias adds a non-physical velocity component:
```ts
const vBias = Math.max(penetration - BAUMGARTE_SLOP, 0) * BAUMGARTE_SCALE;
const j = (-(1 + e) * vn + vBias) / effectiveMass;
```

This adds extra impulse to push penetrating bodies apart. While necessary for stability, it injects energy that then gets removed by subsequent damping, creating a pump-and-drain cycle. For the double pendulum demo specifically (no floor, no body-body collisions expected), this is not a factor unless bobs collide. For the chain demo it matters more.

Additionally, the position correction on lines 98-109 moves bodies without velocity compensation (same issue as Source 3 but for collisions).

---

## Source 5: Angular Velocity Damping (CRITICAL — same root as Source 1)

**File:** `src/physics/integrator.ts`, line 33
```ts
body.angularVelocity *= damping;
```

The `0.999` fallback damping is applied to angular velocity as well. For the double pendulum, angular velocity is the primary mode of motion. The same `0.999^480 = 0.619` per-second loss applies to angular velocity, draining rotational kinetic energy at the same rate as translational.

---

## How Established Engines Handle This

### Box2D (Erin Catto)

Box2D uses a **split solver** approach:

1. **Velocity phase:** Compute constraint impulses at the velocity level only. Constraints accumulate impulses across iterations (warm-starting from the previous frame). The solver only modifies velocities, never positions. This is a proper Gauss-Seidel iterative solver on the velocity constraint equations.

2. **Position phase:** After velocities are finalized and positions integrated, a separate position solver corrects any remaining drift. This solver only modifies positions and does NOT touch velocities. It uses a non-linear Gauss-Seidel method on the position constraint equations.

Key insight: **velocity and position corrections never interfere with each other**. The velocity solver produces physically correct impulses; the position solver only cleans up drift without affecting energy.

Box2D also uses **accumulated impulse clamping**: each constraint stores its total accumulated impulse, and new impulse deltas are clamped so the total never goes negative (for normal contacts). This prevents the solver from pulling bodies together when it should only push them apart.

### Bullet Physics

Bullet uses Sequential Impulse (SI) similar to our code, but with these critical differences:

1. **Warm-starting with accumulated impulses:** Each constraint stores its accumulated impulse from the previous frame. The solver starts from this cached value and only applies the *delta* impulse each iteration. This provides much better convergence without over-correction.

2. **Split impulse for position correction:** Bullet separates the Baumgarte position correction impulse from the velocity correction impulse. The position correction modifies a "pseudo-velocity" that is used only for position updates, not for the main velocity. This prevents position correction from injecting energy into the velocity field.

3. **No explicit damping on constraint bodies:** There is no global velocity damping multiplier. Energy is conserved by the solver.

### Key Principles from the Literature

1. **Symplectic Euler is energy-conserving** when implemented correctly (no damping multiplier). The integration method itself is fine.

2. **Iterative constraint solvers converge to the correct solution** when they operate purely on velocities with proper effective mass computation. The issue is mixing position and velocity corrections.

3. **Position drift should be handled separately** from velocity constraints. Methods include:
   - Baumgarte stabilization (bias the velocity constraint with a position-dependent term, but done at the velocity level, not as a separate position move)
   - Post-stabilization (separate position correction pass)
   - Pseudo-velocity method (Bullet's split impulse)

---

## Recommended Fix Strategy (Prioritized)

### Priority 1: Fix the damping fallback (5 minutes, eliminates ~60% of energy loss)

**File:** `src/sim/simulation.ts`, line 84

Change:
```ts
const damping = sim.config.damping > 0 ? (1 - sim.config.damping) : 0.999;
```
To:
```ts
const damping = sim.config.damping > 0 ? (1 - sim.config.damping) : 1.0;
```

This is a one-line fix that eliminates the single largest source of energy loss. The double pendulum and chain demos set `damping: 0`, which should mean "no damping," not "almost no damping." Other demos that rely on the implicit 0.999 damping should explicitly set a damping value if they need it.

**Risk:** Demos that relied on implicit damping (bouncing balls, rain, car crash) may behave slightly differently. Check those demos after this change. They may need explicit `damping: 0.001` in their configs.

### Priority 2: Remove velocity correction from the position-based constraint solver (1-2 hours)

**File:** `src/physics/constraints.ts`

The current solver mixes position correction and velocity correction in the same pass. This should be split:

**Option A (quick fix):** Remove the velocity correction entirely from `resolveRevoluteConstraint` (lines 115-144). Keep only the position correction. This will cause some jitter at joints but will stop the energy drain from the velocity correction.

**Option B (proper fix):** Implement a velocity-level-only constraint solver as a separate function, called from the simulation loop *before* integration (or after, depending on the integration scheme). The position correction should remain as a separate post-stabilization pass.

I recommend Option A as an immediate fix, followed by Option B as a follow-up.

### Priority 3: Implement proper Baumgarte at velocity level for constraints (2-4 hours)

Instead of the current position-then-velocity approach, implement proper Baumgarte stabilization where the position error biases the velocity constraint:

```ts
// In velocity-level constraint solver:
const beta = 0.2; // Baumgarte factor (tunable)
const bias = (beta / dt) * positionError;
const impulse = -(relativeVelocity + bias) / effectiveMass;
```

This folds the position correction into the velocity impulse computation, so there is no separate position move that creates phantom velocity errors. This is how Box2D handles it for joints.

### Priority 4: Add accumulated impulse clamping (2-3 hours)

Store the accumulated constraint impulse between iterations (within a single timestep) and clamp deltas so the solver converges monotonically:

```ts
// Per constraint, per frame:
let accumulatedImpulse = warmStartValue;
for (each iteration) {
  const deltaImpulse = computeImpulse();
  const oldAccum = accumulatedImpulse;
  accumulatedImpulse = Math.max(0, accumulatedImpulse + deltaImpulse); // clamp for contacts
  const actualDelta = accumulatedImpulse - oldAccum;
  applyImpulse(actualDelta);
}
```

This prevents over-shooting and the oscillatory behavior that comes from naive iteration.

### Priority 5: Split impulse for collision position correction (3-4 hours)

Implement Bullet-style split impulse for collision response:

1. Compute the normal impulse for velocity correction as usual.
2. Compute a separate "pseudo-impulse" for position correction.
3. Apply the pseudo-impulse to a separate `pseudoVelocity` field on each body.
4. After all solver iterations, integrate positions using `velocity + pseudoVelocity` but only keep `velocity` for the next frame.

This cleanly separates energy-conserving velocity impulses from non-physical position corrections.

---

## Verification Plan

After implementing fixes, energy conservation should be validated:

1. **Compute total energy** (kinetic + gravitational potential) each frame for the double pendulum.
2. A frictionless pendulum should maintain total energy within 1-2% over 30 seconds of simulation.
3. The double pendulum should exhibit sustained chaotic motion, not dampen to hanging.
4. The chain demo should swing for much longer before settling.

A simple energy monitor function:
```ts
function totalEnergy(sim: Simulation): number {
  let E = 0;
  for (const body of sim.world.bodies) {
    if (body.isStatic) continue;
    const KE = 0.5 * body.mass * body.velocity.lengthSquared()
             + 0.5 * (1/body.inverseInertia) * body.angularVelocity * body.angularVelocity;
    const PE = body.mass * Math.abs(sim.config.gravity.y) * body.position.y;
    E += KE + PE;
  }
  return E;
}
```

---

## Summary Table

| # | Source | Severity | Energy Loss/sec | Fix Effort |
|---|--------|----------|----------------|------------|
| 1 | 0.999 damping fallback | CRITICAL | ~62% KE | 5 min |
| 5 | Angular velocity damping (same root) | CRITICAL | ~62% rotational KE | (same fix) |
| 2 | Constraint velocity correction drag | MAJOR | ~10-30% est. | 1-2 hr |
| 3 | Position correction w/o velocity comp. | MODERATE | multiplicative with #2 | 2-4 hr |
| 4 | Baumgarte collision stabilization | MINOR (for pendulum) | small | 3-4 hr |

**Bottom line:** Fix #1 alone (the one-line damping fix) will dramatically improve the double pendulum. Fixes #2-3 (splitting the constraint solver into proper velocity and position phases) are needed for true energy conservation.
