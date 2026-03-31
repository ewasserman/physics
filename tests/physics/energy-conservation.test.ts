import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createSimulation, step, Simulation } from '../../src/sim/simulation.js';
import { createRigidBody, resetBodyIdCounter, RigidBody } from '../../src/core/body.js';
import { createCircle } from '../../src/core/shape.js';
import { addBody, addConstraint } from '../../src/core/world.js';
import { createRevoluteConstraint } from '../../src/core/constraint.js';

/**
 * Compute total mechanical energy (kinetic + gravitational potential) for a simulation.
 * Uses the convention PE = m * |g| * y (positive y = up).
 */
function totalEnergy(sim: Simulation): number {
  const g = Math.abs(sim.config.gravity.y);
  let E = 0;
  for (const body of sim.world.bodies) {
    if (body.isStatic) continue;
    // Translational KE
    const KE_trans = 0.5 * body.mass * body.velocity.lengthSq();
    // Rotational KE
    const KE_rot = body.inverseInertia > 0
      ? 0.5 * body.inertia * body.angularVelocity * body.angularVelocity
      : 0;
    // Gravitational PE (relative to y=0)
    const PE = body.mass * g * body.position.y;
    E += KE_trans + KE_rot + PE;
  }
  return E;
}

describe('Energy conservation', () => {
  beforeEach(() => resetBodyIdCounter());

  it('simple pendulum conserves energy within 5% over 10 seconds', () => {
    // A single body constrained to a static anchor — no collisions, no damping.
    const sim = createSimulation({
      gravity: new Vec2(0, -9.81),
      floorY: -Infinity,
      substeps: 8,
      solverIterations: 32,
      damping: 0,
    });

    const anchorPos = new Vec2(0, 5);
    const pendulumLen = 3;

    // Static anchor
    const anchor = createRigidBody({
      shape: createCircle(0.05),
      position: anchorPos,
      isStatic: true,
    });
    addBody(sim.world, anchor);

    // Pendulum bob — start displaced horizontally (90 degrees from vertical)
    const bob = createRigidBody({
      shape: createCircle(0.2),
      position: new Vec2(pendulumLen, anchorPos.y),
      mass: 1,
      restitution: 0,
      friction: 0,
    });
    addBody(sim.world, bob);

    // Revolute constraint: anchor the bob
    const joint = createRevoluteConstraint({
      bodyA: anchor,
      bodyB: bob,
      anchorA: Vec2.zero(),
      anchorB: anchorPos.sub(new Vec2(pendulumLen, anchorPos.y)),
      stiffness: 1.0,
    });
    addConstraint(sim.world, joint);

    const initialEnergy = totalEnergy(sim);
    let minEnergy = initialEnergy;
    let maxEnergy = initialEnergy;

    // Run for 10 seconds at 60fps = 600 frames
    const totalFrames = 600;
    for (let i = 0; i < totalFrames; i++) {
      step(sim);
      const E = totalEnergy(sim);
      if (E < minEnergy) minEnergy = E;
      if (E > maxEnergy) maxEnergy = E;
    }

    const finalEnergy = totalEnergy(sim);

    // Energy should be conserved within 5% over 10 seconds
    const drift = Math.abs(finalEnergy - initialEnergy) / Math.abs(initialEnergy);
    expect(drift).toBeLessThan(0.05);

    // The range of energy fluctuation should also be small
    const range = (maxEnergy - minEnergy) / Math.abs(initialEnergy);
    expect(range).toBeLessThan(0.10);
  });

  it('double pendulum maintains energy within 10% over 10 seconds', () => {
    const sim = createSimulation({
      gravity: new Vec2(0, -9.81),
      floorY: -Infinity,
      substeps: 8,
      solverIterations: 32,
      damping: 0,
    });

    const anchorPos = new Vec2(0, 5);

    // Static anchor
    const anchor = createRigidBody({
      shape: createCircle(0.05),
      position: anchorPos,
      isStatic: true,
    });
    addBody(sim.world, anchor);

    // First bob — displaced at angle
    const bob1Pos = new Vec2(2, anchorPos.y);
    const bob1 = createRigidBody({
      shape: createCircle(0.2),
      position: bob1Pos,
      mass: 2,
      restitution: 0,
      friction: 0,
    });
    addBody(sim.world, bob1);

    const joint1 = createRevoluteConstraint({
      bodyA: anchor,
      bodyB: bob1,
      anchorA: Vec2.zero(),
      anchorB: anchorPos.sub(bob1Pos),
      stiffness: 1.0,
    });
    addConstraint(sim.world, joint1);

    // Second bob
    const bob2Pos = new Vec2(2, anchorPos.y - 2);
    const bob2 = createRigidBody({
      shape: createCircle(0.2),
      position: bob2Pos,
      mass: 2,
      restitution: 0,
      friction: 0,
    });
    addBody(sim.world, bob2);

    const joint2 = createRevoluteConstraint({
      bodyA: bob1,
      bodyB: bob2,
      anchorA: Vec2.zero(),
      anchorB: bob1Pos.sub(bob2Pos),
      stiffness: 1.0,
    });
    addConstraint(sim.world, joint2);

    const initialEnergy = totalEnergy(sim);

    // Run for 10 seconds
    const totalFrames = 600;
    for (let i = 0; i < totalFrames; i++) {
      step(sim);
    }

    const finalEnergy = totalEnergy(sim);

    // Double pendulum energy conservation within 10%
    const drift = Math.abs(finalEnergy - initialEnergy) / Math.abs(initialEnergy);
    expect(drift).toBeLessThan(0.10);
  });
});
