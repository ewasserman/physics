import { describe, it, expect, beforeEach } from 'vitest';
import { createRigidBody, applyForce, resetBodyIdCounter } from '../../src/core/body.js';
import {
  createCircle,
  createAABB,
  createPolygon,
  ShapeType,
  computeShapeArea,
  computeShapeInertia,
} from '../../src/core/shape.js';
import { Vec2 } from '../../src/math/vec2.js';
import { almostEqual } from '../../src/math/utils.js';

function expectClose(actual: number, expected: number, eps = 1e-9) {
  expect(Math.abs(actual - expected)).toBeLessThan(eps);
}

describe('createRigidBody', () => {
  beforeEach(() => {
    resetBodyIdCounter();
  });

  it('creates a dynamic body with sensible defaults', () => {
    const body = createRigidBody({ shape: createCircle(1) });
    expect(body.position.x).toBe(0);
    expect(body.position.y).toBe(0);
    expect(body.angle).toBe(0);
    expect(body.velocity.x).toBe(0);
    expect(body.velocity.y).toBe(0);
    expect(body.mass).toBe(1);
    expect(body.inverseMass).toBe(1);
    expect(body.isStatic).toBe(false);
    expect(body.restitution).toBe(0.5);
    expect(body.friction).toBe(0.3);
  });

  it('static body has inverseMass = 0 and inverseInertia = 0', () => {
    const body = createRigidBody({
      shape: createCircle(1),
      isStatic: true,
    });
    expect(body.mass).toBe(Infinity);
    expect(body.inverseMass).toBe(0);
    expect(body.inertia).toBe(Infinity);
    expect(body.inverseInertia).toBe(0);
    expect(body.isStatic).toBe(true);
  });

  it('respects custom options', () => {
    const body = createRigidBody({
      shape: createAABB(2, 3),
      position: new Vec2(10, 20),
      mass: 5,
      restitution: 0.8,
      friction: 0.1,
    });
    expect(body.position.x).toBe(10);
    expect(body.position.y).toBe(20);
    expect(body.mass).toBe(5);
    expect(body.restitution).toBe(0.8);
    expect(body.friction).toBe(0.1);
    expect(body.shape.type).toBe(ShapeType.AABB);
  });

  it('assigns unique IDs', () => {
    const a = createRigidBody({ shape: createCircle(1) });
    const b = createRigidBody({ shape: createCircle(1) });
    expect(a.id).not.toBe(b.id);
  });

  it('assigns sequential IDs starting from 0', () => {
    const a = createRigidBody({ shape: createCircle(1) });
    const b = createRigidBody({ shape: createCircle(1) });
    const c = createRigidBody({ shape: createCircle(1) });
    expect(a.id).toBe(0);
    expect(b.id).toBe(1);
    expect(c.id).toBe(2);
  });

  it('computes inertia automatically for circle', () => {
    const body = createRigidBody({
      shape: createCircle(2),
      mass: 4,
    });
    // Circle inertia = 0.5 * m * r^2 = 0.5 * 4 * 4 = 8
    expectClose(body.inertia, 8);
    expectClose(body.inverseInertia, 1 / 8);
  });

  it('computes inertia automatically for AABB', () => {
    const body = createRigidBody({
      shape: createAABB(2, 3),
      mass: 6,
    });
    // AABB inertia = (1/12) * m * (w^2 + h^2) = (6/12) * (16 + 36) = 0.5 * 52 = 26
    expectClose(body.inertia, 26);
  });

  it('computes inertia automatically for polygon', () => {
    // Unit square: vertices at (+-0.5, +-0.5)
    const square = createPolygon([
      new Vec2(-0.5, -0.5),
      new Vec2(0.5, -0.5),
      new Vec2(0.5, 0.5),
      new Vec2(-0.5, 0.5),
    ]);
    const body = createRigidBody({ shape: square, mass: 1 });
    // For a unit square, I = (1/12)*m*(w^2 + h^2) = (1/12)*(1+1) = 1/6
    expectClose(body.inertia, 1 / 6, 1e-6);
  });

  it('respects custom velocity and angular velocity', () => {
    const body = createRigidBody({
      shape: createCircle(1),
      velocity: new Vec2(5, -3),
      angularVelocity: 2.5,
    });
    expect(body.velocity.x).toBe(5);
    expect(body.velocity.y).toBe(-3);
    expect(body.angularVelocity).toBe(2.5);
  });

  it('respects custom angle', () => {
    const body = createRigidBody({
      shape: createCircle(1),
      angle: Math.PI / 4,
    });
    expect(body.angle).toBe(Math.PI / 4);
  });

  it('initial force and torque are zero', () => {
    const body = createRigidBody({ shape: createCircle(1) });
    expect(body.force.x).toBe(0);
    expect(body.force.y).toBe(0);
    expect(body.torque).toBe(0);
  });
});

describe('applyForce', () => {
  beforeEach(() => {
    resetBodyIdCounter();
  });

  it('accumulates force on body', () => {
    const body = createRigidBody({ shape: createCircle(1) });
    applyForce(body, new Vec2(10, 0));
    applyForce(body, new Vec2(0, 5));
    expect(body.force.x).toBe(10);
    expect(body.force.y).toBe(5);
  });

  it('computes torque when point is given', () => {
    const body = createRigidBody({
      shape: createCircle(1),
      position: new Vec2(0, 0),
    });
    // Force applied at (1, 0) pointing up: torque = r x F = (1,0) x (0,1) = 1
    applyForce(body, new Vec2(0, 1), new Vec2(1, 0));
    expectClose(body.torque, 1);
  });

  it('force at center of mass generates no torque', () => {
    const body = createRigidBody({
      shape: createCircle(1),
      position: new Vec2(5, 5),
    });
    applyForce(body, new Vec2(10, 0), new Vec2(5, 5));
    expect(body.torque).toBe(0);
  });

  it('force without point generates no torque', () => {
    const body = createRigidBody({ shape: createCircle(1) });
    applyForce(body, new Vec2(10, 0));
    expect(body.torque).toBe(0);
  });

  it('negative torque from clockwise force', () => {
    const body = createRigidBody({
      shape: createCircle(1),
      position: new Vec2(0, 0),
    });
    // Force at (1, 0) pointing down: torque = (1,0) x (0,-1) = -1
    applyForce(body, new Vec2(0, -1), new Vec2(1, 0));
    expectClose(body.torque, -1);
  });

  it('accumulates torque from multiple forces', () => {
    const body = createRigidBody({
      shape: createCircle(1),
      position: new Vec2(0, 0),
    });
    applyForce(body, new Vec2(0, 1), new Vec2(1, 0));  // torque = 1
    applyForce(body, new Vec2(0, 1), new Vec2(2, 0));  // torque = 2
    expectClose(body.torque, 3);
  });
});

describe('computeShapeArea', () => {
  it('circle area = pi * r^2', () => {
    expectClose(computeShapeArea(createCircle(1)), Math.PI);
    expectClose(computeShapeArea(createCircle(2)), 4 * Math.PI);
    expectClose(computeShapeArea(createCircle(0.5)), Math.PI * 0.25);
  });

  it('AABB area = width * height = 4 * halfW * halfH', () => {
    expect(computeShapeArea(createAABB(2, 3))).toBe(24);
    expect(computeShapeArea(createAABB(1, 1))).toBe(4);
    expect(computeShapeArea(createAABB(5, 0.5))).toBe(10);
  });

  it('polygon area for a unit square', () => {
    const square = createPolygon([
      new Vec2(0, 0),
      new Vec2(1, 0),
      new Vec2(1, 1),
      new Vec2(0, 1),
    ]);
    expectClose(computeShapeArea(square), 1);
  });

  it('polygon area for a triangle', () => {
    // Right triangle with legs 3 and 4, area = 6
    const tri = createPolygon([
      new Vec2(0, 0),
      new Vec2(3, 0),
      new Vec2(0, 4),
    ]);
    expectClose(computeShapeArea(tri), 6);
  });

  it('polygon area for a 2x3 rectangle', () => {
    const rect = createPolygon([
      new Vec2(0, 0),
      new Vec2(2, 0),
      new Vec2(2, 3),
      new Vec2(0, 3),
    ]);
    expectClose(computeShapeArea(rect), 6);
  });
});

describe('computeShapeInertia', () => {
  it('circle inertia = 0.5 * m * r^2', () => {
    expectClose(computeShapeInertia(createCircle(1), 1), 0.5);
    expectClose(computeShapeInertia(createCircle(2), 3), 6); // 0.5*3*4
    expectClose(computeShapeInertia(createCircle(0.5), 4), 0.5); // 0.5*4*0.25
  });

  it('AABB inertia = (1/12) * m * (w^2 + h^2)', () => {
    // halfW=1, halfH=1 -> w=2, h=2 -> I = m/12 * (4+4) = 8m/12 = 2m/3
    expectClose(computeShapeInertia(createAABB(1, 1), 3), 2); // 3*(2/3) = 2
    // halfW=2, halfH=3 -> w=4, h=6 -> I = m/12 * (16+36) = 52m/12
    expectClose(computeShapeInertia(createAABB(2, 3), 12), 52);
  });

  it('polygon inertia for unit square centered at origin', () => {
    const square = createPolygon([
      new Vec2(-0.5, -0.5),
      new Vec2(0.5, -0.5),
      new Vec2(0.5, 0.5),
      new Vec2(-0.5, 0.5),
    ]);
    // For unit square about centroid: I = (1/12)*m*(1+1) = m/6
    expectClose(computeShapeInertia(square, 6), 1, 1e-6);
  });
});
