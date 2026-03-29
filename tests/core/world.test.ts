import { describe, it, expect, beforeEach } from 'vitest';
import { createWorld, addBody, removeBody } from '../../src/core/world.js';
import { createRigidBody, resetBodyIdCounter } from '../../src/core/body.js';
import { createCircle, createAABB } from '../../src/core/shape.js';
import { Vec2 } from '../../src/math/vec2.js';

describe('createWorld', () => {
  it('creates a world with default gravity and timestep', () => {
    const world = createWorld();
    expect(world.gravity.x).toBe(0);
    expect(world.gravity.y).toBe(-9.81);
    expect(world.dt).toBeCloseTo(1 / 60);
    expect(world.time).toBe(0);
    expect(world.bodies).toEqual([]);
  });

  it('respects custom gravity', () => {
    const world = createWorld({ gravity: new Vec2(0, -20) });
    expect(world.gravity.x).toBe(0);
    expect(world.gravity.y).toBe(-20);
  });

  it('respects custom timestep', () => {
    const world = createWorld({ dt: 1 / 120 });
    expect(world.dt).toBeCloseTo(1 / 120);
  });

  it('can create zero-gravity world', () => {
    const world = createWorld({ gravity: Vec2.zero() });
    expect(world.gravity.x).toBe(0);
    expect(world.gravity.y).toBe(0);
  });
});

describe('addBody', () => {
  beforeEach(() => {
    resetBodyIdCounter();
  });

  it('adds a body to the world', () => {
    const world = createWorld();
    const body = createRigidBody({ shape: createCircle(1) });
    addBody(world, body);
    expect(world.bodies).toHaveLength(1);
    expect(world.bodies[0]).toBe(body);
  });

  it('adds multiple bodies', () => {
    const world = createWorld();
    const a = createRigidBody({ shape: createCircle(1) });
    const b = createRigidBody({ shape: createAABB(1, 1) });
    addBody(world, a);
    addBody(world, b);
    expect(world.bodies).toHaveLength(2);
  });

  it('all bodies have unique IDs', () => {
    const world = createWorld();
    const bodies = Array.from({ length: 5 }, () =>
      createRigidBody({ shape: createCircle(1) })
    );
    bodies.forEach((b) => addBody(world, b));

    const ids = world.bodies.map((b) => b.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(5);
  });
});

describe('removeBody', () => {
  beforeEach(() => {
    resetBodyIdCounter();
  });

  it('removes a body from the world', () => {
    const world = createWorld();
    const body = createRigidBody({ shape: createCircle(1) });
    addBody(world, body);
    expect(world.bodies).toHaveLength(1);
    removeBody(world, body);
    expect(world.bodies).toHaveLength(0);
  });

  it('only removes the specified body', () => {
    const world = createWorld();
    const a = createRigidBody({ shape: createCircle(1) });
    const b = createRigidBody({ shape: createCircle(2) });
    addBody(world, a);
    addBody(world, b);
    removeBody(world, a);
    expect(world.bodies).toHaveLength(1);
    expect(world.bodies[0]).toBe(b);
  });

  it('handles removing a body not in the world gracefully', () => {
    const world = createWorld();
    const body = createRigidBody({ shape: createCircle(1) });
    // Should not throw
    expect(() => removeBody(world, body)).not.toThrow();
    expect(world.bodies).toHaveLength(0);
  });

  it('handles removing from empty world gracefully', () => {
    const world = createWorld();
    const body = createRigidBody({ shape: createCircle(1) });
    expect(() => removeBody(world, body)).not.toThrow();
  });

  it('can remove and re-add a body', () => {
    const world = createWorld();
    const body = createRigidBody({ shape: createCircle(1) });
    addBody(world, body);
    removeBody(world, body);
    expect(world.bodies).toHaveLength(0);
    addBody(world, body);
    expect(world.bodies).toHaveLength(1);
    expect(world.bodies[0]).toBe(body);
  });
});
