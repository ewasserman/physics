import { Vec2 } from '../math/vec2.js';
import { RigidBody } from './body.js';
import { Constraint } from './constraint.js';

export interface World {
  bodies: RigidBody[];
  constraints: Constraint[];
  gravity: Vec2;
  time: number;
  dt: number;
}

export interface CreateWorldOptions {
  gravity?: Vec2;
  dt?: number;
}

/** Create a new simulation world with sensible defaults. */
export function createWorld(options: CreateWorldOptions = {}): World {
  return {
    bodies: [],
    constraints: [],
    gravity: options.gravity ?? new Vec2(0, -9.81),
    time: 0,
    dt: options.dt ?? 1 / 60,
  };
}

/** Add a body to the world. */
export function addBody(world: World, body: RigidBody): void {
  world.bodies.push(body);
}

/** Remove a body from the world by reference. */
export function removeBody(world: World, body: RigidBody): void {
  const idx = world.bodies.indexOf(body);
  if (idx !== -1) {
    world.bodies.splice(idx, 1);
  }
}

/** Add a constraint to the world. */
export function addConstraint(world: World, constraint: Constraint): void {
  world.constraints.push(constraint);
}

/** Remove a constraint from the world by reference. */
export function removeConstraint(world: World, constraint: Constraint): void {
  const idx = world.constraints.indexOf(constraint);
  if (idx !== -1) {
    world.constraints.splice(idx, 1);
  }
}
