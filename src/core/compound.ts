import { Vec2 } from '../math/vec2.js';
import { RigidBody, createRigidBody } from './body.js';
import { createAABB, createCircle } from './shape.js';
import { Constraint, createRevoluteConstraint } from './constraint.js';
import { World, addBody, addConstraint } from './world.js';

/** A compound object: a group of bodies connected by constraints. */
export interface CompoundObject {
  bodies: RigidBody[];
  constraints: Constraint[];
}

/**
 * Register bodies and constraints in a world, returning a CompoundObject.
 */
export function createCompoundObject(
  world: World,
  bodies: RigidBody[],
  constraints: Constraint[],
): CompoundObject {
  for (const body of bodies) {
    addBody(world, body);
  }
  for (const constraint of constraints) {
    addConstraint(world, constraint);
  }
  return { bodies, constraints };
}

/** Options for car creation. */
export interface CreateCarOptions {
  chassisWidth?: number;
  chassisHeight?: number;
  chassisMass?: number;
  wheelRadius?: number;
  wheelMass?: number;
  wheelOffsetX?: number;
  wheelOffsetY?: number;
  friction?: number;
}

/**
 * Create a car compound object: chassis (AABB) + 2 wheels (circles) with revolute joints.
 */
export function createCar(
  world: World,
  x: number,
  y: number,
  options: CreateCarOptions = {},
): CompoundObject {
  const chassisW = (options.chassisWidth ?? 2) / 2;   // halfWidth
  const chassisH = (options.chassisHeight ?? 0.5) / 2; // halfHeight
  const chassisMass = options.chassisMass ?? 5;
  const wheelRadius = options.wheelRadius ?? 0.4;
  const wheelMass = options.wheelMass ?? 1;
  const wheelOffsetX = options.wheelOffsetX ?? 1.5;
  const wheelOffsetY = options.wheelOffsetY ?? 0.7;
  const friction = options.friction ?? 0.6;

  const chassis = createRigidBody({
    shape: createAABB(chassisW, chassisH),
    position: new Vec2(x, y),
    mass: chassisMass,
    friction,
  });

  const wheelL = createRigidBody({
    shape: createCircle(wheelRadius),
    position: new Vec2(x - wheelOffsetX, y - wheelOffsetY),
    mass: wheelMass,
    friction,
  });

  const wheelR = createRigidBody({
    shape: createCircle(wheelRadius),
    position: new Vec2(x + wheelOffsetX, y - wheelOffsetY),
    mass: wheelMass,
    friction,
  });

  const bodies = [chassis, wheelL, wheelR];

  // Revolute constraints (axles): anchor on chassis at wheel offset, anchor on wheel at center
  const axleL = createRevoluteConstraint(
    chassis,
    wheelL,
    new Vec2(-wheelOffsetX, -wheelOffsetY),
    Vec2.zero(),
  );
  const axleR = createRevoluteConstraint(
    chassis,
    wheelR,
    new Vec2(wheelOffsetX, -wheelOffsetY),
    Vec2.zero(),
  );

  const constraints: Constraint[] = [axleL, axleR];

  return createCompoundObject(world, bodies, constraints);
}

/**
 * Create a simple cart: 1 box + 2 wheels with revolute joints.
 */
export function createCart(
  world: World,
  x: number,
  y: number,
): CompoundObject {
  return createCar(world, x, y, {
    chassisWidth: 1.5,
    chassisHeight: 0.4,
    chassisMass: 3,
    wheelRadius: 0.3,
    wheelMass: 0.5,
    wheelOffsetX: 0.6,
    wheelOffsetY: 0.5,
  });
}
