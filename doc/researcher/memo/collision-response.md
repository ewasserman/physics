# Collision Response: Impulse-Based vs Penalty-Based

## Context
Once collision detection finds overlapping bodies and produces contact information (point, normal, penetration depth), we need a collision response method to resolve the overlap and update velocities. The two main approaches are impulse-based and penalty-based response.

---

## Impulse-Based Response

**Concept:** At the moment of collision, apply an instantaneous change in velocity (an "impulse") to the colliding bodies along the contact normal. The impulse magnitude is computed from conservation of momentum and a coefficient of restitution.

**Algorithm (simplified for two bodies):**
```
relative_velocity = vB - vA (at contact point)
vn = dot(relative_velocity, contact_normal)

if vn > 0: return  // bodies separating, no response needed

// Impulse magnitude (from Newton's law of restitution)
e = coefficient_of_restitution  // 0 = perfectly inelastic, 1 = perfectly elastic
j = -(1 + e) * vn / (1/mA + 1/mB + angular_terms)

// Apply impulse
vA -= (j / mA) * normal
vB += (j / mB) * normal
// Also update angular velocities using cross products
```

| Property | Assessment |
|----------|------------|
| Accuracy | Physically grounded -- derived from conservation laws. Correct for single-point collisions. |
| Stability | Good for discrete collisions. Resting contact requires special handling (accumulated impulses, sequential impulse solver). |
| Performance | Very fast -- one computation per contact per iteration. No force accumulation across frames. |
| Implementation | Moderate. Basic impulse is straightforward. Resting contact / stacking requires an iterative solver (sequential impulses). |
| Tunability | Coefficient of restitution (bounciness), friction coefficient. Physically meaningful parameters. |
| Positional correction | Needs separate penetration resolution (e.g., push bodies apart proportional to penetration depth). |

**Strengths:**
- Physically motivated -- produces realistic bounces and deflections
- Fast per-contact computation
- Well-documented; standard references (Erin Catto's GDC talks on Box2D, Baraff)
- Handles angular momentum correctly
- Naturally handles different masses (heavy objects barely affected by light ones)

**Weaknesses:**
- Resting contact (stacking) is the hard part -- need iterative solver or contact caching
- Objects can visibly interpenetrate if position correction isn't done well
- Multiple simultaneous contacts need sequential solving (order matters)

---

## Penalty-Based Response

**Concept:** When two bodies overlap, apply a repulsive force proportional to the penetration depth (like a stiff spring at the contact point). The force pushes bodies apart over subsequent timesteps.

**Algorithm:**
```
if penetration > 0:
    force_magnitude = k_stiffness * penetration + b_damping * relative_velocity_normal
    // Apply force to both bodies along contact normal
```

| Property | Assessment |
|----------|------------|
| Accuracy | Not physically motivated -- the "spring" at the contact is artificial. Behavior depends on spring stiffness. |
| Stability | **Problematic.** Stiff springs require small timesteps to avoid oscillation. Soft springs allow visible penetration. This is the fundamental tension. |
| Performance | Cheap per-contact, but may need smaller timesteps for stability (net cost can be higher). |
| Implementation | Very simple to code. Just add a force proportional to overlap. |
| Tunability | Spring stiffness (k) and damping (b). These are **not** physically meaningful -- they're numerical parameters that need tuning by trial and error. |
| Positional correction | Built-in -- the spring force resolves penetration over time. |

**Strengths:**
- Extremely simple to implement (5 lines of code)
- Handles resting contact naturally (constant spring force balances gravity)
- No special solver needed for multiple contacts
- Soft-body-like behavior for free

**Weaknesses:**
- **Stiffness dilemma:** High stiffness = stability issues and jitter. Low stiffness = visible penetration and mushy collisions.
- Non-physical parameters (k, b) require manual tuning for each scenario
- Can cause high-frequency oscillation (vibrating objects)
- Penetration is always present (spring needs overlap to generate force)
- Energy can be injected into the system through the spring, causing instability
- Doesn't handle angular response as naturally as impulses

---

## Head-to-Head Comparison

| Criterion | Impulse-Based | Penalty-Based |
|-----------|--------------|---------------|
| Physical realism | High -- based on conservation laws | Low -- artificial spring model |
| Visual quality | Clean bounces and deflections | Can look mushy or jittery |
| Stability | Good (with iterative solver) | Stiffness-dependent; can oscillate |
| Resting contact | Needs iterative solver | Natural (but may vibrate) |
| Performance | Fast; O(contacts * iterations) | Fast per-contact; may need smaller dt |
| Implementation | Moderate (solver needed) | Very easy (but tuning is hard) |
| Parameter tuning | Physical: restitution, friction | Numerical: stiffness, damping (trial-and-error) |
| Angular response | Handled via torque from offset impulse | Requires careful force application point |
| Industry adoption | Box2D, Bullet, PhysX, Rapier | Mostly used in FEM / soft-body / cloth |

---

## Recommendation: Impulse-Based Response

**Impulse-based collision response** is the clear choice for our project. Rationale:

1. **Visual plausibility.** Impulse-based response produces clean, crisp collisions. Objects bounce realistically. Penalty methods tend to produce either mushy (soft spring) or jittery (stiff spring) behavior.

2. **Physical parameters.** Coefficient of restitution and friction coefficient are intuitive, meaningful, and well-documented. Penalty spring constants are arbitrary numbers that need per-scenario tuning.

3. **Compatibility with our integrator.** Semi-implicit Euler + impulse-based response is the standard combination. This is exactly what Box2D uses, and it's proven to work well.

4. **Industry standard.** Every major real-time physics engine uses impulse-based response. The algorithms are well-documented (Erin Catto's GDC presentations are essentially a tutorial).

5. **Performance.** Impulses are computed and applied instantly. No need for smaller timesteps to handle stiff contacts.

### Implementation Plan

The implementation should proceed in stages:

**Stage 1 (Phase 1):** Basic impulse for single collisions
- Compute normal impulse from relative velocity and restitution
- Apply to linear and angular velocity
- Simple position correction: push bodies apart by penetration depth (split by inverse mass ratio)

**Stage 2 (Phase 2):** Multi-body sequential impulse solver
- For each frame, iterate over all contacts multiple times (4-8 iterations typical)
- Each iteration applies impulse corrections; convergence improves contact resolution
- This is the "Sequential Impulse" method (Erin Catto)
- Warm starting: cache impulses from previous frame as initial guess

**Stage 3 (Phase 3):** Friction
- Tangential impulse at contact point
- Coulomb friction model: tangential impulse bounded by mu * normal impulse
- Compute in the same solver loop as normal impulses

### Key References
- Erin Catto, "Iterative Dynamics with Temporal Coherence" (GDC 2005) -- the foundational Box2D paper
- Erin Catto, "Understanding Constraints" (GDC 2014) -- constraint-based view of contacts
- Allen Chou, "Physics for Game Programmers" -- good practical tutorial
- Ian Millington, "Game Physics Engine Development" -- textbook covering impulse-based systems

### Position Correction

Impulse-based response handles velocity but not penetration. Objects may overlap by the time collision is detected. Two strategies:

1. **Baumgarte stabilization:** Add a small bias to the impulse to push objects apart over a few frames. Simple but can add energy.
2. **Split impulse / pseudo-velocity:** Separate position correction from velocity update. More stable. Used by Box2D (partial).
3. **Direct position correction:** After solving velocities, directly move objects apart proportional to penetration. Simple and effective for our needs.

**Recommend:** Start with direct position correction (simple and visual). Upgrade to Baumgarte or split impulse if stacking stability requires it.
