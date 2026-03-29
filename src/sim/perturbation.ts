import { Vec2 } from '../math/vec2.js';

/** Details for a force perturbation. */
export interface ForceDetails {
  bodyId: number;
  force: { x: number; y: number };
  point: { x: number; y: number };
}

/** Details for a break-joint perturbation. */
export interface BreakDetails {
  constraintIndex: number;
}

/** Details for a drop-object perturbation. */
export interface DropDetails {
  bodyConfig: {
    shape: 'circle' | 'box';
    position: { x: number; y: number };
    mass: number;
    radius?: number;
    halfWidth?: number;
    halfHeight?: number;
  };
}

/** A recorded perturbation event. */
export interface Perturbation {
  type: 'force' | 'break-joint' | 'drop-object';
  time: number;
  step: number;
  details: ForceDetails | BreakDetails | DropDetails;
}

/** Logs all user perturbations applied during a simulation. */
export class PerturbationLog {
  private entries: Perturbation[] = [];

  /** Add a perturbation record. */
  add(p: Perturbation): void {
    this.entries.push(p);
  }

  /** Get all recorded perturbations. */
  getAll(): Perturbation[] {
    return [...this.entries];
  }

  /** Serialize the log to a JSON-compatible object. */
  toJSON(): Perturbation[] {
    return this.entries.map(p => ({ ...p }));
  }
}
