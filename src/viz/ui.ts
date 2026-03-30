import { PlaybackController } from './playback.js';
import { LiveSimulation } from './live.js';
import { InteractionTool } from './interaction.js';
import type { DropObjectType } from './interaction.js';

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
  onToolChange: (tool: InteractionTool) => void;
  onDropTypeChange: (type: DropObjectType) => void;
  setActiveTool: (tool: InteractionTool) => void;
  setPlaying: (playing: boolean) => void;
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

  // --- Tool selector ---
  const toolGroup = document.createElement('div');
  toolGroup.style.cssText = 'display: flex; gap: 2px; margin-left: 8px; border-left: 1px solid #555; padding-left: 8px;';

  const toolButtons: Record<InteractionTool, HTMLButtonElement> = {} as any;
  const tools: Array<{ tool: InteractionTool; label: string }> = [
    { tool: InteractionTool.Select, label: 'Select' },
    { tool: InteractionTool.ApplyForce, label: 'Force' },
    { tool: InteractionTool.BreakJoint, label: 'Break' },
    { tool: InteractionTool.DropObject, label: 'Drop' },
  ];

  for (const { tool, label } of tools) {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.dataset.tool = tool;
    btn.style.cssText = toolBtnStyle(tool === InteractionTool.Select);
    toolGroup.appendChild(btn);
    toolButtons[tool] = btn;
  }

  // Drop object type selector
  const dropTypeSelect = document.createElement('select');
  dropTypeSelect.style.cssText = 'background: #444; color: #eee; border: 1px solid #666; padding: 2px 4px; border-radius: 3px; margin-left: 4px;';
  for (const t of ['circle', 'box'] as DropObjectType[]) {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t.charAt(0).toUpperCase() + t.slice(1);
    dropTypeSelect.appendChild(opt);
  }

  container.appendChild(playBtn);
  container.appendChild(stopBtn);
  container.appendChild(stepBtn);
  container.appendChild(frameLabel);
  container.appendChild(timeLabel);
  container.appendChild(speedSelect);
  container.appendChild(scrubber);
  container.appendChild(debugLabel);
  container.appendChild(toolGroup);
  container.appendChild(dropTypeSelect);

  let isPlaying = false;

  let activeTool = InteractionTool.Select;

  function updateToolButtons(): void {
    for (const { tool } of tools) {
      toolButtons[tool].style.cssText = toolBtnStyle(tool === activeTool);
    }
  }

  const controls: UIControls = {
    container,
    onPlay: () => {},
    onPause: () => {},
    onStop: () => {},
    onStep: () => {},
    onSeek: () => {},
    onSpeedChange: () => {},
    onDebugToggle: () => {},
    onToolChange: () => {},
    onDropTypeChange: () => {},

    setActiveTool(tool: InteractionTool) {
      activeTool = tool;
      updateToolButtons();
    },

    setPlaying(playing: boolean) {
      isPlaying = playing;
      playBtn.textContent = isPlaying ? 'Pause' : 'Play';
    },

    update(frame: number, totalFrames: number, time: number) {
      frameLabel.textContent = `Frame ${frame} / ${totalFrames}`;
      timeLabel.textContent = `t = ${time.toFixed(3)}s`;
      scrubber.max = String(Math.max(0, totalFrames - 1));
      scrubber.value = String(frame);
    },

    setMode(mode: UIMode) {
      // Step only available in live mode
      stepBtn.style.display = mode === 'live' ? '' : 'none';
      // Scrubber not meaningful in live mode
      if (mode === 'live') {
        scrubber.disabled = true;
        scrubber.style.opacity = '0.4';
      } else {
        scrubber.disabled = false;
        scrubber.style.opacity = '1';
      }
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

  for (const { tool } of tools) {
    toolButtons[tool].addEventListener('click', () => {
      activeTool = tool;
      updateToolButtons();
      controls.onToolChange(tool);
    });
  }

  dropTypeSelect.addEventListener('change', () => {
    controls.onDropTypeChange(dropTypeSelect.value as DropObjectType);
  });

  return controls;
}

function btnStyle(): string {
  return 'background: #555; color: #eee; border: 1px solid #777; padding: 4px 12px; border-radius: 3px; cursor: pointer; font-family: monospace;';
}

function toolBtnStyle(active: boolean): string {
  const bg = active ? '#4a90d9' : '#555';
  const border = active ? '#6ab0ff' : '#777';
  return `background: ${bg}; color: #eee; border: 1px solid ${border}; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-family: monospace; font-size: 12px;`;
}
