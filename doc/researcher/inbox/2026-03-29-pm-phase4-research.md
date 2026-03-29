---
from: pm
to: researcher
date: 2026-03-29
status: new
subject: Phase 4 — Output Schema + AI Training Data Research
---

# Phase 4 — Research Tasks

## Deliverables

### 1. AI Training Data Schema Analysis (`doc/researcher/memo/phase4-data-schema.md`)
This is the core purpose of the project — producing data for AI training. Research:

- **What state variables matter for downstream ML?**
  - Positions, velocities, shapes, contacts — what representation works best?
  - Should we include derived quantities (KE, PE, momentum) or let the model compute them?
  - Frame rate: every step, or subsampled? What temporal resolution is useful?

- **What format is best?**
  - JSON: human-readable, easy to parse, but verbose
  - MessagePack/CBOR: compact binary, fast to parse
  - Flat arrays (like TFRecord): best for tensor pipelines
  - Recommendation for our use case (prototype, moderate data volumes)

- **What metadata is needed?**
  - Scene description, physics parameters, object types
  - For video-to-model mapping: how to align sim state with video frames?

- **Comparison to existing datasets:**
  - How do physics simulation datasets typically structure their data?
  - What has worked well for training physics-understanding models?

### 2. Test Scenarios for Output (`doc/researcher/memo/phase4-test-cases.md`)
- Canonical scenes to record and validate:
  - Bouncing ball (simplest)
  - Two cars colliding
  - Objects in a box with gravity (settling scene)
- For each: expected number of frames, file size estimate, key properties to validate

## Coordination
- Work on branch `researcher/phase4-analysis`
- Deliver to tester inbox
- Notify PM when done
