import { CanvasRenderer } from './renderer.js';
import { PlaybackController } from './playback.js';
import { LiveSimulation } from './live.js';
import { InteractionManager, InteractionTool } from './interaction.js';
import { captureSnapshot } from '../sim/snapshot.js';
import { Vec2 } from '../math/vec2.js';
import type { Simulation } from '../sim/simulation.js';
import type { SimulationRecording } from '../sim/recording.js';

// UI components
import { injectStyles } from './ui/styles.js';
import { buildLayout, LayoutRefs } from './ui/layout.js';
import { renderParamPanel, ParamPanelController } from './ui/param-panel.js';
import { renderScenarioPicker, ScenarioPickerController } from './ui/scenario-picker.js';
import { renderToolbar, ToolbarController } from './ui/toolbar.js';

// Scenario system
import { registry } from './scenarios/index.js';
import type { ScenarioDescriptor } from './scenarios/types.js';

export interface App {
  canvas: HTMLCanvasElement;
  renderer: CanvasRenderer;
  live: LiveSimulation | null;
  playback: PlaybackController | null;
  /** Switch to live mode with a new simulation. */
  setLive(sim: Simulation): void;
  /** Switch to playback mode with a recording. */
  setPlayback(recording: SimulationRecording): void;
  /** Load a scenario by id with optional param overrides. */
  loadScenario(id: string, paramOverrides?: Record<string, any>): void;
}

/** Mount the visualization app into a container element. */
export function createApp(container: HTMLElement): App {
  // Inject CSS and build layout
  injectStyles();
  const layout = buildLayout(container);

  // Create canvas renderer
  const renderer = new CanvasRenderer(layout.canvas);

  // Resize canvas to fill its wrapper
  function resizeCanvas() {
    const rect = layout.canvasWrapper.getBoundingClientRect();
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);
    if (w > 0 && h > 0) {
      layout.canvas.width = w;
      layout.canvas.height = h;
    }
  }

  // ResizeObserver for dynamic canvas sizing
  const resizeObserver = new ResizeObserver(() => {
    resizeCanvas();
    if (app.live && app.live.isRunning) {
      const sim = app.live.getSimulation();
      const snapshot = captureSnapshot(sim);
      renderer.renderFrame(snapshot);
    }
  });
  resizeObserver.observe(layout.canvasWrapper);

  // Build toolbar
  const toolbar = renderToolbar(layout.toolbar);

  // Build scenario picker
  const picker = renderScenarioPicker(layout.sidebarLeft, registry, (id) => {
    loadScenario(id);
  });

  // Param panel state
  let paramPanel: ParamPanelController | null = null;
  let activeScenarioId: string | null = null;
  let activeDescriptor: ScenarioDescriptor | null = null;
  let currentParamValues: Record<string, any> = {};

  // App state
  const app: App = {
    canvas: layout.canvas,
    renderer,
    live: null,
    playback: null,
    setLive,
    setPlayback,
    loadScenario,
  };

  // Track canvas event listeners for cleanup
  let canvasMouseDown: ((e: MouseEvent) => void) | null = null;
  let canvasMouseMove: ((e: MouseEvent) => void) | null = null;
  let canvasMouseUp: ((e: MouseEvent) => void) | null = null;

  function cleanupCanvasListeners() {
    if (canvasMouseDown) { layout.canvas.removeEventListener('mousedown', canvasMouseDown); canvasMouseDown = null; }
    if (canvasMouseMove) { layout.canvas.removeEventListener('mousemove', canvasMouseMove); canvasMouseMove = null; }
    if (canvasMouseUp) { layout.canvas.removeEventListener('mouseup', canvasMouseUp); canvasMouseUp = null; }
  }

  // Wire debug toggle
  toolbar.callbacks.onDebugToggle = (show: boolean) => {
    renderer.setShowContacts(show);
    if (app.playback) {
      const frame = app.playback.getCurrentFrame();
      app.playback.setFrame(frame);
    }
  };

  // --- Load scenario ---
  function loadScenario(id: string, paramOverrides?: Record<string, any>) {
    const descriptor = registry.get(id);
    if (!descriptor) {
      console.warn(`Scenario "${id}" not found`);
      return;
    }

    activeScenarioId = id;
    activeDescriptor = descriptor;
    picker.setActive(id);

    // Render param panel with onChange (param changed) and onRestart (explicit restart)
    paramPanel = renderParamPanel(layout.sidebarRight, descriptor.params, (values) => {
      currentParamValues = values;
      restartCurrentScenario();
    }, () => {
      restartCurrentScenario();
    });

    if (paramOverrides) {
      paramPanel.setValues(paramOverrides);
      currentParamValues = paramPanel.getValues();
    } else {
      currentParamValues = paramPanel.getValues();
    }

    const sim = descriptor.setup(currentParamValues);
    setLive(sim);
    applyCamera(descriptor);
  }

  function restartCurrentScenario() {
    if (!activeDescriptor) return;
    const sim = activeDescriptor.setup(currentParamValues);
    setLive(sim);
    applyCamera(activeDescriptor);
  }

  function applyCamera(descriptor: ScenarioDescriptor) {
    if (descriptor.camera && descriptor.camera.mode === 'manual') {
      const cam = descriptor.camera;
      const totalArm = (currentParamValues.armLen1 ?? 2.4) + (currentParamValues.armLen2 ?? 2) + 1;
      const zoom = cam.zoom || Math.min(layout.canvas.width, layout.canvas.height) / (totalArm * 2);
      renderer.setCamera(cam.cx ?? 0, cam.cy ?? 0, zoom);
    }
  }

  // --- setLive ---
  function setLive(sim: Simulation) {
    if (app.live) app.live.pause();
    if (app.playback) app.playback.stop();
    app.playback = null;
    cleanupCanvasListeners();

    toolbar.setMode('live');

    const live = new LiveSimulation(sim, renderer, { record: true });
    app.live = live;

    // Wire interaction manager
    const interactionManager = new InteractionManager(live, renderer);
    toolbar.callbacks.onToolChange = (tool) => interactionManager.setTool(tool);
    toolbar.callbacks.onDropTypeChange = (type) => { interactionManager.dropObjectType = type; };

    canvasMouseDown = (e: MouseEvent) => interactionManager.onMouseDown(e.offsetX, e.offsetY);
    canvasMouseMove = (e: MouseEvent) => interactionManager.onMouseMove(e.offsetX, e.offsetY);
    canvasMouseUp = (e: MouseEvent) => interactionManager.onMouseUp(e.offsetX, e.offsetY);
    layout.canvas.addEventListener('mousedown', canvasMouseDown);
    layout.canvas.addEventListener('mousemove', canvasMouseMove);
    layout.canvas.addEventListener('mouseup', canvasMouseUp);

    let uiInterval: ReturnType<typeof setInterval> | null = null;

    function startUI() {
      if (uiInterval) clearInterval(uiInterval);
      uiInterval = setInterval(() => {
        toolbar.update(sim.stepCount, sim.stepCount, sim.world.time);
      }, 100);
    }

    function stopUI() {
      if (uiInterval) { clearInterval(uiInterval); uiInterval = null; }
    }

    toolbar.callbacks.onPlay = () => {
      if (!live.isRunning) {
        live.resume();
        if (sim.stepCount === 0) live.start();
        startUI();
      }
    };

    toolbar.callbacks.onPause = () => {
      live.pause();
      stopUI();
      toolbar.update(sim.stepCount, sim.stepCount, sim.world.time);
    };

    toolbar.callbacks.onStop = () => {
      live.pause();
      stopUI();
      toolbar.update(0, 0, 0);
    };

    toolbar.callbacks.onStep = () => {
      live.step();
      toolbar.update(sim.stepCount, sim.stepCount, sim.world.time);
    };

    toolbar.callbacks.onSpeedChange = (speed: number) => {
      live.setSpeed(speed);
    };

    toolbar.callbacks.onSeek = () => {};

    // Auto-start
    live.start();
    startUI();
    toolbar.setPlaying(true);
  }

  // --- setPlayback ---
  function setPlayback(recording: SimulationRecording) {
    if (app.live) app.live.pause();
    app.live = null;

    toolbar.setMode('playback');

    const playback = new PlaybackController(recording);
    app.playback = playback;

    if (recording.snapshots.length > 0) {
      renderer.autoFit(recording.snapshots[0].bodies);
    }

    playback.onFrame((snapshot) => {
      renderer.renderFrame(snapshot);
      toolbar.update(
        playback.getCurrentFrame(),
        playback.getTotalFrames(),
        snapshot.time,
      );
    });

    toolbar.callbacks.onPlay = () => { playback.play(); };
    toolbar.callbacks.onPause = () => { playback.pause(); };
    toolbar.callbacks.onStop = () => { playback.stop(); };
    toolbar.callbacks.onStep = () => {};
    toolbar.callbacks.onSeek = (frame: number) => { playback.setFrame(frame); };
    toolbar.callbacks.onSpeedChange = (speed: number) => { playback.setSpeed(speed); };

    playback.setFrame(0);
    toolbar.update(0, playback.getTotalFrames(), recording.snapshots[0]?.time ?? 0);
  }

  // --- Keyboard shortcuts ---
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target === document.body) {
      e.preventDefault();
      if (app.live) {
        if (app.live.isRunning) {
          toolbar.callbacks.onPause();
          toolbar.setPlaying(false);
        } else {
          toolbar.callbacks.onPlay();
          toolbar.setPlaying(true);
        }
      }
    }
  });

  // Defer initial scenario load until canvas is sized.
  // ResizeObserver fires asynchronously, so the canvas is 0x0 at this point.
  requestAnimationFrame(() => {
    resizeCanvas();
    const allScenarios = registry.getAll();
    if (allScenarios.length > 0) {
      loadScenario(allScenarios[0].id);
    }
  });

  return app;
}
