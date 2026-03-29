import { Vec2 } from '../math/vec2.js';

// --- Shape type discriminator ---

export enum ShapeType {
  Circle = 'circle',
  Polygon = 'polygon',
  AABB = 'aabb',
}

// --- Shape interfaces ---

export interface CircleShape {
  type: ShapeType.Circle;
  radius: number;
}

export interface PolygonShape {
  type: ShapeType.Polygon;
  vertices: Vec2[];
}

export interface AABBShape {
  type: ShapeType.AABB;
  halfWidth: number;
  halfHeight: number;
}

/** Discriminated union of all shape types. */
export type Shape = CircleShape | PolygonShape | AABBShape;

// --- Factory helpers ---

export function createCircle(radius: number): CircleShape {
  return { type: ShapeType.Circle, radius };
}

export function createPolygon(vertices: Vec2[]): PolygonShape {
  return { type: ShapeType.Polygon, vertices: vertices.map((v) => v.clone()) };
}

export function createAABB(halfWidth: number, halfHeight: number): AABBShape {
  return { type: ShapeType.AABB, halfWidth, halfHeight };
}

// --- Area and inertia computations ---

/** Compute the area of a shape. */
export function computeShapeArea(shape: Shape): number {
  switch (shape.type) {
    case ShapeType.Circle:
      return Math.PI * shape.radius * shape.radius;

    case ShapeType.AABB:
      return 4 * shape.halfWidth * shape.halfHeight;

    case ShapeType.Polygon:
      return computePolygonArea(shape.vertices);
  }
}

/**
 * Compute the moment of inertia of a shape about its centroid,
 * given a total mass. Assumes uniform density.
 */
export function computeShapeInertia(shape: Shape, mass: number): number {
  switch (shape.type) {
    case ShapeType.Circle:
      // I = (1/2) m r^2
      return 0.5 * mass * shape.radius * shape.radius;

    case ShapeType.AABB: {
      // Treat as rectangle: I = (1/12) m (w^2 + h^2)
      const w = 2 * shape.halfWidth;
      const h = 2 * shape.halfHeight;
      return (mass / 12) * (w * w + h * h);
    }

    case ShapeType.Polygon:
      return computePolygonInertia(shape.vertices, mass);
  }
}

// --- Internal helpers ---

/** Shoelace formula for polygon area (assumes CCW winding). */
function computePolygonArea(vertices: Vec2[]): number {
  let area = 0;
  const n = vertices.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += vertices[i].cross(vertices[j]);
  }
  return Math.abs(area) / 2;
}

/**
 * Moment of inertia of a convex polygon about its centroid.
 * Uses the standard triangulation formula for a polygon with uniform density.
 */
function computePolygonInertia(vertices: Vec2[], mass: number): number {
  const n = vertices.length;
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % n];
    const crossAB = Math.abs(a.cross(b));
    numerator += crossAB * (a.dot(a) + a.dot(b) + b.dot(b));
    denominator += crossAB;
  }

  if (denominator === 0) return 0;
  return (mass / 6) * (numerator / denominator);
}
