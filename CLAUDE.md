# Physics Simulation Project

## Project Overview
A from-scratch physical object simulation system. Compound objects are built from primitives (discs, prisms, etc.) connected by idealized joints/axles. The system simulates rigid-body dynamics with approximate physics (friction, elasticity, collisions) prioritizing visual realism and speed over exact accuracy. The output is structured data (positions, velocities, forces at each timestep) suitable for AI training pipelines.

## Agent Team
| Agent | Directory | Role |
|-------|-----------|------|
| PM (project-manager) | `doc/pm/` | Planning, coordination, task assignment |
| Developer | `doc/developer/` | Implementation |
| Researcher | `doc/researcher/` | Technical research, algorithm selection |
| Tester | `doc/tester/` | Testing, validation, benchmarking |

## Agent Communication Protocol
- Each agent has `doc/<agent>/memo/` (private notes) and `doc/<agent>/inbox/` (messages from others).
- Messages are markdown files named `YYYY-MM-DD-<from>-<subject>.md`.
- Messages include a `status:` frontmatter field: `new`, `read`, `done`.
- Agents check their inbox at the start of each session.
- All communication stays in the repo — no external channels.

## Orchestration
- **Superset.sh** is used to run agents in isolated worktrees, preventing conflicts.
- Each agent works on a feature branch in its own worktree, merges to `main` when complete.
- Branch naming: `<agent>/<short-description>` (e.g., `developer/rigid-body-core`).

## Code Conventions
- Language: TypeScript (simulation engine + visualization)
- Build: Node.js with esbuild or Vite
- Testing: Vitest
- Visualization: HTML5 Canvas / WebGL
- All source code under `src/`
- All tests under `tests/`

## Key Principles
- Built from scratch — no physics engine libraries (e.g., no Matter.js, Cannon.js, Rapier)
- Math/linear-algebra utilities may be written in-house or use a small library (e.g., gl-matrix)
- Approximate physics is fine; visual plausibility over exactness
- Performance matters — the sim must run faster than real-time
- Output structured state snapshots for AI training consumption
