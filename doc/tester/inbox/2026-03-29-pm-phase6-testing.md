---
from: pm
to: tester
date: 2026-03-29
status: new
subject: Phase 6 — Perturbation Testing
---

# Phase 6 — Testing Tasks

**Wait for:** Developer to complete Phase 6.

## Deliverables:

### 1. Interaction Tests
- Hit-testing accuracy for all shape types
- Force application changes body state
- Joint breaking removes constraint
- Object dropping adds to world

### 2. Perturbation Recording
- Perturbations appear in recording JSON
- Recording with perturbations is valid and parseable

### 3. Integration
- All existing tests pass
- Live sim + interactions work together

### 4. Manual Checklist
- [ ] Force tool: click-drag on body shows arrow, release applies force
- [ ] Break tool: hovering constraint highlights it, click breaks it
- [ ] Drop tool: clicking places new object
- [ ] Perturbations recorded in export

Write `doc/tester/memo/phase6-test-report.md` and notify PM.
Branch: `tester/phase6-tests`
