import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createSimulation, step } from '../../src/sim/simulation.js';
import { captureSnapshot } from '../../src/sim/snapshot.js';
import { createRecorder } from '../../src/sim/recording.js';
import { createRigidBody, resetBodyIdCounter } from '../../src/core/body.js';
import { createCircle, createAABB } from '../../src/core/shape.js';
import { addBody } from '../../src/core/world.js';
import { createFloor } from '../../src/core/environment.js';

describe('Snapshot Round-Trip', () => {
  beforeEach(() => {
    resetBodyIdCounter();
  });

  it('snapshot round-trips through JSON with all fields intact', () => {
    const sim = createSimulation({
      gravity: new Vec2(0, -9.81),
      floorY: -Infinity,
    });

    createFloor(sim.world, 0, 20);

    const ball = createRigidBody({
      shape: createCircle(0.5),
      position: new Vec2(2, 5),
      velocity: new Vec2(1, -2),
      mass: 1.5,
      restitution: 0.7,
    });
    addBody(sim.world, ball);

    // Step a few times to get interesting state
    for (let i = 0; i < 10; i++) {
      step(sim);
    }

    const snapshot = captureSnapshot(sim);
    const json = JSON.stringify(snapshot);
    const parsed = JSON.parse(json);

    // Verify top-level fields
    expect(parsed.time).toBe(snapshot.time);
    expect(parsed.step).toBe(snapshot.step);
    expect(parsed.bodies.length).toBe(snapshot.bodies.length);
    expect(parsed.constraints.length).toBe(snapshot.constraints.length);
    expect(parsed.contacts.length).toBe(snapshot.contacts.length);

    // Verify body fields round-trip
    for (let i = 0; i < snapshot.bodies.length; i++) {
      const orig = snapshot.bodies[i];
      const rt = parsed.bodies[i];
      expect(rt.id).toBe(orig.id);
      expect(rt.shapeType).toBe(orig.shapeType);
      expect(rt.position.x).toBe(orig.position.x);
      expect(rt.position.y).toBe(orig.position.y);
      expect(rt.angle).toBe(orig.angle);
      expect(rt.velocity.x).toBe(orig.velocity.x);
      expect(rt.velocity.y).toBe(orig.velocity.y);
      expect(rt.angularVelocity).toBe(orig.angularVelocity);
      expect(rt.mass).toBe(orig.mass);
      expect(rt.isStatic).toBe(orig.isStatic);
    }
  });

  it('no NaN, Infinity, or undefined in JSON output', () => {
    const sim = createSimulation({
      gravity: new Vec2(0, -9.81),
      floorY: -Infinity,
    });

    createFloor(sim.world, 0, 20);

    // Add a dynamic circle and a static box
    addBody(
      sim.world,
      createRigidBody({
        shape: createCircle(0.5),
        position: new Vec2(0, 5),
        mass: 1,
      }),
    );
    addBody(
      sim.world,
      createRigidBody({
        shape: createAABB(1, 0.5),
        position: new Vec2(3, 3),
        mass: 2,
      }),
    );

    // Step to generate contacts
    for (let i = 0; i < 100; i++) {
      step(sim);
    }

    const snapshot = captureSnapshot(sim);
    const json = JSON.stringify(snapshot);

    // No NaN or Infinity in JSON (they serialize as null in JSON.stringify)
    expect(json).not.toContain('null');
    // Also check the raw values before serialization
    expect(json).not.toContain('NaN');
    expect(json).not.toContain('Infinity');
    expect(json).not.toContain('undefined');

    // Parse and deep-check all numeric values
    const parsed = JSON.parse(json);
    for (const body of parsed.bodies) {
      expect(Number.isFinite(body.position.x)).toBe(true);
      expect(Number.isFinite(body.position.y)).toBe(true);
      expect(Number.isFinite(body.velocity.x)).toBe(true);
      expect(Number.isFinite(body.velocity.y)).toBe(true);
      expect(Number.isFinite(body.angle)).toBe(true);
      expect(Number.isFinite(body.angularVelocity)).toBe(true);
      expect(Number.isFinite(body.mass)).toBe(true);
    }
  });

  it('body IDs are consistent across multiple snapshots', () => {
    const sim = createSimulation({
      gravity: new Vec2(0, -9.81),
      floorY: -Infinity,
    });

    createFloor(sim.world, 0, 20);

    addBody(
      sim.world,
      createRigidBody({
        shape: createCircle(0.5),
        position: new Vec2(0, 5),
        mass: 1,
      }),
    );
    addBody(
      sim.world,
      createRigidBody({
        shape: createCircle(0.3),
        position: new Vec2(2, 7),
        mass: 1,
      }),
    );

    const recorder = createRecorder(sim);

    for (let i = 0; i < 50; i++) {
      recorder.stepAndRecord();
    }

    const recording = recorder.getRecording();
    // Get the set of body IDs from the first snapshot
    const firstIds = recording.snapshots[0].bodies.map((b) => b.id).sort();

    // Every subsequent snapshot should have the same set of body IDs
    for (let i = 1; i < recording.snapshots.length; i++) {
      const ids = recording.snapshots[i].bodies.map((b) => b.id).sort();
      expect(ids).toEqual(firstIds);
    }
  });

  it('full recording round-trips through JSON export and parse', () => {
    const sim = createSimulation({
      gravity: new Vec2(0, -9.81),
      floorY: -Infinity,
    });

    createFloor(sim.world, 0, 20);

    addBody(
      sim.world,
      createRigidBody({
        shape: createCircle(0.5),
        position: new Vec2(0, 5),
        mass: 1,
      }),
    );

    const recorder = createRecorder(sim);
    for (let i = 0; i < 30; i++) {
      recorder.stepAndRecord();
    }

    const json = recorder.exportJSON();
    const parsed = JSON.parse(json);

    // Verify structure
    expect(parsed.config.dt).toBeCloseTo(1 / 60);
    expect(parsed.config.gravity).toBeDefined();
    expect(parsed.snapshots).toHaveLength(30);
    expect(parsed.metadata.totalSteps).toBe(30);
    expect(parsed.metadata.bodyCount).toBeGreaterThan(0);
    expect(typeof parsed.metadata.recordedAt).toBe('string');
  });
});
