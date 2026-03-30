import { CanvasRenderer } from './renderer.js';
import { PlaybackController } from './playback.js';
import { LiveSimulation } from './live.js';
import { createControls, UIControls } from './ui.js';
import { demoBouncing, demoCarCrash, demoRain } from './demos.js';
import { captureSnapshot } from '../sim/snapshot.js';
import { InteractionManager, InteractionTool } from './interaction.js';
import type { SimulationRecording } from '../sim/recording.js';
import type { Simulation } from '../sim/simulation.js';

export interface AppOptions {
  /** Canvas width in pixels. */
  width?: number;
  /** Canvas height in pixels. */
  height?: number;
  /** Which demo to run by default. */
  demo?: 'bouncing' | 'carCrash' | 'rain';
  /** Start in playback mode with a recording. */
  recording?: SimulationRecording;
}

export interface App {
  canvas: HTMLCanvasElement;
  renderer: CanvasRenderer;
  controls: UIControls;
  live: LiveSimulation | null;
  playback: PlaybackController | null;
  /** Switch to live mode with a new simulation. */
  setLive(sim: Simulation): void;
  /** Switch to playback mode with a recording. */
  setPlayback(recording: SimulationRecording): void;
}

/** Mount the visualization app into a container element. */
export function createApp(container: HTMLElement, options: AppOptions = {}): App {
  const width = options.width ?? 800;
  const height = options.height ?? 600;

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.style.cssText = 'display: block; background: #f8f8f8; border-radius: 4px 4px 0 0;';
  container.appendChild(canvas);

  // Create renderer
  const renderer = new CanvasRenderer(canvas);

  // Create UI controls
  const controls = createControls();
  controls.container.style.width = width + 'px';
  controls.container.style.boxSizing = 'border-box';
  container.appendChild(controls.container);

  // App state
  const app: App = {
    canvas,
    renderer,
    controls,
    live: null,
    playback: null,
    setLive,
    setPlayback,
  };

  // Wire up debug toggle
  controls.onDebugToggle = (show: boolean) => {
    renderer.setShowContacts(show);
    // Re-render current frame if in playback
    if (app.playback) {
      const frame = app.playback.getCurrentFrame();
      app.playback.setFrame(frame);
    }
  };

  // Load a recording for playback
  if (options.recording) {
    setPlayback(options.recording);
  } else {
    // Start a demo in live mode
    const demoName = options.demo ?? 'bouncing';
    let sim: Simulation;
    switch (demoName) {
      case 'carCrash': sim = demoCarCrash(); break;
      case 'rain': sim = demoRain(); break;
      default: sim = demoBouncing(); break;
    }
    setLive(sim);
  }

  // Track canvas event listeners for cleanup between demos
  let canvasMouseDown: ((e: MouseEvent) => void) | null = null;
  let canvasMouseMove: ((e: MouseEvent) => void) | null = null;
  let canvasMouseUp: ((e: MouseEvent) => void) | null = null;

  function cleanupCanvasListeners() {
    if (canvasMouseDown) { canvas.removeEventListener('mousedown', canvasMouseDown); canvasMouseDown = null; }
    if (canvasMouseMove) { canvas.removeEventListener('mousemove', canvasMouseMove); canvasMouseMove = null; }
    if (canvasMouseUp) { canvas.removeEventListener('mouseup', canvasMouseUp); canvasMouseUp = null; }
  }

  function setLive(sim: Simulation) {
    // Cleanup previous
    if (app.live) app.live.pause();
    if (app.playback) app.playback.stop();
    app.playback = null;
    cleanupCanvasListeners();

    controls.setMode('live');

    const live = new LiveSimulation(sim, renderer, { record: true });
    app.live = live;

    // Wire up InteractionManager
    const interactionManager = new InteractionManager(live, renderer);
    controls.onToolChange = (tool) => interactionManager.setTool(tool);
    controls.onDropTypeChange = (type) => { interactionManager.dropObjectType = type; };

    canvasMouseDown = (e: MouseEvent) => interactionManager.onMouseDown(e.offsetX, e.offsetY);
    canvasMouseMove = (e: MouseEvent) => interactionManager.onMouseMove(e.offsetX, e.offsetY);
    canvasMouseUp = (e: MouseEvent) => interactionManager.onMouseUp(e.offsetX, e.offsetY);
    canvas.addEventListener('mousedown', canvasMouseDown);
    canvas.addEventListener('mousemove', canvasMouseMove);
    canvas.addEventListener('mouseup', canvasMouseUp);

    // Use an interval to update the UI during live sim
    let uiInterval: ReturnType<typeof setInterval> | null = null;

    function startUI() {
      if (uiInterval) clearInterval(uiInterval);
      uiInterval = setInterval(() => {
        controls.update(sim.stepCount, sim.stepCount, sim.world.time);
      }, 100);
    }

    function stopUI() {
      if (uiInterval) { clearInterval(uiInterval); uiInterval = null; }
    }

    controls.onPlay = () => {
      if (!live.isRunning) {
        live.resume();
        if (sim.stepCount === 0) live.start();
        startUI();
      }
    };

    controls.onPause = () => {
      live.pause();
      stopUI();
      controls.update(sim.stepCount, sim.stepCount, sim.world.time);
    };

    controls.onStop = () => {
      live.pause();
      stopUI();
      controls.update(0, 0, 0);
    };

    controls.onStep = () => {
      live.step();
      controls.update(sim.stepCount, sim.stepCount, sim.world.time);
    };

    controls.onSpeedChange = (speed: number) => {
      live.setSpeed(speed);
    };

    controls.onSeek = () => {
      // Seeking not supported in live mode
    };

    // Auto-start
    live.start();
    startUI();
    controls.setPlaying(true);
  }

  function setPlayback(recording: SimulationRecording) {
    // Cleanup previous
    if (app.live) app.live.pause();
    app.live = null;

    controls.setMode('playback');

    const playback = new PlaybackController(recording);
    app.playback = playback;

    // Auto-fit to first frame
    if (recording.snapshots.length > 0) {
      renderer.autoFit(recording.snapshots[0].bodies);
    }

    playback.onFrame((snapshot) => {
      renderer.renderFrame(snapshot);
      controls.update(
        playback.getCurrentFrame(),
        playback.getTotalFrames(),
        snapshot.time,
      );
    });

    controls.onPlay = () => { playback.play(); };
    controls.onPause = () => { playback.pause(); };
    controls.onStop = () => { playback.stop(); };
    controls.onStep = () => {};
    controls.onSeek = (frame: number) => { playback.setFrame(frame); };
    controls.onSpeedChange = (speed: number) => { playback.setSpeed(speed); };

    // Show first frame
    playback.setFrame(0);
    controls.update(0, playback.getTotalFrames(), recording.snapshots[0]?.time ?? 0);
  }

  return app;
}
