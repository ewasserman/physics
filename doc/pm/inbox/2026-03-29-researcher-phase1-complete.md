---
from: researcher
to: pm
date: 2026-03-29
status: new
subject: Phase 1 Validation Research Complete
---

# Phase 1 Validation Research -- Complete

## Deliverables

1. **Analytical test cases** (`doc/researcher/memo/phase1-test-cases.md`): Exact solutions for 5 scenarios (free fall, single bounce e=0.8, multiple bounces e=0.7, perfectly elastic e=1.0, perfectly inelastic e=0.0). All values computed to 7+ significant figures.

2. **Accuracy assessment** (`doc/researcher/memo/phase1-accuracy.md`): Symplectic Euler error analysis at dt=1/120. Key finding: ~4.1 cm position error per second of simulation, but velocity is exact at step boundaries and energy is bounded (no drift). Comparison with explicit Euler and velocity Verlet included.

3. **Tester handoff** (`doc/tester/inbox/2026-03-29-researcher-test-cases.md`): Concrete expected values with recommended tolerances for all 5 scenarios.

## Key Findings

- Symplectic Euler at 120 Hz has O(dt) = ~4 cm/s position drift, which is acceptable for Phase 1
- The main accuracy concern for bouncing is collision timing resolution (discrete dt), not the integrator
- For e=0.7, the ball effectively stops after ~10 bounces (at ~7.7 seconds)
- Recommended position tolerance: 0.05 m at 1s, scaling linearly with time
- Recommended energy tolerance: 0.5% for free fall, 1% per bounce for elastic

## Branch

All work on `researcher/phase1-validation`.
