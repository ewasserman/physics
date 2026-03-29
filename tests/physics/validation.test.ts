import { describe, it, expect, beforeEach } from 'vitest';
import { Vec2 } from '../../src/math/vec2.js';
import { createRigidBody, resetBodyIdCounter, RigidBody } from '../../src/core/body.js';
import { createWorld, addBody, World } from '../../src/core/world.js';
import { createCircle } from '../../src/core/shape.js';
import { applyGravity } from '../../src/physics/forces.js';
import { integrateWorld } from '../../src/physics/integrator.js';
import { detectFloorCollisions } from '../../src/physics/collision.js';
import { resolveContact } from '../../src/physics/response.js';

// ─── Helpers ───────────────────────────────────────────────────────────────

const DT = 1 / 120;
const GRAVITY = 9.81;
const FLOOR_Y = 0;
const RADIUS = 0.5;
const MASS = 1.0;
const INITIAL_Y = 10.0;
const DAMPING = 1.0; // no damping for analytical tests

function createTestWorld(): World {
  return createWorld({ gravity: new Vec2(0, -GRAVITY), dt: DT });
}

function createBall(restitution: number): RigidBody {
  return createRigidBody({
    shape: createCircle(RADIUS),
    position: new Vec2(0, INITIAL_Y),
    velocity: Vec2.zero(),
    mass: MASS,
    restitution,
  });
}

/** Step the world once: apply gravity, integrate (damping=1), detect collisions, resolve. */
function stepWorld(world: World, dt: number): void {
  applyGravity(world);
  integrateWorld(world, dt, DAMPING);
  const contacts = detectFloorCollisions(world, FLOOR_Y);
  for (const contact of contacts) {
    resolveContact(contact);
  }
  world.time += dt;
}

/** Step the world for N steps. */
function runSteps(world: World, n: number): void {
  for (let i = 0; i < n; i++) {
    stepWorld(world, DT);
  }
}

/** Run for a given duration (in seconds). */
function runForDuration(world: World, seconds: number): void {
  const steps = Math.round(seconds / DT);
  runSteps(world, steps);
}

/** Compute kinetic energy. */
function kineticEnergy(body: RigidBody): number {
  return 0.5 * body.mass * body.velocity.lengthSq();
}

/** Compute gravitational potential energy (reference: floor y=0). */
function potentialEnergy(body: RigidBody): number {
  return body.mass * GRAVITY * body.position.y;
}

/** Total mechanical energy. */
function totalEnergy(body: RigidBody): number {
  return kineticEnergy(body) + potentialEnergy(body);
}

// ─── Scenario A: Free Fall ─────────────────────────────────────────────────

describe('Scenario A: Free Fall', () => {
  let world: World;
  let ball: RigidBody;

  beforeEach(() => {
    resetBodyIdCounter();
    world = createTestWorld();
    ball = createBall(0.5); // restitution irrelevant for free fall
    addBody(world, ball);
  });

  it('should start at correct initial conditions', () => {
    expect(ball.position.x).toBe(0);
    expect(ball.position.y).toBe(10);
    expect(ball.velocity.x).toBe(0);
    expect(ball.velocity.y).toBe(0);
  });

  it('should match analytical position at t=0.5s (tolerance 0.025m)', () => {
    runForDuration(world, 0.5);
    // Analytical: y = 10 - 0.5 * 9.81 * 0.25 = 8.77375
    expect(ball.position.y).toBeCloseTo(8.7738, 1);
    expect(Math.abs(ball.position.y - 8.7738)).toBeLessThan(0.025);
  });

  it('should match analytical velocity at t=0.5s (tolerance 0.01 m/s)', () => {
    runForDuration(world, 0.5);
    // Analytical: vy = -9.81 * 0.5 = -4.905
    expect(Math.abs(ball.velocity.y - (-4.905))).toBeLessThan(0.01);
  });

  it('should match analytical position at t=1.0s (tolerance 0.05m)', () => {
    runForDuration(world, 1.0);
    // Analytical: y = 10 - 0.5 * 9.81 * 1 = 5.095
    // Symplectic Euler undershoots by ~0.041m
    expect(Math.abs(ball.position.y - 5.095)).toBeLessThan(0.05);
  });

  it('should match analytical velocity at t=1.0s (tolerance 0.01 m/s)', () => {
    runForDuration(world, 1.0);
    // Analytical: vy = -9.81 * 1.0 = -9.81
    expect(Math.abs(ball.velocity.y - (-9.81))).toBeLessThan(0.01);
  });

  it('should conserve energy to within 0.5% during free fall', () => {
    const E0 = totalEnergy(ball); // should be 98.1 J
    expect(E0).toBeCloseTo(98.1, 1);

    // Check at t=0.5s
    runForDuration(world, 0.5);
    const E_half = totalEnergy(ball);
    expect(Math.abs(E_half - E0) / E0).toBeLessThan(0.005);

    // Continue to t=1.0s
    runForDuration(world, 0.5);
    const E_one = totalEnergy(ball);
    expect(Math.abs(E_one - E0) / E0).toBeLessThan(0.005);
  });

  it('should not move horizontally', () => {
    runForDuration(world, 1.0);
    expect(ball.position.x).toBe(0);
    expect(ball.velocity.x).toBe(0);
  });
});

// ─── Scenario B: Single Bounce (e=0.8) ────────────────────────────────────

describe('Scenario B: Single Bounce (e=0.8)', () => {
  let world: World;
  let ball: RigidBody;

  beforeEach(() => {
    resetBodyIdCounter();
    world = createTestWorld();
    ball = createBall(0.8);
    addBody(world, ball);
  });

  it('should impact the floor near t=1.39s', () => {
    // Run step by step, detect when ball first touches/passes through floor
    let impactTime = -1;
    const maxSteps = Math.round(2.0 / DT);

    for (let i = 0; i < maxSteps; i++) {
      const prevY = ball.position.y;
      stepWorld(world, DT);
      // After collision response, ball should be at or above floor+radius
      if (prevY > RADIUS + 0.01 && ball.velocity.y > 0 && impactTime < 0) {
        // Velocity flipped to positive means bounce happened
        impactTime = world.time;
        break;
      }
    }
    expect(impactTime).toBeGreaterThan(0);
    expect(Math.abs(impactTime - 1.3917)).toBeLessThan(0.02); // allow 2 dt
  });

  it('should have bounce velocity of approximately +10.92 m/s', () => {
    // Run until bounce
    const maxSteps = Math.round(2.0 / DT);
    for (let i = 0; i < maxSteps; i++) {
      stepWorld(world, DT);
      if (ball.velocity.y > 0) break; // bounced
    }
    expect(Math.abs(ball.velocity.y - 10.922)).toBeLessThan(0.15);
  });

  it('should reach max height of approximately 6.58m after first bounce', () => {
    // Run past bounce
    const maxSteps = Math.round(2.0 / DT);
    for (let i = 0; i < maxSteps; i++) {
      stepWorld(world, DT);
      if (ball.velocity.y > 0) break;
    }

    // Now track max height until velocity goes negative again
    let maxHeight = ball.position.y;
    for (let i = 0; i < Math.round(2.0 / DT); i++) {
      stepWorld(world, DT);
      if (ball.position.y > maxHeight) maxHeight = ball.position.y;
      if (ball.velocity.y < 0) break;
    }
    expect(Math.abs(maxHeight - 6.58)).toBeLessThan(0.15);
  });

  it('should have KE ratio (after/before bounce) approximately 0.64 (e^2)', () => {
    // Track KE just before and after bounce
    let keBefore = 0;
    let keAfter = 0;
    const maxSteps = Math.round(2.0 / DT);

    for (let i = 0; i < maxSteps; i++) {
      const prevVy = ball.velocity.y;
      const prevKE = kineticEnergy(ball);
      stepWorld(world, DT);
      if (prevVy < 0 && ball.velocity.y > 0) {
        // Bounce just happened
        keBefore = prevKE;
        keAfter = kineticEnergy(ball);
        break;
      }
    }
    expect(keBefore).toBeGreaterThan(0);
    const ratio = keAfter / keBefore;
    expect(Math.abs(ratio - 0.64)).toBeLessThan(0.02);
  });
});

// ─── Scenario C: Multiple Bounces (e=0.7) ─────────────────────────────────

describe('Scenario C: Multiple Bounces (e=0.7)', () => {
  let world: World;
  let ball: RigidBody;

  beforeEach(() => {
    resetBodyIdCounter();
    world = createTestWorld();
    ball = createBall(0.7);
    addBody(world, ball);
  });

  it('should show bounce heights following e^(2n) decay pattern', () => {
    // Expected max heights (center of ball) for first few bounces
    const expectedHeights = [
      { bounce: 1, height: 5.155, tolerance: 0.15 },
      { bounce: 2, height: 2.781, tolerance: 0.15 },
      { bounce: 3, height: 1.618, tolerance: 0.10 },
    ];

    const bounceHeights: number[] = [];
    let bounceCount = 0;
    let trackingHeight = false;
    let maxHeight = 0;
    const maxSteps = Math.round(10.0 / DT);

    for (let i = 0; i < maxSteps && bounceCount < 4; i++) {
      const prevVy = ball.velocity.y;
      stepWorld(world, DT);

      // Detect bounce: velocity flips from negative to positive
      if (prevVy < -0.01 && ball.velocity.y > 0.01) {
        bounceCount++;
        trackingHeight = true;
        maxHeight = ball.position.y;
      }

      // Track apex
      if (trackingHeight) {
        if (ball.position.y > maxHeight) maxHeight = ball.position.y;
        if (ball.velocity.y < 0) {
          bounceHeights.push(maxHeight);
          trackingHeight = false;
        }
      }
    }

    for (const expected of expectedHeights) {
      const idx = expected.bounce - 1;
      expect(bounceHeights.length).toBeGreaterThan(idx);
      expect(Math.abs(bounceHeights[idx] - expected.height)).toBeLessThan(expected.tolerance);
    }
  });

  it('should show monotonically decreasing energy after each bounce', () => {
    const energiesAtBounce: number[] = [];
    const maxSteps = Math.round(10.0 / DT);

    energiesAtBounce.push(totalEnergy(ball)); // initial

    for (let i = 0; i < maxSteps; i++) {
      const prevVy = ball.velocity.y;
      stepWorld(world, DT);
      // Detect bounce
      if (prevVy < -0.1 && ball.velocity.y > 0.01) {
        energiesAtBounce.push(totalEnergy(ball));
      }
    }

    // Energy should decrease (or stay same) at each bounce
    for (let i = 1; i < energiesAtBounce.length; i++) {
      expect(energiesAtBounce[i]).toBeLessThanOrEqual(energiesAtBounce[i - 1] + 0.5);
    }
  });

  it('should effectively stop (height above floor < 0.01m) by around bounce 10 (+/-2)', () => {
    let bounceCount = 0;
    let stoppedBounce = -1;
    let trackingHeight = false;
    let maxHeight = 0;
    const maxSteps = Math.round(12.0 / DT);

    for (let i = 0; i < maxSteps; i++) {
      const prevVy = ball.velocity.y;
      stepWorld(world, DT);

      if (prevVy < -0.001 && ball.velocity.y > 0.001) {
        bounceCount++;
        trackingHeight = true;
        maxHeight = ball.position.y;
      }

      if (trackingHeight) {
        if (ball.position.y > maxHeight) maxHeight = ball.position.y;
        if (ball.velocity.y < 0) {
          const heightAboveFloor = maxHeight - RADIUS;
          if (heightAboveFloor < 0.01 && stoppedBounce < 0) {
            stoppedBounce = bounceCount;
          }
          trackingHeight = false;
        }
      }
    }

    // Ball should effectively stop around bounce 10 (+/- 2)
    expect(stoppedBounce).toBeGreaterThan(0);
    expect(stoppedBounce).toBeGreaterThanOrEqual(8);
    expect(stoppedBounce).toBeLessThanOrEqual(12);
  });
});

// ─── Scenario D: Perfectly Elastic (e=1.0) ────────────────────────────────

describe('Scenario D: Perfectly Elastic (e=1.0)', () => {
  let world: World;
  let ball: RigidBody;

  beforeEach(() => {
    resetBodyIdCounter();
    world = createTestWorld();
    ball = createBall(1.0);
    addBody(world, ball);
  });

  it('should return to approximately original height after each bounce', () => {
    const bounceApexes: number[] = [];
    let trackingHeight = false;
    let maxHeight = 0;
    const maxSteps = Math.round(30.0 / DT);

    for (let i = 0; i < maxSteps && bounceApexes.length < 10; i++) {
      const prevVy = ball.velocity.y;
      stepWorld(world, DT);

      if (prevVy < -0.1 && ball.velocity.y > 0.1) {
        trackingHeight = true;
        maxHeight = ball.position.y;
      }

      if (trackingHeight) {
        if (ball.position.y > maxHeight) maxHeight = ball.position.y;
        if (ball.velocity.y < 0) {
          bounceApexes.push(maxHeight);
          trackingHeight = false;
        }
      }
    }

    expect(bounceApexes.length).toBeGreaterThanOrEqual(5);
    // Each apex should be within 0.5m of original 10.0m
    for (const apex of bounceApexes) {
      expect(Math.abs(apex - INITIAL_Y)).toBeLessThan(0.5);
    }
  });

  it('should NOT systematically increase energy over 10+ bounces', () => {
    const E0 = totalEnergy(ball);
    const energiesAfterBounce: number[] = [];
    const maxSteps = Math.round(30.0 / DT);

    for (let i = 0; i < maxSteps; i++) {
      const prevVy = ball.velocity.y;
      stepWorld(world, DT);

      if (prevVy < -0.1 && ball.velocity.y > 0.1) {
        energiesAfterBounce.push(totalEnergy(ball));
      }
      if (energiesAfterBounce.length >= 10) break;
    }

    expect(energiesAfterBounce.length).toBeGreaterThanOrEqual(5);

    // Energy should stay within 5% of initial after 10 bounces
    for (const e of energiesAfterBounce) {
      expect(e).toBeLessThan(E0 * 1.05);
    }

    // Check no systematic increase: last energy should not be much more than first
    const firstE = energiesAfterBounce[0];
    const lastE = energiesAfterBounce[energiesAfterBounce.length - 1];
    // Allow bounded oscillation but not growth
    expect(lastE).toBeLessThan(E0 * 1.05);
  });

  it('should have bounded oscillation (bounce period ~2.78s)', () => {
    const bounceTimes: number[] = [];
    const maxSteps = Math.round(15.0 / DT);

    for (let i = 0; i < maxSteps; i++) {
      const prevVy = ball.velocity.y;
      stepWorld(world, DT);

      if (prevVy < -0.1 && ball.velocity.y > 0.1) {
        bounceTimes.push(world.time);
      }
      if (bounceTimes.length >= 4) break;
    }

    expect(bounceTimes.length).toBeGreaterThanOrEqual(3);

    // Check period between bounces
    for (let i = 1; i < bounceTimes.length; i++) {
      const period = bounceTimes[i] - bounceTimes[i - 1];
      expect(Math.abs(period - 2.7834)).toBeLessThan(0.05);
    }
  });
});

// ─── Scenario E: Perfectly Inelastic (e=0.0) ──────────────────────────────

describe('Scenario E: Perfectly Inelastic (e=0.0)', () => {
  let world: World;
  let ball: RigidBody;

  beforeEach(() => {
    resetBodyIdCounter();
    world = createTestWorld();
    ball = createBall(0.0);
    addBody(world, ball);
  });

  it('should impact near t=1.39s', () => {
    let impactTime = -1;
    const maxSteps = Math.round(2.0 / DT);

    for (let i = 0; i < maxSteps; i++) {
      const prevVy = ball.velocity.y;
      stepWorld(world, DT);
      // For e=0, velocity should become ~0 after impact
      if (prevVy < -1.0 && Math.abs(ball.velocity.y) < 0.1) {
        impactTime = world.time;
        break;
      }
    }
    expect(impactTime).toBeGreaterThan(0);
    expect(Math.abs(impactTime - 1.3917)).toBeLessThan(0.02);
  });

  it('should have zero velocity after impact', () => {
    const maxSteps = Math.round(2.0 / DT);
    for (let i = 0; i < maxSteps; i++) {
      stepWorld(world, DT);
    }
    expect(Math.abs(ball.velocity.y)).toBeLessThan(0.01);
    expect(Math.abs(ball.velocity.x)).toBeLessThan(0.01);
  });

  it('should rest at y=0.5m (center) after impact', () => {
    runForDuration(world, 3.0);
    expect(Math.abs(ball.position.y - RADIUS)).toBeLessThan(0.01);
  });

  it('should have zero KE after impact', () => {
    runForDuration(world, 2.0);
    expect(kineticEnergy(ball)).toBeLessThan(0.1);
  });

  it('should have no subsequent bounces after impact', () => {
    // Run past impact
    runForDuration(world, 1.5);

    // Now track for several more seconds — velocity should stay near zero
    let maxVy = 0;
    for (let i = 0; i < Math.round(3.0 / DT); i++) {
      stepWorld(world, DT);
      if (Math.abs(ball.velocity.y) > maxVy) {
        maxVy = Math.abs(ball.velocity.y);
      }
    }
    // Velocity should never exceed a small threshold (no bouncing)
    expect(maxVy).toBeLessThan(0.5);
  });
});
