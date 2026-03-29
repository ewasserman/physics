import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createRigidBody, resetBodyIdCounter } from '../../src/core/body.js';
import { createWorld, addBody, World } from '../../src/core/world.js';
import { createCircle } from '../../src/core/shape.js';
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

describe('Performance baseline', () => {
  beforeEach(() => resetBodyIdCounter());

  it('should time 120 steps (1 second of simulation) with 1 body', () => {
    const world = createWorld({ gravity: new Vec2(0, -GRAVITY), dt: DT });
    const ball = createRigidBody({
      shape: createCircle(0.5),
      position: new Vec2(0, 10),
      mass: 1.0,
      restitution: 0.7,
    });
    addBody(world, ball);

    // Warm up
    for (let i = 0; i < 10; i++) {
      stepWorld(world, DT);
    }

    // Reset
    ball.position = new Vec2(0, 10);
    ball.velocity = Vec2.zero();
    ball.force = Vec2.zero();
    world.time = 0;

    // Timed run
    const start = performance.now();
    for (let i = 0; i < 120; i++) {
      stepWorld(world, DT);
    }
    const elapsed = performance.now() - start;

    // Log the result (no assertion on speed -- this is a baseline measurement)
    console.log(`[Performance Baseline] 120 steps (1s sim-time) with 1 body: ${elapsed.toFixed(3)} ms`);
    console.log(`[Performance Baseline] Steps per millisecond: ${(120 / elapsed).toFixed(1)}`);
    console.log(`[Performance Baseline] Real-time factor: ${(1000 / elapsed).toFixed(1)}x`);

    // Sanity check: should complete in under 1 second (it should be way faster)
    expect(elapsed).toBeLessThan(1000);
  });

  it('should time 12,000 steps (100 seconds of simulation) with 1 body', () => {
    const world = createWorld({ gravity: new Vec2(0, -GRAVITY), dt: DT });
    const ball = createRigidBody({
      shape: createCircle(0.5),
      position: new Vec2(0, 10),
      mass: 1.0,
      restitution: 0.7,
    });
    addBody(world, ball);

    const start = performance.now();
    for (let i = 0; i < 12000; i++) {
      stepWorld(world, DT);
    }
    const elapsed = performance.now() - start;

    console.log(`[Performance Baseline] 12,000 steps (100s sim-time): ${elapsed.toFixed(3)} ms`);
    console.log(`[Performance Baseline] Steps per millisecond: ${(12000 / elapsed).toFixed(1)}`);

    expect(elapsed).toBeLessThan(5000);
  });
});
