import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createRigidBody, resetBodyIdCounter } from '../../src/core/body.js';
import { createCircle, createAABB } from '../../src/core/shape.js';
import { circleVsCircle, circleVsAABB, aabbVsAABB, detectCollision } from '../../src/physics/narrowphase.js';

describe('circleVsCircle', () => {
  beforeEach(() => resetBodyIdCounter());

  it('should detect overlapping circles', () => {
    const a = createRigidBody({ shape: createCircle(1), position: new Vec2(0, 0) });
    const b = createRigidBody({ shape: createCircle(1), position: new Vec2(1.5, 0) });
    const contact = circleVsCircle(a, b);
    expect(contact).not.toBeNull();
    expect(contact!.penetration).toBeCloseTo(0.5);
    // Normal should point from A to B (positive x)
    expect(contact!.normal.x).toBeCloseTo(1);
    expect(contact!.normal.y).toBeCloseTo(0);
  });

  it('should return null for separated circles', () => {
    const a = createRigidBody({ shape: createCircle(1), position: new Vec2(0, 0) });
    const b = createRigidBody({ shape: createCircle(1), position: new Vec2(3, 0) });
    const contact = circleVsCircle(a, b);
    expect(contact).toBeNull();
  });

  it('should detect touching circles (zero penetration boundary)', () => {
    const a = createRigidBody({ shape: createCircle(1), position: new Vec2(0, 0) });
    const b = createRigidBody({ shape: createCircle(1), position: new Vec2(2, 0) });
    const contact = circleVsCircle(a, b);
    // Exactly touching: dist == sumR, so distSq >= sumR*sumR -> null
    expect(contact).toBeNull();
  });

  it('should have correct normal direction for vertical overlap', () => {
    const a = createRigidBody({ shape: createCircle(1), position: new Vec2(0, 0) });
    const b = createRigidBody({ shape: createCircle(1), position: new Vec2(0, 1) });
    const contact = circleVsCircle(a, b);
    expect(contact).not.toBeNull();
    // Normal from A to B should be upward
    expect(contact!.normal.x).toBeCloseTo(0);
    expect(contact!.normal.y).toBeCloseTo(1);
  });
});

describe('circleVsAABB', () => {
  beforeEach(() => resetBodyIdCounter());

  it('should detect circle overlapping AABB from the side', () => {
    const circle = createRigidBody({ shape: createCircle(1), position: new Vec2(-1.5, 0) });
    const box = createRigidBody({ shape: createAABB(1, 1), position: new Vec2(0, 0) });
    const contact = circleVsAABB(circle, box);
    expect(contact).not.toBeNull();
    expect(contact!.penetration).toBeCloseTo(0.5);
  });

  it('should return null for separated circle and AABB', () => {
    const circle = createRigidBody({ shape: createCircle(1), position: new Vec2(5, 0) });
    const box = createRigidBody({ shape: createAABB(1, 1), position: new Vec2(0, 0) });
    const contact = circleVsAABB(circle, box);
    expect(contact).toBeNull();
  });

  it('should detect circle above AABB overlapping from top', () => {
    const circle = createRigidBody({ shape: createCircle(0.5), position: new Vec2(0, 1.2) });
    const box = createRigidBody({ shape: createAABB(2, 1), position: new Vec2(0, 0) });
    const contact = circleVsAABB(circle, box);
    expect(contact).not.toBeNull();
    expect(contact!.penetration).toBeCloseTo(0.3, 1);
  });
});

describe('aabbVsAABB', () => {
  beforeEach(() => resetBodyIdCounter());

  it('should detect overlapping AABBs', () => {
    const a = createRigidBody({ shape: createAABB(1, 1), position: new Vec2(0, 0) });
    const b = createRigidBody({ shape: createAABB(1, 1), position: new Vec2(1.5, 0) });
    const contact = aabbVsAABB(a, b);
    expect(contact).not.toBeNull();
    expect(contact!.penetration).toBeCloseTo(0.5);
    // Normal should point in positive X (from A to B)
    expect(contact!.normal.x).toBeCloseTo(1);
    expect(contact!.normal.y).toBeCloseTo(0);
  });

  it('should return null for separated AABBs', () => {
    const a = createRigidBody({ shape: createAABB(1, 1), position: new Vec2(0, 0) });
    const b = createRigidBody({ shape: createAABB(1, 1), position: new Vec2(5, 0) });
    const contact = aabbVsAABB(a, b);
    expect(contact).toBeNull();
  });

  it('should choose minimum penetration axis', () => {
    const a = createRigidBody({ shape: createAABB(1, 1), position: new Vec2(0, 0) });
    const b = createRigidBody({ shape: createAABB(1, 1), position: new Vec2(0.5, 1.5) });
    const contact = aabbVsAABB(a, b);
    expect(contact).not.toBeNull();
    // X overlap = 1.5, Y overlap = 0.5, so should push along Y
    expect(contact!.normal.x).toBeCloseTo(0);
    expect(contact!.normal.y).toBeCloseTo(1);
    expect(contact!.penetration).toBeCloseTo(0.5);
  });
});

describe('detectCollision dispatch', () => {
  beforeEach(() => resetBodyIdCounter());

  it('should dispatch AABB vs Circle correctly (flipped)', () => {
    const box = createRigidBody({ shape: createAABB(1, 1), position: new Vec2(0, 0) });
    const circle = createRigidBody({ shape: createCircle(1), position: new Vec2(1.5, 0) });
    const contact = detectCollision(box, circle);
    expect(contact).not.toBeNull();
    expect(contact!.bodyA).toBe(box);
    expect(contact!.bodyB).toBe(circle);
  });
});
