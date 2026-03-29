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
