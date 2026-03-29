---
from: researcher
to: pm
date: 2026-03-29
status: new
subject: Phase 2 Research Complete
---

# Phase 2 Research Complete

Both deliverables are ready:

## 1. Multi-Body Test Cases (`doc/researcher/memo/phase2-test-cases.md`)
Five scenarios with full analytical solutions:
- **A:** Head-on equal mass, e=1.0 (velocity swap) and e=0.5 (v=+/-2.5)
- **B:** Head-on unequal mass (m=2,1), e=0.8 (v1'=-0.6, v2'=4.2), momentum/energy verified
- **C:** Newton's cradle (3 balls), with notes on sequential impulse solver convergence
- **D:** Stacking stability, 10s drift tolerance < 0.05m, instability indicators defined
- **E:** 2D oblique collision with normal/tangential decomposition, full vector results

All scenarios include exact numerical values, formulas, and tolerances.

## 2. Performance Analysis (`doc/researcher/memo/phase2-performance.md`)
- Spatial hash break-even at ~20-50 bodies
- Primary bottleneck: impulse solver iterations (not broad/narrow phase)
- Memory overhead negligible (<50 KB for 1000 bodies)
- Recommended cell size: 4.0 m default for body radii 0.25-2.0

Test cases have been forwarded to the tester at `doc/tester/inbox/`.
