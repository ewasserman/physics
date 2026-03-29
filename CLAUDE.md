# Physics Simulation Project

## Project Overview
A from-scratch physical object simulation system. Compound objects are built from primitives (discs, prisms, etc.) connected by idealized joints/axles. The system simulates rigid-body dynamics with approximate physics (friction, elasticity, collisions) prioritizing visual realism and speed over exact accuracy. The output is structured data (positions, velocities, forces at each timestep) suitable for AI training pipelines.

## Agent Team
| Agent | Directory | Role |
|-------|-----------|------|
| PM (project-manager) | `doc/pm/` | Planning, coordination, task assignment |
| Developer | `doc/developer/` | Implementation |
| Researcher | `doc/researcher/` | Technical research, algorithm selection |
| Tester | `doc/tester/` | Testing, validation, benchmarking |

## Agent Communication Protocol
- Each agent has `doc/<agent>/memo/` (private notes) and `doc/<agent>/inbox/` (messages from others).
- Messages are markdown files named `YYYY-MM-DD-<from>-<subject>.md`.
- Messages include a `status:` frontmatter field: `new`, `read`, `done`.
- Agents check their inbox at the start of each session.
- All communication stays in the repo — no external channels.

## Orchestration
- **Superset.sh** is used to run agents in isolated worktrees, preventing conflicts.
- Each agent works on a feature branch in its own worktree, merges to `main` when complete.
- Branch naming: `<agent>/<short-description>` (e.g., `developer/rigid-body-core`).

## Code Conventions
- Language: TypeScript (simulation engine + visualization)
- Build: Node.js with esbuild or Vite
- Testing: Vitest
- Visualization: HTML5 Canvas / WebGL
- All source code under `src/`
- All tests under `tests/`

## Key Principles
- Built from scratch — no physics engine libraries (e.g., no Matter.js, Cannon.js, Rapier)
- Math/linear-algebra utilities may be written in-house or use a small library (e.g., gl-matrix)
- Approximate physics is fine; visual plausibility over exactness
- Performance matters — the sim must run faster than real-time
- Output structured state snapshots for AI training consumption

## Architecture Summary

### Core (`src/core/`)
- **`body.ts`** — `RigidBody` interface and `createRigidBody()` factory. Bodies have position, velocity, angle, angular velocity, mass, shape, restitution, friction.
- **`shape.ts`** — Shape types: `Circle`, `AABB`, `Polygon`. Factory functions `createCircle()`, `createAABB()`, `createPolygon()`. Inertia computation.
- **`world.ts`** — `World` container holding bodies, constraints, gravity, and time. `addBody()`, `addConstraint()`, `removeConstraint()`.
- **`constraint.ts`** — `Constraint` interface with revolute joints. Supports breaking threshold.
- **`compound.ts`** — Compound objects (e.g., `createCar()`) — multiple bodies connected by constraints.
- **`environment.ts`** — Static environment builders: `createFloor()`, `createWall()`, `createBoundary()`, `createBox()`.

### Math (`src/math/`)
- **`vec2.ts`** — Immutable 2D vector class with add, sub, scale, dot, cross, normalize, rotate, etc.

### Physics (`src/physics/`)
- **`integrator.ts`** — Symplectic Euler integration with velocity cap (`MAX_SPEED=200`, `MAX_ANGULAR_SPEED=50`) to prevent tunneling.
- **`forces.ts`** — Gravity application.
- **`broadphase.ts`** — `SpatialHash` using numeric hash keys for fast broad-phase collision detection. Includes `computeAABB()` and `aabbOverlap()`.
- **`narrowphase.ts`** — Circle-circle, circle-AABB, AABB-AABB collision detection with AABB pre-check before detailed tests.
- **`collision.ts`** — Floor collision detection and `detectAllCollisions()` orchestrator.
- **`response.ts`** — Sequential impulse solver with Baumgarte stabilization (scale=0.1), velocity-level correction for body-body contacts, and warm-starting support via `ContactCache`.
- **`warmstart.ts`** — `ContactCache` class that stores per-frame impulses keyed by body pair for warm-starting the solver.
- **`constraints.ts`** — Iterative constraint solver (position-based) with break detection.
- **`friction.ts`** — Coulomb friction model applied during collision response.

### Simulation (`src/sim/`)
- **`simulation.ts`** — Top-level `Simulation` interface with `createSimulation()` and `step()`. Manages substeps, broadphase, solver, warm-starting, and damping. `SimulationConfig` exposes dt, gravity, floorY, substeps, solverIterations, damping, broadphaseCellSize.
- **`scene.ts`** — Declarative scene builder from `SceneConfig` with object types: car, circle, box, static-box, wall.
- **`recording.ts`** — `SimulationRecorder` for capturing snapshots at configurable intervals. Exports to JSON.
- **`snapshot.ts`** — Serializable world state snapshots (bodies, constraints, contacts) for JSON export.
- **`perturbation.ts`** — Runtime perturbation system (apply forces, break constraints, drop bodies).

### Visualization (`src/viz/`)
- Web-based HTML5 Canvas visualization with playback controls.

### Tests (`tests/`)
- 475 tests covering unit tests, validation scenarios, stress tests, stacking stability, tunneling prevention, and full integration.
