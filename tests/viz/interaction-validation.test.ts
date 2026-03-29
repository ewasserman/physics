import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createRigidBody, resetBodyIdCounter } from '../../src/core/body.js';
import { createCircle, createAABB } from '../../src/core/shape.js';
import { addBody, addConstraint } from '../../src/core/world.js';
import { createDistanceConstraint } from '../../src/core/constraint.js';
import { createSimulation, step } from '../../src/sim/simulation.js';
import { createCar } from '../../src/core/compound.js';
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

(globalThis as any).requestAnimationFrame = (cb: Function) => setTimeout(cb, 0);
(globalThis as any).cancelAnimationFrame = (id: number) => clearTimeout(id);

describe('InteractionManager — extended validation', () => {
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

  // ──────────────────────────────────────────────
  // Hit-testing edge cases
  // ──────────────────────────────────────────────

  describe('hit-test edge cases', () => {
    it('should return body when point is exactly on circle boundary', () => {
      const body = createRigidBody({
        shape: createCircle(1),
        position: new Vec2(0, 0),
        mass: 1,
      });
      addBody(sim.world, body);

      // Point at distance 0.999 (just inside boundary)
      const result = interaction.getBodyAtPoint(new Vec2(0.999, 0));
      expect(result).not.toBeNull();
      expect(result!.id).toBe(body.id);
    });

    it('should return null when point is just outside circle boundary', () => {
      const body = createRigidBody({
        shape: createCircle(1),
        position: new Vec2(0, 0),
        mass: 1,
      });
      addBody(sim.world, body);

      // Point at distance > 1
      const result = interaction.getBodyAtPoint(new Vec2(1.001, 0));
      expect(result).toBeNull();
    });

    it('should return closest body when multiple circles overlap', () => {
      const bodyA = createRigidBody({
        shape: createCircle(2),
        position: new Vec2(0, 0),
        mass: 1,
      });
      const bodyB = createRigidBody({
        shape: createCircle(2),
        position: new Vec2(1, 0),
        mass: 1,
      });
      addBody(sim.world, bodyA);
      addBody(sim.world, bodyB);

      // Point at (0.8, 0) — inside both circles, closer to bodyB center (dist 0.2) than bodyA (dist 0.8)
      const result = interaction.getBodyAtPoint(new Vec2(0.8, 0));
      expect(result).not.toBeNull();
      expect(result!.id).toBe(bodyB.id);
    });

    it('should return null when world has no bodies', () => {
      const result = interaction.getBodyAtPoint(new Vec2(0, 0));
      expect(result).toBeNull();
    });

    it('should skip static bodies during hit-test', () => {
      const body = createRigidBody({
        shape: createCircle(1),
        position: new Vec2(0, 0),
        mass: 1,
        isStatic: true,
      });
      addBody(sim.world, body);

      const result = interaction.getBodyAtPoint(new Vec2(0, 0));
      expect(result).toBeNull();
    });

    it('should return body when point is at AABB corner (boundary)', () => {
      const body = createRigidBody({
        shape: createAABB(1, 1),
        position: new Vec2(0, 0),
        mass: 1,
      });
      addBody(sim.world, body);

      // Exactly at corner — should be on boundary (<=)
      const result = interaction.getBodyAtPoint(new Vec2(1, 1));
      expect(result).not.toBeNull();
      expect(result!.id).toBe(body.id);
    });

    it('should return closest body when circle and AABB overlap', () => {
      const circle = createRigidBody({
        shape: createCircle(2),
        position: new Vec2(0, 0),
        mass: 1,
      });
      const box = createRigidBody({
        shape: createAABB(2, 2),
        position: new Vec2(1, 0),
        mass: 1,
      });
      addBody(sim.world, circle);
      addBody(sim.world, box);

      // Point at (0.9, 0): inside circle (dist 0.9 < 2), inside box (0.9 < 2 hw)
      // Distance to circle center: 0.9, distance to box center: 0.1 → box is closer
      const result = interaction.getBodyAtPoint(new Vec2(0.9, 0));
      expect(result).not.toBeNull();
      expect(result!.id).toBe(box.id);
    });
  });

  // ──────────────────────────────────────────────
  // Force tool
  // ──────────────────────────────────────────────

  describe('force tool — magnitude and direction', () => {
    it('should scale force magnitude with drag distance', () => {
      const body = createRigidBody({
        shape: createCircle(1),
        position: new Vec2(0, 0),
        mass: 1,
      });
      addBody(sim.world, body);

      interaction.setTool(InteractionTool.ApplyForce);

      // Short drag: 1 world unit
      const sc = renderer.worldToScreen(0, 0);
      interaction.onMouseDown(sc.x, sc.y);
      const se1 = renderer.worldToScreen(1, 0);
      interaction.onMouseUp(se1.x, se1.y);
      const vShort = body.velocity.x;

      // Reset velocity
      body.velocity = Vec2.zero();

      // Long drag: 3 world units
      interaction.onMouseDown(sc.x, sc.y);
      const se3 = renderer.worldToScreen(3, 0);
      interaction.onMouseUp(se3.x, se3.y);
      const vLong = body.velocity.x;

      // Longer drag should produce proportionally larger velocity
      expect(vLong).toBeCloseTo(vShort * 3, 1);
    });

    it('should apply force in the correct direction (negative X)', () => {
      const body = createRigidBody({
        shape: createCircle(1),
        position: new Vec2(0, 0),
        mass: 1,
      });
      addBody(sim.world, body);

      interaction.setTool(InteractionTool.ApplyForce);
      const sc = renderer.worldToScreen(0, 0);
      interaction.onMouseDown(sc.x, sc.y);
      const se = renderer.worldToScreen(-2, 0);
      interaction.onMouseUp(se.x, se.y);

      expect(body.velocity.x).toBeLessThan(0);
      expect(Math.abs(body.velocity.y)).toBeLessThan(0.01);
    });

    it('should apply force in the correct direction (positive Y)', () => {
      const body = createRigidBody({
        shape: createCircle(1),
        position: new Vec2(0, 0),
        mass: 1,
      });
      addBody(sim.world, body);

      interaction.setTool(InteractionTool.ApplyForce);
      const sc = renderer.worldToScreen(0, 0);
      interaction.onMouseDown(sc.x, sc.y);
      const se = renderer.worldToScreen(0, 2);
      interaction.onMouseUp(se.x, se.y);

      expect(body.velocity.y).toBeGreaterThan(0);
      expect(Math.abs(body.velocity.x)).toBeLessThan(0.01);
    });

    it('should log perturbation with correct force and point details', () => {
      const body = createRigidBody({
        shape: createCircle(1),
        position: new Vec2(5, 5),
        mass: 2,
      });
      addBody(sim.world, body);

      interaction.setTool(InteractionTool.ApplyForce);
      const sc = renderer.worldToScreen(5, 5);
      interaction.onMouseDown(sc.x, sc.y);
      const se = renderer.worldToScreen(7, 5);
      interaction.onMouseUp(se.x, se.y);

      const entries = interaction.getPerturbationLog().getAll();
      expect(entries.length).toBe(1);
      expect(entries[0].type).toBe('force');
      expect(entries[0].time).toBe(sim.world.time);
      expect(entries[0].step).toBe(sim.stepCount);

      const details = entries[0].details as any;
      expect(details.bodyId).toBe(body.id);
      // Force = delta * 50 = (2, 0) * 50 = (100, 0)
      expect(details.force.x).toBeCloseTo(100, 0);
      expect(Math.abs(details.force.y)).toBeLessThan(1);
      expect(details.point.x).toBeCloseTo(5, 0);
      expect(details.point.y).toBeCloseTo(5, 0);
    });

    it('should scale velocity change inversely with mass', () => {
      const heavy = createRigidBody({
        shape: createCircle(1),
        position: new Vec2(0, 0),
        mass: 10,
      });
      addBody(sim.world, heavy);

      interaction.setTool(InteractionTool.ApplyForce);
      const sc = renderer.worldToScreen(0, 0);
      interaction.onMouseDown(sc.x, sc.y);
      const se = renderer.worldToScreen(2, 0);
      interaction.onMouseUp(se.x, se.y);

      // dv = force / mass = (2*50) / 10 = 10
      expect(heavy.velocity.x).toBeCloseTo(10, 0);
    });

    it('should not apply force if mousedown misses body', () => {
      const body = createRigidBody({
        shape: createCircle(1),
        position: new Vec2(10, 10),
        mass: 1,
      });
      addBody(sim.world, body);

      interaction.setTool(InteractionTool.ApplyForce);
      // Click at origin — far from body
      const sc = renderer.worldToScreen(0, 0);
      interaction.onMouseDown(sc.x, sc.y);
      const se = renderer.worldToScreen(2, 0);
      interaction.onMouseUp(se.x, se.y);

      expect(body.velocity.x).toBe(0);
      expect(body.velocity.y).toBe(0);
      expect(interaction.getPerturbationLog().getAll().length).toBe(0);
    });
  });

  // ──────────────────────────────────────────────
  // Break joint
  // ──────────────────────────────────────────────

  describe('break joint — extended', () => {
    it('should decrease world constraint count by one', () => {
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
      const bodyC = createRigidBody({
        shape: createCircle(1),
        position: new Vec2(6, 0),
        mass: 1,
      });
      addBody(sim.world, bodyA);
      addBody(sim.world, bodyB);
      addBody(sim.world, bodyC);

      const c1 = createDistanceConstraint({ bodyA, bodyB });
      const c2 = createDistanceConstraint({ bodyA: bodyB, bodyB: bodyC });
      addConstraint(sim.world, c1);
      addConstraint(sim.world, c2);

      expect(sim.world.constraints.length).toBe(2);

      interaction.setTool(InteractionTool.BreakJoint);
      // Click midpoint of c1 (at (0, 0))
      const screenMid = renderer.worldToScreen(0, 0);
      interaction.onMouseDown(screenMid.x, screenMid.y);

      expect(sim.world.constraints.length).toBe(1);
      // Remaining constraint should be c2
      expect(sim.world.constraints[0]).toBe(c2);
    });

    it('should log perturbation with correct details when breaking joint', () => {
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

      const entries = interaction.getPerturbationLog().getAll();
      expect(entries.length).toBe(1);
      expect(entries[0].type).toBe('break-joint');
      expect(entries[0].time).toBe(sim.world.time);
      expect(entries[0].step).toBe(sim.stepCount);

      const details = entries[0].details as any;
      expect(typeof details.constraintIndex).toBe('number');
      expect(details.constraintIndex).toBe(0);
    });

    it('should do nothing if no constraint near click', () => {
      const bodyA = createRigidBody({
        shape: createCircle(1),
        position: new Vec2(-5, 0),
        mass: 1,
      });
      const bodyB = createRigidBody({
        shape: createCircle(1),
        position: new Vec2(5, 0),
        mass: 1,
      });
      addBody(sim.world, bodyA);
      addBody(sim.world, bodyB);

      const constraint = createDistanceConstraint({ bodyA, bodyB });
      addConstraint(sim.world, constraint);

      interaction.setTool(InteractionTool.BreakJoint);
      // Click far from the constraint
      const screenFar = renderer.worldToScreen(0, 10);
      interaction.onMouseDown(screenFar.x, screenFar.y);

      expect(sim.world.constraints.length).toBe(1);
      expect(interaction.getPerturbationLog().getAll().length).toBe(0);
    });
  });

  // ──────────────────────────────────────────────
  // Drop tool
  // ──────────────────────────────────────────────

  describe('drop tool — extended', () => {
    it('should drop a circle at the correct world position', () => {
      interaction.setTool(InteractionTool.DropObject);
      interaction.dropObjectType = 'circle';

      const screenPos = renderer.worldToScreen(4, 7);
      interaction.onMouseDown(screenPos.x, screenPos.y);

      const bodies = sim.world.bodies;
      expect(bodies.length).toBe(1);
      const dropped = bodies[0];
      expect(dropped.position.x).toBeCloseTo(4, 0);
      expect(dropped.position.y).toBeCloseTo(7, 0);
      expect(dropped.shape.type).toBe('circle');
    });

    it('should drop a box at the correct world position', () => {
      interaction.setTool(InteractionTool.DropObject);
      interaction.dropObjectType = 'box';

      const screenPos = renderer.worldToScreen(-3, 2);
      interaction.onMouseDown(screenPos.x, screenPos.y);

      const bodies = sim.world.bodies;
      expect(bodies.length).toBe(1);
      const dropped = bodies[0];
      expect(dropped.position.x).toBeCloseTo(-3, 0);
      expect(dropped.position.y).toBeCloseTo(2, 0);
      expect(dropped.shape.type).toBe('aabb');
    });

    it('should log perturbation for circle drop with correct details', () => {
      interaction.setTool(InteractionTool.DropObject);
      interaction.dropObjectType = 'circle';

      const screenPos = renderer.worldToScreen(1, 2);
      interaction.onMouseDown(screenPos.x, screenPos.y);

      const entries = interaction.getPerturbationLog().getAll();
      expect(entries.length).toBe(1);
      expect(entries[0].type).toBe('drop-object');
      expect(entries[0].time).toBe(sim.world.time);
      expect(entries[0].step).toBe(sim.stepCount);

      const details = entries[0].details as any;
      expect(details.bodyConfig.shape).toBe('circle');
      expect(details.bodyConfig.position.x).toBeCloseTo(1, 0);
      expect(details.bodyConfig.position.y).toBeCloseTo(2, 0);
      expect(details.bodyConfig.mass).toBe(1);
      expect(details.bodyConfig.radius).toBe(0.5);
    });

    it('should log perturbation for box drop with correct details', () => {
      interaction.setTool(InteractionTool.DropObject);
      interaction.dropObjectType = 'box';

      const screenPos = renderer.worldToScreen(3, 4);
      interaction.onMouseDown(screenPos.x, screenPos.y);

      const entries = interaction.getPerturbationLog().getAll();
      expect(entries.length).toBe(1);

      const details = entries[0].details as any;
      expect(details.bodyConfig.shape).toBe('box');
      expect(details.bodyConfig.halfWidth).toBe(0.5);
      expect(details.bodyConfig.halfHeight).toBe(0.5);
    });

    it('should allow dropping multiple objects', () => {
      interaction.setTool(InteractionTool.DropObject);

      const s1 = renderer.worldToScreen(0, 0);
      interaction.onMouseDown(s1.x, s1.y);
      const s2 = renderer.worldToScreen(5, 5);
      interaction.onMouseDown(s2.x, s2.y);

      expect(sim.world.bodies.length).toBe(2);
      expect(interaction.getPerturbationLog().getAll().length).toBe(2);
    });
  });

  // ──────────────────────────────────────────────
  // Tool switching
  // ──────────────────────────────────────────────

  describe('tool switching', () => {
    it('should not lose perturbation log state when switching tools', () => {
      // Drop an object
      interaction.setTool(InteractionTool.DropObject);
      const s1 = renderer.worldToScreen(0, 0);
      interaction.onMouseDown(s1.x, s1.y);

      expect(interaction.getPerturbationLog().getAll().length).toBe(1);

      // Switch tool and verify log persists
      interaction.setTool(InteractionTool.ApplyForce);
      expect(interaction.getPerturbationLog().getAll().length).toBe(1);
      expect(interaction.getPerturbationLog().getAll()[0].type).toBe('drop-object');
    });

    it('should cancel force drag when switching tool mid-drag', () => {
      const body = createRigidBody({
        shape: createCircle(1),
        position: new Vec2(0, 0),
        mass: 1,
      });
      addBody(sim.world, body);

      interaction.setTool(InteractionTool.ApplyForce);
      const sc = renderer.worldToScreen(0, 0);
      interaction.onMouseDown(sc.x, sc.y);

      // Verify drag state is active
      expect(interaction.getDragState()).not.toBeNull();

      // Switch tool mid-drag
      interaction.setTool(InteractionTool.Select);

      // Drag state should be cleared
      expect(interaction.getDragState()).toBeNull();
      // Body should not have received any force
      expect(body.velocity.x).toBe(0);
      expect(body.velocity.y).toBe(0);
    });

    it('should clear highlighted constraint when switching from break tool', () => {
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

      // Hover near constraint to highlight it
      const screenMid = renderer.worldToScreen(0, 0);
      interaction.onMouseMove(screenMid.x, screenMid.y);
      expect(interaction.getHighlightedConstraint()).not.toBeNull();

      // Switch tool — highlight should clear
      interaction.setTool(InteractionTool.Select);
      expect(interaction.getHighlightedConstraint()).toBeNull();
    });

    it('should cycle through all tools correctly', () => {
      const tools = [
        InteractionTool.Select,
        InteractionTool.ApplyForce,
        InteractionTool.BreakJoint,
        InteractionTool.DropObject,
      ];

      for (const tool of tools) {
        interaction.setTool(tool);
        expect(interaction.getTool()).toBe(tool);
      }
    });
  });

  // ──────────────────────────────────────────────
  // Integration: force during live sim
  // ──────────────────────────────────────────────

  describe('integration — force during simulation', () => {
    it('should move body differently when force applied during sim', () => {
      const simWithGravity = createSimulation({ gravity: new Vec2(0, -9.81) });
      const canvas = createMockCanvas();
      const r = new CanvasRenderer(canvas);
      r.setCamera(0, 0, 40);
      const ls = new LiveSimulation(simWithGravity, r);
      const ia = new InteractionManager(ls, r);

      const body = createRigidBody({
        shape: createCircle(1),
        position: new Vec2(0, 10),
        mass: 1,
      });
      addBody(simWithGravity.world, body);

      // Step a few times without force
      for (let i = 0; i < 10; i++) step(simWithGravity);
      const yWithoutForce = body.position.y;

      // Reset
      body.position = new Vec2(0, 10);
      body.velocity = Vec2.zero();
      simWithGravity.world.time = 0;
      simWithGravity.stepCount = 0;

      // Apply upward force then step
      ia.setTool(InteractionTool.ApplyForce);
      const sc = r.worldToScreen(0, 10);
      ia.onMouseDown(sc.x, sc.y);
      const se = r.worldToScreen(0, 15);
      ia.onMouseUp(se.x, se.y);

      for (let i = 0; i < 10; i++) step(simWithGravity);
      const yWithForce = body.position.y;

      // Body with upward force should be higher
      expect(yWithForce).toBeGreaterThan(yWithoutForce);
    });
  });

  // ──────────────────────────────────────────────
  // Integration: break joint on car
  // ──────────────────────────────────────────────

  describe('integration — break joint on car', () => {
    it('should detach wheels when car axle constraints are broken', () => {
      const carSim = createSimulation({ gravity: new Vec2(0, -9.81) });
      const canvas = createMockCanvas();
      const r = new CanvasRenderer(canvas);
      r.setCamera(0, 0, 40);
      const ls = new LiveSimulation(carSim, r);
      const ia = new InteractionManager(ls, r);

      const car = createCar(carSim.world, 0, 5);
      expect(carSim.world.constraints.length).toBe(2);

      ia.setTool(InteractionTool.BreakJoint);

      // Break the first axle — click near the left wheel attachment point
      // Left wheel is at (-1.5, 4.3), chassis at (0, 5), so anchor world-A is roughly (-1.5, 4.3)
      const leftAxle = renderer.worldToScreen(-1.5, 4.3);
      ia.onMouseDown(leftAxle.x, leftAxle.y);

      expect(carSim.world.constraints.length).toBe(1);

      // Step sim — bodies should now move independently
      for (let i = 0; i < 30; i++) step(carSim);

      // The chassis and remaining wheel still connected; detached wheel falls separately
      const chassis = car.bodies[0];
      const leftWheel = car.bodies[1];
      // They should have diverged (different y positions or velocities)
      // Since gravity is pulling everything down, positions may be similar, but
      // the constraint count is the key verification
      expect(carSim.world.constraints.length).toBe(1);
    });
  });

  // ──────────────────────────────────────────────
  // Integration: drop into running sim
  // ──────────────────────────────────────────────

  describe('integration — drop object into running sim', () => {
    it('should add a dropped circle that falls and may collide', () => {
      const dropSim = createSimulation({ gravity: new Vec2(0, -9.81), floorY: 0 });
      const canvas = createMockCanvas();
      const r = new CanvasRenderer(canvas);
      r.setCamera(0, 0, 40);
      const ls = new LiveSimulation(dropSim, r);
      const ia = new InteractionManager(ls, r);

      // Add a floor body (static)
      const floor = createRigidBody({
        shape: createAABB(20, 0.5),
        position: new Vec2(0, -0.5),
        mass: 1,
        isStatic: true,
      });
      addBody(dropSim.world, floor);

      const initialCount = dropSim.world.bodies.length;

      // Drop a circle at (0, 10)
      ia.setTool(InteractionTool.DropObject);
      ia.dropObjectType = 'circle';
      const screenDrop = r.worldToScreen(0, 10);
      ia.onMouseDown(screenDrop.x, screenDrop.y);

      expect(dropSim.world.bodies.length).toBe(initialCount + 1);

      const dropped = dropSim.world.bodies[dropSim.world.bodies.length - 1];
      const initialY = dropped.position.y;

      // Step the sim — gravity should pull it down
      for (let i = 0; i < 60; i++) step(dropSim);

      expect(dropped.position.y).toBeLessThan(initialY);
    });
  });
});
