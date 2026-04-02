import { registry } from './registry.js';
import { Vec2 } from '../../math/vec2.js';
import { createSimulation } from '../../sim/simulation.js';
import { createRigidBody } from '../../core/body.js';
import { createCircle } from '../../core/shape.js';
import { addBody, addConstraint } from '../../core/world.js';
import { createRevoluteConstraint } from '../../core/constraint.js';

registry.register({
  id: 'double-pendulum',
  name: 'Double Pendulum',
  description: 'Chaotic double pendulum swinging from a fixed anchor.',
  category: 'constraints',
  camera: { mode: 'manual', cx: 0, cy: 0 },
  params: [
    {
      label: 'Geometry',
      params: {
        armLen1: { type: 'number', label: 'Arm 1 Length', default: 2.4, min: 0.5, max: 8, step: 0.1 },
        armLen2: { type: 'number', label: 'Arm 2 Length', default: 2.0, min: 0.5, max: 8, step: 0.1 },
        bobMass: { type: 'number', label: 'Bob Mass', default: 2, min: 0.1, max: 20, step: 0.1 },
      },
    },
    {
      label: 'Initial Conditions',
      params: {
        angle1: { type: 'number', label: 'Angle 1 (deg from vertical)', default: 30, min: -180, max: 180, step: 5 },
        angle2: { type: 'number', label: 'Angle 2 (deg from vertical)', default: 45, min: -180, max: 180, step: 5 },
      },
    },
    {
      label: 'Solver',
      params: {
        substeps: { type: 'integer', label: 'Substeps', default: 8, min: 1, max: 32 },
        solverIterations: { type: 'integer', label: 'Solver Iterations', default: 32, min: 1, max: 128 },
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

    const anchorY = 0;

    const anchor = createRigidBody({
      shape: createCircle(0.05),
      position: new Vec2(0, anchorY),
      isStatic: true,
      restitution: 1.0,
      friction: 0,
    });
    addBody(sim.world, anchor);

    // angle from vertical -> angle from horizontal = 90 - angleFromVertical
    const ang1 = (Math.PI / 2) - (v.angle1 * Math.PI / 180);
    const arm1Pos = new Vec2(
      v.armLen1 * Math.cos(ang1),
      anchorY + v.armLen1 * Math.sin(ang1),
    );
    const arm1 = createRigidBody({
      shape: createCircle(0.2),
      position: arm1Pos,
      mass: v.bobMass,
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

    // angle2 from vertical on the other side
    const ang2 = (Math.PI / 2) + (v.angle2 * Math.PI / 180);
    const arm2Pos = new Vec2(
      arm1Pos.x + v.armLen2 * Math.cos(ang2),
      arm1Pos.y + v.armLen2 * Math.sin(ang2),
    );
    const arm2 = createRigidBody({
      shape: createCircle(0.2),
      position: arm2Pos,
      mass: v.bobMass,
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
  },
});
