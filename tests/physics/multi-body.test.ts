import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createRigidBody, resetBodyIdCounter } from '../../src/core/body.js';
import { addBody } from '../../src/core/world.js';
import { createCircle, createAABB } from '../../src/core/shape.js';
import { createSimulation, step } from '../../src/sim/simulation.js';

describe('multi-body collisions', () => {
  beforeEach(() => resetBodyIdCounter());

  it('two circles moving head-on should bounce apart', () => {
    const sim = createSimulation({
      gravity: new Vec2(0, 0), // no gravity for this test
      floorY: -100,           // floor far away
      solverIterations: 8,
    });

    const a = createRigidBody({
      shape: createCircle(1),
      position: new Vec2(-0.5, 0),
      velocity: new Vec2(5, 0),
      mass: 1,
      restitution: 1, // perfect elastic
    });
    const b = createRigidBody({
      shape: createCircle(1),
      position: new Vec2(0.5, 0),
      velocity: new Vec2(-5, 0),
      mass: 1,
      restitution: 1,
    });

    addBody(sim.world, a);
    addBody(sim.world, b);

    // Step a few times to let collision resolve
    for (let i = 0; i < 10; i++) {
      step(sim);
    }

    // After elastic collision, velocities should roughly swap
    // a should be moving left, b should be moving right
    expect(a.velocity.x).toBeLessThan(0);
    expect(b.velocity.x).toBeGreaterThan(0);

    // They should have separated
    expect(b.position.x - a.position.x).toBeGreaterThan(1.5);
  });

  it('circle should bounce off a static AABB', () => {
    const sim = createSimulation({
      gravity: new Vec2(0, 0),
      floorY: -100,
      solverIterations: 8,
    });

    const circle = createRigidBody({
      shape: createCircle(0.5),
      position: new Vec2(0, 2),
      velocity: new Vec2(0, -5),
      mass: 1,
      restitution: 1,
    });

    const platform = createRigidBody({
      shape: createAABB(5, 0.5),
      position: new Vec2(0, 0),
      isStatic: true,
      restitution: 1,
    });

    addBody(sim.world, circle);
    addBody(sim.world, platform);

    for (let i = 0; i < 20; i++) {
      step(sim);
    }

    // Circle should have bounced upward
    expect(circle.velocity.y).toBeGreaterThan(0);
    // Circle should be above the platform
    expect(circle.position.y).toBeGreaterThan(0.5);
  });

  it('5-body stability: no NaN after 1000 steps', () => {
    const sim = createSimulation({
      gravity: new Vec2(0, -9.81),
      floorY: 0,
      solverIterations: 8,
      broadphaseCellSize: 4,
    });

    // Create 5 circles at various positions
    for (let i = 0; i < 5; i++) {
      const body = createRigidBody({
        shape: createCircle(0.5),
        position: new Vec2(i * 0.3, 5 + i * 2),
        velocity: new Vec2((i - 2) * 1, 0),
        mass: 1,
        restitution: 0.5,
      });
      addBody(sim.world, body);
    }

    for (let i = 0; i < 1000; i++) {
      step(sim);
    }

    // Check no NaN in any body's state
    for (const body of sim.world.bodies) {
      expect(Number.isFinite(body.position.x)).toBe(true);
      expect(Number.isFinite(body.position.y)).toBe(true);
      expect(Number.isFinite(body.velocity.x)).toBe(true);
      expect(Number.isFinite(body.velocity.y)).toBe(true);
      expect(Number.isFinite(body.angularVelocity)).toBe(true);
    }
  });
});
