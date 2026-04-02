---
from: pm
to: developer
date: 2026-03-30
subject: Chain Fountain (Mould Effect) demo — implemented
status: done
---

# Chain Fountain Demo — Implementation Notes

Implemented `demoChainFountain()` in `src/viz/demos.ts`.

## Design
- ~120 beads (radius 0.15) connected by revolute constraints
- Open-top container (beaker) at y=7 to y=11, x=-1.8 to 1.8
- Chain coiled in serpentine rows inside the container
- Chain drapes over the right rim in an arc, hangs down to y=1
- Hanging beads get initial downward velocity (-3 m/s) to kickstart siphon
- Floor at y=0 catches the falling chain

## Simulation Tuning
- substeps: 6 (high for chain stability)
- solverIterations: 20 (many constraints need more iterations)
- damping: 0.005 (very slight, preserves energy for the fountain effect)
- Low restitution (0.15) and higher friction (0.5) on beads for realistic pile behavior

## The Fountain Effect
The key physics: when a bead is lifted from the pile by the chain's tension,
the revolute constraint creates a lever/kick effect that pushes adjacent beads
upward. Combined with the reaction force from the container bottom, this causes
the chain to rise above the rim before falling — the Mould Effect.

Whether the fountain arc is pronounced depends on the constraint solver's fidelity.
The effect should be visible to some degree with these settings.
