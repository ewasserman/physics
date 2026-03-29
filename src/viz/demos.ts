import { Vec2 } from '../math/vec2.js';
import { createSimulation, Simulation } from '../sim/simulation.js';
import { createRigidBody } from '../core/body.js';
import { createCircle, createAABB } from '../core/shape.js';
import { addBody } from '../core/world.js';
import { createBoundary } from '../core/environment.js';
import { createCar } from '../core/compound.js';

/** 5 circles bouncing in a box. */
export function demoBouncing(): Simulation {
  const sim = createSimulation({
    gravity: new Vec2(0, -9.81),
    floorY: -Infinity,
  });

  // Create boundary: 20x15 box
  createBoundary(sim.world, -10, 10, 0, 15);

  // 5 circles at various positions with some initial velocity
  const positions = [
    { x: -4, y: 10 },
    { x: -1, y: 12 },
    { x: 2, y: 8 },
    { x: 5, y: 11 },
    { x: 0, y: 14 },
  ];

  for (let i = 0; i < positions.length; i++) {
    const p = positions[i];
    const body = createRigidBody({
      shape: createCircle(0.5 + Math.random() * 0.5),
      position: new Vec2(p.x, p.y),
      mass: 1 + Math.random(),
      restitution: 0.7,
      friction: 0.3,
      velocity: new Vec2((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 2),
    });
    addBody(sim.world, body);
  }

  return sim;
}

/** 2 cars approaching each other — they collide. */
export function demoCarCrash(): Simulation {
  const sim = createSimulation({
    gravity: new Vec2(0, -9.81),
    floorY: -Infinity,
  });

  // Ground and walls
  createBoundary(sim.world, -15, 15, 0, 10);

  // Car on the left, moving right
  const carL = createCar(sim.world, -8, 2);
  for (const body of carL.bodies) {
    if (!body.isStatic) {
      body.velocity = new Vec2(5, 0);
    }
  }

  // Car on the right, moving left
  const carR = createCar(sim.world, 8, 2);
  for (const body of carR.bodies) {
    if (!body.isStatic) {
      body.velocity = new Vec2(-5, 0);
    }
  }

  return sim;
}

/** 20 circles falling from random positions, settling. */
export function demoRain(): Simulation {
  const sim = createSimulation({
    gravity: new Vec2(0, -9.81),
    floorY: -Infinity,
  });

  // Boundary
  createBoundary(sim.world, -8, 8, 0, 25);

  // 20 circles at random positions in the upper region
  for (let i = 0; i < 20; i++) {
    const x = (Math.random() - 0.5) * 12;
    const y = 10 + Math.random() * 12;
    const r = 0.3 + Math.random() * 0.4;
    const body = createRigidBody({
      shape: createCircle(r),
      position: new Vec2(x, y),
      mass: 0.5 + Math.random(),
      restitution: 0.4,
      friction: 0.4,
    });
    addBody(sim.world, body);
  }

  return sim;
}
