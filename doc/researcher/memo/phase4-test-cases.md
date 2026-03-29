# Phase 4 — Test Scenarios for Recording Output

Three canonical scenarios for validating the simulation recording system.

## Size Estimation Model

Based on the JSON schema from phase4-data-schema.md:
- Per body per frame: ~180 bytes
- Per contact per frame: ~100 bytes
- Per frame overhead: ~120 bytes
- Header/metadata: ~500-2000 bytes depending on scene complexity

---

## Scenario 1: Bouncing Ball

### Setup
- 1 circle body (radius 0.5, mass 1.0, restitution 0.8)
- Dropped from height y=5.0 with zero initial velocity
- Floor at y=0
- Gravity = (0, -9.81)
- Duration: 5 seconds
- Capture rate: 60 Hz (default, matching dt=1/60)

### Expected Output
- **Frames**: 5s * 60 Hz = **300 frames**
- **Bodies per frame**: 1
- **Contacts per frame**: ~0.5 average (contact only near floor bounces)
- **File size estimate**:
  - Header: ~600 bytes
  - Frames: 300 * (120 + 1*180 + 0.5*100) = 300 * 350 = 105,000 bytes
  - Total: **~106 KB** (uncompressed JSON)
  - gzipped: ~15-25 KB (JSON compresses ~5-7x)

### Validation Properties

1. **Frame count**: Exactly 300 frames.
2. **Timestamps**: Monotonically increasing, first = 0.0, last near 5.0, spacing = 1/60 s.
3. **Body identity**: Same body id=0 in every frame.
4. **Gravity response**: y-velocity should decrease (become more negative) between bounces at rate ~9.81 m/s^2.
5. **Bounce detection**: Position y should reach floor (y near radius=0.5), then reverse velocity direction. At least 3-4 bounces expected with restitution=0.8.
6. **Energy decay**: Scene kinetic energy at each bounce apex should be ~0.64x (0.8^2) the previous apex. Total energy should decrease monotonically over the trajectory.
7. **x-position constant**: No lateral forces, so x should remain constant (within float tolerance).
8. **Contact events**: Contact entries should appear in frames where the ball is at/near the floor.
9. **Schema compliance**: Every frame has frameIndex, timestamp, bodies array, contacts array, energy, momentum fields.

---

## Scenario 2: Two Cars Colliding

### Setup
- 2 cars, each consisting of: 1 chassis (AABB) + 2 wheels (circles) = 3 bodies, 2 revolute constraints
- Total: **6 bodies, 4 constraints**
- Car A at x=-5, moving right (vx=3)
- Car B at x=+5, moving left (vx=-3)
- Floor at y=0
- Duration: 10 seconds
- Capture rate: 60 Hz

### Expected Output
- **Frames**: 10s * 60 Hz = **600 frames**
- **Bodies per frame**: 6
- **Contacts per frame**: ~4 average (wheels on floor = 4, plus collision contacts during impact)
- **File size estimate**:
  - Header: ~2000 bytes (6 bodies + 4 constraints described)
  - Frames: 600 * (120 + 6*180 + 4*100) = 600 * (120 + 1080 + 400) = 600 * 1600 = 960,000 bytes
  - Total: **~962 KB** (~0.94 MB uncompressed JSON)
  - gzipped: ~140-190 KB

### Validation Properties

1. **Frame count**: Exactly 600 frames.
2. **Body count consistency**: 6 bodies in every frame.
3. **Constraint recording**: Header should list 4 revolute constraints with correct body references.
4. **Pre-collision motion**: Before collision (~frame 0-50), Car A bodies should move rightward, Car B bodies leftward.
5. **Collision event**: Around the time cars meet (x-positions converge), contact entries should appear between bodies of different cars.
6. **Momentum conservation**: Total momentum (sum of m*v for all bodies) should be approximately conserved through the collision (within solver tolerance).
7. **Compound integrity**: Wheels should maintain approximately constant distance from their chassis throughout (constraint enforcement). The offset between wheel position and chassis position should remain near the anchor values.
8. **Post-collision dynamics**: After collision, cars should separate or deform. Velocities should change sign or reduce.
9. **Wheel rotation**: Angular velocity of wheels should be nonzero when wheels are in contact with the floor and translating.
10. **Energy**: Total energy should decrease at collision (inelastic) but be conserved during free motion phases.

---

## Scenario 3: Settling Scene (10 circles in a box)

### Setup
- 10 circle bodies (radius 0.3-0.5, random, mass 1.0 each, restitution 0.3)
- Randomly positioned in a 4x4 region above a box
- Box: 4 static AABB walls (floor + left + right + ceiling or just floor + 2 walls)
- Gravity = (0, -9.81)
- Duration: 10 seconds
- Capture rate: 60 Hz

### Expected Output
- **Frames**: 10s * 60 Hz = **600 frames**
- **Bodies per frame**: 10 dynamic + 3 static walls = **13 bodies** (or record only dynamic; depends on schema choice)
- **Contacts per frame**: Highly variable. Early: ~2-5 (few collisions while falling). Mid: ~8-15 (pile-up). Late: ~10-15 (resting contacts).
- **File size estimate** (recording all 13 bodies):
  - Header: ~2500 bytes
  - Frames: 600 * (120 + 13*180 + 10*100) = 600 * (120 + 2340 + 1000) = 600 * 3460 = 2,076,000 bytes
  - Total: **~2.08 MB** (uncompressed JSON)
  - gzipped: ~300-400 KB

### Validation Properties

1. **Frame count**: Exactly 600 frames.
2. **Body count consistency**: Same number of bodies in every frame.
3. **Settling behavior**: By the end of the recording (last ~100 frames), velocity magnitudes for all dynamic bodies should be near zero (< 0.01 m/s).
4. **Containment**: No dynamic body position should escape the box bounds at any frame.
5. **Non-penetration**: No two dynamic bodies should overlap significantly (center-to-center distance >= sum of radii minus small tolerance).
6. **Energy monotonic decrease**: With low restitution (0.3), total energy should decrease over time and approach a constant (all potential energy, zero kinetic).
7. **Contact growth**: Number of active contacts should generally increase over time as bodies pile up, then stabilize.
8. **Floor contacts**: By the end, most or all dynamic bodies should have a direct or transitive contact chain to the floor.
9. **Static bodies unchanged**: Static wall bodies should have zero velocity and unchanged position in every frame.
10. **Momentum**: Horizontal momentum should be approximately conserved (gravity is only vertical). Vertical momentum is not conserved due to gravity + floor normal forces.

---

## Summary Table

| Scenario | Bodies | Constraints | Duration | Frames | Est. JSON Size | Est. gzip |
|---|---|---|---|---|---|---|
| Bouncing ball | 1 | 0 | 5s | 300 | ~106 KB | ~20 KB |
| Two cars | 6 | 4 | 10s | 600 | ~962 KB | ~165 KB |
| Settling scene | 13 | 0 | 10s | 600 | ~2.08 MB | ~350 KB |

These sizes confirm that JSON is practical for our prototype-scale scenarios. Even the largest case is ~2 MB uncompressed, well within comfortable limits for development and testing.
