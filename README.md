# physics-sim

A from-scratch 2D rigid-body physics simulation built in TypeScript. No external physics libraries — all collision detection, constraint solving, and integration are implemented in-house.

The simulation prioritizes visual plausibility and speed over exact accuracy. Output is structured JSON state data (positions, velocities, forces, contacts at each timestep) designed for AI training pipelines.

## Features

- **Rigid-body dynamics** — circles, boxes, and convex polygons with mass, friction, and restitution
- **Collision detection** — spatial-hash broadphase, circle/AABB/polygon narrowphase, sequential impulse solver with warm-starting
- **Constraints** — revolute joints with breakable thresholds
- **Compound objects** — cars (chassis + wheels + axles) and custom assemblies
- **Declarative scene builder** — define scenes as JSON configs
- **Recording and export** — capture full simulation state to JSON for downstream consumption
- **Interactive visualization** — HTML5 Canvas renderer with pan/zoom, force application, joint breaking, and object dropping
- **475+ tests** — unit, integration, stacking stability, tunneling prevention, and stress tests

## Quick Start

```bash
npm install
npm run dev
```

Open the URL in your browser. Choose a demo (Bouncing, Car Crash, or Rain) to launch a live simulation.

Press `Ctrl+C` in the terminal to stop the dev server.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm test` | Run all tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |

## Project Structure

```
src/
  core/       Bodies, shapes, world, constraints, compound objects
  math/       Vec2 immutable 2D vector
  physics/    Integrator, forces, broadphase, narrowphase, solver, friction
  sim/        Simulation loop, scene builder, recording, snapshots, perturbations
  viz/        Canvas renderer, live/playback modes, UI controls, interaction tools
tests/        Unit and integration tests
doc/          User guide and project documentation
```

## Headless Usage

Run simulations without the browser and export data:

```typescript
import { createScene } from './src/sim/scene.js';
import { step } from './src/sim/simulation.js';
import { SimulationRecorder } from './src/sim/recording.js';

const sim = createScene({
  width: 20,
  height: 15,
  objects: [
    { type: 'circle', x: 0, y: 10, radius: 0.5, mass: 1 },
    { type: 'box', x: 3, y: 12, width: 1, height: 1, mass: 2 },
    { type: 'static-box', x: 0, y: 4, width: 8, height: 0.3 },
  ],
});

const recorder = new SimulationRecorder(sim);
recorder.record();

for (let i = 0; i < 600; i++) {
  recorder.stepAndRecord();
}

const json = recorder.exportJSON();
```

## Documentation

See the [User Guide](doc/user-guide.md) for full API documentation, configuration tuning, snapshot format reference, and code examples.

## Tech Stack

- **Language**: TypeScript
- **Build**: Vite
- **Testing**: Vitest
- **Rendering**: HTML5 Canvas
- **Dependencies**: None (zero runtime dependencies)
