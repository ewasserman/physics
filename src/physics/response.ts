import { Vec2 } from '../math/vec2.js';
import { Contact } from './collision.js';

const BAUMGARTE_SLOP = 0.01;
const BAUMGARTE_SCALE = 0.2;

/**
 * Resolve a single contact using impulse-based collision response.
 * Handles both floor contacts (bodyB=null) and body-body contacts.
 *
 * Convention:
 * - Floor contacts: normal points upward (toward bodyA, away from floor). bodyB is null.
 * - Body-body contacts: normal points from bodyA toward bodyB.
 */
export function resolveContact(contact: Contact): void {
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
    if (vn > 0) return;

    const rACrossN = rA.cross(normal);
    const effectiveMass = invMassA + rACrossN * rACrossN * invInertiaA;
    if (effectiveMass <= 0) return;

    const j = -(1 + e) * vn / effectiveMass;
    const impulse = normal.scale(j);

    // Add impulse (pushes body away from floor)
    bodyA.velocity = bodyA.velocity.add(impulse.scale(invMassA));
    bodyA.angularVelocity += rA.cross(impulse) * invInertiaA;

    // Full position correction for floor contacts (maintains backward compatibility)
    if (penetration > 0 && invMassA > 0) {
      bodyA.position = bodyA.position.add(normal.scale(penetration));
    }
  } else {
    // ─── Body-body contact ───
    // Normal points from A to B. vRel = vB - vA. Separating if vn > 0.
    const vRel = vBp.sub(vAp);
    const vn = vRel.dot(normal);
    if (vn > 0) return;

    const rACrossN = rA.cross(normal);
    const rBCrossN = rB.cross(normal);
    const effectiveMass =
      invMassA + invMassB +
      rACrossN * rACrossN * invInertiaA +
      rBCrossN * rBCrossN * invInertiaB;
    if (effectiveMass <= 0) return;

    const j = -(1 + e) * vn / effectiveMass;
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
  }
}

/**
 * Sequential impulse solver: iterate over all contacts multiple times
 * to converge to a stable solution.
 */
export function resolveContacts(contacts: Contact[], iterations: number = 8): void {
  for (let i = 0; i < iterations; i++) {
    for (const contact of contacts) {
      resolveContact(contact);
    }
  }
}
