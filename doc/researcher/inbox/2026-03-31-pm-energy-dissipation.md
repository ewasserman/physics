---
status: done
from: pm
to: researcher
date: 2026-03-31
subject: Investigate unphysical energy dissipation in constraint-based simulations
---

# Investigate Unphysical Energy Dissipation

## Problem Statement

The double pendulum demo rapidly dampens to hanging straight down, indicating energy (kinetic + potential) is not being conserved. This is non-physical — a frictionless double pendulum should exhibit chaotic motion indefinitely.

The same issue likely affects the chain demo and any other constraint-heavy simulation.

## Scope

Please investigate and document:

1. **Identify all sources of unphysical energy loss** in the simulation loop. Start with these suspected areas but don't limit yourself to them:
   - Velocity damping in `src/physics/integrator.ts` and `src/sim/simulation.ts` (the 0.999 fallback when damping=0)
   - Constraint velocity correction in `src/physics/constraints.ts` (revolute solver iterating 32×8 times)
   - Position-based corrections without velocity compensation
   - Anything else you find

2. **Quantify the energy loss** from each source if possible (e.g., what fraction of energy is lost per second from each mechanism)

3. **Research best practices** for energy-conserving constraint solvers in game/simulation physics. Specifically:
   - How do established engines (Box2D, Bullet, etc.) handle revolute constraints without draining energy?
   - What is the correct impulse-based approach for velocity-level constraint correction?
   - Are there simple fixes vs. requiring a full solver rewrite?

4. **Recommend a fix strategy** — prioritized list of changes, noting which are quick fixes vs. architectural changes.

## Key Files

- `src/sim/simulation.ts` — simulation step loop, damping calculation
- `src/physics/integrator.ts` — symplectic Euler + velocity damping
- `src/physics/constraints.ts` — constraint solver (revolute, distance, fixed)
- `src/physics/response.ts` — collision response / sequential impulse solver
- `src/viz/demos.ts` — double pendulum config (8 substeps, 32 solver iterations, damping: 0)

## Deliverable

A memo in `doc/researcher/memo/` documenting your findings and recommendations, suitable for handing to the developer as a spec for the fix.
