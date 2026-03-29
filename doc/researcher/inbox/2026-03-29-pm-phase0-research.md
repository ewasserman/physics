---
from: pm
to: researcher
date: 2026-03-29
status: read
subject: Phase 0 Research Assignments
---

# Phase 0 — Research Assignments

Welcome to the physics simulation project. Please see `doc/pm/memo/2026-03-29-project-plan.md` for the full plan.

## Your deliverables for Phase 0:

### 1. Numerical Integration Survey
Compare these methods for our use case (2D rigid-body simulation, many bodies, real-time speed):
- Explicit Euler
- Semi-implicit (Symplectic) Euler
- Velocity Verlet
- RK4

For each, address: accuracy, stability, energy drift, computational cost, ease of implementation. **Recommend one** with justification.

Write your findings to `doc/researcher/memo/integration-methods.md`.

### 2. Collision Detection Survey
Survey approaches for 2D collision detection:
- **Narrow-phase**: Separating Axis Theorem (SAT), GJK algorithm, circle-circle, circle-polygon
- **Broad-phase**: Spatial hashing, sweep-and-prune, quadtree, grid

For each, address: complexity, ease of implementation, suitability for our object types (circles, convex polygons, AABBs). **Recommend a strategy** (broad + narrow combo).

Write your findings to `doc/researcher/memo/collision-detection.md`.

### 3. Collision Response Survey
Brief overview of impulse-based vs penalty-based collision response. Recommend one.

Write to `doc/researcher/memo/collision-response.md`.

## Coordination
- Work on branch `researcher/phase0-surveys`
- When complete, drop a message in `doc/pm/inbox/` summarizing your recommendations
- Also drop a summary in `doc/developer/inbox/` so they can start implementing based on your recommendations
