# Phase 3 Test Report — Constraints, Friction, Compound Objects

**Date:** 2026-03-29
**Tester:** tester
**Branch:** tester/phase3-tests
**Status:** PASS

## Summary

26 new tests added across 3 test files. All 272 tests pass (246 pre-existing + 26 new). No bugs found.

## Test Files

### 1. `tests/physics/constraint-validation.test.ts` — 16 tests

**Scenario A: Simple Pendulum** (4 tests)
- Constraint distance stays within 0.2m of target 2m over one period — PASS
- No NaN over 402 steps — PASS
- Energy roughly conserved (within 30%) — PASS
- Bob swings below anchor, reaching near y=3 — PASS

**Scenario B: Double Pendulum** (4 tests)
- 30-second run (3600 steps) without NaN — PASS
- Constraint distances stay within 0.5m tolerance — PASS
- Positions bounded within 10m of anchor — PASS
- Energy bounded (no runaway gain) — PASS

**Scenario C: Car on Flat Surface** (4 tests)
- 500 steps without NaN — PASS
- Wheels above floor — PASS
- Chassis stays connected to wheels, constraints intact — PASS
- Horizontal push accelerates the car — PASS

**Scenario E: Constraint Breaking** (4 tests)
- Constraint holds under gravity alone (9.81 N < 50 N threshold) — PASS
- Constraint breaks with 50 N applied force (total ~60 N > 50 N) — PASS
- No NaN at moment of breaking — PASS
- Body moves freely after constraint breaks — PASS

### 2. `tests/physics/friction-validation.test.ts` — 5 tests

- Friction reduces tangential velocity in body-body collision — PASS
- Without friction (mu=0), tangential velocity unchanged — PASS
- Higher friction coefficient produces more deceleration — PASS
- Circle sliding on floor doesn't gain speed — PASS
- Combined friction coefficient is geometric mean (mu=0 zeroes out) — PASS

### 3. `tests/physics/compound-stress.test.ts` — 5 tests

- 3 cars dropped, 1000 steps — no NaN, no explosion, constraints hold — PASS
- 3 cars settle above floor — PASS
- Car + 5 loose circles, 500 steps — stable — PASS
- Cart dropped and pushed — no NaN — PASS
- Single car survives 2000 steps — PASS

## Observations

1. **Constraint solver is approximate but stable.** Distance constraints maintain target within ~0.2m for pendulums with high solver iterations (20) and substeps (4). With fewer iterations, drift increases but stays bounded.

2. **Energy drift is present but acceptable.** The sequential impulse solver leaks some energy. For the simple pendulum, energy stays within 30% of the analytical value. For compound objects with damping, this is not a concern.

3. **Constraint breaking works correctly.** Constraints break when force exceeds the threshold and are properly removed from the world. Bodies move freely afterward.

4. **Friction model is functional.** Coulomb friction correctly reduces tangential velocity, respects mu=0 (frictionless), and higher coefficients produce more deceleration. The geometric mean combination formula is verified.

5. **Compound objects are stable under stress.** Multiple cars in a scene with gravity, collisions, and loose objects run for 1000+ steps without NaN or explosion.

## Tolerances Used

- Constraint distance: 0.2m (simple pendulum), 0.5m (double pendulum)
- Energy conservation: 30% (generous due to solver energy drift)
- Position bounds: 200m (explosion detection)
- Car wheel-chassis distance: < 5m

## Backward Compatibility

All 246 pre-existing tests continue to pass. No regressions.
