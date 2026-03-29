---
from: researcher
to: tester
date: 2026-03-29
status: read
subject: Phase 3 Test Cases — Constraints, Compound Objects, Friction
---

# Phase 3 Test Cases

Full details in `doc/researcher/memo/phase3-test-cases.md`. Here are the concrete values for test implementation.

---

## Scenario A: Simple Pendulum

**Setup:**
- Anchor: (0, 5), body mass=1 kg at (2, 5), distance constraint L=2 m, released from rest

**Key Values:**
- Period T = 3.35 s (90-degree correction from small-angle 2.838 s)
- Bottom position: (0, 3), velocity = 6.264 m/s horizontal
- Total energy = 19.62 J (conserved)

**Positions:**
| Time | Position |
|------|----------|
| 0.000 s | (2.0, 5.0) |
| 0.838 s | (0.0, 3.0) |
| 1.675 s | (-2.0, 5.0) |
| 2.513 s | (0.0, 3.0) |
| 3.350 s | (2.0, 5.0) |

**Tolerances:**
- Constraint distance: |pos - anchor| within 0.01 m of 2.0 m
- Energy drift: < 2% over 10 periods
- Period accuracy: within 10% of 3.35 s

---

## Scenario B: Double Pendulum

**Setup:**
- Anchor (0, 5), body1 mass=1 at (1.5, 5), body2 mass=1 at (3.0, 5)
- L1 = 1.5 m, L2 = 1.5 m, released from rest

**Key Values:**
- Total energy = 44.145 J (conserved)
- Constraint distances: 1.5 m each

**Tolerances:**
- Energy drift: < 5% over 30 seconds
- Constraint distance error: < 0.05 m
- No NaN/Inf, positions stay within 10 m of anchor

---

## Scenario C: Car on Flat Surface

**Setup:**
- Floor at y=0
- Chassis: AABB 2x0.5 m, mass=5 kg, center at (0, 1.15)
- Wheel 1: circle r=0.4 m, mass=1 kg, center at (-0.7, 0.4)
- Wheel 2: circle r=0.4 m, mass=1 kg, center at (0.7, 0.4)
- Revolute joints at wheel centers

**Test C1 — Settling:**
- Wheel centers settle to y = 0.4 (+/- 0.05)
- Vertical velocity approaches 0 within 2 seconds

**Test C2 — Horizontal Push:**
- Apply F=50 N horizontal to chassis for 0.5 s
- Expected velocity after push: 3.1 - 3.6 m/s (range accounts for rotational inertia)
- Wheels rotate: omega = v / r
- After force removed (no friction): constant velocity
- After force removed (friction mu=0.5): deceleration ~4.9 m/s^2

---

## Scenario D: Car on 30-Degree Ramp (theoretical, for future use)

- Rolling with friction: a = 4.29 m/s^2
- Sliding without friction: a = 4.905 m/s^2
- Cannot test until angled surfaces are implemented

---

## Scenario E: Constraint Breaking

**Setup:**
- Body mass=1 at (0, 0), anchor at (0, 5), distance constraint 5 m, breakForce=50 N

**Test E1 — Gravity only:** 9.81 N < 50 N, constraint holds
**Test E2 — Extra 50 N down:** total 59.81 N > 50 N, constraint breaks
**Test E3 — Ramp 0-60 N over 3 s:** breaks at t = 2.01 s (when external force = 40.19 N)

**Tolerances:**
- Constraint holds when total force < breakForce
- Breaks on the frame where force >= breakForce
- No NaN or position jumps at break moment

---

## Friction Reference Values

- Combined coefficient: geometric mean sqrt(mu_a * mu_b)
- Default mu = 0.5
- Rubber on concrete: 0.6-0.8
- Steel on steel: 0.4-0.6
- Ice: 0.03-0.05
- See `doc/researcher/memo/phase3-friction.md` for full details
