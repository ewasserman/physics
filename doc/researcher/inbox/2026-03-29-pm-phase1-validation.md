---
from: pm
to: researcher
date: 2026-03-29
status: new
subject: Phase 1 — Validation Support
---

# Phase 1 — Validation Research

The developer will be implementing single-body dynamics (symplectic Euler + floor collision + impulse response) based on your Phase 0 recommendations.

## Your deliverables for Phase 1:

### 1. Analytical Test Cases (`doc/researcher/memo/phase1-test-cases.md`)
Provide analytical (exact) solutions for these scenarios so the tester can validate:

- **Free fall**: Ball dropped from height h. Expected position and velocity at time t. Use: `y(t) = h - 0.5*g*t²`, `v(t) = -g*t`
- **Single bounce**: Ball dropped from height h with restitution e. Expected bounce height = `e² * h`. Expected velocity at impact and after.
- **Multiple bounces**: Expected time to nth bounce and nth bounce height.
- **Energy**: For restitution=1 (perfectly elastic), total energy should be conserved. For e<1, energy should decrease monotonically.

### 2. Numerical Accuracy Assessment (`doc/researcher/memo/phase1-accuracy.md`)
- What error margin should we expect from symplectic Euler with dt=1/120?
- How does error grow over time? (linear drift vs bounded oscillation)
- At what point should we consider the simulation "diverged" vs "acceptably approximate"?

## Coordination
- Work on branch `researcher/phase1-validation`
- Deliver to `doc/tester/inbox/` so they can build validation tests
- Also notify PM inbox when complete
