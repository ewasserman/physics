import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createRigidBody, resetBodyIdCounter } from '../../src/core/body.js';
import { addBody } from '../../src/core/world.js';
import { createCircle } from '../../src/core/shape.js';
import { createSimulation, step } from '../../src/sim/simulation.js';

/**
 * Phase 2: Performance Scaling Tests
 *
 * Benchmarks step() time for varying body counts: 10, 50, 100, 200.
 * Results are logged, not asserted (timing depends on hardware).
 */

function createScalingSim(n: number) {
  const sim = createSimulation({
    gravity: new Vec2(0, -9.81),
    floorY: 0,
    dt: 1 / 120,
    broadphaseCellSize: 4,
    solverIterations: 8,
    damping: 0,
  });

  // Place circles on a grid to avoid initial overlap
  const cols = Math.ceil(Math.sqrt(n));
  const spacing = 2.0; // 2m apart (radius 0.5 => diameter 1, generous spacing)

  for (let i = 0; i < n; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * spacing - (cols * spacing) / 2;
    const y = 5 + row * spacing;

    const body = createRigidBody({
      shape: createCircle(0.5),
      position: new Vec2(x, y),
      velocity: new Vec2((Math.random() - 0.5) * 2, -Math.random() * 2),
      mass: 1,
      restitution: 0.5,
    });
    addBody(sim.world, body);
  }

  return sim;
}

describe('Performance scaling', () => {
  beforeEach(() => resetBodyIdCounter());

  const bodyCounts = [10, 50, 100, 200];
  const stepsPerTest = 120; // 1 second of sim time

  for (const n of bodyCounts) {
    it(`should benchmark ${n} bodies over ${stepsPerTest} steps`, () => {
      const sim = createScalingSim(n);

      const start = performance.now();
      for (let i = 0; i < stepsPerTest; i++) {
        step(sim);
      }
      const elapsed = performance.now() - start;

      const perStep = elapsed / stepsPerTest;
      const stepsPerMs = stepsPerTest / elapsed;

      console.log(
        `[Scaling] N=${n}: ${stepsPerTest} steps in ${elapsed.toFixed(1)} ms ` +
        `(${perStep.toFixed(3)} ms/step, ${stepsPerMs.toFixed(1)} steps/ms)`
      );

      // Sanity check: should complete in reasonable time (< 30s)
      expect(elapsed).toBeLessThan(30000);

      // All bodies should still have finite state
      for (const body of sim.world.bodies) {
        expect(Number.isFinite(body.position.x)).toBe(true);
        expect(Number.isFinite(body.position.y)).toBe(true);
        expect(Number.isFinite(body.velocity.x)).toBe(true);
        expect(Number.isFinite(body.velocity.y)).toBe(true);
      }
    });
  }

  it('should report scaling summary', () => {
    const results: { n: number; msPerStep: number }[] = [];

    for (const n of bodyCounts) {
      resetBodyIdCounter();
      const sim = createScalingSim(n);

      const start = performance.now();
      for (let i = 0; i < stepsPerTest; i++) {
        step(sim);
      }
      const elapsed = performance.now() - start;

      results.push({ n, msPerStep: elapsed / stepsPerTest });
    }

    console.log('\n[Scaling Summary]');
    console.log('Bodies | ms/step | Relative to N=10');
    console.log('-------|---------|------------------');
    const baseline = results[0].msPerStep;
    for (const r of results) {
      const relative = r.msPerStep / baseline;
      console.log(
        `${String(r.n).padStart(6)} | ${r.msPerStep.toFixed(3).padStart(7)} | ${relative.toFixed(1)}x`
      );
    }

    // Just ensure it ran successfully
    expect(results.length).toBe(bodyCounts.length);
  });
});
