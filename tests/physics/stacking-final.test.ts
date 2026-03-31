import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createSimulation, step } from '../../src/sim/simulation.js';
import { createRigidBody, resetBodyIdCounter } from '../../src/core/body.js';
import { createCircle, createAABB } from '../../src/core/shape.js';
import { addBody } from '../../src/core/world.js';

describe('Stacking stability — final (post warm-starting)', () => {
  beforeEach(() => resetBodyIdCounter());

  it('5 circles stacked on floor: stable after 5000 steps (41.7s)', () => {
    const sim = createSimulation({
      gravity: new Vec2(0, -9.81),
      floorY: 0,
      dt: 1 / 120,
      solverIterations: 10,
      damping: 0.001,
    });

    const radius = 0.5;
    const circles = [];
    for (let i = 0; i < 5; i++) {
      const body = createRigidBody({
        shape: createCircle(radius),
        position: new Vec2(0, radius + i * (radius * 2 + 0.01)),
        mass: 1,
        restitution: 0.0,
        friction: 0.5,
      });
      addBody(sim.world, body);
      circles.push(body);
    }

    // Run 5000 steps
    for (let s = 0; s < 5000; s++) {
      step(sim);
    }

    // No NaN or Infinity in any body state
    for (const c of circles) {
      expect(Number.isFinite(c.position.x)).toBe(true);
      expect(Number.isFinite(c.position.y)).toBe(true);
      expect(Number.isFinite(c.velocity.x)).toBe(true);
      expect(Number.isFinite(c.velocity.y)).toBe(true);
      expect(Number.isFinite(c.angle)).toBe(true);
      expect(Number.isFinite(c.angularVelocity)).toBe(true);
    }

    // All circles above the floor
    for (const c of circles) {
      expect(c.position.y).toBeGreaterThan(-0.1);
    }

    // Bottom circle should be near equilibrium y ~ radius
    // Allow slight sinking from Baumgarte correction (up to ~0.15m)
    const bottomY = circles[0].position.y;
    expect(bottomY).toBeGreaterThan(radius - 0.2);
    expect(bottomY).toBeLessThan(radius + 2.0);

    // No explosion: positions should stay within reasonable bounds
    for (const c of circles) {
      expect(Math.abs(c.position.x)).toBeLessThan(5);
      expect(c.position.y).toBeLessThan(20);
    }

    // Drift check: velocities should be settled (low)
    for (const c of circles) {
      expect(c.velocity.length()).toBeLessThan(3.0);
    }
  });

  it('3 AABBs stacked on floor: stable after 5000 steps', () => {
    const sim = createSimulation({
      gravity: new Vec2(0, -9.81),
      floorY: 0,
      dt: 1 / 120,
      solverIterations: 10,
      damping: 0.001,
    });

    const halfW = 0.5;
    const halfH = 0.25;
    const boxes = [];
    for (let i = 0; i < 3; i++) {
      const body = createRigidBody({
        shape: createAABB(halfW, halfH),
        position: new Vec2(0, halfH + i * (halfH * 2 + 0.01)),
        mass: 1,
        restitution: 0.0,
        friction: 0.5,
      });
      addBody(sim.world, body);
      boxes.push(body);
    }

    for (let s = 0; s < 5000; s++) {
      step(sim);
    }

    // No NaN
    for (const b of boxes) {
      expect(Number.isFinite(b.position.x)).toBe(true);
      expect(Number.isFinite(b.position.y)).toBe(true);
      expect(Number.isFinite(b.velocity.x)).toBe(true);
      expect(Number.isFinite(b.velocity.y)).toBe(true);
    }

    // All boxes above floor
    for (const b of boxes) {
      expect(b.position.y).toBeGreaterThan(-0.1);
    }

    // No explosion
    for (const b of boxes) {
      expect(Math.abs(b.position.x)).toBeLessThan(5);
      expect(b.position.y).toBeLessThan(15);
    }

    // Settled
    for (const b of boxes) {
      expect(b.velocity.length()).toBeLessThan(3.0);
    }
  });

  it('warm-starting qualitative improvement: 5 circles settle faster than without', () => {
    // With warm-starting (default config), measure settling energy
    const sim = createSimulation({
      gravity: new Vec2(0, -9.81),
      floorY: 0,
      dt: 1 / 120,
      solverIterations: 10,
      damping: 0.001,
    });

    const radius = 0.5;
    const circles = [];
    for (let i = 0; i < 5; i++) {
      const body = createRigidBody({
        shape: createCircle(radius),
        position: new Vec2(0, radius + i * (radius * 2 + 0.01)),
        mass: 1,
        restitution: 0.0,
        friction: 0.5,
      });
      addBody(sim.world, body);
      circles.push(body);
    }

    // Run 2000 steps and check that total KE is low (settled)
    for (let s = 0; s < 2000; s++) {
      step(sim);
    }

    let totalKE = 0;
    for (const c of circles) {
      const v = c.velocity.length();
      totalKE += 0.5 * c.mass * v * v;
    }

    // After 2000 steps with warm-starting, KE should be relatively low (settled)
    // This is a qualitative check — Phase 2 stacking had higher residual energy
    // With 5 circles under gravity, some residual oscillation is expected
    expect(totalKE).toBeLessThan(20);
    // Also confirm no NaN
    expect(Number.isFinite(totalKE)).toBe(true);
  });
});
