import type { SimulationRecording } from '../sim/recording.js';
import type { WorldSnapshot } from '../sim/snapshot.js';

export type FrameCallback = (snapshot: WorldSnapshot) => void;

/** Playback controller for recorded simulations. */
export class PlaybackController {
  private recording: SimulationRecording;
  private currentFrame = 0;
  private speed = 1;
  private _isPlaying = false;
  private animId = 0;
  private lastTimestamp = 0;
  private accumulatedTime = 0;
  private frameCallbacks: FrameCallback[] = [];

  constructor(recording: SimulationRecording) {
    this.recording = recording;
  }

  get isPlaying(): boolean { return this._isPlaying; }

  getCurrentFrame(): number { return this.currentFrame; }

  getTotalFrames(): number { return this.recording.snapshots.length; }

  /** Get the dt between recorded frames. */
  private get frameDt(): number {
    if (this.recording.snapshots.length < 2) return 1 / 60;
    return this.recording.snapshots[1].time - this.recording.snapshots[0].time;
  }

  /** Register a callback to be called each displayed frame. */
  onFrame(callback: FrameCallback): void {
    this.frameCallbacks.push(callback);
  }

  /** Start or resume playback. */
  play(): void {
    if (this._isPlaying) return;
    this._isPlaying = true;
    this.lastTimestamp = 0;
    this.accumulatedTime = 0;
    this.loop(0);
  }

  /** Pause playback. */
  pause(): void {
    this._isPlaying = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = 0;
    }
  }

  /** Stop playback and reset to frame 0. */
  stop(): void {
    this.pause();
    this.currentFrame = 0;
    this.emitFrame();
  }

  /** Jump to a specific frame index. */
  setFrame(index: number): void {
    this.currentFrame = Math.max(0, Math.min(index, this.getTotalFrames() - 1));
    this.emitFrame();
  }

  /** Set playback speed multiplier. */
  setSpeed(multiplier: number): void {
    this.speed = multiplier;
  }

  private loop = (timestamp: number): void => {
    if (!this._isPlaying) return;

    if (this.lastTimestamp > 0) {
      const realDelta = (timestamp - this.lastTimestamp) / 1000; // seconds
      this.accumulatedTime += realDelta * this.speed;

      // Advance frames based on accumulated time
      const frameDt = this.frameDt;
      while (this.accumulatedTime >= frameDt && this.currentFrame < this.getTotalFrames() - 1) {
        this.accumulatedTime -= frameDt;
        this.currentFrame++;
      }

      this.emitFrame();

      // Stop at end
      if (this.currentFrame >= this.getTotalFrames() - 1) {
        this._isPlaying = false;
        return;
      }
    }

    this.lastTimestamp = timestamp;
    this.animId = requestAnimationFrame(this.loop);
  };

  private emitFrame(): void {
    const snapshot = this.recording.snapshots[this.currentFrame];
    if (snapshot) {
      for (const cb of this.frameCallbacks) {
        cb(snapshot);
      }
    }
  }
}
