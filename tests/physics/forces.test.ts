import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createRigidBody, resetBodyIdCounter } from '../../src/core/body.js';
import { createWorld, addBody } from '../../src/core/world.js';
import { createCircle } from '../../src/core/shape.js';
import { applyGravity } from '../../src/physics/forces.js';

describe('applyGravity', () => {
  beforeEach(() => resetBodyIdCounter());

  it('should apply gravity force to non-static bodies', () => {
    const world = createWorld({ gravity: new Vec2(0, -9.81) });
    const body = createRigidBody({
      shape: createCircle(1),
      mass: 2,
    });
    addBody(world, body);

    applyGravity(world);

    expect(body.force.y).toBeCloseTo(-9.81 * 2, 5);
  });

  it('should not apply gravity to static bodies', () => {
    const world = createWorld({ gravity: new Vec2(0, -9.81) });
    const body = createRigidBody({
      shape: createCircle(1),
      isStatic: true,
    });
    addBody(world, body);

    applyGravity(world);

    expect(body.force.x).toBe(0);
    expect(body.force.y).toBe(0);
  });
});
