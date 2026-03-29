# Phase 5 — Perturbation UI Research

Research into interaction patterns for Phase 6 interactive perturbations.

## 1. Apply Force (Click-and-Drag)

### Survey

**Algodoo**: Click on body, drag away. A visible spring/rubber-band line appears from click point to cursor. Force is proportional to drag distance, direction follows cursor. On release, force is applied as an impulse. This is the most intuitive pattern — it mimics pulling a rubber band.

**Box2D Testbed**: Mouse joint — click on body creates a soft constraint (spring) connecting the body to the cursor. Body follows cursor with spring dynamics. This is continuous force application (hold to keep pulling), not a single impulse.

**Phaser / game debug tools**: Click to select, then type force values into a panel. Not intuitive but precise.

**Angry Birds / slingshot pattern**: Drag backward from object, release to launch. Direction is opposite to drag (pull back = shoot forward). Familiar to many users but counterintuitive for "apply force."

### Recommendation

**Rubber-band impulse pattern:**

1. User clicks on a body (enters "apply force" mode if a force tool is selected, OR use modifier key like holding `F`).
2. User drags away from the click point. An arrow is drawn from the body's center of mass to the cursor position.
3. Arrow length represents force magnitude. Arrow direction represents force direction.
4. Arrow color intensity increases with magnitude (light blue for small, bright red for large).
5. Numerical magnitude displayed near the arrow tip.
6. On mouse release, the impulse is applied to the body at the click point (allowing torque if off-center).
7. Simulation resumes (or advances one step) to show the result.

**Force scaling:**
- Define a `pixelsPerNewton` ratio (e.g., 50px = 10N at 1x zoom).
- Scale with zoom level so drag distance feels consistent.
- Optional: hold Shift for fine control (0.1x multiplier), hold Ctrl for strong force (10x multiplier).

**Visual feedback during drag:**
- Arrow with triangular head, drawn as overlay (not part of simulation).
- Dashed "connection line" from click point on body to arrow start (if applying off-center).
- Ghost trajectory preview (optional, expensive): show predicted path for next 0.5s as a dotted curve.

## 2. Break Joint (Click to Break)

### Survey

**Algodoo**: Joints are visualized as small icons (hinge icon, spring coil, etc.). Click to select, then delete key or right-click menu to remove. The joint highlights on hover.

**Besiege / Poly Bridge**: Joints/connections shown as lines or pins. Click to select, backspace to delete. Clear visual feedback (glow, highlight).

**General UI pattern**: Destructive actions should require confirmation or be easily undoable.

### Recommendation

**Hover-to-highlight, click-to-break pattern:**

1. When the "break joint" tool is active (or user holds `X` modifier):
   - Constraint lines become interactive (hover targets).
   - On hover: constraint line thickens and turns orange. Cursor changes to scissors icon or X cursor.
   - Anchor points pulse/glow to indicate which bodies are connected.
2. On click: joint breaks immediately.
   - Visual: a brief "snap" animation — the line splits apart with a small particle burst or red flash.
   - The broken joint is recorded as an event in the timeline.
3. Undo is available (Ctrl+Z) to restore the joint.

**Hit detection for joints:**
- Joints are typically lines between anchor points. Use a distance-to-line-segment test with a generous threshold (8-12px) for hover detection.
- If multiple joints overlap, show a selection popup or break the nearest one.

**Visual states:**
| State | Appearance |
|-------|-----------|
| Normal | Thin white/gray line |
| Hoverable (tool active) | Slightly thicker, lighter color |
| Hovered | Thick orange line, anchor points glow |
| Breaking (animation) | Red flash, line splits, particles |
| Broken | Fades out over 0.5s, then removed |

## 3. Drop Object (Place New Body)

### Survey

**Algodoo**: Toolbar with shape tools (circle, rectangle, polygon, etc.). Click to start, drag to set size, release to place. Objects have default properties that can be edited after placement.

**PhET**: Drag objects from a palette/toolbox on the side. Objects snap to valid positions. Some tools have a "bag of objects" metaphor.

**Figma / design tools**: Shapes in toolbar. Click to place at default size, or click-drag to set size. This is widely understood.

**Game editors (Unity, Godot)**: Object palette/hierarchy. Drag from palette to scene. Inspector panel for properties.

### Recommendation

**Palette + click-to-place pattern:**

**Palette design:**
- Vertical toolbar on the left side (or collapsible sidebar).
- Icons for each available shape: circle, rectangle, polygon (triangle).
- Each icon shows a small preview of the shape.
- Click an icon to select it as the active placement tool.

**Placement flow:**
1. Click palette icon (e.g., circle). Cursor changes to crosshair with a ghost preview of the shape.
2. Click in the scene to place the object at that position with default size.
   - OR: Click-and-drag to set size (drag radius for circle, drag corner for rectangle).
3. Object appears with default physics properties (mass derived from area, default restitution/friction).
4. Shift+click to place multiple objects of the same type without re-selecting.
5. Press Escape or right-click to deselect the placement tool.

**Default object properties:**
- Circle: radius 0.5m, density 1.0 kg/m^2
- Rectangle: 1.0m x 0.5m, density 1.0 kg/m^2
- Objects are dynamic by default. Hold Alt during placement for static.

**After placement:**
- Object is automatically selected, showing the inspector panel.
- User can adjust properties (mass, restitution, friction) before unpausing.
- Simulation is paused during placement.

## 4. Object Inspector

### Survey

**Unity/Godot**: Inspector panel on the right side. Shows all properties of selected object in a scrollable form. Editable fields.

**Browser dev tools**: Elements panel — click to select, properties shown in sidebar. Familiar to web developers.

**Algodoo**: Right-click context menu with properties. Sliders for physical properties.

### Recommendation

**Click-to-inspect with sidebar panel:**

1. Click any body in the scene (when no special tool is active).
2. Body gets a yellow selection outline.
3. Inspector panel slides in from the right (or is always visible in a sidebar).

**Inspector content:**

```
[Circle] Body #3 "wheel-left"
─────────────────────────────
Position:   (2.34, 1.56)
Velocity:   (0.82, -0.12)  |v| = 0.83 m/s
Angle:      45.2 deg
Ang. Vel:   1.23 rad/s
─────────────────────────────
Mass:       2.50 kg
Inertia:    0.31 kg*m^2
Restitution: 0.60
Friction:    0.40
─────────────────────────────
Shape:      Circle, r=0.50m
Status:     Dynamic (awake)
Contacts:   2 active
Constraints: 1 (revolute to Body #0)
```

**Interaction:**
- Values update in real-time during playback.
- In Phase 6 (perturbation mode), some fields become editable (velocity, position for "teleport", mass).
- Click a constraint entry to highlight that constraint in the scene.
- Click a contact entry to highlight the contact partner.

## 5. Undo and Timeline Branching

### Survey

**Algodoo**: Standard undo/redo for editing actions (place, delete, modify). No undo for simulation time — once you run, you cannot go back to a previous simulation state (you must reset and re-run).

**Braid (game)**: Full timeline rewind. Hold a button to reverse time. Elegant but only works because the entire game state is recorded.

**Git / version control analogy**: Branch from any point, maintain parallel histories.

**Jupyter notebooks**: Cell-based execution. Re-run from any cell. Implicit branching (change a cell and re-run).

### Analysis

Our system already records full simulation state per frame. This gives us a major advantage: we can "rewind" for free by seeking to an earlier frame. The question is what happens when a perturbation is applied mid-timeline.

### Recommendation

**Fork-on-perturbation model:**

1. **Rewind is free**: User can scrub to any past frame. This is just seeking in the recorded data.

2. **Perturbation creates a branch**: When the user applies a force, breaks a joint, or drops an object at frame N:
   - The original timeline (frames 0..T) is preserved.
   - A new simulation branch starts from frame N with the modified state.
   - The engine re-simulates from frame N forward, generating new frames.
   - The viewer shows the new branch.

3. **Branch management**:
   - A small branch indicator appears on the timeline: "Branch 2 from frame 342".
   - User can switch between branches via a dropdown or timeline visualization.
   - Limit to 5-10 branches to keep memory manageable.
   - Branches can be named ("after removing left wheel", "with extra push").

4. **Undo**:
   - Ctrl+Z undoes the last perturbation by switching back to the parent branch.
   - The child branch is kept (not deleted) so Ctrl+Y can re-apply it.
   - Multiple undos walk up the branch tree.

5. **Visual timeline representation**:
   ```
   Branch 0: [============================]  (original)
                        |
   Branch 1:            [================]  (force applied at frame 200)
                              |
   Branch 2:                  [==========]  (joint broken at frame 280)
   ```

**Implementation considerations:**
- Branches are stored as separate frame arrays, sharing frames 0..N-1 with the parent.
- Re-simulation on perturbation must be fast. For small scenes (< 20 bodies), real-time re-sim of a few seconds should complete in under 1 second.
- If re-simulation is slow, show a progress bar and simulate in a Web Worker.

## 6. Survey Summary — What Works and What to Avoid

### What works well
- **Direct manipulation** (Algodoo): Click-and-drag to apply forces. Intuitive, discoverable.
- **Visible feedback** during interaction: arrows for forces, highlights for hover, animations for breaks.
- **Consistent tool model**: Select a tool from a palette, then interact. Matches Photoshop/Figma mental model.
- **Undo everything**: Users experiment freely when they know they can undo.
- **Pause before perturb**: Auto-pause simulation when entering perturbation mode. Prevents chaos.

### What to avoid
- **Hidden modes**: Tools that activate with non-obvious key combos. Always show active tool state.
- **Irreversible actions** without confirmation: Breaking a joint should be undoable.
- **Overloaded clicks**: Left-click should not mean different things depending on subtle context. Use explicit tool selection.
- **Numerical-only input**: Typing force values is precise but kills flow. Always offer direct manipulation with optional numerical refinement.
- **Unbounded force**: Dragging off-screen should cap force magnitude, not create infinite impulses.

## 7. Concrete Recommendations for Phase 6

### Tool palette (left sidebar)
| Icon | Tool | Shortcut | Behavior |
|------|------|----------|----------|
| Pointer | Select/Inspect | `S` | Click to select body, show inspector |
| Arrow | Apply Force | `F` | Click-drag on body to apply impulse |
| Scissors | Break Joint | `X` | Click on joint to break it |
| Circle | Drop Circle | `1` | Click to place circle |
| Square | Drop Rectangle | `2` | Click to place rectangle |
| Triangle | Drop Polygon | `3` | Click to place triangle |

### Interaction state machine
```
IDLE (pointer tool)
  -> click body -> SELECT body, show inspector
  -> right-drag -> PAN camera
  -> scroll -> ZOOM camera

FORCE TOOL
  -> mousedown on body -> DRAGGING (show arrow)
  -> mouseup -> APPLY impulse, return to FORCE TOOL
  -> escape -> return to IDLE

BREAK TOOL
  -> hover joint -> HIGHLIGHT joint
  -> click joint -> BREAK joint (with undo point)
  -> escape -> return to IDLE

PLACE TOOL (circle/rect/polygon)
  -> click scene -> PLACE object at position
  -> shift+click -> PLACE and stay in tool
  -> escape -> return to IDLE
```

### Priority order for Phase 6 implementation
1. **Select/Inspect** — foundation for all other tools
2. **Apply Force** — most-requested perturbation type
3. **Break Joint** — important for compound object scenarios
4. **Drop Object** — enables building custom scenarios
5. **Undo/branching** — critical for usability but complex; can start with simple undo
6. **Timeline branching UI** — advanced feature, implement after basics work
