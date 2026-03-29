import { ShapeType } from '../core/shape.js';
import { Simulation } from './simulation.js';
import { Contact } from '../physics/collision.js';

/** Serialized body state (all Vec2 converted to plain {x, y} objects). */
export interface BodySnapshot {
  id: number;
  shapeType: string;
  position: { x: number; y: number };
  angle: number;
  velocity: { x: number; y: number };
  angularVelocity: number;
  mass: number;
  isStatic: boolean;
  // Shape-specific fields
  radius?: number;
  halfWidth?: number;
  halfHeight?: number;
  vertices?: { x: number; y: number }[];
}

/** Serialized constraint state. */
export interface ConstraintSnapshot {
  type: string;
  bodyAId: number;
  bodyBId: number;
  broken: boolean;
}

/** Serialized contact state. */
export interface ContactSnapshot {
  bodyAId: number;
  bodyBId: number;
  normal: { x: number; y: number };
  penetration: number;
  point: { x: number; y: number };
}

/** Complete world state at a single point in time. */
export interface WorldSnapshot {
  time: number;
  step: number;
  bodies: BodySnapshot[];
  constraints: ConstraintSnapshot[];
  contacts: ContactSnapshot[];
}

/**
 * Capture a full snapshot of the current simulation state.
 * All Vec2 values are serialized to plain {x, y} objects for JSON compatibility.
 */
export function captureSnapshot(sim: Simulation): WorldSnapshot {
  const bodies: BodySnapshot[] = sim.world.bodies.map((body) => {
    const snap: BodySnapshot = {
      id: body.id,
      shapeType: body.shape.type,
      position: { x: body.position.x, y: body.position.y },
      angle: body.angle,
      velocity: { x: body.velocity.x, y: body.velocity.y },
      angularVelocity: body.angularVelocity,
      mass: body.isStatic ? 0 : body.mass, // serialize static mass as 0 (Infinity is not valid JSON)
      isStatic: body.isStatic,
    };

    switch (body.shape.type) {
      case ShapeType.Circle:
        snap.radius = body.shape.radius;
        break;
      case ShapeType.AABB:
        snap.halfWidth = body.shape.halfWidth;
        snap.halfHeight = body.shape.halfHeight;
        break;
      case ShapeType.Polygon:
        snap.vertices = body.shape.vertices.map((v) => ({ x: v.x, y: v.y }));
        break;
    }

    return snap;
  });

  const constraints: ConstraintSnapshot[] = sim.world.constraints.map((c) => ({
    type: c.type,
    bodyAId: c.bodyA.id,
    bodyBId: c.bodyB.id,
    broken: c.broken,
  }));

  const contacts: ContactSnapshot[] = (sim.contacts ?? []).map((c: Contact) => ({
    bodyAId: c.bodyA.id,
    bodyBId: c.bodyB?.id ?? -1,
    normal: { x: c.normal.x, y: c.normal.y },
    penetration: c.penetration,
    point: { x: c.point.x, y: c.point.y },
  }));

  return {
    time: sim.world.time,
    step: sim.stepCount,
    bodies,
    constraints,
    contacts,
  };
}
