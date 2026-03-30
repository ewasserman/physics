import { Vec2 } from '../math/vec2.js';
import { createSimulation, Simulation } from '../sim/simulation.js';
import { createRigidBody } from '../core/body.js';
import { createCircle, createAABB } from '../core/shape.js';
import { addBody, addConstraint } from '../core/world.js';
import { createBoundary } from '../core/environment.js';
import { createCar } from '../core/compound.js';
import { createRevoluteConstraint } from '../core/constraint.js';

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

/** Double pendulum — chaotic swinging from a fixed anchor. */
export function demoDoublePendulum(): Simulation {
  const sim = createSimulation({
    gravity: new Vec2(0, -9.81),
    floorY: -Infinity,
  });

  // Static anchor at top-center
  const anchor = createRigidBody({
    shape: createCircle(0.15),
    position: new Vec2(0, 10),
    mass: 0,
  });
  addBody(sim.world, anchor);

  // First arm
  const arm1 = createRigidBody({
    shape: createCircle(0.4),
    position: new Vec2(0, 8),
    mass: 2,
    restitution: 0.3,
    friction: 0.2,
  });
  addBody(sim.world, arm1);

  // Revolute constraint: anchor -> arm1
  const joint1 = createRevoluteConstraint({
    bodyA: anchor,
    bodyB: arm1,
    anchorA: Vec2.zero(),
    anchorB: Vec2.zero(),
    stiffness: 1.0,
  });
  addConstraint(sim.world, joint1);

  // Second arm — offset to the right to start chaotic motion
  const arm2 = createRigidBody({
    shape: createCircle(0.4),
    position: new Vec2(1, 6),
    mass: 2,
    restitution: 0.3,
    friction: 0.2,
    velocity: new Vec2(2, 0),
  });
  addBody(sim.world, arm2);

  // Revolute constraint: arm1 -> arm2
  const joint2 = createRevoluteConstraint({
    bodyA: arm1,
    bodyB: arm2,
    anchorA: Vec2.zero(),
    anchorB: Vec2.zero(),
    stiffness: 1.0,
  });
  addConstraint(sim.world, joint2);

  return sim;
}

/** Chain of circular links hanging from a fixed anchor. */
export function demoChain(linkCount = 8, linkSize = 0.3): Simulation {
  const sim = createSimulation({
    gravity: new Vec2(0, -9.81),
    floorY: -Infinity,
  });

  const anchorY = 12;

  // Static anchor at top-center
  const anchor = createRigidBody({
    shape: createCircle(0.15),
    position: new Vec2(0, anchorY),
    mass: 0,
  });
  addBody(sim.world, anchor);

  let prevBody = anchor;
  const spacing = linkSize * 2.5;

  for (let i = 0; i < linkCount; i++) {
    const link = createRigidBody({
      shape: createCircle(linkSize),
      position: new Vec2(0, anchorY - (i + 1) * spacing),
      mass: 1,
      restitution: 0.3,
      friction: 0.3,
    });
    addBody(sim.world, link);

    const joint = createRevoluteConstraint({
      bodyA: prevBody,
      bodyB: link,
      anchorA: Vec2.zero(),
      anchorB: Vec2.zero(),
      stiffness: 1.0,
    });
    addConstraint(sim.world, joint);

    prevBody = link;
  }

  // Give the last link a nudge to start swinging
  prevBody.velocity = new Vec2(3, 0);

  return sim;
}
