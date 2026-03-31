import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createSimulation, step } from '../../src/sim/simulation.js';
import { createRigidBody, resetBodyIdCounter } from '../../src/core/body.js';
import { createCircle } from '../../src/core/shape.js';
import { addBody } from '../../src/core/world.js';
import { ContactCache } from '../../src/physics/warmstart.js';

describe('ContactCache', () => {
  it('should store and retrieve impulses by body pair', () => {
    const cache = new ContactCache();

    // Create mock contacts
    const bodyA = createRigidBody({ shape: createCircle(1), position: new Vec2(0, 0) });
    const bodyB = createRigidBody({ shape: createCircle(1), position: new Vec2(2, 0) });

    const contacts = [{
      bodyA,
      bodyB,
      normal: new Vec2(1, 0),
      penetration: 0.1,
      point: new Vec2(1, 0),
    }];

    cache.store(contacts, [5.0]);
    expect(cache.retrieve(bodyA.id, bodyB.id)).toBe(5.0);
    // Order should not matter
    expect(cache.retrieve(bodyB.id, bodyA.id)).toBe(5.0);
  });

  it('should return 0 for unknown pairs', () => {
    const cache = new ContactCache();
    expect(cache.retrieve(99, 100)).toBe(0);
  });

  it('should clear all cached values', () => {
    const cache = new ContactCache();
    const bodyA = createRigidBody({ shape: createCircle(1), position: new Vec2(0, 0) });
    const bodyB = createRigidBody({ shape: createCircle(1), position: new Vec2(2, 0) });

    const contacts = [{
      bodyA,
      bodyB,
      normal: new Vec2(1, 0),
      penetration: 0.1,
      point: new Vec2(1, 0),
    }];

    cache.store(contacts, [5.0]);
    cache.clear();
    expect(cache.retrieve(bodyA.id, bodyB.id)).toBe(0);
  });
});

describe('Warm-starting stacking stability', () => {
  beforeEach(() => resetBodyIdCounter());

  it('stack of 5 circles should be stable after 2000 steps', () => {
    const sim = createSimulation({
      gravity: new Vec2(0, -9.81),
      floorY: 0,
      dt: 1 / 60,
      solverIterations: 10,
      damping: 0.001,
    });

    // Stack 5 circles vertically
    const radius = 0.5;
    const circles = [];
    for (let i = 0; i < 5; i++) {
      const body = createRigidBody({
        shape: createCircle(radius),
        position: new Vec2(0, radius + i * (radius * 2 + 0.01)),
        mass: 1,
        restitution: 0.0, // inelastic to encourage settling
        friction: 0.5,
      });
      addBody(sim.world, body);
      circles.push(body);
    }

    // Run 2000 steps to let stack settle
    for (let i = 0; i < 2000; i++) {
      step(sim);
    }

    // Check position drift: all circles should be near their resting position
    // Bottom circle should be near y = radius (with tolerance for Baumgarte corrections)
    const bottomY = circles[0].position.y;
    expect(bottomY).toBeGreaterThan(radius - 0.5);
    expect(bottomY).toBeLessThan(radius + 1.5);

    // All circles should be above the floor
    for (const circle of circles) {
      expect(circle.position.y).toBeGreaterThan(0);
    }

    // Velocities should be near zero (settled)
    for (const circle of circles) {
      expect(circle.velocity.length()).toBeLessThan(2.0);
    }

    // No NaN
    for (const circle of circles) {
      expect(Number.isFinite(circle.position.x)).toBe(true);
      expect(Number.isFinite(circle.position.y)).toBe(true);
      expect(Number.isFinite(circle.velocity.x)).toBe(true);
      expect(Number.isFinite(circle.velocity.y)).toBe(true);
    }
  });
});
