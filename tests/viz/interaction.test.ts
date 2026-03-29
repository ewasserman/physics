import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createRigidBody, resetBodyIdCounter } from '../../src/core/body.js';
import { createCircle, createAABB } from '../../src/core/shape.js';
import { addBody, addConstraint, removeConstraint } from '../../src/core/world.js';
import { createDistanceConstraint } from '../../src/core/constraint.js';
import { createSimulation } from '../../src/sim/simulation.js';
import { PerturbationLog } from '../../src/sim/perturbation.js';
import { CanvasRenderer } from '../../src/viz/renderer.js';
import { LiveSimulation } from '../../src/viz/live.js';
import { InteractionManager, InteractionTool } from '../../src/viz/interaction.js';

/** Minimal canvas mock. */
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

  return {
    width,
    height,
    getContext: () => ctx,
    style: { cssText: '' },
  } as unknown as HTMLCanvasElement;
}

// We need a mock for requestAnimationFrame since LiveSimulation uses it
(globalThis as any).requestAnimationFrame = (cb: Function) => setTimeout(cb, 0);
(globalThis as any).cancelAnimationFrame = (id: number) => clearTimeout(id);

describe('InteractionManager', () => {
  let sim: ReturnType<typeof createSimulation>;
  let renderer: CanvasRenderer;
  let liveSim: LiveSimulation;
  let interaction: InteractionManager;

  beforeEach(() => {
    resetBodyIdCounter();
    sim = createSimulation({ gravity: new Vec2(0, 0) });
    const canvas = createMockCanvas();
    renderer = new CanvasRenderer(canvas);
    renderer.setCamera(0, 0, 40); // 40 px per world unit
    liveSim = new LiveSimulation(sim, renderer);
    interaction = new InteractionManager(liveSim, renderer);
  });

  describe('hit-test circle', () => {
    it('should return body when point is inside circle', () => {
      const body = createRigidBody({
        shape: createCircle(1),
        position: new Vec2(3, 3),
        mass: 1,
      });
      addBody(sim.world, body);

      const result = interaction.getBodyAtPoint(new Vec2(3.5, 3));
      expect(result).not.toBeNull();
      expect(result!.id).toBe(body.id);
    });

    it('should return null when point is outside circle', () => {
      const body = createRigidBody({
        shape: createCircle(1),
        position: new Vec2(3, 3),
        mass: 1,
      });
      addBody(sim.world, body);

      const result = interaction.getBodyAtPoint(new Vec2(5, 5));
      expect(result).toBeNull();
    });
  });

  describe('hit-test AABB', () => {
    it('should return body when point is inside AABB', () => {
      const body = createRigidBody({
        shape: createAABB(2, 1),
        position: new Vec2(0, 0),
        mass: 1,
      });
      addBody(sim.world, body);

      const result = interaction.getBodyAtPoint(new Vec2(1, 0.5));
      expect(result).not.toBeNull();
      expect(result!.id).toBe(body.id);
    });

    it('should return null when point is outside AABB', () => {
      const body = createRigidBody({
        shape: createAABB(2, 1),
        position: new Vec2(0, 0),
        mass: 1,
      });
      addBody(sim.world, body);

      const result = interaction.getBodyAtPoint(new Vec2(5, 5));
      expect(result).toBeNull();
    });

    it('should handle rotated AABB', () => {
      const body = createRigidBody({
        shape: createAABB(2, 0.5),
        position: new Vec2(0, 0),
        mass: 1,
      });
      body.angle = Math.PI / 2; // rotated 90 degrees
      addBody(sim.world, body);

      // After 90-degree rotation, the 2x0.5 box becomes 0.5x2
      // Point at (0, 1.5) should be inside the rotated box
      const result = interaction.getBodyAtPoint(new Vec2(0, 1.5));
      expect(result).not.toBeNull();

      // Point at (1.5, 0) should be outside (was inside before rotation)
      const result2 = interaction.getBodyAtPoint(new Vec2(1.5, 0));
      expect(result2).toBeNull();
    });
  });

  describe('force application', () => {
    it('should change body velocity when force is applied', () => {
      const body = createRigidBody({
        shape: createCircle(1),
        position: new Vec2(0, 0),
        mass: 1,
      });
      addBody(sim.world, body);

      expect(body.velocity.x).toBe(0);
      expect(body.velocity.y).toBe(0);

      interaction.setTool(InteractionTool.ApplyForce);

      // Simulate mousedown on body center (screen coords for world 0,0)
      const screenCenter = renderer.worldToScreen(0, 0);
      interaction.onMouseDown(screenCenter.x, screenCenter.y);

      // Drag 100px to the right in world coords (2.5 world units at zoom 40)
      const screenEnd = renderer.worldToScreen(2.5, 0);
      interaction.onMouseMove(screenEnd.x, screenEnd.y);
      interaction.onMouseUp(screenEnd.x, screenEnd.y);

      // Force = delta * forceScale = (2.5, 0) * 50 = (125, 0)
      // dv = force / mass = (125, 0) / 1 = (125, 0)
      expect(body.velocity.x).toBeGreaterThan(0);
    });

    it('should record perturbation when force is applied', () => {
      const body = createRigidBody({
        shape: createCircle(1),
        position: new Vec2(0, 0),
        mass: 1,
      });
      addBody(sim.world, body);

      interaction.setTool(InteractionTool.ApplyForce);
      const screenCenter = renderer.worldToScreen(0, 0);
      interaction.onMouseDown(screenCenter.x, screenCenter.y);
      const screenEnd = renderer.worldToScreen(1, 0);
      interaction.onMouseUp(screenEnd.x, screenEnd.y);

      const log = interaction.getPerturbationLog();
      const entries = log.getAll();
      expect(entries.length).toBe(1);
      expect(entries[0].type).toBe('force');
    });
  });

  describe('constraint removal', () => {
    it('should remove constraint from world when break tool clicks it', () => {
      const bodyA = createRigidBody({
        shape: createCircle(1),
        position: new Vec2(-2, 0),
        mass: 1,
      });
      const bodyB = createRigidBody({
        shape: createCircle(1),
        position: new Vec2(2, 0),
        mass: 1,
      });
      addBody(sim.world, bodyA);
      addBody(sim.world, bodyB);

      const constraint = createDistanceConstraint({
        bodyA,
        bodyB,
      });
      addConstraint(sim.world, constraint);

      expect(sim.world.constraints.length).toBe(1);

      interaction.setTool(InteractionTool.BreakJoint);

      // Click on the midpoint of the constraint (0, 0)
      const screenMid = renderer.worldToScreen(0, 0);
      interaction.onMouseDown(screenMid.x, screenMid.y);

      expect(sim.world.constraints.length).toBe(0);
    });

    it('should record perturbation when constraint is broken', () => {
      const bodyA = createRigidBody({
        shape: createCircle(1),
        position: new Vec2(-1, 0),
        mass: 1,
      });
      const bodyB = createRigidBody({
        shape: createCircle(1),
        position: new Vec2(1, 0),
        mass: 1,
      });
      addBody(sim.world, bodyA);
      addBody(sim.world, bodyB);

      const constraint = createDistanceConstraint({ bodyA, bodyB });
      addConstraint(sim.world, constraint);

      interaction.setTool(InteractionTool.BreakJoint);
      const screenMid = renderer.worldToScreen(0, 0);
      interaction.onMouseDown(screenMid.x, screenMid.y);

      const log = interaction.getPerturbationLog();
      const entries = log.getAll();
      expect(entries.length).toBe(1);
      expect(entries[0].type).toBe('break-joint');
    });
  });

  describe('object drop', () => {
    it('should add a new body to the world when drop tool clicks', () => {
      const initialCount = sim.world.bodies.length;

      interaction.setTool(InteractionTool.DropObject);
      const screenPos = renderer.worldToScreen(5, 5);
      interaction.onMouseDown(screenPos.x, screenPos.y);

      expect(sim.world.bodies.length).toBe(initialCount + 1);

      const newBody = sim.world.bodies[sim.world.bodies.length - 1];
      expect(newBody.position.x).toBeCloseTo(5, 0);
      expect(newBody.position.y).toBeCloseTo(5, 0);
    });

    it('should drop a box when dropObjectType is box', () => {
      interaction.setTool(InteractionTool.DropObject);
      interaction.dropObjectType = 'box';

      const screenPos = renderer.worldToScreen(3, 3);
      interaction.onMouseDown(screenPos.x, screenPos.y);

      const newBody = sim.world.bodies[sim.world.bodies.length - 1];
      expect(newBody.shape.type).toBe('aabb');
    });

    it('should record perturbation when object is dropped', () => {
      interaction.setTool(InteractionTool.DropObject);
      const screenPos = renderer.worldToScreen(2, 2);
      interaction.onMouseDown(screenPos.x, screenPos.y);

      const log = interaction.getPerturbationLog();
      const entries = log.getAll();
      expect(entries.length).toBe(1);
      expect(entries[0].type).toBe('drop-object');
    });
  });

  describe('tool management', () => {
    it('should default to Select tool', () => {
      expect(interaction.getTool()).toBe(InteractionTool.Select);
    });

    it('should change tool', () => {
      interaction.setTool(InteractionTool.ApplyForce);
      expect(interaction.getTool()).toBe(InteractionTool.ApplyForce);
    });
  });
});

describe('PerturbationLog', () => {
  it('should record entries', () => {
    const log = new PerturbationLog();
    log.add({
      type: 'force',
      time: 1.5,
      step: 90,
      details: { bodyId: 0, force: { x: 10, y: 0 }, point: { x: 0, y: 0 } },
    });
    log.add({
      type: 'break-joint',
      time: 2.0,
      step: 120,
      details: { constraintIndex: 0 },
    });

    expect(log.getAll().length).toBe(2);
    expect(log.getAll()[0].type).toBe('force');
    expect(log.getAll()[1].type).toBe('break-joint');
  });

  it('should serialize to JSON', () => {
    const log = new PerturbationLog();
    log.add({
      type: 'drop-object',
      time: 0.5,
      step: 30,
      details: {
        bodyConfig: {
          shape: 'circle',
          position: { x: 1, y: 2 },
          mass: 1,
          radius: 0.5,
        },
      },
    });

    const json = log.toJSON();
    expect(json.length).toBe(1);
    expect(json[0].type).toBe('drop-object');

    // Verify it's JSON-serializable
    const str = JSON.stringify(json);
    const parsed = JSON.parse(str);
    expect(parsed[0].type).toBe('drop-object');
    expect(parsed[0].details.bodyConfig.shape).toBe('circle');
  });

  it('should return empty array when no entries', () => {
    const log = new PerturbationLog();
    expect(log.getAll()).toEqual([]);
    expect(log.toJSON()).toEqual([]);
  });
});
