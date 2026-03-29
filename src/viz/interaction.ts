import { Vec2 } from '../math/vec2.js';
import { RigidBody } from '../core/body.js';
import { Constraint } from '../core/constraint.js';
import { ShapeType } from '../core/shape.js';
import { createCircle, createAABB } from '../core/shape.js';
import { createRigidBody } from '../core/body.js';
import { addBody, removeConstraint } from '../core/world.js';
import { localToWorld } from '../core/constraint.js';
import { LiveSimulation } from './live.js';
import { CanvasRenderer } from './renderer.js';
import { PerturbationLog } from '../sim/perturbation.js';
import type { ForceDetails, BreakDetails, DropDetails } from '../sim/perturbation.js';

/** Available interaction tools. */
export enum InteractionTool {
  Select = 'select',
  ApplyForce = 'apply-force',
  BreakJoint = 'break-joint',
  DropObject = 'drop-object',
}

/** Configuration for the drop object tool. */
export type DropObjectType = 'circle' | 'box';

/** Configuration for the interaction manager. */
export interface InteractionConfig {
  /** Force scaling: Newtons per 100 pixels of drag. Default 50. */
  forceScale?: number;
  /** Hit-test proximity threshold for constraints (in world units). Default 0.5. */
  constraintHitRadius?: number;
  /** Default object type for Drop tool. */
  dropObjectType?: DropObjectType;
}

/** State during a force-drag operation. */
interface ForceDragState {
  body: RigidBody;
  startWorld: Vec2;
  currentWorld: Vec2;
}

/**
 * Manages user interactions with the simulation via mouse events.
 * Translates screen coordinates to world coordinates and dispatches
 * to per-tool handlers.
 */
export class InteractionManager {
  private liveSim: LiveSimulation;
  private renderer: CanvasRenderer;
  private tool: InteractionTool = InteractionTool.Select;
  private forceScale: number;
  private constraintHitRadius: number;
  private _dropObjectType: DropObjectType;
  private perturbationLog: PerturbationLog;

  // Force tool drag state
  private dragState: ForceDragState | null = null;

  // Break tool hover state
  private highlightedConstraint: Constraint | null = null;

  constructor(
    liveSim: LiveSimulation,
    renderer: CanvasRenderer,
    config: InteractionConfig = {},
  ) {
    this.liveSim = liveSim;
    this.renderer = renderer;
    this.forceScale = config.forceScale ?? 50;
    this.constraintHitRadius = config.constraintHitRadius ?? 0.5;
    this._dropObjectType = config.dropObjectType ?? 'circle';
    this.perturbationLog = new PerturbationLog();
  }

  /** Set the active tool. */
  setTool(tool: InteractionTool): void {
    this.tool = tool;
    // Clear any in-progress state
    this.dragState = null;
    this.highlightedConstraint = null;
  }

  /** Get the active tool. */
  getTool(): InteractionTool {
    return this.tool;
  }

  /** Set the drop object type. */
  set dropObjectType(type: DropObjectType) {
    this._dropObjectType = type;
  }

  get dropObjectType(): DropObjectType {
    return this._dropObjectType;
  }

  /** Get the perturbation log. */
  getPerturbationLog(): PerturbationLog {
    return this.perturbationLog;
  }

  /** Get the current force drag state (for rendering the arrow). */
  getDragState(): ForceDragState | null {
    return this.dragState;
  }

  /** Get the currently highlighted constraint (for rendering). */
  getHighlightedConstraint(): Constraint | null {
    return this.highlightedConstraint;
  }

  /**
   * Hit-test: find the body at a world-space point.
   * Checks circles (distance < radius) and AABBs (point in rotated rect).
   * Returns the closest body if multiple overlap.
   */
  getBodyAtPoint(worldPos: Vec2): RigidBody | null {
    const world = this.liveSim.getSimulation().world;
    let closest: RigidBody | null = null;
    let closestDist = Infinity;

    for (const body of world.bodies) {
      if (body.isStatic) continue;

      const dx = worldPos.x - body.position.x;
      const dy = worldPos.y - body.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      switch (body.shape.type) {
        case ShapeType.Circle: {
          if (dist < body.shape.radius && dist < closestDist) {
            closest = body;
            closestDist = dist;
          }
          break;
        }
        case ShapeType.AABB: {
          // Rotate point into body-local space
          const localPoint = new Vec2(dx, dy).rotate(-body.angle);
          if (
            Math.abs(localPoint.x) <= body.shape.halfWidth &&
            Math.abs(localPoint.y) <= body.shape.halfHeight
          ) {
            if (dist < closestDist) {
              closest = body;
              closestDist = dist;
            }
          }
          break;
        }
        case ShapeType.Polygon: {
          // Simple bounding check - use distance for priority
          // For polygons, check if point is inside using cross-product winding
          const localPoint = new Vec2(dx, dy).rotate(-body.angle);
          const verts = body.shape.vertices;
          let inside = true;
          for (let i = 0; i < verts.length; i++) {
            const a = verts[i];
            const b = verts[(i + 1) % verts.length];
            const edge = b.sub(a);
            const toPoint = localPoint.sub(a);
            if (edge.cross(toPoint) < 0) {
              inside = false;
              break;
            }
          }
          if (inside && dist < closestDist) {
            closest = body;
            closestDist = dist;
          }
          break;
        }
      }
    }

    return closest;
  }

  /**
   * Hit-test: find the nearest constraint within the proximity threshold.
   * Uses distance from point to line segment between constraint anchor points.
   */
  getConstraintAtPoint(worldPos: Vec2): Constraint | null {
    const world = this.liveSim.getSimulation().world;
    let nearest: Constraint | null = null;
    let nearestDist = this.constraintHitRadius;

    for (const constraint of world.constraints) {
      if (constraint.broken) continue;

      const worldA = localToWorld(constraint.bodyA, constraint.anchorA);
      const worldB = localToWorld(constraint.bodyB, constraint.anchorB);

      const dist = pointToSegmentDistance(worldPos, worldA, worldB);
      if (dist < nearestDist) {
        nearest = constraint;
        nearestDist = dist;
      }
    }

    return nearest;
  }

  // --- Mouse event handlers ---

  /** Handle mousedown event. screenX/screenY are canvas-relative pixel coords. */
  onMouseDown(screenX: number, screenY: number): void {
    const worldPos = this.renderer.screenToWorld(screenX, screenY);
    const wp = new Vec2(worldPos.x, worldPos.y);

    switch (this.tool) {
      case InteractionTool.ApplyForce: {
        const body = this.getBodyAtPoint(wp);
        if (body) {
          this.dragState = {
            body,
            startWorld: wp,
            currentWorld: wp,
          };
        }
        break;
      }
      case InteractionTool.BreakJoint: {
        const constraint = this.getConstraintAtPoint(wp);
        if (constraint) {
          const world = this.liveSim.getSimulation().world;
          const idx = world.constraints.indexOf(constraint);
          removeConstraint(world, constraint);
          this.highlightedConstraint = null;

          const sim = this.liveSim.getSimulation();
          this.perturbationLog.add({
            type: 'break-joint',
            time: sim.world.time,
            step: sim.stepCount,
            details: { constraintIndex: idx } as BreakDetails,
          });
        }
        break;
      }
      case InteractionTool.DropObject: {
        this.dropObjectAt(wp);
        break;
      }
    }
  }

  /** Handle mousemove event. */
  onMouseMove(screenX: number, screenY: number): void {
    const worldPos = this.renderer.screenToWorld(screenX, screenY);
    const wp = new Vec2(worldPos.x, worldPos.y);

    switch (this.tool) {
      case InteractionTool.ApplyForce: {
        if (this.dragState) {
          this.dragState.currentWorld = wp;
        }
        break;
      }
      case InteractionTool.BreakJoint: {
        this.highlightedConstraint = this.getConstraintAtPoint(wp);
        break;
      }
    }
  }

  /** Handle mouseup event. */
  onMouseUp(screenX: number, screenY: number): void {
    const worldPos = this.renderer.screenToWorld(screenX, screenY);
    const wp = new Vec2(worldPos.x, worldPos.y);

    switch (this.tool) {
      case InteractionTool.ApplyForce: {
        if (this.dragState) {
          const { body, startWorld } = this.dragState;
          const delta = wp.sub(startWorld);
          // forceScale N per 100px of drag, convert world distance to force
          // We use world-space distance, then scale
          const force = delta.scale(this.forceScale);

          // Apply as impulse: change velocity directly (impulse = force * dt, but we treat as direct velocity change)
          // For a proper impulse: dv = F / m, but we want the drag to feel like an impulse
          // impulse = force vector, dv = impulse / mass
          if (!body.isStatic) {
            body.velocity = body.velocity.add(force.scale(1 / body.mass));
          }

          const sim = this.liveSim.getSimulation();
          this.perturbationLog.add({
            type: 'force',
            time: sim.world.time,
            step: sim.stepCount,
            details: {
              bodyId: body.id,
              force: { x: force.x, y: force.y },
              point: { x: startWorld.x, y: startWorld.y },
            } as ForceDetails,
          });

          this.dragState = null;
        }
        break;
      }
    }
  }

  /** Drop a new object at the given world position. */
  private dropObjectAt(worldPos: Vec2): void {
    const sim = this.liveSim.getSimulation();
    let shape;
    let details: DropDetails;

    if (this._dropObjectType === 'box') {
      shape = createAABB(0.5, 0.5);
      details = {
        bodyConfig: {
          shape: 'box',
          position: { x: worldPos.x, y: worldPos.y },
          mass: 1,
          halfWidth: 0.5,
          halfHeight: 0.5,
        },
      };
    } else {
      shape = createCircle(0.5);
      details = {
        bodyConfig: {
          shape: 'circle',
          position: { x: worldPos.x, y: worldPos.y },
          mass: 1,
          radius: 0.5,
        },
      };
    }

    const body = createRigidBody({
      shape,
      position: worldPos,
      mass: 1,
    });
    addBody(sim.world, body);

    this.perturbationLog.add({
      type: 'drop-object',
      time: sim.world.time,
      step: sim.stepCount,
      details,
    });
  }
}

/**
 * Compute distance from a point to a line segment.
 */
function pointToSegmentDistance(p: Vec2, a: Vec2, b: Vec2): number {
  const ab = b.sub(a);
  const ap = p.sub(a);
  const abLenSq = ab.lengthSq();

  if (abLenSq === 0) return ap.length();

  let t = ap.dot(ab) / abLenSq;
  t = Math.max(0, Math.min(1, t));

  const closest = a.add(ab.scale(t));
  return p.sub(closest).length();
}
