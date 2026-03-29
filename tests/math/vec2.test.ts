import { describe, it, expect } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { almostEqual } from '../../src/math/utils.js';

/** Helper: assert two numbers are approximately equal. */
function expectClose(actual: number, expected: number, eps = 1e-9) {
  expect(Math.abs(actual - expected)).toBeLessThan(eps);
}

describe('Vec2', () => {
  // ===== Construction & Factory =====

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
    expectClose(v.x, 1);
    expectClose(v.y, 0);
  });

  // ===== Arithmetic =====

  it('add returns the sum of two vectors', () => {
    const c = new Vec2(1, 2).add(new Vec2(3, 4));
    expect(c.x).toBe(4);
    expect(c.y).toBe(6);
  });

  it('add with zero vector is identity', () => {
    const v = new Vec2(7, -3);
    const r = v.add(Vec2.zero());
    expect(r.x).toBe(v.x);
    expect(r.y).toBe(v.y);
  });

  it('sub returns the difference of two vectors', () => {
    const c = new Vec2(5, 7).sub(new Vec2(2, 3));
    expect(c.x).toBe(3);
    expect(c.y).toBe(4);
  });

  it('scale multiplies by a scalar', () => {
    const v = new Vec2(2, 3).scale(3);
    expect(v.x).toBe(6);
    expect(v.y).toBe(9);
  });

  it('scale by 0 yields zero vector', () => {
    const v = new Vec2(100, -200).scale(0);
    // Note: -200 * 0 = -0 in IEEE 754, so we check with expectClose
    expectClose(v.x, 0);
    expectClose(v.y, 0);
  });

  it('scale by -1 is same as negate', () => {
    const v = new Vec2(5, -3);
    const scaled = v.scale(-1);
    const negated = v.negate();
    expect(scaled.x).toBe(negated.x);
    expect(scaled.y).toBe(negated.y);
  });

  it('negate flips both components', () => {
    const v = new Vec2(3, -4).negate();
    expect(v.x).toBe(-3);
    expect(v.y).toBe(4);
  });

  it('negate of zero is zero', () => {
    const v = Vec2.zero().negate();
    // -0 is IEEE 754 valid; check approximate equality
    expectClose(v.x, 0);
    expectClose(v.y, 0);
  });

  // ===== Dot product =====

  it('dot product of orthogonal unit vectors is 0', () => {
    expect(new Vec2(1, 0).dot(new Vec2(0, 1))).toBe(0);
  });

  it('dot product computes correctly', () => {
    expect(new Vec2(2, 3).dot(new Vec2(4, 5))).toBe(23);
  });

  it('v.dot(v) equals lengthSq()', () => {
    const v = new Vec2(3, 4);
    expect(v.dot(v)).toBe(v.lengthSq());
  });

  it('dot product is commutative', () => {
    const a = new Vec2(7, -2);
    const b = new Vec2(-3, 11);
    expect(a.dot(b)).toBe(b.dot(a));
  });

  // ===== Cross product =====

  it('cross product returns scalar', () => {
    expect(new Vec2(1, 0).cross(new Vec2(0, 1))).toBe(1);
    expect(new Vec2(0, 1).cross(new Vec2(1, 0))).toBe(-1);
  });

  it('cross product is anti-commutative', () => {
    const a = new Vec2(3, 7);
    const b = new Vec2(-2, 5);
    expectClose(a.cross(b), -b.cross(a));
  });

  it('cross of parallel vectors is 0', () => {
    const a = new Vec2(2, 4);
    const b = new Vec2(3, 6);
    expectClose(a.cross(b), 0);
  });

  it('cross product magnitude equals |a||b|sin(theta)', () => {
    const a = new Vec2(3, 0);
    const b = new Vec2(0, 4);
    // angle is 90 degrees, sin(90) = 1, so |cross| = 3*4 = 12
    expect(Math.abs(a.cross(b))).toBe(12);
  });

  // ===== Length & distance =====

  it('length and lengthSq', () => {
    const v = new Vec2(3, 4);
    expect(v.lengthSq()).toBe(25);
    expect(v.length()).toBe(5);
  });

  it('zero vector has length 0', () => {
    expect(Vec2.zero().length()).toBe(0);
    expect(Vec2.zero().lengthSq()).toBe(0);
  });

  it('distanceTo computes Euclidean distance', () => {
    expect(new Vec2(0, 0).distanceTo(new Vec2(3, 4))).toBe(5);
  });

  it('distanceTo is symmetric', () => {
    const a = new Vec2(1, 2);
    const b = new Vec2(4, 6);
    expect(a.distanceTo(b)).toBe(b.distanceTo(a));
  });

  it('distanceTo self is 0', () => {
    const v = new Vec2(7, -3);
    expect(v.distanceTo(v)).toBe(0);
  });

  // ===== Normalize =====

  it('normalize returns unit vector', () => {
    const v = new Vec2(3, 4).normalize();
    expectClose(v.length(), 1);
    expectClose(v.x, 0.6);
    expectClose(v.y, 0.8);
  });

  it('normalize of zero vector returns zero', () => {
    const v = Vec2.zero().normalize();
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
  });

  it('normalize of unit vector is itself', () => {
    const v = new Vec2(1, 0).normalize();
    expectClose(v.x, 1);
    expectClose(v.y, 0);
  });

  it('normalize preserves direction', () => {
    const v = new Vec2(-6, 8);
    const n = v.normalize();
    // direction: same ratio
    expectClose(n.x / n.y, v.x / v.y);
    expectClose(n.length(), 1);
  });

  // ===== Rotation =====

  it('rotate by pi/2 rotates (1,0) to (0,1)', () => {
    const v = new Vec2(1, 0).rotate(Math.PI / 2);
    expectClose(v.x, 0);
    expectClose(v.y, 1);
  });

  it('rotate by pi rotates (1,0) to (-1,0)', () => {
    const v = new Vec2(1, 0).rotate(Math.PI);
    expectClose(v.x, -1);
    expectClose(v.y, 0);
  });

  it('rotate by 3pi/2 (270 deg) rotates (1,0) to (0,-1)', () => {
    const v = new Vec2(1, 0).rotate(3 * Math.PI / 2);
    expectClose(v.x, 0);
    expectClose(v.y, -1);
  });

  it('rotate by 2pi returns to original', () => {
    const v = new Vec2(3, 4).rotate(2 * Math.PI);
    expectClose(v.x, 3);
    expectClose(v.y, 4);
  });

  it('rotate preserves vector length', () => {
    const v = new Vec2(3, 4);
    const angles = [0.1, 0.7, 1.5, 2.3, Math.PI, -0.5];
    for (const angle of angles) {
      expectClose(v.rotate(angle).length(), v.length());
    }
  });

  it('rotate by arbitrary angle matches expected value', () => {
    // rotate (1,0) by pi/6 (30 deg) -> (cos30, sin30) = (sqrt3/2, 0.5)
    const v = new Vec2(1, 0).rotate(Math.PI / 6);
    expectClose(v.x, Math.sqrt(3) / 2);
    expectClose(v.y, 0.5);
  });

  it('rotate by negative angle rotates clockwise', () => {
    const v = new Vec2(1, 0).rotate(-Math.PI / 2);
    expectClose(v.x, 0);
    expectClose(v.y, -1);
  });

  // ===== Perpendicular =====

  it('perpendicular returns 90-degree CCW rotation', () => {
    const v = new Vec2(1, 0).perpendicular();
    // perpendicular(-y, x) of (1,0) gives (-0, 1); use expectClose for -0
    expectClose(v.x, 0);
    expectClose(v.y, 1);
  });

  it('perpendicular is orthogonal (dot product is 0)', () => {
    const vectors = [
      new Vec2(1, 0),
      new Vec2(0, 1),
      new Vec2(3, 4),
      new Vec2(-7, 2),
      new Vec2(0.1, -100),
    ];
    for (const v of vectors) {
      expectClose(v.dot(v.perpendicular()), 0);
    }
  });

  it('perpendicular preserves length', () => {
    const v = new Vec2(3, 4);
    expect(v.perpendicular().length()).toBe(v.length());
  });

  // ===== fromAngle =====

  it('fromAngle cardinal directions', () => {
    // 0 -> (1, 0)
    let v = Vec2.fromAngle(0);
    expectClose(v.x, 1);
    expectClose(v.y, 0);

    // pi/2 -> (0, 1)
    v = Vec2.fromAngle(Math.PI / 2);
    expectClose(v.x, 0);
    expectClose(v.y, 1);

    // pi -> (-1, 0)
    v = Vec2.fromAngle(Math.PI);
    expectClose(v.x, -1);
    expectClose(v.y, 0);

    // 3pi/2 -> (0, -1)
    v = Vec2.fromAngle(3 * Math.PI / 2);
    expectClose(v.x, 0);
    expectClose(v.y, -1);
  });

  it('fromAngle always returns unit length', () => {
    const angles = [0, 0.5, 1.0, 1.5, 2.0, Math.PI, 5.0, -1.0];
    for (const a of angles) {
      expectClose(Vec2.fromAngle(a).length(), 1);
    }
  });

  // ===== Clone & immutability =====

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
    expect(a.x).toBe(1);
    expect(b.x).toBe(2);
  });

  it('toString returns readable format', () => {
    expect(new Vec2(1, 2).toString()).toBe('Vec2(1, 2)');
  });

  // ===== Edge cases =====

  it('handles very large values', () => {
    const v = new Vec2(1e15, 1e15);
    const sum = v.add(v);
    expect(sum.x).toBe(2e15);
    expect(sum.y).toBe(2e15);
  });

  it('handles very small values', () => {
    const v = new Vec2(1e-15, 1e-15);
    const n = v.normalize();
    expectClose(n.length(), 1);
  });

  // ===== Property-based style tests =====

  describe('algebraic properties', () => {
    // Use a set of "random-ish" vectors
    const testVectors = [
      new Vec2(1, 0),
      new Vec2(0, 1),
      new Vec2(3, 4),
      new Vec2(-7, 2),
      new Vec2(0.5, -0.5),
      new Vec2(100, -200),
      new Vec2(-0.001, 0.003),
    ];

    it('normalize(v) has length ~1 for all non-zero v', () => {
      for (const v of testVectors) {
        if (v.length() > 0) {
          expectClose(v.normalize().length(), 1);
        }
      }
    });

    it('v.dot(v) ~= |v|^2 for all v', () => {
      for (const v of testVectors) {
        expectClose(v.dot(v), v.lengthSq(), 1e-6);
      }
    });

    it('v.add(v.negate()) ~= zero for all v', () => {
      for (const v of testVectors) {
        const result = v.add(v.negate());
        expectClose(result.x, 0);
        expectClose(result.y, 0);
      }
    });

    it('a.add(b) = b.add(a) (commutativity)', () => {
      for (let i = 0; i < testVectors.length - 1; i++) {
        const a = testVectors[i];
        const b = testVectors[i + 1];
        const ab = a.add(b);
        const ba = b.add(a);
        expectClose(ab.x, ba.x);
        expectClose(ab.y, ba.y);
      }
    });

    it('(a.add(b)).add(c) = a.add(b.add(c)) (associativity)', () => {
      const a = new Vec2(1, 2);
      const b = new Vec2(3, -4);
      const c = new Vec2(-5, 6);
      const lhs = a.add(b).add(c);
      const rhs = a.add(b.add(c));
      expectClose(lhs.x, rhs.x);
      expectClose(lhs.y, rhs.y);
    });

    it('v.scale(a).scale(b) = v.scale(a*b)', () => {
      const v = new Vec2(3, 4);
      const a = 2, b = 3;
      const lhs = v.scale(a).scale(b);
      const rhs = v.scale(a * b);
      expectClose(lhs.x, rhs.x);
      expectClose(lhs.y, rhs.y);
    });
  });
});
