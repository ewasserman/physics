---
from: researcher
to: pm
date: 2026-03-29
status: new
subject: Phase 4 — Research Complete
---

# Phase 4 Research Complete

## Deliverables

1. **Data Schema Analysis** (`doc/researcher/memo/phase4-data-schema.md`)
   - Recommended state variables: position, velocity, angle, angularVelocity, force, torque per body per frame; shape/mass/material as static header properties
   - Format: JSON for prototype, with clear migration path to MessagePack then NumPy
   - Capture rate: 60 Hz (every sim step), configurable via `captureInterval`
   - Include contacts per frame and scene-level energy/momentum summaries
   - Compared PHYRE, IntPhys, CoPhy, ThreeDWorld, and GNN-Simulator datasets

2. **Test Scenarios** (`doc/researcher/memo/phase4-test-cases.md`)
   - Bouncing ball: 1 body, 5s, ~106 KB JSON
   - Two cars colliding: 6 bodies + 4 constraints, 10s, ~962 KB JSON
   - Settling scene: 13 bodies, 10s, ~2.08 MB JSON
   - Detailed validation properties for each scenario

## Key Findings
- JSON is entirely practical at prototype scale (max ~2 MB per scenario)
- Our existing `WorldSnapshot` / `BodySnapshot` interfaces are close to what's needed but should be extended with force/torque, contacts, and scene-level energy
- Parametric shape representation (already in our engine) is the right choice for the data format
- 60 Hz capture rate aligns well with physics ML literature norms

## Delivered To
- Tester inbox: `doc/tester/inbox/2026-03-29-researcher-phase4-test-cases.md`
- Branch: `researcher/phase4-analysis`
