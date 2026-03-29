import { Vec2 } from '../math/vec2.js';
import { Contact } from './collision.js';
import { ContactCache } from './warmstart.js';

const BAUMGARTE_SLOP = 0.01;
const BAUMGARTE_SCALE = 0.1;

/**
 * Resolve a single contact using impulse-based collision response.
 * Handles both floor contacts (bodyB=null) and body-body contacts.
 *
 * Convention:
 * - Floor contacts: normal points upward (toward bodyA, away from floor). bodyB is null.
 * - Body-body contacts: normal points from bodyA toward bodyB.
 *
 * Returns the computed impulse magnitude for warm-starting caching.
 */
export function resolveContact(contact: Contact, dt: number = 1 / 60): number {
  const { bodyA, bodyB, normal, penetration, point } = contact;

  const rA = point.sub(bodyA.position);
  const rB = bodyB ? point.sub(bodyB.position) : Vec2.zero();

  // Velocity at contact point including angular contribution
  const vAp = new Vec2(
    bodyA.velocity.x - bodyA.angularVelocity * rA.y,
    bodyA.velocity.y + bodyA.angularVelocity * rA.x,
  );
  const vBp = bodyB
    ? new Vec2(
        bodyB.velocity.x - bodyB.angularVelocity * rB.y,
        bodyB.velocity.y + bodyB.angularVelocity * rB.x,
      )
    : Vec2.zero();

  const invMassA = bodyA.inverseMass;
  const invMassB = bodyB ? bodyB.inverseMass : 0;
  const invInertiaA = bodyA.inverseInertia;
  const invInertiaB = bodyB ? bodyB.inverseInertia : 0;

  const e = bodyB ? Math.min(bodyA.restitution, bodyB.restitution) : bodyA.restitution;

  if (bodyB === null) {
    // ─── Floor contact ───
    // Normal points toward bodyA (upward). Body approaching if vAp.dot(normal) < 0.
    const vn = vAp.dot(normal);
    if (vn > 0) return 0;

    const rACrossN = rA.cross(normal);
    const effectiveMass = invMassA + rACrossN * rACrossN * invInertiaA;
    if (effectiveMass <= 0) return 0;

    const j = -(1 + e) * vn / effectiveMass;
    const impulse = normal.scale(j);

    // Add impulse (pushes body away from floor)
    bodyA.velocity = bodyA.velocity.add(impulse.scale(invMassA));
    bodyA.angularVelocity += rA.cross(impulse) * invInertiaA;

    // Full position correction for floor contacts (maintains backward compatibility)
    if (penetration > 0 && invMassA > 0) {
      bodyA.position = bodyA.position.add(normal.scale(penetration));
    }

    return j;
  } else {
    // ─── Body-body contact ───
    // Normal points from A to B. vRel = vB - vA. Separating if vn > 0.
    const vRel = vBp.sub(vAp);
    const vn = vRel.dot(normal);
    if (vn > 0) return 0;

    const rACrossN = rA.cross(normal);
    const rBCrossN = rB.cross(normal);
    const effectiveMass =
      invMassA + invMassB +
      rACrossN * rACrossN * invInertiaA +
      rBCrossN * rBCrossN * invInertiaB;
    if (effectiveMass <= 0) return 0;

    // Velocity bias: gently push apart penetrating bodies at velocity level.
    // Uses a small fixed scale (not divided by dt) to avoid injecting energy.
    const vBias = Math.max(penetration - BAUMGARTE_SLOP, 0) * BAUMGARTE_SCALE;

    const j = (-(1 + e) * vn + vBias) / effectiveMass;
    const impulse = normal.scale(j);

    // A gets pushed opposite to normal, B gets pushed along normal
    bodyA.velocity = bodyA.velocity.sub(impulse.scale(invMassA));
    bodyA.angularVelocity -= rA.cross(impulse) * invInertiaA;

    if (!bodyB.isStatic) {
      bodyB.velocity = bodyB.velocity.add(impulse.scale(invMassB));
      bodyB.angularVelocity += rB.cross(impulse) * invInertiaB;
    }

    // Position correction with Baumgarte stabilization
    const correctionMag = Math.max(penetration - BAUMGARTE_SLOP, 0) * BAUMGARTE_SCALE;
    if (correctionMag > 0) {
      const totalInvMass = invMassA + invMassB;
      if (totalInvMass > 0) {
        const correction = normal.scale(correctionMag / totalInvMass);
        if (!bodyA.isStatic) {
          bodyA.position = bodyA.position.sub(correction.scale(invMassA));
        }
        if (!bodyB.isStatic) {
          bodyB.position = bodyB.position.add(correction.scale(invMassB));
        }
      }
    }

    return j;
  }
}

/**
 * Apply warm-start impulses to contacts from cached values.
 * This provides a better initial guess for the solver iterations.
 */
function applyWarmStart(contacts: Contact[], cache: ContactCache): void {
  for (const contact of contacts) {
    const { bodyA, bodyB, normal, point } = contact;
    const bId = bodyB ? bodyB.id : -1;
    const cachedImpulse = cache.retrieve(bodyA.id, bId);
    if (cachedImpulse === 0) continue;

    // Apply a fraction of the cached impulse (50% for stability)
    const warmFactor = 0.5;
    const j = cachedImpulse * warmFactor;
    const impulse = normal.scale(j);

    const rA = point.sub(bodyA.position);

    if (bodyB === null) {
      // Floor contact
      bodyA.velocity = bodyA.velocity.add(impulse.scale(bodyA.inverseMass));
      bodyA.angularVelocity += rA.cross(impulse) * bodyA.inverseInertia;
    } else {
      const rB = point.sub(bodyB.position);
      bodyA.velocity = bodyA.velocity.sub(impulse.scale(bodyA.inverseMass));
      bodyA.angularVelocity -= rA.cross(impulse) * bodyA.inverseInertia;
      if (!bodyB.isStatic) {
        bodyB.velocity = bodyB.velocity.add(impulse.scale(bodyB.inverseMass));
        bodyB.angularVelocity += rB.cross(impulse) * bodyB.inverseInertia;
      }
    }
  }
}

/**
 * Sequential impulse solver: iterate over all contacts multiple times
 * to converge to a stable solution.
 *
 * Supports optional warm-starting via ContactCache and passes dt
 * for velocity-level Baumgarte correction.
 */
export function resolveContacts(
  contacts: Contact[],
  iterations: number = 8,
  dt: number = 1 / 60,
  cache?: ContactCache,
): void {
  // Apply warm-start impulses if cache is provided
  if (cache) {
    applyWarmStart(contacts, cache);
  }

  const impulses = new Array<number>(contacts.length).fill(0);

  for (let i = 0; i < iterations; i++) {
    for (let c = 0; c < contacts.length; c++) {
      const j = resolveContact(contacts[c], dt);
      impulses[c] += j;
    }
  }

  // Store impulses in cache for next frame's warm-start
  if (cache) {
    cache.store(contacts, impulses);
  }
}
