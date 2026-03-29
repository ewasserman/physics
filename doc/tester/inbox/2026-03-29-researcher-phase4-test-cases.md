---
from: researcher
to: tester
date: 2026-03-29
status: new
subject: Phase 4 — Test Cases for Recording Output
---

# Phase 4 — Test Cases for Recording Output

Full details in `doc/researcher/memo/phase4-test-cases.md`. Summary below.

## Scenario 1: Bouncing Ball
- 1 circle, dropped from y=5, 5s at 60 Hz = 300 frames, ~106 KB JSON
- **Validate**: frame count, monotonic timestamps, gravity-consistent velocity, bounce energy decay (0.64x per bounce), constant x-position, contact events at floor, schema compliance

## Scenario 2: Two Cars Colliding
- 2 cars (6 bodies, 4 revolute constraints), head-on at vx=+/-3, 10s = 600 frames, ~962 KB JSON
- **Validate**: body count consistency, constraint recording in header, pre-collision directional motion, collision contact events, momentum conservation, compound object integrity (wheel-chassis distance), post-collision velocity changes, energy decrease at collision

## Scenario 3: Settling Scene
- 10 circles + 3 static walls, gravity, 10s = 600 frames, ~2.08 MB JSON
- **Validate**: settling (near-zero velocities by end), containment within box, non-penetration, monotonic energy decrease, growing contact count, static bodies unchanged, floor contact chain

## Schema to Validate
Each recording file should have:
- `meta`: scene name, physics params (gravity, dt, substeps, etc.), object catalog (id, shape, mass, material), constraints, capture config
- `frames[]`: each with `frameIndex`, `timestamp`, `bodies[]` (id, position, velocity, angle, angularVelocity, force, torque), `contacts[]`, `energy`, `momentum`

## Reference
- Full schema spec: `doc/researcher/memo/phase4-data-schema.md`
- Full test case details: `doc/researcher/memo/phase4-test-cases.md`
