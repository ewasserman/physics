import { Vec2 } from '../math/vec2.js';
import { RigidBody } from '../core/body.js';
import { World } from '../core/world.js';
import { ShapeType } from '../core/shape.js';

/** Contact information from a collision detection. */
export interface Contact {
  bodyA: RigidBody;
  bodyB: RigidBody | null; // null for floor/static-plane collisions
  normal: Vec2;            // collision normal (points away from floor, i.e., upward)
  penetration: number;     // overlap depth (positive when penetrating)
  point: Vec2;             // contact point in world space
}

/**
 * Detect collision between a circle body and a horizontal floor plane.
 * Returns a Contact if penetrating, null otherwise.
 */
export function detectCircleFloor(body: RigidBody, floorY: number): Contact | null {
  if (body.shape.type !== ShapeType.Circle) return null;

  const radius = body.shape.radius;
  const bottomY = body.position.y - radius;

  if (bottomY >= floorY) return null; // no penetration

  const penetration = floorY - bottomY;
  const contactPoint = new Vec2(body.position.x, floorY);
  const normal = new Vec2(0, 1); // upward

  return {
    bodyA: body,
    bodyB: null,
    normal,
    penetration,
    point: contactPoint,
  };
}

/**
 * Detect collision between an AABB body and a horizontal floor plane.
 * Returns a Contact if penetrating, null otherwise.
 */
export function detectAABBFloor(body: RigidBody, floorY: number): Contact | null {
  if (body.shape.type !== ShapeType.AABB) return null;

  const halfHeight = body.shape.halfHeight;
  const bottomY = body.position.y - halfHeight;

  if (bottomY >= floorY) return null; // no penetration

  const penetration = floorY - bottomY;
  const contactPoint = new Vec2(body.position.x, floorY);
  const normal = new Vec2(0, 1); // upward

  return {
    bodyA: body,
    bodyB: null,
    normal,
    penetration,
    point: contactPoint,
  };
}

/**
 * Detect all floor collisions for bodies in the world.
 * Supports Circle and AABB shapes.
 */
export function detectFloorCollisions(world: World, floorY: number): Contact[] {
  const contacts: Contact[] = [];

  for (const body of world.bodies) {
    if (body.isStatic) continue;

    let contact: Contact | null = null;
    switch (body.shape.type) {
      case ShapeType.Circle:
        contact = detectCircleFloor(body, floorY);
        break;
      case ShapeType.AABB:
        contact = detectAABBFloor(body, floorY);
        break;
      // Polygon floor collision not implemented in Phase 1
    }

    if (contact) {
      contacts.push(contact);
    }
  }

  return contacts;
}
