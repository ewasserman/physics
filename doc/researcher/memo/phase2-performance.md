# Phase 2: Performance Scaling Analysis

## Collision Detection Complexity

### Brute-Force (No Broad Phase)

Every pair of bodies is tested for collision each frame.

- Pair count: N*(N-1)/2
- Complexity: **O(N^2)** per frame
- At N=100: 4,950 pair checks
- At N=1000: 499,500 pair checks
- Each check involves distance computation (cheap for circles, more expensive for polygons)

### Spatial Hash (Broad Phase)

Bodies are inserted into a grid of cells. Only bodies sharing a cell (or adjacent cells) are tested against each other.

- Insert all bodies: O(N)
- Query neighbors for each body: O(1) average (assuming uniform distribution and good cell size)
- Total: **O(N) average case**
- Worst case (all bodies in one cell): O(N^2) -- degenerates to brute force

### Comparison

| N Bodies | Brute Force Pairs | Spatial Hash Checks (avg) | Speedup Factor |
|----------|-------------------|---------------------------|----------------|
| 10       | 45                | ~30                       | 1.5x           |
| 50       | 1,225             | ~150                      | 8x             |
| 100      | 4,950             | ~300                      | 16x            |
| 500      | 124,750           | ~1,500                    | 83x            |
| 1,000    | 499,500           | ~3,000                    | 166x           |

Spatial hash estimates assume ~3 candidate neighbors per body on average (sparse to moderate density).

## Break-Even Point

The spatial hash has overhead costs:
- Hash table management: allocation, insertion, clearing each frame
- Hash computation per body
- Potential cache misses for scattered memory access

Estimated overhead per body: ~5-10x the cost of a single distance check.

**Break-even estimate: N ~ 20-50 bodies.**

Below 20 bodies, brute force is simpler and may be faster due to lower constant factors and better cache behavior. Above 50 bodies, spatial hash wins decisively.

**Recommendation:** Implement both and switch based on body count, or always use spatial hash since the overhead is minimal and it handles growth gracefully.

## Expected Bottleneck Analysis

### Phase Costs (per frame, N=100)

| Phase                  | Operations          | Relative Cost |
|------------------------|---------------------|---------------|
| Broad phase (hash)     | N inserts + queries | Low           |
| Narrow phase (SAT)     | ~300 pair tests     | Medium        |
| Contact generation     | Per collision        | Low           |
| Impulse solver         | Per contact * iters  | High          |
| Position integration   | N bodies             | Low           |

**Primary bottleneck: Impulse solver iterations.**

The sequential impulse solver runs multiple iterations (typically 4-10) over all contact constraints each frame. For a scene with C active contacts and I iterations, the cost is O(C * I). In dense scenes (stacking, piling), C can approach N, making this O(N * I).

**Secondary bottleneck: Narrow phase for complex shapes.** SAT for polygons requires edge-normal projections. For circles, narrow phase is trivial (distance check). Since our initial implementation uses circles, narrow phase will be cheap.

## Memory Footprint

### Spatial Hash

| Component              | Memory                          | Example (N=100, grid=32x32) |
|------------------------|---------------------------------|-----------------------------|
| Cell array             | cells * pointer_size            | 32*32*8 = 8 KB             |
| Body lists per cell    | N * entry_size (avg)            | 100 * 16 = 1.6 KB          |
| Hash table overhead    | ~2x entries for load factor     | ~3.2 KB                    |
| **Total**              |                                 | **~13 KB**                  |

For N=1000: approximately 30-50 KB. Negligible compared to body state data.

### Body State

Each body stores position, velocity, rotation, angular velocity, mass, inertia, shape data. Approximately 100-200 bytes per body.
- N=100: ~20 KB
- N=1000: ~200 KB

**Memory is not a concern** for any reasonable body count (up to tens of thousands).

## Cell Size Recommendation

The spatial hash cell size should be chosen so that:
1. A body fits within at most 4 cells (2x2 region) to minimize multi-cell insertions.
2. Cells are not so large that many bodies share a cell (defeating the purpose).

**Rule of thumb: cell_size = 2 * max_body_diameter**

For our body sizes (radius 0.25 to 2.0, diameter 0.5 to 4.0):

| Body Size Range | Recommended Cell Size |
|-----------------|-----------------------|
| Uniform small (r=0.25-0.5) | 2.0 m |
| Mixed (r=0.25-2.0) | 8.0 m |
| Uniform large (r=1.0-2.0) | 8.0 m |

**Practical recommendation: cell_size = 4.0 m** as a default. This handles the common case well. If bodies are predominantly small, 2.0 m is better. The cell size can be made configurable or auto-tuned based on the average body size at initialization.

If the simulation world is bounded (e.g., 100x100 m), a 4.0 m cell size gives a 25x25 grid (625 cells), which is very manageable.

## Summary Recommendations

1. **Use spatial hash for N >= 20.** Below that, brute force is fine.
2. **Solver iterations are the bottleneck.** Budget 4-8 iterations. More than 10 gives diminishing returns.
3. **Memory is not a concern.** Spatial hash adds < 50 KB even for 1000 bodies.
4. **Default cell size: 4.0 m.** Tune if body sizes are known to be uniform.
5. **Profile narrow phase only if using complex polygon shapes.** For circles, it is negligible.
