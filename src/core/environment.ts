import { Vec2 } from '../math/vec2.js';
import { RigidBody, createRigidBody } from './body.js';
import { createAABB } from './shape.js';
import { World, addBody } from './world.js';

/** Default friction for environment bodies. */
const ENV_FRICTION = 0.6;
/** Default restitution for environment bodies. */
const ENV_RESTITUTION = 0.3;

/**
 * Create a wide static floor at the given y position.
 * The floor is centered at x=0 with the given width.
 */
export function createFloor(world: World, y: number, width: number): RigidBody {
  const halfWidth = width / 2;
  const halfHeight = 0.5; // thin floor
  const body = createRigidBody({
    shape: createAABB(halfWidth, halfHeight),
    position: new Vec2(0, y - halfHeight),
    isStatic: true,
    friction: ENV_FRICTION,
    restitution: ENV_RESTITUTION,
  });
  addBody(world, body);
  return body;
}

/**
 * Create a vertical static wall at the given position.
 */
export function createWall(world: World, x: number, y: number, height: number): RigidBody {
  const halfWidth = 0.5; // thin wall
  const halfHeight = height / 2;
  const body = createRigidBody({
    shape: createAABB(halfWidth, halfHeight),
    position: new Vec2(x, y),
    isStatic: true,
    friction: ENV_FRICTION,
    restitution: ENV_RESTITUTION,
  });
  addBody(world, body);
  return body;
}

/**
 * Create a static rectangular obstacle (box) at the given position.
 */
export function createBox(world: World, x: number, y: number, width: number, height: number): RigidBody {
  const body = createRigidBody({
    shape: createAABB(width / 2, height / 2),
    position: new Vec2(x, y),
    isStatic: true,
    friction: ENV_FRICTION,
    restitution: ENV_RESTITUTION,
  });
  addBody(world, body);
  return body;
}

/**
 * Create 4 walls forming a box boundary.
 * Returns [left, right, bottom, top] walls.
 */
export function createBoundary(
  world: World,
  left: number,
  right: number,
  bottom: number,
  top: number,
): RigidBody[] {
  const width = right - left;
  const height = top - bottom;
  const cx = (left + right) / 2;
  const cy = (bottom + top) / 2;
  const wallThickness = 1;
  const halfThick = wallThickness / 2;

  // Left wall
  const leftWall = createRigidBody({
    shape: createAABB(halfThick, height / 2),
    position: new Vec2(left - halfThick, cy),
    isStatic: true,
    friction: ENV_FRICTION,
    restitution: ENV_RESTITUTION,
  });

  // Right wall
  const rightWall = createRigidBody({
    shape: createAABB(halfThick, height / 2),
    position: new Vec2(right + halfThick, cy),
    isStatic: true,
    friction: ENV_FRICTION,
    restitution: ENV_RESTITUTION,
  });

  // Bottom wall (floor)
  const bottomWall = createRigidBody({
    shape: createAABB(width / 2, halfThick),
    position: new Vec2(cx, bottom - halfThick),
    isStatic: true,
    friction: ENV_FRICTION,
    restitution: ENV_RESTITUTION,
  });

  // Top wall (ceiling)
  const topWall = createRigidBody({
    shape: createAABB(width / 2, halfThick),
    position: new Vec2(cx, top + halfThick),
    isStatic: true,
    friction: ENV_FRICTION,
    restitution: ENV_RESTITUTION,
  });

  const walls = [leftWall, rightWall, bottomWall, topWall];
  for (const wall of walls) {
    addBody(world, wall);
  }
  return walls;
}
