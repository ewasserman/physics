---
from: pm
to: developer
date: 2026-03-29
status: new
subject: Phase 2 — Multiple Bodies + Collisions
---

# Phase 2 — Multiple Bodies + Body-Body Collisions

**Goal:** N rigid bodies colliding with each other and the environment (floor).

## Deliverables

### 1. Broad-Phase Collision Detection (`src/physics/broadphase.ts`)
Implement spatial hashing (per researcher recommendation):
- `SpatialHash` class:
  - Constructor takes `cellSize: number`
  - `clear(): void`
  - `insert(body: RigidBody): void` — hash body's AABB into grid cells
  - `getPotentialPairs(): [RigidBody, RigidBody][]` — return unique pairs sharing cells
- `computeAABB(body: RigidBody): { min: Vec2, max: Vec2 }` — compute world-space AABB for any shape
- Cell key: `"${Math.floor(x/cellSize)},${Math.floor(y/cellSize)}"`
- Rebuild every frame (it's O(n) and simpler than incremental update)

### 2. Narrow-Phase: Body-Body Collision Detection (`src/physics/narrowphase.ts`)
Implement shape-pair dispatch for all combinations:
- `detectCollision(a: RigidBody, b: RigidBody): Contact | null`
- Shape pair handlers:
  - `circleVsCircle(a, b): Contact | null`
  - `circleVsAABB(a, b): Contact | null` (also covers AABB-vs-Circle via flip)
  - `aabbVsAABB(a, b): Contact | null`
  - `circleVsPolygon(a, b): Contact | null` (stretch goal — OK to defer to Phase 3)
  - `polygonVsPolygon(a, b): Contact | null` (stretch goal — SAT, OK to defer)
- Each returns a `Contact` with normal pointing from A to B, penetration depth, and contact point
- Handle static bodies (one or both can be static)

### 3. Update Collision System (`src/physics/collision.ts`)
Refactor the existing floor-only collision to work alongside the new system:
- `detectAllCollisions(world: World, floorY: number): Contact[]` — combines:
  1. Floor collisions (existing)
  2. Broad-phase → narrow-phase body-body collisions
- Use SpatialHash for broad phase with cellSize = 2 * maxBodyRadius (or a reasonable default)

### 4. Multi-Body Collision Response
Update `src/physics/response.ts`:
- `resolveContacts(contacts: Contact[]): void` — sequential impulse solver
  - Iterate over all contacts multiple times (4-8 iterations)
  - Each iteration applies corrective impulse to each contact
  - This converges to a stable solution for stacking/resting contact
- Add position correction with Baumgarte stabilization (small bias to prevent sinking):
  - `correction = max(penetration - slop, 0) * baumgarteScale / (invMassA + invMassB)`
  - Suggested: `slop = 0.01`, `baumgarteScale = 0.2`

### 5. Update Simulation (`src/sim/simulation.ts`)
- Wire in broadphase + narrowphase into the step() function
- Add `SpatialHash` to simulation state (reused each frame)
- Update `SimulationConfig` to include: `broadphaseCellSize`, `solverIterations`, `damping`
- The step function becomes:
  1. Apply forces (gravity)
  2. Integrate
  3. Detect all collisions (floor + body-body)
  4. Resolve contacts (sequential impulse, N iterations)
  5. Advance time

### 6. Tests
Write tests in `tests/physics/`:
- `broadphase.test.ts`: spatial hash insert, query, pair generation, no self-pairs, no duplicates
- `narrowphase.test.ts`: circle-circle overlap/separation, circle-AABB, AABB-AABB, contact normal direction
- `multi-body.test.ts`: two circles collide head-on (verify momentum conservation), circle bounces off static AABB, three-body pile-up stability

## Important Notes
- Run `npm install` first
- Keep all 175 existing tests passing
- The `Contact` interface already exists in `collision.ts` — reuse/extend it
- For body-body impulse: both bodies get velocity changes (unlike floor where only one moves)
- Sequential impulse: `for (let iter = 0; iter < solverIterations; iter++) { for (const contact of contacts) { resolveContact(contact); } }`

## Coordination
- Work on branch `developer/phase2-multi-body`
- Notify PM and tester inboxes when done
