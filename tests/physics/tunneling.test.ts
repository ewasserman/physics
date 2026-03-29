import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createSimulation, step } from '../../src/sim/simulation.js';
import { createRigidBody, resetBodyIdCounter } from '../../src/core/body.js';
import { createCircle, createAABB } from '../../src/core/shape.js';
import { addBody } from '../../src/core/world.js';
import { MAX_SPEED } from '../../src/physics/integrator.js';

describe('Tunneling prevention', () => {
  beforeEach(() => resetBodyIdCounter());

  it('fast ball (v=150 m/s) should not pass through floor', () => {
    const sim = createSimulation({
      gravity: new Vec2(0, -9.81),
      floorY: 0,
      dt: 1 / 60,
      solverIterations: 10,
    });

    // Ball moving very fast downward toward floor
    const ball = createRigidBody({
      shape: createCircle(0.5),
      position: new Vec2(0, 10),
      velocity: new Vec2(0, -150),
      mass: 1,
      restitution: 0.5,
    });
    addBody(sim.world, ball);

    // Run 120 steps (2 seconds)
    for (let i = 0; i < 120; i++) {
      step(sim);
    }

    // Ball should be above (or at) the floor, not below it
    expect(ball.position.y).toBeGreaterThan(-0.5);
    expect(Number.isFinite(ball.position.y)).toBe(true);
  });

  it('velocity cap should clamp speeds to MAX_SPEED', () => {
    const sim = createSimulation({
      gravity: new Vec2(0, 0), // no gravity
      floorY: -Infinity,
      dt: 1 / 60,
    });

    const body = createRigidBody({
      shape: createCircle(0.5),
      position: new Vec2(0, 0),
      velocity: new Vec2(300, 400), // speed = 500 >> MAX_SPEED
      mass: 1,
    });
    addBody(sim.world, body);

    step(sim);

    // After one step, velocity should have been capped
    const speed = body.velocity.length();
    // Speed after damping will be <= MAX_SPEED * damping
    expect(speed).toBeLessThanOrEqual(MAX_SPEED * 1.01);
  });

  it('velocity cap prevents extreme speeds that cause tunneling', () => {
    const sim = createSimulation({
      gravity: new Vec2(0, 0),
      floorY: -Infinity,
      dt: 1 / 60,
    });

    // A body with extreme initial velocity
    const body = createRigidBody({
      shape: createCircle(0.5),
      position: new Vec2(0, 0),
      velocity: new Vec2(500, 0),
      mass: 1,
    });
    addBody(sim.world, body);

    step(sim);

    // After one step, the velocity should be capped
    expect(body.velocity.length()).toBeLessThanOrEqual(MAX_SPEED * 1.01);

    // Position should only have moved by at most MAX_SPEED * dt (not 500 * dt)
    // MAX_SPEED=200, dt=1/60, so max displacement ~3.33m
    expect(body.position.x).toBeLessThan(MAX_SPEED / 60 + 0.1);
  });
});
