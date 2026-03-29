import { Vec2 } from '../math/vec2.js';
import { RigidBody } from '../core/body.js';
import { World } from '../core/world.js';

/**
 * Semi-Implicit (Symplectic) Euler integration for a single body.
 * Updates velocity THEN position (order matters for energy conservation).
 */
export function integrateBody(body: RigidBody, dt: number, damping = 0.999): void {
  if (body.isStatic) return;

  // Linear: velocity += (force / mass) * dt, then position += velocity * dt
  const acceleration = body.force.scale(body.inverseMass);
  body.velocity = body.velocity.add(acceleration.scale(dt));
  body.velocity = body.velocity.scale(damping);
  body.position = body.position.add(body.velocity.scale(dt));

  // Angular: angularVelocity += (torque / inertia) * dt, then angle += angularVelocity * dt
  body.angularVelocity += body.torque * body.inverseInertia * dt;
  body.angularVelocity *= damping;
  body.angle += body.angularVelocity * dt;
}

/**
 * Integrate all non-static bodies in the world, then clear force/torque accumulators.
 */
export function integrateWorld(world: World, dt: number, damping = 0.999): void {
  for (const body of world.bodies) {
    integrateBody(body, dt, damping);
  }

  // Clear accumulators after all bodies are integrated
  for (const body of world.bodies) {
    body.force = Vec2.zero();
    body.torque = 0;
  }
}
