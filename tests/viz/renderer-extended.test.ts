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
    id, shapeType: 'aabb', position: { x, y }, angle: 0,
    velocity: { x: 0, y: 0 }, angularVelocity: 0, mass: 1, isStatic,
    halfWidth: hw, halfHeight: hh,
  };
}

function makeSnapshot(
  bodies: BodySnapshot[] = [],
  constraints: ConstraintSnapshot[] = [],
  contacts: ContactSnapshot[] = [],
): WorldSnapshot {
  return { time: 0, step: 0, bodies, constraints, contacts };
}

describe('CanvasRenderer — Camera auto-fit', () => {
  let renderer: CanvasRenderer;

  beforeEach(() => {
    renderer = new CanvasRenderer(createMockCanvas());
  });

  it('should handle autoFit with a single body', () => {
    const bodies = [makeCircleBody(0, 5, 5, 2)];
    renderer.autoFit(bodies);
    const s = renderer.worldToScreen(5, 5);
    // Body center should be roughly at screen center
    expect(s.x).toBeCloseTo(400, -1);
    expect(s.y).toBeCloseTo(300, -1);
  });

  it('should handle autoFit with empty bodies array (no-op)', () => {
    renderer.setCamera(10, 20, 50);
    renderer.autoFit([]);
    // Camera should remain unchanged
    const s = renderer.worldToScreen(10, 20);
    expect(s.x).toBeCloseTo(400);
    expect(s.y).toBeCloseTo(300);
  });

  it('should handle autoFit with bodies spread far apart', () => {
    const bodies = [
      makeCircleBody(0, -100, -100, 1),
      makeCircleBody(1, 100, 100, 1),
    ];
    renderer.autoFit(bodies);
    // Both bodies should be on-screen
    const s0 = renderer.worldToScreen(-100, -100);
    const s1 = renderer.worldToScreen(100, 100);
    expect(s0.x).toBeGreaterThanOrEqual(0);
    expect(s1.x).toBeLessThanOrEqual(800);
    expect(s0.y).toBeLessThanOrEqual(600);
    expect(s1.y).toBeGreaterThanOrEqual(0);
  });

  it('should handle autoFit with bodies at the same position', () => {
    const bodies = [
      makeCircleBody(0, 5, 5, 1),
      makeCircleBody(1, 5, 5, 2),
    ];
    // Should not throw or produce NaN
    renderer.autoFit(bodies);
    const s = renderer.worldToScreen(5, 5);
    expect(isFinite(s.x)).toBe(true);
    expect(isFinite(s.y)).toBe(true);
  });

  it('should auto-fit AABB bodies using halfWidth/halfHeight', () => {
    const bodies = [makeAABBBody(0, 0, 0, 10, 5)];
    renderer.autoFit(bodies);
    // The AABB extents (10 half-width) should be visible
    const left = renderer.worldToScreen(-10, 0);
    const right = renderer.worldToScreen(10, 0);
    expect(left.x).toBeGreaterThanOrEqual(0);
    expect(right.x).toBeLessThanOrEqual(800);
  });

  it('should include custom padding in auto-fit', () => {
    const bodies = [makeCircleBody(0, 0, 0, 1)];
    renderer.autoFit(bodies, 10);
    // With large padding, zoom should be lower
    const s = renderer.worldToScreen(1, 0);
    const sOrigin = renderer.worldToScreen(0, 0);
    const pixelDist = Math.abs(s.x - sOrigin.x);
    // 1 world unit should be less than half the canvas (lots of padding)
    expect(pixelDist).toBeLessThan(400);
  });
});

describe('CanvasRenderer — worldToScreen / screenToWorld round-trip', () => {
  let renderer: CanvasRenderer;

  beforeEach(() => {
    renderer = new CanvasRenderer(createMockCanvas());
  });

  it('should round-trip with default camera', () => {
    const screen = renderer.worldToScreen(3, 7);
    const world = renderer.screenToWorld(screen.x, screen.y);
    expect(world.x).toBeCloseTo(3);
    expect(world.y).toBeCloseTo(7);
  });

  it('should round-trip with offset camera', () => {
    renderer.setCamera(50, -30, 80);
    const screen = renderer.worldToScreen(55, -25);
    const world = renderer.screenToWorld(screen.x, screen.y);
    expect(world.x).toBeCloseTo(55);
    expect(world.y).toBeCloseTo(-25);
  });

  it('should round-trip at canvas corners', () => {
    renderer.setCamera(0, 0, 40);
    // Top-left corner of the canvas
    const worldTL = renderer.screenToWorld(0, 0);
    const screenBack = renderer.worldToScreen(worldTL.x, worldTL.y);
    expect(screenBack.x).toBeCloseTo(0);
    expect(screenBack.y).toBeCloseTo(0);
  });

  it('should round-trip with very high zoom', () => {
    renderer.setCamera(0, 0, 500);
    const screen = renderer.worldToScreen(0.1, 0.2);
    const world = renderer.screenToWorld(screen.x, screen.y);
    expect(world.x).toBeCloseTo(0.1);
    expect(world.y).toBeCloseTo(0.2);
  });

  it('should round-trip with very low zoom', () => {
    renderer.setCamera(0, 0, 0.5);
    const screen = renderer.worldToScreen(100, 200);
    const world = renderer.screenToWorld(screen.x, screen.y);
    expect(world.x).toBeCloseTo(100);
    expect(world.y).toBeCloseTo(200);
  });

  it('should produce correct y-flip: positive world-y maps to lower screen-y', () => {
    renderer.setCamera(0, 0, 40);
    const sUp = renderer.worldToScreen(0, 10);
    const sDown = renderer.worldToScreen(0, -10);
    expect(sUp.y).toBeLessThan(sDown.y); // screen y is flipped
  });
});

describe('CanvasRenderer — rendering empty snapshots', () => {
  let renderer: CanvasRenderer;

  beforeEach(() => {
    renderer = new CanvasRenderer(createMockCanvas());
  });

  it('should render empty snapshot with grid enabled', () => {
    renderer.setShowGrid(true);
    expect(() => renderer.renderFrame(makeSnapshot())).not.toThrow();
  });

  it('should render empty snapshot with contacts enabled', () => {
    renderer.setShowContacts(true);
    expect(() => renderer.renderFrame(makeSnapshot())).not.toThrow();
  });

  it('should render empty snapshot with both grid and contacts enabled', () => {
    renderer.setShowGrid(true);
    renderer.setShowContacts(true);
    expect(() => renderer.renderFrame(makeSnapshot())).not.toThrow();
  });
});

describe('CanvasRenderer — snapshots with constraints and contacts', () => {
  let renderer: CanvasRenderer;

  beforeEach(() => {
    renderer = new CanvasRenderer(createMockCanvas());
  });

  it('should render multiple constraints between multiple bodies', () => {
    const bodies = [
      makeCircleBody(0, 0, 0),
      makeCircleBody(1, 3, 0),
      makeCircleBody(2, 6, 0),
    ];
    const constraints: ConstraintSnapshot[] = [
      { type: 'distance', bodyAId: 0, bodyBId: 1, broken: false },
      { type: 'distance', bodyAId: 1, bodyBId: 2, broken: false },
    ];
    expect(() => renderer.renderFrame(makeSnapshot(bodies, constraints))).not.toThrow();
  });

  it('should render mix of broken and intact constraints', () => {
    const bodies = [
      makeCircleBody(0, 0, 0),
      makeCircleBody(1, 5, 0),
      makeCircleBody(2, 10, 0),
    ];
    const constraints: ConstraintSnapshot[] = [
      { type: 'distance', bodyAId: 0, bodyBId: 1, broken: false },
      { type: 'distance', bodyAId: 1, bodyBId: 2, broken: true },
    ];
    expect(() => renderer.renderFrame(makeSnapshot(bodies, constraints))).not.toThrow();
  });

  it('should render multiple contacts when debug enabled', () => {
    renderer.setShowContacts(true);
    const bodies = [makeCircleBody(0, 0, 0), makeCircleBody(1, 2, 0)];
    const contacts: ContactSnapshot[] = [
      { bodyAId: 0, bodyBId: 1, normal: { x: 1, y: 0 }, penetration: 0.05, point: { x: 1, y: 0 } },
      { bodyAId: 0, bodyBId: 1, normal: { x: 0, y: 1 }, penetration: 0.02, point: { x: 0.5, y: 0 } },
    ];
    expect(() => renderer.renderFrame(makeSnapshot(bodies, [], contacts))).not.toThrow();
  });

  it('should render snapshot with bodies, constraints, and contacts together', () => {
    renderer.setShowContacts(true);
    const bodies = [
      makeCircleBody(0, 0, 0),
      makeCircleBody(1, 3, 0),
    ];
    const constraints: ConstraintSnapshot[] = [
      { type: 'distance', bodyAId: 0, bodyBId: 1, broken: false },
    ];
    const contacts: ContactSnapshot[] = [
      { bodyAId: 0, bodyBId: 1, normal: { x: 1, y: 0 }, penetration: 0.01, point: { x: 1.5, y: 0 } },
    ];
    expect(() => renderer.renderFrame(makeSnapshot(bodies, constraints, contacts))).not.toThrow();
  });

  it('should skip contacts rendering when showContacts is false', () => {
    renderer.setShowContacts(false);
    const contacts: ContactSnapshot[] = [
      { bodyAId: 0, bodyBId: 1, normal: { x: 1, y: 0 }, penetration: 0.01, point: { x: 0, y: 0 } },
    ];
    // Should not throw; contacts are just not rendered
    expect(() => renderer.renderFrame(makeSnapshot([], [], contacts))).not.toThrow();
  });
});

describe('CanvasRenderer — edge cases', () => {
  let renderer: CanvasRenderer;

  beforeEach(() => {
    renderer = new CanvasRenderer(createMockCanvas());
  });

  it('should render a circle with zero radius', () => {
    const body = makeCircleBody(0, 0, 0, 0);
    expect(() => renderer.renderFrame(makeSnapshot([body]))).not.toThrow();
  });

  it('should render an AABB with zero half-width and half-height', () => {
    const body = makeAABBBody(0, 0, 0, 0, 0);
    expect(() => renderer.renderFrame(makeSnapshot([body]))).not.toThrow();
  });

  it('should render an AABB with very large dimensions', () => {
    const body = makeAABBBody(0, 0, 0, 1000, 1000);
    expect(() => renderer.renderFrame(makeSnapshot([body]))).not.toThrow();
  });

  it('should render a circle with very large radius', () => {
    const body = makeCircleBody(0, 0, 0, 10000);
    expect(() => renderer.renderFrame(makeSnapshot([body]))).not.toThrow();
  });

  it('should handle body at extreme coordinates', () => {
    const body = makeCircleBody(0, 1e6, 1e6, 1);
    expect(() => renderer.renderFrame(makeSnapshot([body]))).not.toThrow();
  });

  it('should render polygon with empty vertices array', () => {
    const body: BodySnapshot = {
      id: 0, shapeType: 'polygon', position: { x: 0, y: 0 }, angle: 0,
      velocity: { x: 0, y: 0 }, angularVelocity: 0, mass: 1, isStatic: false,
      vertices: [],
    };
    expect(() => renderer.renderFrame(makeSnapshot([body]))).not.toThrow();
  });

  it('should render body with unknown shape type without crashing', () => {
    const body: BodySnapshot = {
      id: 0, shapeType: 'unknown' as any, position: { x: 0, y: 0 }, angle: 0,
      velocity: { x: 0, y: 0 }, angularVelocity: 0, mass: 1, isStatic: false,
    };
    expect(() => renderer.renderFrame(makeSnapshot([body]))).not.toThrow();
  });

  it('should render constraint where both body IDs are missing', () => {
    const constraints: ConstraintSnapshot[] = [
      { type: 'distance', bodyAId: 99, bodyBId: 100, broken: false },
    ];
    expect(() => renderer.renderFrame(makeSnapshot([], constraints))).not.toThrow();
  });

  it('should handle rendering with non-default canvas sizes', () => {
    const canvas = createMockCanvas(1920, 1080);
    const r = new CanvasRenderer(canvas);
    const body = makeCircleBody(0, 0, 0, 1);
    expect(() => r.renderFrame(makeSnapshot([body]))).not.toThrow();
  });

  it('should handle rendering with very small canvas', () => {
    const canvas = createMockCanvas(10, 10);
    const r = new CanvasRenderer(canvas);
    const body = makeCircleBody(0, 0, 0, 1);
    expect(() => r.renderFrame(makeSnapshot([body]))).not.toThrow();
  });

  it('should render many mixed body types', () => {
    const bodies: BodySnapshot[] = [];
    for (let i = 0; i < 50; i++) {
      if (i % 3 === 0) bodies.push(makeCircleBody(i, i, i, 1));
      else if (i % 3 === 1) bodies.push(makeAABBBody(i, i, i, 1, 1));
      else bodies.push({
        id: i, shapeType: 'polygon', position: { x: i, y: i }, angle: 0,
        velocity: { x: 0, y: 0 }, angularVelocity: 0, mass: 1, isStatic: false,
        vertices: [{ x: -1, y: -1 }, { x: 1, y: -1 }, { x: 0, y: 1 }],
      });
    }
    expect(() => renderer.renderFrame(makeSnapshot(bodies))).not.toThrow();
  });
});

describe('CanvasRenderer — configuration', () => {
  it('should accept custom config', () => {
    const canvas = createMockCanvas();
    const renderer = new CanvasRenderer(canvas, {
      fillColor: '#ff0000',
      backgroundColor: '#000000',
      showGrid: false,
      showContacts: true,
    });
    expect(renderer).toBeDefined();
  });

  it('should toggle grid visibility', () => {
    const canvas = createMockCanvas();
    const renderer = new CanvasRenderer(canvas, { showGrid: false });
    // Rendering with grid off should work
    expect(() => renderer.renderFrame(makeSnapshot())).not.toThrow();
    // Toggle on
    renderer.setShowGrid(true);
    expect(() => renderer.renderFrame(makeSnapshot())).not.toThrow();
  });

  it('should toggle contacts visibility', () => {
    const canvas = createMockCanvas();
    const renderer = new CanvasRenderer(canvas);
    renderer.setShowContacts(true);
    renderer.setShowContacts(false);
    const contacts: ContactSnapshot[] = [
      { bodyAId: 0, bodyBId: 1, normal: { x: 1, y: 0 }, penetration: 0.01, point: { x: 0, y: 0 } },
    ];
    expect(() => renderer.renderFrame(makeSnapshot([], [], contacts))).not.toThrow();
  });
});
