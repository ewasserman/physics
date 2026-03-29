import { describe, it, expect, beforeEach } from 'vitest';
import { createRigidBody, applyForce, resetBodyIdCounter } from '../../src/core/body.js';
import { createCircle, createAABB, ShapeType } from '../../src/core/shape.js';
import { Vec2 } from '../../src/math/vec2.js';
import { almostEqual } from '../../src/math/utils.js';

describe('createRigidBody', () => {
  beforeEach(() => {
    resetBodyIdCounter();
  });

  it('creates a dynamic body with sensible defaults', () => {
    const body = createRigidBody({ shape: createCircle(1) });
    expect(body.position.x).toBe(0);
    expect(body.position.y).toBe(0);
    expect(body.angle).toBe(0);
    expect(body.velocity.x).toBe(0);
    expect(body.velocity.y).toBe(0);
    expect(body.mass).toBe(1);
    expect(body.inverseMass).toBe(1);
    expect(body.isStatic).toBe(false);
    expect(body.restitution).toBe(0.5);
    expect(body.friction).toBe(0.3);
  });

  it('static body has inverseMass = 0 and inverseInertia = 0', () => {
    const body = createRigidBody({
      shape: createCircle(1),
      isStatic: true,
    });
    expect(body.mass).toBe(Infinity);
    expect(body.inverseMass).toBe(0);
    expect(body.inertia).toBe(Infinity);
    expect(body.inverseInertia).toBe(0);
    expect(body.isStatic).toBe(true);
  });

  it('respects custom options', () => {
    const body = createRigidBody({
      shape: createAABB(2, 3),
      position: new Vec2(10, 20),
      mass: 5,
      restitution: 0.8,
      friction: 0.1,
    });
    expect(body.position.x).toBe(10);
    expect(body.position.y).toBe(20);
    expect(body.mass).toBe(5);
    expect(body.restitution).toBe(0.8);
    expect(body.friction).toBe(0.1);
    expect(body.shape.type).toBe(ShapeType.AABB);
  });

  it('assigns unique IDs', () => {
    const a = createRigidBody({ shape: createCircle(1) });
    const b = createRigidBody({ shape: createCircle(1) });
    expect(a.id).not.toBe(b.id);
  });

  it('computes inertia automatically from shape and mass', () => {
    const body = createRigidBody({
      shape: createCircle(2),
      mass: 4,
    });
    // Circle inertia = 0.5 * m * r^2 = 0.5 * 4 * 4 = 8
    expect(almostEqual(body.inertia, 8)).toBe(true);
    expect(almostEqual(body.inverseInertia, 1 / 8)).toBe(true);
  });
});

describe('applyForce', () => {
  it('accumulates force on body', () => {
    const body = createRigidBody({ shape: createCircle(1) });
    applyForce(body, new Vec2(10, 0));
    applyForce(body, new Vec2(0, 5));
    expect(body.force.x).toBe(10);
    expect(body.force.y).toBe(5);
  });

  it('computes torque when point is given', () => {
    const body = createRigidBody({
      shape: createCircle(1),
      position: new Vec2(0, 0),
    });
    // Force applied at (1, 0) pointing up: torque = r x F = (1,0) x (0,1) = 1
    applyForce(body, new Vec2(0, 1), new Vec2(1, 0));
    expect(almostEqual(body.torque, 1)).toBe(true);
  });
});
