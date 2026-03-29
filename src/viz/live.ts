import type { Simulation } from '../sim/simulation.js';
import { step } from '../sim/simulation.js';
import { captureSnapshot } from '../sim/snapshot.js';
import { SimulationRecorder, createRecorder } from '../sim/recording.js';
import { CanvasRenderer } from './renderer.js';

/** Runs a simulation in real-time with rendering. */
export class LiveSimulation {
  private sim: Simulation;
  private renderer: CanvasRenderer;
  private _isRunning = false;
  private animId = 0;
  private lastTimestamp = 0;
  private accumulatedTime = 0;
  private recorder: SimulationRecorder | null = null;

  constructor(sim: Simulation, renderer: CanvasRenderer, options?: { record?: boolean }) {
    this.sim = sim;
    this.renderer = renderer;
    if (options?.record) {
      this.recorder = createRecorder(sim);
    }
  }

  get isRunning(): boolean { return this._isRunning; }

  /** Start the live simulation loop. */
  start(): void {
    if (this._isRunning) return;
    this._isRunning = true;
    this.lastTimestamp = 0;
    this.accumulatedTime = 0;

    // Auto-fit camera on first frame
    const snapshot = captureSnapshot(this.sim);
    this.renderer.autoFit(snapshot.bodies);
    this.renderer.renderFrame(snapshot);

    this.animId = requestAnimationFrame(this.loop);
  }

  /** Pause the simulation. */
  pause(): void {
    this._isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = 0;
    }
  }

  /** Resume after pause. */
  resume(): void {
    if (this._isRunning) return;
    this._isRunning = true;
    this.lastTimestamp = 0;
    this.accumulatedTime = 0;
    this.animId = requestAnimationFrame(this.loop);
  }

  /** Advance one simulation step and render. */
  step(): void {
    step(this.sim);
    if (this.recorder) this.recorder.record();
    const snapshot = captureSnapshot(this.sim);
    this.renderer.renderFrame(snapshot);
  }

  /** Get the recorder (if recording was enabled). */
  getRecorder(): SimulationRecorder | null {
    return this.recorder;
  }

  /** Get the underlying simulation. */
  getSimulation(): Simulation {
    return this.sim;
  }

  private loop = (timestamp: number): void => {
    if (!this._isRunning) return;

    if (this.lastTimestamp > 0) {
      const realDelta = (timestamp - this.lastTimestamp) / 1000;
      // Cap delta to avoid spiral of death
      this.accumulatedTime += Math.min(realDelta, 0.1);

      const dt = this.sim.config.dt;
      while (this.accumulatedTime >= dt) {
        this.accumulatedTime -= dt;
        step(this.sim);
        if (this.recorder) this.recorder.record();
      }

      const snapshot = captureSnapshot(this.sim);
      this.renderer.renderFrame(snapshot);
    }

    this.lastTimestamp = timestamp;
    this.animId = requestAnimationFrame(this.loop);
  };
}
