---
from: pm
to: developer
date: 2026-03-29
status: read
subject: Phase 1 — Single Rigid Body Dynamics
---

# Phase 1 — Single Rigid Body Dynamics

**Goal:** One rigid body moving under gravity, bouncing off a floor plane.

Read the researcher's recommendations in your inbox (`2026-03-29-researcher-recommendations.md`) — they contain code patterns for everything below.

## Deliverables

### 1. Integrator (`src/physics/integrator.ts`)
Implement Semi-Implicit (Symplectic) Euler:
```
velocity += (force / mass) * dt
position += velocity * dt              // uses NEW velocity
angularVelocity += (torque / inertia) * dt
angle += angularVelocity * dt
```
- `integrateBody(body: RigidBody, dt: number): void` — mutates body in place
- `integrateWorld(world: World, dt: number): void` — integrates all non-static bodies
- Clear force/torque accumulators after integration
- Add optional velocity damping (small factor like 0.999)

### 2. Gravity (`src/physics/forces.ts`)
- `applyGravity(world: World): void` — applies `world.gravity * body.mass` as force to each non-static body

### 3. Collision Detection — Floor Only (`src/physics/collision.ts`)
For Phase 1, only implement collision with a ground plane at y=0:
- `Contact` interface: `{ bodyA, bodyB, normal, penetration, point }`
- `detectCircleFloor(body: RigidBody, floorY: number): Contact | null`
- `detectAABBFloor(body: RigidBody, floorY: number): Contact | null`
- `detectFloorCollisions(world: World, floorY: number): Contact[]`

### 4. Collision Response (`src/physics/response.ts`)
Implement impulse-based response:
- `resolveContact(contact: Contact): void`
- Normal impulse: `j = -(1 + e) * vn / (1/mA + 1/mB)`
- Position correction: push body out of floor by penetration depth
- For floor collisions, treat floor as static (infinite mass)

### 5. Simulation Step (`src/sim/simulation.ts`)
- `SimulationConfig`: dt, gravity, floorY, substeps
- `createSimulation(config): Simulation`
- `step(sim: Simulation): void` — one full simulation step:
  1. Apply forces (gravity)
  2. Integrate all bodies
  3. Detect collisions
  4. Resolve collisions
  5. Advance world time
- `getSnapshot(sim: Simulation): WorldSnapshot` — capture full state

### 6. Simple Demo
Create a minimal test scenario that you can verify:
- Drop a circle from height onto the floor
- Verify it bounces with decreasing height (restitution < 1)
- Verify it eventually comes to rest (or near rest)

## Coordination
- Work on branch `developer/phase1-dynamics`
- When complete, notify PM and tester inboxes
- Tester will validate with analytical solutions (free-fall comparison)
