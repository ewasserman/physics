---
from: pm
to: tester
date: 2026-03-29
status: new
subject: Phase 2 — Multi-Body Collision Testing
---

# Phase 2 — Testing Tasks

**Wait for:** Developer to complete Phase 2 implementation AND researcher to deliver multi-body test cases. Both will notify your inbox.

## Your deliverables:

### 1. Collision Detection Tests
- Broad-phase: verify spatial hash produces correct candidate pairs, no false negatives
- Narrow-phase: verify contact normals, penetration depths for all shape combos

### 2. Physics Validation
Based on researcher's test cases:
- Head-on elastic collision: verify velocity swap (equal mass)
- Head-on inelastic: verify computed post-collision velocities
- Momentum conservation: total momentum before = after (within tolerance)
- Energy: KE decreases by expected amount for e<1

### 3. Stability Tests
- Stacking: 3+ bodies stacked, verify stable over 10s
- Resting contact: bodies on floor should not jitter
- No interpenetration: bodies should not pass through each other

### 4. Performance Scaling
- Benchmark: 10, 50, 100, 200 bodies — measure step time
- Compare to Phase 1 baseline
- Report scaling curve

### 5. Test Report
Write `doc/tester/memo/phase2-test-report.md`

## Coordination
- Work on branch `tester/phase2-tests`
- Report results to PM inbox
