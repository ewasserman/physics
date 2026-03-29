import { describe, it, expect } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { almostEqual } from '../../src/math/utils.js';

describe('Vec2', () => {
  it('constructs with x and y', () => {
    const v = new Vec2(3, 4);
    expect(v.x).toBe(3);
    expect(v.y).toBe(4);
  });

  it('Vec2.zero() returns (0, 0)', () => {
    const v = Vec2.zero();
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
  });

  it('Vec2.fromAngle(0) returns (1, 0)', () => {
    const v = Vec2.fromAngle(0);
    expect(almostEqual(v.x, 1)).toBe(true);
    expect(almostEqual(v.y, 0)).toBe(true);
  });

  it('add returns the sum of two vectors', () => {
    const a = new Vec2(1, 2);
    const b = new Vec2(3, 4);
    const c = a.add(b);
    expect(c.x).toBe(4);
    expect(c.y).toBe(6);
  });

  it('sub returns the difference of two vectors', () => {
    const a = new Vec2(5, 7);
    const b = new Vec2(2, 3);
    const c = a.sub(b);
    expect(c.x).toBe(3);
    expect(c.y).toBe(4);
  });

  it('scale multiplies by a scalar', () => {
    const v = new Vec2(2, 3).scale(3);
    expect(v.x).toBe(6);
    expect(v.y).toBe(9);
  });

  it('dot product', () => {
    const a = new Vec2(1, 0);
    const b = new Vec2(0, 1);
    expect(a.dot(b)).toBe(0);

    const c = new Vec2(2, 3);
    const d = new Vec2(4, 5);
    expect(c.dot(d)).toBe(23); // 2*4 + 3*5
  });

  it('cross product returns scalar', () => {
    const a = new Vec2(1, 0);
    const b = new Vec2(0, 1);
    expect(a.cross(b)).toBe(1);
    expect(b.cross(a)).toBe(-1);
  });

  it('length and lengthSq', () => {
    const v = new Vec2(3, 4);
    expect(v.lengthSq()).toBe(25);
    expect(v.length()).toBe(5);
  });

  it('normalize returns unit vector', () => {
    const v = new Vec2(3, 4).normalize();
    expect(almostEqual(v.length(), 1)).toBe(true);
    expect(almostEqual(v.x, 0.6)).toBe(true);
    expect(almostEqual(v.y, 0.8)).toBe(true);
  });

  it('normalize of zero vector returns zero', () => {
    const v = Vec2.zero().normalize();
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
  });

  it('rotate by pi/2 rotates (1,0) to (0,1)', () => {
    const v = new Vec2(1, 0).rotate(Math.PI / 2);
    expect(almostEqual(v.x, 0)).toBe(true);
    expect(almostEqual(v.y, 1)).toBe(true);
  });

  it('perpendicular returns 90-degree CCW rotation', () => {
    const v = new Vec2(1, 0).perpendicular();
    expect(v.x).toBeCloseTo(0);
    expect(v.y).toBeCloseTo(1);
  });

  it('negate flips both components', () => {
    const v = new Vec2(3, -4).negate();
    expect(v.x).toBe(-3);
    expect(v.y).toBe(4);
  });

  it('distanceTo computes Euclidean distance', () => {
    const a = new Vec2(0, 0);
    const b = new Vec2(3, 4);
    expect(a.distanceTo(b)).toBe(5);
  });

  it('clone creates an equal but independent copy', () => {
    const a = new Vec2(1, 2);
    const b = a.clone();
    expect(b.x).toBe(1);
    expect(b.y).toBe(2);
    expect(b).not.toBe(a);
  });

  it('operations are immutable (return new instances)', () => {
    const a = new Vec2(1, 2);
    const b = a.add(new Vec2(1, 1));
    expect(a.x).toBe(1); // original unchanged
    expect(b.x).toBe(2);
  });
});
