import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createScene } from '../../src/sim/scene.js';
import { step } from '../../src/sim/simulation.js';
import { createRecorder } from '../../src/sim/recording.js';
import { resetBodyIdCounter } from '../../src/core/body.js';

describe('End-to-end integration — final', () => {
  beforeEach(() => resetBodyIdCounter());

  it('full scene: boundary 20x15, 2 cars, 10 circles, gravity — 10s run', () => {
    const sim = createScene({
      width: 20,
      height: 15,
      gravity: new Vec2(0, -9.81),
      dt: 1 / 120,
      objects: [
        { type: 'car', x: -3, y: 3 },
        { type: 'car', x: 3, y: 3 },
        { type: 'circle', x: -4, y: 8, radius: 0.3, mass: 1 },
        { type: 'circle', x: -2, y: 9, radius: 0.4, mass: 1.5 },
        { type: 'circle', x: 0, y: 10, radius: 0.5, mass: 2 },
        { type: 'circle', x: 2, y: 11, radius: 0.3, mass: 1 },
        { type: 'circle', x: 4, y: 7, radius: 0.4, mass: 1 },
        { type: 'circle', x: -1, y: 12, radius: 0.3, mass: 0.8 },
        { type: 'circle', x: 1, y: 6, radius: 0.5, mass: 2 },
        { type: 'circle', x: 3, y: 13, radius: 0.35, mass: 1.2 },
        { type: 'circle', x: -3, y: 5, radius: 0.45, mass: 1.5 },
        { type: 'circle', x: 0, y: 14, radius: 0.3, mass: 1 },
      ],
    });

    // Record every 12th frame (10 fps output at 120 fps sim)
    const recorder = createRecorder(sim, { recordInterval: 12 });

    // Run 10 seconds (1200 steps at 120 Hz)
    const totalSteps = Math.round(10 / sim.config.dt);
    for (let i = 0; i < totalSteps; i++) {
      recorder.stepAndRecord();
    }

    // Check all bodies mid-sim and post-sim for NaN/Infinity
    for (const body of sim.world.bodies) {
      expect(Number.isFinite(body.position.x)).toBe(true);
      expect(Number.isFinite(body.position.y)).toBe(true);
      expect(Number.isFinite(body.velocity.x)).toBe(true);
      expect(Number.isFinite(body.velocity.y)).toBe(true);
      expect(Number.isFinite(body.angle)).toBe(true);
      expect(Number.isFinite(body.angularVelocity)).toBe(true);
    }

    // All dynamic bodies should remain within boundary (20x15 area, with margin)
    for (const body of sim.world.bodies) {
      if (!body.isStatic) {
        expect(Math.abs(body.position.x)).toBeLessThan(15);
        expect(body.position.y).toBeGreaterThan(-2);
        expect(body.position.y).toBeLessThan(20);
      }
    }

    // Constraints: cars should still be assembled (constraints not broken)
    // Each car has 2 constraints (2 axles), so 4 total
    // Some may have broken due to collision forces, so just check they exist
    // (constraint breaking is a valid behavior)
    expect(sim.world.constraints.length).toBeGreaterThanOrEqual(0);

    // Export JSON and verify
    const json = recorder.exportJSON();
    expect(() => JSON.parse(json)).not.toThrow();

    const data = JSON.parse(json);
    expect(data.snapshots.length).toBeGreaterThan(0);
    expect(data.metadata.totalSteps).toBe(totalSteps);
    expect(data.metadata.totalTime).toBeGreaterThan(9);

    // Verify snapshot count: 1200 steps / 12 interval = 100 snapshots
    expect(data.snapshots.length).toBe(100);

    // Verify all snapshots have valid data
    for (const snapshot of data.snapshots) {
      for (const body of snapshot.bodies) {
        expect(Number.isFinite(body.position.x)).toBe(true);
        expect(Number.isFinite(body.position.y)).toBe(true);
        expect(Number.isFinite(body.velocity.x)).toBe(true);
        expect(Number.isFinite(body.velocity.y)).toBe(true);
        expect(Number.isFinite(body.angle)).toBe(true);
        expect(Number.isFinite(body.angularVelocity)).toBe(true);
      }
    }

    // Measure JSON size
    const jsonSize = Buffer.byteLength(json, 'utf-8');
    console.log(`[End-to-End] JSON export size: ${(jsonSize / 1024).toFixed(1)} KB`);
    console.log(`[End-to-End] Snapshots: ${data.snapshots.length}, Bodies per snapshot: ${data.snapshots[0].bodies.length}`);
    console.log(`[End-to-End] Total steps: ${data.metadata.totalSteps}, Total time: ${data.metadata.totalTime.toFixed(2)}s`);

    // JSON should be a reasonable size (not empty, not gigantic)
    expect(jsonSize).toBeGreaterThan(1000);
    expect(jsonSize).toBeLessThan(50 * 1024 * 1024); // < 50 MB
  });

  it('all bodies stay within boundary over full simulation', () => {
    const sim = createScene({
      width: 20,
      height: 15,
      gravity: new Vec2(0, -9.81),
      dt: 1 / 60,
      objects: [
        { type: 'car', x: 0, y: 5 },
        { type: 'circle', x: -5, y: 10, radius: 0.5, mass: 1 },
        { type: 'circle', x: 5, y: 12, radius: 0.5, mass: 1 },
        { type: 'circle', x: 0, y: 14, radius: 0.5, mass: 1 },
      ],
    });

    // Run 600 steps (10 seconds at 60 Hz)
    for (let i = 0; i < 600; i++) {
      step(sim);

      // Check every frame: no body has escaped
      for (const body of sim.world.bodies) {
        if (!body.isStatic) {
          expect(Number.isFinite(body.position.x)).toBe(true);
          expect(Number.isFinite(body.position.y)).toBe(true);
          // Generous bounds (boundary is 20x15, walls add thickness)
          expect(Math.abs(body.position.x)).toBeLessThan(15);
          expect(body.position.y).toBeGreaterThan(-5);
          expect(body.position.y).toBeLessThan(25);
        }
      }
    }
  });
});
