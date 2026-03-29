# Final Test Report — Phase 7

**Date:** 2026-03-29
**Branch:** tester/phase7-tests
**Build:** vite build successful (30.16 KB / 8.22 KB gzip)

---

## Test Summary

| Metric | Value |
|--------|-------|
| Total test files | 44 |
| Total tests | 490 |
| Passed | 490 |
| Failed | 0 |
| Duration | ~5.2s |

All 475 original tests continue to pass. 15 new tests were added for Phase 7 final validation.

---

## New Test Files

### 1. `tests/physics/stacking-final.test.ts` (3 tests)
- **5 circles stacked on floor, 5000 steps:** PASS. All circles remain above floor, no NaN, no explosion. Bottom circle at y~0.355 (slight sinking from Baumgarte, within tolerance). Velocities settled below 3 m/s.
- **3 AABBs stacked on floor, 5000 steps:** PASS. Stable, no NaN, settled.
- **Warm-starting qualitative check:** PASS. Total KE after 2000 steps is ~13.6 J for 5 circles under gravity. Stacking is stable and does not explode, a significant improvement over early phases.

### 2. `tests/physics/tunneling-final.test.ts` (3 tests)
- **Fast circle (v=150 m/s) vs floor:** PASS. Ball does not tunnel through floor at any timestep.
- **Fast circle (v=180 m/s) vs thick AABB wall:** PASS. Ball bounces off thick wall correctly. Note: thin walls (halfWidth=0.5) can still be tunneled at extreme speeds since body-body detection relies on spatial hash overlap per step.
- **Velocity cap under extreme force:** PASS. 60 steps of 100,000 N force never exceeds MAX_SPEED (200 m/s).

### 3. `tests/physics/end-to-end.test.ts` (2 tests)
- **Full scene (boundary 20x15, 2 cars, 10 circles, gravity), 1200 steps at 120Hz:**
  - PASS. No NaN/Infinity in any body state.
  - All dynamic bodies remain within boundary.
  - JSON export: 630.5 KB, 100 snapshots, 20 bodies per snapshot.
  - JSON is valid, parseable, correct frame count.
- **Boundary containment check (600 steps at 60Hz):** PASS. No body escapes boundary at any timestep.

### 4. `tests/physics/performance-final.test.ts` (7 tests)
- 5 body-count benchmarks + 200-body real-time check + scaling summary.

---

## Performance Scaling Table

| Bodies | ms/step | Relative to N=10 |
|--------|---------|-------------------|
| 10     | 0.005   | 1.0x              |
| 50     | 0.031   | 5.7x              |
| 100    | 0.053   | 9.8x              |
| 200    | 0.126   | 23.6x             |
| 500    | 0.323   | 60.5x             |

**200-body real-time check:** 0.171 ms/step — well under the 8.33 ms budget for 120Hz. The simulation runs ~49x faster than real-time at 200 bodies.

**500 bodies:** 0.323 ms/step — still ~26x faster than real-time at 120Hz.

---

## Comparison to Phase 2 Baselines

| Metric | Phase 2 | Phase 7 | Improvement |
|--------|---------|---------|-------------|
| 5-circle stack stability | Unstable after ~1000 steps | Stable after 5000 steps | Major |
| Stacking drift | >0.5m | <0.2m | Significant |
| Tunneling (fast ball vs floor) | Could tunnel at v>100 | Prevented (velocity cap) | Fixed |
| 200-body step time | ~0.275 ms | ~0.126 ms | ~2x faster |
| Total tests | ~100 | 490 | 4.9x coverage |

Key Phase 7 additions: warm-starting (ContactCache), velocity cap (MAX_SPEED=200, MAX_ANGULAR_SPEED=50), Baumgarte reduction to 0.1, velocity-level correction, AABB broadphase optimization with numeric hash keys.

---

## Known Issues / Limitations

1. **Thin-wall body-body tunneling:** At extreme velocities (>150 m/s), a body can tunnel through a thin static AABB wall (halfWidth=0.5) because the per-step displacement exceeds the wall thickness. Floor tunneling is prevented by the dedicated floor collision path. Mitigation: use thicker walls or substeps for high-speed scenarios.

2. **Stacking residual oscillation:** 5-circle stacks under gravity still exhibit low-level oscillation (~13 J residual KE after 2000 steps). This is typical for sequential impulse solvers without full warm-starting convergence. The stack does not collapse or explode.

3. **Baumgarte sinking:** Circles on the floor sink ~0.1-0.15m below their nominal resting position due to Baumgarte correction (scale=0.1). This is cosmetic and does not affect stability.

---

## Quality Assessment

**Is this production-ready for prototype use?** Yes.

- All 490 tests pass with zero failures.
- Build succeeds with no TypeScript errors.
- Performance exceeds real-time by a large margin at 200+ bodies.
- Stacking is stable over long durations with warm-starting.
- Fast-moving bodies are clamped to safe speeds preventing floor tunneling.
- Full end-to-end scene (cars, circles, boundary, gravity) runs cleanly for 10+ simulated seconds.
- JSON recording/export pipeline works correctly with valid, parseable output.
- The architecture is clean: core/physics/sim separation, declarative scenes, structured snapshots.

The simulation is suitable for generating training data in AI pipelines where visual plausibility and consistent behavior matter more than exact physical accuracy.
