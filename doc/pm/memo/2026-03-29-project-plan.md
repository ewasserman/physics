# Physics Simulation Project — Master Plan

## Vision
Build a from-scratch rigid-body physics simulation that:
1. Models compound objects from geometric primitives + joints
2. Simulates dynamics with idealized physics (gravity, friction, elasticity, collisions)
3. Runs in an environment (floors, walls, buildings)
4. Produces structured state data at each timestep for AI training
5. Provides a web-based visualization with playback and user interaction (perturbations)

## Architecture (High Level)

```
┌──────────────────────────────────────────────────┐
│                  Visualization                    │
│   (Web Canvas — playback, scrub, perturbations)   │
├──────────────────────────────────────────────────┤
│                  Simulation API                   │
│   (step, snapshot, apply-force, query)            │
├──────────────────────────────────────────────────┤
│               Physics Engine Core                 │
│  ┌──────────┐ ┌──────────┐ ┌────────────────┐   │
│  │ Dynamics  │ │Collision │ │  Constraint /  │   │
│  │ (forces,  │ │Detection │ │  Joint Solver  │   │
│  │  integr.) │ │& Response│ │                │   │
│  └──────────┘ └──────────┘ └────────────────┘   │
├──────────────────────────────────────────────────┤
│               Scene / World Model                 │
│   (objects, primitives, joints, environment)      │
├──────────────────────────────────────────────────┤
│                Math Utilities                     │
│   (vectors, matrices, quaternions)                │
└──────────────────────────────────────────────────┘
```

## Phases

### Phase 0 — Foundation (Week 1)
**Goal:** Repo structure, tooling, math utilities, basic data types.

- **Researcher**: Survey numerical integration methods (Euler, Verlet, RK4) — recommend one for our use case. Survey collision detection approaches (SAT, GJK, spatial partitioning). Summarize trade-offs.
- **Developer**: Set up project scaffolding (TypeScript, build, test). Implement math utilities (Vec2/Vec3, Mat3/Mat4, Quaternion). Define core data types (RigidBody, Shape, World, Constraint).
- **Tester**: Set up test harness. Write unit tests for math utilities.
- **PM**: Write initial task assignments (inbox messages to all agents).

### Phase 1 — Single Rigid Body Dynamics (Week 2)
**Goal:** One rigid body moving under gravity, bouncing off a floor.

- **Researcher**: Validate integrator choice with simple test cases. Research coefficient of restitution models.
- **Developer**: Implement integrator (position, velocity, angular). Implement gravity. Implement plane-body collision detection + response.
- **Tester**: Test free-fall accuracy (compare to analytic solution). Test bounce behavior. Energy conservation checks.

### Phase 2 — Multiple Bodies + Collisions (Week 3)
**Goal:** N rigid bodies colliding with each other and the environment.

- **Researcher**: Research broad-phase collision strategies (sweep-and-prune, spatial hashing). Research impulse-based collision resolution.
- **Developer**: Implement body-body collision detection (convex shapes). Implement collision response (impulse method). Implement broad-phase acceleration.
- **Tester**: Multi-body collision scenarios. Performance benchmarks. Stability tests (stacking, resting contact).

### Phase 3 — Compound Objects + Constraints (Week 4)
**Goal:** Joints (axles, hinges, fixed) connecting primitives into compound objects.

- **Researcher**: Research constraint solvers (sequential impulse, PGS). Research joint types needed.
- **Developer**: Implement constraint/joint system. Build compound object API ("car" = 4 discs + 2 axles + prism). Implement friction model.
- **Tester**: Test compound object stability. Test joint limits and breakage. "Car on a ramp" scenario.

### Phase 4 — Environment + Structured Output (Week 5)
**Goal:** Static environment objects. Snapshot/export system for AI training data.

- **Researcher**: Define output schema for AI training (what state variables, what format). Research what representations work best for downstream ML.
- **Developer**: Implement static environment (floor, walls, ramps, buildings as static bodies). Implement state snapshot system (JSON export of full world state at each step). Implement simulation recording (full run as a sequence of snapshots).
- **Tester**: Validate snapshot completeness. Round-trip test (load snapshot → resume simulation). Performance under recording.

### Phase 5 — Visualization (Week 6)
**Goal:** Web-based viewer with playback and interaction.

- **Developer**: HTML5 Canvas (2D) or WebGL (3D) renderer. Playback controls (play, pause, step, scrub timeline). Camera controls.
- **Researcher**: UX patterns for physics sandboxes. What perturbation UI works well.
- **Tester**: Visual regression tests (screenshot comparison). UI interaction tests.

### Phase 6 — Interactive Perturbations (Week 7)
**Goal:** User can apply forces, break joints, add objects mid-simulation.

- **Developer**: Click-to-apply-force. Joint breakage UI. Drop object at cursor. Perturbation recorded in simulation log.
- **Tester**: Perturbation correctness tests. Undo/redo if applicable.

### Phase 7 — Polish + Performance (Week 8)
**Goal:** Optimization, edge cases, documentation.

- **Developer**: Profiling and optimization. Handle edge cases (tunneling, degenerate collisions).
- **Tester**: Stress tests (100+ objects). Long-running stability. Full integration test suite.
- **Researcher**: Document algorithms used, accuracy characteristics, known limitations.

## 2D vs 3D Decision
**Start in 2D.** This dramatically simplifies Phase 0-4 (no quaternions for rotation, simpler collision geometry, easier visualization). Extend to 3D in a later iteration once the 2D system is proven. The architecture should be designed so that the jump to 3D is a matter of swapping Vec2→Vec3 and adding rotational DOFs, not a rewrite.

## Technology Choices
| Concern | Choice | Rationale |
|---------|--------|-----------|
| Language | TypeScript | Runs in browser (viz) and Node (CLI sim). Strong typing. |
| Build | Vite | Fast dev server, good for web viz. |
| Test | Vitest | Fast, TS-native, compatible with Vite. |
| Math | In-house | Keep it small, tailored. Maybe gl-matrix if 3D later. |
| Viz | HTML5 Canvas (2D) | Simple, performant for 2D. WebGL later if needed. |
| Output | JSON / MessagePack | JSON for readability, MessagePack option for bulk. |

## State & Dynamical Variables (Initial Design)
Per rigid body per timestep:
- `position: Vec2` — center of mass
- `angle: number` — rotation (radians)
- `velocity: Vec2` — linear velocity
- `angularVelocity: number` — angular velocity
- `force: Vec2` — net force this step (for analysis)
- `torque: number` — net torque this step

World state per timestep:
- `time: number`
- `bodies: BodyState[]`
- `contacts: ContactInfo[]` — active contact points
- `constraints: ConstraintState[]` — joint states (broken? stress?)

## Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| Collision detection complexity | Start with circles + AABB, add convex polygons incrementally |
| Numerical instability | Use semi-implicit Euler or Verlet; add damping; researcher validates |
| Scope creep to 3D too early | Hard gate: 2D must be complete before 3D starts |
| Agent coordination conflicts | Superset.sh worktrees isolate work; merges are deliberate |
| Performance | Profile early (Phase 2); spatial partitioning for broad-phase |
