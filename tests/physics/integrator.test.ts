import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createRigidBody, applyForce, resetBodyIdCounter } from '../../src/core/body.js';
import { createWorld, addBody } from '../../src/core/world.js';
import { createCircle } from '../../src/core/shape.js';
import { integrateBody, integrateWorld } from '../../src/physics/integrator.js';

describe('integrateBody', () => {
  beforeEach(() => resetBodyIdCounter());

  it('should not modify static bodies', () => {
    const body = createRigidBody({
      shape: createCircle(1),
      isStatic: true,
      position: new Vec2(5, 5),
    });
    applyForce(body, new Vec2(100, 100));
    integrateBody(body, 1 / 60);
    expect(body.position.x).toBe(5);
    expect(body.position.y).toBe(5);
  });

  it('should update velocity from applied force', () => {
    const body = createRigidBody({
      shape: createCircle(1),
      mass: 1,
      position: new Vec2(0, 10),
    });
    applyForce(body, new Vec2(0, -9.81));
    integrateBody(body, 1, 1); // no damping, dt=1
    // velocity should be approximately -9.81
    expect(body.velocity.y).toBeCloseTo(-9.81, 2);
  });

  it('should use symplectic Euler (velocity before position)', () => {
    const body = createRigidBody({
      shape: createCircle(1),
      mass: 1,
      position: new Vec2(0, 0),
    });
    applyForce(body, new Vec2(10, 0));
    integrateBody(body, 1, 1); // no damping
    // velocity = 0 + 10*1 = 10, position = 0 + 10*1 = 10 (uses NEW velocity)
    expect(body.velocity.x).toBeCloseTo(10, 5);
    expect(body.position.x).toBeCloseTo(10, 5);
  });
});

describe('integrateWorld', () => {
  beforeEach(() => resetBodyIdCounter());

  it('should integrate all non-static bodies and clear accumulators', () => {
    const world = createWorld();
    const body = createRigidBody({
      shape: createCircle(1),
      mass: 1,
      position: new Vec2(0, 10),
    });
    addBody(world, body);
    applyForce(body, new Vec2(0, -9.81));

    integrateWorld(world, 1 / 60);

    // Force accumulator should be cleared
    expect(body.force.x).toBe(0);
    expect(body.force.y).toBe(0);
    expect(body.torque).toBe(0);

    // Body should have moved
    expect(body.velocity.y).toBeLessThan(0);
    expect(body.position.y).toBeLessThan(10);
  });
});
