---
from: pm
to: researcher
date: 2026-03-29
status: read
subject: Phase 3 — Constraint Solver Research
---

# Phase 3 — Research Tasks

The developer is implementing constraint joints (distance, revolute, fixed) and friction.

## Deliverables

### 1. Constraint Solver Validation Cases (`doc/researcher/memo/phase3-test-cases.md`)

**Scenario A: Simple Pendulum**
- Body (mass=1) connected to fixed point by distance constraint (length=2m)
- Released from horizontal (90° from vertical)
- Analytical: period T = 2π√(L/g) ≈ 2.838s for L=2, g=9.81
- Position at various times (small-angle breaks down, but we start at 90°)
- At bottom: velocity = sqrt(2*g*L) = 6.264 m/s
- Energy should be conserved (KE + PE = constant)

**Scenario B: Double Pendulum (qualitative)**
- Two bodies connected in chain. Chaotic — no analytical solution.
- But: total energy should be conserved, constraints should hold, no explosion
- Provide initial conditions and qualitative expectations

**Scenario C: Car on Flat Surface**
- Car (chassis + 2 wheels with revolute joints) placed on floor
- Should settle under gravity
- Wheels should be able to rotate freely
- Push the car: it should roll (wheels rotate, chassis translates)
- What forces/torques to expect?

**Scenario D: Car on a Ramp**
- 30° incline. Car placed at top.
- With friction: should roll down (not slide). Acceleration = g*sin(θ) * factor for rolling
- Without friction: should slide down. Acceleration = g*sin(θ)
- Provide expected accelerations

**Scenario E: Constraint Breaking**
- Body connected to anchor by distance constraint with breakForce=100N
- Apply gradually increasing force. Constraint should break at the threshold.
- After breaking: body should move freely

### 2. Friction Research (`doc/researcher/memo/phase3-friction.md`)
- Coulomb friction model: static vs kinetic distinction? (Recommendation: start with just kinetic, add static later)
- Combined friction coefficient formula: min, geometric mean, or custom?
- Rolling friction vs sliding friction — do we need both for Phase 3?
- What coefficient values are realistic for common materials?

## Coordination
- Work on branch `researcher/phase3-analysis`
- Deliver to tester inbox
- Notify PM when done
