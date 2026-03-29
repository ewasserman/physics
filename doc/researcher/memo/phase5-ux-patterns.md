# Phase 5 — Physics Sandbox UX Patterns

## 1. Playback Controls

### Survey of Existing Tools

**Algodoo (Algoryx)**
- Play/pause toggle (spacebar). Step-forward button for frame advance.
- No scrubbing — simulation is live/interactive, not recorded. Users interact in real time.
- Slow-motion slider (0.1x to 2x speed).

**Box2D Testbed**
- Minimal UI: play/pause, single-step (P key, S key). No timeline.
- Focus is on debug visualization, not playback. Users adjust parameters live.
- Framerate is tied to vsync; no variable-speed playback.

**PhET Simulations (University of Colorado)**
- Play/pause/step triad. Step advances one "tick" at a time.
- Speed selector: normal vs slow-motion (typically 2 discrete speeds).
- No timeline scrubbing — simulations are stateless (no history).

**Phaser / game engines**
- Game-loop model: play/pause. Debug tools sometimes add frame-by-frame stepping.
- No inherent timeline; recording is an add-on.

**Video editors / animation tools (reference)**
- Full scrubbing with frame-accurate seeking. Spacebar = play/pause. J/K/L shuttle controls.
- Frame-by-frame with arrow keys. Timecode display.

### Recommendations for Our Viewer

Our viewer is unique: it has a **pre-recorded simulation** (JSON frames), not a live sim. This means we can offer full random-access playback, like a video player.

**Control bar layout** (left to right):
1. **Rewind to start** (|<) — jump to frame 0
2. **Step back** (<) — go back one frame (arrow left)
3. **Play/Pause** toggle (spacebar) — play forward at selected speed
4. **Step forward** (>) — advance one frame (arrow right)
5. **Speed selector** — dropdown or slider: 0.25x, 0.5x, 1x, 2x, 4x
6. **Timeline scrub bar** — horizontal bar spanning full duration, draggable playhead
7. **Frame counter / timestamp** — "Frame 342 / 600 | 5.70s / 10.00s"

**Keyboard shortcuts:**
- Spacebar: play/pause
- Left/Right arrows: step back/forward
- Shift+Left/Right: jump 10 frames
- Home/End: go to start/end
- [ / ]: decrease/increase speed

## 2. Camera Controls

### Survey

**Common patterns in 2D physics tools:**
- **Pan**: Middle-click drag (Box2D), right-click drag (Algodoo), or hold-space + left-drag (Photoshop convention).
- **Zoom**: Scroll wheel. Zoom toward cursor position (not center of screen). This is universal and expected.
- **Auto-fit**: Double-click empty space or press Home to fit all bodies in view.
- **Follow object**: Click to select, toggle "follow" mode. Camera tracks that object's center.

### Recommendations

| Action | Input | Notes |
|--------|-------|-------|
| Pan | Right-click drag or middle-click drag | Left-click reserved for object interaction |
| Zoom | Scroll wheel, zoom toward cursor | Clamp to min/max zoom (0.1x to 20x) |
| Auto-fit | Press `F` or double-click background | Compute bounding box of all bodies, add 10% margin, set viewport |
| Follow object | Select body, press `T` to toggle tracking | Camera centers on body each frame. Pan offsets still apply (for looking ahead of object). |
| Reset view | Press `Home` | Return to default viewport |

**Implementation notes:**
- Store camera as `{ x, y, zoom }`. Apply as a 2D transform matrix before rendering.
- Smooth transitions (lerp over 200-300ms) when auto-fitting or following, to avoid jarring jumps.
- Display a subtle grid at regular intervals (1m, 5m, 10m depending on zoom) for spatial reference.

## 3. Debug Overlays

### Survey of What Tools Show

**Box2D Testbed** (the gold standard for debug viz):
- AABB outlines (axis-aligned bounding boxes)
- Contact points (small dots) and contact normals (short arrows)
- Joint/constraint lines and anchor points
- Center of mass markers
- Body outlines (shape wireframes)

**Algodoo:**
- Velocity arrows (scaled by speed)
- Force vectors (gravity, applied forces)
- Momentum indicators
- No AABB display (consumer-facing tool)

**PhET:**
- Selective overlays: velocity arrows, force diagrams
- Often in separate "lab" mode panels
- Energy bar charts alongside simulation

### Recommendations — Overlay Toggle Panel

Provide a sidebar or dropdown with checkboxes for each overlay. Group by category:

**Geometry (default: shape fills ON, others OFF)**
- [x] Shape fills (solid color per body)
- [ ] Shape outlines (wireframe)
- [ ] AABB outlines (red dashed rectangles)
- [ ] Center of mass markers (crosshair or +)

**Dynamics (default: all OFF)**
- [ ] Velocity arrows (blue arrows from center of mass, length proportional to speed)
- [ ] Force vectors (red arrows, showing net force per body)
- [ ] Angular velocity indicators (curved arrow at center of mass)

**Contacts (default: OFF)**
- [ ] Contact points (small yellow dots at collision points)
- [ ] Contact normals (green arrows from contact point along normal)
- [ ] Contact impulse magnitude (number label or scaled arrow thickness)

**Constraints (default: ON when constraints exist)**
- [x] Joint lines (line connecting anchor points)
- [x] Anchor points (small circles at joint attachment)
- [ ] Constraint forces (arrows showing reaction forces)

**Most useful overlays** (from experience in physics debugging):
1. Velocity arrows — instantly shows dynamics at a glance
2. Contact points + normals — critical for debugging collision response
3. Joint/constraint lines — essential when joints are present
4. AABB outlines — useful for debugging broad-phase collision detection

**Keyboard toggles** for quick access:
- `V` = velocity arrows
- `C` = contacts
- `B` = bounding boxes (AABBs)
- `J` = joints/constraints

## 4. Timeline Scrubbing

### Challenges
- With 600+ frames, the scrub bar needs sub-pixel precision.
- Rapid scrubbing should not cause rendering bottlenecks.
- Users expect a responsive, preview-quality experience when dragging.

### Recommendations

**Scrub bar design:**
- Thin horizontal bar, full width of controls area.
- Filled portion shows progress (left of playhead = elapsed).
- Playhead is a draggable vertical line/circle.
- Hover over scrub bar shows frame preview tooltip (frame number + timestamp).

**Performance during scrubbing:**
- Each frame's data is already in memory (JSON). Random access is O(1) by frame index.
- On scrub, render the current frame immediately. No interpolation needed (frames are discrete).
- Throttle rendering to 60fps even if mouse events fire faster (requestAnimationFrame).
- Disable expensive overlays during active scrubbing if performance drops (re-enable on release).

**Frame snapping:**
- Always snap to integer frame indices. No sub-frame interpolation.
- Display exact frame number alongside scrub position.

**Mini-timeline features (optional, future):**
- Color-coded regions on the timeline showing events (collisions = orange ticks, joint breaks = red ticks).
- Zoom into timeline section for fine scrubbing.

## 5. Visual Conventions

### Color Coding

| Body State | Fill Color | Rationale |
|------------|-----------|-----------|
| Dynamic (awake) | Saturated blue (#4488CC) | Most common; needs to be visually prominent |
| Dynamic (sleeping) | Desaturated gray-blue (#8899AA) | Clearly different from awake, but not alarming |
| Static | Dark gray (#555555) | Recedes visually; static bodies are "scenery" |
| Kinematic | Green (#44AA44) | Distinct from dynamic; indicates externally driven |
| Selected | Yellow outline (#FFCC00) | Universal selection highlight |

**Constraint visualization:**
- Active joint: solid white or light gray line between anchor points
- Stressed joint (near break threshold): orange line, pulsing or thickened
- Broken joint: red X at break point, dashed line fading out

**Contact point display:**
- Small filled circle (3-4px radius) at contact point
- Color: yellow for new contacts, fading to dim yellow for persistent contacts
- Normal arrow: green, short (scaled to a fixed screen-space length, not world-space)

### Shape rendering order (back to front)
1. Grid / background
2. Static body fills
3. Dynamic body fills (sleeping first, then awake)
4. Shape outlines
5. Constraint lines
6. Debug overlays (velocity, force arrows)
7. Contact points and normals
8. Selection highlight
9. UI / HUD

## 6. Information Display

### Real-Time Stats Panel

Position: top-left corner, semi-transparent background. Toggleable with `I` key.

**Always visible:**
- **FPS**: Rendering framerate (target: 60)
- **Frame**: Current frame / total frames
- **Time**: Simulation time in seconds

**Expandable section:**
- **Bodies**: Total count (dynamic / static / sleeping)
- **Contacts**: Active contact count this frame
- **KE**: Total kinetic energy (from frame data)
- **PE**: Total potential energy (from frame data)
- **Momentum**: Total linear momentum magnitude

**Format**: Monospaced font, aligned columns. Update every rendered frame.

```
FPS: 60  |  Frame: 342/600  |  Time: 5.70s
Bodies: 12 (8 dyn, 3 static, 1 sleep)
Contacts: 5  |  KE: 245.3  |  PE: 1102.7
```

### Object Inspector (on hover/click)

When hovering over a body, show a tooltip:
- Body ID and label (if any)
- Position, velocity, angle
- Mass, shape type
- Current forces

When clicking, pin the inspector panel (sidebar or floating window).

## 7. Concrete Recommendations Summary

### MVP (Phase 5 target)
1. Play/pause/step with keyboard shortcuts
2. Timeline scrub bar with frame counter
3. Pan (right-click drag) and zoom (scroll wheel)
4. Shape fills with static/dynamic color coding
5. FPS + frame counter display
6. Velocity arrow overlay (toggle with V)
7. Contact point overlay (toggle with C)

### Phase 6 additions
1. Follow-object camera mode
2. Object inspector (click to see properties)
3. Full overlay toggle panel
4. Speed control (0.25x - 4x)
5. Event markers on timeline
6. Joint/constraint visualization with stress indication

### Technical implementation notes
- Use HTML5 Canvas 2D context for initial implementation (simpler, adequate for 2D)
- Camera transform: apply `ctx.translate()` and `ctx.scale()` before drawing
- Overlay rendering: separate pass after main shapes, respecting toggle state
- Stats panel: HTML overlay on top of canvas (easier text rendering than canvas text)
- Scrub bar: HTML range input or custom div, synced with canvas rendering via requestAnimationFrame
