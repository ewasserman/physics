import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createScene } from '../../src/sim/scene.js';
import { step } from '../../src/sim/simulation.js';
import { resetBodyIdCounter } from '../../src/core/body.js';

describe('Scene Validation', () => {
  beforeEach(() => {
    resetBodyIdCounter();
  });

  it('creates a scene with mixed objects and runs 200 steps without error', () => {
    const sim = createScene({
      width: 20,
      height: 15,
      gravity: new Vec2(0, -9.81),
      objects: [
        { type: 'car', x: -3, y: 3 },
        { type: 'circle', x: 0, y: 8, radius: 0.5, mass: 1 },
        { type: 'circle', x: 2, y: 6, radius: 0.3, mass: 0.5 },
        { type: 'static-box', x: 4, y: 2, width: 2, height: 0.5 },
        { type: 'wall', x: -8, y: 5, height: 6 },
        { type: 'box', x: -1, y: 10, width: 1, height: 1, mass: 2 },
      ],
    });

    // Should not throw for 200 steps
    for (let i = 0; i < 200; i++) {
      step(sim);
    }

    // If we reached here, the sim ran without error
    expect(sim.stepCount).toBe(200);
  });

  it('creates the correct number of bodies', () => {
    const sim = createScene({
      width: 10,
      height: 10,
      objects: [
        { type: 'car', x: 0, y: 3 },            // 3 bodies (chassis + 2 wheels)
        { type: 'circle', x: 2, y: 5, radius: 0.5, mass: 1 }, // 1 body
        { type: 'static-box', x: -3, y: 1, width: 2, height: 1 }, // 1 body
      ],
    });

    // Boundary creates 4 walls, car creates 3, circle 1, static-box 1 = 9 total
    expect(sim.world.bodies.length).toBe(9);
  });

  it('car constraints are present in the scene', () => {
    const sim = createScene({
      width: 10,
      height: 10,
      objects: [
        { type: 'car', x: 0, y: 3 },
      ],
    });

    // Car has 2 revolute constraints (2 axles)
    expect(sim.world.constraints.length).toBe(2);
  });

  it('scene with only static objects runs without error', () => {
    const sim = createScene({
      width: 10,
      height: 10,
      objects: [
        { type: 'static-box', x: 0, y: 2, width: 3, height: 0.5 },
        { type: 'wall', x: 3, y: 5, height: 8 },
      ],
    });

    for (let i = 0; i < 200; i++) {
      step(sim);
    }

    expect(sim.stepCount).toBe(200);
  });

  it('scene with multiple cars and circles creates expected body count', () => {
    const sim = createScene({
      width: 30,
      height: 15,
      objects: [
        { type: 'car', x: -8, y: 3 },   // 3 bodies
        { type: 'car', x: 8, y: 3 },    // 3 bodies
        { type: 'circle', x: 0, y: 10, radius: 0.4, mass: 1 },  // 1 body
        { type: 'circle', x: 1, y: 10, radius: 0.4, mass: 1 },  // 1 body
        { type: 'circle', x: -1, y: 10, radius: 0.4, mass: 1 }, // 1 body
      ],
    });

    // 4 boundary walls + 2*3 car bodies + 3 circles = 4 + 6 + 3 = 13
    expect(sim.world.bodies.length).toBe(13);
    // 2 cars * 2 constraints = 4
    expect(sim.world.constraints.length).toBe(4);
  });
});
