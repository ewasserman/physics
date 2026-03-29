import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createSimulation } from '../../src/sim/simulation.js';
import { createRecorder, SimulationRecorder } from '../../src/sim/recording.js';
import { createRigidBody, resetBodyIdCounter } from '../../src/core/body.js';
import { createCircle } from '../../src/core/shape.js';
import { addBody } from '../../src/core/world.js';

describe('Simulation Recording', () => {
  beforeEach(() => {
    resetBodyIdCounter();
  });

  function setupSim() {
    const sim = createSimulation({ floorY: 0 });
    const body = createRigidBody({
      shape: createCircle(0.5),
      position: new Vec2(0, 5),
      mass: 1,
    });
    addBody(sim.world, body);
    return sim;
  }

  it('records 100 steps with correct snapshot count', () => {
    const sim = setupSim();
    const recorder = createRecorder(sim);

    for (let i = 0; i < 100; i++) {
      recorder.stepAndRecord();
    }

    const recording = recorder.getRecording();
    expect(recording.snapshots).toHaveLength(100);
  });

  it('has monotonically increasing time in snapshots', () => {
    const sim = setupSim();
    const recorder = createRecorder(sim);

    for (let i = 0; i < 50; i++) {
      recorder.stepAndRecord();
    }

    const recording = recorder.getRecording();
    for (let i = 1; i < recording.snapshots.length; i++) {
      expect(recording.snapshots[i].time).toBeGreaterThan(recording.snapshots[i - 1].time);
    }
  });

  it('exports valid JSON', () => {
    const sim = setupSim();
    const recorder = createRecorder(sim);

    for (let i = 0; i < 10; i++) {
      recorder.stepAndRecord();
    }

    const json = recorder.exportJSON();
    expect(() => JSON.parse(json)).not.toThrow();

    const parsed = JSON.parse(json);
    expect(parsed.snapshots).toHaveLength(10);
    expect(parsed.config).toBeDefined();
    expect(parsed.metadata).toBeDefined();
  });

  it('round-trips through JSON parse', () => {
    const sim = setupSim();
    const recorder = createRecorder(sim);

    for (let i = 0; i < 20; i++) {
      recorder.stepAndRecord();
    }

    const json = recorder.exportJSON();
    const parsed = JSON.parse(json);

    expect(parsed.metadata.totalSteps).toBe(20);
    expect(parsed.metadata.bodyCount).toBe(1);
    expect(typeof parsed.metadata.recordedAt).toBe('string');
    expect(parsed.snapshots.length).toBe(20);

    // Verify a snapshot body has expected fields
    const firstBody = parsed.snapshots[0].bodies[0];
    expect(firstBody.id).toBeDefined();
    expect(firstBody.position.x).toBeDefined();
    expect(firstBody.position.y).toBeDefined();
    expect(firstBody.shapeType).toBe('circle');
  });

  it('metadata has correct totalTime', () => {
    const sim = setupSim();
    const recorder = createRecorder(sim);

    for (let i = 0; i < 60; i++) {
      recorder.stepAndRecord();
    }

    const recording = recorder.getRecording();
    expect(recording.metadata.totalTime).toBeCloseTo(1.0, 1); // 60 steps at 1/60 dt
  });

  it('supports recording every Nth frame', () => {
    const sim = setupSim();
    const recorder = createRecorder(sim, { recordInterval: 5 });

    for (let i = 0; i < 100; i++) {
      recorder.stepAndRecord();
    }

    const recording = recorder.getRecording();
    expect(recording.snapshots).toHaveLength(20); // 100 / 5
  });

  it('produces reasonably sized JSON', () => {
    const sim = setupSim();
    const recorder = createRecorder(sim);

    for (let i = 0; i < 100; i++) {
      recorder.stepAndRecord();
    }

    const json = recorder.exportJSON();
    // Should be under 100KB for a simple single-body sim with 100 frames
    expect(json.length).toBeLessThan(100_000);
  });

  it('record() captures current state without stepping', () => {
    const sim = setupSim();
    const recorder = createRecorder(sim);

    // Record initial state
    recorder.record();

    const recording = recorder.getRecording();
    expect(recording.snapshots).toHaveLength(1);
    expect(recording.snapshots[0].step).toBe(0);
    expect(recording.snapshots[0].time).toBe(0);
  });
});
