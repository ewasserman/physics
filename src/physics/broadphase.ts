import { Vec2 } from '../math/vec2.js';
import { RigidBody } from '../core/body.js';
import { ShapeType } from '../core/shape.js';

/** Compute an axis-aligned bounding box for any shape in world space. */
export function computeAABB(body: RigidBody): { min: Vec2; max: Vec2 } {
  const pos = body.position;
  switch (body.shape.type) {
    case ShapeType.Circle: {
      const r = body.shape.radius;
      return {
        min: new Vec2(pos.x - r, pos.y - r),
        max: new Vec2(pos.x + r, pos.y + r),
      };
    }
    case ShapeType.AABB: {
      const hw = body.shape.halfWidth;
      const hh = body.shape.halfHeight;
      return {
        min: new Vec2(pos.x - hw, pos.y - hh),
        max: new Vec2(pos.x + hw, pos.y + hh),
      };
    }
    case ShapeType.Polygon: {
      // Transform vertices by body position (ignore rotation for now)
      const verts = body.shape.vertices;
      let minX = Infinity, minY = Infinity;
      let maxX = -Infinity, maxY = -Infinity;
      for (const v of verts) {
        const wx = pos.x + v.x;
        const wy = pos.y + v.y;
        if (wx < minX) minX = wx;
        if (wy < minY) minY = wy;
        if (wx > maxX) maxX = wx;
        if (wy > maxY) maxY = wy;
      }
      return { min: new Vec2(minX, minY), max: new Vec2(maxX, maxY) };
    }
  }
}

/**
 * Spatial hash for broad-phase collision detection.
 * Bodies are inserted each frame and potential collision pairs are returned.
 */
export class SpatialHash {
  private cellSize: number;
  private cells: Map<string, RigidBody[]>;
  private bodyIds: Set<number>; // track inserted bodies

  constructor(cellSize: number) {
    this.cellSize = cellSize;
    this.cells = new Map();
    this.bodyIds = new Set();
  }

  /** Clear all cells for a new frame. */
  clear(): void {
    this.cells.clear();
    this.bodyIds.clear();
  }

  /** Insert a body into all cells its AABB overlaps. */
  insert(body: RigidBody): void {
    const aabb = computeAABB(body);
    const minCellX = Math.floor(aabb.min.x / this.cellSize);
    const minCellY = Math.floor(aabb.min.y / this.cellSize);
    const maxCellX = Math.floor(aabb.max.x / this.cellSize);
    const maxCellY = Math.floor(aabb.max.y / this.cellSize);

    this.bodyIds.add(body.id);

    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cy = minCellY; cy <= maxCellY; cy++) {
        const key = `${cx},${cy}`;
        let cell = this.cells.get(key);
        if (!cell) {
          cell = [];
          this.cells.set(key, cell);
        }
        cell.push(body);
      }
    }
  }

  /** Return all unique pairs of bodies that share at least one cell. */
  getPotentialPairs(): [RigidBody, RigidBody][] {
    const seen = new Set<string>();
    const pairs: [RigidBody, RigidBody][] = [];

    for (const cell of this.cells.values()) {
      for (let i = 0; i < cell.length; i++) {
        for (let j = i + 1; j < cell.length; j++) {
          const a = cell[i];
          const b = cell[j];
          // Ensure consistent ordering for deduplication
          const lo = Math.min(a.id, b.id);
          const hi = Math.max(a.id, b.id);
          const key = `${lo}:${hi}`;
          if (!seen.has(key)) {
            seen.add(key);
            pairs.push(a.id < b.id ? [a, b] : [b, a]);
          }
        }
      }
    }

    return pairs;
  }
}
