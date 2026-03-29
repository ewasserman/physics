import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createRigidBody, RigidBody, resetBodyIdCounter } from '../../src/core/body.js';
import { createCircle, createAABB } from '../../src/core/shape.js';
import {
  createDistanceConstraint,
  createRevoluteConstraint,
  createFixedConstraint,
  DistanceConstraint,
  RevoluteConstraint,
  FixedConstraint,
  localToWorld,
} from '../../src/core/constraint.js';
import { resolveConstraint, resolveConstraints } from '../../src/physics/constraints.js';

describe('Constraint resolution', () => {
  beforeEach(() => {
    resetBodyIdCounter();
  });

  describe('localToWorld', () => {
    it('converts local anchor to world space with no rotation', () => {
      const body = createRigidBody({
        shape: createCircle(1),
        position: new Vec2(3, 4),
        angle: 0,
      });
      const world = localToWorld(body, new Vec2(1, 0));
      expect(world.x).toBeCloseTo(4);
      expect(world.y).toBeCloseTo(4);
    });

    it('converts local anchor to world space with rotation', () => {
      const body = createRigidBody({
        shape: createCircle(1),
        position: new Vec2(0, 0),
        angle: Math.PI / 2,
      });
      const world = localToWorld(body, new Vec2(1, 0));
      expect(world.x).toBeCloseTo(0);
      expect(world.y).toBeCloseTo(1);
    });
  });

  describe('DistanceConstraint', () => {
    it('maintains fixed distance between two bodies after iterations', () => {
      const bodyA = createRigidBody({
        shape: createCircle(0.5),
        position: new Vec2(0, 0),
        mass: 1,
      });
      const bodyB = createRigidBody({
        shape: createCircle(0.5),
        position: new Vec2(3, 0), // start at distance 3
        mass: 1,
      });

      const constraint = createDistanceConstraint(bodyA, bodyB, Vec2.zero(), Vec2.zero(), 2);
      expect(constraint.distance).toBe(2);

      // Run multiple iterations to converge
      const dt = 1 / 60;
      for (let step = 0; step < 100; step++) {
        resolveConstraint(constraint, dt);
      }

      const dist = bodyA.position.distanceTo(bodyB.position);
      expect(dist).toBeCloseTo(2, 1);
    });

    it('auto-computes distance from initial positions', () => {
      const bodyA = createRigidBody({
        shape: createCircle(0.5),
        position: new Vec2(0, 0),
        mass: 1,
      });
      const bodyB = createRigidBody({
        shape: createCircle(0.5),
        position: new Vec2(5, 0),
        mass: 1,
      });

      const constraint = createDistanceConstraint(bodyA, bodyB);
      expect(constraint.distance).toBeCloseTo(5);
    });

    it('works with different masses', () => {
      const bodyA = createRigidBody({
        shape: createCircle(0.5),
        position: new Vec2(0, 0),
        mass: 10,
      });
      const bodyB = createRigidBody({
        shape: createCircle(0.5),
        position: new Vec2(4, 0),
        mass: 1,
      });

      const constraint = createDistanceConstraint(bodyA, bodyB, Vec2.zero(), Vec2.zero(), 2);

      for (let step = 0; step < 100; step++) {
        resolveConstraint(constraint, 1 / 60);
      }

      const dist = bodyA.position.distanceTo(bodyB.position);
      expect(dist).toBeCloseTo(2, 1);
      // Heavier body should move less
      expect(Math.abs(bodyA.position.x)).toBeLessThan(Math.abs(bodyB.position.x - 4));
    });
  });

  describe('RevoluteConstraint', () => {
    it('keeps anchor points coincident', () => {
      const bodyA = createRigidBody({
        shape: createCircle(0.5),
        position: new Vec2(0, 0),
        mass: 1,
      });
      const bodyB = createRigidBody({
        shape: createCircle(0.5),
        position: new Vec2(2, 1), // displaced
        mass: 1,
      });

      const constraint = createRevoluteConstraint(
        bodyA,
        bodyB,
        new Vec2(1, 0),
        new Vec2(-1, 0),
      );

      for (let step = 0; step < 100; step++) {
        resolveConstraint(constraint, 1 / 60);
      }

      const worldA = localToWorld(bodyA, constraint.anchorA);
      const worldB = localToWorld(bodyB, constraint.anchorB);
      const separation = worldA.distanceTo(worldB);
      expect(separation).toBeLessThan(0.1);
    });

    it('allows relative rotation', () => {
      const bodyA = createRigidBody({
        shape: createCircle(0.5),
        position: new Vec2(0, 0),
        mass: 1,
      });
      const bodyB = createRigidBody({
        shape: createCircle(0.5),
        position: new Vec2(1, 0),
        mass: 1,
        angularVelocity: 2.0,
      });

      const constraint = createRevoluteConstraint(
        bodyA,
        bodyB,
        new Vec2(0.5, 0),
        new Vec2(-0.5, 0),
      );

      // Revolute should not prevent angular velocity
      resolveConstraint(constraint, 1 / 60);
      // bodyB should still have angular velocity (revolute doesn't constrain rotation)
      expect(bodyB.angularVelocity).not.toBe(0);
    });

    it('works with a static body (pendulum)', () => {
      const anchor = createRigidBody({
        shape: createCircle(0.1),
        position: new Vec2(0, 5),
        isStatic: true,
      });
      const pendulum = createRigidBody({
        shape: createCircle(0.5),
        position: new Vec2(2, 5), // offset to the side
        mass: 1,
      });

      const constraint = createRevoluteConstraint(
        anchor,
        pendulum,
        Vec2.zero(),
        Vec2.zero(),
      );

      // Apply gravity-like velocity
      pendulum.velocity = new Vec2(0, -5);

      for (let step = 0; step < 200; step++) {
        // Integrate position
        pendulum.position = pendulum.position.add(pendulum.velocity.scale(1 / 60));
        // Resolve constraint
        resolveConstraint(constraint, 1 / 60);
      }

      // Pendulum should stay connected to anchor
      const worldA = localToWorld(anchor, constraint.anchorA);
      const worldB = localToWorld(pendulum, constraint.anchorB);
      expect(worldA.distanceTo(worldB)).toBeLessThan(0.5);
    });
  });

  describe('FixedConstraint', () => {
    it('maintains relative angle between bodies', () => {
      const bodyA = createRigidBody({
        shape: createAABB(1, 0.5),
        position: new Vec2(0, 0),
        mass: 1,
      });
      const bodyB = createRigidBody({
        shape: createAABB(0.5, 0.5),
        position: new Vec2(2, 0),
        mass: 1,
        angle: 0.5,
      });

      const constraint = createFixedConstraint(bodyA, bodyB);
      const refAngle = constraint.referenceAngle;

      // Disturb angles
      bodyB.angle += 0.3;
      bodyA.angle -= 0.1;

      for (let step = 0; step < 100; step++) {
        resolveConstraint(constraint, 1 / 60);
      }

      const angleDiff = bodyB.angle - bodyA.angle;
      expect(angleDiff).toBeCloseTo(refAngle, 1);
    });

    it('maintains both position and angle', () => {
      const bodyA = createRigidBody({
        shape: createAABB(1, 0.5),
        position: new Vec2(0, 0),
        mass: 1,
      });
      const bodyB = createRigidBody({
        shape: createAABB(0.5, 0.5),
        position: new Vec2(1, 0),
        mass: 1,
      });

      const constraint = createFixedConstraint(
        bodyA,
        bodyB,
        new Vec2(0.5, 0),
        new Vec2(-0.5, 0),
      );

      // Displace bodyB
      bodyB.position = bodyB.position.add(new Vec2(0.5, 0.3));
      bodyB.angle = 0.2;

      for (let step = 0; step < 200; step++) {
        resolveConstraint(constraint, 1 / 60);
      }

      const worldA = localToWorld(bodyA, constraint.anchorA);
      const worldB = localToWorld(bodyB, constraint.anchorB);
      expect(worldA.distanceTo(worldB)).toBeLessThan(0.2);

      const angleDiff = bodyB.angle - bodyA.angle;
      expect(angleDiff).toBeCloseTo(0, 0); // reference angle was 0
    });
  });

  describe('Constraint breaking', () => {
    it('marks constraint as broken when force exceeds breakForce', () => {
      const bodyA = createRigidBody({
        shape: createCircle(0.5),
        position: new Vec2(0, 0),
        mass: 1,
      });
      const bodyB = createRigidBody({
        shape: createCircle(0.5),
        position: new Vec2(10, 0), // very far from target distance
        mass: 1,
      });

      const constraint = createDistanceConstraint({
        bodyA,
        bodyB,
        distance: 1,
        breakForce: 100, // low break force
      });

      expect(constraint.broken).toBe(false);

      const broken = resolveConstraints([constraint], 10, 1 / 60);

      expect(constraint.broken).toBe(true);
      expect(broken.length).toBe(1);
      expect(broken[0]).toBe(constraint);
    });

    it('does not break constraint when force is within limits', () => {
      const bodyA = createRigidBody({
        shape: createCircle(0.5),
        position: new Vec2(0, 0),
        mass: 1,
      });
      const bodyB = createRigidBody({
        shape: createCircle(0.5),
        position: new Vec2(2.1, 0), // slightly off
        mass: 1,
      });

      const constraint = createDistanceConstraint({
        bodyA,
        bodyB,
        distance: 2,
        breakForce: 1e10, // very high break force
      });

      const broken = resolveConstraints([constraint], 10, 1 / 60);

      expect(constraint.broken).toBe(false);
      expect(broken.length).toBe(0);
    });
  });

  describe('resolveConstraints', () => {
    it('resolves multiple constraints', () => {
      const bodyA = createRigidBody({
        shape: createCircle(0.5),
        position: new Vec2(0, 0),
        mass: 1,
      });
      const bodyB = createRigidBody({
        shape: createCircle(0.5),
        position: new Vec2(3, 0),
        mass: 1,
      });
      const bodyC = createRigidBody({
        shape: createCircle(0.5),
        position: new Vec2(6, 0),
        mass: 1,
      });

      const c1 = createDistanceConstraint(bodyA, bodyB, Vec2.zero(), Vec2.zero(), 2);
      const c2 = createDistanceConstraint(bodyB, bodyC, Vec2.zero(), Vec2.zero(), 2);

      resolveConstraints([c1, c2], 50, 1 / 60);

      expect(bodyA.position.distanceTo(bodyB.position)).toBeCloseTo(2, 0);
      expect(bodyB.position.distanceTo(bodyC.position)).toBeCloseTo(2, 0);
    });

    it('skips broken constraints', () => {
      const bodyA = createRigidBody({
        shape: createCircle(0.5),
        position: new Vec2(0, 0),
        mass: 1,
      });
      const bodyB = createRigidBody({
        shape: createCircle(0.5),
        position: new Vec2(5, 0),
        mass: 1,
      });

      const constraint = createDistanceConstraint(bodyA, bodyB, Vec2.zero(), Vec2.zero(), 2);
      constraint.broken = true;

      const posA = bodyA.position.clone();
      const posB = bodyB.position.clone();

      resolveConstraints([constraint], 10, 1 / 60);

      // Positions should not change since constraint is broken
      expect(bodyA.position.x).toBe(posA.x);
      expect(bodyB.position.x).toBe(posB.x);
    });
  });
});
