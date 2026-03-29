---
from: pm
to: developer
date: 2026-03-29
status: new
subject: Phase 5 — Web Visualization
---

# Phase 5 — Web-Based Visualization

**Goal:** HTML5 Canvas viewer with playback controls and camera navigation. Users can watch simulation recordings as "movies" and scrub through time.

## Deliverables

### 1. Renderer (`src/viz/renderer.ts`)
2D Canvas renderer:
- `CanvasRenderer` class:
  - Constructor takes `canvas: HTMLCanvasElement` and config (scale, offset, colors)
  - `clear(): void`
  - `renderBody(body: BodySnapshot): void` — draw circle, AABB, polygon based on shapeType
  - `renderConstraint(constraint: ConstraintSnapshot, bodies: Map<number, BodySnapshot>): void` — draw line between connected bodies
  - `renderContact(contact: ContactSnapshot): void` — draw contact point + normal (debug overlay)
  - `renderFrame(snapshot: WorldSnapshot): void` — render entire frame
  - `renderGrid(): void` — optional background grid for spatial reference

Drawing conventions:
- Circles: filled circle with a radius line showing rotation angle
- AABBs: filled rectangle, rotated by body angle
- Polygons: filled polygon
- Static bodies: darker/different color
- Constraints: thin line between anchor points, red if broken
- Contacts: small dot at contact point, short line for normal (debug mode)
- Colors: configurable per body or auto-assigned

Camera:
- `setCamera(centerX, centerY, zoom): void`
- `screenToWorld(screenX, screenY): Vec2`
- `worldToScreen(worldX, worldY): { x, y }`
- Default view: auto-fit to world bounds

### 2. Playback Controller (`src/viz/playback.ts`)
- `PlaybackController` class:
  - Takes a `SimulationRecording`
  - `play()`, `pause()`, `stop()`
  - `setFrame(index: number): void` — jump to frame
  - `setSpeed(multiplier: number): void` — 0.25x, 0.5x, 1x, 2x, 4x
  - `getCurrentFrame(): number`
  - `getTotalFrames(): number`
  - `isPlaying: boolean`
  - `onFrame(callback: (snapshot: WorldSnapshot) => void)` — called each frame during playback
  - Uses `requestAnimationFrame` for smooth playback
  - Handles variable display refresh rates (interpolate or skip frames as needed)

### 3. Live Simulation Mode (`src/viz/live.ts`)
- `LiveSimulation` class:
  - Takes a `Simulation` and `CanvasRenderer`
  - `start()` — runs simulation in real-time, rendering each frame
  - `pause()` / `resume()`
  - `step()` — advance one frame
  - Uses `requestAnimationFrame` loop
  - Optionally records while running (for later playback)

### 4. UI Controls (`src/viz/ui.ts`)
Build DOM controls programmatically (no framework dependency):
- Play/Pause button
- Stop button
- Frame counter display ("Frame 42 / 600")
- Time display ("t = 0.350s")
- Speed selector (0.25x, 0.5x, 1x, 2x, 4x)
- Timeline scrubber (range input / slider)
- Mode toggle: "Live" vs "Playback"
- Debug overlay toggle (show contacts, velocities, grid)

### 5. Main Entry Point (`src/viz/index.ts` + `index.html`)
- `index.html` at project root:
  - Canvas element (800x600 default)
  - Control panel below canvas
  - Loads the app via Vite dev server
- `src/viz/app.ts`:
  - `createApp(container: HTMLElement, options?)` — mounts canvas + controls
  - Default demo: creates a scene (a few circles + a car in a bounded box with gravity), runs live simulation
  - Can load a recording JSON for playback mode
- Wire up Vite so `npm run dev` serves the visualization

### 6. Demo Scenes (`src/viz/demos.ts`)
Pre-built demo scenes for testing the visualization:
- `demoBouncing()` — 5 circles bouncing in a box
- `demoCarCrash()` — 2 cars approaching each other, collide
- `demoRain()` — 20 circles falling from random positions, settling

### 7. Tests
- `tests/viz/renderer.test.ts`: Test that renderFrame doesn't throw for various snapshots. (Can't easily test canvas output in Node, so focus on no-error smoke tests using a mock canvas or jsdom.)
- Ensure all existing 331 tests still pass

## Technical Notes
- The viz code runs in the browser, not Node. Use Vite for dev server.
- Canvas API: `ctx.beginPath()`, `ctx.arc()`, `ctx.fill()`, `ctx.fillRect()`, etc.
- For the HTML, keep it minimal — no frameworks, just vanilla DOM manipulation.
- Make sure the renderer can handle both live simulation (with RigidBody objects) and playback (with BodySnapshot plain objects). The snapshot format uses `{x, y}` plain objects, not Vec2 instances.
- Y-axis: Canvas y increases downward, physics y increases upward. The renderer needs to flip: `screenY = canvasHeight - (worldY - cameraY) * zoom`

## Coordination
- Work on branch `developer/phase5-visualization`
- Run `npm install` first
- Notify PM and tester when done
