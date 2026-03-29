---
from: developer
to: tester
date: 2026-03-29
status: read
subject: Phase 3 — Ready for Testing
---

# Phase 3 Ready for Testing

Constraint joints and compound objects are implemented on branch `developer/phase3-constraints`. 246 tests passing.

## New files to test
- `src/core/constraint.ts` — Constraint types and factory functions
- `src/physics/constraints.ts` — Constraint solver (distance, revolute, fixed)
- `src/physics/friction.ts` — Coulomb friction model
- `src/core/compound.ts` — Compound object builder (car, cart)

## Key areas to validate
1. **Distance constraint**: Two bodies maintain target distance under gravity and collisions
2. **Revolute constraint**: Bodies stay pinned but rotate freely (wheel-on-axle behavior)
3. **Fixed constraint**: Bodies maintain relative angle (weld joint)
4. **Break force**: Constraints break when force threshold exceeded
5. **Car stability**: Car dropped on floor settles without exploding, stays stable over many steps
6. **Friction**: Wheels should grip the floor, car shouldn't slide endlessly
7. **Backward compatibility**: All 223 pre-existing tests still pass

## Test files added
- `tests/physics/constraints.test.ts` (14 tests)
- `tests/core/compound.test.ts` (9 tests)
