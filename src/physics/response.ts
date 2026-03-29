import { Contact } from './collision.js';

/**
 * Resolve a contact using impulse-based collision response.
 * For floor collisions (bodyB is null), the floor is treated as having infinite mass.
 */
export function resolveContact(contact: Contact): void {
  const { bodyA, bodyB, normal, penetration } = contact;

  // Compute relative velocity at contact point
  const vA = bodyA.velocity;
  const vB = bodyB ? bodyB.velocity : { x: 0, y: 0, dot: (v: any) => 0 };

  // Relative velocity along the normal
  const relativeVn = bodyA.velocity.dot(normal);

  // If bodies are separating, don't resolve
  if (relativeVn > 0) return;

  // Compute restitution (use minimum of both bodies, or just bodyA for floor)
  const e = bodyB ? Math.min(bodyA.restitution, bodyB.restitution) : bodyA.restitution;

  // Compute inverse masses
  const invMassA = bodyA.inverseMass;
  const invMassB = bodyB ? bodyB.inverseMass : 0;

  // Normal impulse magnitude: j = -(1 + e) * vn / (1/mA + 1/mB)
  const j = -(1 + e) * relativeVn / (invMassA + invMassB);

  // Apply impulse to bodyA (subtract because normal points away from floor toward body)
  const impulse = normal.scale(j);
  bodyA.velocity = bodyA.velocity.add(impulse.scale(invMassA));

  // Apply impulse to bodyB if it exists and is not static
  if (bodyB && !bodyB.isStatic) {
    bodyB.velocity = bodyB.velocity.sub(impulse.scale(invMassB));
  }

  // Position correction: push body out of penetration
  if (penetration > 0) {
    const totalInvMass = invMassA + invMassB;
    if (totalInvMass > 0) {
      const correction = normal.scale(penetration * (invMassA / totalInvMass));
      bodyA.position = bodyA.position.add(correction);

      if (bodyB && !bodyB.isStatic) {
        const correctionB = normal.scale(penetration * (invMassB / totalInvMass));
        bodyB.position = bodyB.position.sub(correctionB);
      }
    }
  }
}
