import { describe, it, expect, beforeEach } from 'vitest';
import { createWorld, World } from '../../src/core/world.js';
import { createFloor, createWall, createBox, createBoundary } from '../../src/core/environment.js';
import { resetBodyIdCounter } from '../../src/core/body.js';
import { ShapeType } from '../../src/core/shape.js';

describe('Environment', () => {
  let world: World;

  beforeEach(() => {
    resetBodyIdCounter();
    world = createWorld();
  });

  describe('createFloor', () => {
    it('creates a static floor at the given y position', () => {
      const floor = createFloor(world, 0, 100);
      expect(floor.isStatic).toBe(true);
      expect(floor.shape.type).toBe(ShapeType.AABB);
      expect(floor.position.y).toBeLessThanOrEqual(0);
      expect(world.bodies).toContain(floor);
    });

    it('has correct friction and restitution', () => {
      const floor = createFloor(world, 0, 50);
      expect(floor.friction).toBeCloseTo(0.6);
      expect(floor.restitution).toBeCloseTo(0.3);
    });

    it('has the correct width', () => {
      const floor = createFloor(world, 0, 200);
      if (floor.shape.type === ShapeType.AABB) {
        expect(floor.shape.halfWidth).toBe(100);
      }
    });
  });

  describe('createWall', () => {
    it('creates a static wall at the given position', () => {
      const wall = createWall(world, 5, 2, 10);
      expect(wall.isStatic).toBe(true);
      expect(wall.position.x).toBe(5);
      expect(wall.position.y).toBe(2);
      expect(world.bodies).toContain(wall);
    });

    it('has the correct height', () => {
      const wall = createWall(world, 0, 5, 10);
      if (wall.shape.type === ShapeType.AABB) {
        expect(wall.shape.halfHeight).toBe(5);
      }
    });

    it('has correct friction and restitution', () => {
      const wall = createWall(world, 0, 0, 10);
      expect(wall.friction).toBeCloseTo(0.6);
      expect(wall.restitution).toBeCloseTo(0.3);
    });
  });

  describe('createBox', () => {
    it('creates a static box at the given position', () => {
      const box = createBox(world, 3, 4, 2, 1);
      expect(box.isStatic).toBe(true);
      expect(box.position.x).toBe(3);
      expect(box.position.y).toBe(4);
      if (box.shape.type === ShapeType.AABB) {
        expect(box.shape.halfWidth).toBe(1);
        expect(box.shape.halfHeight).toBe(0.5);
      }
      expect(world.bodies).toContain(box);
    });
  });

  describe('createBoundary', () => {
    it('creates 4 walls forming a boundary', () => {
      const walls = createBoundary(world, -10, 10, 0, 20);
      expect(walls).toHaveLength(4);
      expect(world.bodies).toHaveLength(4);
    });

    it('all boundary walls are static', () => {
      const walls = createBoundary(world, -10, 10, 0, 20);
      for (const wall of walls) {
        expect(wall.isStatic).toBe(true);
      }
    });

    it('boundary walls have correct friction and restitution', () => {
      const walls = createBoundary(world, -10, 10, 0, 20);
      for (const wall of walls) {
        expect(wall.friction).toBeCloseTo(0.6);
        expect(wall.restitution).toBeCloseTo(0.3);
      }
    });

    it('boundary walls are positioned correctly', () => {
      const walls = createBoundary(world, -10, 10, 0, 20);
      const [left, right, bottom, top] = walls;
      // Left wall should be at or near x=-10
      expect(left.position.x).toBeLessThanOrEqual(-10);
      // Right wall should be at or near x=10
      expect(right.position.x).toBeGreaterThanOrEqual(10);
      // Bottom wall should be at or near y=0
      expect(bottom.position.y).toBeLessThanOrEqual(0);
      // Top wall should be at or near y=20
      expect(top.position.y).toBeGreaterThanOrEqual(20);
    });
  });
});
