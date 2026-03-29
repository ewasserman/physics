import { PlaybackController } from './playback.js';
import { LiveSimulation } from './live.js';

export type UIMode = 'live' | 'playback';

export interface UIControls {
  container: HTMLDivElement;
  update(frame: number, totalFrames: number, time: number): void;
  setMode(mode: UIMode): void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onStep: () => void;
  onSeek: (frame: number) => void;
  onSpeedChange: (speed: number) => void;
  onDebugToggle: (show: boolean) => void;
}

/**
 * Create DOM controls for the visualization.
 * Returns an object with update methods and event hooks.
 */
export function createControls(): UIControls {
  const container = document.createElement('div');
  container.style.cssText = `
    display: flex; align-items: center; gap: 8px; padding: 8px 12px;
    background: #2d2d2d; color: #eee; font-family: monospace; font-size: 13px;
    flex-wrap: wrap; border-radius: 0 0 4px 4px;
  `;

  // Play/Pause button
  const playBtn = document.createElement('button');
  playBtn.textContent = 'Play';
  playBtn.style.cssText = btnStyle();

  // Stop button
  const stopBtn = document.createElement('button');
  stopBtn.textContent = 'Stop';
  stopBtn.style.cssText = btnStyle();

  // Step button
  const stepBtn = document.createElement('button');
  stepBtn.textContent = 'Step';
  stepBtn.style.cssText = btnStyle();

  // Frame counter
  const frameLabel = document.createElement('span');
  frameLabel.textContent = 'Frame 0 / 0';
  frameLabel.style.cssText = 'min-width: 120px;';

  // Time display
  const timeLabel = document.createElement('span');
  timeLabel.textContent = 't = 0.000s';
  timeLabel.style.cssText = 'min-width: 90px;';

  // Speed selector
  const speedSelect = document.createElement('select');
  speedSelect.style.cssText = 'background: #444; color: #eee; border: 1px solid #666; padding: 2px 4px; border-radius: 3px;';
  const speeds = [0.25, 0.5, 1, 2, 4];
  for (const s of speeds) {
    const opt = document.createElement('option');
    opt.value = String(s);
    opt.textContent = `${s}x`;
    if (s === 1) opt.selected = true;
    speedSelect.appendChild(opt);
  }

  // Timeline scrubber
  const scrubber = document.createElement('input');
  scrubber.type = 'range';
  scrubber.min = '0';
  scrubber.max = '0';
  scrubber.value = '0';
  scrubber.style.cssText = 'flex: 1; min-width: 100px; cursor: pointer;';

  // Debug toggle
  const debugLabel = document.createElement('label');
  debugLabel.style.cssText = 'display: flex; align-items: center; gap: 4px; cursor: pointer;';
  const debugCheck = document.createElement('input');
  debugCheck.type = 'checkbox';
  debugLabel.appendChild(debugCheck);
  debugLabel.appendChild(document.createTextNode('Debug'));

  container.appendChild(playBtn);
  container.appendChild(stopBtn);
  container.appendChild(stepBtn);
  container.appendChild(frameLabel);
  container.appendChild(timeLabel);
  container.appendChild(speedSelect);
  container.appendChild(scrubber);
  container.appendChild(debugLabel);

  let isPlaying = false;

  const controls: UIControls = {
    container,
    onPlay: () => {},
    onPause: () => {},
    onStop: () => {},
    onStep: () => {},
    onSeek: () => {},
    onSpeedChange: () => {},
    onDebugToggle: () => {},

    update(frame: number, totalFrames: number, time: number) {
      frameLabel.textContent = `Frame ${frame} / ${totalFrames}`;
      timeLabel.textContent = `t = ${time.toFixed(3)}s`;
      scrubber.max = String(Math.max(0, totalFrames - 1));
      scrubber.value = String(frame);
    },

    setMode(mode: UIMode) {
      // Step only available in live mode
      stepBtn.style.display = mode === 'live' ? '' : 'none';
    },
  };

  playBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    playBtn.textContent = isPlaying ? 'Pause' : 'Play';
    if (isPlaying) {
      controls.onPlay();
    } else {
      controls.onPause();
    }
  });

  stopBtn.addEventListener('click', () => {
    isPlaying = false;
    playBtn.textContent = 'Play';
    controls.onStop();
  });

  stepBtn.addEventListener('click', () => {
    controls.onStep();
  });

  scrubber.addEventListener('input', () => {
    controls.onSeek(parseInt(scrubber.value, 10));
  });

  speedSelect.addEventListener('change', () => {
    controls.onSpeedChange(parseFloat(speedSelect.value));
  });

  debugCheck.addEventListener('change', () => {
    controls.onDebugToggle(debugCheck.checked);
  });

  return controls;
}

function btnStyle(): string {
  return 'background: #555; color: #eee; border: 1px solid #777; padding: 4px 12px; border-radius: 3px; cursor: pointer; font-family: monospace;';
}
