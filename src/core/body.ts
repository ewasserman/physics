import { Vec2 } from '../math/vec2.js';
import { Shape, computeShapeInertia } from './shape.js';

/** Unique ID counter for rigid bodies. */
let nextBodyId = 0;

export interface RigidBody {
  readonly id: number;
  position: Vec2;
  angle: number;
  velocity: Vec2;
  angularVelocity: number;
  mass: number;
  inverseMass: number;
  inertia: number;
  inverseInertia: number;
  shape: Shape;
  restitution: number;
  friction: number;
  isStatic: boolean;
  force: Vec2;   // accumulated force for this timestep
  torque: number; // accumulated torque for this timestep
}

export interface CreateBodyOptions {
  position?: Vec2;
  angle?: number;
  velocity?: Vec2;
  angularVelocity?: number;
  mass?: number;
  shape: Shape;
  restitution?: number;
  friction?: number;
  isStatic?: boolean;
}

/**
 * Create a new rigid body with sensible defaults.
 * Static bodies get mass=Infinity (inverseMass=0).
 */
export function createRigidBody(options: CreateBodyOptions): RigidBody {
  const isStatic = options.isStatic ?? false;
  const mass = isStatic ? Infinity : (options.mass ?? 1);
  const inverseMass = isStatic ? 0 : 1 / mass;
  const inertia = isStatic ? Infinity : computeShapeInertia(options.shape, mass);
  const inverseInertia = isStatic ? 0 : (inertia > 0 ? 1 / inertia : 0);

  return {
    id: nextBodyId++,
    position: options.position ?? Vec2.zero(),
    angle: options.angle ?? 0,
    velocity: options.velocity ?? Vec2.zero(),
    angularVelocity: options.angularVelocity ?? 0,
    mass,
    inverseMass,
    inertia,
    inverseInertia,
    shape: options.shape,
    restitution: options.restitution ?? 0.5,
    friction: options.friction ?? 0.3,
    isStatic,
    force: Vec2.zero(),
    torque: 0,
  };
}

/**
 * Apply a force to a body. If a contact point is given (in world coordinates),
 * also compute and accumulate the resulting torque.
 */
export function applyForce(body: RigidBody, force: Vec2, point?: Vec2): void {
  body.force = body.force.add(force);
  if (point) {
    const r = point.sub(body.position);
    body.torque += r.cross(force);
  }
}

/**
 * Reset the ID counter (useful for tests).
 */
export function resetBodyIdCounter(): void {
  nextBodyId = 0;
}
