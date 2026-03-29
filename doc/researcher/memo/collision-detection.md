# 2D Collision Detection Approaches

## Context
We need collision detection for a 2D rigid-body engine supporting:
- **Shape types:** Circles, convex polygons, AABBs (axis-aligned bounding boxes)
- **Scale:** Many bodies (target: 100+ without frame drops)
- **Speed:** Real-time or faster
- **Accuracy:** Visual plausibility -- small penetrations are acceptable if quickly resolved

Collision detection is typically split into two phases:
1. **Broad phase:** Quickly eliminate pairs that cannot possibly collide (O(n) or O(n log n) vs O(n^2))
2. **Narrow phase:** Exact intersection test + contact point generation for candidate pairs

---

## Narrow-Phase Methods

### Circle-Circle

**Algorithm:** Two circles collide iff the distance between centers is less than the sum of radii. Contact normal is the vector between centers; penetration depth is `(r1 + r2) - distance`.

| Property | Assessment |
|----------|------------|
| Complexity | O(1) per pair. One distance calculation. |
| Implementation | Trivial -- 5 lines of code. |
| Accuracy | Exact. |
| Output | Contact point, normal, penetration depth -- all trivial to compute. |

**Verdict:** The simplest possible collision test. Always use this for circle-circle pairs.

---

### Circle-Polygon

**Algorithm:** Find the closest point on the polygon boundary to the circle center. If the distance is less than the radius, there's a collision. The closest point is found by projecting the center onto each edge and taking the minimum.

| Property | Assessment |
|----------|------------|
| Complexity | O(e) per pair, where e = number of edges. |
| Implementation | Straightforward. Need to handle the "center inside polygon" case separately (use edge normals). |
| Accuracy | Exact for convex polygons. |

**Verdict:** Direct and efficient. Preferred over SAT/GJK for this specific pair type due to simplicity.

---

### Separating Axis Theorem (SAT)

**Algorithm:** Two convex shapes do NOT overlap if and only if there exists an axis along which their projections are separated. For polygons, the candidate axes are the edge normals of both shapes. Project both shapes onto each candidate axis; if projections overlap on ALL axes, the shapes collide.

| Property | Assessment |
|----------|------------|
| Complexity | O(e1 + e2) per pair for two polygons. For polygon-polygon, test normals from both polygons. For circle-polygon, only polygon normals plus the axis from the closest vertex to the circle center. |
| Implementation | Moderate. Need to project shapes onto axes, compute overlap intervals, find the minimum overlap (which gives the MTV -- minimum translation vector). |
| Accuracy | Exact for convex shapes. |
| Contact generation | The MTV (axis of minimum overlap) gives the contact normal. Penetration depth is the minimum overlap. Contact point requires a bit more work (clipping). |

**Key advantage:** SAT naturally produces the **Minimum Translation Vector (MTV)**, which tells you exactly how to separate the shapes. This is extremely useful for position correction.

**Verdict:** The standard approach for convex polygon collision in 2D. Well-documented, efficient, and produces all the contact information we need.

---

### GJK (Gilbert-Johnson-Keerthi)

**Algorithm:** Iteratively builds a simplex in Minkowski difference space to determine if two convex shapes overlap. Uses support functions (find the point on a shape furthest in a given direction).

| Property | Assessment |
|----------|------------|
| Complexity | O(e1 + e2) per iteration, typically converges in 2-3 iterations for 2D. Needs EPA (Expanding Polytope Algorithm) as a follow-up to get penetration depth. |
| Implementation | **Complex.** GJK + EPA is significantly harder to implement correctly than SAT. Edge cases around degenerate simplices, numerical precision issues. |
| Accuracy | Exact for convex shapes. Works with any shape that has a support function. |
| Generality | Handles any convex shape, including rounded shapes and Minkowski sums. |

**Verdict:** More general and elegant than SAT, but harder to implement and debug. The generality is unnecessary for our shape types (circles + polygons + AABBs), which SAT handles directly. GJK shines in 3D or with exotic shapes.

---

### Narrow-Phase Comparison

| Method | Shapes Supported | Complexity | Implementation | Contact Info |
|--------|-----------------|------------|----------------|-------------|
| Circle-Circle | Circle-circle only | O(1) | Trivial | Direct |
| Circle-Polygon | Circle-polygon only | O(e) | Easy | Direct |
| SAT | Any convex pair | O(e1+e2) | Moderate | MTV + clipping |
| GJK+EPA | Any convex pair | O(e1+e2) amortized | Hard | Requires EPA |

---

## Broad-Phase Methods

Without broad phase, checking all pairs is O(n^2). With 100 bodies that's 4,950 pairs per frame. With 500 bodies, 124,750 pairs. Broad phase reduces this to near-linear.

### Spatial Hashing

**Algorithm:** Divide world space into a grid of cells with a fixed cell size. Hash each object's AABB into the cells it overlaps. Two objects can only collide if they share a cell.

| Property | Assessment |
|----------|------------|
| Complexity | O(n) insertion, O(n) query (amortized). |
| Implementation | Easy. Hash function is `(floor(x/cellSize), floor(y/cellSize))`. Use a `Map<string, Body[]>` in TypeScript. |
| Memory | Proportional to occupied cells, not world size. Good for sparse worlds. |
| Tuning | Cell size should be ~2x the largest object. If object sizes vary wildly, performance degrades. |
| Dynamic objects | Rebuild every frame (cheap at O(n)). No incremental updates needed. |

**Verdict:** Simple, fast, and effective when objects are roughly similar in size. Perfect for our use case.

---

### Sweep-and-Prune (Sort-and-Sweep)

**Algorithm:** Project all AABBs onto one axis (typically x). Sort the intervals by their minimum coordinate. Sweep through the sorted list; overlapping intervals on the x-axis are candidates. Optionally repeat on y-axis.

| Property | Assessment |
|----------|------------|
| Complexity | O(n log n) initial sort, O(n) on subsequent frames (insertion sort on nearly-sorted data). |
| Implementation | Moderate. Need to maintain a sorted list of interval endpoints. Incremental insertion sort is the key optimization. |
| Memory | O(n) -- just the sorted list. |
| Strengths | Very cache-friendly. Excellent when objects move slowly between frames (common in physics). |
| Weaknesses | Degrades when many objects cluster along the chosen axis. Can produce many false positives if objects are aligned. |

**Verdict:** Great for medium-scale simulations. The incremental sort makes it very fast for physics where positions change smoothly. More complex to implement than spatial hashing.

---

### Quadtree

**Algorithm:** Recursively subdivide the world into quadrants. Each node holds objects; when a node exceeds a capacity threshold, it splits into 4 children. Query by traversing only the nodes that overlap the query region.

| Property | Assessment |
|----------|------------|
| Complexity | O(n log n) construction, O(log n + k) query per object. |
| Implementation | Moderate-high. Tree construction, insertion, and traversal logic. Need to handle objects spanning multiple nodes. |
| Memory | O(n) plus tree overhead. |
| Strengths | Adapts to non-uniform object distribution. Good for very large worlds with varying density. |
| Weaknesses | Overhead of tree construction every frame. Objects on boundaries create duplicates. Not cache-friendly. |

**Verdict:** Overly complex for our scale. Quadtrees shine with thousands of objects in large worlds with varying density. At 100-500 objects, the overhead isn't worth it.

---

### Uniform Grid

**Algorithm:** Divide the world into a fixed grid of cells. Each cell stores a list of objects whose AABBs overlap it. Check all pairs within each cell.

| Property | Assessment |
|----------|------------|
| Complexity | O(n) insert, O(n) query. |
| Implementation | Very easy -- 2D array of lists. |
| Memory | Proportional to world size (allocated grid even if empty). |
| Tuning | Same cell-size considerations as spatial hashing. |
| Limitation | Requires bounded world. Wastes memory if the world is large but sparse. |

**Verdict:** Essentially spatial hashing with a fixed-size array instead of a hash map. Slightly faster due to array access but requires knowing world bounds. Good if the world is bounded (which ours is -- floors, walls).

---

### Broad-Phase Comparison

| Method | Complexity | Implementation | Memory | Best For |
|--------|-----------|----------------|--------|----------|
| Spatial Hashing | O(n) | Easy | Sparse | General purpose, similar-size objects |
| Sweep-and-Prune | O(n log n) / O(n) incremental | Moderate | O(n) | Smooth motion, medium scale |
| Quadtree | O(n log n) | Hard | O(n) + tree | Large worlds, varying density |
| Uniform Grid | O(n) | Very easy | Proportional to world | Bounded worlds |

---

## Recommendation

### Narrow Phase: SAT + Specialized Tests

Use a **dispatch table** based on shape pair type:
- **Circle-Circle:** Direct distance test (trivial, exact)
- **Circle-Polygon:** Closest-point projection (simple, exact)
- **Polygon-Polygon:** SAT with MTV computation
- **AABB-AABB:** Simplified SAT (only 2 axes needed -- x and y)
- **AABB-Circle / AABB-Polygon:** Treat AABB as a polygon, use the appropriate test above

This approach is faster than using a single general-purpose algorithm (like GJK) for all pairs, because specialized tests skip unnecessary computation. SAT is the right "general" algorithm here because:
- It naturally produces the MTV (needed for position correction)
- Well-suited to 2D convex polygons
- Easier to implement and debug than GJK+EPA
- Performance is the same as GJK for convex polygons in 2D

### Broad Phase: Spatial Hashing

**Spatial hashing** is the best fit because:
1. O(n) complexity is hard to beat
2. Trivial to implement (< 50 lines of TypeScript)
3. Our objects (physics primitives) will be roughly similar in size
4. Works with unbounded worlds (no need to pre-allocate grid)
5. Rebuild-per-frame is fine at our scale and avoids incremental-update bugs

**Cell size:** Set to 2x the diameter of the largest object. If object sizes vary significantly later, we can switch to a hierarchical hash or multi-resolution grid.

**Fallback plan:** If spatial hashing proves insufficient (e.g., highly clustered scenarios), sweep-and-prune is the natural upgrade. The broad-phase interface should be abstracted so we can swap implementations.

### Implementation Architecture

```
broadPhase.findCandidatePairs(bodies) -> [BodyA, BodyB][]
    |
    v
narrowPhase.testPair(bodyA, bodyB) -> Contact | null
    |
    v
Contact { point, normal, penetration, bodyA, bodyB }
```

Key design points:
- Abstract the broad-phase behind an interface so we can swap implementations
- Use a shape-pair dispatch table for narrow phase (avoid one-size-fits-all)
- Contact struct should include: contact point(s), normal, penetration depth, body references
- Generate AABBs from all shapes cheaply (circles: center +/- radius; polygons: min/max of vertices after rotation)
