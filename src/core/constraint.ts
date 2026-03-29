import { Vec2 } from '../math/vec2.js';
import { RigidBody } from './body.js';

/** Constraint types. */
export enum ConstraintType {
  Distance = 'distance',
  Revolute = 'revolute',
  Fixed = 'fixed',
}

/** Base fields shared by all constraints. */
export interface ConstraintBase {
  bodyA: RigidBody;
  bodyB: RigidBody;
  anchorA: Vec2; // local-space offset on bodyA
  anchorB: Vec2; // local-space offset on bodyB
  stiffness: number; // 0-1, how rigidly enforced (1 = rigid)
  breakForce?: number; // if set, constraint breaks when force exceeds this
  broken: boolean;
}

/** Maintains a fixed distance between two anchor points. */
export interface DistanceConstraint extends ConstraintBase {
  type: ConstraintType.Distance;
  distance: number; // target distance
}

/** Pins two bodies at a shared point; they rotate freely relative to each other. */
export interface RevoluteConstraint extends ConstraintBase {
  type: ConstraintType.Revolute;
}

/** Locks two bodies together — no relative motion. */
export interface FixedConstraint extends ConstraintBase {
  type: ConstraintType.Fixed;
  referenceAngle: number; // the angle difference bodyB.angle - bodyA.angle at creation
}

/** Discriminated union of all constraint types. */
export type Constraint = DistanceConstraint | RevoluteConstraint | FixedConstraint;

// --- Factory functions ---

export interface CreateDistanceConstraintOptions {
  bodyA: RigidBody;
  bodyB: RigidBody;
  anchorA?: Vec2;
  anchorB?: Vec2;
  distance?: number;
  stiffness?: number;
  breakForce?: number;
}

/**
 * Create a distance constraint between two bodies.
 * If distance is not specified, it is computed from the current positions and anchors.
 */
export function createDistanceConstraint(options: CreateDistanceConstraintOptions): DistanceConstraint;
export function createDistanceConstraint(
  bodyA: RigidBody,
  bodyB: RigidBody,
  anchorA?: Vec2,
  anchorB?: Vec2,
  distance?: number,
  stiffness?: number,
  breakForce?: number,
): DistanceConstraint;
export function createDistanceConstraint(
  bodyAOrOptions: RigidBody | CreateDistanceConstraintOptions,
  bodyB?: RigidBody,
  anchorA?: Vec2,
  anchorB?: Vec2,
  distance?: number,
  stiffness?: number,
  breakForce?: number,
): DistanceConstraint {
  let opts: CreateDistanceConstraintOptions;
  if (bodyB !== undefined) {
    opts = {
      bodyA: bodyAOrOptions as RigidBody,
      bodyB,
      anchorA,
      anchorB,
      distance,
      stiffness,
      breakForce,
    };
  } else {
    opts = bodyAOrOptions as CreateDistanceConstraintOptions;
  }

  const aA = opts.anchorA ?? Vec2.zero();
  const aB = opts.anchorB ?? Vec2.zero();
  const worldA = localToWorld(opts.bodyA, aA);
  const worldB = localToWorld(opts.bodyB, aB);
  const dist = opts.distance ?? worldA.distanceTo(worldB);

  return {
    type: ConstraintType.Distance,
    bodyA: opts.bodyA,
    bodyB: opts.bodyB,
    anchorA: aA,
    anchorB: aB,
    distance: dist,
    stiffness: opts.stiffness ?? 1.0,
    breakForce: opts.breakForce,
    broken: false,
  };
}

export interface CreateRevoluteConstraintOptions {
  bodyA: RigidBody;
  bodyB: RigidBody;
  anchorA?: Vec2;
  anchorB?: Vec2;
  stiffness?: number;
  breakForce?: number;
}

/**
 * Create a revolute (hinge/axle) constraint between two bodies.
 */
export function createRevoluteConstraint(options: CreateRevoluteConstraintOptions): RevoluteConstraint;
export function createRevoluteConstraint(
  bodyA: RigidBody,
  bodyB: RigidBody,
  anchorA?: Vec2,
  anchorB?: Vec2,
  stiffness?: number,
  breakForce?: number,
): RevoluteConstraint;
export function createRevoluteConstraint(
  bodyAOrOptions: RigidBody | CreateRevoluteConstraintOptions,
  bodyB?: RigidBody,
  anchorA?: Vec2,
  anchorB?: Vec2,
  stiffness?: number,
  breakForce?: number,
): RevoluteConstraint {
  let opts: CreateRevoluteConstraintOptions;
  if (bodyB !== undefined) {
    opts = {
      bodyA: bodyAOrOptions as RigidBody,
      bodyB,
      anchorA,
      anchorB,
      stiffness,
      breakForce,
    };
  } else {
    opts = bodyAOrOptions as CreateRevoluteConstraintOptions;
  }

  return {
    type: ConstraintType.Revolute,
    bodyA: opts.bodyA,
    bodyB: opts.bodyB,
    anchorA: opts.anchorA ?? Vec2.zero(),
    anchorB: opts.anchorB ?? Vec2.zero(),
    stiffness: opts.stiffness ?? 1.0,
    breakForce: opts.breakForce,
    broken: false,
  };
}

export interface CreateFixedConstraintOptions {
  bodyA: RigidBody;
  bodyB: RigidBody;
  anchorA?: Vec2;
  anchorB?: Vec2;
  referenceAngle?: number;
  stiffness?: number;
  breakForce?: number;
}

/**
 * Create a fixed (weld) constraint between two bodies.
 * If referenceAngle is not specified, it's computed from current angles.
 */
export function createFixedConstraint(options: CreateFixedConstraintOptions): FixedConstraint;
export function createFixedConstraint(
  bodyA: RigidBody,
  bodyB: RigidBody,
  anchorA?: Vec2,
  anchorB?: Vec2,
  referenceAngle?: number,
  stiffness?: number,
  breakForce?: number,
): FixedConstraint;
export function createFixedConstraint(
  bodyAOrOptions: RigidBody | CreateFixedConstraintOptions,
  bodyB?: RigidBody,
  anchorA?: Vec2,
  anchorB?: Vec2,
  referenceAngle?: number,
  stiffness?: number,
  breakForce?: number,
): FixedConstraint {
  let opts: CreateFixedConstraintOptions;
  if (bodyB !== undefined) {
    opts = {
      bodyA: bodyAOrOptions as RigidBody,
      bodyB,
      anchorA,
      anchorB,
      referenceAngle,
      stiffness,
      breakForce,
    };
  } else {
    opts = bodyAOrOptions as CreateFixedConstraintOptions;
  }

  return {
    type: ConstraintType.Fixed,
    bodyA: opts.bodyA,
    bodyB: opts.bodyB,
    anchorA: opts.anchorA ?? Vec2.zero(),
    anchorB: opts.anchorB ?? Vec2.zero(),
    referenceAngle: opts.referenceAngle ?? (opts.bodyB.angle - opts.bodyA.angle),
    stiffness: opts.stiffness ?? 1.0,
    breakForce: opts.breakForce,
    broken: false,
  };
}

// --- Helper ---

/** Convert a local-space anchor to world space. */
export function localToWorld(body: RigidBody, localPoint: Vec2): Vec2 {
  const rotated = localPoint.rotate(body.angle);
  return body.position.add(rotated);
}
