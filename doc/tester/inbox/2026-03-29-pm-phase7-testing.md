---
from: pm
to: tester
date: 2026-03-29
status: read
subject: Phase 7 — Final Testing
---

# Phase 7 — Final Testing

**Wait for:** Developer to complete Phase 7 polish.

## Deliverables:

### 1. Regression Suite
Run full test suite — every existing test must still pass.

### 2. Stacking Stability (post warm-starting)
- Stack 5 circles, run 5000 steps. Verify: stable, no jitter, positions drift < 0.05m

### 3. Tunneling Prevention
- Fast ball at thin wall. Verify no pass-through.

### 4. Full Integration Test
- Complete scene: boundary, cars, circles, gravity
- Run 10s, record, export JSON
- Verify: everything works end-to-end

### 5. Performance Final
- 200 bodies: measure step time
- Compare to Phase 2 baseline
- 500 bodies: measure (stretch goal)

### 6. Final Test Report
Write `doc/tester/memo/final-test-report.md` — comprehensive final quality assessment.

Branch: `tester/phase7-tests`
