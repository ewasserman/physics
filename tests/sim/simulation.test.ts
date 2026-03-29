import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createRigidBody, resetBodyIdCounter } from '../../src/core/body.js';
import { addBody } from '../../src/core/world.js';
import { createCircle, createAABB } from '../../src/core/shape.js';
import { createSimulation, step, getSnapshot } from '../../src/sim/simulation.js';

describe('Simulation', () => {
  beforeEach(() => resetBodyIdCounter());

  it('a body should fall under gravity', () => {
    const sim = createSimulation({
      gravity: new Vec2(0, -9.81),
      floorY: -100, // far below so no collision
    });

    const body = createRigidBody({
      shape: createCircle(1),
      mass: 1,
      position: new Vec2(0, 50),
    });
    addBody(sim.world, body);

    const initialY = body.position.y;

    for (let i = 0; i < 10; i++) {
      step(sim);
    }

    expect(body.position.y).toBeLessThan(initialY);
    expect(body.velocity.y).toBeLessThan(0);
  });

  it('a body should bounce off the floor', () => {
    const sim = createSimulation({
      gravity: new Vec2(0, -9.81),
      floorY: 0,
    });

    const body = createRigidBody({
      shape: createCircle(1),
      mass: 1,
      position: new Vec2(0, 10),
      restitution: 0.8,
    });
    addBody(sim.world, body);

    // Run until the body hits the floor and bounces
    let hitFloor = false;
    for (let i = 0; i < 300; i++) {
      step(sim);
      if (body.velocity.y > 0 && body.position.y < 5) {
        hitFloor = true;
        break;
      }
    }

    expect(hitFloor).toBe(true);
    expect(body.velocity.y).toBeGreaterThan(0); // bounced upward
  });

  it('should run 1000 steps without NaN or explosion', () => {
    const sim = createSimulation({
      gravity: new Vec2(0, -9.81),
      floorY: 0,
    });

    const circle = createRigidBody({
      shape: createCircle(0.5),
      mass: 1,
      position: new Vec2(0, 20),
      restitution: 0.6,
    });
    const aabb = createRigidBody({
      shape: createAABB(0.5, 0.5),
      mass: 2,
      position: new Vec2(3, 15),
      restitution: 0.4,
    });
    addBody(sim.world, circle);
    addBody(sim.world, aabb);

    for (let i = 0; i < 1000; i++) {
      step(sim);
    }

    // Check no NaN
    for (const body of sim.world.bodies) {
      expect(Number.isFinite(body.position.x)).toBe(true);
      expect(Number.isFinite(body.position.y)).toBe(true);
      expect(Number.isFinite(body.velocity.x)).toBe(true);
      expect(Number.isFinite(body.velocity.y)).toBe(true);
    }

    // Check no explosion (positions should be reasonable)
    for (const body of sim.world.bodies) {
      expect(Math.abs(body.position.x)).toBeLessThan(1000);
      expect(Math.abs(body.position.y)).toBeLessThan(1000);
    }
  });

  it('getSnapshot should capture state', () => {
    const sim = createSimulation();
    const body = createRigidBody({
      shape: createCircle(1),
      mass: 1,
      position: new Vec2(3, 7),
    });
    addBody(sim.world, body);

    step(sim);

    const snapshot = getSnapshot(sim);
    expect(snapshot.stepCount).toBe(1);
    expect(snapshot.bodies).toHaveLength(1);
    expect(snapshot.bodies[0].id).toBe(body.id);
  });
});
