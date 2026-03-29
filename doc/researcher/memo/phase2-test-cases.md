# Phase 2: Multi-Body Collision Test Cases

## General Collision Formulas

For 1D collisions with coefficient of restitution `e`:

```
v1' = (m1*v1 + m2*v2 + m2*e*(v2 - v1)) / (m1 + m2)
v2' = (m1*v1 + m2*v2 + m1*e*(v1 - v2)) / (m1 + m2)
```

For 2D collisions, decompose velocities into normal (along line of centers) and tangential components. Apply the 1D formulas to the normal components only; tangential components are unchanged (frictionless collision).

---

## Scenario A: Head-On Elastic Collision (Equal Mass)

**Initial conditions:**
| Property    | Circle A         | Circle B         |
|-------------|------------------|------------------|
| Mass        | 1.0 kg           | 1.0 kg           |
| Radius      | 0.5 m            | 0.5 m            |
| Position    | (-2, 0)          | (2, 0)           |
| Velocity    | (5, 0) m/s       | (-5, 0) m/s      |

Collision occurs when circles touch: gap = |xB - xA| - (rA + rB) = 4 - 1 = 3 m. Closing speed = 10 m/s. Time to contact = 0.3 s.

### Case A1: e = 1.0 (perfectly elastic)

```
v1' = (1*5 + 1*(-5) + 1*1.0*(-5 - 5)) / (1 + 1) = (0 - 10) / 2 = -5.0
v2' = (1*5 + 1*(-5) + 1*1.0*(5 - (-5))) / (1 + 1) = (0 + 10) / 2 = 5.0
```

**Expected post-collision velocities:**
- Circle A: (-5, 0) m/s
- Circle B: (5, 0) m/s

**Verification:**
- Momentum before: 1*5 + 1*(-5) = 0. After: 1*(-5) + 1*5 = 0. Conserved.
- KE before: 0.5*1*25 + 0.5*1*25 = 25 J. After: 0.5*1*25 + 0.5*1*25 = 25 J. Conserved.
- Restitution check: |v2' - v1'| / |v2 - v1| = |5 - (-5)| / |(-5) - 5| = 10/10 = 1.0.

**Tolerance:** velocity error < 0.01 m/s per component.

### Case A2: e = 0.5 (partially inelastic)

```
v1' = (1*5 + 1*(-5) + 1*0.5*(-5 - 5)) / 2 = (0 - 5) / 2 = -2.5
v2' = (1*5 + 1*(-5) + 1*0.5*(5 - (-5))) / 2 = (0 + 5) / 2 = 2.5
```

**Expected post-collision velocities:**
- Circle A: (-2.5, 0) m/s
- Circle B: (2.5, 0) m/s

**Verification:**
- Momentum before: 0. After: 1*(-2.5) + 1*2.5 = 0. Conserved.
- KE before: 25 J. After: 0.5*1*6.25 + 0.5*1*6.25 = 6.25 J.
- KE ratio: 6.25/25 = 0.25 = e^2 (correct for equal mass head-on).
- Restitution check: |2.5 - (-2.5)| / |(-5) - 5| = 5/10 = 0.5.

**Tolerance:** velocity error < 0.01 m/s per component.

---

## Scenario B: Head-On Collision (Unequal Mass)

**Initial conditions:**
| Property    | Circle A         | Circle B         |
|-------------|------------------|------------------|
| Mass        | 2.0 kg           | 1.0 kg           |
| Radius      | 0.5 m            | 0.5 m            |
| Position    | (-2, 0)          | (2, 0)           |
| Velocity    | (3, 0) m/s       | (-3, 0) m/s      |

Restitution: e = 0.8

### Computation

```
v1' = (2*3 + 1*(-3) + 1*0.8*(-3 - 3)) / (2 + 1) = (6 - 3 - 4.8) / 3 = -1.8 / 3 = -0.6
v2' = (2*3 + 1*(-3) + 2*0.8*(3 - (-3))) / (2 + 1) = (6 - 3 + 9.6) / 3 = 12.6 / 3 = 4.2
```

**Expected post-collision velocities:**
- Circle A: (-0.6, 0) m/s
- Circle B: (4.2, 0) m/s

**Verification:**
- Momentum before: 2*3 + 1*(-3) = 3.0 kg*m/s. After: 2*(-0.6) + 1*4.2 = -1.2 + 4.2 = 3.0. Conserved.
- KE before: 0.5*2*9 + 0.5*1*9 = 9.0 + 4.5 = 13.5 J.
- KE after: 0.5*2*0.36 + 0.5*1*17.64 = 0.36 + 8.82 = 9.18 J.
- KE lost: 13.5 - 9.18 = 4.32 J (32% loss, expected for partially inelastic).
- Restitution check: |v2' - v1'| / |v2 - v1| = |4.2 - (-0.6)| / |(-3) - 3| = 4.8 / 6.0 = 0.8. Correct.

**Tolerance:** velocity error < 0.02 m/s per component (slightly relaxed for unequal mass due to potential floating-point effects).

---

## Scenario C: Newton's Cradle (3 Balls)

**Initial conditions:**
| Property    | Ball 1           | Ball 2           | Ball 3           |
|-------------|------------------|------------------|------------------|
| Mass        | 1.0 kg           | 1.0 kg           | 1.0 kg           |
| Radius      | 0.5 m            | 0.5 m            | 0.5 m            |
| Position    | (-2, 0)          | (1, 0)           | (2, 0)           |
| Velocity    | (5, 0) m/s       | (0, 0)           | (0, 0)           |

Balls 2 and 3 are touching (gap = 0). Ball 1 approaches from the left.
Restitution: e = 1.0

### Idealized Result

In the idealized Newton's cradle (simultaneous resolution):
- Ball 1 stops: velocity = (0, 0)
- Ball 2 stays at rest: velocity = (0, 0)
- Ball 3 departs at the incoming speed: velocity = (5, 0)

This preserves both momentum (1*5 = 1*5) and kinetic energy (0.5*25 = 0.5*25).

### Caveats for Sequential Impulse Solver

A sequential impulse solver processes one collision pair at a time. The result depends on processing order:

**Order: 1-2 first, then 2-3:**
1. Ball 1 hits Ball 2: Ball 1 -> (0,0), Ball 2 -> (5,0)
2. Ball 2 hits Ball 3: Ball 2 -> (0,0), Ball 3 -> (5,0)
3. Result: (0, 0, 5) -- matches idealized result.

**Order: 2-3 first, then 1-2:**
1. Balls 2-3 are touching but at rest -- no impulse needed (zero relative velocity).
2. Ball 1 hits Ball 2: Ball 1 -> (0,0), Ball 2 -> (5,0)
3. Ball 2 now moving toward Ball 3 -- needs another solver iteration.
4. After iteration 2: Ball 2 -> (0,0), Ball 3 -> (5,0)
5. Converges to same result after multiple iterations.

**Tolerance:** After convergence (sufficient solver iterations), velocity error < 0.05 m/s. May require 3-5 solver iterations to stabilize. The test should allow multiple iterations and check the final state.

**Momentum conservation:** Total momentum = 5 kg*m/s in x-direction throughout.

---

## Scenario D: Stacking Stability

**Initial conditions:**
| Property    | Circle 1 (bottom) | Circle 2 (middle) | Circle 3 (top)   |
|-------------|--------------------|--------------------|-------------------|
| Mass        | 1.0 kg             | 1.0 kg             | 1.0 kg            |
| Radius      | 0.5 m              | 0.5 m              | 0.5 m             |
| Position    | (0, 0.5)           | (0, 1.5)           | (0, 2.5)          |
| Velocity    | (0, 0)             | (0, 0)             | (0, 0)            |

- Floor is a static surface at y = 0.
- Gravity: (0, -9.81) m/s^2
- Restitution for ground and ball-ball contacts: e = 0.0 (fully inelastic for stacking)

### Expected Equilibrium

The circles should remain at their initial positions (center heights 0.5, 1.5, 2.5) since they are placed exactly at the equilibrium configuration.

**Ground contact:** Circle 1 center at y = 0.5 (touching floor at y = 0).
**Ball-ball contacts:** Each pair touching, center-to-center distance = 1.0 m (sum of radii).

### Stability Criteria (over 10 seconds / 1200 steps at 120 Hz)

| Metric                        | Pass Threshold        |
|-------------------------------|-----------------------|
| Position drift (any circle)   | < 0.05 m             |
| Velocity magnitude (any)      | < 0.1 m/s            |
| Interpenetration depth        | < 0.01 m             |
| No circle escapes upward      | y < 5.0 m            |

### Instability Indicators
- **Growing oscillation:** positions oscillate with increasing amplitude (energy being injected by solver error).
- **Sinking/interpenetration:** circles pass through each other or through the floor (inadequate collision resolution).
- **Explosion:** velocities grow without bound (numerical instability, often from overcorrection in impulse solver).
- **Jitter:** small high-frequency oscillations that don't grow but indicate poor damping.

### Notes
- Stacking is one of the hardest tests for impulse solvers. Position correction (Baumgarte stabilization or split impulse) is typically needed.
- If using velocity-only resolution, small drift is expected and acceptable within tolerance.

---

## Scenario E: 2D Oblique Collision

**Initial conditions:**
| Property    | Circle A         | Circle B         |
|-------------|------------------|------------------|
| Mass        | 1.0 kg           | 1.0 kg           |
| Radius      | 0.5 m            | 0.5 m            |
| Position    | (-3, 0)          | (3, 0)           |
| Velocity    | (4, 1) m/s       | (-4, -1) m/s     |

Restitution: e = 1.0

### Collision Geometry

Collision normal (from A toward B): n = normalize((3,0) - (-3,0)) = normalize((6,0)) = (1, 0).
Collision tangent: t = (0, 1).

### Velocity Decomposition

**Circle A:**
- Normal component: vA_n = dot((4,1), (1,0)) = 4.0 m/s
- Tangential component: vA_t = dot((4,1), (0,1)) = 1.0 m/s

**Circle B:**
- Normal component: vB_n = dot((-4,-1), (1,0)) = -4.0 m/s
- Tangential component: vB_t = dot((-4,-1), (0,1)) = -1.0 m/s

### Post-Collision (equal mass, e=1.0: normal components swap)

- Circle A normal component: vA_n' = -4.0 m/s
- Circle B normal component: vB_n' = 4.0 m/s
- Tangential components unchanged: vA_t' = 1.0, vB_t' = -1.0

### Reconstruction

- Circle A velocity: vA_n' * n + vA_t' * t = -4.0*(1,0) + 1.0*(0,1) = **(-4, 1) m/s**
- Circle B velocity: vB_n' * n + vB_t' * t = 4.0*(1,0) + (-1.0)*(0,1) = **(4, -1) m/s**

### Verification

- **Momentum before:** 1*(4,1) + 1*(-4,-1) = (0, 0).
  **Momentum after:** 1*(-4,1) + 1*(4,-1) = (0, 0). Conserved.
- **KE before:** 0.5*1*(16+1) + 0.5*1*(16+1) = 8.5 + 8.5 = 17.0 J.
  **KE after:** 0.5*1*(16+1) + 0.5*1*(16+1) = 8.5 + 8.5 = 17.0 J. Conserved.
- **Restitution check (normal):** |vB_n' - vA_n'| / |vB_n - vA_n| = |4-(-4)| / |(-4)-4| = 8/8 = 1.0. Correct.

**Tolerance:** velocity error < 0.01 m/s per component.

---

## Summary Table

| Scenario | Key Check              | Primary Tolerance     |
|----------|------------------------|-----------------------|
| A1       | Velocity swap (e=1)    | < 0.01 m/s           |
| A2       | Partial restitution    | < 0.01 m/s           |
| B        | Unequal mass + e=0.8   | < 0.02 m/s           |
| C        | Newton's cradle        | < 0.05 m/s           |
| D        | Stack stability 10s    | drift < 0.05 m       |
| E        | 2D oblique momentum    | < 0.01 m/s           |
