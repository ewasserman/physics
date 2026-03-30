# Physics Simulation — User Guide

A from-scratch 2D rigid-body physics simulation. Build scenes from primitives (circles, boxes, polygons) connected by joints, simulate them with approximate but visually plausible physics, and export structured state data suitable for AI training pipelines.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Core Concepts](#core-concepts)
3. [Creating Scenes](#creating-scenes)
4. [Simulation Configuration](#simulation-configuration)
5. [Running a Simulation](#running-a-simulation)
6. [Recording and Exporting Data](#recording-and-exporting-data)
7. [Snapshot Format](#snapshot-format)
8. [Perturbation Logging](#perturbation-logging)
9. [Visualization](#visualization)
10. [Low-Level API](#low-level-api)

---

## Getting Started

### Prerequisites

- Node.js (v18+)

### Install and Run

```bash
npm install
npm run dev       # start the dev server (Vite)
```

Open the URL printed in the terminal. You'll see three demo buttons:

- **Bouncing** — 5 circles bouncing in a walled box
- **Car Crash** — 2 cars driving toward each other
- **Rain** — 20 circles falling and settling

Click one to launch a live simulation with playback controls, camera pan/zoom, and interaction tools.

### Run Tests

```bash
npm test          # run all 475+ tests once
npm run test:watch # re-run on file changes
```

### Build for Production

```bash
npm run build     # outputs to dist/
```

---

## Core Concepts

### Bodies

A **rigid body** is the fundamental simulated object. Every body has:

| Property | Description |
|---|---|
| `position` | Center of mass (Vec2) |
| `velocity` | Linear velocity (Vec2) |
| `angle` | Rotation in radians |
| `angularVelocity` | Rotational speed (rad/s) |
| `mass` | Mass (static bodies use Infinity) |
| `shape` | Collision geometry (circle, AABB, or polygon) |
| `restitution` | Bounciness, 0 to 1 (default 0.5) |
| `friction` | Surface friction, 0 to 1 (default 0.3) |
| `isStatic` | If true, the body never moves |

### Shapes

Three shape types are supported:

- **Circle** — defined by a radius
- **AABB** (axis-aligned bounding box) — defined by half-width and half-height
- **Polygon** — defined by an array of vertices

### Constraints

Constraints connect two bodies. Currently the system supports **revolute joints** (pin joints that allow free rotation). Constraints can have a **breaking threshold** — when forces exceed it, the joint snaps.

### Compound Objects

Compound objects are groups of bodies connected by constraints. The built-in `createCar()` factory produces a chassis (AABB) with two wheels (circles) attached via revolute joints.

### World

The **world** is the container that holds all bodies, constraints, and global state (gravity, elapsed time).

---

## Creating Scenes

The simplest way to set up a simulation is the **declarative scene API**:

```typescript
import { createScene, SceneConfig } from './src/sim/scene.js';

const config: SceneConfig = {
  width: 20,       // world width (centered at x=0)
  height: 15,      // world height (floor at y=0)
  gravity: { x: 0, y: -9.81 },  // optional, this is the default
  dt: 1 / 60,                    // optional, this is the default
  objects: [
    { type: 'car', x: -5, y: 2 },
    { type: 'car', x: 5, y: 2 },
    { type: 'circle', x: 0, y: 10, radius: 0.5, mass: 1 },
    { type: 'box', x: 3, y: 8, width: 1, height: 1, mass: 2 },
    { type: 'static-box', x: 0, y: 5, width: 6, height: 0.5 },
    { type: 'wall', x: -3, y: 3, height: 4 },
  ],
};

const sim = createScene(config);
```

`createScene()` automatically creates boundary walls and a floor, then spawns all listed objects.

### Object Types

| Type | Required Fields | Description |
|---|---|---|
| `car` | `x`, `y` | Chassis + 2 wheels with revolute joints |
| `circle` | `x`, `y`, `radius`, `mass` | Dynamic circle |
| `box` | `x`, `y`, `width`, `height`, `mass` | Dynamic rectangle |
| `static-box` | `x`, `y`, `width`, `height` | Immovable rectangle (platform, ledge) |
| `wall` | `x`, `y`, `height` | Thin immovable vertical barrier |

---

## Simulation Configuration

When you need finer control, create a simulation directly:

```typescript
import { createSimulation } from './src/sim/simulation.js';

const sim = createSimulation({
  dt: 1 / 60,              // timestep per frame (seconds)
  gravity: { x: 0, y: -9.81 },
  floorY: 0,               // y-coordinate of the collision floor
  substeps: 4,             // subdivide each frame for stability
  solverIterations: 10,    // constraint/contact solver passes
  broadphaseCellSize: 2,   // spatial-hash cell size
  damping: 0.01,           // velocity damping per frame (0 = none)
});
```

All fields are optional — sensible defaults are provided.

### Tuning Tips

| Parameter | Default | When to Adjust |
|---|---|---|
| `substeps` | 1 | Increase (4-8) for stacking scenes or fast-moving objects to prevent tunneling |
| `solverIterations` | 8 | Increase (12-20) if stacks jitter or constraints drift |
| `damping` | 0 | Add small damping (0.01-0.05) to settle chaotic scenes faster |
| `broadphaseCellSize` | 2 | Should be ~2x the radius of your largest object |
| `dt` | 1/60 | Smaller values improve accuracy at the cost of more steps per second of sim time |

---

## Running a Simulation

### Headless (No Visualization)

Step the simulation in a loop and collect data:

```typescript
import { createScene } from './src/sim/scene.js';
import { step } from './src/sim/simulation.js';

const sim = createScene({
  width: 20,
  height: 15,
  objects: [
    { type: 'circle', x: 0, y: 10, radius: 0.5, mass: 1 },
    { type: 'circle', x: 1, y: 12, radius: 0.5, mass: 1 },
  ],
});

// Run for 5 seconds of simulation time
const totalSteps = 5 * 60; // 5 seconds at 60 fps
for (let i = 0; i < totalSteps; i++) {
  step(sim);
}

// Inspect final state
for (const body of sim.world.bodies) {
  console.log(`Body ${body.id}: pos=(${body.position.x}, ${body.position.y})`);
}
```

### With the Web Visualization

```bash
npm run dev
```

The browser app provides live simulation with controls:

- Play / Pause / Stop / Step-forward
- Timeline scrubber (in playback mode)
- Speed selector (0.25x to 4x)
- Debug overlay toggle (shows contact points and normals)

---

## Recording and Exporting Data

The recorder captures simulation snapshots over time and exports them as JSON — the primary data format for downstream AI training pipelines.

```typescript
import { createScene } from './src/sim/scene.js';
import { SimulationRecorder } from './src/sim/recording.js';

const sim = createScene({
  width: 20,
  height: 15,
  objects: [
    { type: 'car', x: -5, y: 2 },
    { type: 'car', x: 5, y: 2 },
  ],
});

// Record every 2nd frame to reduce output size
const recorder = new SimulationRecorder(sim, { recordInterval: 2 });

// Capture the initial state
recorder.record();

// Run and record
for (let i = 0; i < 600; i++) {
  recorder.stepAndRecord();
}

// Export
const json = recorder.exportJSON();
// Write to file, send to a pipeline, etc.
```

### Recording Output Structure

```json
{
  "config": {
    "dt": 0.016666,
    "gravity": { "x": 0, "y": -9.81 },
    "floorY": 0,
    "substeps": 1,
    "solverIterations": 8,
    "broadphaseCellSize": 2,
    "damping": 0
  },
  "snapshots": [ ... ],
  "metadata": {
    "totalSteps": 600,
    "totalTime": 10.0,
    "bodyCount": 6,
    "recordedAt": "2026-03-29T12:00:00.000Z"
  }
}
```

### Recorder Options

| Option | Default | Description |
|---|---|---|
| `recordInterval` | 1 | Capture every Nth frame. Set to 2-4 to reduce file size for long runs. |

---

## Snapshot Format

Each snapshot is a complete, JSON-serializable picture of the world at one point in time. This is the format consumed by training pipelines.

### WorldSnapshot

```typescript
{
  time: number;       // elapsed simulation time (seconds)
  step: number;       // frame count
  bodies: BodySnapshot[];
  constraints: ConstraintSnapshot[];
  contacts: ContactSnapshot[];
}
```

### BodySnapshot

```typescript
{
  id: number;
  shapeType: "circle" | "aabb" | "polygon";
  position: { x: number; y: number };
  angle: number;
  velocity: { x: number; y: number };
  angularVelocity: number;
  mass: number;          // 0 for static bodies
  isStatic: boolean;
  // Shape-specific (only one set present):
  radius?: number;                         // circle
  halfWidth?: number; halfHeight?: number;  // aabb
  vertices?: { x: number; y: number }[];   // polygon
}
```

### ConstraintSnapshot

```typescript
{
  type: string;        // e.g. "revolute"
  bodyAId: number;
  bodyBId: number;
  broken: boolean;
}
```

### ContactSnapshot

```typescript
{
  bodyAId: number;
  bodyBId: number;     // -1 for floor contacts
  normal: { x: number; y: number };
  penetration: number;
  point: { x: number; y: number };
}
```

All `Vec2` values are serialized to plain `{ x, y }` objects. Static body mass is serialized as `0` (since `Infinity` is not valid JSON).

---

## Perturbation Logging

When running a live (interactive) simulation, user actions — applying forces, breaking joints, dropping objects — are captured in a `PerturbationLog`. This log pairs with the recording to provide a complete picture of what happened and why.

### Perturbation Types

| Type | Details Fields | Description |
|---|---|---|
| `force` | `bodyId`, `force`, `point` | A force vector applied to a body at a world point |
| `break-joint` | `constraintIndex` | A constraint manually broken by the user |
| `drop-object` | `bodyConfig` (shape, position, mass, dimensions) | A new object dropped into the scene |

### Log Format

```typescript
{
  type: "force" | "break-joint" | "drop-object";
  time: number;    // sim time when it occurred
  step: number;    // step count when it occurred
  details: { ... };
}
```

The perturbation log is designed to be exported alongside the recording JSON so that training data includes both the physics trajectory and any interventions.

---

## Visualization

The web visualization (`npm run dev`) provides two modes:

### Live Mode

Runs the simulation in real-time using `requestAnimationFrame`. Interaction tools are available:

| Tool | Behavior |
|---|---|
| **ApplyForce** | Click and drag on a body to apply a force vector |
| **BreakJoint** | Click on a constraint line to break it |
| **DropObject** | Click to drop a new circle or box into the scene |

### Playback Mode

After stopping a live simulation, the recorded frames can be scrubbed through:

- Drag the timeline slider to jump to any frame
- Use the speed selector to play back at 0.25x to 4x speed
- Step forward one frame at a time

### Camera Controls

- **Pan**: click and drag the background
- **Zoom**: scroll wheel

### Debug Overlay

Toggle the debug button to show:
- Contact points (red dots)
- Contact normals (red lines)

---

## Low-Level API

For full control, you can skip the scene builder and work directly with bodies, shapes, and the world.

### Creating Bodies

```typescript
import { createRigidBody, applyForce } from './src/core/body.js';
import { createCircle, createAABB, createPolygon } from './src/core/shape.js';
import { Vec2 } from './src/math/vec2.js';

// Dynamic circle
const ball = createRigidBody({
  shape: createCircle(0.5),
  position: new Vec2(0, 10),
  mass: 1,
  restitution: 0.8,
  friction: 0.3,
  velocity: new Vec2(3, 0),
});

// Static platform
const platform = createRigidBody({
  shape: createAABB(5, 0.25),  // half-width, half-height
  position: new Vec2(0, 2),
  isStatic: true,
});

// Apply a force at a world point (creates torque)
applyForce(ball, new Vec2(10, 0), new Vec2(0, 10.5));
```

### Adding Bodies to the World

```typescript
import { createWorld, addBody, addConstraint } from './src/core/world.js';

const world = createWorld({ gravity: new Vec2(0, -9.81) });
addBody(world, ball);
addBody(world, platform);
```

### Creating Constraints

```typescript
import { createRevoluteConstraint } from './src/core/constraint.js';

// Pin joint between two bodies
// Args: bodyA, bodyB, anchorOnA (local), anchorOnB (local)
const joint = createRevoluteConstraint(
  chassis, wheel,
  new Vec2(-1, -0.5),  // local offset on chassis
  Vec2.zero(),          // center of wheel
);

addConstraint(world, joint);
```

### Compound Objects

```typescript
import { createCar } from './src/core/compound.js';

// Creates chassis + 2 wheels + 2 revolute joints, adds all to world
const car = createCar(world, 0, 2, {
  chassisWidth: 2,
  chassisHeight: 0.5,
  chassisMass: 5,
  wheelRadius: 0.4,
  wheelMass: 1,
  friction: 0.6,
});

// Give the car an initial velocity
for (const body of car.bodies) {
  if (!body.isStatic) {
    body.velocity = new Vec2(5, 0);
  }
}
```

### Environment Helpers

```typescript
import { createFloor, createBoundary, createWall, createBox } from './src/core/environment.js';

createFloor(world, 0);                     // floor at y=0
createBoundary(world, -10, 10, 0, 15);     // 4-wall enclosure
createWall(world, -10, 0, 15);             // single wall
```

---

## Quick Reference

### Imports Cheat Sheet

```typescript
// Scene-level (high-level)
import { createScene, SceneConfig } from './src/sim/scene.js';
import { createSimulation, step } from './src/sim/simulation.js';
import { SimulationRecorder } from './src/sim/recording.js';
import { captureSnapshot } from './src/sim/snapshot.js';
import { PerturbationLog } from './src/sim/perturbation.js';

// Core (low-level)
import { createRigidBody, applyForce } from './src/core/body.js';
import { createCircle, createAABB, createPolygon } from './src/core/shape.js';
import { createWorld, addBody, addConstraint } from './src/core/world.js';
import { createRevoluteConstraint } from './src/core/constraint.js';
import { createCar } from './src/core/compound.js';
import { createFloor, createBoundary } from './src/core/environment.js';

// Math
import { Vec2 } from './src/math/vec2.js';
```

### Typical Pipeline Script

```typescript
import { createScene } from './src/sim/scene.js';
import { SimulationRecorder } from './src/sim/recording.js';
import { writeFileSync } from 'fs';

const sim = createScene({
  width: 20,
  height: 15,
  objects: [
    { type: 'circle', x: -2, y: 12, radius: 0.5, mass: 1 },
    { type: 'circle', x: 2, y: 14, radius: 0.7, mass: 2 },
    { type: 'box', x: 0, y: 8, width: 1, height: 1, mass: 1.5 },
    { type: 'static-box', x: 0, y: 4, width: 8, height: 0.3 },
  ],
});

const recorder = new SimulationRecorder(sim, { recordInterval: 2 });
recorder.record();

for (let i = 0; i < 1800; i++) {  // 30 seconds at 60fps
  recorder.stepAndRecord();
}

writeFileSync('output.json', recorder.exportJSON());
```
