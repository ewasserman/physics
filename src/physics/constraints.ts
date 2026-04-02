import { Vec2 } from '../math/vec2.js';
import {
  Constraint,
  ConstraintType,
  DistanceConstraint,
  RevoluteConstraint,
  FixedConstraint,
  localToWorld,
} from '../core/constraint.js';

// --- Velocity-level constraint solver ---
// Computes proper impulses at the velocity level with Baumgarte bias
// for position error. Only modifies velocities, never positions.

/**
 * Solve a single constraint at the velocity level.
 * Uses Baumgarte stabilization to fold position error into the velocity constraint.
 * Returns the magnitude of the corrective impulse (for break-force checking).
 */
function solveConstraintVelocity(constraint: Constraint, dt: number): number {
  if (constraint.broken) return 0;

  switch (constraint.type) {
    case ConstraintType.Distance:
      return solveDistanceVelocity(constraint, dt);
    case ConstraintType.Revolute:
      return solveRevoluteVelocity(constraint, dt);
    case ConstraintType.Fixed:
      return solveFixedVelocity(constraint, dt);
  }
}

function solveDistanceVelocity(c: DistanceConstraint, dt: number): number {
  const { bodyA, bodyB } = c;
  const beta = 0.2; // Baumgarte factor

  const worldA = localToWorld(bodyA, c.anchorA);
  const worldB = localToWorld(bodyB, c.anchorB);
  const delta = worldB.sub(worldA);
  const currentDist = delta.length();

  if (currentDist < 1e-10) return 0;

  const error = currentDist - c.distance;
  const normal = delta.normalize();

  const rA = worldA.sub(bodyA.position);
  const rB = worldB.sub(bodyB.position);

  const totalInvMass = bodyA.inverseMass + bodyB.inverseMass;
  if (totalInvMass === 0) return 0;

  const rACrossN = rA.cross(normal);
  const rBCrossN = rB.cross(normal);
  const effectiveMass = totalInvMass +
    rACrossN * rACrossN * bodyA.inverseInertia +
    rBCrossN * rBCrossN * bodyB.inverseInertia;

  if (effectiveMass <= 0) return 0;

  // Relative velocity at constraint points along the constraint normal
  const vA = bodyA.velocity.add(new Vec2(-bodyA.angularVelocity * rA.y, bodyA.angularVelocity * rA.x));
  const vB = bodyB.velocity.add(new Vec2(-bodyB.angularVelocity * rB.y, bodyB.angularVelocity * rB.x));
  const relVelNormal = vB.sub(vA).dot(normal);

  // Baumgarte bias: fold position error into velocity constraint
  const bias = (beta / dt) * error;
  const impulse = -(relVelNormal + bias) / effectiveMass;
  const impulseVec = normal.scale(impulse);

  if (!bodyA.isStatic) {
    bodyA.velocity = bodyA.velocity.sub(impulseVec.scale(bodyA.inverseMass));
    bodyA.angularVelocity -= rA.cross(impulseVec) * bodyA.inverseInertia;
  }
  if (!bodyB.isStatic) {
    bodyB.velocity = bodyB.velocity.add(impulseVec.scale(bodyB.inverseMass));
    bodyB.angularVelocity += rB.cross(impulseVec) * bodyB.inverseInertia;
  }

  return Math.abs(impulse) / (dt * dt);
}

function solveRevoluteVelocity(c: RevoluteConstraint, dt: number): number {
  const { bodyA, bodyB } = c;
  const beta = 0.2; // Baumgarte factor

  const worldA = localToWorld(bodyA, c.anchorA);
  const worldB = localToWorld(bodyB, c.anchorB);
  const posError = worldB.sub(worldA);
  const errorLen = posError.length();

  const rA = worldA.sub(bodyA.position);
  const rB = worldB.sub(bodyB.position);

  const totalInvMass = bodyA.inverseMass + bodyB.inverseMass;
  if (totalInvMass === 0) return 0;

  // Relative velocity at anchor points
  const vA = bodyA.velocity.add(new Vec2(-bodyA.angularVelocity * rA.y, bodyA.angularVelocity * rA.x));
  const vB = bodyB.velocity.add(new Vec2(-bodyB.angularVelocity * rB.y, bodyB.angularVelocity * rB.x));
  const relVel = vB.sub(vA);

  // Solve along both axes (X and Y) for the revolute constraint
  for (const axis of [new Vec2(1, 0), new Vec2(0, 1)]) {
    const relVelAxis = relVel.dot(axis);
    const posErrorAxis = posError.dot(axis);
    const rACrossA = rA.cross(axis);
    const rBCrossA = rB.cross(axis);
    const effectiveMass = totalInvMass +
      rACrossA * rACrossA * bodyA.inverseInertia +
      rBCrossA * rBCrossA * bodyB.inverseInertia;

    if (effectiveMass <= 0) continue;

    // Baumgarte bias: fold position error into velocity constraint
    const bias = (beta / dt) * posErrorAxis;
    const impulse = -(relVelAxis + bias) / effectiveMass;
    const impulseVec = axis.scale(impulse);

    if (!bodyA.isStatic) {
      bodyA.velocity = bodyA.velocity.sub(impulseVec.scale(bodyA.inverseMass));
      bodyA.angularVelocity -= rA.cross(impulseVec) * bodyA.inverseInertia;
    }
    if (!bodyB.isStatic) {
      bodyB.velocity = bodyB.velocity.add(impulseVec.scale(bodyB.inverseMass));
      bodyB.angularVelocity += rB.cross(impulseVec) * bodyB.inverseInertia;
    }
  }

  return errorLen / (dt * dt);
}

function solveFixedVelocity(c: FixedConstraint, dt: number): number {
  const { bodyA, bodyB } = c;

  // Positional part (same as revolute)
  const positionalForce = solveRevoluteVelocity(
    { ...c, type: ConstraintType.Revolute } as RevoluteConstraint,
    dt,
  );

  // Angular velocity correction with Baumgarte bias
  const beta = 0.2;
  const currentAngleDiff = bodyB.angle - bodyA.angle;
  const angleError = currentAngleDiff - c.referenceAngle;

  if (Math.abs(angleError) > 1e-8) {
    const totalInvInertia = bodyA.inverseInertia + bodyB.inverseInertia;
    if (totalInvInertia > 0) {
      const relAngVel = bodyB.angularVelocity - bodyA.angularVelocity;
      const bias = (beta / dt) * angleError;
      const angImpulse = -(relAngVel + bias) / totalInvInertia;

      if (!bodyA.isStatic) {
        bodyA.angularVelocity -= angImpulse * bodyA.inverseInertia;
      }
      if (!bodyB.isStatic) {
        bodyB.angularVelocity += angImpulse * bodyB.inverseInertia;
      }
    }
  }

  return positionalForce + Math.abs(angleError) / (dt * dt);
}

// --- Position-level constraint solver ---
// Only corrects positions to reduce drift. Never touches velocities.

function solveConstraintPosition(constraint: Constraint): number {
  if (constraint.broken) return 0;

  switch (constraint.type) {
    case ConstraintType.Distance:
      return solveDistancePosition(constraint);
    case ConstraintType.Revolute:
      return solveRevolutePosition(constraint);
    case ConstraintType.Fixed:
      return solveFixedPosition(constraint);
  }
}

function solveDistancePosition(c: DistanceConstraint): number {
  const { bodyA, bodyB } = c;

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

  // Position correction with reduced strength to avoid over-correction
  const slop = 0.005; // allowed penetration slop
  const correctionScale = 0.2; // only correct 20% per iteration
  const errorToCorrect = Math.sign(error) * Math.max(Math.abs(error) - slop, 0) * correctionScale;
  const correction = errorToCorrect / totalInvMass;

  if (!bodyA.isStatic) {
    bodyA.position = bodyA.position.add(normal.scale(correction * bodyA.inverseMass));
  }
  if (!bodyB.isStatic) {
    bodyB.position = bodyB.position.sub(normal.scale(correction * bodyB.inverseMass));
  }

  // --- Angular limit enforcement ---
  if (c.maxAngle !== undefined) {
    solveAngleLimit(c);
  }

  return Math.abs(error);
}

/**
 * Enforce angular limits on a distance constraint.
 *
 * For three consecutive beads (prev → current → next), the angle at each
 * joint should not deviate too far. We enforce this by checking the angle
 * between the center-to-center direction and the wire (anchor-to-anchor)
 * direction. When the wire bends too far from the center-to-center line,
 * we push the bodies apart laterally to straighten the kink.
 *
 * This approach works with the distance solver instead of fighting it,
 * because it moves body positions (not angles) and doesn't depend on
 * body rotation (which is irrelevant for circles).
 */
function solveAngleLimit(c: DistanceConstraint): void {
  const { bodyA, bodyB } = c;
  const maxAngle = c.maxAngle!;
  const correctionScale = 0.3;

  // Center-to-center direction (the "straight" reference direction)
  const centerDelta = bodyB.position.sub(bodyA.position);
  const centerDist = centerDelta.length();
  if (centerDist < 1e-10) return;
  const centerDir = centerDelta.scale(1 / centerDist);

  // Wire direction (anchor-to-anchor in world space)
  const worldA = localToWorld(bodyA, c.anchorA);
  const worldB = localToWorld(bodyB, c.anchorB);
  const wireDelta = worldB.sub(worldA);
  const wireLen = wireDelta.length();
  if (wireLen < 1e-10) return;
  const wireDir = wireDelta.scale(1 / wireLen);

  // Angle between center-to-center and wire direction
  const cosAngle = Math.max(-1, Math.min(1, centerDir.dot(wireDir)));
  const angle = Math.acos(cosAngle);

  if (angle <= maxAngle) return;

  // The wire is bending too far from the center-to-center line.
  // Compute the tangent (perpendicular to centerDir) component of wireDir.
  // Push the bodies to reduce this tangent component.
  const cross = centerDir.cross(wireDir);
  const sign = cross >= 0 ? 1 : -1;

  // Target: rotate wireDir toward centerDir by (angle - maxAngle)
  const excessAngle = (angle - maxAngle) * correctionScale;

  // Tangent direction (perpendicular to center-to-center line)
  const tangent = new Vec2(-centerDir.y, centerDir.x).scale(sign);

  // Push bodies apart along tangent to reduce the wire bend
  const pushMag = Math.sin(excessAngle) * centerDist * 0.5;
  const totalInvMass = bodyA.inverseMass + bodyB.inverseMass;
  if (totalInvMass === 0) return;

  if (!bodyA.isStatic) {
    bodyA.position = bodyA.position.add(tangent.scale(pushMag * bodyA.inverseMass / totalInvMass));
  }
  if (!bodyB.isStatic) {
    bodyB.position = bodyB.position.sub(tangent.scale(pushMag * bodyB.inverseMass / totalInvMass));
  }
}

function solveRevolutePosition(c: RevoluteConstraint): number {
  const { bodyA, bodyB } = c;

  const worldA = localToWorld(bodyA, c.anchorA);
  const worldB = localToWorld(bodyB, c.anchorB);
  const error = worldB.sub(worldA);
  const errorLen = error.length();

  if (errorLen < 1e-8) return 0;

  const totalInvMass = bodyA.inverseMass + bodyB.inverseMass;
  if (totalInvMass === 0) return 0;

  // Position correction with reduced strength
  const slop = 0.005;
  const correctionScale = 0.2;
  const correctedError = error.length() > slop
    ? error.scale(correctionScale / totalInvMass)
    : Vec2.zero().sub(Vec2.zero()); // no correction needed

  if (errorLen > slop) {
    const correction = error.scale(correctionScale / totalInvMass);

    if (!bodyA.isStatic) {
      bodyA.position = bodyA.position.add(correction.scale(bodyA.inverseMass));
    }
    if (!bodyB.isStatic) {
      bodyB.position = bodyB.position.sub(correction.scale(bodyB.inverseMass));
    }
  }

  return errorLen;
}

function solveFixedPosition(c: FixedConstraint): number {
  const { bodyA, bodyB } = c;

  // Position part (same as revolute)
  const posError = solveRevolutePosition(
    { ...c, type: ConstraintType.Revolute } as RevoluteConstraint,
  );

  // Angular position correction
  const currentAngleDiff = bodyB.angle - bodyA.angle;
  const angleError = currentAngleDiff - c.referenceAngle;

  if (Math.abs(angleError) > 1e-8) {
    const totalInvInertia = bodyA.inverseInertia + bodyB.inverseInertia;
    if (totalInvInertia > 0) {
      const correctionScale = 0.2;
      const angularCorrection = angleError * correctionScale / totalInvInertia;

      if (!bodyA.isStatic) {
        bodyA.angle += angularCorrection * bodyA.inverseInertia;
      }
      if (!bodyB.isStatic) {
        bodyB.angle -= angularCorrection * bodyB.inverseInertia;
      }
    }
  }

  return posError + Math.abs(angleError);
}

// --- Public API ---

/**
 * Resolve a single constraint (legacy API — calls both velocity and position phases).
 * Returns the magnitude of the corrective force (for break-force checking).
 */
export function resolveConstraint(constraint: Constraint, dt: number): number {
  if (constraint.broken) return 0;
  const velocityForce = solveConstraintVelocity(constraint, dt);
  solveConstraintPosition(constraint);
  return velocityForce;
}

/**
 * Velocity-only constraint solver pass.
 * Returns list of broken constraints (if any).
 */
export function resolveConstraintsVelocity(
  constraints: Constraint[],
  iterations: number,
  dt: number = 1 / 60,
): Constraint[] {
  const broken: Constraint[] = [];

  for (let i = 0; i < iterations; i++) {
    for (const constraint of constraints) {
      if (constraint.broken) continue;

      const force = solveConstraintVelocity(constraint, dt);

      // Check for breakage
      if (constraint.breakForce !== undefined && force > constraint.breakForce) {
        constraint.broken = true;
        broken.push(constraint);
      }
    }
  }

  return broken;
}

/**
 * Position-only constraint solver pass.
 * Only corrects positions to reduce drift. Never touches velocities.
 */
export function resolveConstraintsPosition(
  constraints: Constraint[],
  iterations: number,
): void {
  for (let i = 0; i < iterations; i++) {
    for (const constraint of constraints) {
      if (constraint.broken) continue;
      solveConstraintPosition(constraint);
    }
  }
}

/**
 * Resolve all constraints over multiple iterations (legacy combined API).
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
