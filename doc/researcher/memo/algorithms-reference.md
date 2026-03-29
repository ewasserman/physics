# Algorithms Reference

Comprehensive reference for all algorithms implemented in the physics simulation engine.

---

## 1. Semi-Implicit (Symplectic) Euler Integration

**File:** `src/physics/integrator.ts`

**Description:**
Updates each non-static body's state by first computing the new velocity from accumulated forces, then computing the new position from the updated velocity. This velocity-first ordering is what makes the method *symplectic* rather than explicit Euler.

**Update equations:**
```
v(t+dt) = v(t) + (F/m) * dt
x(t+dt) = x(t) + v(t+dt) * dt     // note: uses NEW velocity

omega(t+dt) = omega(t) + (tau/I) * dt
theta(t+dt) = theta(t) + omega(t+dt) * dt
```

After integration, force and torque accumulators are zeroed for the next frame.

**Properties:**
- First-order method: local truncation error is O(dt^2), global error is O(dt)
- Symplectic: conserves a shadow Hamiltonian, so energy does not drift monotonically over time. This makes it far more stable than explicit Euler for oscillatory systems (springs, orbits, stacking)
- Fixed timestep: the simulation uses a constant `dt` (default 1/60 s), optionally subdivided into `substeps` for stability
- Linear velocity damping is applied per-step (configurable, default factor 0.999 per substep when nonzero)

**Complexity:** O(n) per frame, where n is the number of bodies.

**References:**
- Hairer, Lubich, Wanner. *Geometric Numerical Integration* (2006), Section I.1
- Verlet integration is a common alternative; symplectic Euler was chosen for simplicity and because it naturally separates force accumulation from position update

---

## 2. Spatial Hash Broad-Phase

**File:** `src/physics/broadphase.ts`

**Description:**
A uniform-grid spatial hash used to reduce collision pair candidates from O(n^2) to approximately O(n). Each body's axis-aligned bounding box (AABB) is computed, and the body is inserted into every grid cell its AABB overlaps. Potential collision pairs are all pairs of bodies sharing at least one cell.

**Algorithm:**
1. Clear the hash table at the start of each frame (full rebuild).
2. For each body, compute its AABB (`computeAABB`).
3. Map AABB min/max corners to grid cell coordinates: `cellX = floor(x / cellSize)`.
4. Insert body reference into each overlapping cell.
5. Enumerate all unique pairs sharing a cell (deduplicated via a `Set` of `"lo:hi"` ID strings).

**Cell size selection:** The `broadphaseCellSize` config parameter (default 2.0) should be set to roughly the diameter of the largest common object. Too small causes bodies to span many cells; too large causes most bodies to land in the same cell, degrading to O(n^2).

**Complexity:**
- Insert: O(n * k) where k is the average number of cells per body (typically 1-4).
- Query: O(n + p) where p is the number of candidate pairs.
- Average case: O(n) for uniformly distributed scenes.
- Worst case: O(n^2) if all bodies cluster in one cell.

**References:**
- Ericson, *Real-Time Collision Detection* (2005), Section 7.2 (Uniform Grids)
- Alternative: sweep-and-prune (better for elongated distributions), BVH trees (better for static geometry)

---

## 3. Narrow-Phase Collision Detection

**File:** `src/physics/narrowphase.ts`

### 3a. Circle-Circle

**Test:** Two circles overlap iff `|center_B - center_A| < radius_A + radius_B`.

**Contact generation:**
- Normal: unit vector from A's center to B's center
- Penetration: `(rA + rB) - distance`
- Contact point: midpoint of the overlap region along the normal

**Complexity:** O(1) per pair.

### 3b. Circle-AABB

**Test:** Find the closest point on the AABB to the circle center. If the distance from that point to the circle center is less than the radius, the shapes overlap.

**Special case:** When the circle center is inside the AABB, the algorithm finds the minimum overlap axis and pushes along it.

**Complexity:** O(1) per pair.

### 3c. AABB-AABB

**Test:** Separating axis test on the two cardinal axes. Overlap exists iff overlap is positive on both X and Y axes simultaneously.

**Contact generation:** Normal is along the axis of minimum overlap (shortest escape direction). Contact point is the midpoint of the two centers.

**Complexity:** O(1) per pair.

### 3d. Shape-Pair Dispatch Table

The `detectCollision(a, b)` function dispatches based on `(shapeType_A, shapeType_B)`:

| A \ B | Circle | AABB |
|-------|--------|------|
| **Circle** | circleVsCircle | circleVsAABB |
| **AABB** | circleVsAABB (flipped) | aabbVsAABB |

Polygon pairs return `null` (not yet implemented).

**Floor collisions** (`src/physics/collision.ts`) are handled separately: each body is tested against a horizontal plane at `floorY`, with dedicated `detectCircleFloor` and `detectAABBFloor` functions.

---

## 4. Impulse-Based Collision Response

**File:** `src/physics/response.ts`

**Description:**
When two bodies are found to be overlapping, an impulse (instantaneous velocity change) is applied along the contact normal to separate them. The impulse magnitude is derived from Newton's law of restitution.

**Normal impulse formula:**
```
v_rel = v_Bp - v_Ap           // relative velocity at contact point
v_n   = dot(v_rel, n)         // normal component

j = -(1 + e) * v_n / K

where K = 1/m_A + 1/m_B + (r_A x n)^2 / I_A + (r_B x n)^2 / I_B
```

- `e` = coefficient of restitution, `min(e_A, e_B)`
- `r_A`, `r_B` = vectors from body centers to contact point
- `j` = impulse magnitude; applied as `j * n` to body B and `-j * n` to body A

**Baumgarte position correction:**
Positional overlap is corrected by nudging bodies apart proportionally to penetration depth, to prevent visible sinking:
```
correction = max(penetration - slop, 0) * beta / (1/m_A + 1/m_B)
```
Where `slop = 0.01` (ignore tiny penetrations) and `beta = 0.2` (correction fraction per step). Each body is moved in proportion to its inverse mass.

**Sequential impulse solver:**
All contacts are resolved iteratively (default 8 iterations). Each iteration re-evaluates velocities at each contact and applies corrections. This converges toward the true simultaneous solution.

**Complexity:** O(c * iterations) where c is the number of active contacts.

**References:**
- Catto, Erin. *Iterative Dynamics with Temporal Coherence* (GDC 2005)
- Baumgarte, J. *Stabilization of Constraints and Integrals of Motion* (1972)

---

## 5. Coulomb Friction

**File:** `src/physics/friction.ts`

**Description:**
After normal impulse resolution, a tangential impulse is applied to oppose sliding. The friction model is kinetic-only (Coulomb).

**Algorithm:**
1. Compute the relative velocity at the contact point.
2. Project out the normal component to obtain the tangential velocity: `v_t = v_rel - (v_rel . n) * n`.
3. Compute the tangential impulse magnitude: `j_t = -|v_t| / K_t` (where `K_t` is the effective mass in the tangent direction, analogous to the normal case).
4. Clamp: `|j_t| <= mu * |j_n|` (Coulomb's law).
5. Apply the tangential impulse to both bodies.

**Combined friction coefficient:** Geometric mean of the two bodies' friction values:
```
mu = sqrt(friction_A * friction_B)
```

**Complexity:** O(c) per contact set, called within the solver loop.

**References:**
- Coulomb, C.A. *Theorie des machines simples* (1821)
- Catto, Erin. *Understanding Constraints* (GDC 2014) for impulse-based friction

---

## 6. Constraint Solver

**File:** `src/physics/constraints.ts`, `src/core/constraint.ts`

**Description:**
Three constraint types are supported, all resolved via position-level sequential impulse with velocity correction.

### 6a. Distance Constraint

Maintains a fixed distance between two anchor points (specified in each body's local space).

**Position correction:**
```
error = |worldB - worldA| - target_distance
correction = error * stiffness / (1/m_A + 1/m_B)
```
Bodies are pushed along the constraint axis proportionally to their inverse mass.

**Velocity correction:** The relative velocity along the constraint axis is damped by a corrective impulse scaled by `stiffness`.

### 6b. Revolute (Hinge) Constraint

Pins two bodies at a shared world point (each body specifies its local anchor).

**Position correction:** The error is the world-space vector between the two anchor points. Both X and Y components are corrected independently.

**Velocity correction:** Relative velocity at the anchor is damped along both X and Y axes independently.

### 6c. Fixed (Weld) Constraint

Combines a revolute constraint (shared position) with angular locking. The reference angle `bodyB.angle - bodyA.angle` is maintained.

**Angular correction:**
```
angle_error = (bodyB.angle - bodyA.angle) - reference_angle
correction = angle_error * stiffness / (1/I_A + 1/I_B)
```

### Breakable Constraints

All constraint types support an optional `breakForce` threshold. The solver estimates force as `|error| / dt^2`. When this exceeds `breakForce`, the constraint is marked `broken` and removed from the world.

**Solver:** All constraints are iterated `solverIterations` times (default 8) per substep, same as contacts.

**Complexity:** O(k * iterations) where k is the number of active constraints.

---

## 7. Contact Warm-Starting

**Status:** Not implemented.

Warm-starting would cache the impulse applied at each contact from the previous frame and pre-apply it at the start of the current frame's solver. This helps the iterative solver converge faster, especially for stacking scenarios. The current engine rebuilds all contacts from scratch each frame with no impulse caching.

---

## 8. Gravity / External Forces

**File:** `src/physics/forces.ts`

Each non-static body receives a gravitational force of `mass * world.gravity` per frame (accumulated before integration). Additional forces can be applied via `applyForce(body, force, point?)`, which accumulates both force and torque (if a world-space application point is given).

---

## 9. Substep Loop

**File:** `src/sim/simulation.ts`

The per-frame simulation step is:
1. For each substep (`config.substeps`, default 1):
   a. Apply gravity
   b. Integrate all bodies (symplectic Euler)
   c. Detect all collisions (floor + spatial hash + narrow phase)
   d. Resolve contacts (sequential impulse, N iterations)
   e. Resolve constraints (sequential impulse, N iterations)
   f. Apply velocity damping (if configured)
2. Store contacts from last substep
3. Advance world time by `dt`

Substeps improve stability by reducing the effective timestep without changing the output frame rate.
