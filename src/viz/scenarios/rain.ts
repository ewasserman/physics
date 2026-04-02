import { registry } from './registry.js';
import { Vec2 } from '../../math/vec2.js';
import { createSimulation } from '../../sim/simulation.js';
import { createRigidBody } from '../../core/body.js';
import { createCircle } from '../../core/shape.js';
import { addBody } from '../../core/world.js';
import { createBoundary } from '../../core/environment.js';

registry.register({
  id: 'rain',
  name: 'Rain',
  description: 'Circles falling from random positions, settling.',
  category: 'basics',
  params: [
    {
      label: 'Geometry',
      params: {
        dropCount: { type: 'integer', label: 'Drop Count', default: 20, min: 1, max: 60 },
        minRadius: { type: 'number', label: 'Min Radius', default: 0.3, min: 0.1, max: 1, step: 0.05 },
        maxRadius: { type: 'number', label: 'Max Radius', default: 0.7, min: 0.2, max: 2, step: 0.05 },
        boxWidth: { type: 'number', label: 'Box Width', default: 16, min: 4, max: 40, step: 1 },
      },
    },
    {
      label: 'Physics',
      params: {
        restitution: { type: 'number', label: 'Restitution', default: 0.4, min: 0, max: 1, step: 0.05 },
        friction: { type: 'number', label: 'Friction', default: 0.4, min: 0, max: 1, step: 0.05 },
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

    const hw = v.boxWidth / 2;
    createBoundary(sim.world, -hw, hw, 0, 25);

    for (let i = 0; i < v.dropCount; i++) {
      const r = v.minRadius + Math.random() * (v.maxRadius - v.minRadius);
      const x = (Math.random() - 0.5) * (v.boxWidth - 2);
      const y = 10 + Math.random() * 12;
      const body = createRigidBody({
        shape: createCircle(r),
        position: new Vec2(x, y),
        mass: 0.5 + Math.random(),
        restitution: v.restitution,
        friction: v.friction,
      });
      addBody(sim.world, body);
    }

    return sim;
  },
});
