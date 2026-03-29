# Known Limitations

An honest assessment of what the physics simulation system can and cannot do, with severity ratings, impact analysis, and remediation estimates.

---

## 1. 2D Only

**Severity:** Low (by design)
**Impact:** The engine simulates a flat plane. 3D scenes, out-of-plane rotation, and depth effects are not representable. This limits the engine to tabletop, side-view, and top-down scenarios.
**Workaround:** None within the engine. For 3D, a new engine or major extension is needed.
**Fix effort:** Major. Requires 3D vector math (Vec3, Mat4), quaternion rotation, 3D inertia tensors, 3D collision algorithms (GJK/EPA), and a 3D renderer. Essentially a rewrite of most subsystems.

---

## 2. No Continuous Collision Detection (CCD)

**Severity:** High for fast-moving objects, Low otherwise
**Impact:** Objects moving faster than their own width per timestep can pass through other objects entirely ("tunneling"). A small ball fired at a thin wall may teleport through it. This is a common failure mode at high velocities or large timesteps.
**Workaround:** Reduce `dt` or increase `substeps` to shrink the effective timestep. Keep object velocities below `min_dimension / dt`.
**Fix effort:** Moderate to high. Implement time-of-impact (TOI) sweep testing between shape pairs. For circles this is a quadratic solve; for AABBs it is a swept-AABB test. Conservative advancement is the general approach. Adds complexity to the narrow phase and requires a secondary contact resolution pass at the TOI.

---

## 3. No Body Sleeping

**Severity:** Medium
**Impact:** Every body is integrated and checked for collisions every frame, even if it is stationary. In scenes with many settled objects (a pile of boxes on the floor), this wastes computation. Performance scales with total body count rather than active body count.
**Workaround:** Manually set bodies to `isStatic = true` once they have settled, though this prevents them from being disturbed later.
**Fix effort:** Moderate. Track per-body kinetic energy over a window. When energy stays below a threshold for N frames, mark the body as sleeping. Wake it when a non-sleeping body contacts it or a force is applied. Requires careful tuning of thresholds to avoid visible artifacts (bodies that should move but remain asleep).

---

## 4. No Polygon-Polygon Collisions

**Severity:** Medium
**Impact:** The engine supports circles and axis-aligned bounding boxes. Convex polygon shapes exist in the type system (`PolygonShape`) and their AABB and inertia are computed, but there is no narrow-phase collision detection for polygon pairs, circle-polygon pairs, or polygon-floor pairs. Polygon bodies pass through each other.
**Workaround:** Approximate polygons with circles or AABBs.
**Fix effort:** Moderate. Implement SAT (Separating Axis Theorem) for convex polygon pairs and circle-polygon. This requires projecting vertices onto candidate axes (edge normals for polygons, center-to-vertex for circles) and finding the axis of minimum overlap. Alternatively, implement GJK+EPA for a more general solution.

---

## 5. No Static Friction

**Severity:** Medium
**Impact:** Only kinetic (sliding) friction is modeled. Objects on a slope will always slide, even slowly, rather than remaining stationary. Stacking stability is reduced because there is no mechanism to lock tangential velocities to zero at rest.
**Workaround:** Increase friction coefficients and solver iterations. Add light velocity damping.
**Fix effort:** Moderate. Implement a two-phase friction model: first attempt to zero the tangential velocity (static friction). If the required impulse exceeds `mu_s * j_n`, fall back to kinetic friction with `mu_k * j_n`. Requires tracking per-contact state (sticking vs sliding) across solver iterations.

---

## 6. Stacking Limited by Solver Iterations

**Severity:** Medium
**Impact:** The sequential impulse solver converges to the correct solution only in the limit of infinite iterations. With the default 8 iterations, stacks of more than 5-6 objects can exhibit visible jitter, slow sinking, or collapse. The bottom objects in a tall stack do not "feel" the full weight of upper objects within a single solver pass.
**Workaround:** Increase `solverIterations` (16-32 helps significantly). Enable substeps. Warm-starting (not yet implemented) would also help.
**Fix effort:** Low for iteration count tuning, moderate for warm-starting. Warm-starting caches impulses from the previous frame and pre-applies them, giving the solver a much better starting point. Persistent contact manifolds would further improve convergence.

---

## 7. Elastic Energy Loss from Position Correction

**Severity:** Low
**Impact:** Baumgarte position correction moves bodies apart to fix penetration but does not account for the energy implications of this displacement. Over many frames, this can cause slight energy dissipation — bouncing objects lose height faster than the restitution coefficient alone would predict. In practice this is usually acceptable and often desirable (it damps oscillations).
**Workaround:** Reduce `BAUMGARTE_SCALE` (currently 0.2) to minimize correction magnitude. Alternatively, use split-impulse or post-stabilization approaches.
**Fix effort:** Moderate. Split-impulse (used in Bullet Physics) separates velocity correction from position correction, preventing energy artifacts. Alternatively, use pseudo-velocities for position correction that are discarded after the solver pass.

---

## 8. No Curved Surfaces Beyond Circles

**Severity:** Low
**Impact:** The only curved shape is the circle. Ellipses, capsules, rounded rectangles, and other curved primitives are not supported. Complex shapes must be approximated with compound bodies (multiple circles/AABBs joined by constraints).
**Workaround:** Use compound bodies: approximate a capsule with two circles and a rectangle joined by fixed constraints.
**Fix effort:** Low to moderate per shape. Each new primitive needs AABB computation, inertia formula, and collision routines against every existing shape type. Capsules are relatively simple (circle-swept segment); ellipses are significantly harder.

---

## 9. Sequential Impulse Is Approximate

**Severity:** Low
**Impact:** The sequential impulse solver processes contacts one at a time in order, iterating multiple passes. This is a Gauss-Seidel-style relaxation that converges but does not produce the exact simultaneous solution. Contact ordering can affect results, and some energy may be created or destroyed depending on the iteration pattern. In practice, 8+ iterations are sufficient for most scenes.
**Workaround:** Increase solver iterations. Randomize contact order between passes to avoid systematic bias (not currently implemented).
**Fix effort:** Low to improve (add randomization, warm-starting). High to replace (a direct/simultaneous solver like Lemke's algorithm or a matrix LCP solver would be exact but much more complex and expensive).

---

## 10. JSON Output Only

**Severity:** Low
**Impact:** Simulation recordings are exported as JSON strings via `SimulationRecorder.exportJSON()`. For large simulations (many bodies, many frames), JSON files can be very large and slow to parse. A 1000-frame recording of 50 bodies produces roughly 5-10 MB of JSON.
**Workaround:** Use `recordInterval` to skip frames, reducing file size. Post-process with external tools to convert to binary.
**Fix effort:** Low. Add MessagePack or Protocol Buffers serialization alongside JSON. MessagePack is a drop-in replacement that produces ~40% smaller files and parses faster. A custom binary format with fixed-width records would be even more compact.

---

## Summary Table

| Limitation | Severity | Primary Impact |
|---|---|---|
| 2D only | Low | By design |
| No CCD (tunneling) | High | Fast objects pass through walls |
| No sleeping | Medium | Performance waste on settled bodies |
| No polygon-polygon | Medium | Limited shape variety |
| No static friction | Medium | Objects slide when they should stick |
| Stacking limits | Medium | Tall stacks jitter/collapse |
| Energy loss from Baumgarte | Low | Slightly inaccurate bouncing |
| No curved surfaces (except circles) | Low | Limited shape variety |
| Sequential impulse approximate | Low | Minor accuracy artifacts |
| JSON only | Low | Large output files |
