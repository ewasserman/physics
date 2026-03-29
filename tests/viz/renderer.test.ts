import { describe, it, expect, beforeEach } from 'vitest';
import { CanvasRenderer } from '../../src/viz/renderer.js';
import type { WorldSnapshot, BodySnapshot, ConstraintSnapshot, ContactSnapshot } from '../../src/sim/snapshot.js';

/** Minimal canvas mock that satisfies the CanvasRenderer constructor. */
function createMockCanvas(width = 800, height = 600): HTMLCanvasElement {
  const methods = [
    'beginPath', 'closePath', 'moveTo', 'lineTo', 'arc', 'fill', 'stroke',
    'fillRect', 'strokeRect', 'save', 'restore', 'translate', 'rotate',
    'setLineDash', 'clearRect',
  ];
  const ctx: Record<string, any> = {};
  for (const m of methods) {
    ctx[m] = () => {};
  }
  ctx.fillStyle = '';
  ctx.strokeStyle = '';
  ctx.lineWidth = 1;

  const canvas = {
    width,
    height,
    getContext: () => ctx,
    style: { cssText: '' },
  } as unknown as HTMLCanvasElement;

  return canvas;
}

function makeCircleBody(id: number, x: number, y: number, radius = 1, isStatic = false): BodySnapshot {
  return {
    id, shapeType: 'circle', position: { x, y }, angle: 0,
    velocity: { x: 0, y: 0 }, angularVelocity: 0, mass: 1, isStatic, radius,
  };
}

function makeAABBBody(id: number, x: number, y: number, hw = 1, hh = 1, isStatic = false): BodySnapshot {
  return {
    id, shapeType: 'aabb', position: { x, y }, angle: 0.5,
    velocity: { x: 0, y: 0 }, angularVelocity: 0, mass: 1, isStatic,
    halfWidth: hw, halfHeight: hh,
  };
}

function makePolygonBody(id: number, x: number, y: number): BodySnapshot {
  return {
    id, shapeType: 'polygon', position: { x, y }, angle: 0,
    velocity: { x: 0, y: 0 }, angularVelocity: 0, mass: 1, isStatic: false,
    vertices: [{ x: -1, y: -1 }, { x: 1, y: -1 }, { x: 0, y: 1 }],
  };
}

describe('CanvasRenderer', () => {
  let renderer: CanvasRenderer;

  beforeEach(() => {
    const canvas = createMockCanvas();
    renderer = new CanvasRenderer(canvas);
  });

  it('should construct without errors', () => {
    expect(renderer).toBeDefined();
  });

  it('should set camera', () => {
    renderer.setCamera(5, 10, 50);
    const s = renderer.worldToScreen(5, 10);
    // Center of canvas
    expect(s.x).toBeCloseTo(400);
    expect(s.y).toBeCloseTo(300);
  });

  it('worldToScreen and screenToWorld should be inverses', () => {
    renderer.setCamera(2, 3, 40);
    const screen = renderer.worldToScreen(5, 7);
    const world = renderer.screenToWorld(screen.x, screen.y);
    expect(world.x).toBeCloseTo(5);
    expect(world.y).toBeCloseTo(7);
  });

  it('should flip y-axis (higher world-y -> lower screen-y)', () => {
    renderer.setCamera(0, 0, 40);
    const low = renderer.worldToScreen(0, 0);
    const high = renderer.worldToScreen(0, 5);
    expect(high.y).toBeLessThan(low.y);
  });

  it('should auto-fit camera to bodies', () => {
    const bodies = [
      makeCircleBody(0, -5, 0),
      makeCircleBody(1, 5, 10),
    ];
    renderer.autoFit(bodies);
    // After autoFit, both bodies should be visible
    const s0 = renderer.worldToScreen(-5, 0);
    const s1 = renderer.worldToScreen(5, 10);
    expect(s0.x).toBeGreaterThanOrEqual(0);
    expect(s1.x).toBeLessThanOrEqual(800);
    expect(s0.y).toBeLessThanOrEqual(600);
    expect(s1.y).toBeGreaterThanOrEqual(0);
  });

  it('should render an empty frame without errors', () => {
    const snapshot: WorldSnapshot = {
      time: 0, step: 0, bodies: [], constraints: [], contacts: [],
    };
    expect(() => renderer.renderFrame(snapshot)).not.toThrow();
  });

  it('should render circles without errors', () => {
    const snapshot: WorldSnapshot = {
      time: 0.1, step: 6, bodies: [makeCircleBody(0, 0, 5, 1)],
      constraints: [], contacts: [],
    };
    expect(() => renderer.renderFrame(snapshot)).not.toThrow();
  });

  it('should render AABBs without errors', () => {
    const snapshot: WorldSnapshot = {
      time: 0, step: 0, bodies: [makeAABBBody(0, 0, 0, 2, 1)],
      constraints: [], contacts: [],
    };
    expect(() => renderer.renderFrame(snapshot)).not.toThrow();
  });

  it('should render polygons without errors', () => {
    const snapshot: WorldSnapshot = {
      time: 0, step: 0, bodies: [makePolygonBody(0, 0, 0)],
      constraints: [], contacts: [],
    };
    expect(() => renderer.renderFrame(snapshot)).not.toThrow();
  });

  it('should render static bodies without errors', () => {
    const snapshot: WorldSnapshot = {
      time: 0, step: 0,
      bodies: [makeAABBBody(0, 0, 0, 10, 0.5, true)],
      constraints: [], contacts: [],
    };
    expect(() => renderer.renderFrame(snapshot)).not.toThrow();
  });

  it('should render constraints without errors', () => {
    const constraint: ConstraintSnapshot = {
      type: 'distance', bodyAId: 0, bodyBId: 1, broken: false,
    };
    const snapshot: WorldSnapshot = {
      time: 0, step: 0,
      bodies: [makeCircleBody(0, -2, 0), makeCircleBody(1, 2, 0)],
      constraints: [constraint],
      contacts: [],
    };
    expect(() => renderer.renderFrame(snapshot)).not.toThrow();
  });

  it('should render broken constraints without errors', () => {
    const constraint: ConstraintSnapshot = {
      type: 'distance', bodyAId: 0, bodyBId: 1, broken: true,
    };
    const snapshot: WorldSnapshot = {
      time: 0, step: 0,
      bodies: [makeCircleBody(0, 0, 0), makeCircleBody(1, 5, 0)],
      constraints: [constraint],
      contacts: [],
    };
    expect(() => renderer.renderFrame(snapshot)).not.toThrow();
  });

  it('should render contacts when debug is enabled', () => {
    renderer.setShowContacts(true);
    const contact: ContactSnapshot = {
      bodyAId: 0, bodyBId: 1,
      normal: { x: 0, y: 1 }, penetration: 0.01,
      point: { x: 0, y: 0 },
    };
    const snapshot: WorldSnapshot = {
      time: 0, step: 0,
      bodies: [makeCircleBody(0, 0, 0), makeCircleBody(1, 0, 2)],
      constraints: [],
      contacts: [contact],
    };
    expect(() => renderer.renderFrame(snapshot)).not.toThrow();
  });

  it('should render a complex frame with many bodies', () => {
    const bodies: BodySnapshot[] = [];
    for (let i = 0; i < 20; i++) {
      bodies.push(makeCircleBody(i, Math.random() * 10, Math.random() * 10));
    }
    const snapshot: WorldSnapshot = {
      time: 1.5, step: 90, bodies, constraints: [], contacts: [],
    };
    expect(() => renderer.renderFrame(snapshot)).not.toThrow();
  });

  it('should render grid without errors', () => {
    renderer.setShowGrid(true);
    const snapshot: WorldSnapshot = {
      time: 0, step: 0, bodies: [makeCircleBody(0, 0, 0)],
      constraints: [], contacts: [],
    };
    expect(() => renderer.renderFrame(snapshot)).not.toThrow();
  });

  it('should handle constraint with missing body gracefully', () => {
    const constraint: ConstraintSnapshot = {
      type: 'distance', bodyAId: 0, bodyBId: 99, broken: false,
    };
    const snapshot: WorldSnapshot = {
      time: 0, step: 0,
      bodies: [makeCircleBody(0, 0, 0)],
      constraints: [constraint],
      contacts: [],
    };
    // Should not throw even if bodyB doesn't exist
    expect(() => renderer.renderFrame(snapshot)).not.toThrow();
  });
});

describe('CanvasRenderer coordinate transforms', () => {
  it('should handle zero zoom gracefully', () => {
    const canvas = createMockCanvas();
    const renderer = new CanvasRenderer(canvas);
    renderer.setCamera(0, 0, 0.001);
    // Should not throw
    expect(() => renderer.worldToScreen(100, 100)).not.toThrow();
  });

  it('should handle large world coordinates', () => {
    const canvas = createMockCanvas();
    const renderer = new CanvasRenderer(canvas);
    renderer.setCamera(0, 0, 1);
    const s = renderer.worldToScreen(1000, 1000);
    expect(isFinite(s.x)).toBe(true);
    expect(isFinite(s.y)).toBe(true);
  });
});
