import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createScene } from '../../src/sim/scene.js';
import { step } from '../../src/sim/simulation.js';
import { createRecorder } from '../../src/sim/recording.js';
import { resetBodyIdCounter } from '../../src/core/body.js';

describe('Final integration', () => {
  beforeEach(() => resetBodyIdCounter());

  it('full scene: boundary, 2 cars, 10 circles — 10s run, record, export JSON', () => {
    const sim = createScene({
      width: 20,
      height: 15,
      gravity: new Vec2(0, -9.81),
      dt: 1 / 60,
      objects: [
        { type: 'car', x: -3, y: 2 },
        { type: 'car', x: 3, y: 2 },
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

    // Record every 6th frame (10 fps at 60 fps sim)
    const recorder = createRecorder(sim, { recordInterval: 6 });

    // Run 10 seconds of simulation
    const totalSteps = Math.round(10 / sim.config.dt);
    for (let i = 0; i < totalSteps; i++) {
      recorder.stepAndRecord();
    }

    // Export as JSON
    const json = recorder.exportJSON();

    // Verify JSON is valid and parseable
    expect(() => JSON.parse(json)).not.toThrow();
    const data = JSON.parse(json);

    // Verify structure
    expect(data.snapshots.length).toBeGreaterThan(0);
    expect(data.metadata.totalSteps).toBe(totalSteps);
    expect(data.metadata.totalTime).toBeGreaterThan(9);

    // Verify no NaN in all snapshots
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

    // Verify all bodies remain in reasonable bounds
    const lastSnapshot = data.snapshots[data.snapshots.length - 1];
    for (const body of lastSnapshot.bodies) {
      // Scene is 20x15, allow some margin for walls
      expect(Math.abs(body.position.x)).toBeLessThan(15);
      expect(Math.abs(body.position.y)).toBeLessThan(20);
    }
  });

  it('performance: 200 bodies should complete 60 steps in reasonable time', () => {
    const sim = createScene({
      width: 40,
      height: 40,
      gravity: new Vec2(0, -9.81),
      dt: 1 / 120,
      objects: Array.from({ length: 200 }, (_, i) => ({
        type: 'circle' as const,
        x: (i % 20) * 1.5 - 15,
        y: 2 + Math.floor(i / 20) * 1.5,
        radius: 0.4,
        mass: 1,
      })),
    });

    const start = performance.now();
    for (let i = 0; i < 60; i++) {
      step(sim);
    }
    const elapsed = performance.now() - start;

    // Should complete in under 5 seconds (generous budget)
    expect(elapsed).toBeLessThan(5000);

    // No NaN
    for (const body of sim.world.bodies) {
      expect(Number.isFinite(body.position.x)).toBe(true);
      expect(Number.isFinite(body.position.y)).toBe(true);
    }
  });
});
