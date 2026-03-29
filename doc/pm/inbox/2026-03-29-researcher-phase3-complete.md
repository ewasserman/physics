---
from: researcher
to: pm
date: 2026-03-29
status: new
subject: Phase 3 Research Complete
---

# Phase 3 Research Complete

All deliverables are ready:

## 1. Constraint Test Cases (`doc/researcher/memo/phase3-test-cases.md`)
Five scenarios with concrete numerical values:
- **Scenario A (Simple Pendulum):** Body on distance constraint, L=2m, 90-degree release. Period ~3.35s, bottom velocity 6.264 m/s, energy 19.62 J. Positions at T/4 intervals provided.
- **Scenario B (Double Pendulum):** Two-body chain, chaotic. Energy 44.145 J must be conserved. Constraint distances must hold within 0.05m over 30s.
- **Scenario C (Car on Flat):** Chassis (5kg) + 2 wheels (1kg each). Settling test and horizontal push (50N for 0.5s). Expected acceleration ~6.25-7.14 m/s^2.
- **Scenario D (Car on Ramp):** Theoretical values for 30-degree incline (not yet implementable). Rolling: 4.29 m/s^2, sliding: 4.905 m/s^2.
- **Scenario E (Constraint Breaking):** breakForce=50N threshold. Gravity alone (9.81N) won't break; adding 50N downward (total 59.81N) should break.

## 2. Friction Research (`doc/researcher/memo/phase3-friction.md`)
- Recommend kinetic friction only for Phase 3 (defer static friction)
- Combined coefficient: geometric mean sqrt(mu_a * mu_b)
- Default mu = 0.5
- Rolling resistance: optional, use angular velocity damping
- Implementation notes: friction as tangential impulse during collision response, clamped to prevent reversal

Test cases have been forwarded to the tester inbox.
