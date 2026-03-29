import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createRigidBody, resetBodyIdCounter } from '../../src/core/body.js';
import { createCircle } from '../../src/core/shape.js';
import { resolveContact } from '../../src/physics/response.js';
import { Contact } from '../../src/physics/collision.js';

describe('resolveContact', () => {
  beforeEach(() => resetBodyIdCounter());

  it('should reverse velocity on floor bounce with restitution=1', () => {
    const body = createRigidBody({
      shape: createCircle(1),
      mass: 1,
      position: new Vec2(0, 0.8),
      velocity: new Vec2(0, -5),
      restitution: 1,
    });

    const contact: Contact = {
      bodyA: body,
      bodyB: null,
      normal: new Vec2(0, 1),
      penetration: 0.2,
      point: new Vec2(0, 0),
    };

    resolveContact(contact);

    // Velocity should be reversed (perfectly elastic bounce)
    expect(body.velocity.y).toBeCloseTo(5, 5);
    // Position should be corrected out of floor
    expect(body.position.y).toBeCloseTo(1, 5);
  });

  it('should reduce velocity with restitution < 1', () => {
    const body = createRigidBody({
      shape: createCircle(1),
      mass: 1,
      position: new Vec2(0, 0.8),
      velocity: new Vec2(0, -10),
      restitution: 0.5,
    });

    const contact: Contact = {
      bodyA: body,
      bodyB: null,
      normal: new Vec2(0, 1),
      penetration: 0.2,
      point: new Vec2(0, 0),
    };

    resolveContact(contact);

    // Velocity should be reduced: -(1 + 0.5) * (-10) / (1) = 15, so vy = -10 + 15 = 5
    expect(body.velocity.y).toBeCloseTo(5, 5);
  });

  it('should not apply impulse if bodies are separating', () => {
    const body = createRigidBody({
      shape: createCircle(1),
      mass: 1,
      position: new Vec2(0, 0.8),
      velocity: new Vec2(0, 5), // moving upward already
      restitution: 1,
    });

    const contact: Contact = {
      bodyA: body,
      bodyB: null,
      normal: new Vec2(0, 1),
      penetration: 0.2,
      point: new Vec2(0, 0),
    };

    resolveContact(contact);

    // Velocity should remain unchanged (separating)
    expect(body.velocity.y).toBeCloseTo(5, 5);
  });
});
