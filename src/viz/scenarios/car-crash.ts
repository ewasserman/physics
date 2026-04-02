import { registry } from './registry.js';
import { Vec2 } from '../../math/vec2.js';
import { createSimulation } from '../../sim/simulation.js';
import { createBoundary } from '../../core/environment.js';
import { createCar } from '../../core/compound.js';

registry.register({
  id: 'car-crash',
  name: 'Car Crash',
  description: 'Two cars approaching each other — they collide.',
  category: 'vehicles',
  params: [
    {
      label: 'Initial Conditions',
      params: {
        leftSpeed: { type: 'number', label: 'Left Car Speed', default: 5, min: 0, max: 20, step: 0.5 },
        rightSpeed: { type: 'number', label: 'Right Car Speed', default: 5, min: 0, max: 20, step: 0.5 },
        separation: { type: 'number', label: 'Separation', default: 16, min: 4, max: 30, step: 1 },
      },
    },
    {
      label: 'Physics',
      params: {
        gravity: { type: 'number', label: 'Gravity', default: 9.81, min: 0, max: 50, step: 0.5 },
        damping: { type: 'number', label: 'Damping', default: 0.001, min: 0, max: 0.1, step: 0.001 },
      },
    },
  ],
  setup(v) {
    const sim = createSimulation({
      gravity: new Vec2(0, -v.gravity),
      floorY: -Infinity,
      damping: v.damping,
    });

    const halfSep = v.separation / 2;
    createBoundary(sim.world, -(halfSep + 7), halfSep + 7, 0, 10);

    const carL = createCar(sim.world, -halfSep, 2);
    for (const body of carL.bodies) {
      if (!body.isStatic) body.velocity = new Vec2(v.leftSpeed, 0);
    }

    const carR = createCar(sim.world, halfSep, 2);
    for (const body of carR.bodies) {
      if (!body.isStatic) body.velocity = new Vec2(-v.rightSpeed, 0);
    }

    return sim;
  },
});
