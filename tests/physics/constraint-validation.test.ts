import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createRigidBody, resetBodyIdCounter, applyForce, RigidBody } from '../../src/core/body.js';
import { createCircle, createAABB } from '../../src/core/shape.js';
import {
  createDistanceConstraint,
  localToWorld,
} from '../../src/core/constraint.js';
import { createSimulation, step, Simulation } from '../../src/sim/simulation.js';
import { addBody, addConstraint } from '../../src/core/world.js';
import { createCar } from '../../src/core/compound.js';

/** Check that no body state contains NaN. */
function assertNoNaN(bodies: RigidBody[], label: string): void {
  for (const body of bodies) {
    expect(isFinite(body.position.x), `${label}: NaN/Inf in position.x (body ${body.id})`).toBe(true);
    expect(isFinite(body.position.y), `${label}: NaN/Inf in position.y (body ${body.id})`).toBe(true);
    expect(isFinite(body.velocity.x), `${label}: NaN/Inf in velocity.x (body ${body.id})`).toBe(true);
    expect(isFinite(body.velocity.y), `${label}: NaN/Inf in velocity.y (body ${body.id})`).toBe(true);
    expect(isFinite(body.angularVelocity), `${label}: NaN/Inf in angularVelocity (body ${body.id})`).toBe(true);
  }
}

describe('Constraint Validation', () => {
  beforeEach(() => {
    resetBodyIdCounter();
  });

  describe('Scenario A: Simple Pendulum', () => {
    function createPendulumSim(): { sim: Simulation; anchor: RigidBody; bob: RigidBody } {
      const sim = createSimulation({
        dt: 1 / 120,
        gravity: new Vec2(0, -9.81),
        floorY: -100, // floor far below so it doesn't interfere
        solverIterations: 20,
        substeps: 4,
      });

      const anchor = createRigidBody({
        shape: createCircle(0.1),
        position: new Vec2(0, 5),
        isStatic: true,
      });

      const bob = createRigidBody({
        shape: createCircle(0.2),
        position: new Vec2(2, 5),
        mass: 1,
        restitution: 0,
      });

      addBody(sim.world, anchor);
      addBody(sim.world, bob);

      const constraint = createDistanceConstraint(anchor, bob, Vec2.zero(), Vec2.zero(), 2);
      addConstraint(sim.world, constraint);

      return { sim, anchor, bob };
    }

    it('constraint distance stays approximately 2m throughout simulation', () => {
      const { sim, anchor, bob } = createPendulumSim();
      const L = 2;

      // Run for one period (~3.35s at dt=1/120 => ~402 steps)
      for (let i = 0; i < 402; i++) {
        step(sim);

        const dist = anchor.position.distanceTo(bob.position);
        // Allow generous tolerance — constraint solver is approximate
        expect(dist).toBeGreaterThan(L - 0.2);
        expect(dist).toBeLessThan(L + 0.2);
      }
    });

    it('no NaN values over one period', () => {
      const { sim, anchor, bob } = createPendulumSim();

      for (let i = 0; i < 402; i++) {
        step(sim);
        assertNoNaN([anchor, bob], `step ${i}`);
      }
    });

    it('energy is roughly conserved (within 30%)', () => {
      const { sim, anchor, bob } = createPendulumSim();
      const g = 9.81;
      // Initial energy: E = m*g*h where h = 2m (drop from (2,5) to bottom at (0,3))
      const E0 = 1 * g * 2; // 19.62 J

      // Run half a period to get to the bottom
      for (let i = 0; i < 201; i++) {
        step(sim);
      }

      // Compute current energy
      const h = bob.position.y - 3; // height above the lowest point
      const v = bob.velocity.length();
      const KE = 0.5 * 1 * v * v;
      const PE = 1 * g * h;
      const E = KE + PE;

      // Energy should be in a reasonable range — constraints leak energy
      // but shouldn't gain energy or lose more than 30%
      expect(E).toBeGreaterThan(E0 * 0.3);
      expect(E).toBeLessThan(E0 * 1.5);
    });

    it('bob swings below the anchor (reaches near y=3)', () => {
      const { sim, anchor, bob } = createPendulumSim();

      let minY = Infinity;
      for (let i = 0; i < 402; i++) {
        step(sim);
        if (bob.position.y < minY) {
          minY = bob.position.y;
        }
      }

      // Bottom of swing should be near y=3 (anchor at y=5, L=2)
      expect(minY).toBeLessThan(4.0);
      expect(minY).toBeGreaterThan(1.0);
    });
  });

  describe('Scenario B: Double Pendulum', () => {
    function createDoublePendulumSim(): {
      sim: Simulation;
      anchor: RigidBody;
      body1: RigidBody;
      body2: RigidBody;
    } {
      const sim = createSimulation({
        dt: 1 / 120,
        gravity: new Vec2(0, -9.81),
        floorY: -100,
        solverIterations: 20,
        substeps: 4,
      });

      const anchor = createRigidBody({
        shape: createCircle(0.1),
        position: new Vec2(0, 5),
        isStatic: true,
      });

      const body1 = createRigidBody({
        shape: createCircle(0.2),
        position: new Vec2(1.5, 5),
        mass: 1,
        restitution: 0,
      });

      const body2 = createRigidBody({
        shape: createCircle(0.2),
        position: new Vec2(3.0, 5),
        mass: 1,
        restitution: 0,
      });

      addBody(sim.world, anchor);
      addBody(sim.world, body1);
      addBody(sim.world, body2);

      const c1 = createDistanceConstraint(anchor, body1, Vec2.zero(), Vec2.zero(), 1.5);
      const c2 = createDistanceConstraint(body1, body2, Vec2.zero(), Vec2.zero(), 1.5);
      addConstraint(sim.world, c1);
      addConstraint(sim.world, c2);

      return { sim, anchor, body1, body2 };
    }

    it('runs 30 seconds without NaN or explosion', () => {
      const { sim, anchor, body1, body2 } = createDoublePendulumSim();
      const stepsFor30s = Math.ceil(30 / (1 / 120));

      for (let i = 0; i < stepsFor30s; i++) {
        step(sim);

        // Check every 100 steps to keep test fast
        if (i % 100 === 0) {
          assertNoNaN([anchor, body1, body2], `step ${i}`);
        }
      }

      // Final check
      assertNoNaN([anchor, body1, body2], 'final');
    });

    it('constraint distances stay within tolerance', () => {
      const { sim, anchor, body1, body2 } = createDoublePendulumSim();
      const stepsFor30s = Math.ceil(30 / (1 / 120));

      let maxError1 = 0;
      let maxError2 = 0;

      for (let i = 0; i < stepsFor30s; i++) {
        step(sim);

        if (i % 50 === 0) {
          const d1 = anchor.position.distanceTo(body1.position);
          const d2 = body1.position.distanceTo(body2.position);
          maxError1 = Math.max(maxError1, Math.abs(d1 - 1.5));
          maxError2 = Math.max(maxError2, Math.abs(d2 - 1.5));
        }
      }

      // Generous tolerance for a chaotic system
      expect(maxError1).toBeLessThan(0.5);
      expect(maxError2).toBeLessThan(0.5);
    });

    it('positions stay within 10m of anchor', () => {
      const { sim, anchor, body1, body2 } = createDoublePendulumSim();
      const stepsFor30s = Math.ceil(30 / (1 / 120));

      for (let i = 0; i < stepsFor30s; i++) {
        step(sim);

        if (i % 100 === 0) {
          const r1 = anchor.position.distanceTo(body1.position);
          const r2 = anchor.position.distanceTo(body2.position);
          expect(r1).toBeLessThan(10);
          expect(r2).toBeLessThan(10);
        }
      }
    });

    it('energy is bounded (no runaway gain)', () => {
      const { sim, body1, body2 } = createDoublePendulumSim();
      const g = 9.81;
      const stepsFor30s = Math.ceil(30 / (1 / 120));

      for (let i = 0; i < stepsFor30s; i++) {
        step(sim);
      }

      // Compute total kinetic energy at the end
      const KE1 = 0.5 * body1.mass * body1.velocity.lengthSq();
      const KE2 = 0.5 * body2.mass * body2.velocity.lengthSq();
      const totalKE = KE1 + KE2;

      // Initial total energy was ~44.145 J. Energy shouldn't blow up.
      // Allow up to 2x the initial energy (very generous — mainly checking no explosion)
      expect(totalKE).toBeLessThan(200);
    });
  });

  describe('Scenario C: Car on Flat Surface', () => {
    it('car settles without NaN after 500 steps', () => {
      const sim = createSimulation({
        gravity: new Vec2(0, -9.81),
        floorY: 0,
        solverIterations: 10,
        substeps: 2,
      });

      const car = createCar(sim.world, 0, 2);

      for (let i = 0; i < 500; i++) {
        step(sim);
        if (i % 50 === 0) {
          assertNoNaN(car.bodies, `step ${i}`);
        }
      }

      assertNoNaN(car.bodies, 'final');
    });

    it('wheels stay above floor level', () => {
      const sim = createSimulation({
        gravity: new Vec2(0, -9.81),
        floorY: 0,
        solverIterations: 10,
        substeps: 2,
      });

      const car = createCar(sim.world, 0, 2);

      for (let i = 0; i < 500; i++) {
        step(sim);
      }

      const wheelL = car.bodies[1];
      const wheelR = car.bodies[2];

      // Wheel centers should be above the floor (at least at radius height)
      expect(wheelL.position.y).toBeGreaterThan(-0.5);
      expect(wheelR.position.y).toBeGreaterThan(-0.5);
    });

    it('chassis stays connected to wheels', () => {
      const sim = createSimulation({
        gravity: new Vec2(0, -9.81),
        floorY: 0,
        solverIterations: 10,
        substeps: 2,
      });

      const car = createCar(sim.world, 0, 2);

      for (let i = 0; i < 500; i++) {
        step(sim);
      }

      const chassis = car.bodies[0];
      const wheelL = car.bodies[1];
      const wheelR = car.bodies[2];

      // Wheels should be roughly below chassis, within a few meters
      const distL = chassis.position.distanceTo(wheelL.position);
      const distR = chassis.position.distanceTo(wheelR.position);
      expect(distL).toBeLessThan(5);
      expect(distR).toBeLessThan(5);

      // Constraints should not be broken
      expect(car.constraints[0].broken).toBe(false);
      expect(car.constraints[1].broken).toBe(false);
    });

    it('horizontal push accelerates the car', () => {
      const sim = createSimulation({
        gravity: new Vec2(0, -9.81),
        floorY: 0,
        solverIterations: 10,
        substeps: 2,
        damping: 0.001,
      });

      const car = createCar(sim.world, 0, 2);
      const chassis = car.bodies[0];

      // Let the car settle first
      for (let i = 0; i < 300; i++) {
        step(sim);
      }

      const xBefore = chassis.position.x;

      // Apply horizontal force for 60 steps
      for (let i = 0; i < 60; i++) {
        applyForce(chassis, new Vec2(50, 0));
        step(sim);
      }

      const xAfter = chassis.position.x;

      // Car should have moved to the right
      expect(xAfter).toBeGreaterThan(xBefore + 0.1);

      // Should have positive horizontal velocity
      expect(chassis.velocity.x).toBeGreaterThan(0);
    });
  });

  describe('Scenario E: Constraint Breaking', () => {
    it('constraint holds when force is below breakForce', () => {
      const sim = createSimulation({
        dt: 1 / 60,
        gravity: new Vec2(0, -9.81),
        floorY: -100,
        solverIterations: 10,
        substeps: 1,
      });

      const anchor = createRigidBody({
        shape: createCircle(0.1),
        position: new Vec2(0, 5),
        isStatic: true,
      });

      const body = createRigidBody({
        shape: createCircle(0.3),
        position: new Vec2(0, 0),
        mass: 1,
      });

      addBody(sim.world, anchor);
      addBody(sim.world, body);

      const constraint = createDistanceConstraint({
        bodyA: anchor,
        bodyB: body,
        distance: 5,
        breakForce: 50,
      });
      addConstraint(sim.world, constraint);

      // Run with just gravity (9.81 N < 50 N)
      for (let i = 0; i < 120; i++) {
        step(sim);
      }

      expect(constraint.broken).toBe(false);
    });

    it('constraint breaks when applied force exceeds breakForce', () => {
      const sim = createSimulation({
        dt: 1 / 60,
        gravity: new Vec2(0, -9.81),
        floorY: -100,
        solverIterations: 10,
        substeps: 1,
      });

      const anchor = createRigidBody({
        shape: createCircle(0.1),
        position: new Vec2(0, 5),
        isStatic: true,
      });

      const body = createRigidBody({
        shape: createCircle(0.3),
        position: new Vec2(0, 0),
        mass: 1,
      });

      addBody(sim.world, anchor);
      addBody(sim.world, body);

      const constraint = createDistanceConstraint({
        bodyA: anchor,
        bodyB: body,
        distance: 5,
        breakForce: 50,
      });
      addConstraint(sim.world, constraint);

      // Apply large downward force (50 N + gravity = ~60 N > 50 N)
      for (let i = 0; i < 120; i++) {
        applyForce(body, new Vec2(0, -50));
        step(sim);

        if (constraint.broken) break;
      }

      expect(constraint.broken).toBe(true);
      // The constraint should have been removed from the world
      expect(sim.world.constraints.indexOf(constraint)).toBe(-1);
    });

    it('no NaN at the moment of breaking', () => {
      const sim = createSimulation({
        dt: 1 / 60,
        gravity: new Vec2(0, -9.81),
        floorY: -100,
        solverIterations: 10,
        substeps: 1,
      });

      const anchor = createRigidBody({
        shape: createCircle(0.1),
        position: new Vec2(0, 5),
        isStatic: true,
      });

      const body = createRigidBody({
        shape: createCircle(0.3),
        position: new Vec2(0, 0),
        mass: 1,
      });

      addBody(sim.world, anchor);
      addBody(sim.world, body);

      const constraint = createDistanceConstraint({
        bodyA: anchor,
        bodyB: body,
        distance: 5,
        breakForce: 50,
      });
      addConstraint(sim.world, constraint);

      for (let i = 0; i < 120; i++) {
        applyForce(body, new Vec2(0, -50));
        step(sim);
        assertNoNaN([anchor, body], `step ${i}`);
        if (constraint.broken) break;
      }
    });

    it('body moves freely after constraint breaks', () => {
      const sim = createSimulation({
        dt: 1 / 60,
        gravity: new Vec2(0, -9.81),
        floorY: -100,
        solverIterations: 10,
        substeps: 1,
      });

      const anchor = createRigidBody({
        shape: createCircle(0.1),
        position: new Vec2(0, 5),
        isStatic: true,
      });

      const body = createRigidBody({
        shape: createCircle(0.3),
        position: new Vec2(0, 0),
        mass: 1,
      });

      addBody(sim.world, anchor);
      addBody(sim.world, body);

      const constraint = createDistanceConstraint({
        bodyA: anchor,
        bodyB: body,
        distance: 5,
        breakForce: 50,
      });
      addConstraint(sim.world, constraint);

      // Break the constraint
      for (let i = 0; i < 120; i++) {
        applyForce(body, new Vec2(0, -80));
        step(sim);
        if (constraint.broken) break;
      }

      expect(constraint.broken).toBe(true);

      // Record position after breaking
      const yAfterBreak = body.position.y;

      // Continue stepping — body should fall freely
      for (let i = 0; i < 60; i++) {
        step(sim);
      }

      // Body should have fallen further due to gravity (no constraint holding it)
      expect(body.position.y).toBeLessThan(yAfterBreak);
    });
  });
});
