---
from: pm
to: developer
date: 2026-03-29
status: read
subject: Phase 4 — Environment + Structured Output
---

# Phase 4 — Static Environment + AI Training Data Output

**Goal:** Static environment objects (walls, ramps, platforms) and a structured state snapshot/recording system for AI training data.

## Deliverables

### 1. Static Environment (`src/core/environment.ts`)
Build reusable static environment pieces:
- `createFloor(world, y, width): RigidBody` — wide static AABB at given y
- `createWall(world, x, y, height): RigidBody` — vertical static AABB
- `createBox(world, x, y, width, height): RigidBody` — static rectangular obstacle
- `createBoundary(world, left, right, bottom, top): RigidBody[]` — creates 4 walls forming a box boundary
- All return static RigidBody(s) already added to the world
- Environment bodies have `isStatic: true`, high friction (0.6), restitution 0.3

### 2. Scene Builder (`src/sim/scene.ts`)
Higher-level API to set up complete scenes:
```typescript
interface SceneConfig {
  width: number;        // world width
  height: number;       // world height
  gravity?: Vec2;
  dt?: number;
  objects: SceneObject[];  // what to place in the scene
}

type SceneObject =
  | { type: 'car', x: number, y: number }
  | { type: 'circle', x: number, y: number, radius: number, mass: number }
  | { type: 'box', x: number, y: number, width: number, height: number, mass: number }
  | { type: 'static-box', x: number, y: number, width: number, height: number }
  | { type: 'wall', x: number, y: number, height: number }

function createScene(config: SceneConfig): Simulation
```

### 3. State Snapshot System (`src/sim/snapshot.ts`)
Define the full state export format:

```typescript
interface BodySnapshot {
  id: number;
  shapeType: string;       // 'circle' | 'polygon' | 'aabb'
  position: { x: number, y: number };
  angle: number;
  velocity: { x: number, y: number };
  angularVelocity: number;
  mass: number;
  isStatic: boolean;
  // Shape-specific
  radius?: number;           // for circles
  halfWidth?: number;        // for AABB
  halfHeight?: number;       // for AABB
  vertices?: { x: number, y: number }[];  // for polygons
}

interface ConstraintSnapshot {
  type: string;
  bodyAId: number;
  bodyBId: number;
  broken: boolean;
}

interface ContactSnapshot {
  bodyAId: number;
  bodyBId: number;
  normal: { x: number, y: number };
  penetration: number;
  point: { x: number, y: number };
}

interface WorldSnapshot {
  time: number;
  step: number;
  bodies: BodySnapshot[];
  constraints: ConstraintSnapshot[];
  contacts: ContactSnapshot[];
}
```

- `captureSnapshot(sim: Simulation): WorldSnapshot`
- All Vec2 values serialized as `{x, y}` plain objects (JSON-friendly)

### 4. Simulation Recording (`src/sim/recording.ts`)
Record a full simulation run:
```typescript
interface SimulationRecording {
  config: SimulationConfig;
  snapshots: WorldSnapshot[];
  metadata: {
    totalSteps: number;
    totalTime: number;
    bodyCount: number;
    recordedAt: string;   // ISO timestamp
  };
}

function createRecorder(sim: Simulation): SimulationRecorder;
// SimulationRecorder has:
//   record(): void — capture current frame
//   stepAndRecord(): void — step sim then capture
//   getRecording(): SimulationRecording
//   exportJSON(): string
//   exportToFile(path: string): void  (Node.js only, optional)
```

- The recorder captures a snapshot every frame (or every N frames via config)
- `exportJSON()` returns the full recording as a JSON string
- Keep it efficient — don't deep-clone unnecessarily

### 5. Update Simulation
- Ensure `step()` tracks contacts from the current frame (store on simulation state)
- `getSnapshot()` should use the new snapshot format from snapshot.ts

### 6. Tests
- `tests/core/environment.test.ts`: create floor, wall, boundary — verify static, positioned correctly
- `tests/sim/scene.test.ts`: create scene with mixed objects, verify simulation runs
- `tests/sim/snapshot.test.ts`: capture snapshot, verify all fields present, verify JSON serializable
- `tests/sim/recording.test.ts`: record 100 steps, verify recording has 100 snapshots, verify export produces valid JSON, verify round-trip (parse JSON back)

### 7. Update exports

## Coordination
- Work on branch `developer/phase4-environment`
- Run `npm install` first
- Keep all 272 tests passing
- Notify PM and tester when done
