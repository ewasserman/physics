# Phase 1 Analytical Test Cases

## Common Setup

| Parameter | Value |
|-----------|-------|
| Gravity (g) | 9.81 m/s^2 (pointing -y) |
| Mass (m) | 1.0 kg |
| Radius (r) | 0.5 m |
| Initial position | (0, 10) m |
| Initial velocity | (0, 0) m/s |
| Floor | y = 0 (contact when center y = r = 0.5) |
| Effective fall distance | h - r = 9.5 m |

---

## Scenario A: Free Fall (no floor collision)

**Exact equations:**
- y(t) = 10 - 0.5 * 9.81 * t^2
- vy(t) = -9.81 * t
- x(t) = 0, vx(t) = 0 (no horizontal motion)

**Checkpoint values:**

| Time (s) | y (m) | vy (m/s) | KE (J) | PE (J) | Total E (J) |
|-----------|-------|----------|--------|--------|-------------|
| 0.0 | 10.0000000 | 0.0000000 | 0.000 | 98.100 | 98.100 |
| 0.5 | 8.7737500 | -4.9050000 | 12.030 | 86.070 | 98.100 |
| 1.0 | 5.0950000 | -9.8100000 | 48.120 | 49.982 | 98.100 |

**Floor impact:**
- Time: t_impact = sqrt(2 * 9.5 / 9.81) = sqrt(19/9.81) = **1.3916893 s**
- Position at impact: y = 0.5 m (center at floor-contact)
- Velocity at impact: vy = -9.81 * 1.3916893 = **-13.6524723 m/s**
- KE at impact: 0.5 * 1.0 * 13.6524723^2 = **93.195 J**
- PE at impact (center at r=0.5): 1.0 * 9.81 * 0.5 = **4.905 J**
- Total energy: **98.100 J** (conserved)

---

## Scenario B: Single Bounce (e = 0.8)

**At impact (same as Scenario A):**
- vy_before = -13.6524723 m/s
- KE_before = 93.195 J

**After bounce (impulse response):**
- vy_after = +e * |vy_before| = 0.8 * 13.6524723 = **+10.9219778 m/s**
- KE_after = 0.5 * 1.0 * 10.9219778^2 = **59.645 J**
- Energy lost in bounce: 93.195 - 59.645 = **33.550 J** (36.0% loss, ratio = 1 - e^2 = 0.36)

**Maximum height after first bounce:**
- h_max = r + vy_after^2 / (2*g) = 0.5 + 10.9219778^2 / 19.62
- h_max = 0.5 + 119.29 / 19.62 = 0.5 + 6.08 = **6.5800000 m**
- Equivalently: h_max = r + e^2 * (h - r) = 0.5 + 0.64 * 9.5 = 6.58 m

**Time of flight after first bounce:**
- t_up = vy_after / g = 10.9219778 / 9.81 = 1.1133515 s
- t_flight = 2 * t_up = **2.2267030 s**
- Second impact at t = 1.3916893 + 2.2267030 = **3.6183923 s**

---

## Scenario C: Multiple Bounces (e = 0.7)

**General formulas:**
- Velocity after bounce n: v_n = e^n * |v_impact| = 0.7^n * 13.6524723
- Max height after bounce n (center): h_n = r + e^(2n) * (h - r) = 0.5 + 0.7^(2n) * 9.5
- Height above floor after bounce n: delta_n = 0.7^(2n) * 9.5
- Flight time after bounce n: t_flight_n = 2 * v_n / g

**Concrete values:**

| Bounce | v_after (m/s) | h_max (center, m) | h_above_floor (m) | Flight time (s) | Cumulative time (s) |
|--------|--------------|-------------------|-------------------|-----------------|-------------------|
| 0 (impact) | -- | -- | -- | -- | 1.391689 |
| 1 | 9.556731 | 5.155000 | 4.655000 | 1.948365 | 3.340054 |
| 2 | 6.689711 | 2.780950 | 2.280950 | 1.363856 | 4.703910 |
| 3 | 4.682798 | 1.617665 | 1.117665 | 0.954699 | 5.658609 |
| 4 | 3.277959 | 1.047656 | 0.547656 | 0.668289 | 6.326898 |
| 5 | 2.294571 | 0.768351 | 0.268351 | 0.467802 | 6.794700 |
| 6 | 1.606200 | 0.631492 | 0.131492 | 0.327462 | 7.122162 |
| 7 | 1.124340 | 0.564431 | 0.064431 | 0.229223 | 7.351385 |
| 8 | 0.787038 | 0.531571 | 0.031571 | 0.160456 | 7.511842 |
| 9 | 0.550927 | 0.515470 | 0.015470 | 0.112319 | 7.624161 |
| 10 | 0.385649 | 0.507580 | 0.007580 | 0.078624 | 7.702785 |

**Ball effectively stops (h_above_floor < 0.01 m) at bounce 10.**

**Energy decay:**
- KE after bounce n = e^(2n) * KE_impact = 0.49^n * 93.195 J
- After bounce 1: 45.666 J
- After bounce 5: 2.649 J
- After bounce 10: 0.075 J

---

## Scenario D: Perfectly Elastic (e = 1.0)

**Expected behavior:**
- Ball returns to **exactly** the original height (y = 10.0 m) after each bounce
- Velocity at each impact: vy = -13.6524723 m/s (same every time)
- Velocity after each bounce: vy = +13.6524723 m/s
- Period of each bounce cycle: 2 * t_impact = 2 * 1.3916893 = **2.7833787 s**

**Conservation checks (per bounce cycle):**
- Total mechanical energy = m*g*h = 1.0 * 9.81 * 10.0 = **98.100 J** (constant)
- KE at impact = **93.195 J**, PE at impact = **4.905 J** (sum = 98.100 J)
- KE at apex = **0 J**, PE at apex = **98.100 J** (sum = 98.100 J)

---

## Scenario E: Perfectly Inelastic (e = 0.0)

**Expected behavior:**
- Ball falls identically to Scenario A until impact
- At impact: vy_after = 0 m/s (all kinetic energy absorbed)
- Ball rests on floor at y = r = 0.5 m with zero velocity
- No subsequent bounces

**Energy:**
- KE absorbed at impact: **93.195 J**
- After impact: KE = 0 J, PE = m*g*r = 4.905 J, Total = 4.905 J

---

## Summary of Key Values for Testing

| Quantity | Value |
|----------|-------|
| Impact time | 1.3916893 s |
| Impact velocity | -13.6524723 m/s |
| Impact KE | 93.195 J |
| Total energy (from h=10) | 98.100 J |
| Bounce height (e=0.8) | 6.58 m |
| Bounce height (e=0.7, 1st) | 5.155 m |
| Bounces to stop (e=0.7) | 10 |
| Bounce period (e=1.0) | 2.7833787 s |
