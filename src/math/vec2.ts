/**
 * Immutable 2D vector class. All operations return new Vec2 instances.
 */
export class Vec2 {
  readonly x: number;
  readonly y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  // --- Static factory methods ---

  static zero(): Vec2 {
    return new Vec2(0, 0);
  }

  static fromAngle(angle: number): Vec2 {
    return new Vec2(Math.cos(angle), Math.sin(angle));
  }

  // --- Arithmetic operations ---

  add(other: Vec2): Vec2 {
    return new Vec2(this.x + other.x, this.y + other.y);
  }

  sub(other: Vec2): Vec2 {
    return new Vec2(this.x - other.x, this.y - other.y);
  }

  scale(scalar: number): Vec2 {
    return new Vec2(this.x * scalar, this.y * scalar);
  }

  negate(): Vec2 {
    return new Vec2(-this.x, -this.y);
  }

  // --- Products ---

  /** Dot product. */
  dot(other: Vec2): number {
    return this.x * other.x + this.y * other.y;
  }

  /** 2D cross product — returns scalar (the z-component of the 3D cross). */
  cross(other: Vec2): number {
    return this.x * other.y - this.y * other.x;
  }

  // --- Length / distance ---

  lengthSq(): number {
    return this.x * this.x + this.y * this.y;
  }

  length(): number {
    return Math.sqrt(this.lengthSq());
  }

  distanceTo(other: Vec2): number {
    return this.sub(other).length();
  }

  // --- Normalization ---

  normalize(): Vec2 {
    const len = this.length();
    if (len === 0) return Vec2.zero();
    return this.scale(1 / len);
  }

  // --- Rotation ---

  /** Rotate this vector by the given angle (radians, counterclockwise). */
  rotate(angle: number): Vec2 {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return new Vec2(this.x * c - this.y * s, this.x * s + this.y * c);
  }

  // --- Misc ---

  /** Return a vector perpendicular to this one (90-degree CCW rotation). */
  perpendicular(): Vec2 {
    return new Vec2(-this.y, this.x);
  }

  clone(): Vec2 {
    return new Vec2(this.x, this.y);
  }

  toString(): string {
    return `Vec2(${this.x}, ${this.y})`;
  }
}
