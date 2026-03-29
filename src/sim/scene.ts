import { Vec2 } from '../math/vec2.js';
import { createRigidBody } from '../core/body.js';
import { createCircle, createAABB } from '../core/shape.js';
import { addBody } from '../core/world.js';
import { createCar } from '../core/compound.js';
import { createFloor, createBoundary } from '../core/environment.js';
import { Simulation, createSimulation } from './simulation.js';

/** Configuration for a scene object. */
export type SceneObject =
  | { type: 'car'; x: number; y: number }
  | { type: 'circle'; x: number; y: number; radius: number; mass: number }
  | { type: 'box'; x: number; y: number; width: number; height: number; mass: number }
  | { type: 'static-box'; x: number; y: number; width: number; height: number }
  | { type: 'wall'; x: number; y: number; height: number };

/** Configuration for building a complete scene. */
export interface SceneConfig {
  width: number;
  height: number;
  gravity?: Vec2;
  dt?: number;
  objects: SceneObject[];
}

/**
 * Build a complete simulation from a scene configuration.
 * Creates a boundary, floor, and all specified objects.
 */
export function createScene(config: SceneConfig): Simulation {
  const gravity = config.gravity ?? new Vec2(0, -9.81);
  const dt = config.dt ?? 1 / 60;

  const sim = createSimulation({
    gravity,
    dt,
    floorY: -Infinity, // disable built-in floor; we use environment objects
  });

  // Create boundary walls
  const halfW = config.width / 2;
  const halfH = config.height / 2;
  createBoundary(sim.world, -halfW, halfW, 0, config.height);

  // Create objects
  for (const obj of config.objects) {
    switch (obj.type) {
      case 'car':
        createCar(sim.world, obj.x, obj.y);
        break;

      case 'circle': {
        const body = createRigidBody({
          shape: createCircle(obj.radius),
          position: new Vec2(obj.x, obj.y),
          mass: obj.mass,
        });
        addBody(sim.world, body);
        break;
      }

      case 'box': {
        const body = createRigidBody({
          shape: createAABB(obj.width / 2, obj.height / 2),
          position: new Vec2(obj.x, obj.y),
          mass: obj.mass,
        });
        addBody(sim.world, body);
        break;
      }

      case 'static-box': {
        const body = createRigidBody({
          shape: createAABB(obj.width / 2, obj.height / 2),
          position: new Vec2(obj.x, obj.y),
          isStatic: true,
          friction: 0.6,
          restitution: 0.3,
        });
        addBody(sim.world, body);
        break;
      }

      case 'wall': {
        const body = createRigidBody({
          shape: createAABB(0.5, obj.height / 2),
          position: new Vec2(obj.x, obj.y),
          isStatic: true,
          friction: 0.6,
          restitution: 0.3,
        });
        addBody(sim.world, body);
        break;
      }
    }
  }

  return sim;
}
