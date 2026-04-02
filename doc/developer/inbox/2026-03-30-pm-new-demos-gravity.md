---
from: pm
to: developer
date: 2026-03-30
subject: New demo scenes and gravity control
status: new
priority: medium
---

# New Demo Scenes & Gravity Control

We'd like to add three new capabilities to the visualization:

---

## Feature 1: Double Pendulum Demo

A classic double pendulum hanging from a fixed anchor point.

**Spec:**
- A static anchor body fixed at the top-center of the scene
- Two arm segments (thin boxes or circles at joints) connected by revolute constraints
- First arm connects to the anchor, second arm connects to the end of the first
- Give it a non-trivial initial angle so it starts swinging chaotically
- Add as a new demo function `demoDoublePendulum()` in `src/viz/demos.ts`
- Add a "Double Pendulum" button to the demo bar in `index.html`

---

## Feature 2: Chain Demo (Variable Links)

A chain of connected bodies hanging from a fixed point, with configurable link count and size.

**Spec:**
- A static anchor at the top
- N links connected end-to-end by revolute constraints
- Default: 8 links, each ~0.3 units radius (circles) or small boxes
- The function should accept parameters: `demoChain(linkCount?: number, linkSize?: number)`
- Give it a slight initial offset so it swings naturally
- Add a "Chain" button to the demo bar in `index.html`
- Optionally, we could later add UI for link count/size, but for now just use good defaults

---

## Feature 3: Gravity Control

Add a gravity selector to the UI toolbar so users can change gravity during any running simulation.

**Spec:**
- Add a gravity dropdown or button group to the controls bar in `ui.ts`
- Presets: "0g" (0), "-1g" (-9.81, things fall up), "0.5g" (4.9), "1g" (9.81), "2g" (19.62), "Moon" (1.62), "Jupiter" (24.79)
- When changed, update `sim.world.gravity` directly
- Wire via a new `onGravityChange(g: number)` callback in `UIControls`
- In `app.ts`, the handler should set `sim.world.gravity = new Vec2(0, g)` (or however gravity is stored)
- Default selection should be "1g"
- This should work in live mode (the primary use case)

---

## Implementation Notes

- Follow existing patterns in `demos.ts` for the new demo functions — use `createSimulation()` with appropriate `SceneConfig` or manual body/constraint setup
- The demos should look good at the default 800x600 canvas size
- Make sure the camera auto-fits to show the full pendulum/chain
- Branch: `developer/new-demos-gravity`
