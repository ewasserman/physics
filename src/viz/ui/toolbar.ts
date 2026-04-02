import { InteractionTool } from '../interaction.js';
import type { DropObjectType } from '../interaction.js';

/** Callbacks from the toolbar to the app. */
export interface ToolbarCallbacks {
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onStep: () => void;
  onSeek: (frame: number) => void;
  onSpeedChange: (speed: number) => void;
  onDebugToggle: (show: boolean) => void;
  onToolChange: (tool: InteractionTool) => void;
  onDropTypeChange: (type: DropObjectType) => void;
}

/** Controller for the toolbar. */
export interface ToolbarController {
  update(frame: number, totalFrames: number, time: number): void;
  setPlaying(playing: boolean): void;
  setActiveTool(tool: InteractionTool): void;
  setMode(mode: 'live' | 'playback'): void;
  callbacks: ToolbarCallbacks;
}

/**
 * Render transport, speed, debug, and tool controls into the toolbar container.
 */
export function renderToolbar(container: HTMLElement): ToolbarController {
  container.innerHTML = '';

  const callbacks: ToolbarCallbacks = {
    onPlay: () => {},
    onPause: () => {},
    onStop: () => {},
    onStep: () => {},
    onSeek: () => {},
    onSpeedChange: () => {},
    onDebugToggle: () => {},
    onToolChange: () => {},
    onDropTypeChange: () => {},
  };

  let isPlaying = false;
  let currentMode: 'live' | 'playback' = 'live';
  let activeTool = InteractionTool.Select;

  // --- Transport group ---
  const transport = group();

  const playBtn = btn('Play');
  const stopBtn = btn('Stop');
  const stepBtn = btn('Step');
  transport.appendChild(playBtn);
  transport.appendChild(stopBtn);
  transport.appendChild(stepBtn);

  const frameLabel = document.createElement('span');
  frameLabel.className = 'status-label';
  frameLabel.textContent = 'Step 0';
  const timeLabel = document.createElement('span');
  timeLabel.className = 'status-label';
  timeLabel.textContent = 't = 0.000s';

  transport.appendChild(frameLabel);
  transport.appendChild(timeLabel);

  container.appendChild(transport);
  container.appendChild(sep());

  // --- Speed ---
  const speedGroup = group();
  const speedSelect = document.createElement('select');
  for (const s of [0.25, 0.5, 1, 2, 4]) {
    const opt = document.createElement('option');
    opt.value = String(s);
    opt.textContent = `${s}x`;
    if (s === 1) opt.selected = true;
    speedSelect.appendChild(opt);
  }
  speedGroup.appendChild(speedSelect);
  container.appendChild(speedGroup);
  container.appendChild(sep());

  // --- Scrubber ---
  const scrubber = document.createElement('input');
  scrubber.type = 'range';
  scrubber.min = '0';
  scrubber.max = '0';
  scrubber.value = '0';
  scrubber.style.cssText = 'flex: 1; min-width: 80px; cursor: pointer; accent-color: #4a90d9;';
  container.appendChild(scrubber);
  container.appendChild(sep());

  // --- Debug toggle ---
  const debugGroup = group();
  const debugLabel = document.createElement('label');
  const debugCheck = document.createElement('input');
  debugCheck.type = 'checkbox';
  debugLabel.appendChild(debugCheck);
  debugLabel.appendChild(document.createTextNode(' Debug'));
  debugGroup.appendChild(debugLabel);
  container.appendChild(debugGroup);
  container.appendChild(sep());

  // --- Interaction tools ---
  const toolGroup = group();
  const toolDefs: Array<{ tool: InteractionTool; label: string }> = [
    { tool: InteractionTool.Select, label: 'Select' },
    { tool: InteractionTool.ApplyForce, label: 'Force' },
    { tool: InteractionTool.BreakJoint, label: 'Break' },
    { tool: InteractionTool.DropObject, label: 'Drop' },
  ];

  const toolButtons = new Map<InteractionTool, HTMLButtonElement>();
  for (const { tool, label } of toolDefs) {
    const b = btn(label);
    if (tool === InteractionTool.Select) b.classList.add('active');
    toolGroup.appendChild(b);
    toolButtons.set(tool, b);
  }

  const dropTypeSelect = document.createElement('select');
  for (const t of ['circle', 'box'] as DropObjectType[]) {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t.charAt(0).toUpperCase() + t.slice(1);
    dropTypeSelect.appendChild(opt);
  }
  toolGroup.appendChild(dropTypeSelect);

  container.appendChild(toolGroup);

  // --- Event wiring ---
  playBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    playBtn.textContent = isPlaying ? 'Pause' : 'Play';
    if (isPlaying) callbacks.onPlay();
    else callbacks.onPause();
  });

  stopBtn.addEventListener('click', () => {
    isPlaying = false;
    playBtn.textContent = 'Play';
    callbacks.onStop();
  });

  stepBtn.addEventListener('click', () => callbacks.onStep());

  scrubber.addEventListener('input', () => {
    callbacks.onSeek(parseInt(scrubber.value, 10));
  });

  speedSelect.addEventListener('change', () => {
    callbacks.onSpeedChange(parseFloat(speedSelect.value));
  });

  debugCheck.addEventListener('change', () => {
    callbacks.onDebugToggle(debugCheck.checked);
  });

  for (const { tool } of toolDefs) {
    toolButtons.get(tool)!.addEventListener('click', () => {
      activeTool = tool;
      updateToolHighlight();
      callbacks.onToolChange(tool);
    });
  }

  dropTypeSelect.addEventListener('change', () => {
    callbacks.onDropTypeChange(dropTypeSelect.value as DropObjectType);
  });

  function updateToolHighlight() {
    for (const [t, b] of toolButtons) {
      b.classList.toggle('active', t === activeTool);
    }
  }

  return {
    callbacks,
    update(frame: number, totalFrames: number, time: number) {
      if (currentMode === 'live') {
        frameLabel.textContent = `Step ${frame}`;
      } else {
        frameLabel.textContent = `Frame ${frame} / ${totalFrames}`;
      }
      timeLabel.textContent = `t = ${time.toFixed(3)}s`;
      scrubber.max = String(Math.max(0, totalFrames - 1));
      scrubber.value = String(frame);
    },
    setPlaying(playing: boolean) {
      isPlaying = playing;
      playBtn.textContent = isPlaying ? 'Pause' : 'Play';
    },
    setActiveTool(tool: InteractionTool) {
      activeTool = tool;
      updateToolHighlight();
    },
    setMode(mode: 'live' | 'playback') {
      currentMode = mode;
      stepBtn.style.display = mode === 'live' ? '' : 'none';
      if (mode === 'live') {
        scrubber.disabled = true;
        scrubber.style.opacity = '0.4';
      } else {
        scrubber.disabled = false;
        scrubber.style.opacity = '1';
      }
    },
  };
}

// --- DOM helpers ---

function group(): HTMLDivElement {
  const d = document.createElement('div');
  d.className = 'toolbar-group';
  return d;
}

function sep(): HTMLDivElement {
  const d = document.createElement('div');
  d.className = 'toolbar-separator';
  return d;
}

function btn(label: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.className = 'btn';
  b.textContent = label;
  return b;
}
