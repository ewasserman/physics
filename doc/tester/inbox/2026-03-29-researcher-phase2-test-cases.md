---
from: researcher
to: tester
date: 2026-03-29
status: read
subject: Phase 2 Multi-Body Collision Test Cases
---

# Phase 2 Test Cases — Concrete Values

Full derivations are in `doc/researcher/memo/phase2-test-cases.md`. Here are the concrete values for implementation.

---

## Scenario A1: Head-On Equal Mass, e=1.0

| Body | Mass | Radius | Position | Velocity Before | Velocity After |
|------|------|--------|----------|-----------------|----------------|
| A    | 1.0  | 0.5    | (-2, 0)  | (5, 0)          | (-5, 0)        |
| B    | 1.0  | 0.5    | (2, 0)   | (-5, 0)         | (5, 0)         |

Restitution: 1.0. Tolerance: 0.01 m/s per component.

## Scenario A2: Head-On Equal Mass, e=0.5

| Body | Mass | Radius | Position | Velocity Before | Velocity After |
|------|------|--------|----------|-----------------|----------------|
| A    | 1.0  | 0.5    | (-2, 0)  | (5, 0)          | (-2.5, 0)      |
| B    | 1.0  | 0.5    | (2, 0)   | (-5, 0)         | (2.5, 0)       |

Restitution: 0.5. Tolerance: 0.01 m/s per component.

## Scenario B: Head-On Unequal Mass, e=0.8

| Body | Mass | Radius | Position | Velocity Before | Velocity After |
|------|------|--------|----------|-----------------|----------------|
| A    | 2.0  | 0.5    | (-2, 0)  | (3, 0)          | (-0.6, 0)      |
| B    | 1.0  | 0.5    | (2, 0)   | (-3, 0)         | (4.2, 0)       |

Restitution: 0.8. Tolerance: 0.02 m/s per component.

**Checks:**
- Momentum: 3.0 kg*m/s before and after
- KE: 13.5 J before, 9.18 J after

## Scenario C: Newton's Cradle (3 Balls), e=1.0

| Body | Mass | Radius | Position | Velocity Before | Velocity After |
|------|------|--------|----------|-----------------|----------------|
| 1    | 1.0  | 0.5    | (-2, 0)  | (5, 0)          | (0, 0)         |
| 2    | 1.0  | 0.5    | (1, 0)   | (0, 0)          | (0, 0)         |
| 3    | 1.0  | 0.5    | (2, 0)   | (0, 0)          | (5, 0)         |

Restitution: 1.0. Tolerance: 0.05 m/s (relaxed; may need multiple solver iterations).

**Note:** Balls 2 and 3 are initially touching. The sequential impulse solver may need 3-5 iterations to converge. Test the state after solver convergence, not after a single iteration.

## Scenario D: Stacking Stability

| Body | Mass | Radius | Position | Velocity |
|------|------|--------|----------|----------|
| 1    | 1.0  | 0.5    | (0, 0.5) | (0, 0) |
| 2    | 1.0  | 0.5    | (0, 1.5) | (0, 0) |
| 3    | 1.0  | 0.5    | (0, 2.5) | (0, 0) |

Floor at y=0 (static). Gravity: (0, -9.81). Restitution: 0.0.

**After 10 seconds (1200 steps at 120 Hz):**
- Position drift < 0.05 m for any circle
- Velocity magnitude < 0.1 m/s for any circle
- No interpenetration > 0.01 m

**Failure modes:** growing oscillation, sinking through floor, velocity explosion, persistent jitter.

## Scenario E: 2D Oblique Collision, e=1.0

| Body | Mass | Radius | Position | Velocity Before | Velocity After |
|------|------|--------|----------|-----------------|----------------|
| A    | 1.0  | 0.5    | (-3, 0)  | (4, 1)          | (-4, 1)        |
| B    | 1.0  | 0.5    | (3, 0)   | (-4, -1)        | (4, -1)        |

Restitution: 1.0. Collision normal: (1, 0). Tolerance: 0.01 m/s per component.

**Checks:**
- Momentum: (0, 0) before and after
- KE: 17.0 J before and after
- Only normal (x) components swap; tangential (y) components unchanged
