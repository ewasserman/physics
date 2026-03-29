import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createSimulation } from '../../src/sim/simulation.js';
import { createRecorder } from '../../src/sim/recording.js';
import { createRigidBody, resetBodyIdCounter } from '../../src/core/body.js';
import { createCircle } from '../../src/core/shape.js';
import { addBody } from '../../src/core/world.js';
import { createFloor, createBoundary } from '../../src/core/environment.js';
import { createCar } from '../../src/core/compound.js';

describe('Recording Validation — Bouncing Ball', () => {
  beforeEach(() => {
    resetBodyIdCounter();
  });

  function setupBouncingBall() {
    const sim = createSimulation({
      gravity: new Vec2(0, -9.81),
      floorY: -Infinity,
      dt: 1 / 120,
    });

    createFloor(sim.world, 0, 20);

    const ball = createRigidBody({
      shape: createCircle(0.5),
      position: new Vec2(0, 5),
      mass: 1,
      restitution: 0.8,
    });
    addBody(sim.world, ball);

    return sim;
  }

  it('records 600 snapshots for 5s at 120Hz', () => {
    const sim = setupBouncingBall();
    const recorder = createRecorder(sim);

    for (let i = 0; i < 600; i++) {
      recorder.stepAndRecord();
    }

    const recording = recorder.getRecording();
    expect(recording.snapshots).toHaveLength(600);
  });

  it('time monotonically increases across all frames', () => {
    const sim = setupBouncingBall();
    const recorder = createRecorder(sim);

    for (let i = 0; i < 600; i++) {
      recorder.stepAndRecord();
    }

    const recording = recorder.getRecording();
    for (let i = 1; i < recording.snapshots.length; i++) {
      expect(recording.snapshots[i].time).toBeGreaterThan(
        recording.snapshots[i - 1].time,
      );
    }
  });

  it('body position changes frame-to-frame', () => {
    const sim = setupBouncingBall();
    const recorder = createRecorder(sim);

    for (let i = 0; i < 600; i++) {
      recorder.stepAndRecord();
    }

    const snapshots = recorder.getRecording().snapshots;
    // Check the first 60 frames — ball is in free-fall so position must change
    let positionChanged = false;
    for (let i = 1; i < 60; i++) {
      const prev = snapshots[i - 1].bodies.find((b) => !b.isStatic)!;
      const curr = snapshots[i].bodies.find((b) => !b.isStatic)!;
      if (
        prev.position.x !== curr.position.x ||
        prev.position.y !== curr.position.y
      ) {
        positionChanged = true;
        break;
      }
    }
    expect(positionChanged).toBe(true);
  });

  it('JSON export is valid and parseable', () => {
    const sim = setupBouncingBall();
    const recorder = createRecorder(sim);

    for (let i = 0; i < 600; i++) {
      recorder.stepAndRecord();
    }

    const json = recorder.exportJSON();
    expect(() => JSON.parse(json)).not.toThrow();

    const parsed = JSON.parse(json);
    expect(parsed.snapshots).toHaveLength(600);
    expect(parsed.config).toBeDefined();
    expect(parsed.metadata).toBeDefined();
  });

  it('JSON file size is in a reasonable range', () => {
    const sim = setupBouncingBall();
    const recorder = createRecorder(sim);

    for (let i = 0; i < 600; i++) {
      recorder.stepAndRecord();
    }

    const json = recorder.exportJSON();
    const sizeKB = json.length / 1024;
    // Should be roughly 50-500 KB for 600 frames with 2 bodies (1 dynamic + 1 floor)
    expect(sizeKB).toBeGreaterThan(50);
    expect(sizeKB).toBeLessThan(500);
  });
});

describe('Recording Validation — Two Cars Colliding', () => {
  beforeEach(() => {
    resetBodyIdCounter();
  });

  function setupTwoCars() {
    const sim = createSimulation({
      gravity: new Vec2(0, -9.81),
      floorY: -Infinity,
      dt: 1 / 60,
    });

    createFloor(sim.world, 0, 30);

    // Car A at x=-5, moving right
    const carA = createCar(sim.world, -5, 2);
    for (const body of carA.bodies) {
      body.velocity = new Vec2(3, 0);
    }

    // Car B at x=5, moving left
    const carB = createCar(sim.world, 5, 2);
    for (const body of carB.bodies) {
      body.velocity = new Vec2(-3, 0);
    }

    return { sim, carA, carB };
  }

  it('records 600 snapshots for 10s at 60Hz', () => {
    const { sim } = setupTwoCars();
    const recorder = createRecorder(sim);

    for (let i = 0; i < 600; i++) {
      recorder.stepAndRecord();
    }

    const recording = recorder.getRecording();
    expect(recording.snapshots).toHaveLength(600);
  });

  it('all bodies exist in every snapshot', () => {
    const { sim } = setupTwoCars();
    const recorder = createRecorder(sim);

    for (let i = 0; i < 600; i++) {
      recorder.stepAndRecord();
    }

    const recording = recorder.getRecording();
    const expectedBodyCount = sim.world.bodies.length;

    for (const snapshot of recording.snapshots) {
      expect(snapshot.bodies.length).toBe(expectedBodyCount);
    }
  });

  it('constraints are tracked in the recording', () => {
    const { sim } = setupTwoCars();
    const recorder = createRecorder(sim);

    // Record initial state before any steps (constraints intact)
    recorder.record();

    const recording = recorder.getRecording();
    // The first snapshot should have constraints (4 revolute joints: 2 per car)
    expect(recording.snapshots[0].constraints.length).toBeGreaterThanOrEqual(4);
  });

  it('JSON export is parseable', () => {
    const { sim } = setupTwoCars();
    const recorder = createRecorder(sim);

    for (let i = 0; i < 600; i++) {
      recorder.stepAndRecord();
    }

    const json = recorder.exportJSON();
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

describe('Recording Validation — Settling Scene', () => {
  beforeEach(() => {
    resetBodyIdCounter();
  });

  function setupSettlingScene() {
    const sim = createSimulation({
      gravity: new Vec2(0, -9.81),
      floorY: -Infinity,
      dt: 1 / 60,
    });

    createBoundary(sim.world, -2, 2, 0, 8);

    // Add 10 circles at staggered positions
    for (let i = 0; i < 10; i++) {
      const x = -1.5 + (i % 5) * 0.75;
      const y = 3 + Math.floor(i / 5) * 1.5;
      const radius = 0.3 + (i % 3) * 0.05;

      const body = createRigidBody({
        shape: createCircle(radius),
        position: new Vec2(x, y),
        mass: 1,
        restitution: 0.3,
      });
      addBody(sim.world, body);
    }

    return sim;
  }

  it('records 600 snapshots for 10s at 60Hz', () => {
    const sim = setupSettlingScene();
    const recorder = createRecorder(sim);

    for (let i = 0; i < 600; i++) {
      recorder.stepAndRecord();
    }

    const recording = recorder.getRecording();
    expect(recording.snapshots).toHaveLength(600);
  });

  it('all bodies present in each snapshot', () => {
    const sim = setupSettlingScene();
    const recorder = createRecorder(sim);

    for (let i = 0; i < 600; i++) {
      recorder.stepAndRecord();
    }

    const recording = recorder.getRecording();
    const expectedBodyCount = sim.world.bodies.length;

    for (const snapshot of recording.snapshots) {
      expect(snapshot.bodies.length).toBe(expectedBodyCount);
    }
  });

  it('recording completes without error and JSON is valid', () => {
    const sim = setupSettlingScene();
    const recorder = createRecorder(sim);

    for (let i = 0; i < 600; i++) {
      recorder.stepAndRecord();
    }

    const json = recorder.exportJSON();
    expect(() => JSON.parse(json)).not.toThrow();

    const parsed = JSON.parse(json);
    expect(parsed.metadata.totalSteps).toBe(600);
  });
});
