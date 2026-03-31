import { Vec2 } from '../math/vec2.js';
import { createSimulation, Simulation } from '../sim/simulation.js';
import { createRigidBody } from '../core/body.js';
import { createCircle, createAABB } from '../core/shape.js';
import { addBody, addConstraint } from '../core/world.js';
import { createBoundary, createBox, createFloor } from '../core/environment.js';
import { createCar } from '../core/compound.js';
import { createRevoluteConstraint } from '../core/constraint.js';

/** 5 circles bouncing in a box. */
export function demoBouncing(): Simulation {
  const sim = createSimulation({
    gravity: new Vec2(0, -9.81),
    floorY: -Infinity,
    damping: 0.001,
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
    damping: 0.001,
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
    damping: 0.001,
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
    substeps: 8,
    solverIterations: 32,
    damping: 0,
  });

  const armLen1 = 2.4;  // upper arm 20% longer — prevents bob2 hitting the pivot
  const armLen2 = 2;
  const anchorY = 0;

  // Tiny static anchor — small so bobs rarely collide with it
  const anchor = createRigidBody({
    shape: createCircle(0.05),
    position: new Vec2(0, anchorY),
    isStatic: true,
    restitution: 1.0,
    friction: 0,
  });
  addBody(sim.world, anchor);

  // Arm1: 30° from vertical on the right (i.e. 60° from horizontal)
  const ang1 = Math.PI / 3;  // 60° from horizontal = 30° from vertical
  const arm1Pos = new Vec2(
    armLen1 * Math.cos(ang1),
    anchorY + armLen1 * Math.sin(ang1),
  );
  const arm1 = createRigidBody({
    shape: createCircle(0.2),
    position: arm1Pos,
    mass: 2,
    restitution: 1.0,
    friction: 0,
  });
  addBody(sim.world, arm1);

  const joint1 = createRevoluteConstraint({
    bodyA: anchor,
    bodyB: arm1,
    anchorA: Vec2.zero(),
    anchorB: new Vec2(0, anchorY).sub(arm1Pos),
    stiffness: 1.0,
  });
  addConstraint(sim.world, joint1);

  // Arm2: 45° from vertical on the left, above arm1
  const ang2 = Math.PI * 3 / 4;  // 135° from horizontal = 45° from vertical, left side
  const arm2Pos = new Vec2(
    arm1Pos.x + armLen2 * Math.cos(ang2),
    arm1Pos.y + armLen2 * Math.sin(ang2),
  );
  const arm2 = createRigidBody({
    shape: createCircle(0.2),
    position: arm2Pos,
    mass: 2,
    restitution: 1.0,
    friction: 0,
  });
  addBody(sim.world, arm2);

  const joint2 = createRevoluteConstraint({
    bodyA: arm1,
    bodyB: arm2,
    anchorA: Vec2.zero(),
    anchorB: arm1Pos.sub(arm2Pos),
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
    substeps: 4,
    solverIterations: 12,
  });

  const anchorY = 12;
  const spacing = linkSize * 2.5;

  // Static anchor at top-center
  const anchor = createRigidBody({
    shape: createCircle(0.15),
    position: new Vec2(0, anchorY),
    isStatic: true,
  });
  addBody(sim.world, anchor);

  let prevBody = anchor;

  for (let i = 0; i < linkCount; i++) {
    const link = createRigidBody({
      shape: createCircle(linkSize),
      position: new Vec2(0, anchorY - (i + 1) * spacing),
      mass: 1,
      restitution: 0.3,
      friction: 0.3,
    });
    addBody(sim.world, link);

    // Hinge at the bottom of prevBody / top of link
    const joint = createRevoluteConstraint({
      bodyA: prevBody,
      bodyB: link,
      anchorA: new Vec2(0, -spacing / 2),
      anchorB: new Vec2(0, spacing / 2),
      stiffness: 1.0,
    });
    addConstraint(sim.world, joint);

    prevBody = link;
  }

  // Give the last link a nudge to start swinging
  prevBody.velocity = new Vec2(3, 0);

  return sim;
}

/**
 * Chain Fountain (Mould Effect) — a long bead chain coiled in a container
 * self-siphons when one end is draped over the rim, rising above the container
 * before falling.
 */
export function demoChainFountain(): Simulation {
  const sim = createSimulation({
    gravity: new Vec2(0, -9.81),
    floorY: -Infinity,
    substeps: 8,
    solverIterations: 20,
    damping: 0,
  });

  // --- Container (open-top beaker) ---
  const cLeft = -2.5;
  const cRight = 2.5;
  const cBottom = 6;
  const cTop = 12;
  const wallThick = 0.4;
  const cCenterY = (cBottom + cTop) / 2;
  const cHeight = cTop - cBottom;
  const cWidth = cRight - cLeft;

  // Left, right, and bottom walls (no top — open)
  createBox(sim.world, cLeft - wallThick / 2, cCenterY, wallThick, cHeight);
  createBox(sim.world, cRight + wallThick / 2, cCenterY, wallThick, cHeight);
  createBox(sim.world, (cLeft + cRight) / 2, cBottom - wallThick / 2, cWidth + wallThick * 2, wallThick);

  // Circular lip on the right wall rim
  const lipRadius = 0.6;
  const lipCenter = new Vec2(cRight + wallThick / 2, cTop);
  const lip = createRigidBody({
    shape: createCircle(lipRadius),
    position: lipCenter,
    isStatic: true,
    friction: 0.01,
    restitution: 0.05,
  });
  addBody(sim.world, lip);

  // No floor — chain falls freely, building velocity from increasing weight

  // --- Build chain path ---
  // Bigger beads with constraint anchors at the bead SURFACE (not midpoint).
  // When a bead is pulled from its top, the bottom pushes against the pile,
  // giving a lever arm of one full bead diameter — this generates the kick.
  const beadRadius = 0.25;
  const gap = 0.08;  // small gap between bead surfaces
  const spacing = beadRadius * 2 + gap;  // center-to-center distance

  // Interior margins
  const inLeft = cLeft + beadRadius + 0.2;
  const inRight = cRight - beadRadius - 0.2;
  const inBottom = cBottom + beadRadius + 0.3;
  const inTop = cTop - beadRadius - 0.15;

  // Build waypoints for serpentine coil inside container
  const waypoints: Vec2[] = [];
  let y = inBottom;
  let leftToRight = true;

  while (y <= inTop) {
    if (leftToRight) {
      waypoints.push(new Vec2(inLeft, y));
      waypoints.push(new Vec2(inRight, y));
    } else {
      waypoints.push(new Vec2(inRight, y));
      waypoints.push(new Vec2(inLeft, y));
    }
    y += spacing;
    leftToRight = !leftToRight;
  }

  // Ensure the last waypoint is on the right side (near the lip)
  const lastWp = waypoints[waypoints.length - 1];
  if (lastWp.x < 0) {
    waypoints.push(new Vec2(inRight, lastWp.y));
  }

  // --- Arc over the circular lip ---
  const arcClearance = lipRadius + beadRadius + 0.1;
  const arcStartAngle = (2 * Math.PI) / 3;   // 120° — inside, upper-left of lip
  const arcEndAngle = -Math.PI / 6;           // -30° — outside, lower-right of lip
  const arcSteps = 8;

  for (let i = 0; i <= arcSteps; i++) {
    const angle = arcStartAngle + (arcEndAngle - arcStartAngle) * (i / arcSteps);
    waypoints.push(new Vec2(
      lipCenter.x + arcClearance * Math.cos(angle),
      lipCenter.y + arcClearance * Math.sin(angle),
    ));
  }

  // Hang straight down from the arc endpoint
  const hangX = lipCenter.x + arcClearance * Math.cos(arcEndAngle);
  waypoints.push(new Vec2(hangX, -8));

  // --- Interpolate bead positions along the path ---
  const positions: Vec2[] = [];
  let leftover = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const segLen = a.distanceTo(b);
    if (segLen < 0.001) continue;
    const dir = b.sub(a).normalize();

    let d = leftover;
    while (d <= segLen) {
      positions.push(a.add(dir.scale(d)));
      d += spacing;
    }
    leftover = d - segLen;
  }

  // --- Create bead bodies and constraints ---
  const beads: import('../core/body.js').RigidBody[] = [];

  for (let i = 0; i < positions.length; i++) {
    const bead = createRigidBody({
      shape: createCircle(beadRadius),
      position: positions[i],
      mass: 0.5,
      restitution: 0.05,
      friction: 0.01,
    });
    addBody(sim.world, bead);
    beads.push(bead);

    if (i > 0) {
      // Anchor at bead SURFACE, not midpoint. The constraint point is where
      // adjacent bead surfaces nearly touch. This gives each bead a lever arm
      // of its full radius from center to constraint point.
      const delta = positions[i].sub(positions[i - 1]);
      const dir = delta.normalize();
      const joint = createRevoluteConstraint({
        bodyA: beads[i - 1],
        bodyB: bead,
        anchorA: dir.scale(beadRadius),   // surface of prev bead toward this one
        anchorB: dir.scale(-beadRadius),  // surface of this bead toward prev one
        stiffness: 1.0,
      });
      addConstraint(sim.world, joint);
    }
  }

  // Give the hanging beads a downward kick to start the siphon
  const hangStart = positions.findIndex(p =>
    p.x > lipCenter.x + lipRadius && p.y < lipCenter.y
  );
  if (hangStart >= 0) {
    for (let i = hangStart; i < beads.length; i++) {
      beads[i].velocity = new Vec2(0, -6);
    }
  }

  return sim;
}
