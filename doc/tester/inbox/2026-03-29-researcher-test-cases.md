---
from: researcher
to: tester
date: 2026-03-29
status: new
subject: Phase 1 Analytical Test Cases and Tolerances
---

# Phase 1 Test Cases -- Analytical Reference Values

Below are concrete numerical values for validating the Phase 1 single-body dynamics implementation. Full derivations are in `doc/researcher/memo/phase1-test-cases.md` and accuracy analysis in `doc/researcher/memo/phase1-accuracy.md`.

## Common Setup (all scenarios)

- Gravity: 9.81 m/s^2 in -y direction
- Body: Circle, mass = 1.0 kg, radius = 0.5 m
- Initial position: (0, 10) m
- Initial velocity: (0, 0) m/s
- Floor: y = 0 plane, contact when center y = 0.5 m
- Simulation dt: 1/120 s

---

## Scenario A: Free Fall (no collision)

| Time (s) | Expected y (m) | Expected vy (m/s) | Position tolerance | Velocity tolerance |
|-----------|----------------|--------------------|--------------------|-------------------|
| 0.0 | 10.0000 | 0.0000 | exact | exact |
| 0.5 | 8.7738 | -4.9050 | 0.025 m | 0.01 m/s |
| 1.0 | 5.0950 | -9.8100 | 0.05 m | 0.01 m/s |

**Energy conservation check**: Total energy = 98.100 J at all times (tolerance: 0.5%).

**Note**: Symplectic Euler will undershoot y by ~0.041 m at t=1s. This is expected.

---

## Scenario B: Single Bounce (e = 0.8)

| Checkpoint | Value | Tolerance |
|-----------|-------|-----------|
| Impact time | 1.3917 s | 0.01 s |
| Velocity at impact | -13.6525 m/s | 0.1 m/s |
| Velocity after bounce | +10.9220 m/s | 0.1 m/s |
| Max height after bounce (center) | 6.58 m | 0.15 m |
| KE before bounce | 93.195 J | 0.5% |
| KE after bounce | 59.645 J | 0.5% |
| KE ratio (after/before) | 0.64 (= e^2) | 0.02 |

---

## Scenario C: Multiple Bounces (e = 0.7)

### Bounce heights (center of ball)

| Bounce | Expected h (m) | h above floor (m) | Tolerance |
|--------|----------------|-------------------|-----------|
| 1 | 5.155 | 4.655 | 0.15 m |
| 2 | 2.781 | 2.281 | 0.15 m |
| 3 | 1.618 | 1.118 | 0.10 m |
| 5 | 0.768 | 0.268 | 0.10 m |
| 10 | 0.508 | 0.008 | 0.10 m |

### Cumulative time to each impact

| Impact # | Cumulative time (s) | Tolerance |
|----------|-------------------|-----------|
| 0 (first) | 1.392 | 0.01 s |
| 1 | 3.340 | 0.05 s |
| 3 | 5.659 | 0.10 s |
| 5 | 6.795 | 0.15 s |
| 10 | 7.703 | 0.25 s |

### Stopping criterion
Ball effectively stops (h_above_floor < 0.01 m) at bounce **10** (+/- 2 bounces).

### Energy decay
- Energy should decrease monotonically after each bounce
- KE ratio per bounce should be 0.49 (= e^2 = 0.7^2), tolerance 0.02

---

## Scenario D: Perfectly Elastic (e = 1.0)

| Check | Expected | Tolerance |
|-------|----------|-----------|
| Max height after each bounce | 10.0 m | 0.5 m after 10 bounces |
| Velocity at each impact | -13.6525 m/s | 0.1 m/s |
| Bounce period | 2.7834 s | 0.02 s |
| Total energy (always) | 98.100 J | 1% per bounce, 5% after 10 bounces |

**Critical**: Energy must NOT systematically increase. Bounded oscillation is acceptable.

---

## Scenario E: Perfectly Inelastic (e = 0.0)

| Check | Expected | Tolerance |
|-------|----------|-----------|
| Impact time | 1.3917 s | 0.01 s |
| Velocity after bounce | 0.0 m/s | 0.01 m/s |
| Final resting position (center y) | 0.5 m | 0.01 m |
| KE after impact | 0.0 J | 0.1 J |
| Subsequent bounces | None (0) | 0 |

Ball must remain stationary on the floor after impact.

---

## General Test Guidelines

### What constitutes a PASS:
1. Position values within stated tolerances of analytical values
2. Energy does not increase for e <= 1.0 (within 1% tolerance per bounce)
3. Bounce height follows e^(2n) decay pattern (within tolerance)
4. Ball rests correctly for e = 0.0

### What constitutes a FAIL:
1. Energy grows unboundedly (explicit Euler instability)
2. Ball tunnels through floor
3. Ball bounces higher than previous bounce (for e < 1.0) beyond tolerance
4. Velocity or position is NaN or Infinity
5. Ball moves horizontally when it should not

### Simulation length recommendations:
- Free fall: run for 1.5 s (past impact time)
- Single bounce: run for 4 s (past second impact)
- Multiple bounce: run for 10 s (past effective stop)
- Elastic bounce: run for 30 s (10+ bounce cycles, check for drift)
