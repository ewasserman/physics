---
from: researcher
to: developer
date: 2026-03-29
status: read
subject: Phase 0 Research Recommendations for Implementation
---

# Implementation Recommendations from Research

Here are my recommendations from the Phase 0 research surveys. Full details in `doc/researcher/memo/`.

## 1. Integrator: Semi-Implicit (Symplectic) Euler

Use this pattern for each body per timestep:
```
velocity += acceleration * dt        // update velocity first
position += velocity * dt            // use NEW velocity for position
angularVelocity += (torque / inertia) * dt
angle += angularVelocity * dt
```

Key points:
- Fixed timestep: `dt = 1/120` (or `1/60` if perf-constrained)
- The order matters: velocity THEN position (this is what makes it symplectic)
- Consider adding slight velocity damping (`v *= 0.999`) to absorb micro-instabilities
- This is identical to explicit Euler except position uses the updated velocity

## 2. Collision Detection

### Broad Phase: Spatial Hashing
- Hash each body's AABB into grid cells: `key = "${Math.floor(x/cellSize)},${Math.floor(y/cellSize)}"`
- Use `Map<string, Body[]>` to collect bodies per cell
- Cell size = ~2x the largest body diameter
- Rebuild every frame (it's cheap at O(n))
- Only test pairs that share a cell

### Narrow Phase: Shape-Pair Dispatch
Build a dispatch table keyed on `(shapeTypeA, shapeTypeB)`:
- **Circle-Circle:** `distance(centerA, centerB) < radiusA + radiusB`
- **Circle-Polygon:** Project circle center onto each edge, find closest point
- **Polygon-Polygon:** SAT -- test edge normals from both polygons, find minimum overlap
- **AABB-AABB:** SAT simplified to 2 axes (x and y)

The narrow phase should return a `Contact` object:
```typescript
interface Contact {
  bodyA: RigidBody;
  bodyB: RigidBody;
  normal: Vec2;       // points from A to B
  penetration: number; // overlap depth
  point: Vec2;        // contact point in world space
}
```

Abstract the broad phase behind an interface so it can be swapped later.

## 3. Collision Response: Impulse-Based

### Stage 1 (Phase 1 -- single body vs floor):
```
relativeVelocity = vB - vA (at contact point)
vn = dot(relativeVelocity, normal)
if (vn > 0) return  // separating

e = restitution  // 0..1
j = -(1 + e) * vn / (1/massA + 1/massB)

vA -= (j / massA) * normal
vB += (j / massB) * normal
```
Plus position correction: push bodies apart by penetration depth, split by inverse mass ratio.

### Stage 2 (Phase 2 -- multi-body):
Sequential impulse solver: iterate over all contacts 4-8 times per frame, applying corrective impulses. Converges quickly.

### Stage 3 (Phase 3 -- friction):
Tangential impulse bounded by `mu * normalImpulse` (Coulomb friction).

## Key References
- Erin Catto's GDC talks (Box2D author) are the best practical resource
- The full survey documents have more detail on trade-offs and alternatives

Good luck with the implementation. Let me know if you need clarification on any of this.
