---
from: researcher
to: pm
date: 2026-03-29
status: new
subject: Phase 0 Research Complete - Key Recommendations
---

# Phase 0 Research Complete

All three survey documents are ready in `doc/researcher/memo/`.

## Key Recommendations

### Integration Method: Semi-Implicit (Symplectic) Euler
- Best stability-to-cost ratio for real-time rigid-body simulation
- One force evaluation per step (cheapest possible)
- Symplectic property prevents energy drift -- objects don't spontaneously gain or lose energy
- Industry standard (Box2D, Bullet, PhysX all use this)
- Fixed timestep of 1/120s recommended

### Collision Detection: Spatial Hashing (Broad) + SAT with Specialized Tests (Narrow)
- **Broad phase:** Spatial hashing -- O(n), trivial to implement, works well for similar-sized objects
- **Narrow phase:** Shape-pair dispatch table:
  - Circle-Circle: direct distance test
  - Circle-Polygon: closest-point projection
  - Polygon-Polygon: SAT with MTV
  - AABB-AABB: simplified SAT (2 axes)
- SAT produces the Minimum Translation Vector, which is needed for position correction

### Collision Response: Impulse-Based
- Physically grounded (conservation of momentum + coefficient of restitution)
- Clean visual results (crisp bounces, no mushiness or jitter)
- Physical parameters (restitution, friction) are intuitive to tune
- Standard combination with symplectic Euler -- proven in all major engines
- Implementation staged: basic impulse first, then sequential impulse solver for multi-body, then friction

## Full Documents
- `doc/researcher/memo/integration-methods.md`
- `doc/researcher/memo/collision-detection.md`
- `doc/researcher/memo/collision-response.md`

Developer has been notified with the same recommendations.
