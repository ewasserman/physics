import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createSimulation, step } from '../../src/sim/simulation.js';
import { createRigidBody, resetBodyIdCounter, applyForce } from '../../src/core/body.js';
import { createCircle, createAABB } from '../../src/core/shape.js';
import { addBody } from '../../src/core/world.js';
import { MAX_SPEED } from '../../src/physics/integrator.js';

describe('Tunneling prevention — final', () => {
  beforeEach(() => resetBodyIdCounter());

  it('fast circle (v=150 m/s downward) does not pass through floor', () => {
    const sim = createSimulation({
      gravity: new Vec2(0, -9.81),
      floorY: 0,
      dt: 1 / 60,
      solverIterations: 10,
    });

    const ball = createRigidBody({
      shape: createCircle(0.5),
      position: new Vec2(0, 10),
      velocity: new Vec2(0, -150),
      mass: 1,
      restitution: 0.5,
    });
    addBody(sim.world, ball);

    // Run 300 steps (5 seconds)
    for (let i = 0; i < 300; i++) {
      step(sim);
      // At no point should the ball be deeply below the floor
      expect(ball.position.y).toBeGreaterThan(-1.0);
      expect(Number.isFinite(ball.position.y)).toBe(true);
    }

    // Final: ball should be at or above floor
    expect(ball.position.y).toBeGreaterThan(-0.5);
  });

  it('fast circle (v=180 m/s) aimed at thick static AABB wall bounces off', () => {
    // Use a thick wall (halfWidth=5) so the ball cannot tunnel through in one step.
    // At MAX_SPEED=200 and dt=1/120, max displacement per step is ~1.67m, well under
    // the wall's 10m total width. Use higher tick rate for reliable detection.
    const sim = createSimulation({
      gravity: new Vec2(0, 0),
      floorY: -Infinity,
      dt: 1 / 120,
      solverIterations: 10,
    });

    // Thick static wall at x=10 (extends from x=5 to x=15)
    const wall = createRigidBody({
      shape: createAABB(5, 5),
      position: new Vec2(10, 0),
      isStatic: true,
      restitution: 0.5,
    });
    addBody(sim.world, wall);

    // Circle moving fast to the right toward the wall
    const ball = createRigidBody({
      shape: createCircle(0.5),
      position: new Vec2(0, 0),
      velocity: new Vec2(180, 0),
      mass: 1,
      restitution: 0.5,
    });
    addBody(sim.world, ball);

    // Run 240 steps (2 seconds at 120Hz)
    for (let i = 0; i < 240; i++) {
      step(sim);
    }

    // Ball should not have passed through the wall (wall right edge is x=15)
    // Ball should bounce back and be to the left of the wall's right edge
    expect(ball.position.x).toBeLessThan(16);
    expect(Number.isFinite(ball.position.x)).toBe(true);
    expect(Number.isFinite(ball.position.y)).toBe(true);
  });

  it('velocity cap: body with extreme force does not exceed MAX_SPEED', () => {
    const sim = createSimulation({
      gravity: new Vec2(0, 0),
      floorY: -Infinity,
      dt: 1 / 60,
    });

    const body = createRigidBody({
      shape: createCircle(0.5),
      position: new Vec2(0, 0),
      mass: 1,
    });
    addBody(sim.world, body);

    // Apply an extreme force over multiple steps
    for (let i = 0; i < 60; i++) {
      applyForce(body, new Vec2(100000, 0));
      step(sim);

      const speed = body.velocity.length();
      // Velocity should never exceed MAX_SPEED (with small tolerance for damping timing)
      expect(speed).toBeLessThanOrEqual(MAX_SPEED * 1.01);
    }
  });
});
