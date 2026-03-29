# Phase 3 — Constraint Solver Validation Test Cases

## Scenario A: Simple Pendulum

**Setup:**
- Fixed anchor point at (0, 5)
- Body: mass = 1 kg, initially at (2, 5)
- Distance constraint: length L = 2 m
- Released from rest (horizontal position, 90 degrees from vertical)
- Gravity g = 9.81 m/s^2

**Analytical Reference Values:**

Period (small-angle approximation): T_small = 2 * pi * sqrt(L/g) = 2 * pi * sqrt(2/9.81) = 2.838 s

For 90-degree release the period is longer. The exact period for amplitude theta_0 = pi/2 involves an elliptic integral. The correction factor is approximately 1.18, giving T_90 = 3.35 s.

Energy conservation:
- Total energy E = m * g * h = 1 * 9.81 * 2 = 19.62 J (height difference from release to bottom is 2 m)
- This must remain constant throughout the simulation

At bottom of swing (0, 3):
- All energy is kinetic: 0.5 * m * v^2 = 19.62 J
- v = sqrt(2 * g * L) = sqrt(2 * 9.81 * 2) = 6.264 m/s (directed horizontally)

**Expected Positions (using T = 3.35 s for 90-degree release):**

| Time | Approximate Position | Notes |
|------|---------------------|-------|
| t = 0.000 s | (2.000, 5.000) | Release point, horizontal right |
| t = 0.838 s (T/4) | (0.000, 3.000) | Bottom of swing, max velocity |
| t = 1.675 s (T/2) | (-2.000, 5.000) | Opposite side, momentarily at rest |
| t = 2.513 s (3T/4) | (0.000, 3.000) | Bottom of swing again |
| t = 3.350 s (T) | (2.000, 5.000) | Back to start |

Note: These positions assume the pendulum bob traces a perfect circular arc of radius 2 m centered on (0, 5). The y-coordinate at the bottom is 5 - 2 = 3.

**Validation Criteria:**
- Constraint distance |pos - anchor| should remain within 0.01 m of 2.0 m at all times
- Total energy (KE + PE) should remain within 2% of 19.62 J over 10 full periods
- No NaN or Inf values
- Period should be within 10% of 3.35 s (measured as time between successive passes through the bottom)

---

## Scenario B: Double Pendulum (Chaotic)

**Setup:**
- Fixed anchor at (0, 5)
- Body 1: mass = 1 kg, initially at (1.5, 5) — horizontal right of anchor
- Body 2: mass = 1 kg, initially at (3.0, 5) — horizontal right of body 1
- Distance constraint anchor-to-body1: L1 = 1.5 m
- Distance constraint body1-to-body2: L2 = 1.5 m
- Both released from rest

**Energy:**
- Body 1 drops from (1.5, 5) to lowest point (0, 3.5): h1 = 1.5 m
- Body 2 drops from (3.0, 5) to lowest point (0, 2.0): h2 = 3.0 m
- Total potential energy at start (relative to lowest possible point):
  - E1 = m1 * g * h1 = 1 * 9.81 * 1.5 = 14.715 J
  - E2 = m2 * g * h2 = 1 * 9.81 * 3.0 = 29.430 J
  - E_total = 44.145 J

**Validation Criteria (qualitative — no exact solution exists):**
- Total energy (KE1 + KE2 + PE1 + PE2) conserved within 5% of 44.145 J over 30 seconds
- Constraint distances:
  - |body1 - anchor| should stay within 0.05 m of 1.5 m
  - |body2 - body1| should stay within 0.05 m of 1.5 m
- No NaN, Inf, or position explosion (all positions remain within a 10 m radius of anchor)
- Simulation must run the full 30 seconds without crashing

---

## Scenario C: Car on Flat Surface

**Setup:**
- Floor: static surface at y = 0
- Chassis: AABB body, width = 2 m, height = 0.5 m, mass = 5 kg
- Wheel 1 (front): circle, radius = 0.4 m, mass = 1 kg
- Wheel 2 (rear): circle, radius = 0.4 m, mass = 1 kg
- Wheel centers positioned at (-0.7, 0.4) and (0.7, 0.4) — at axle height
- Chassis center at (0, 1.15) — resting on top of wheels (wheel top at y=0.8, chassis bottom at y=0.9, chassis center at y=1.15)
- Revolute joints connecting each wheel to chassis at wheel center positions
- Total mass = 5 + 1 + 1 = 7 kg

**Test C1: Settling Under Gravity**
- Release from slightly above rest position (chassis at y = 1.25)
- Should settle to equilibrium within 2 seconds
- Wheel centers at y = 0.4 (radius above floor)
- Chassis center at approximately y = 1.15
- Vertical velocity should approach 0

**Test C2: Horizontal Push**
- From settled position, apply horizontal force F = 50 N to chassis for 0.5 s
- Simplified acceleration (ignoring wheel rotational inertia): a = F / m_total = 50 / 7 = 7.14 m/s^2
- More accurate (accounting for wheel rotational inertia):
  - Wheel moment of inertia (solid disc): I = 0.5 * m * r^2 = 0.5 * 1 * 0.16 = 0.08 kg*m^2 per wheel
  - Effective mass contribution per wheel: I/r^2 = 0.08/0.16 = 0.5 kg
  - Effective total mass: 5 + 2*(1 + 0.5) = 8 kg
  - a = 50 / 8 = 6.25 m/s^2
- After 0.5 s: velocity = a * t = 6.25 * 0.5 = 3.125 m/s (or 7.14 * 0.5 = 3.57 m/s simplified)
- After force removed (no friction): car continues at constant velocity
- After force removed (with friction mu=0.5): deceleration = mu * g = 4.905 m/s^2

**Validation Criteria:**
- Wheels remain on floor (y_center = 0.4 +/- 0.05)
- Chassis stays above wheels
- Revolute joints hold: wheel centers maintain correct offset from chassis
- Wheels rotate when car moves (angular velocity = v / r)
- No interpenetration of wheels with floor

---

## Scenario D: Car on 30-Degree Ramp (Theoretical Reference)

**Note:** Angled surfaces are not yet implemented. These values are for future validation.

**Setup:**
- Same car as Scenario C on a 30-degree incline
- g = 9.81 m/s^2, theta = 30 degrees

**Case D1: Rolling without slipping (sufficient friction)**
- For a system with solid disc wheels (I = 0.5 * m * r^2):
  - a = g * sin(theta) / (1 + I_wheel / (m_wheel * r^2))
  - For the wheels: factor = 1 + 0.5 = 1.5
  - But the chassis doesn't rotate, so overall:
  - Gravitational force along ramp: (m_total) * g * sin(theta) = 7 * 9.81 * 0.5 = 34.335 N
  - Translational inertia: m_total = 7 kg
  - Rotational inertia of 2 wheels: 2 * I / r^2 = 2 * 0.08 / 0.16 = 1.0 kg equivalent
  - a = 34.335 / (7 + 1.0) = 4.29 m/s^2

**Case D2: Sliding (no friction)**
- a = g * sin(theta) = 9.81 * 0.5 = 4.905 m/s^2

**Minimum friction to prevent sliding:**
- mu_min = tan(theta) / (1 + m_total * r^2 / (2 * I_wheel))
- This is a simplified estimate; exact value depends on mass distribution

---

## Scenario E: Constraint Breaking

**Setup:**
- Body: mass = 1 kg at (0, 0)
- Anchor: fixed point at (0, 5)
- Distance constraint: length = 5 m, breakForce = 50 N

**Test E1: Gravity Alone (should NOT break)**
- Gravitational force: F = m * g = 1 * 9.81 = 9.81 N
- 9.81 N < 50 N threshold: constraint holds
- Body hangs at (0, 0), stationary

**Test E2: Applied Downward Force (should break)**
- Apply additional downward force of 50 N to body
- Total downward force: 9.81 + 50 = 59.81 N
- 59.81 N > 50 N threshold: constraint should break
- Timing: constraint breaks on the frame where force exceeds threshold
- After breaking: body is subject only to gravity + applied force
  - If applied force continues: a = (9.81 + 50) / 1 = 59.81 m/s^2 downward
  - If applied force is impulse only: a = 9.81 m/s^2 downward (free fall)

**Test E3: Gradual Force Ramp**
- Ramp external downward force from 0 to 60 N over 3 seconds (20 N/s)
- Break should occur when total force reaches 50 N
- That is when external force = 50 - 9.81 = 40.19 N
- Time of break: t = 40.19 / 20 = 2.01 s
- Position at break: body should still be at approximately (0, 0) (hanging)
- After break: free fall with whatever force is active at that moment

**Validation Criteria:**
- Constraint holds when force < breakForce
- Constraint breaks on the frame where force >= breakForce
- After breaking, body moves freely (no residual constraint forces)
- No NaN or sudden position jumps at the moment of breaking
