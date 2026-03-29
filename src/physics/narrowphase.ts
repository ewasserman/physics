import { Vec2 } from '../math/vec2.js';
import { RigidBody } from '../core/body.js';
import { ShapeType } from '../core/shape.js';
import { Contact } from './collision.js';

/**
 * Detect collision between two circles.
 * Normal points from A to B.
 */
export function circleVsCircle(a: RigidBody, b: RigidBody): Contact | null {
  const rA = a.shape.type === ShapeType.Circle ? a.shape.radius : 0;
  const rB = b.shape.type === ShapeType.Circle ? b.shape.radius : 0;

  const delta = b.position.sub(a.position);
  const distSq = delta.lengthSq();
  const sumR = rA + rB;

  if (distSq >= sumR * sumR) return null; // not overlapping

  const dist = Math.sqrt(distSq);
  const normal = dist > 0 ? delta.scale(1 / dist) : new Vec2(1, 0); // arbitrary if coincident
  const penetration = sumR - dist;
  const point = a.position.add(normal.scale(rA - penetration / 2));

  return { bodyA: a, bodyB: b, normal, penetration, point };
}

/**
 * Detect collision between a circle (body a) and an AABB (body b).
 * Normal points from A to B.
 */
export function circleVsAABB(a: RigidBody, b: RigidBody): Contact | null {
  if (a.shape.type !== ShapeType.Circle || b.shape.type !== ShapeType.AABB) return null;

  const radius = a.shape.radius;
  const hw = b.shape.halfWidth;
  const hh = b.shape.halfHeight;

  // Find closest point on AABB to circle center (in world space)
  const dx = a.position.x - b.position.x;
  const dy = a.position.y - b.position.y;

  const clampedX = Math.max(-hw, Math.min(hw, dx));
  const clampedY = Math.max(-hh, Math.min(hh, dy));

  const closestX = b.position.x + clampedX;
  const closestY = b.position.y + clampedY;

  const diffX = a.position.x - closestX;
  const diffY = a.position.y - closestY;
  const distSq = diffX * diffX + diffY * diffY;

  if (distSq >= radius * radius) return null;

  const dist = Math.sqrt(distSq);

  let normal: Vec2;
  let penetration: number;

  if (dist > 0) {
    // Circle center is outside the AABB
    normal = new Vec2(diffX / dist, diffY / dist);
    penetration = radius - dist;
  } else {
    // Circle center is inside the AABB — push along shortest axis
    const overlapX = hw - Math.abs(dx);
    const overlapY = hh - Math.abs(dy);
    if (overlapX < overlapY) {
      normal = new Vec2(dx >= 0 ? 1 : -1, 0);
      penetration = overlapX + radius;
    } else {
      normal = new Vec2(0, dy >= 0 ? 1 : -1);
      penetration = overlapY + radius;
    }
  }

  // Normal should point from A to B, so negate (it currently points from B's surface to A)
  normal = normal.negate();
  const point = new Vec2(closestX, closestY);

  return { bodyA: a, bodyB: b, normal, penetration, point };
}

/**
 * Detect collision between two AABBs.
 * Normal points from A to B.
 */
export function aabbVsAABB(a: RigidBody, b: RigidBody): Contact | null {
  if (a.shape.type !== ShapeType.AABB || b.shape.type !== ShapeType.AABB) return null;

  const hwA = a.shape.halfWidth;
  const hhA = a.shape.halfHeight;
  const hwB = b.shape.halfWidth;
  const hhB = b.shape.halfHeight;

  const dx = b.position.x - a.position.x;
  const dy = b.position.y - a.position.y;

  const overlapX = (hwA + hwB) - Math.abs(dx);
  const overlapY = (hhA + hhB) - Math.abs(dy);

  if (overlapX <= 0 || overlapY <= 0) return null;

  let normal: Vec2;
  let penetration: number;

  if (overlapX < overlapY) {
    normal = new Vec2(dx >= 0 ? 1 : -1, 0);
    penetration = overlapX;
  } else {
    normal = new Vec2(0, dy >= 0 ? 1 : -1);
    penetration = overlapY;
  }

  // Contact point: midpoint of overlap region
  const point = new Vec2(
    (a.position.x + b.position.x) / 2,
    (a.position.y + b.position.y) / 2,
  );

  return { bodyA: a, bodyB: b, normal, penetration, point };
}

/** Dispatch table for collision detection between two bodies. */
export function detectCollision(a: RigidBody, b: RigidBody): Contact | null {
  const tA = a.shape.type;
  const tB = b.shape.type;

  if (tA === ShapeType.Circle && tB === ShapeType.Circle) {
    return circleVsCircle(a, b);
  }
  if (tA === ShapeType.Circle && tB === ShapeType.AABB) {
    return circleVsAABB(a, b);
  }
  if (tA === ShapeType.AABB && tB === ShapeType.Circle) {
    // Flip and negate normal
    const contact = circleVsAABB(b, a);
    if (!contact) return null;
    return {
      bodyA: a,
      bodyB: b,
      normal: contact.normal.negate(),
      penetration: contact.penetration,
      point: contact.point,
    };
  }
  if (tA === ShapeType.AABB && tB === ShapeType.AABB) {
    return aabbVsAABB(a, b);
  }

  // Polygon pairs deferred to Phase 3
  return null;
}
