# Phase 3 — Friction Research

## Coulomb Friction Model

The standard Coulomb friction model states:

    F_friction <= mu * F_normal

Where:
- `F_friction` is the tangential friction force opposing relative motion
- `mu` is the coefficient of friction
- `F_normal` is the magnitude of the normal contact force

### Static vs Kinetic Friction

**Static friction** (mu_s): applies when surfaces are not sliding relative to each other. The friction force can be anything from 0 up to mu_s * F_normal — it is a reactive force that prevents sliding.

**Kinetic friction** (mu_k): applies when surfaces are sliding. The friction force is exactly mu_k * F_normal, opposing the direction of relative motion. Typically mu_k < mu_s (about 70-80% of static).

**Recommendation for Phase 3:** Implement kinetic friction only. Static friction requires tracking contact state (sticking vs sliding) and solving a complementarity problem, which adds significant complexity. Kinetic friction is straightforward: compute the tangential relative velocity at the contact point, apply a force opposing it with magnitude mu_k * F_normal.

Static friction can be added in a later phase if needed for realistic resting behavior (e.g., a car parked on a slope without sliding).

## Combined Friction Coefficient

When two bodies with different friction coefficients collide, we need a combined coefficient. Common approaches:

| Method | Formula | Used By |
|--------|---------|---------|
| Geometric mean | mu = sqrt(mu_a * mu_b) | Box2D, Rapier |
| Arithmetic mean | mu = (mu_a + mu_b) / 2 | Some engines |
| Minimum | mu = min(mu_a, mu_b) | PhysX default |
| Maximum | mu = max(mu_a, mu_b) | Rare |

**Recommendation:** Use **geometric mean** `mu = sqrt(mu_a * mu_b)`. This is the most widely used approach in game physics. It has nice properties: if either surface has zero friction the result is zero, and it handles asymmetric materials well.

## Typical Friction Coefficients

| Material Pair | mu_k (kinetic) | mu_s (static) |
|---------------|---------------|---------------|
| Rubber on concrete | 0.6 - 0.8 | 0.8 - 1.0 |
| Rubber on wet road | 0.4 - 0.5 | 0.5 - 0.7 |
| Steel on steel | 0.4 - 0.6 | 0.6 - 0.8 |
| Wood on wood | 0.25 - 0.5 | 0.3 - 0.6 |
| Ice on ice | 0.03 - 0.05 | 0.05 - 0.1 |
| Ice on steel | 0.02 - 0.03 | 0.03 - 0.05 |
| Teflon on anything | 0.04 - 0.1 | 0.04 - 0.1 |

**Default value suggestion:** mu = 0.5 (reasonable for general-purpose "medium friction" surfaces)

## Rolling Friction / Rolling Resistance

Rolling friction is much smaller than sliding friction, typically by 1-2 orders of magnitude:

| Surface | Rolling friction coefficient |
|---------|---------------------------|
| Hard wheel on hard surface | 0.001 - 0.005 |
| Rubber tire on concrete | 0.01 - 0.02 |
| Rubber tire on soft ground | 0.05 - 0.1 |

Rolling resistance arises from deformation at the contact patch and is not well modeled by the Coulomb model. For a game physics engine, the simplest approach is:

    torque_rolling_resistance = -mu_r * F_normal * sign(omega)

Or as velocity-dependent damping on angular velocity:

    torque_damping = -c * omega

Where c is a small damping coefficient (e.g., 0.01 - 0.1).

**Recommendation for Phase 3:** Rolling resistance is optional. If implemented, use a simple angular velocity damping term rather than a full rolling resistance model. This is sufficient for visual plausibility (wheels eventually stop spinning) without adding complexity.

## Implementation Approach

### During Collision Response

1. Compute the collision normal `n` and tangent `t` at the contact point
2. Compute normal impulse `j_n` from the collision response (already implemented)
3. Compute relative tangential velocity: `v_t = v_rel - (v_rel . n) * n`
4. Compute friction impulse magnitude: `j_f = mu * |j_n|`
5. Clamp: if `|v_t| * effective_mass < j_f`, use `|v_t| * effective_mass` instead (prevents reversal)
6. Apply friction impulse: `impulse = -normalize(v_t) * j_f`

### Key Detail: Clamping to Prevent Velocity Reversal

The friction impulse must not reverse the tangential velocity. The maximum friction impulse that brings the tangential velocity to zero is:

    j_max = |v_t| / (1/m_a + 1/m_b + cross terms for rotation)

The applied friction impulse should be:

    j_applied = min(mu * |j_n|, j_max)

This clamping is essential for stability.

### Integration with Existing Collision System

Friction should be applied as part of the collision impulse calculation. The normal and tangential impulses can be computed together. The tangential impulse direction is determined by the relative tangential velocity at the contact point (accounting for both linear and angular velocities of both bodies).

## Summary of Recommendations

1. **Phase 3 scope:** Kinetic (sliding) friction only
2. **Combined coefficient:** Geometric mean sqrt(mu_a * mu_b)
3. **Default coefficient:** 0.5
4. **Rolling resistance:** Optional, use simple angular damping if implemented
5. **Static friction:** Defer to a future phase
6. **Implementation:** Apply as tangential impulse during collision response, clamped to prevent velocity reversal
