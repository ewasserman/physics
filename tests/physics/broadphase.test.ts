import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createRigidBody, resetBodyIdCounter } from '../../src/core/body.js';
import { createCircle, createAABB } from '../../src/core/shape.js';
import { SpatialHash, computeAABB } from '../../src/physics/broadphase.js';

describe('computeAABB', () => {
  beforeEach(() => resetBodyIdCounter());

  it('should compute AABB for a circle', () => {
    const body = createRigidBody({
      shape: createCircle(2),
      position: new Vec2(5, 3),
    });
    const aabb = computeAABB(body);
    expect(aabb.min.x).toBeCloseTo(3);
    expect(aabb.min.y).toBeCloseTo(1);
    expect(aabb.max.x).toBeCloseTo(7);
    expect(aabb.max.y).toBeCloseTo(5);
  });

  it('should compute AABB for an AABB shape', () => {
    const body = createRigidBody({
      shape: createAABB(3, 1),
      position: new Vec2(0, 0),
    });
    const aabb = computeAABB(body);
    expect(aabb.min.x).toBeCloseTo(-3);
    expect(aabb.min.y).toBeCloseTo(-1);
    expect(aabb.max.x).toBeCloseTo(3);
    expect(aabb.max.y).toBeCloseTo(1);
  });
});

describe('SpatialHash', () => {
  beforeEach(() => resetBodyIdCounter());

  it('should return no pairs when empty', () => {
    const hash = new SpatialHash(10);
    expect(hash.getPotentialPairs()).toEqual([]);
  });

  it('should return no pairs for a single body', () => {
    const hash = new SpatialHash(10);
    const body = createRigidBody({
      shape: createCircle(1),
      position: new Vec2(0, 0),
    });
    hash.insert(body);
    expect(hash.getPotentialPairs()).toEqual([]);
  });

  it('should return a pair for two overlapping bodies in the same cell', () => {
    const hash = new SpatialHash(10);
    const a = createRigidBody({ shape: createCircle(1), position: new Vec2(1, 1) });
    const b = createRigidBody({ shape: createCircle(1), position: new Vec2(2, 2) });
    hash.insert(a);
    hash.insert(b);
    const pairs = hash.getPotentialPairs();
    expect(pairs.length).toBe(1);
    expect(pairs[0]).toContain(a);
    expect(pairs[0]).toContain(b);
  });

  it('should not return self-pairs', () => {
    const hash = new SpatialHash(10);
    const a = createRigidBody({ shape: createCircle(1), position: new Vec2(0, 0) });
    hash.insert(a);
    const pairs = hash.getPotentialPairs();
    expect(pairs.length).toBe(0);
  });

  it('should not return duplicate pairs', () => {
    // Use a small cell size so a body spans multiple cells
    const hash = new SpatialHash(1);
    const a = createRigidBody({ shape: createCircle(2), position: new Vec2(0, 0) });
    const b = createRigidBody({ shape: createCircle(2), position: new Vec2(1, 1) });
    hash.insert(a);
    hash.insert(b);
    const pairs = hash.getPotentialPairs();
    // Both bodies span many cells, but the pair should appear only once
    expect(pairs.length).toBe(1);
  });

  it('should not pair bodies in distant cells', () => {
    const hash = new SpatialHash(2);
    const a = createRigidBody({ shape: createCircle(0.5), position: new Vec2(0, 0) });
    const b = createRigidBody({ shape: createCircle(0.5), position: new Vec2(100, 100) });
    hash.insert(a);
    hash.insert(b);
    const pairs = hash.getPotentialPairs();
    expect(pairs.length).toBe(0);
  });

  it('should clear properly between frames', () => {
    const hash = new SpatialHash(10);
    const a = createRigidBody({ shape: createCircle(1), position: new Vec2(0, 0) });
    const b = createRigidBody({ shape: createCircle(1), position: new Vec2(1, 1) });
    hash.insert(a);
    hash.insert(b);
    expect(hash.getPotentialPairs().length).toBe(1);

    hash.clear();
    expect(hash.getPotentialPairs().length).toBe(0);
  });
});
