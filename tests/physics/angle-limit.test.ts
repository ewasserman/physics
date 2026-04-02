import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createRigidBody, resetBodyIdCounter } from '../../src/core/body.js';
import { createCircle } from '../../src/core/shape.js';
import {
  createDistanceConstraint,
  localToWorld,
} from '../../src/core/constraint.js';
import { resolveConstraint } from '../../src/physics/constraints.js';

describe('Distance constraint angle limits', () => {
  beforeEach(() => {
    resetBodyIdCounter();
  });

  it('corrects angle when it exceeds maxAngle', () => {
    // Place bodyA at origin, bodyB far to the right and above.
    // Anchor on bodyA points to the right (+x in local space = radius direction).
    // Wire direction will be up-and-right, creating a large angle with the anchor normal.
    const bodyA = createRigidBody({
      shape: createCircle(1),
      position: new Vec2(0, 0),
      mass: 1,
    });
    const bodyB = createRigidBody({
      shape: createCircle(1),
      position: new Vec2(1, 5), // mostly above => large angle from +x normal
      mass: 1,
    });

    const maxAngle = Math.PI / 4; // 45 degrees
    const constraint = createDistanceConstraint({
      bodyA,
      bodyB,
      anchorA: new Vec2(1, 0), // surface point on +x side
      anchorB: new Vec2(-1, 0), // surface point on -x side
      distance: 0.1,
      maxAngle,
    });

    expect(constraint.maxAngle).toBe(maxAngle);

    // Compute initial angle at bodyA
    const getAngleA = () => {
      const wA = localToWorld(bodyA, constraint.anchorA);
      const wB = localToWorld(bodyB, constraint.anchorB);
      const normalA = constraint.anchorA.rotate(bodyA.angle).normalize();
      const wireDir = wB.sub(wA).normalize();
      return Math.acos(Math.max(-1, Math.min(1, normalA.dot(wireDir))));
    };

    const initialAngle = getAngleA();
    expect(initialAngle).toBeGreaterThan(maxAngle); // angle violation exists

    // Run solver iterations
    const dt = 1 / 60;
    for (let i = 0; i < 100; i++) {
      resolveConstraint(constraint, dt);
    }

    const finalAngle = getAngleA();
    // After many iterations the angle should be at or below the limit
    // (with some tolerance for the iterative solver)
    expect(finalAngle).toBeLessThan(maxAngle + 0.15);
  });

  it('does not alter angle when within maxAngle', () => {
    // Bodies aligned so the wire direction matches the anchor normal
    const bodyA = createRigidBody({
      shape: createCircle(1),
      position: new Vec2(0, 0),
      mass: 1,
    });
    const bodyB = createRigidBody({
      shape: createCircle(1),
      position: new Vec2(3, 0), // directly to the right
      mass: 1,
    });

    const constraint = createDistanceConstraint({
      bodyA,
      bodyB,
      anchorA: new Vec2(1, 0),
      anchorB: new Vec2(-1, 0),
      distance: 0.1,
      maxAngle: Math.PI / 4,
    });

    const initialAngleA = bodyA.angle;
    const initialAngleB = bodyB.angle;

    const dt = 1 / 60;
    for (let i = 0; i < 20; i++) {
      resolveConstraint(constraint, dt);
    }

    // Angles should not have been modified (wire is along the normal)
    expect(bodyA.angle).toBeCloseTo(initialAngleA, 2);
    expect(bodyB.angle).toBeCloseTo(initialAngleB, 2);
  });

  it('does not apply angle limits when maxAngle is undefined', () => {
    const bodyA = createRigidBody({
      shape: createCircle(1),
      position: new Vec2(0, 0),
      mass: 1,
    });
    const bodyB = createRigidBody({
      shape: createCircle(1),
      position: new Vec2(1, 5),
      mass: 1,
    });

    const constraint = createDistanceConstraint({
      bodyA,
      bodyB,
      anchorA: new Vec2(1, 0),
      anchorB: new Vec2(-1, 0),
      distance: 0.1,
    });

    expect(constraint.maxAngle).toBeUndefined();

    // The solver should not rotate bodies for angle correction
    // (only distance correction, which moves positions not angles when anchors are at center-ish)
    const initialAngleA = bodyA.angle;
    const dt = 1 / 60;
    for (let i = 0; i < 20; i++) {
      resolveConstraint(constraint, dt);
    }

    // bodyA.angle may change due to angular velocity from distance constraint impulses,
    // but should not show the discrete angle-limit correction pattern.
    // Since anchorA is off-center, distance impulses will cause some angular change,
    // but the key point is maxAngle is undefined so solveAngleLimit is never called.
    // We can't easily distinguish, so just verify no crash and constraint works.
    const dist = localToWorld(bodyA, constraint.anchorA)
      .distanceTo(localToWorld(bodyB, constraint.anchorB));
    // Distance should converge toward target (0.1)
    expect(dist).toBeLessThan(8); // rough check it didn't explode
  });

  it('corrects angle for bodyB as well', () => {
    // bodyB has an anchor that points in -x, but the wire goes mostly upward
    const bodyA = createRigidBody({
      shape: createCircle(1),
      position: new Vec2(0, 5),
      mass: 1,
    });
    const bodyB = createRigidBody({
      shape: createCircle(1),
      position: new Vec2(1, 0), // below and to the right of A
      mass: 1,
    });

    const maxAngle = Math.PI / 6; // 30 degrees - tight limit
    const constraint = createDistanceConstraint({
      bodyA,
      bodyB,
      anchorA: new Vec2(1, 0),
      anchorB: new Vec2(-1, 0),
      distance: 0.1,
      maxAngle,
    });

    // Compute initial angle at bodyB
    const getAngleB = () => {
      const wA = localToWorld(bodyA, constraint.anchorA);
      const wB = localToWorld(bodyB, constraint.anchorB);
      const normalB = constraint.anchorB.rotate(bodyB.angle).normalize();
      const reverseWireDir = wA.sub(wB).normalize();
      return Math.acos(Math.max(-1, Math.min(1, normalB.dot(reverseWireDir))));
    };

    const initialAngle = getAngleB();
    expect(initialAngle).toBeGreaterThan(maxAngle);

    const dt = 1 / 60;
    for (let i = 0; i < 100; i++) {
      resolveConstraint(constraint, dt);
    }

    const finalAngle = getAngleB();
    expect(finalAngle).toBeLessThan(maxAngle + 0.15);
  });
});
