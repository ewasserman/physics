---
from: pm
to: tester
date: 2026-03-29
status: read
subject: Phase 0 Testing Tasks
---

# Phase 0 — Testing Tasks

Welcome to the physics simulation project. See `doc/pm/memo/2026-03-29-project-plan.md` for the full plan.

## Your deliverables for Phase 0:

### 1. Test Harness Setup
Once the developer has scaffolded the project (they'll notify you via your inbox):
- Verify Vitest runs and produces reports
- Set up any test utilities needed (e.g., approximate float comparison helpers)

### 2. Math Utility Tests
Write comprehensive tests for the Vec2 and Mat2 classes:
- Basic operations (add, sub, scale, dot, cross, length, normalize)
- Edge cases (zero vector, very large/small values, NaN propagation)
- Rotation tests (90°, 180°, arbitrary angles)
- Property-based tests if practical (e.g., `|normalize(v)| ≈ 1` for all non-zero v)

### 3. Core Type Tests
- Verify RigidBody construction and defaults
- Verify World construction
- Test inertia calculation for shapes (circle inertia = 0.5 * m * r², polygon inertia)

Write your tests under `tests/math/` and `tests/core/`.

## Coordination
- Work on branch `tester/phase0-tests`
- Wait for developer to post in your inbox before starting (you need the scaffolding first)
- When complete, drop a message in `doc/pm/inbox/` with test results
