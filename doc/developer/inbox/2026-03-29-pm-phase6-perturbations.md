---
from: pm
to: developer
date: 2026-03-29
status: new
subject: Phase 6 — Interactive Perturbations
---

# Phase 6 — Interactive Perturbations

**Goal:** Users can interact with the simulation in real-time: apply forces, break joints, drop objects.

See researcher's detailed UX design: `doc/researcher/memo/phase5-perturbation-ui.md`

## Deliverables

### 1. Interaction System (`src/viz/interaction.ts`)
Tool-based interaction system:
- `InteractionTool` enum: `Select`, `ApplyForce`, `BreakJoint`, `DropObject`
- `InteractionManager` class:
  - Takes `LiveSimulation`, `CanvasRenderer`
  - `setTool(tool: InteractionTool): void`
  - `getBodyAtPoint(worldPos: Vec2): RigidBody | null` — hit-testing (point-in-shape)
  - `getConstraintAtPoint(worldPos: Vec2): Constraint | null` — proximity test
  - Handles mouse events: mousedown, mousemove, mouseup
  - Dispatches to tool handlers

### 2. Apply Force Tool
- **mousedown** on body: start drag
- **mousemove**: show arrow from body to cursor (visual feedback)
- **mouseup**: apply impulse to body. Force = direction * magnitude (length of drag scaled)
- Arrow visualization: draw in renderer during drag
- Scale: 1 pixel of drag = configurable force units (e.g., 50N per 100px)

### 3. Break Joint Tool
- **mousemove**: highlight nearest constraint within 20px cursor distance (change color to red/orange)
- **click**: remove the constraint from the world
- Visual: constraints glow on hover

### 4. Drop Object Tool
- **click**: place a new object at cursor position in world space
- Object type configurable: circle (default), box, or car
- Dropdown or toggle for object type in the UI
- Mass and size configurable or use sensible defaults (circle r=0.5 mass=1)

### 5. Perturbation Log (`src/sim/perturbation.ts`)
Record all user perturbations:
```typescript
interface Perturbation {
  type: 'force' | 'break-joint' | 'drop-object';
  time: number;
  step: number;
  details: ForceDetails | BreakDetails | DropDetails;
}
// ForceDetails: bodyId, force Vec2, point Vec2
// BreakDetails: constraintIndex
// DropDetails: bodyConfig (shape, position, mass)
```
- Store perturbations on the simulation recording
- Include in JSON export (so recordings capture what the user did)

### 6. UI Updates (`src/viz/ui.ts`)
Add to the control panel:
- Tool selector: Select / Force / Break / Drop buttons or radio group
- Object type selector (for Drop tool): Circle / Box / Car
- Current tool indicator
- Optional: force magnitude display during drag

### 7. Tests
- `tests/viz/interaction.test.ts`:
  - Hit-test: point inside circle returns body, point outside returns null
  - Hit-test: point inside AABB returns body
  - Force application: verify body velocity changes after force
  - Constraint breaking: verify constraint removed from world
  - Drop object: verify new body added to world
- Keep all existing tests passing

## Coordination
- Work on branch `developer/phase6-perturbations`
- Notify PM and tester when done
