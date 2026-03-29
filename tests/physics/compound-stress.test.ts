import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createRigidBody, resetBodyIdCounter, RigidBody } from '../../src/core/body.js';
import { createCircle } from '../../src/core/shape.js';
import { createSimulation, step } from '../../src/sim/simulation.js';
import { addBody } from '../../src/core/world.js';
import { createCar, createCart } from '../../src/core/compound.js';

/** Check that no body state contains NaN or Inf. */
function assertNoNaN(bodies: RigidBody[], label: string): void {
  for (const body of bodies) {
    expect(isFinite(body.position.x), `${label}: NaN/Inf in position.x (body ${body.id})`).toBe(true);
    expect(isFinite(body.position.y), `${label}: NaN/Inf in position.y (body ${body.id})`).toBe(true);
    expect(isFinite(body.velocity.x), `${label}: NaN/Inf in velocity.x (body ${body.id})`).toBe(true);
    expect(isFinite(body.velocity.y), `${label}: NaN/Inf in velocity.y (body ${body.id})`).toBe(true);
  }
}

/** Check no body has exploded to extreme positions. */
function assertNoBlow(bodies: RigidBody[], maxPos: number, label: string): void {
  for (const body of bodies) {
    expect(
      Math.abs(body.position.x) < maxPos && Math.abs(body.position.y) < maxPos,
      `${label}: body ${body.id} at (${body.position.x.toFixed(1)}, ${body.position.y.toFixed(1)}) exceeds limit ${maxPos}`,
    ).toBe(true);
  }
}

describe('Compound Object Stress Tests', () => {
  beforeEach(() => {
    resetBodyIdCounter();
  });

  describe('Multiple cars', () => {
    it('3 cars dropped in a scene — 1000 steps, no NaN, no explosion', () => {
      const sim = createSimulation({
        gravity: new Vec2(0, -9.81),
        floorY: 0,
        solverIterations: 10,
        substeps: 2,
        damping: 0.005,
      });

      const car1 = createCar(sim.world, -5, 3);
      const car2 = createCar(sim.world, 0, 5);
      const car3 = createCar(sim.world, 5, 4);

      const allBodies = [...car1.bodies, ...car2.bodies, ...car3.bodies];

      for (let i = 0; i < 1000; i++) {
        step(sim);

        if (i % 100 === 0) {
          assertNoNaN(allBodies, `step ${i}`);
          assertNoBlow(allBodies, 200, `step ${i}`);
        }
      }

      // Final assertions
      assertNoNaN(allBodies, 'final');
      assertNoBlow(allBodies, 200, 'final');

      // All constraints should still be intact
      for (const car of [car1, car2, car3]) {
        for (const c of car.constraints) {
          expect(c.broken).toBe(false);
        }
      }
    });

    it('3 cars — all settle above the floor', () => {
      const sim = createSimulation({
        gravity: new Vec2(0, -9.81),
        floorY: 0,
        solverIterations: 10,
        substeps: 2,
        damping: 0.005,
      });

      const car1 = createCar(sim.world, -5, 3);
      const car2 = createCar(sim.world, 0, 5);
      const car3 = createCar(sim.world, 5, 4);

      for (let i = 0; i < 1000; i++) {
        step(sim);
      }

      // All car chassis should be above the floor
      for (const car of [car1, car2, car3]) {
        const chassis = car.bodies[0];
        expect(chassis.position.y).toBeGreaterThan(-2);
      }
    });
  });

  describe('Mixed scene: car + loose circles', () => {
    it('car with loose circles — 500 steps, stable', () => {
      const sim = createSimulation({
        gravity: new Vec2(0, -9.81),
        floorY: 0,
        solverIterations: 10,
        substeps: 2,
        damping: 0.005,
      });

      const car = createCar(sim.world, 0, 3);

      // Add some loose circles that will fall and possibly hit the car
      const circles: RigidBody[] = [];
      for (let i = 0; i < 5; i++) {
        const ball = createRigidBody({
          shape: createCircle(0.3),
          position: new Vec2(-2 + i, 6 + i * 0.5),
          mass: 0.5,
          restitution: 0.3,
          friction: 0.5,
        });
        addBody(sim.world, ball);
        circles.push(ball);
      }

      const allBodies = [...car.bodies, ...circles];

      for (let i = 0; i < 500; i++) {
        step(sim);

        if (i % 100 === 0) {
          assertNoNaN(allBodies, `step ${i}`);
        }
      }

      assertNoNaN(allBodies, 'final');
      assertNoBlow(allBodies, 200, 'final');

      // Car constraints should hold
      expect(car.constraints[0].broken).toBe(false);
      expect(car.constraints[1].broken).toBe(false);
    });
  });

  describe('Cart stress', () => {
    it('cart dropped and pushed — no NaN', () => {
      const sim = createSimulation({
        gravity: new Vec2(0, -9.81),
        floorY: 0,
        solverIterations: 10,
        substeps: 2,
      });

      const cart = createCart(sim.world, 0, 3);
      const chassis = cart.bodies[0];

      // Let settle
      for (let i = 0; i < 200; i++) {
        step(sim);
      }

      assertNoNaN(cart.bodies, 'after settle');

      // Push cart
      for (let i = 0; i < 60; i++) {
        chassis.force = chassis.force.add(new Vec2(30, 0));
        step(sim);
      }

      assertNoNaN(cart.bodies, 'after push');

      // Let coast
      for (let i = 0; i < 200; i++) {
        step(sim);
      }

      assertNoNaN(cart.bodies, 'after coast');
      assertNoBlow(cart.bodies, 200, 'after coast');
    });
  });

  describe('Long simulation', () => {
    it('single car survives 2000 steps', () => {
      const sim = createSimulation({
        gravity: new Vec2(0, -9.81),
        floorY: 0,
        solverIterations: 10,
        substeps: 2,
        damping: 0.005,
      });

      const car = createCar(sim.world, 0, 2);

      for (let i = 0; i < 2000; i++) {
        step(sim);
      }

      assertNoNaN(car.bodies, 'final');
      assertNoBlow(car.bodies, 200, 'final');

      expect(car.constraints[0].broken).toBe(false);
      expect(car.constraints[1].broken).toBe(false);
    });
  });
});
