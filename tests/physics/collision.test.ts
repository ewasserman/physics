import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createRigidBody, resetBodyIdCounter } from '../../src/core/body.js';
import { createWorld, addBody } from '../../src/core/world.js';
import { createCircle, createAABB } from '../../src/core/shape.js';
import { detectCircleFloor, detectAABBFloor, detectFloorCollisions } from '../../src/physics/collision.js';

describe('detectCircleFloor', () => {
  beforeEach(() => resetBodyIdCounter());

  it('should detect penetration when circle is below floor', () => {
    const body = createRigidBody({
      shape: createCircle(1),
      position: new Vec2(0, 0.5), // center at 0.5, radius 1, bottom at -0.5
    });
    const contact = detectCircleFloor(body, 0);
    expect(contact).not.toBeNull();
    expect(contact!.penetration).toBeCloseTo(0.5, 5);
    expect(contact!.normal.y).toBe(1); // upward
  });

  it('should return null when circle is above floor', () => {
    const body = createRigidBody({
      shape: createCircle(1),
      position: new Vec2(0, 5),
    });
    const contact = detectCircleFloor(body, 0);
    expect(contact).toBeNull();
  });

  it('should return null when circle is exactly touching floor', () => {
    const body = createRigidBody({
      shape: createCircle(1),
      position: new Vec2(0, 1), // bottom exactly at floor
    });
    const contact = detectCircleFloor(body, 0);
    expect(contact).toBeNull();
  });
});

describe('detectAABBFloor', () => {
  beforeEach(() => resetBodyIdCounter());

  it('should detect penetration when AABB is below floor', () => {
    const body = createRigidBody({
      shape: createAABB(1, 1),
      position: new Vec2(0, 0.5), // bottom at -0.5
    });
    const contact = detectAABBFloor(body, 0);
    expect(contact).not.toBeNull();
    expect(contact!.penetration).toBeCloseTo(0.5, 5);
  });

  it('should return null when AABB is above floor', () => {
    const body = createRigidBody({
      shape: createAABB(1, 1),
      position: new Vec2(0, 5),
    });
    const contact = detectAABBFloor(body, 0);
    expect(contact).toBeNull();
  });
});

describe('detectFloorCollisions', () => {
  beforeEach(() => resetBodyIdCounter());

  it('should detect multiple collisions', () => {
    const world = createWorld();
    const circle = createRigidBody({
      shape: createCircle(1),
      position: new Vec2(-2, 0.5),
    });
    const aabb = createRigidBody({
      shape: createAABB(1, 1),
      position: new Vec2(2, 0.5),
    });
    addBody(world, circle);
    addBody(world, aabb);

    const contacts = detectFloorCollisions(world, 0);
    expect(contacts).toHaveLength(2);
  });

  it('should skip static bodies', () => {
    const world = createWorld();
    const body = createRigidBody({
      shape: createCircle(1),
      position: new Vec2(0, 0.5),
      isStatic: true,
    });
    addBody(world, body);

    const contacts = detectFloorCollisions(world, 0);
    expect(contacts).toHaveLength(0);
  });
});
