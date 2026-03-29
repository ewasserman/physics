# Phase 0 Test Report

**Date:** 2026-03-29
**Author:** Tester

## Summary

All 123 tests pass across 4 test files. The scaffolding is solid and well-structured.

## Test Inventory

| File | Tests | Status |
|------|-------|--------|
| `tests/math/vec2.test.ts` | 51 | PASS |
| `tests/math/utils.test.ts` | 35 | PASS |
| `tests/core/body.test.ts` | 25 | PASS |
| `tests/core/world.test.ts` | 12 | PASS |
| **Total** | **123** | **ALL PASS** |

## Coverage Areas

### Vec2 (51 tests)
- Construction, factory methods (`zero`, `fromAngle`)
- Arithmetic: add, sub, scale, negate (including zero/negative edge cases)
- Dot product: orthogonality, commutativity, self-dot = lengthSq
- Cross product: anti-commutativity, parallel vectors, magnitude
- Length/distance: zero vector, symmetry, distance to self
- Normalize: unit result, zero vector handling, direction preservation
- Rotation: 90/180/270/360 degrees, arbitrary angles, length preservation, negative angles
- Perpendicular: orthogonality check across multiple vectors, length preservation
- fromAngle: cardinal directions, unit length guarantee
- Clone/immutability verification
- Edge cases: very large values (1e15), very small values (1e-15)
- Algebraic properties: commutativity, associativity, inverse, scaling

### Math Utilities (35 tests)
- `clamp`: in range, below min, above max, boundary values, negative ranges, degenerate (min=max)
- `lerp`: t=0, t=0.5, t=1, extrapolation (t<0 and t>1), negative values, a=b
- `almostEqual`: equal values, within/outside epsilon, custom epsilon, symmetry, negatives
- `degToRad`: known conversions (0, 45, 90, 180, 360, negative)
- `radToDeg`: known conversions
- Round-trip: degToRad(radToDeg(x)) and radToDeg(degToRad(x))

### Body (25 tests)
- Default construction with all field verification
- Static body (infinite mass, zero inverse)
- Custom options respected
- Unique ID assignment (sequential from 0)
- Inertia computation: circle, AABB, polygon (unit square)
- Custom velocity, angular velocity, angle
- Initial force/torque are zero
- applyForce: accumulation, torque from off-center force, no torque at center, negative torque, torque accumulation
- computeShapeArea: circle, AABB, polygon (square, triangle, rectangle) with hand-verified values
- computeShapeInertia: circle, AABB, polygon with hand-verified values

### World (12 tests)
- Default creation (gravity, dt, time, empty bodies)
- Custom gravity and timestep
- Zero-gravity world
- addBody: single, multiple, unique ID verification
- removeBody: basic removal, selective removal, non-existent body (graceful), empty world, re-add after remove

## Issues Found

### Minor: IEEE 754 Negative Zero
`Vec2.negate()` on `Vec2.zero()` produces `Vec2(-0, -0)` and `Vec2.perpendicular()` on `(1, 0)` produces `(-0, 1)`. This is standard IEEE 754 behavior (`-1 * 0 = -0`) and not a bug in the implementation. Tests were written to use approximate comparison rather than strict `toBe(0)` for these cases.

**No functional bugs were found in the scaffolding code.**

## Recommendations
- Consider adding a `Vec2.equals(other, epsilon?)` method to simplify comparisons in future code.
- The polygon inertia computation uses the standard triangulation formula and matches expected values for a unit square. More complex polygon shapes should be tested as they are used.
