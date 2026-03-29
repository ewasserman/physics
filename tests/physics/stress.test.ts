import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createRigidBody, resetBodyIdCounter } from '../../src/core/body.js';
import { addBody } from '../../src/core/world.js';
import { createCircle } from '../../src/core/shape.js';
import { createSimulation, step } from '../../src/sim/simulation.js';

/**
 * Phase 2: Stress Tests
 *
 * Tests system stability under extreme conditions:
 * - Many bodies dropped from heights
 * - Bodies in a confined space
 */

describe('Stress: 50 circles dropped from various heights', () => {
  beforeEach(() => resetBodyIdCounter());

  it('should remain stable for 5000 steps with no NaN or Infinity', () => {
    const sim = createSimulation({
      gravity: new Vec2(0, -9.81),
      floorY: 0,
      dt: 1 / 120,
      broadphaseCellSize: 4,
      solverIterations: 8,
      damping: 0,
    });

    // Create 50 circles at various heights and horizontal positions
    for (let i = 0; i < 50; i++) {
      const x = (i % 10) * 1.5 - 7.5; // spread across x
      const y = 3 + (i / 50) * 20 + Math.random() * 2; // varying heights
      const vx = (Math.random() - 0.5) * 3;
      const vy = -Math.random() * 5;

      const body = createRigidBody({
        shape: createCircle(0.5),
        position: new Vec2(x, y),
        velocity: new Vec2(vx, vy),
        mass: 1,
        restitution: 0.3,
      });
      addBody(sim.world, body);
    }

    let nanDetected = false;
    let infDetected = false;

    for (let i = 0; i < 5000; i++) {
      step(sim);

      // Check every 100 steps for efficiency
      if (i % 100 === 0) {
        for (const body of sim.world.bodies) {
          if (!Number.isFinite(body.position.x) || !Number.isFinite(body.position.y)) {
            nanDetected = true;
          }
          if (!Number.isFinite(body.velocity.x) || !Number.isFinite(body.velocity.y)) {
            infDetected = true;
          }
        }
      }
    }

    expect(nanDetected).toBe(false);
    expect(infDetected).toBe(false);

    // Final check: all bodies should have finite state
    for (const body of sim.world.bodies) {
      expect(Number.isFinite(body.position.x)).toBe(true);
      expect(Number.isFinite(body.position.y)).toBe(true);
      expect(Number.isFinite(body.velocity.x)).toBe(true);
      expect(Number.isFinite(body.velocity.y)).toBe(true);
      expect(Number.isFinite(body.angularVelocity)).toBe(true);
    }
  });

  it('should have all bodies on or above the floor after settling', () => {
    const sim = createSimulation({
      gravity: new Vec2(0, -9.81),
      floorY: 0,
      dt: 1 / 120,
      broadphaseCellSize: 4,
      solverIterations: 8,
      damping: 0,
    });

    for (let i = 0; i < 50; i++) {
      const x = (i % 10) * 1.5 - 7.5;
      const y = 3 + (i / 50) * 20;

      const body = createRigidBody({
        shape: createCircle(0.5),
        position: new Vec2(x, y),
        velocity: Vec2.zero(),
        mass: 1,
        restitution: 0.3,
      });
      addBody(sim.world, body);
    }

    for (let i = 0; i < 5000; i++) {
      step(sim);
    }

    // All circles should be above floor (center >= radius - small tolerance)
    for (const body of sim.world.bodies) {
      expect(body.position.y).toBeGreaterThan(-0.1);
    }
  });
});

describe('Stress: 20 circles in a small box', () => {
  beforeEach(() => resetBodyIdCounter());

  it('should not escape or explode after 2000 steps', () => {
    const sim = createSimulation({
      gravity: new Vec2(0, -9.81),
      floorY: 0,
      dt: 1 / 120,
      broadphaseCellSize: 2,
      solverIterations: 12,
      damping: 0,
    });

    // Pack 20 circles into a small area (5m wide, stacking up)
    // Use a grid layout to avoid extreme initial overlaps
    const cols = 5;
    for (let i = 0; i < 20; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * 1.1 - 2.2; // tight spacing (diameter 1 + 0.1 gap)
      const y = 0.5 + row * 1.1;

      const body = createRigidBody({
        shape: createCircle(0.5),
        position: new Vec2(x, y),
        velocity: new Vec2((Math.random() - 0.5) * 2, 0),
        mass: 1,
        restitution: 0.2,
      });
      addBody(sim.world, body);
    }

    for (let i = 0; i < 2000; i++) {
      step(sim);
    }

    const maxSpeed = 100; // explosion threshold
    const maxPos = 50;    // escape threshold

    for (const body of sim.world.bodies) {
      // No NaN
      expect(Number.isFinite(body.position.x)).toBe(true);
      expect(Number.isFinite(body.position.y)).toBe(true);
      expect(Number.isFinite(body.velocity.x)).toBe(true);
      expect(Number.isFinite(body.velocity.y)).toBe(true);

      // No explosion
      const speed = body.velocity.length();
      expect(speed).toBeLessThan(maxSpeed);

      // No escape to unreasonable positions
      expect(Math.abs(body.position.x)).toBeLessThan(maxPos);
      expect(Math.abs(body.position.y)).toBeLessThan(maxPos);

      // Should still be above floor
      expect(body.position.y).toBeGreaterThan(-0.1);
    }
  });
});
