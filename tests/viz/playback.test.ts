import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlaybackController } from '../../src/viz/playback.js';
import type { SimulationRecording } from '../../src/sim/recording.js';
import type { WorldSnapshot } from '../../src/sim/snapshot.js';

/** Create a mock recording with the given number of frames. */
function makeRecording(frameCount: number, dt = 1 / 60): SimulationRecording {
  const snapshots: WorldSnapshot[] = [];
  for (let i = 0; i < frameCount; i++) {
    snapshots.push({
      time: i * dt,
      step: i,
      bodies: [],
      constraints: [],
      contacts: [],
    });
  }
  return {
    config: { dt, gravity: { x: 0, y: -9.81 } } as any,
    snapshots,
    metadata: {
      totalSteps: frameCount,
      totalTime: (frameCount - 1) * dt,
      bodyCount: 0,
      recordedAt: '2026-03-29T00:00:00Z',
    },
  };
}

// Stub requestAnimationFrame and cancelAnimationFrame for Node environment
let rafId = 0;
let rafCallback: ((ts: number) => void) | null = null;

vi.stubGlobal('requestAnimationFrame', (cb: (ts: number) => void) => {
  rafCallback = cb;
  return ++rafId;
});
vi.stubGlobal('cancelAnimationFrame', (_id: number) => {
  rafCallback = null;
});

describe('PlaybackController', () => {
  let controller: PlaybackController;
  const FRAME_COUNT = 100;

  beforeEach(() => {
    const recording = makeRecording(FRAME_COUNT);
    controller = new PlaybackController(recording);
    rafCallback = null;
  });

  describe('construction', () => {
    it('should construct with a recording', () => {
      expect(controller).toBeDefined();
    });

    it('should start at frame 0', () => {
      expect(controller.getCurrentFrame()).toBe(0);
    });

    it('should not be playing initially', () => {
      expect(controller.isPlaying).toBe(false);
    });
  });

  describe('getTotalFrames()', () => {
    it('should return the number of snapshots', () => {
      expect(controller.getTotalFrames()).toBe(FRAME_COUNT);
    });

    it('should return 1 for a single-frame recording', () => {
      const single = new PlaybackController(makeRecording(1));
      expect(single.getTotalFrames()).toBe(1);
    });
  });

  describe('setFrame()', () => {
    it('should set to valid frame index', () => {
      controller.setFrame(50);
      expect(controller.getCurrentFrame()).toBe(50);
    });

    it('should clamp negative index to 0', () => {
      controller.setFrame(-10);
      expect(controller.getCurrentFrame()).toBe(0);
    });

    it('should clamp index beyond total to last frame', () => {
      controller.setFrame(999);
      expect(controller.getCurrentFrame()).toBe(FRAME_COUNT - 1);
    });

    it('should clamp to 0 for a single-frame recording at index 0', () => {
      const single = new PlaybackController(makeRecording(1));
      single.setFrame(0);
      expect(single.getCurrentFrame()).toBe(0);
    });

    it('should fire frame callback on setFrame', () => {
      const cb = vi.fn();
      controller.onFrame(cb);
      controller.setFrame(10);
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(expect.objectContaining({ step: 10 }));
    });
  });

  describe('setSpeed()', () => {
    it('should store speed multiplier', () => {
      // setSpeed doesn't have a getter, but we can verify it doesn't throw
      expect(() => controller.setSpeed(2)).not.toThrow();
    });

    it('should accept fractional speeds', () => {
      expect(() => controller.setSpeed(0.25)).not.toThrow();
    });

    it('should accept high speeds', () => {
      expect(() => controller.setSpeed(4)).not.toThrow();
    });
  });

  describe('play() / pause() / stop()', () => {
    it('play() should set isPlaying to true', () => {
      controller.play();
      expect(controller.isPlaying).toBe(true);
    });

    it('pause() should set isPlaying to false', () => {
      controller.play();
      controller.pause();
      expect(controller.isPlaying).toBe(false);
    });

    it('stop() should set isPlaying to false and reset to frame 0', () => {
      controller.setFrame(50);
      controller.play();
      controller.stop();
      expect(controller.isPlaying).toBe(false);
      expect(controller.getCurrentFrame()).toBe(0);
    });

    it('play() when already playing should be a no-op', () => {
      controller.play();
      controller.play(); // second call should not error
      expect(controller.isPlaying).toBe(true);
    });

    it('pause() when not playing should be a no-op', () => {
      controller.pause();
      expect(controller.isPlaying).toBe(false);
    });

    it('stop() fires frame callback with frame 0 snapshot', () => {
      const cb = vi.fn();
      controller.onFrame(cb);
      controller.setFrame(50);
      cb.mockClear();
      controller.stop();
      expect(cb).toHaveBeenCalledWith(expect.objectContaining({ step: 0 }));
    });
  });

  describe('onFrame callback', () => {
    it('should register and call a frame callback', () => {
      const cb = vi.fn();
      controller.onFrame(cb);
      controller.setFrame(5);
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('should support multiple callbacks', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      controller.onFrame(cb1);
      controller.onFrame(cb2);
      controller.setFrame(3);
      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);
    });
  });

  describe('animation loop', () => {
    it('play() should schedule a requestAnimationFrame', () => {
      controller.play();
      expect(rafCallback).not.toBeNull();
    });

    it('pause() should cancel the scheduled frame', () => {
      controller.play();
      controller.pause();
      // After pause, rafCallback is cleared by our stub
      expect(controller.isPlaying).toBe(false);
    });

    it('loop should advance frames when time progresses', () => {
      controller.play();
      // play() calls loop(0) which sets lastTimestamp=0 and schedules raf
      // First raf callback: lastTimestamp is 0, so > 0 check fails, sets lastTimestamp=16
      if (rafCallback) rafCallback(16);
      // Second raf callback: now lastTimestamp=16 > 0, so delta is computed
      if (rafCallback) rafCallback(200);
      // 184ms at speed=1 at 60fps ~ 11 frames
      expect(controller.getCurrentFrame()).toBeGreaterThan(0);
    });

    it('should stop at last frame and set isPlaying to false', () => {
      // Use a small recording
      const small = new PlaybackController(makeRecording(3));
      small.play();
      // play() calls loop(0): lastTimestamp=0, schedules raf
      // First callback: lastTimestamp is 0 so > 0 fails, sets lastTimestamp=16
      if (rafCallback) rafCallback(16);
      // Second callback: delta = (2000-16)/1000 = ~2s, well past 3 frames at 60fps
      if (rafCallback) rafCallback(2000);
      expect(small.getCurrentFrame()).toBe(2); // last frame index
      expect(small.isPlaying).toBe(false);
    });
  });
});
