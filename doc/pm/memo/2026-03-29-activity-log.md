# PM Activity Log

## 2026-03-29

### 11:00 — Project Initialization
- Created project structure: CLAUDE.md, agent-protocol.md, master plan
- Set up agent directories (pm, developer, researcher, tester) with memo/ and inbox/
- Committed foundation to main (b4d5707)

### 11:05 — Phase 0 Kickoff
- Delivered Phase 0 task assignments to all agent inboxes
- Launching researcher and developer agents in parallel worktrees
- Researcher: integration methods survey, collision detection survey, collision response survey
- Developer: project scaffolding (TS/Vite/Vitest), math utilities (Vec2, Mat2), core data types
- Tester: on hold until developer scaffolding is complete

### 12:00 — Developer Phase 0 Complete
- Developer agent finished on branch `developer/phase0-scaffolding` (commit 656942e)
- Delivered: project scaffolding (TS/Vite/Vitest), Vec2 class, math utils, core types (Shape, RigidBody, World, Constraint stub)
- 24 tests passing (17 Vec2, 7 body)
- Merged to main successfully
- Developer notified tester via inbox that scaffolding is ready

### 12:03 — Tester Phase 0 Launched
- Tester agent launched in worktree on branch `tester/phase0-tests`
- Tasks: expand math test coverage, add shape/world tests, write test report
- Researcher still running (surveys in progress)

### 12:20 — Researcher Phase 0 Complete
- Researcher agent finished on branch `researcher/phase0-surveys` (commit 96d0e39)
- Merged to main successfully
- **Key decisions for project (from research):**
  - **Integrator**: Semi-Implicit (Symplectic) Euler — best stability/cost, industry standard
  - **Collision broad-phase**: Spatial Hashing — O(n), simple, good for similar-sized objects
  - **Collision narrow-phase**: SAT with shape-pair dispatch (circle-circle, circle-polygon, polygon-polygon, AABB-AABB)
  - **Collision response**: Impulse-based — physically grounded, clean visuals, staged implementation
  - **Fixed timestep**: 1/120s recommended
- Researcher delivered implementation-ready recommendations to developer inbox
- Tester still running (expanding test coverage)

### 12:07 — Tester Phase 0 Complete
- Tester agent finished on branch `tester/phase0-tests` (commit 6c1a146)
- Merged to main successfully
- **Results:** 123 tests, all passing. No bugs found in developer code.
- Coverage: Vec2 (51 tests), math utils (35 tests), body (25 tests), world (12 tests)
- Minor note: Vec2.negate()/perpendicular() produce IEEE-754 negative zeros in edge cases (not a bug)

### 12:08 — PHASE 0 COMPLETE
All three agents delivered. Main branch has:
- Full TS/Vite/Vitest scaffolding
- Vec2, Mat2, math utils
- Core types: Shape, RigidBody, World, Constraint stubs
- 123 passing tests
- Research surveys with clear recommendations (Symplectic Euler, Spatial Hashing + SAT, Impulse-based)

### 12:08 — Phase 1 Kickoff
- Phase 1 task assignments delivered to all agent inboxes
- Launching developer (physics implementation) and researcher (validation test cases) in parallel
- Tester will follow once both deliver

### 12:12 — Developer Phase 1 Complete
- Developer agent finished on branch `developer/phase1-dynamics` (commit b309d3b)
- Merged to main (fast-forward)
- Delivered:
  - `src/physics/integrator.ts` — Symplectic Euler (velocity-then-position)
  - `src/physics/forces.ts` — gravity application
  - `src/physics/collision.ts` — floor collision detection (circle + AABB)
  - `src/physics/response.ts` — impulse-based response with position correction
  - `src/sim/simulation.ts` — simulation runner with step(), getSnapshot(), substep support
- 20 new tests (143 total), all passing
- Developer notified tester that physics code is ready
- Researcher still running (analytical test cases)

### 12:13 — Researcher Phase 1 Complete
- Researcher finished on branch `researcher/phase1-validation` — merged to main
- Delivered analytical test cases for 5 scenarios with concrete numerical values:
  - Free fall: position/velocity at t=0.5s, 1.0s
  - Single bounce (e=0.8): impact time, bounce height, KE ratio
  - Multiple bounces (e=0.7): decay table for 10 bounces
  - Perfectly elastic (e=1.0): energy conservation over 10+ bounces
  - Perfectly inelastic (e=0.0): ball sticks to floor
- Accuracy assessment: symplectic Euler ~0.041m error/sec, bounded energy oscillation
- Recommended tolerances delivered to tester

### 12:14 — Tester Phase 1 Launched
- Tester agent launched for Phase 1 validation
- Will implement all 5 analytical test scenarios + stability + performance baseline
- This is the critical validation gate before Phase 2

### 12:17 — Tester Phase 1 Complete
- All 175 tests passing (32 new validation/stability/performance tests)
- Physics validated against analytical solutions — all within tolerances
- Performance baseline: **5,389x real-time** (120 steps in 0.19ms)
- No bugs found. One design note: `damping` not exposed in SimulationConfig (minor)
- Merged to main

### 12:17 — PHASE 1 COMPLETE
Single rigid body dynamics fully implemented and validated:
- Symplectic Euler integrator
- Gravity, floor collision detection (circle + AABB), impulse response
- Simulation runner with snapshots
- Validated: free fall, single/multiple bounces, elastic, inelastic
- 175 tests, all passing

### 12:18 — Phase 2 Kickoff
Launching all three agents for Phase 2: Multi-Body Collisions

### 12:20 — Researcher Phase 2 Complete
- Delivered multi-body test cases (5 scenarios) + performance scaling analysis
- Merged to main (fast-forward)

### 12:25 — Developer Phase 2 Complete
- Implemented: SpatialHash broad-phase, circle-circle/circle-AABB/AABB-AABB narrow-phase, sequential impulse solver with Baumgarte stabilization
- 198 tests passing (23 new). Merged to main.
- Performance still strong: 5,802x real-time for single body

### 12:25 — Tester Phase 2 Launched
- Validating multi-body collisions against researcher's analytical test cases
- Momentum conservation, energy, stacking stability, performance scaling

### 12:34 — Tester Phase 2 Complete
- 223 tests passing (25 new). Merged to main.
- Performance scaling: 200 bodies at 0.12ms/step (69x real-time). Sub-quadratic — spatial hash works.
- **Known issues identified (non-blocking for Phase 3, track for Phase 7):**
  1. Elastic KE loss ~15% — Baumgarte position correction absorbs energy (fundamental trade-off)
  2. Stacking instability — 3-circle stack bounces indefinitely, needs warm-starting/contact persistence
  3. Momentum conservation error ~5-8% — side effect of position correction
  4. These are expected for a basic sequential impulse solver without warm-starting

### 12:34 — PHASE 2 COMPLETE
Multi-body collisions working. 223 tests. Core physics issues documented for later optimization.
- Spatial hash broad-phase + SAT/direct narrow-phase
- Sequential impulse solver with Baumgarte stabilization
- Handles: circle-circle, circle-AABB, AABB-AABB collisions

### 12:35 — Phase 3 Kickoff
Launching agents for compound objects + constraints (joints, axles)

### 12:38 — Researcher Phase 3 Complete, merged
### 12:40 — Developer Phase 3 Complete
- Constraint solver (distance, revolute, fixed), Coulomb friction, compound objects (car, cart)
- 246 tests passing (23 new). Merged to main.
- Launching tester Phase 3

### 12:45 — Tester Phase 3 Complete
- 272 tests passing (26 new). No bugs. Merged to main.
- Constraints validated: pendulum swings correctly, double pendulum stable for 30s, car settles and rolls, breaking works
- Friction validated: reduces tangential velocity, higher μ = more deceleration
- Compound stress: 3 cars + loose circles stable

### 12:45 — PHASE 3 COMPLETE
Compound objects working. Constraint solver (distance, revolute, fixed), Coulomb friction, car/cart builders.
272 tests, all passing.

### 12:46 — Phase 4 Kickoff
Environment + structured output for AI training data

### 12:48 — Researcher Phase 4 Complete, merged
- Data schema analysis: JSON for prototype, 60Hz capture, comparison to PHYRE/IntPhys/CoPhy
### 12:52 — Developer Phase 4 Complete
- Environment (floor/wall/boundary), scene builder, snapshot system, recording with JSON export
- 307 tests passing (35 new). Merged.

### 12:55 — Tester Phase 4 Complete
- 331 tests passing (24 new). Merged.
- Environment, recording, snapshot round-trip, scene builder all validated.
- Recording: bouncing ball ~100KB, two cars ~600KB, settling scene ~1.2MB. All reasonable.

### PHASE 4 COMPLETE
Environment + AI training data output working. Scene builder, snapshot, recording with JSON export.

### 12:56 — Phase 5 Kickoff — Visualization

### 13:00 — Researcher Phase 5 Complete, merged (UX patterns + perturbation UI research)
### 13:05 — Developer Phase 5 Complete
- Full web viz: Canvas renderer, playback controller, live sim, UI controls, 3 demo scenes, index.html
- 349 tests passing (18 new renderer smoke tests). Merged.
- `npm run dev` should now serve the visualization!

### PHASE 5 COMPLETE
Web visualization working. Canvas renderer, playback with scrub, live sim, demo scenes.

### 13:06 — Phase 5 Tester + Phase 6 Prep

### 13:10 — Tester Phase 5 Complete
- 408 tests passing (59 new). Build verified. Merged.
- Playback controller fully tested. Renderer edge cases covered.

### PHASE 5 COMPLETE
Web visualization working. 408 tests. `npm run dev` serves interactive viewer.

### 13:11 — Phase 6 Kickoff — Interactive Perturbations
- No researcher needed (perturbation UI research done in Phase 5)
- Developer only, then tester follows

### 13:15 — Developer Phase 6 Complete, merged. 425 tests.
### 13:19 — Tester Phase 6 Complete. 466 tests. Merged.

### PHASE 6 COMPLETE
Interactive perturbations: force application, joint breaking, object dropping, perturbation logging.

### 13:20 — Phase 7 Kickoff — FINAL PHASE
Launching developer (polish + performance) and researcher (documentation) in parallel.

### 13:25 — Developer Phase 7 Complete, merged. 475 tests.
- Warm-starting, velocity cap, optimized broadphase (numeric keys), AABB pre-check, velocity-level correction
### 13:30 — Researcher Phase 7 Complete, merged.
- Algorithm reference, known limitations, future roadmap, research summary
### 13:35 — Tester Phase 7 Complete. 490 tests. Merged.
- Stacking stable (5 circles, 5000 steps), tunneling prevented, full end-to-end verified
- Performance: 200 bodies at 49x real-time, 500 bodies at 26x real-time
- Build succeeds, JSON export verified

### 13:35 — PROJECT COMPLETE
All 8 phases delivered. 490 tests passing. Full physics simulation with web visualization and AI training data export.

### Dependency Graph (Phase 0)
```
Researcher ──────────────────────────┐
  (surveys: integration, collision)  │
                                     ├──► Developer Phase 1
Developer ───────────────────────┐   │
  (scaffolding, math, types)     ├───┘
                                 │
                                 └──► Tester
                                       (test harness, math tests)
```
