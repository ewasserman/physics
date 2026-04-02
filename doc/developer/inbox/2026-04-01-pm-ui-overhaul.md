---
status: new
from: pm
to: developer
date: 2026-04-01
subject: UI overhaul — scenario registry + dynamic parameter panel
---

# UI Overhaul: Scenario Registry + Dynamic Parameter Panel

## Overview

Replace the crude toolbar + demo buttons UI with a professional three-panel layout featuring a scenario registry, dynamic parameter panel, and clean toolbar. The approved plan is at `.claude/plans/mellow-munching-clock.md` — read it in full before starting.

## What to build

### Phase 1: Foundation
1. `src/viz/scenarios/types.ts` — ParamDescriptor, ParamGroup, ParamSchema, CameraHint, ScenarioDescriptor interfaces
2. `src/viz/scenarios/registry.ts` — ScenarioRegistry class (register, get, getAll, getCategories, getByCategory) + singleton export
3. `src/viz/scenarios/bouncing.ts` — first migrated scenario as proof of concept
4. `src/viz/scenarios/index.ts` — barrel file importing all scenarios, re-exporting registry

### Phase 2: UI Components
5. `src/viz/ui/styles.ts` — inject `<style>` block with CSS grid layout, dark theme, all component styles
6. `src/viz/ui/layout.ts` — build grid DOM: left sidebar (220px), canvas wrapper (flex), right sidebar (280px), toolbar bar
7. `src/viz/ui/param-panel.ts` — render ParamSchema into controls (slider+number for numbers, checkbox for bools, select for enums, dual input for vec2). Collapsible `<details>` groups. "Reset to Defaults" button. Fires `onChange(key, value)`.
8. `src/viz/ui/scenario-picker.ts` — render categories and scenario buttons from registry. Highlights active scenario. Fires `onSelect(id)`.
9. `src/viz/ui/toolbar.ts` — port controls from current `ui.ts` into new toolbar. Keep same UIControls-like interface.

### Phase 3: Integration
10. Rewrite `src/viz/app.ts` to use new layout + registry + param panel. Key flow: `loadScenario(id)` → extract defaults → render param panel → `setup(values)` → `setLive(sim)`. Param changes trigger full sim restart.
11. Simplify `index.html` to just mount `<div id="app">` + one module import.
12. Migrate remaining 5 scenarios (car-crash, rain, double-pendulum, chain, chain-fountain). Extract hardcoded values as params with appropriate groups.
13. Delete old `demos.ts` and `ui.ts`.

### Phase 4: Polish
14. ResizeObserver on canvas wrapper for dynamic sizing
15. Active scenario highlighting
16. Keyboard shortcut: space = play/pause

## Key parameters to extract per scenario

| Scenario | Params |
|---|---|
| bouncing | ballCount, minRadius, maxRadius, boxWidth, boxHeight, restitution, friction, gravity, damping |
| car-crash | leftSpeed, rightSpeed, separation, gravity, damping |
| rain | dropCount, minRadius, maxRadius, boxWidth, restitution, friction, gravity, damping |
| double-pendulum | armLen1, armLen2, bobMass, angle1, angle2, substeps, solverIterations, gravity |
| chain | linkCount, linkSize, anchorY, nudgeVelocity, substeps, solverIterations, gravity |
| chain-fountain | beadRadius, beadMass, beadGap, kickVelocity, containerWidth, containerHeight, substeps, solverIterations, gravity |

## Design constraints
- Pure DOM/CSS, no UI frameworks
- Dark theme: sidebars `#1a1a2e`, toolbar `#16213e`, accent `#4a90d9`, text `#e0e0e0`
- CSS Grid layout
- Self-registering scenario pattern (each file calls `registry.register()`)
- Full sim restart on param change (sub-ms, no incremental updates needed)

## Branch
`developer/ui-overhaul`

## Tests
- Existing 492 tests must pass
- Verify all 6 scenarios load, parameters adjust, sim restarts correctly
- Verify transport controls, interaction tools, debug overlay all still work
