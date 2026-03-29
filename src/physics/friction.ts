import { Vec2 } from '../math/vec2.js';
import { Contact } from './collision.js';

/**
 * Apply Coulomb friction to a contact after normal impulse resolution.
 * jn is the normal impulse magnitude already applied.
 */
export function applyFriction(contact: Contact, jn: number): void {
  const { bodyA, bodyB, normal, point } = contact;

  const rA = point.sub(bodyA.position);
  const rB = bodyB ? point.sub(bodyB.position) : Vec2.zero();

  // Velocity at contact point
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

  // Relative velocity
  const vRel = bodyB ? vBp.sub(vAp) : vAp.negate();

  // Tangent = relative velocity minus normal component
  const vnScalar = vRel.dot(normal);
  const vTangent = vRel.sub(normal.scale(vnScalar));
  const vTangentLen = vTangent.length();

  if (vTangentLen < 1e-10) return;

  const tangentDir = vTangent.normalize();

  // Combined friction coefficient (geometric mean)
  const frictionA = bodyA.friction;
  const frictionB = bodyB ? bodyB.friction : 0.5;
  const mu = Math.sqrt(frictionA * frictionB);

  // Effective mass in tangent direction
  const invMassA = bodyA.inverseMass;
  const invMassB = bodyB ? bodyB.inverseMass : 0;
  const invInertiaA = bodyA.inverseInertia;
  const invInertiaB = bodyB ? bodyB.inverseInertia : 0;

  const rACrossT = rA.cross(tangentDir);
  const rBCrossT = bodyB ? rB.cross(tangentDir) : 0;
  const effectiveMass = invMassA + invMassB +
    rACrossT * rACrossT * invInertiaA +
    rBCrossT * rBCrossT * invInertiaB;

  if (effectiveMass <= 0) return;

  // Tangential impulse magnitude
  let jt = -vTangentLen / effectiveMass;

  // Coulomb friction clamp
  if (Math.abs(jt) > mu * Math.abs(jn)) {
    jt = -mu * Math.abs(jn) * Math.sign(jt);
  }

  const impulse = tangentDir.scale(jt);

  if (bodyB === null) {
    // Floor contact
    bodyA.velocity = bodyA.velocity.add(impulse.scale(invMassA));
    bodyA.angularVelocity += rA.cross(impulse) * invInertiaA;
  } else {
    // Body-body contact
    if (!bodyA.isStatic) {
      bodyA.velocity = bodyA.velocity.sub(impulse.scale(invMassA));
      bodyA.angularVelocity -= rA.cross(impulse) * invInertiaA;
    }
    if (!bodyB.isStatic) {
      bodyB.velocity = bodyB.velocity.add(impulse.scale(invMassB));
      bodyB.angularVelocity += rB.cross(impulse) * invInertiaB;
    }
  }
}
