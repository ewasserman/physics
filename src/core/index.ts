export {
  ShapeType,
  type CircleShape,
  type PolygonShape,
  type AABBShape,
  type Shape,
  createCircle,
  createPolygon,
  createAABB,
  computeShapeArea,
  computeShapeInertia,
} from './shape.js';

export {
  type RigidBody,
  type CreateBodyOptions,
  createRigidBody,
  applyForce,
  resetBodyIdCounter,
} from './body.js';

export {
  type World,
  type CreateWorldOptions,
  createWorld,
  addBody,
  removeBody,
  addConstraint,
  removeConstraint,
} from './world.js';

export {
  ConstraintType,
  type ConstraintBase,
  type DistanceConstraint,
  type RevoluteConstraint,
  type FixedConstraint,
  type Constraint,
  createDistanceConstraint,
  createRevoluteConstraint,
  createFixedConstraint,
  localToWorld,
} from './constraint.js';

export {
  type CompoundObject,
  type CreateCarOptions,
  createCompoundObject,
  createCar,
  createCart,
} from './compound.js';
