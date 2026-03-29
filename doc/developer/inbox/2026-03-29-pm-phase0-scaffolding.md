---
from: pm
to: developer
date: 2026-03-29
status: read
subject: Phase 0 Development Tasks
---

# Phase 0 — Development Tasks

Welcome to the physics simulation project. See `doc/pm/memo/2026-03-29-project-plan.md` for the full plan.

## Your deliverables for Phase 0:

### 1. Project Scaffolding
Set up the project structure:
```
src/
  math/          # Vec2, Mat2, math utilities
  core/          # RigidBody, Shape, World, Constraint types
  physics/       # Integrator, collision, forces
  sim/           # Simulation runner, snapshot, recording
  viz/           # Visualization (later phases)
tests/
  math/
  core/
  physics/
```
- Initialize `package.json` with TypeScript, Vite, Vitest
- Set up `tsconfig.json`
- Add a basic build and test script

### 2. Math Utilities
Implement in `src/math/`:
- `Vec2` class: add, sub, scale, dot, cross (scalar), length, normalize, rotate
- `Mat2` class (optional for Phase 0, needed later): multiply, transpose, inverse
- Utility functions: `clamp`, `lerp`, `almostEqual`

### 3. Core Data Types
Define in `src/core/`:
- `Shape` (discriminated union): `Circle { radius }`, `Polygon { vertices }`, `AABB { halfExtents }`
- `RigidBody`: position, angle, velocity, angularVelocity, mass, inertia, shape, restitution, friction, isStatic
- `World`: bodies[], gravity, time, dt
- `Constraint` (stub for Phase 3): type, bodyA, bodyB

### 4. Wait for Researcher Input
The researcher is surveying integration and collision methods. Once they post recommendations in your inbox, use those to guide Phase 1 implementation choices. For now, scaffold the structure and implement math.

## Coordination
- Work on branch `developer/phase0-scaffolding`
- When complete, drop a message in `doc/pm/inbox/` and `doc/tester/inbox/`
