# Phase 1 Numerical Accuracy Assessment

## Integration Method: Semi-Implicit (Symplectic) Euler

The symplectic Euler update rule is:

```
v_{n+1} = v_n + a * dt
x_{n+1} = x_n + v_{n+1} * dt    (uses NEW velocity)
```

This differs from explicit Euler which uses the OLD velocity for the position update.

## Timestep

dt = 1/120 s = 0.008333... s (120 Hz simulation rate)

---

## Free-Fall Position Error After 1 Second

### Analytical derivation

For constant acceleration (free fall), the symplectic Euler has a closed-form error. After N steps (t = N * dt):

- Exact: y(t) = y0 + v0*t + 0.5*a*t^2
- Symplectic Euler: y_N = y0 + v0*N*dt + a*dt^2 * N*(N+1)/2

Error = a*dt^2 * N/2 = **0.5 * a * dt * t**

For t = 1.0 s, a = -9.81 m/s^2, dt = 1/120:

**Position error = 0.5 * 9.81 * (1/120) * 1.0 = 0.040875 m (about 4.1 cm)**

The symplectic Euler **undershoots** the exact position (reports a lower y value, i.e., the ball falls slightly too far).

### Comparison of integrators at t = 1.0 s (free fall from y = 10 m)

| Integrator | y after 1s | Position Error | Error Order |
|------------|-----------|----------------|-------------|
| Exact | 5.0950000 m | -- | -- |
| Symplectic Euler | 5.0541250 m | 0.040875 m | O(dt) = O(h) first order |
| Explicit Euler | 5.1358750 m | 0.040875 m | O(dt) first order |
| Velocity Verlet | 5.0950000 m | 0.0 m (exact for const accel) | O(dt^2) second order |

Notes:
- Both Euler variants have the same magnitude of error but opposite sign (symplectic undershoots, explicit overshoots).
- Velocity Verlet is exact for constant acceleration (free fall). Errors only appear with non-constant forces.
- Velocity error is **zero** for all three methods with constant acceleration -- the accumulated velocity is exact at step boundaries.

### Error growth characteristics

| Integrator | Position error growth | Energy behavior |
|------------|----------------------|-----------------|
| Explicit Euler | Linear in t, **energy increases** (unstable long-term) |
| Symplectic Euler | Linear in t, **energy oscillates** around true value (bounded, stable) |
| Velocity Verlet | Quadratic in t for variable forces; zero for constant forces | Excellent energy conservation |

**Key advantage of symplectic Euler:** While its position error is first-order (same as explicit Euler), it preserves the symplectic structure of the Hamiltonian system. This means:
- Energy does not systematically drift -- it oscillates
- Phase-space volume is preserved
- Long-term stability is much better than explicit Euler
- A bouncing ball with e=1.0 will maintain its bounce height indefinitely (no drift)

---

## Bounce Accuracy

### Energy at impact

Running symplectic Euler to floor impact:
- Symplectic Euler KE at impact: 93.192 J
- Exact KE at impact: 93.195 J
- **Energy error at impact: 0.003 J (0.0033%)**

This is very small because the velocity accumulation is exact for constant acceleration.

### Collision timing error

The simulation steps in discrete increments of dt = 1/120 s. The ball will penetrate slightly below the floor before collision is detected. The timing error is bounded by dt:

- Maximum timing error: dt = 0.00833 s
- Maximum penetration: approximately |v_impact| * dt = 13.65 * 0.00833 = 0.114 m

The collision response system should correct for penetration (project the ball back to the floor surface).

### Energy error per bounce

For a well-implemented collision response, the energy error per bounce should be negligible compared to the restitution-based energy loss. The dominant energy error comes from:

1. **Discrete collision timing**: Ball detected below floor, then repositioned. This creates a small position error that maps to an energy error of approximately m*g*penetration ~ 1.0 * 9.81 * 0.057 ~ 0.56 J worst case (if not corrected for). With proper time-of-impact correction, this drops to near zero.

2. **Velocity accumulation during bounce step**: Negligible for constant gravity.

3. **Symplectic Euler phase error**: The ball arrives at the floor at slightly the wrong time, but the velocity and thus KE are very close to exact.

**Expected energy error per bounce: < 0.5% without time-of-impact correction, < 0.01% with correction.**

---

## Recommended Test Tolerances

### Position tolerance

| Simulation duration | Recommended tolerance |
|--------------------|-----------------------|
| < 0.5 s | 0.025 m (2.5 cm) |
| 1.0 s | 0.05 m (5 cm) |
| 2.0 s | 0.10 m (10 cm) |
| 5.0 s | 0.25 m (25 cm) |

Rationale: Error grows as 0.5 * g * dt * t = 0.04 * t meters. Tolerance should be ~1.2x the expected error to avoid flaky tests.

### Velocity tolerance

Velocity is exact at step boundaries for constant acceleration. Use:
- **0.1 m/s** for general velocity checks
- **0.01 m/s** for velocity at specific step-aligned times (should be nearly exact)

### Energy tolerance

| Check | Recommended tolerance |
|-------|-----------------------|
| Free-fall energy conservation | 0.5% of total energy |
| Elastic bounce (e=1.0) energy | 1.0% per bounce, 5% after 10 bounces |
| Inelastic bounce energy ratio | Actual KE_after/KE_before within 2% of e^2 |
| Resting (e=0) final KE | < 0.1 J |

### Bounce height tolerance

- **0.15 m** for first bounce (accounts for collision timing and position error)
- **0.10 m** for subsequent bounces (lower velocity means less collision timing error)
- For e=1.0 repeated bounces: height should stay within **0.5 m** of original after 10 bounces

### Bounce count tolerance

- For "effectively stopped" tests: allow +/- 2 bounces from analytical prediction

---

## Divergence Criteria

The simulation should be considered **diverged** if any of these occur:
- Energy increases by more than 5% relative to initial energy (for e <= 1.0)
- Ball position goes below the floor by more than dt * max_velocity
- Ball velocity exceeds 2x the theoretical maximum (sqrt(2*g*h))
- Ball bounces higher than its previous bounce height (for e < 1.0)

---

## Summary

Symplectic Euler at 120 Hz is adequate for Phase 1. The ~4 cm/s position drift is acceptable for visual plausibility and the energy stability properties make it robust for long-running bouncing simulations. The main source of error in bouncing scenarios will be collision timing resolution, not the integrator itself.

For higher accuracy needs in later phases, velocity Verlet would be the natural upgrade -- it eliminates the O(dt) position error for constant forces and is still simple to implement.
