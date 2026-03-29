---
from: pm
to: developer
date: 2026-03-29
status: new
subject: Phase 3 — Compound Objects + Constraints
---

# Phase 3 — Compound Objects + Constraints

**Goal:** Joints (axles, hinges, fixed) connecting primitives into compound objects. Build a "car" as the showcase.

## Known Issues from Phase 2 (context, not your problem yet)
- Elastic KE loss ~15% from Baumgarte correction
- Stacking instability (needs warm-starting — Phase 7)
- These won't block Phase 3 but be aware of them

## Deliverables

### 1. Constraint Solver (`src/physics/constraints.ts`)
Implement constraint resolution using sequential impulse (same pattern as collision response):

**Distance Constraint (rigid rod):**
- Keeps two bodies at a fixed distance apart
- `DistanceConstraint { bodyA, bodyB, anchorA: Vec2, anchorB: Vec2, distance: number }`
- anchorA/B are local-space offsets from body center
- Resolution: compute world-space anchor positions, find error = actualDist - targetDist, apply corrective impulse along the constraint axis

**Revolute Constraint (axle/hinge):**
- Pins two bodies together at a shared point (they can rotate freely relative to each other)
- `RevoluteConstraint { bodyA, bodyB, anchorA: Vec2, anchorB: Vec2 }`
- Resolution: compute world-space anchors, find positional error, apply corrective impulse to make them coincide
- This is the key joint for wheels on axles

**Fixed Constraint (weld):**
- Locks two bodies together — no relative motion at all
- `FixedConstraint { bodyA, bodyB, anchorA: Vec2, anchorB: Vec2, referenceAngle: number }`
- Resolution: position correction (like revolute) + angular correction to maintain reference angle

Each constraint should have:
- `stiffness: number` (0-1, how rigidly enforced; 1.0 = rigid)
- `breakForce?: number` (if set, constraint breaks when force exceeds this — for Phase 6 breakage)

### 2. Constraint Integration (`src/physics/response.ts` or new solver)
Update the sequential impulse loop to include constraints:
```
for (iter = 0; iter < solverIterations; iter++) {
  for (const contact of contacts) resolveContact(contact);
  for (const constraint of constraints) resolveConstraint(constraint);
}
```

### 3. World Update (`src/core/world.ts`, `src/core/constraint.ts`)
- Flesh out the `Constraint` type from the Phase 0 stubs
- Add `constraints: Constraint[]` to World
- `addConstraint(world, constraint)` / `removeConstraint(world, constraint)`
- Update simulation step to pass constraints to solver

### 4. Compound Object Builder (`src/core/compound.ts`)
High-level API for building compound objects:
```typescript
// Example: build a "car"
function createCar(world: World, x: number, y: number): CompoundObject {
  const chassis = createRigidBody({ shape: createAABB(2, 0.5), position: new Vec2(x, y), mass: 5 });
  const wheelL = createRigidBody({ shape: createCircle(0.4), position: new Vec2(x - 1.5, y - 0.7), mass: 1 });
  const wheelR = createRigidBody({ shape: createCircle(0.4), position: new Vec2(x + 1.5, y - 0.7), mass: 1 });

  addBody(world, chassis);
  addBody(world, wheelL);
  addBody(world, wheelR);

  // Axles = revolute constraints
  const axleL = createRevoluteConstraint(chassis, wheelL, new Vec2(-1.5, -0.7), Vec2.zero());
  const axleR = createRevoluteConstraint(chassis, wheelR, new Vec2(1.5, -0.7), Vec2.zero());

  addConstraint(world, axleL);
  addConstraint(world, axleR);

  return { bodies: [chassis, wheelL, wheelR], constraints: [axleL, axleR] };
}
```

Provide:
- `CompoundObject` type: `{ bodies: RigidBody[], constraints: Constraint[] }`
- `createCompoundObject(world, bodies, constraints): CompoundObject`
- `createCar(world, x, y, options?): CompoundObject` — showcase compound object
- `createCart(world, x, y): CompoundObject` — simpler: 1 box + 2 wheels

### 5. Friction Model (`src/physics/friction.ts`)
Implement Coulomb friction for contacts:
- Compute tangent impulse: `jt = -dot(vRel, tangent) / (invMassA + invMassB)`
- Clamp: `|jt| <= mu * |jn|` where jn is the normal impulse
- Combined friction coefficient: `mu = sqrt(frictionA * frictionB)`
- Apply tangential impulse to both bodies
- Integrate friction into the contact resolution loop

### 6. Tests
- `tests/physics/constraints.test.ts`:
  - Distance constraint: two bodies connected, verify distance maintained after 100 steps
  - Revolute constraint: pendulum (body pinned to static anchor), verify swings without disconnecting
  - Fixed constraint: two bodies welded, verify they move as one
  - Constraint breaking: set breakForce, apply large force, verify constraint removed
- `tests/core/compound.test.ts`:
  - createCar: verify bodies and constraints created correctly
  - Car dropped onto floor: wheels should spin, chassis stays connected
  - Car on flat surface with gravity: should settle and be stable

### 7. Update exports
- `src/physics/index.ts` — re-export constraints, friction
- `src/core/index.ts` — re-export compound

## Coordination
- Work on branch `developer/phase3-constraints`
- Run `npm install` first
- Keep all 223 existing tests passing
- Notify PM and tester when done
