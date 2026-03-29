import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createScene, SceneConfig } from '../../src/sim/scene.js';
import { step } from '../../src/sim/simulation.js';
import { resetBodyIdCounter } from '../../src/core/body.js';

describe('Scene Builder', () => {
  beforeEach(() => {
    resetBodyIdCounter();
  });

  it('creates a scene with boundary walls', () => {
    const config: SceneConfig = {
      width: 20,
      height: 10,
      objects: [],
    };
    const sim = createScene(config);
    // 4 boundary walls
    expect(sim.world.bodies.length).toBe(4);
  });

  it('creates a scene with a circle', () => {
    const config: SceneConfig = {
      width: 20,
      height: 10,
      objects: [
        { type: 'circle', x: 0, y: 5, radius: 0.5, mass: 1 },
      ],
    };
    const sim = createScene(config);
    // 4 boundary + 1 circle
    expect(sim.world.bodies.length).toBe(5);
  });

  it('creates a scene with a dynamic box', () => {
    const config: SceneConfig = {
      width: 20,
      height: 10,
      objects: [
        { type: 'box', x: 0, y: 5, width: 1, height: 1, mass: 2 },
      ],
    };
    const sim = createScene(config);
    // 4 boundary + 1 box
    expect(sim.world.bodies.length).toBe(5);
    const box = sim.world.bodies[4];
    expect(box.isStatic).toBe(false);
    expect(box.mass).toBe(2);
  });

  it('creates a scene with a static-box', () => {
    const config: SceneConfig = {
      width: 20,
      height: 10,
      objects: [
        { type: 'static-box', x: 0, y: 2, width: 4, height: 1 },
      ],
    };
    const sim = createScene(config);
    const staticBox = sim.world.bodies[4];
    expect(staticBox.isStatic).toBe(true);
  });

  it('creates a scene with a wall object', () => {
    const config: SceneConfig = {
      width: 20,
      height: 10,
      objects: [
        { type: 'wall', x: 3, y: 5, height: 8 },
      ],
    };
    const sim = createScene(config);
    expect(sim.world.bodies.length).toBe(5);
    const wall = sim.world.bodies[4];
    expect(wall.isStatic).toBe(true);
  });

  it('creates a scene with a car', () => {
    const config: SceneConfig = {
      width: 40,
      height: 20,
      objects: [
        { type: 'car', x: 0, y: 5 },
      ],
    };
    const sim = createScene(config);
    // 4 boundary + 3 car bodies (chassis + 2 wheels)
    expect(sim.world.bodies.length).toBe(7);
    expect(sim.world.constraints.length).toBe(2);
  });

  it('creates a scene with mixed objects and runs simulation', () => {
    const config: SceneConfig = {
      width: 40,
      height: 20,
      objects: [
        { type: 'car', x: -5, y: 5 },
        { type: 'circle', x: 5, y: 10, radius: 0.5, mass: 1 },
        { type: 'static-box', x: 0, y: 2, width: 10, height: 0.5 },
        { type: 'box', x: 3, y: 8, width: 1, height: 1, mass: 1 },
      ],
    };
    const sim = createScene(config);

    // Run 60 steps without error
    for (let i = 0; i < 60; i++) {
      step(sim);
    }
    expect(sim.stepCount).toBe(60);
    expect(sim.world.time).toBeGreaterThan(0);
  });

  it('accepts custom gravity and dt', () => {
    const config: SceneConfig = {
      width: 10,
      height: 10,
      gravity: new Vec2(0, -5),
      dt: 1 / 30,
      objects: [],
    };
    const sim = createScene(config);
    expect(sim.config.dt).toBeCloseTo(1 / 30);
  });
});
