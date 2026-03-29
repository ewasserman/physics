import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createSimulation, step } from '../../src/sim/simulation.js';
import { createRigidBody, resetBodyIdCounter } from '../../src/core/body.js';
import { createCircle } from '../../src/core/shape.js';
import { addBody } from '../../src/core/world.js';
import { createBoundary, createFloor, createWall } from '../../src/core/environment.js';

describe('Environment Integration', () => {
  beforeEach(() => {
    resetBodyIdCounter();
  });

  it('boundary box contains 5 circles after 500 steps', () => {
    const left = -5;
    const right = 5;
    const bottom = 0;
    const top = 10;

    const sim = createSimulation({
      gravity: new Vec2(0, -9.81),
      floorY: -Infinity, // use environment walls instead
    });

    createBoundary(sim.world, left, right, bottom, top);

    // Drop 5 circles at various positions inside the boundary
    const circlePositions = [
      new Vec2(-2, 8),
      new Vec2(0, 7),
      new Vec2(2, 9),
      new Vec2(-3, 6),
      new Vec2(1, 8.5),
    ];

    const circles = circlePositions.map((pos) => {
      const body = createRigidBody({
        shape: createCircle(0.3),
        position: pos,
        mass: 1,
        restitution: 0.3,
      });
      addBody(sim.world, body);
      return body;
    });

    // Run 500 steps
    for (let i = 0; i < 500; i++) {
      step(sim);
    }

    // All circles must remain inside the boundary (with some tolerance for radius + wall thickness)
    const tolerance = 1.5; // wall thickness + radius margin
    for (const circle of circles) {
      expect(circle.position.x).toBeGreaterThan(left - tolerance);
      expect(circle.position.x).toBeLessThan(right + tolerance);
      expect(circle.position.y).toBeGreaterThan(bottom - tolerance);
      expect(circle.position.y).toBeLessThan(top + tolerance);
    }
  });

  it('object bounces off a wall (reverses horizontal direction)', () => {
    const sim = createSimulation({
      gravity: new Vec2(0, 0), // no gravity for cleaner test
      floorY: -Infinity,
    });

    // Create a wall at x=5
    createWall(sim.world, 5, 0, 10);

    // Create a circle moving rightward toward the wall
    const ball = createRigidBody({
      shape: createCircle(0.5),
      position: new Vec2(3, 0),
      velocity: new Vec2(5, 0),
      mass: 1,
      restitution: 0.8,
    });
    addBody(sim.world, ball);

    // Run enough steps for the ball to reach and bounce off the wall
    for (let i = 0; i < 120; i++) {
      step(sim);
    }

    // After bouncing off the wall at x=5, the ball should be moving leftward
    expect(ball.velocity.x).toBeLessThan(0);
  });

  it('ball bounces in a floor + wall corner', () => {
    const sim = createSimulation({
      gravity: new Vec2(0, -9.81),
      floorY: -Infinity,
    });

    // Floor at y=0, wall at x=5
    createFloor(sim.world, 0, 20);
    createWall(sim.world, 5, 5, 10);

    // Ball falling diagonally toward the corner
    const ball = createRigidBody({
      shape: createCircle(0.5),
      position: new Vec2(3, 5),
      velocity: new Vec2(3, 0),
      mass: 1,
      restitution: 0.5,
    });
    addBody(sim.world, ball);

    // Run simulation
    for (let i = 0; i < 300; i++) {
      step(sim);
    }

    // Ball should be near the floor and not have escaped through the wall
    // It should be at or above the floor level
    expect(ball.position.y).toBeGreaterThan(-1);
    // It should be at or to the left of the wall
    expect(ball.position.x).toBeLessThan(5.5);
  });
});
