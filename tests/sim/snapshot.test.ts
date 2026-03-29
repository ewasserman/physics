import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createSimulation, step } from '../../src/sim/simulation.js';
import { captureSnapshot, WorldSnapshot } from '../../src/sim/snapshot.js';
import { createRigidBody, resetBodyIdCounter } from '../../src/core/body.js';
import { createCircle, createAABB, ShapeType } from '../../src/core/shape.js';
import { addBody, addConstraint } from '../../src/core/world.js';
import { createDistanceConstraint } from '../../src/core/constraint.js';

describe('Snapshot System', () => {
  beforeEach(() => {
    resetBodyIdCounter();
  });

  it('captures a snapshot with correct body fields', () => {
    const sim = createSimulation({ floorY: -Infinity });
    const body = createRigidBody({
      shape: createCircle(1),
      position: new Vec2(3, 5),
      mass: 2,
    });
    addBody(sim.world, body);

    const snapshot = captureSnapshot(sim);

    expect(snapshot.time).toBe(0);
    expect(snapshot.step).toBe(0);
    expect(snapshot.bodies).toHaveLength(1);

    const bs = snapshot.bodies[0];
    expect(bs.id).toBe(body.id);
    expect(bs.shapeType).toBe('circle');
    expect(bs.position).toEqual({ x: 3, y: 5 });
    expect(bs.velocity).toEqual({ x: 0, y: 0 });
    expect(bs.angle).toBe(0);
    expect(bs.angularVelocity).toBe(0);
    expect(bs.mass).toBe(2);
    expect(bs.isStatic).toBe(false);
    expect(bs.radius).toBe(1);
  });

  it('captures AABB shape-specific fields', () => {
    const sim = createSimulation({ floorY: -Infinity });
    const body = createRigidBody({
      shape: createAABB(2, 3),
      position: new Vec2(0, 0),
      mass: 1,
    });
    addBody(sim.world, body);

    const snapshot = captureSnapshot(sim);
    const bs = snapshot.bodies[0];
    expect(bs.shapeType).toBe('aabb');
    expect(bs.halfWidth).toBe(2);
    expect(bs.halfHeight).toBe(3);
  });

  it('captures static bodies with mass=0', () => {
    const sim = createSimulation({ floorY: -Infinity });
    const body = createRigidBody({
      shape: createAABB(5, 0.5),
      position: new Vec2(0, 0),
      isStatic: true,
    });
    addBody(sim.world, body);

    const snapshot = captureSnapshot(sim);
    const bs = snapshot.bodies[0];
    expect(bs.isStatic).toBe(true);
    expect(bs.mass).toBe(0); // Infinity serialized as 0
  });

  it('captures constraints', () => {
    const sim = createSimulation({ floorY: -Infinity });
    const a = createRigidBody({ shape: createCircle(1), position: new Vec2(0, 0), mass: 1 });
    const b = createRigidBody({ shape: createCircle(1), position: new Vec2(3, 0), mass: 1 });
    addBody(sim.world, a);
    addBody(sim.world, b);

    const constraint = createDistanceConstraint(a, b);
    addConstraint(sim.world, constraint);

    const snapshot = captureSnapshot(sim);
    expect(snapshot.constraints).toHaveLength(1);
    expect(snapshot.constraints[0].type).toBe('distance');
    expect(snapshot.constraints[0].bodyAId).toBe(a.id);
    expect(snapshot.constraints[0].bodyBId).toBe(b.id);
    expect(snapshot.constraints[0].broken).toBe(false);
  });

  it('captures contacts after stepping', () => {
    const sim = createSimulation({ floorY: 0 });
    const body = createRigidBody({
      shape: createCircle(1),
      position: new Vec2(0, 0.5), // touching the floor
      mass: 1,
    });
    addBody(sim.world, body);

    step(sim); // step to generate contacts

    const snapshot = captureSnapshot(sim);
    // After stepping, there should be contacts from floor collision
    expect(snapshot.contacts).toBeDefined();
    expect(Array.isArray(snapshot.contacts)).toBe(true);
  });

  it('produces JSON-serializable output', () => {
    const sim = createSimulation({ floorY: -Infinity });
    const body = createRigidBody({
      shape: createCircle(1),
      position: new Vec2(1, 2),
      mass: 1,
    });
    addBody(sim.world, body);

    const snapshot = captureSnapshot(sim);
    const json = JSON.stringify(snapshot);
    const parsed = JSON.parse(json);

    expect(parsed.time).toBe(0);
    expect(parsed.bodies).toHaveLength(1);
    expect(parsed.bodies[0].position.x).toBe(1);
    expect(parsed.bodies[0].position.y).toBe(2);
  });

  it('snapshot does not contain Vec2 instances (plain objects only)', () => {
    const sim = createSimulation({ floorY: -Infinity });
    const body = createRigidBody({
      shape: createCircle(1),
      position: new Vec2(1, 2),
      mass: 1,
    });
    addBody(sim.world, body);

    const snapshot = captureSnapshot(sim);
    const bs = snapshot.bodies[0];

    // Position should be a plain object, not a Vec2 instance
    expect(bs.position).not.toBeInstanceOf(Vec2);
    expect(bs.velocity).not.toBeInstanceOf(Vec2);
  });

  it('updates step and time after simulation steps', () => {
    const sim = createSimulation({ floorY: -Infinity });
    const body = createRigidBody({
      shape: createCircle(1),
      position: new Vec2(0, 10),
      mass: 1,
    });
    addBody(sim.world, body);

    step(sim);
    step(sim);

    const snapshot = captureSnapshot(sim);
    expect(snapshot.step).toBe(2);
    expect(snapshot.time).toBeGreaterThan(0);
  });
});
