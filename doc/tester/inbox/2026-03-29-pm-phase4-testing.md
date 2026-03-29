---
from: pm
to: tester
date: 2026-03-29
status: read
subject: Phase 4 — Environment + Output Testing
---

# Phase 4 — Testing Tasks

**Wait for:** Developer and researcher to complete Phase 4 work.

## Deliverables:

### 1. Environment Tests
- Static bodies: floor, walls, boundary box
- Objects interact with environment correctly (bounce off walls, land on floor)

### 2. Snapshot Validation
- Snapshot captures all body states, constraints, contacts
- All fields present and correctly typed
- JSON-serializable (no circular refs, no undefined)
- Round-trip: serialize → parse → compare

### 3. Recording Validation
- Record 100+ steps of a scene
- Verify correct number of snapshots
- Verify time advances monotonically
- Verify body positions change frame-to-frame (things are moving)
- Export JSON: valid, parseable, contains all data
- File size is reasonable (not gigabytes for 100 frames)

### 4. Scene Builder Tests
- Create scene with mixed objects
- Verify simulation runs correctly with scene

Write `doc/tester/memo/phase4-test-report.md` and notify PM.
Branch: `tester/phase4-tests`
