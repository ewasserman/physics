import { registry } from './registry.js';
import { Vec2 } from '../../math/vec2.js';
import { createSimulation } from '../../sim/simulation.js';
import { createRigidBody } from '../../core/body.js';
import { createCircle } from '../../core/shape.js';
import { addBody, addConstraint } from '../../core/world.js';
import { createRevoluteConstraint } from '../../core/constraint.js';

registry.register({
  id: 'chain',
  name: 'Chain',
  description: 'Chain of circular links hanging from a fixed anchor.',
  category: 'constraints',
  params: [
    {
      label: 'Geometry',
      params: {
        linkCount: { type: 'integer', label: 'Link Count', default: 8, min: 2, max: 30 },
        linkSize: { type: 'number', label: 'Link Size', default: 0.3, min: 0.1, max: 1, step: 0.05 },
        anchorY: { type: 'number', label: 'Anchor Height', default: 12, min: 4, max: 20, step: 1 },
      },
    },
    {
      label: 'Initial Conditions',
      params: {
        nudgeVelocity: { type: 'number', label: 'Nudge Velocity', default: 3, min: 0, max: 15, step: 0.5 },
      },
    },
    {
      label: 'Solver',
      params: {
        substeps: { type: 'integer', label: 'Substeps', default: 4, min: 1, max: 16 },
        solverIterations: { type: 'integer', label: 'Solver Iterations', default: 12, min: 1, max: 64 },
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
    });

    const spacing = v.linkSize * 2.5;

    const anchor = createRigidBody({
      shape: createCircle(0.15),
      position: new Vec2(0, v.anchorY),
      isStatic: true,
    });
    addBody(sim.world, anchor);

    let prevBody = anchor;

    for (let i = 0; i < v.linkCount; i++) {
      const link = createRigidBody({
        shape: createCircle(v.linkSize),
        position: new Vec2(0, v.anchorY - (i + 1) * spacing),
        mass: 1,
        restitution: 0.3,
        friction: 0.3,
      });
      addBody(sim.world, link);

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

    prevBody.velocity = new Vec2(v.nudgeVelocity, 0);

    return sim;
  },
});
