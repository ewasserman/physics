import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createRigidBody, resetBodyIdCounter, RigidBody } from '../../src/core/body.js';
import { createWorld, addBody, World } from '../../src/core/world.js';
import { createCircle, createAABB } from '../../src/core/shape.js';
import { applyGravity } from '../../src/physics/forces.js';
import { integrateWorld } from '../../src/physics/integrator.js';
import { detectFloorCollisions } from '../../src/physics/collision.js';
import { resolveContact } from '../../src/physics/response.js';

const DT = 1 / 120;
const GRAVITY = 9.81;
const FLOOR_Y = 0;
const DAMPING = 1.0;

function stepWorld(world: World, dt: number): void {
  applyGravity(world);
  integrateWorld(world, dt, DAMPING);
  const contacts = detectFloorCollisions(world, FLOOR_Y);
  for (const contact of contacts) {
    resolveContact(contact);
  }
  world.time += dt;
}

function totalEnergy(body: RigidBody): number {
  const ke = 0.5 * body.mass * body.velocity.lengthSq();
  const pe = body.mass * GRAVITY * body.position.y;
  return ke + pe;
}

// ─── Long-run stability ────────────────────────────────────────────────────

describe('Long-run stability (10,000 steps)', () => {
  beforeEach(() => resetBodyIdCounter());

  it('should produce no NaN or Infinity values over 10,000 steps (circle, e=0.7)', () => {
    const world = createWorld({ gravity: new Vec2(0, -GRAVITY), dt: DT });
    const ball = createRigidBody({
      shape: createCircle(0.5),
      position: new Vec2(0, 10),
      mass: 1.0,
      restitution: 0.7,
    });
    addBody(world, ball);

    for (let i = 0; i < 10000; i++) {
      stepWorld(world, DT);
      expect(Number.isFinite(ball.position.x)).toBe(true);
      expect(Number.isFinite(ball.position.y)).toBe(true);
      expect(Number.isFinite(ball.velocity.x)).toBe(true);
      expect(Number.isFinite(ball.velocity.y)).toBe(true);
    }
  });

  it('should not have energy explosion over 10,000 steps (circle, e=0.7)', () => {
    const world = createWorld({ gravity: new Vec2(0, -GRAVITY), dt: DT });
    const ball = createRigidBody({
      shape: createCircle(0.5),
      position: new Vec2(0, 10),
      mass: 1.0,
      restitution: 0.7,
    });
    addBody(world, ball);

    const E0 = totalEnergy(ball);

    for (let i = 0; i < 10000; i++) {
      stepWorld(world, DT);
    }

    const Efinal = totalEnergy(ball);
    // Energy should not exceed initial (within 5% tolerance for numerical noise)
    expect(Efinal).toBeLessThan(E0 * 1.05);
  });
});

// ─── Static body stability ─────────────────────────────────────────────────

describe('Static body on floor', () => {
  beforeEach(() => resetBodyIdCounter());

  it('should remain stationary over 1000 steps', () => {
    const world = createWorld({ gravity: new Vec2(0, -GRAVITY), dt: DT });
    const staticBody = createRigidBody({
      shape: createCircle(0.5),
      position: new Vec2(5, 0.5),
      isStatic: true,
    });
    addBody(world, staticBody);

    const startPos = staticBody.position.clone();

    for (let i = 0; i < 1000; i++) {
      stepWorld(world, DT);
    }

    expect(staticBody.position.x).toBe(startPos.x);
    expect(staticBody.position.y).toBe(startPos.y);
    expect(staticBody.velocity.x).toBe(0);
    expect(staticBody.velocity.y).toBe(0);
  });
});

// ─── Body at rest on floor ─────────────────────────────────────────────────

describe('Body at rest on floor', () => {
  beforeEach(() => resetBodyIdCounter());

  it('should not jitter or sink through floor (circle)', () => {
    const world = createWorld({ gravity: new Vec2(0, -GRAVITY), dt: DT });
    // Place ball exactly on the floor surface
    const ball = createRigidBody({
      shape: createCircle(0.5),
      position: new Vec2(0, 0.5), // center at radius = resting on floor
      velocity: Vec2.zero(),
      mass: 1.0,
      restitution: 0.0,
    });
    addBody(world, ball);

    let minY = ball.position.y;
    let maxY = ball.position.y;

    for (let i = 0; i < 1000; i++) {
      stepWorld(world, DT);
      if (ball.position.y < minY) minY = ball.position.y;
      if (ball.position.y > maxY) maxY = ball.position.y;
    }

    // Should not sink through floor
    expect(ball.position.y).toBeGreaterThanOrEqual(0.5 - 0.01);
    // Should not bounce up significantly
    expect(maxY).toBeLessThan(0.6);
    // Jitter should be small
    expect(maxY - minY).toBeLessThan(0.1);
  });

  it('should not sink through floor (AABB)', () => {
    const world = createWorld({ gravity: new Vec2(0, -GRAVITY), dt: DT });
    const box = createRigidBody({
      shape: createAABB(0.5, 0.5),
      position: new Vec2(0, 0.5),
      velocity: Vec2.zero(),
      mass: 1.0,
      restitution: 0.0,
    });
    addBody(world, box);

    for (let i = 0; i < 1000; i++) {
      stepWorld(world, DT);
    }

    expect(box.position.y).toBeGreaterThanOrEqual(0.5 - 0.01);
  });
});

// ─── AABB scenarios ────────────────────────────────────────────────────────

describe('AABB body scenarios', () => {
  beforeEach(() => resetBodyIdCounter());

  it('should free-fall correctly (same as circle)', () => {
    const world = createWorld({ gravity: new Vec2(0, -GRAVITY), dt: DT });
    const box = createRigidBody({
      shape: createAABB(0.5, 0.5), // halfHeight=0.5 same as circle radius
      position: new Vec2(0, 10),
      velocity: Vec2.zero(),
      mass: 1.0,
      restitution: 0.5,
    });
    addBody(world, box);

    // Run for 0.5s
    for (let i = 0; i < 60; i++) {
      stepWorld(world, DT);
    }

    // Same analytical values as circle
    expect(Math.abs(box.position.y - 8.7738)).toBeLessThan(0.025);
    expect(Math.abs(box.velocity.y - (-4.905))).toBeLessThan(0.01);
  });

  it('should bounce off floor (AABB, e=0.8)', () => {
    const world = createWorld({ gravity: new Vec2(0, -GRAVITY), dt: DT });
    const box = createRigidBody({
      shape: createAABB(0.5, 0.5),
      position: new Vec2(0, 10),
      velocity: Vec2.zero(),
      mass: 1.0,
      restitution: 0.8,
    });
    addBody(world, box);

    // Run until bounce
    let bounced = false;
    for (let i = 0; i < Math.round(2.0 / DT); i++) {
      const prevVy = box.velocity.y;
      stepWorld(world, DT);
      if (prevVy < -1 && box.velocity.y > 0) {
        bounced = true;
        break;
      }
    }

    expect(bounced).toBe(true);
    // Bounce velocity should be near e * |v_impact| = 0.8 * 13.65 ~ 10.92
    expect(Math.abs(box.velocity.y - 10.922)).toBeLessThan(0.15);
  });

  it('should produce no NaN or Infinity over 10,000 steps (AABB)', () => {
    const world = createWorld({ gravity: new Vec2(0, -GRAVITY), dt: DT });
    const box = createRigidBody({
      shape: createAABB(0.5, 0.5),
      position: new Vec2(0, 10),
      mass: 1.0,
      restitution: 0.7,
    });
    addBody(world, box);

    for (let i = 0; i < 10000; i++) {
      stepWorld(world, DT);
      expect(Number.isFinite(box.position.x)).toBe(true);
      expect(Number.isFinite(box.position.y)).toBe(true);
      expect(Number.isFinite(box.velocity.x)).toBe(true);
      expect(Number.isFinite(box.velocity.y)).toBe(true);
    }
  });
});
