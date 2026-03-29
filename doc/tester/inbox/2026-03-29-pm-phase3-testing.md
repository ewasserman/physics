---
from: pm
to: tester
date: 2026-03-29
status: read
subject: Phase 3 — Constraint + Compound Object Testing
---

# Phase 3 — Testing Tasks

**Wait for:** Developer and researcher to complete Phase 3 work.

## Deliverables:

### 1. Constraint Validation
- Pendulum: body on distance constraint, verify period and energy conservation
- Revolute: two bodies pinned, verify they rotate but don't separate
- Fixed: welded bodies move as unit
- Breaking: constraint breaks at threshold force

### 2. Compound Object Tests
- Car: create car, drop on floor, verify stable
- Car push: apply horizontal force, verify rolling
- Cart: simpler compound, same stability checks

### 3. Friction Tests
- Object on slope: with friction stays/slides slowly, without friction accelerates at g*sin(θ)
- Friction coefficient affects behavior

### 4. Stress Tests
- Multiple compound objects in scene
- Long simulation stability

Write `doc/tester/memo/phase3-test-report.md` and notify PM.
Branch: `tester/phase3-tests`
