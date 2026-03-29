import { SimulationConfig, Simulation, step } from './simulation.js';
import { captureSnapshot, WorldSnapshot } from './snapshot.js';

/** A complete recording of a simulation run. */
export interface SimulationRecording {
  config: SimulationConfig;
  snapshots: WorldSnapshot[];
  metadata: {
    totalSteps: number;
    totalTime: number;
    bodyCount: number;
    recordedAt: string;
  };
}

/** Options for the simulation recorder. */
export interface RecorderOptions {
  /** Record every Nth frame (default 1 = every frame). */
  recordInterval?: number;
}

/** Records simulation snapshots over time. */
export class SimulationRecorder {
  private sim: Simulation;
  private snapshots: WorldSnapshot[] = [];
  private recordInterval: number;
  private framesSinceLastRecord = 0;

  constructor(sim: Simulation, options: RecorderOptions = {}) {
    this.sim = sim;
    this.recordInterval = options.recordInterval ?? 1;
  }

  /** Capture the current simulation state as a snapshot. */
  record(): void {
    this.snapshots.push(captureSnapshot(this.sim));
  }

  /** Step the simulation forward, then capture if interval is met. */
  stepAndRecord(): void {
    step(this.sim);
    this.framesSinceLastRecord++;
    if (this.framesSinceLastRecord >= this.recordInterval) {
      this.record();
      this.framesSinceLastRecord = 0;
    }
  }

  /** Get the complete recording with metadata. */
  getRecording(): SimulationRecording {
    const lastSnapshot = this.snapshots[this.snapshots.length - 1];
    return {
      config: { ...this.sim.config },
      snapshots: this.snapshots,
      metadata: {
        totalSteps: this.sim.stepCount,
        totalTime: lastSnapshot ? lastSnapshot.time : 0,
        bodyCount: this.sim.world.bodies.length,
        recordedAt: new Date().toISOString(),
      },
    };
  }

  /** Export the full recording as a JSON string. */
  exportJSON(): string {
    return JSON.stringify(this.getRecording());
  }
}

/** Create a new simulation recorder. */
export function createRecorder(sim: Simulation, options?: RecorderOptions): SimulationRecorder {
  return new SimulationRecorder(sim, options);
}
