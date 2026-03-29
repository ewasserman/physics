# Phase 1 Test Report

**Date:** 2026-03-29
**Tester:** tester
**Branch:** tester/phase1-tests

## Summary

All 32 new tests pass. No bugs found. The physics implementation is solid for Phase 1.

| Test File | Tests | Passed | Failed |
|-----------|-------|--------|--------|
| validation.test.ts | 22 | 22 | 0 |
| stability.test.ts | 8 | 8 | 0 |
| performance.test.ts | 2 | 2 | 0 |
| **Total (new)** | **32** | **32** | **0** |
| **Total (all, including existing)** | **175** | **175** | **0** |

## Validation Results by Scenario

### Scenario A: Free Fall
- Position at t=0.5s: within 0.025m tolerance (PASS)
- Position at t=1.0s: within 0.05m tolerance (PASS)
- Velocity at t=0.5s and t=1.0s: within 0.01 m/s tolerance (PASS)
- Energy conservation: within 0.5% (PASS)
- No horizontal drift (PASS)

### Scenario B: Single Bounce (e=0.8)
- Impact time near 1.39s (PASS)
- Bounce velocity near +10.92 m/s (PASS)
- Max height after bounce near 6.58m (PASS)
- KE ratio after/before bounce near 0.64 (PASS)

### Scenario C: Multiple Bounces (e=0.7)
- Bounce heights follow e^(2n) decay (PASS)
- Energy decreases monotonically (PASS)
- Ball effectively stops around bounce 10 +/- 2 (PASS)

### Scenario D: Perfectly Elastic (e=1.0)
- Ball returns to approximately original height after each bounce (PASS)
- Energy does not systematically increase over 10+ bounces (PASS)
- Bounce period consistent at ~2.78s (PASS)

### Scenario E: Perfectly Inelastic (e=0.0)
- Impact time near 1.39s (PASS)
- Zero velocity after impact (PASS)
- Rests at y=0.5m (PASS)
- Zero KE after impact (PASS)
- No subsequent bounces (PASS)

## Stability Results

- 10,000 steps with circle (e=0.7): no NaN, no Infinity, no energy explosion (PASS)
- Static body on floor: remains stationary over 1000 steps (PASS)
- Body at rest on floor (circle): no sinking, minimal jitter (PASS)
- Body at rest on floor (AABB): no sinking (PASS)
- AABB free fall: matches circle analytical values (PASS)
- AABB bounce: correct bounce velocity (PASS)
- AABB 10,000 steps: no NaN or Infinity (PASS)

## Performance Baseline

- 120 steps (1s sim-time) with 1 body: ~0.2ms
- Real-time factor: ~3500-6200x faster than real-time
- 12,000 steps (100s sim-time): ~5-6ms

Performance is excellent for Phase 1 single-body scenarios.

## Accuracy Observations

The symplectic Euler integrator performs as predicted by the researcher's accuracy analysis:
- Position error at t=1.0s is about 0.04m (undershooting), matching the O(dt) prediction
- Velocity is essentially exact at step boundaries for constant acceleration
- Energy oscillates rather than drifting, confirming symplectic behavior
- Elastic bounces (e=1.0) maintain height within tolerance over 10+ bounces

## Important Note: Default Damping

The tests use damping=1.0 (no damping) to match analytical predictions. The integrator defaults to damping=0.999, and the simulation runner (`step()` in simulation.ts) does not expose a damping parameter, so it always uses 0.999. This means:
- The `createSimulation`/`step` API will produce slightly different results from analytical predictions due to the implicit 0.999 damping factor
- For production use this is fine (slight energy dissipation is realistic)
- For test purposes, the validation tests bypass the simulation runner and call the physics functions directly with damping=1.0

**Recommendation for developer:** Consider adding a `damping` field to `SimulationConfig` so it can be controlled per-simulation.

## Bugs Found

None.

## Recommendations

1. **Add damping to SimulationConfig** — allow users to control damping per-simulation rather than relying on the integrator default
2. **Consider time-of-impact correction** — currently the collision is detected after penetration; a TOI correction would improve bounce timing accuracy
3. **Add resting contact handling** — the e=0.0 ball on the floor still experiences gravity each frame and gets pushed back by collision response; a sleep/resting mechanism would be more efficient
4. **Phase 2 readiness** — the physics core is solid; multi-body collision detection and body-to-body response are natural next steps
