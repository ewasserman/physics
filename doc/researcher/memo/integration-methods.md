# Numerical Integration Methods for 2D Rigid-Body Simulation

## Context
We need a numerical integrator for a 2D rigid-body physics engine that:
- Runs faster than real-time (many bodies simultaneously)
- Prioritizes visual plausibility over physical exactness
- Handles both linear and angular dynamics
- Is straightforward to implement in TypeScript

## Methods Surveyed

### 1. Explicit (Forward) Euler

**Algorithm:**
```
v(t+dt) = v(t) + a(t) * dt
x(t+dt) = x(t) + v(t) * dt
```

| Property | Assessment |
|----------|------------|
| Accuracy | O(dt) -- first-order. Large errors accumulate quickly. |
| Stability | **Poor.** Adds energy to the system over time. Oscillating systems (springs, stacking) diverge. |
| Energy drift | Positive drift (energy grows). Systems "explode" over long runs. |
| Cost | Minimal -- one force evaluation per step. |
| Implementation | Trivial -- 2 lines per DOF. |

**Verdict:** Too unstable for any serious use. Even with small timesteps, energy gain causes visible artifacts (objects accelerating without cause, stacks blowing apart).

---

### 2. Semi-Implicit (Symplectic) Euler

**Algorithm:**
```
v(t+dt) = v(t) + a(t) * dt
x(t+dt) = x(t) + v(t+dt) * dt    // <-- uses NEW velocity
```

The only difference from explicit Euler is that position is updated using the *new* velocity. This single change makes the method symplectic (area-preserving in phase space).

| Property | Assessment |
|----------|------------|
| Accuracy | O(dt) -- still first-order, but error is oscillatory rather than accumulating. |
| Stability | **Excellent for the cost.** Symplectic property means energy oscillates around the true value rather than drifting monotonically. |
| Energy drift | Bounded oscillation. No secular drift. Objects don't spontaneously gain or lose energy. |
| Cost | Identical to explicit Euler -- one force evaluation per step. |
| Implementation | Trivial -- same as explicit Euler with two lines swapped. |

**Verdict:** The workhorse of real-time game physics. Used by Box2D, Bullet, and most game engines. Extremely robust for the computational cost.

---

### 3. Velocity Verlet (Stormer-Verlet)

**Algorithm:**
```
x(t+dt) = x(t) + v(t) * dt + 0.5 * a(t) * dt^2
a_new = computeAcceleration(x(t+dt))
v(t+dt) = v(t) + 0.5 * (a(t) + a_new) * dt
```

| Property | Assessment |
|----------|------------|
| Accuracy | O(dt^2) -- second-order. Significantly more accurate trajectories. |
| Stability | **Very good.** Symplectic. Energy is conserved to O(dt^2). |
| Energy drift | Bounded, smaller oscillation than symplectic Euler. |
| Cost | Requires two force evaluations per step (or caching the previous acceleration). In a collision-heavy sim, the "recompute acceleration at new position" step can be costly since it means re-running collision detection. |
| Implementation | Moderate. Need to manage the half-step velocity update and cache accelerations between frames. |

**Caveat for collision systems:** Velocity Verlet assumes forces are position-dependent and smooth. In a rigid-body sim with discrete collision detection and impulse response, the force function is discontinuous. This partially negates the accuracy advantage. The extra force evaluation also means running collision detection twice per step, which is our most expensive operation.

**Verdict:** Excellent for molecular dynamics and N-body gravity sims. For impulse-based rigid body with collisions, the accuracy advantage is mostly wasted while the cost doubles.

---

### 4. Fourth-Order Runge-Kutta (RK4)

**Algorithm:**
```
k1 = f(t, y)
k2 = f(t + dt/2, y + dt/2 * k1)
k3 = f(t + dt/2, y + dt/2 * k2)
k4 = f(t + dt, y + dt * k3)
y(t+dt) = y + (dt/6)(k1 + 2*k2 + 2*k3 + k4)
```

| Property | Assessment |
|----------|------------|
| Accuracy | O(dt^4) -- fourth-order. Extremely accurate for smooth problems. |
| Stability | Good for smooth ODEs. **Not symplectic** -- energy drifts over long runs. |
| Energy drift | Slow negative drift (energy loss). Less catastrophic than explicit Euler's gain, but orbits spiral inward. |
| Cost | **4x the cost** of Euler -- four force evaluations per step. In our context, this means 4 collision detection passes per step. |
| Implementation | Moderate complexity. Need to evaluate the derivative function at intermediate states. |

**Caveat:** RK4 is not symplectic. For a physics sandbox that runs indefinitely, this matters -- objects slowly lose energy. Also, four evaluations per step is prohibitive when collision detection is the bottleneck. The high accuracy is wasted on discontinuous collision forces.

**Verdict:** Overkill and actually worse-suited than simpler symplectic methods for our use case.

---

## Comparison Summary

| Method | Order | Symplectic | Energy Behavior | Force Evals/Step | Implementation |
|--------|-------|------------|----------------|-----------------|----------------|
| Explicit Euler | 1 | No | Grows (unstable) | 1 | Trivial |
| Semi-Implicit Euler | 1 | Yes | Bounded oscillation | 1 | Trivial |
| Velocity Verlet | 2 | Yes | Bounded, tight | 2 (or 1 with cache) | Moderate |
| RK4 | 4 | No | Slow decay | 4 | Moderate |

## Recommendation: Semi-Implicit (Symplectic) Euler

**Primary choice: Semi-Implicit Euler.** Rationale:

1. **Stability-to-cost ratio is unbeatable.** One force evaluation per step, yet energy stays bounded. This is why virtually every real-time physics engine uses it.

2. **Collision-friendly.** Our system uses discrete collision detection with impulse-based response. The forces are discontinuous at collisions, which negates the accuracy advantages of higher-order methods. Semi-implicit Euler handles this gracefully.

3. **Simplicity.** The implementation is literally two lines per degree of freedom. Less code means fewer bugs and easier debugging.

4. **Proven at scale.** Box2D, Bullet, PhysX, and most game engines use symplectic Euler. The approach is battle-tested for exactly our use case.

5. **Fixed timestep compatibility.** We should use a fixed timestep (e.g., 1/60s or 1/120s) with semi-implicit Euler. This is standard practice and makes the simulation deterministic.

**When to reconsider:** If we later need high-accuracy orbital mechanics or molecular simulation (smooth, conservative forces), Velocity Verlet would be the upgrade. For rigid-body collisions, symplectic Euler is the right call.

### Implementation Notes
- Use a fixed timestep (recommend `dt = 1/120` for stability, or `1/60` if performance is tight)
- Apply forces/gravity first, update velocity, then update position
- For angular dynamics, same pattern: apply torque, update angular velocity, update angle
- Consider adding a small velocity damping factor (e.g., `v *= 0.999`) to absorb micro-instabilities from collision resolution
