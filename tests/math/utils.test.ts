import { describe, it, expect } from 'vitest';
import { clamp, lerp, almostEqual, degToRad, radToDeg } from '../../src/math/utils.js';

describe('clamp', () => {
  it('returns value when in range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps to min when below', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('clamps to max when above', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('returns min when value equals min', () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it('returns max when value equals max', () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it('works with negative ranges', () => {
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(0, -10, -1)).toBe(-1);
    expect(clamp(-20, -10, -1)).toBe(-10);
  });

  it('works when min equals max', () => {
    expect(clamp(5, 3, 3)).toBe(3);
    expect(clamp(1, 3, 3)).toBe(3);
  });
});

describe('lerp', () => {
  it('returns a when t=0', () => {
    expect(lerp(10, 20, 0)).toBe(10);
  });

  it('returns b when t=1', () => {
    expect(lerp(10, 20, 1)).toBe(20);
  });

  it('returns midpoint when t=0.5', () => {
    expect(lerp(10, 20, 0.5)).toBe(15);
  });

  it('interpolates correctly for t=0.25', () => {
    expect(lerp(0, 100, 0.25)).toBe(25);
  });

  it('extrapolates when t > 1', () => {
    expect(lerp(0, 10, 2)).toBe(20);
  });

  it('extrapolates when t < 0', () => {
    expect(lerp(0, 10, -1)).toBe(-10);
  });

  it('works with negative values', () => {
    expect(lerp(-10, 10, 0.5)).toBe(0);
  });

  it('returns a when a equals b', () => {
    expect(lerp(5, 5, 0.7)).toBe(5);
  });
});

describe('almostEqual', () => {
  it('considers equal values as almost equal', () => {
    expect(almostEqual(1, 1)).toBe(true);
  });

  it('considers values within default epsilon as equal', () => {
    expect(almostEqual(1, 1 + 1e-11)).toBe(true);
  });

  it('considers values outside default epsilon as not equal', () => {
    expect(almostEqual(1, 1 + 1e-9)).toBe(false);
  });

  it('uses custom epsilon', () => {
    expect(almostEqual(1, 1.05, 0.1)).toBe(true);
    expect(almostEqual(1, 1.2, 0.1)).toBe(false);
  });

  it('works with zero', () => {
    expect(almostEqual(0, 0)).toBe(true);
    expect(almostEqual(0, 1e-11)).toBe(true);
    expect(almostEqual(0, 1e-9)).toBe(false);
  });

  it('is symmetric', () => {
    expect(almostEqual(1, 2)).toBe(almostEqual(2, 1));
    expect(almostEqual(1, 1 + 1e-11)).toBe(almostEqual(1 + 1e-11, 1));
  });

  it('works with negative values', () => {
    expect(almostEqual(-1, -1)).toBe(true);
    expect(almostEqual(-1, -1 + 1e-11)).toBe(true);
  });
});

describe('degToRad', () => {
  it('converts 0 degrees to 0 radians', () => {
    expect(degToRad(0)).toBe(0);
  });

  it('converts 90 degrees to pi/2', () => {
    expect(degToRad(90)).toBeCloseTo(Math.PI / 2);
  });

  it('converts 180 degrees to pi', () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI);
  });

  it('converts 360 degrees to 2*pi', () => {
    expect(degToRad(360)).toBeCloseTo(2 * Math.PI);
  });

  it('converts negative degrees', () => {
    expect(degToRad(-90)).toBeCloseTo(-Math.PI / 2);
  });

  it('converts 45 degrees to pi/4', () => {
    expect(degToRad(45)).toBeCloseTo(Math.PI / 4);
  });
});

describe('radToDeg', () => {
  it('converts 0 radians to 0 degrees', () => {
    expect(radToDeg(0)).toBe(0);
  });

  it('converts pi/2 to 90 degrees', () => {
    expect(radToDeg(Math.PI / 2)).toBeCloseTo(90);
  });

  it('converts pi to 180 degrees', () => {
    expect(radToDeg(Math.PI)).toBeCloseTo(180);
  });

  it('converts 2*pi to 360 degrees', () => {
    expect(radToDeg(2 * Math.PI)).toBeCloseTo(360);
  });

  it('converts negative radians', () => {
    expect(radToDeg(-Math.PI)).toBeCloseTo(-180);
  });
});

describe('degToRad / radToDeg round-trip', () => {
  it('round-trips known values', () => {
    const degrees = [0, 30, 45, 60, 90, 120, 180, 270, 360, -45, -90];
    for (const d of degrees) {
      expect(radToDeg(degToRad(d))).toBeCloseTo(d);
    }
  });

  it('round-trips from radians', () => {
    const radians = [0, Math.PI / 6, Math.PI / 4, Math.PI / 2, Math.PI, 2 * Math.PI];
    for (const r of radians) {
      expect(degToRad(radToDeg(r))).toBeCloseTo(r);
    }
  });
});
