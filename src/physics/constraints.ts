import { Vec2 } from '../math/vec2.js';
import {
  Constraint,
  ConstraintType,
  DistanceConstraint,
  RevoluteConstraint,
  FixedConstraint,
  localToWorld,
} from '../core/constraint.js';

/**
 * Resolve a single constraint, returning the magnitude of the corrective force
 * applied (for break-force checking).
 */
export function resolveConstraint(constraint: Constraint, dt: number): number {
  if (constraint.broken) return 0;

  switch (constraint.type) {
    case ConstraintType.Distance:
      return resolveDistanceConstraint(constraint, dt);
    case ConstraintType.Revolute:
      return resolveRevoluteConstraint(constraint, dt);
    case ConstraintType.Fixed:
      return resolveFixedConstraint(constraint, dt);
  }
}

/**
 * Resolve a distance constraint: maintain fixed distance between anchor points.
 */
function resolveDistanceConstraint(c: DistanceConstraint, dt: number): number {
  const { bodyA, bodyB, stiffness } = c;

  const worldA = localToWorld(bodyA, c.anchorA);
  const worldB = localToWorld(bodyB, c.anchorB);
  const delta = worldB.sub(worldA);
  const currentDist = delta.length();

  if (currentDist < 1e-10) return 0;

  const error = currentDist - c.distance;
  if (Math.abs(error) < 1e-8) return 0;

  const normal = delta.normalize();
  const totalInvMass = bodyA.inverseMass + bodyB.inverseMass;
  if (totalInvMass === 0) return 0;

  // Position correction
  const correction = (error * stiffness) / totalInvMass;

  if (!bodyA.isStatic) {
    bodyA.position = bodyA.position.add(normal.scale(correction * bodyA.inverseMass));
  }
  if (!bodyB.isStatic) {
    bodyB.position = bodyB.position.sub(normal.scale(correction * bodyB.inverseMass));
  }

  // Velocity correction along constraint axis
  const rA = worldA.sub(bodyA.position);
  const rB = worldB.sub(bodyB.position);
  const vA = bodyA.velocity.add(new Vec2(-bodyA.angularVelocity * rA.y, bodyA.angularVelocity * rA.x));
  const vB = bodyB.velocity.add(new Vec2(-bodyB.angularVelocity * rB.y, bodyB.angularVelocity * rB.x));
  const relVel = vB.sub(vA);
  const relVelNormal = relVel.dot(normal);

  const rACrossN = rA.cross(normal);
  const rBCrossN = rB.cross(normal);
  const effectiveMass = totalInvMass +
    rACrossN * rACrossN * bodyA.inverseInertia +
    rBCrossN * rBCrossN * bodyB.inverseInertia;

  if (effectiveMass > 0) {
    const velCorrection = -relVelNormal * stiffness / effectiveMass;
    const impulse = normal.scale(velCorrection);

    if (!bodyA.isStatic) {
      bodyA.velocity = bodyA.velocity.sub(impulse.scale(bodyA.inverseMass));
      bodyA.angularVelocity -= rA.cross(impulse) * bodyA.inverseInertia;
    }
    if (!bodyB.isStatic) {
      bodyB.velocity = bodyB.velocity.add(impulse.scale(bodyB.inverseMass));
      bodyB.angularVelocity += rB.cross(impulse) * bodyB.inverseInertia;
    }
  }

  return Math.abs(error) / (dt * dt);
}

/**
 * Resolve a revolute constraint: pin two bodies at a shared point.
 */
function resolveRevoluteConstraint(c: RevoluteConstraint, dt: number): number {
  const { bodyA, bodyB, stiffness } = c;

  const worldA = localToWorld(bodyA, c.anchorA);
  const worldB = localToWorld(bodyB, c.anchorB);
  const error = worldB.sub(worldA);
  const errorLen = error.length();

  if (errorLen < 1e-8) return 0;

  const totalInvMass = bodyA.inverseMass + bodyB.inverseMass;
  if (totalInvMass === 0) return 0;

  // Position correction
  const correction = error.scale(stiffness / totalInvMass);

  if (!bodyA.isStatic) {
    bodyA.position = bodyA.position.add(correction.scale(bodyA.inverseMass));
  }
  if (!bodyB.isStatic) {
    bodyB.position = bodyB.position.sub(correction.scale(bodyB.inverseMass));
  }

  // Velocity correction
  const rA = localToWorld(bodyA, c.anchorA).sub(bodyA.position);
  const rB = localToWorld(bodyB, c.anchorB).sub(bodyB.position);
  const vA = bodyA.velocity.add(new Vec2(-bodyA.angularVelocity * rA.y, bodyA.angularVelocity * rA.x));
  const vB = bodyB.velocity.add(new Vec2(-bodyB.angularVelocity * rB.y, bodyB.angularVelocity * rB.x));
  const relVel = vB.sub(vA);

  // Apply velocity correction along both axes
  for (const axis of [new Vec2(1, 0), new Vec2(0, 1)]) {
    const relVelAxis = relVel.dot(axis);
    const rACrossA = rA.cross(axis);
    const rBCrossA = rB.cross(axis);
    const effectiveMass = totalInvMass +
      rACrossA * rACrossA * bodyA.inverseInertia +
      rBCrossA * rBCrossA * bodyB.inverseInertia;

    if (effectiveMass > 0) {
      const velCorrection = -relVelAxis * stiffness / effectiveMass;
      const impulse = axis.scale(velCorrection);

      if (!bodyA.isStatic) {
        bodyA.velocity = bodyA.velocity.sub(impulse.scale(bodyA.inverseMass));
        bodyA.angularVelocity -= rA.cross(impulse) * bodyA.inverseInertia;
      }
      if (!bodyB.isStatic) {
        bodyB.velocity = bodyB.velocity.add(impulse.scale(bodyB.inverseMass));
        bodyB.angularVelocity += rB.cross(impulse) * bodyB.inverseInertia;
      }
    }
  }

  return errorLen / (dt * dt);
}

/**
 * Resolve a fixed constraint: position correction (like revolute) + angular correction.
 */
function resolveFixedConstraint(c: FixedConstraint, dt: number): number {
  const { bodyA, bodyB, stiffness } = c;

  // Position correction (same as revolute)
  const positionalForce = resolveRevoluteConstraint(
    { ...c, type: ConstraintType.Revolute } as RevoluteConstraint,
    dt,
  );

  // Angular correction: maintain reference angle
  const currentAngleDiff = bodyB.angle - bodyA.angle;
  const angleError = currentAngleDiff - c.referenceAngle;

  if (Math.abs(angleError) > 1e-8) {
    const totalInvInertia = bodyA.inverseInertia + bodyB.inverseInertia;
    if (totalInvInertia > 0) {
      const angularCorrection = angleError * stiffness / totalInvInertia;

      if (!bodyA.isStatic) {
        bodyA.angle += angularCorrection * bodyA.inverseInertia;
      }
      if (!bodyB.isStatic) {
        bodyB.angle -= angularCorrection * bodyB.inverseInertia;
      }

      // Angular velocity correction
      const relAngVel = bodyB.angularVelocity - bodyA.angularVelocity;
      const angVelCorrection = relAngVel * stiffness / totalInvInertia;

      if (!bodyA.isStatic) {
        bodyA.angularVelocity += angVelCorrection * bodyA.inverseInertia;
      }
      if (!bodyB.isStatic) {
        bodyB.angularVelocity -= angVelCorrection * bodyB.inverseInertia;
      }
    }
  }

  return positionalForce + Math.abs(angleError) / (dt * dt);
}

/**
 * Resolve all constraints over multiple iterations.
 * Returns list of broken constraints (if any).
 */
export function resolveConstraints(
  constraints: Constraint[],
  iterations: number,
  dt: number = 1 / 60,
): Constraint[] {
  const broken: Constraint[] = [];

  for (let i = 0; i < iterations; i++) {
    for (const constraint of constraints) {
      if (constraint.broken) continue;

      const force = resolveConstraint(constraint, dt);

      // Check for breakage
      if (constraint.breakForce !== undefined && force > constraint.breakForce) {
        constraint.broken = true;
        broken.push(constraint);
      }
    }
  }

  return broken;
}
