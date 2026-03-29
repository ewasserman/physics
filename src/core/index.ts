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
} from './world.js';

export {
  ConstraintType,
  type Constraint,
} from './constraint.js';
