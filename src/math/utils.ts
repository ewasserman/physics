/** Clamp a value to the range [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Linear interpolation from a to b by factor t. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Check if two numbers are approximately equal within epsilon. */
export function almostEqual(a: number, b: number, epsilon: number = 1e-10): boolean {
  return Math.abs(a - b) <= epsilon;
}

/** Convert degrees to radians. */
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/** Convert radians to degrees. */
export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}
