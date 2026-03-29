import { RigidBody, applyForce } from '../core/body.js';
import { World } from '../core/world.js';

/**
 * Apply gravity force to each non-static body in the world.
 * Gravity force = mass * world.gravity.
 */
export function applyGravity(world: World): void {
  for (const body of world.bodies) {
    if (body.isStatic) continue;
    const gravityForce = world.gravity.scale(body.mass);
    applyForce(body, gravityForce);
  }
}
