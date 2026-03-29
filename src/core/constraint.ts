import { RigidBody } from './body.js';

/** Constraint types (stubs for Phase 3). */
export enum ConstraintType {
  Distance = 'distance',
  Revolute = 'revolute',
  Fixed = 'fixed',
}

/** Base constraint interface (stub — implementation in Phase 3). */
export interface Constraint {
  type: ConstraintType;
  bodyA: RigidBody;
  bodyB: RigidBody;
}
