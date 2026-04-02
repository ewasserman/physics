import { registry } from './registry.js';
import { Vec2 } from '../../math/vec2.js';
import { createSimulation } from '../../sim/simulation.js';
import { createRigidBody, RigidBody } from '../../core/body.js';
import { createCircle } from '../../core/shape.js';
import { addBody, addConstraint } from '../../core/world.js';
import { createBox } from '../../core/environment.js';
import { createRevoluteConstraint } from '../../core/constraint.js';

registry.register({
  id: 'chain-fountain',
  name: 'Chain Fountain',
  description: 'Mould Effect — bead chain self-siphons from a container.',
  category: 'advanced',
  params: [
    {
      label: 'Beads',
      params: {
        beadRadius: { type: 'number', label: 'Bead Radius', default: 0.25, min: 0.1, max: 0.6, step: 0.05 },
        beadMass: { type: 'number', label: 'Bead Mass', default: 0.5, min: 0.1, max: 2, step: 0.1 },
        beadGap: { type: 'number', label: 'Bead Gap', default: 0.08, min: 0, max: 0.3, step: 0.01 },
      },
    },
    {
      label: 'Container',
      params: {
        containerWidth: { type: 'number', label: 'Container Width', default: 5, min: 2, max: 10, step: 0.5 },
        containerHeight: { type: 'number', label: 'Container Height', default: 6, min: 2, max: 12, step: 0.5 },
      },
    },
    {
      label: 'Initial Conditions',
      params: {
        kickVelocity: { type: 'number', label: 'Kick Velocity', default: 6, min: 1, max: 15, step: 0.5 },
      },
    },
    {
      label: 'Solver',
      params: {
        substeps: { type: 'integer', label: 'Substeps', default: 8, min: 1, max: 32 },
        solverIterations: { type: 'integer', label: 'Solver Iterations', default: 20, min: 1, max: 64 },
        gravity: { type: 'number', label: 'Gravity', default: 9.81, min: 0, max: 50, step: 0.5 },
      },
    },
  ],
  setup(v) {
    const sim = createSimulation({
      gravity: new Vec2(0, -v.gravity),
      floorY: -Infinity,
      substeps: v.substeps,
      solverIterations: v.solverIterations,
      damping: 0,
    });

    // Container
    const cHalfW = v.containerWidth / 2;
    const cBottom = 6;
    const cTop = cBottom + v.containerHeight;
    const wallThick = 0.4;
    const cCenterY = (cBottom + cTop) / 2;

    createBox(sim.world, -cHalfW - wallThick / 2, cCenterY, wallThick, v.containerHeight);
    createBox(sim.world, cHalfW + wallThick / 2, cCenterY, wallThick, v.containerHeight);
    createBox(sim.world, 0, cBottom - wallThick / 2, v.containerWidth + wallThick * 2, wallThick);

    // Lip
    const lipRadius = 0.6;
    const lipCenter = new Vec2(cHalfW + wallThick / 2, cTop);
    const lip = createRigidBody({
      shape: createCircle(lipRadius),
      position: lipCenter,
      isStatic: true,
      friction: 0.01,
      restitution: 0.05,
    });
    addBody(sim.world, lip);

    // Chain path
    const spacing = v.beadRadius * 2 + v.beadGap;
    const inLeft = -cHalfW + v.beadRadius + 0.2;
    const inRight = cHalfW - v.beadRadius - 0.2;
    const inBottom = cBottom + v.beadRadius + 0.3;
    const inTop = cTop - v.beadRadius - 0.15;

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

    const lastWp = waypoints[waypoints.length - 1];
    if (lastWp.x < 0) {
      waypoints.push(new Vec2(inRight, lastWp.y));
    }

    // Arc over lip
    const arcClearance = lipRadius + v.beadRadius + 0.1;
    const arcStartAngle = (2 * Math.PI) / 3;
    const arcEndAngle = -Math.PI / 6;
    const arcSteps = 8;

    for (let i = 0; i <= arcSteps; i++) {
      const angle = arcStartAngle + (arcEndAngle - arcStartAngle) * (i / arcSteps);
      waypoints.push(new Vec2(
        lipCenter.x + arcClearance * Math.cos(angle),
        lipCenter.y + arcClearance * Math.sin(angle),
      ));
    }

    const hangX = lipCenter.x + arcClearance * Math.cos(arcEndAngle);
    waypoints.push(new Vec2(hangX, -8));

    // Interpolate bead positions
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

    // Create beads and constraints
    const beads: RigidBody[] = [];

    for (let i = 0; i < positions.length; i++) {
      const bead = createRigidBody({
        shape: createCircle(v.beadRadius),
        position: positions[i],
        mass: v.beadMass,
        restitution: 0.05,
        friction: 0.01,
      });
      addBody(sim.world, bead);
      beads.push(bead);

      if (i > 0) {
        const delta = positions[i].sub(positions[i - 1]);
        const dir = delta.normalize();
        const joint = createRevoluteConstraint({
          bodyA: beads[i - 1],
          bodyB: bead,
          anchorA: dir.scale(v.beadRadius),
          anchorB: dir.scale(-v.beadRadius),
          stiffness: 1.0,
        });
        addConstraint(sim.world, joint);
      }
    }

    // Kick hanging beads
    const hangStart = positions.findIndex(p =>
      p.x > lipCenter.x + lipRadius && p.y < lipCenter.y
    );
    if (hangStart >= 0) {
      for (let i = hangStart; i < beads.length; i++) {
        beads[i].velocity = new Vec2(0, -v.kickVelocity);
      }
    }

    return sim;
  },
});
