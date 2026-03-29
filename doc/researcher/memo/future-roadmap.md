# Future Roadmap

Research-informed suggestions for post-Phase 7 development, ordered roughly by impact-to-effort ratio.

---

## 1. Body Sleeping

**Priority:** High
**Effort:** Moderate (1-2 weeks)
**Impact:** Significant performance gain for settling scenes

**Description:**
Deactivate bodies whose kinetic energy (linear + angular) has remained below a threshold for a configurable number of frames. Sleeping bodies skip integration, broad-phase insertion, and collision detection.

**Key design decisions:**
- Track `sleepTimer` per body. Increment when `0.5 * m * v^2 + 0.5 * I * omega^2 < sleepThreshold`. Reset to 0 otherwise.
- Sleep after timer exceeds `sleepFrames` (e.g., 60 frames = 1 second).
- Wake a sleeping body when: (a) a non-sleeping body contacts it, (b) an external force/impulse is applied, (c) a constraint partner wakes up.
- Wake propagation: when body A wakes, wake all bodies in contact with A (island-based waking).

**Expected gain:** In a scene with 200 bodies where 150 have settled, simulation cost drops by roughly 75%.

**References:** Catto, *Box2D Manual*, Section "Sleeping"

---

## 2. Binary Output Format

**Priority:** High
**Effort:** Low (2-3 days)
**Impact:** 40-80% reduction in output file size, faster parsing

**Description:**
Add MessagePack serialization as an alternative to JSON. MessagePack is a binary JSON-compatible format that produces smaller files and parses faster in both JavaScript and Python (the likely consumers for AI training).

**Options:**
- **MessagePack:** Drop-in replacement. ~40% smaller than JSON. Well-supported in JS (`msgpackr`) and Python (`msgpack`). Recommended first step.
- **Protocol Buffers:** Schema-based binary. ~60-70% smaller. Requires `.proto` definitions and code generation. Better for stable schemas.
- **Custom binary:** Fixed-width float32 records with a simple header. Smallest possible (8 bytes per Vec2 vs ~30 in JSON). Best for bulk training data. Requires custom readers.

**Recommendation:** Start with MessagePack for quick wins, then consider custom binary for high-volume training pipelines.

---

## 3. Convex Polygon Support

**Priority:** Medium-High
**Effort:** Moderate (1-2 weeks)
**Impact:** Much richer shape variety for simulations

**Description:**
The type system already includes `PolygonShape` with vertices and inertia computation. The missing piece is narrow-phase collision detection.

**Approach — SAT (Separating Axis Theorem):**
1. For each edge normal of polygon A and polygon B, project all vertices of both polygons onto that axis.
2. If any axis shows no overlap, the polygons are separated.
3. The axis with minimum overlap gives the contact normal and penetration depth.
4. Contact points are found by clipping the incident face against the reference face.

**Circle-polygon:** Test the circle center against each edge (closest point on segment to center), plus vertex regions.

**Polygon-AABB:** AABB is just a special-case polygon with axis-aligned edges; SAT simplifies.

**Alternative — GJK + EPA:** More general (works for any convex shape), but more complex to implement and debug. Recommended only if non-polygonal convex shapes (ellipses, Minkowski sums) are needed later.

**References:** Ericson, *Real-Time Collision Detection*, Chapter 5 (SAT); van den Bergen, *Collision Detection in Interactive 3D Environments* (GJK/EPA)

---

## 4. Contact Warm-Starting

**Priority:** Medium-High
**Effort:** Moderate (1 week)
**Impact:** Much better stacking stability; faster solver convergence

**Description:**
Cache the accumulated impulse (normal + tangential) at each contact from the previous frame. At the start of the current frame's solver, identify matching contacts (same body pair, similar contact point) and pre-apply the cached impulse. This gives the iterative solver a head start, dramatically reducing the number of iterations needed for convergence.

**Implementation steps:**
1. Maintain a contact cache (hash map keyed by body-pair ID).
2. After narrow phase, match new contacts to cached contacts by proximity of contact points.
3. Pre-apply cached impulses before the solver loop begins.
4. After solving, update the cache with final impulse values.

**Expected gain:** Stacking stability equivalent to 2-3x more solver iterations, at negligible cost.

**References:** Catto, *Iterative Dynamics with Temporal Coherence* (GDC 2005)

---

## 5. Static Friction

**Priority:** Medium
**Effort:** Moderate (1 week)
**Impact:** Objects rest properly on slopes; better stacking

**Description:**
The current engine implements kinetic friction only. Adding static friction requires a two-phase approach:

1. Compute the tangential impulse needed to zero the relative tangential velocity (this is the "static friction attempt").
2. If `|j_t| <= mu_s * j_n`, apply it (the contact is sticking).
3. Otherwise, apply kinetic friction: `j_t = mu_k * j_n` in the opposing direction.

**Design notes:**
- Typically `mu_s > mu_k` (e.g., `mu_s = 1.2 * mu_k`).
- Requires per-contact state tracking (is this contact currently sticking or sliding?).
- The body interface would gain a `staticFriction` property alongside the existing `friction` (kinetic).

---

## 6. Continuous Collision Detection (CCD)

**Priority:** Medium
**Effort:** High (2-3 weeks)
**Impact:** Eliminates tunneling for fast objects

**Description:**
Instead of testing overlap at discrete positions, CCD sweeps each body's motion over the timestep and finds the earliest time of impact (TOI).

**Approach:**
1. **Conservative advancement:** Repeatedly advance bodies by a safe distance (based on closest feature distance and maximum velocity) until either contact is found or the full timestep elapses.
2. **Circle sweep:** For circle-circle, the TOI is the solution to a quadratic equation on the distance between swept centers.
3. **AABB sweep:** Swept-AABB test computes entry and exit times on each axis; TOI is the latest entry time.
4. **Bilateral advancement (Catto's approach):** Used in Box2D. Alternately advance body A and body B toward each other using GJK distance queries.

**Integration with the solver:** When a TOI is found, the simulation is rewound to that time, the collision is resolved, and the remainder of the timestep is simulated. This requires the ability to partially integrate bodies.

**References:** Catto, *Continuous Collision* (GDC 2013); Ericson, *Real-Time Collision Detection*, Chapter 5.5

---

## 7. GPU Acceleration (WebGPU)

**Priority:** Low-Medium
**Effort:** Large (4-6 weeks)
**Impact:** 10-100x throughput for large scenes (1000+ bodies)

**Description:**
Offload the most parallelizable phases to WebGPU compute shaders:

- **Integration:** Trivially parallel — each body is independent. Single compute dispatch.
- **Broad phase:** GPU-friendly approaches include sort-based spatial hashing (radix sort body keys, then scan for pairs) or parallel grid construction.
- **Narrow phase:** Each candidate pair can be tested independently. Output contacts to a buffer.
- **Solver:** Harder to parallelize due to sequential dependencies. Graph-coloring approaches allow independent contacts to be solved in parallel within each color group.

**Prerequisites:** WebGPU API availability (Chrome 113+, Firefox behind flag). Fallback to CPU for unsupported browsers.

**Recommendation:** Only pursue this if the target use case involves 1000+ bodies. For <200 bodies, CPU performance is sufficient with sleeping enabled.

---

## 8. 3D Extension

**Priority:** Low (depends on project direction)
**Effort:** Major (2-3 months)
**Impact:** Opens up entirely new simulation domains

**Description:**
Extending the engine to 3D requires changes across nearly every subsystem:

- **Math:** Vec3, Mat3/Mat4, Quaternion types. Quaternion integration for rotation (angle-axis is insufficient due to gimbal lock).
- **Shapes:** Sphere (trivial), Box (OBB), Convex hull, Capsule.
- **Collision:** GJK for general convex-convex in 3D. EPA for penetration depth. SAT for box-box (15 axes).
- **Inertia:** 3x3 inertia tensor (not a scalar). Must be rotated to world frame each step.
- **Constraints:** Joint types become 3D (ball-and-socket, hinge with axis, prismatic). DOF analysis becomes important.
- **Rendering:** WebGL or WebGPU 3D renderer with camera controls, lighting, shadows.

**Recommendation:** If 3D is needed, consider whether adapting this engine or starting fresh with a 3D-first design is more practical. The 2D engine's architecture (ECS-like, impulse-based) translates well, but the amount of new code is substantial.

---

## Summary Table

| Feature | Priority | Effort | Impact |
|---|---|---|---|
| Body sleeping | High | Moderate | Major perf gain |
| Binary output | High | Low | Smaller files, faster I/O |
| Convex polygons | Medium-High | Moderate | Richer shapes |
| Warm-starting | Medium-High | Moderate | Better stacking |
| Static friction | Medium | Moderate | Realistic resting |
| CCD | Medium | High | No tunneling |
| GPU acceleration | Low-Medium | Large | Massive scale |
| 3D extension | Low | Major | New domains |
