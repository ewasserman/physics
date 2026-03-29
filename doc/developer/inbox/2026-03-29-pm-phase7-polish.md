---
from: pm
to: developer
date: 2026-03-29
status: new
subject: Phase 7 — Polish + Performance
---

# Phase 7 — Polish + Performance Optimization

**Goal:** Optimization, edge cases, and final integration. Make it production-quality.

## Known Issues to Fix

### From Phase 2 Testing:
1. **Elastic KE loss ~15%** from Baumgarte position correction. Mitigation: reduce Baumgarte scale, or add velocity-level correction (pseudo-velocity) to compensate.
2. **Stacking instability** — 3+ circles stacked bounce indefinitely. Fix: implement contact warm-starting (cache impulses from previous frame, apply at start of next frame).
3. **Momentum conservation error ~5-8%**. Related to Baumgarte — reducing it helps.

### General Edge Cases:
4. **Tunneling** — fast-moving small bodies can pass through thin walls. Mitigation: CCD (continuous collision detection) or at minimum a velocity cap.
5. **Degenerate collisions** — very thin penetrations, nearly parallel edges. Ensure no NaN.
6. **Damping config** — `damping` parameter should be exposed in SimulationConfig (noted by tester in Phase 1).

## Deliverables

### 1. Warm-Starting (`src/physics/warmstart.ts`)
- Cache contact impulses from previous frame (keyed by body pair ID)
- At start of each frame, apply cached impulses to contact pairs that persist
- This dramatically improves stacking stability and convergence speed
- `ContactCache` class with `store(contacts, impulses)` and `retrieve(bodyA, bodyB): number`

### 2. Velocity-Level Constraint Correction
In `src/physics/response.ts`:
- After position correction, also apply velocity bias to prevent drift
- `velocityBias = baumgarteScale * penetration / dt` (push apart at velocity level too)
- This reduces energy absorption from position correction

### 3. Velocity Cap / CCD Lite
In `src/physics/integrator.ts`:
- Add max velocity cap: `const maxSpeed = 100; if (v.length() > maxSpeed) v = v.normalize().scale(maxSpeed);`
- This prevents tunneling for most practical cases without full CCD

### 4. Expose Damping in Config
In `src/sim/simulation.ts`:
- Ensure `damping` is passed through to the integrator
- Default: 0.999 (current behavior)

### 5. Performance Profiling + Optimization
- Profile the simulation step with 200 bodies — identify bottleneck
- Optimize spatial hash if needed (avoid string keys, use integer hash)
- Optimize narrow phase (early-exit on AABB pre-check)
- Target: 200 bodies at 120Hz with headroom

### 6. Final Integration Tests
- `tests/physics/warmstart.test.ts`: stacking 5 circles, verify stable after 2000 steps
- `tests/physics/tunneling.test.ts`: fast ball aimed at thin wall, verify no pass-through
- `tests/physics/final-integration.test.ts`:
  - Full scene: boundary box, 2 cars, 10 circles, gravity, record 10s, export JSON
  - Verify: no NaN, all bodies in bounds, recording valid, JSON parseable
  - Performance: 200 bodies, measure step time, log result

### 7. Documentation
- Update CLAUDE.md with final architecture notes
- Write `doc/pm/memo/project-summary.md` — final state of the project

## Coordination
- Work on branch `developer/phase7-polish`
- This is the final phase — make it solid
- Notify PM and tester when done
