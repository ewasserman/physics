import { Vec2 } from '../math/vec2.js';
import { World, createWorld, CreateWorldOptions, removeConstraint } from '../core/world.js';
import { RigidBody } from '../core/body.js';
import { Constraint } from '../core/constraint.js';
import { applyGravity } from '../physics/forces.js';
import { integrateWorld } from '../physics/integrator.js';
import { detectAllCollisions, detectFloorCollisions } from '../physics/collision.js';
import { resolveContact, resolveContacts } from '../physics/response.js';
import { resolveConstraints } from '../physics/constraints.js';
import { SpatialHash } from '../physics/broadphase.js';

/** Configuration for the simulation. */
export interface SimulationConfig {
  dt: number;
  gravity: Vec2;
  floorY: number;
  substeps: number;
  broadphaseCellSize: number;
  solverIterations: number;
  damping: number;
}

/** A snapshot of a single body's state. */
export interface BodySnapshot {
  id: number;
  position: Vec2;
  angle: number;
  velocity: Vec2;
  angularVelocity: number;
}

/** A snapshot of the full world state at a point in time. */
export interface WorldSnapshot {
  time: number;
  stepCount: number;
  bodies: BodySnapshot[];
}

/** The simulation state. */
export interface Simulation {
  world: World;
  config: SimulationConfig;
  stepCount: number;
  spatialHash: SpatialHash;
}

/** Create a new simulation with the given config. */
export function createSimulation(config: Partial<SimulationConfig> = {}): Simulation {
  const fullConfig: SimulationConfig = {
    dt: config.dt ?? 1 / 60,
    gravity: config.gravity ?? new Vec2(0, -9.81),
    floorY: config.floorY ?? 0,
    substeps: config.substeps ?? 1,
    broadphaseCellSize: config.broadphaseCellSize ?? 2,
    solverIterations: config.solverIterations ?? 8,
    damping: config.damping ?? 0,
  };

  const world = createWorld({
    gravity: fullConfig.gravity,
    dt: fullConfig.dt,
  });

  return {
    world,
    config: fullConfig,
    stepCount: 0,
    spatialHash: new SpatialHash(fullConfig.broadphaseCellSize),
  };
}

/**
 * Advance the simulation by one frame.
 * Each frame is divided into `substeps` sub-steps for stability.
 */
export function step(sim: Simulation): void {
  const subDt = sim.config.dt / sim.config.substeps;

  for (let i = 0; i < sim.config.substeps; i++) {
    // 1. Apply forces (gravity)
    applyGravity(sim.world);

    // 2. Integrate all bodies
    integrateWorld(sim.world, subDt);

    // 3. Detect all collisions (floor + body-body)
    const contacts = detectAllCollisions(sim.world, sim.config.floorY, sim.spatialHash);

    // 4. Resolve contacts and constraints (sequential impulse, N iterations)
    resolveContacts(contacts, sim.config.solverIterations);

    // 5. Resolve constraints
    if (sim.world.constraints.length > 0) {
      const broken = resolveConstraints(
        sim.world.constraints,
        sim.config.solverIterations,
        subDt,
      );

      // Remove broken constraints from the world
      for (const constraint of broken) {
        removeConstraint(sim.world, constraint);
      }
    }

    // 6. Apply damping
    if (sim.config.damping > 0) {
      const factor = 1 - sim.config.damping;
      for (const body of sim.world.bodies) {
        if (!body.isStatic) {
          body.velocity = body.velocity.scale(factor);
          body.angularVelocity *= factor;
        }
      }
    }
  }

  // 7. Advance world time
  sim.world.time += sim.config.dt;
  sim.stepCount++;
}

/** Capture a snapshot of the current simulation state. */
export function getSnapshot(sim: Simulation): WorldSnapshot {
  return {
    time: sim.world.time,
    stepCount: sim.stepCount,
    bodies: sim.world.bodies.map((body: RigidBody) => ({
      id: body.id,
      position: body.position.clone(),
      angle: body.angle,
      velocity: body.velocity.clone(),
      angularVelocity: body.angularVelocity,
    })),
  };
}
