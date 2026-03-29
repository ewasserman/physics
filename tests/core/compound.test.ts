import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { resetBodyIdCounter } from '../../src/core/body.js';
import { createWorld } from '../../src/core/world.js';
import { ConstraintType } from '../../src/core/constraint.js';
import { ShapeType } from '../../src/core/shape.js';
import { createCar, createCart, createCompoundObject } from '../../src/core/compound.js';
import { createSimulation, step } from '../../src/sim/simulation.js';
import { createRigidBody } from '../../src/core/body.js';
import { createCircle, createAABB } from '../../src/core/shape.js';
import { createDistanceConstraint } from '../../src/core/constraint.js';

describe('Compound objects', () => {
  beforeEach(() => {
    resetBodyIdCounter();
  });

  describe('createCompoundObject', () => {
    it('adds bodies and constraints to world', () => {
      const world = createWorld();
      const bodyA = createRigidBody({ shape: createCircle(1), mass: 1 });
      const bodyB = createRigidBody({ shape: createCircle(1), mass: 1, position: new Vec2(3, 0) });
      const constraint = createDistanceConstraint(bodyA, bodyB);

      const compound = createCompoundObject(world, [bodyA, bodyB], [constraint]);

      expect(world.bodies.length).toBe(2);
      expect(world.constraints.length).toBe(1);
      expect(compound.bodies.length).toBe(2);
      expect(compound.constraints.length).toBe(1);
    });
  });

  describe('createCar', () => {
    it('creates chassis and two wheels', () => {
      const world = createWorld();
      const car = createCar(world, 5, 3);

      expect(car.bodies.length).toBe(3);
      expect(car.constraints.length).toBe(2);

      // Chassis is first body (AABB)
      const chassis = car.bodies[0];
      expect(chassis.shape.type).toBe(ShapeType.AABB);
      expect(chassis.mass).toBe(5);

      // Wheels are circles
      const wheelL = car.bodies[1];
      const wheelR = car.bodies[2];
      expect(wheelL.shape.type).toBe(ShapeType.Circle);
      expect(wheelR.shape.type).toBe(ShapeType.Circle);
      expect(wheelL.mass).toBe(1);
      expect(wheelR.mass).toBe(1);

      // Constraints are revolute
      expect(car.constraints[0].type).toBe(ConstraintType.Revolute);
      expect(car.constraints[1].type).toBe(ConstraintType.Revolute);
    });

    it('places wheels below chassis', () => {
      const world = createWorld();
      const car = createCar(world, 0, 5);

      const chassis = car.bodies[0];
      const wheelL = car.bodies[1];
      const wheelR = car.bodies[2];

      expect(wheelL.position.y).toBeLessThan(chassis.position.y);
      expect(wheelR.position.y).toBeLessThan(chassis.position.y);
      expect(wheelL.position.x).toBeLessThan(chassis.position.x);
      expect(wheelR.position.x).toBeGreaterThan(chassis.position.x);
    });

    it('registers all bodies and constraints in the world', () => {
      const world = createWorld();
      createCar(world, 0, 5);

      expect(world.bodies.length).toBe(3);
      expect(world.constraints.length).toBe(2);
    });

    it('accepts custom options', () => {
      const world = createWorld();
      const car = createCar(world, 0, 0, {
        chassisMass: 10,
        wheelRadius: 0.6,
        wheelMass: 2,
      });

      expect(car.bodies[0].mass).toBe(10);
      expect(car.bodies[1].mass).toBe(2);
      if (car.bodies[1].shape.type === ShapeType.Circle) {
        expect(car.bodies[1].shape.radius).toBe(0.6);
      }
    });
  });

  describe('createCart', () => {
    it('creates a simpler compound object with 3 bodies and 2 constraints', () => {
      const world = createWorld();
      const cart = createCart(world, 0, 3);

      expect(cart.bodies.length).toBe(3);
      expect(cart.constraints.length).toBe(2);
    });
  });

  describe('Car simulation', () => {
    it('car dropped on floor settles without exploding', () => {
      const sim = createSimulation({
        gravity: new Vec2(0, -9.81),
        floorY: 0,
        solverIterations: 10,
        substeps: 2,
      });

      const car = createCar(sim.world, 0, 3);

      // Run 200 steps
      for (let i = 0; i < 200; i++) {
        step(sim);
      }

      // Car should have settled near the floor
      const chassis = car.bodies[0];
      const wheelL = car.bodies[1];
      const wheelR = car.bodies[2];

      // All bodies should be above floor
      expect(chassis.position.y).toBeGreaterThan(-1);
      expect(wheelL.position.y).toBeGreaterThan(-1);
      expect(wheelR.position.y).toBeGreaterThan(-1);

      // Bodies should not have exploded to huge positions
      expect(Math.abs(chassis.position.x)).toBeLessThan(50);
      expect(Math.abs(chassis.position.y)).toBeLessThan(50);
    });

    it('car is stable over 500 steps', () => {
      const sim = createSimulation({
        gravity: new Vec2(0, -9.81),
        floorY: 0,
        solverIterations: 10,
        substeps: 2,
        damping: 0.01,
      });

      const car = createCar(sim.world, 0, 3);

      // Run 500 steps
      for (let i = 0; i < 500; i++) {
        step(sim);
      }

      const chassis = car.bodies[0];
      const wheelL = car.bodies[1];
      const wheelR = car.bodies[2];

      // All bodies should still be finite and near the ground
      expect(isFinite(chassis.position.x)).toBe(true);
      expect(isFinite(chassis.position.y)).toBe(true);
      expect(isFinite(wheelL.position.x)).toBe(true);
      expect(isFinite(wheelR.position.y)).toBe(true);

      // Should have settled (low velocity)
      expect(Math.abs(chassis.velocity.y)).toBeLessThan(5);

      // Constraints should still be intact (not broken)
      expect(car.constraints[0].broken).toBe(false);
      expect(car.constraints[1].broken).toBe(false);
    });

    it('wheels stay connected to chassis', () => {
      const sim = createSimulation({
        gravity: new Vec2(0, -9.81),
        floorY: 0,
        solverIterations: 10,
        substeps: 2,
      });

      const car = createCar(sim.world, 0, 5);

      for (let i = 0; i < 300; i++) {
        step(sim);
      }

      // Check that wheels are still reasonably close to expected chassis attachment points
      const chassis = car.bodies[0];
      const wheelL = car.bodies[1];
      const wheelR = car.bodies[2];

      const distL = chassis.position.distanceTo(wheelL.position);
      const distR = chassis.position.distanceTo(wheelR.position);

      // Wheels shouldn't be more than a few body-lengths away from chassis
      expect(distL).toBeLessThan(5);
      expect(distR).toBeLessThan(5);
    });
  });
});
