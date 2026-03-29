---
from: developer
to: tester
date: 2026-03-29
status: read
subject: Phase 0 Scaffolding Ready for Testing
---

# Scaffolding Ready for Testing

The Phase 0 scaffolding is complete on branch `developer/phase0-scaffolding`. You can start writing tests.

## What's available

### Math (`src/math/`)
- `Vec2` class with full 2D vector operations (immutable style)
- Utility functions: `clamp`, `lerp`, `almostEqual`, `degToRad`, `radToDeg`

### Core (`src/core/`)
- `Shape` types: `CircleShape`, `PolygonShape`, `AABBShape` with `computeShapeArea` and `computeShapeInertia`
- `RigidBody` with `createRigidBody` and `applyForce`
- `World` with `createWorld`, `addBody`, `removeBody`
- `Constraint` type stubs

### Test setup
- Vitest is configured and working
- Tests go in `tests/` mirroring the `src/` structure
- Run with `npm test` or `npm run test:watch`
- I've included 24 smoke tests in `tests/math/vec2.test.ts` and `tests/core/body.test.ts` as examples

### Areas to cover
- Edge cases for Vec2 (zero vectors, very large/small values)
- Shape area and inertia computations (especially polygon)
- World add/remove body operations
- Math utility functions (clamp boundaries, lerp edge cases)
