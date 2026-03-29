import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createScene } from '../../src/sim/scene.js';
import { createSimulation, step } from '../../src/sim/simulation.js';
import { createRigidBody, resetBodyIdCounter } from '../../src/core/body.js';
import { createCircle } from '../../src/core/shape.js';
import { addBody } from '../../src/core/world.js';

describe('Performance — final benchmarks', () => {
  beforeEach(() => resetBodyIdCounter());

  const bodyCounts = [10, 50, 100, 200, 500];
  const stepsPerBenchmark = 120;
  const results: { n: number; totalMs: number; msPerStep: number }[] = [];

  for (const n of bodyCounts) {
    it(`benchmark: ${n} bodies x ${stepsPerBenchmark} steps`, () => {
      const sim = createSimulation({
        gravity: new Vec2(0, -9.81),
        floorY: 0,
        dt: 1 / 120,
        solverIterations: 8,
      });

      // Place bodies in a grid to avoid excessive initial overlaps
      const cols = Math.ceil(Math.sqrt(n));
      for (let i = 0; i < n; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const body = createRigidBody({
          shape: createCircle(0.4),
          position: new Vec2(col * 1.2 - (cols * 1.2) / 2, 2 + row * 1.2),
          mass: 1,
          restitution: 0.3,
          friction: 0.4,
        });
        addBody(sim.world, body);
      }

      const start = performance.now();
      for (let s = 0; s < stepsPerBenchmark; s++) {
        step(sim);
      }
      const elapsed = performance.now() - start;
      const msPerStep = elapsed / stepsPerBenchmark;

      results.push({ n, totalMs: elapsed, msPerStep });

      console.log(`[Perf] N=${n}: ${stepsPerBenchmark} steps in ${elapsed.toFixed(1)} ms (${msPerStep.toFixed(3)} ms/step)`);

      // No NaN in any body
      for (const body of sim.world.bodies) {
        expect(Number.isFinite(body.position.x)).toBe(true);
        expect(Number.isFinite(body.position.y)).toBe(true);
      }
    });
  }

  it('200 bodies runs at real-time or better (step < 8.33ms at 120Hz)', () => {
    const sim = createSimulation({
      gravity: new Vec2(0, -9.81),
      floorY: 0,
      dt: 1 / 120,
      solverIterations: 8,
    });

    const cols = 15;
    for (let i = 0; i < 200; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const body = createRigidBody({
        shape: createCircle(0.4),
        position: new Vec2(col * 1.2 - (cols * 1.2) / 2, 2 + row * 1.2),
        mass: 1,
        restitution: 0.3,
        friction: 0.4,
      });
      addBody(sim.world, body);
    }

    // Warm up (first few steps may be slower due to JIT)
    for (let s = 0; s < 10; s++) {
      step(sim);
    }

    const start = performance.now();
    const measureSteps = 120;
    for (let s = 0; s < measureSteps; s++) {
      step(sim);
    }
    const elapsed = performance.now() - start;
    const msPerStep = elapsed / measureSteps;

    console.log(`[Perf 200-body] ${measureSteps} steps in ${elapsed.toFixed(1)} ms (${msPerStep.toFixed(3)} ms/step)`);
    console.log(`[Perf 200-body] Real-time budget at 120Hz: 8.33 ms/step`);

    // Must be faster than real-time at 120Hz (8.33ms per step)
    expect(msPerStep).toBeLessThan(8.33);
  });

  it('scaling table summary', () => {
    // Run a fresh set of benchmarks and log a table
    const table: { bodies: number; msPerStep: number }[] = [];

    for (const n of [10, 50, 100, 200, 500]) {
      resetBodyIdCounter();
      const sim = createSimulation({
        gravity: new Vec2(0, -9.81),
        floorY: 0,
        dt: 1 / 120,
        solverIterations: 8,
      });

      const cols = Math.ceil(Math.sqrt(n));
      for (let i = 0; i < n; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const body = createRigidBody({
          shape: createCircle(0.4),
          position: new Vec2(col * 1.2 - (cols * 1.2) / 2, 2 + row * 1.2),
          mass: 1,
        });
        addBody(sim.world, body);
      }

      // Warm up
      for (let s = 0; s < 5; s++) step(sim);

      const start = performance.now();
      const steps = 60;
      for (let s = 0; s < steps; s++) step(sim);
      const elapsed = performance.now() - start;

      table.push({ bodies: n, msPerStep: elapsed / steps });
    }

    console.log('\n[Performance Scaling Table]');
    console.log('Bodies | ms/step | Relative to N=10');
    console.log('-------|---------|------------------');
    const base = table[0].msPerStep;
    for (const row of table) {
      const relative = (row.msPerStep / base).toFixed(1);
      console.log(`${String(row.bodies).padStart(6)} | ${row.msPerStep.toFixed(3).padStart(7)} | ${relative}x`);
    }

    // Sanity: table should have 5 entries
    expect(table.length).toBe(5);
  });
});
