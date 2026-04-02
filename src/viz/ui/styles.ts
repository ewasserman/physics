/** Inject all CSS for the three-panel layout. Idempotent. */
export function injectStyles(): void {
  if (document.getElementById('physics-sim-styles')) return;

  const style = document.createElement('style');
  style.id = 'physics-sim-styles';
  style.textContent = CSS;
  document.head.appendChild(style);
}

const CSS = `
/* ===== Reset ===== */
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

body {
  background: #0f0f23;
  color: #e0e0e0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
  overflow: hidden;
  height: 100vh;
  width: 100vw;
}

/* ===== Grid layout ===== */
#app {
  display: grid;
  grid-template-columns: 220px 1fr 280px;
  grid-template-rows: 1fr auto;
  height: 100vh;
  width: 100vw;
}

/* ===== Left sidebar — scenario picker ===== */
.sidebar-left {
  grid-row: 1 / -1;
  grid-column: 1;
  background: #1a1a2e;
  border-right: 1px solid #2a2a4a;
  overflow-y: auto;
  padding: 12px 0;
  display: flex;
  flex-direction: column;
}

.sidebar-left h2 {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #8888aa;
  padding: 0 16px;
  margin-bottom: 8px;
}

.scenario-category {
  margin-bottom: 8px;
}

.scenario-category-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #666688;
  padding: 6px 16px 4px;
}

.scenario-btn {
  display: block;
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  color: #c0c0d0;
  font-family: inherit;
  font-size: 13px;
  padding: 7px 16px 7px 24px;
  cursor: pointer;
  transition: background 0.1s, color 0.1s;
}

.scenario-btn:hover {
  background: #24244a;
  color: #ffffff;
}

.scenario-btn.active {
  background: #4a90d9;
  color: #ffffff;
  font-weight: 500;
}

/* ===== Canvas wrapper ===== */
.canvas-wrapper {
  grid-row: 1;
  grid-column: 2;
  position: relative;
  overflow: hidden;
  background: #1e1e3a;
}

.canvas-wrapper canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* ===== Toolbar ===== */
.toolbar {
  grid-row: 2;
  grid-column: 2;
  background: #16213e;
  border-top: 1px solid #2a2a4a;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  flex-wrap: wrap;
  min-height: 40px;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.toolbar-separator {
  width: 1px;
  height: 20px;
  background: #2a2a4a;
  margin: 0 4px;
}

.toolbar .btn {
  background: #2a3a5e;
  color: #d0d0e0;
  border: 1px solid #3a4a6e;
  padding: 4px 12px;
  border-radius: 3px;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  transition: background 0.1s;
}

.toolbar .btn:hover {
  background: #3a4a6e;
  color: #ffffff;
}

.toolbar .btn.active {
  background: #4a90d9;
  border-color: #6ab0ff;
  color: #ffffff;
}

.toolbar select {
  background: #2a3a5e;
  color: #d0d0e0;
  border: 1px solid #3a4a6e;
  padding: 3px 6px;
  border-radius: 3px;
  font-family: inherit;
  font-size: 12px;
}

.toolbar input[type="range"] {
  flex: 1;
  min-width: 80px;
  cursor: pointer;
  accent-color: #4a90d9;
}

.toolbar .status-label {
  font-size: 12px;
  color: #9090b0;
  white-space: nowrap;
  min-width: 80px;
}

.toolbar label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 12px;
  color: #b0b0c0;
}

/* ===== Right sidebar — param panel ===== */
.sidebar-right {
  grid-row: 1 / -1;
  grid-column: 3;
  background: #1a1a2e;
  border-left: 1px solid #2a2a4a;
  overflow-y: auto;
  padding: 12px 0;
}

.sidebar-right h2 {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #8888aa;
  padding: 0 16px;
  margin-bottom: 8px;
}

.param-group {
  border-bottom: 1px solid #2a2a4a;
}

.param-group summary {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #8888aa;
  padding: 8px 16px;
  cursor: pointer;
  user-select: none;
  list-style: none;
}

.param-group summary::before {
  content: '\\25B6';
  display: inline-block;
  width: 14px;
  font-size: 9px;
  transition: transform 0.15s;
}

.param-group[open] summary::before {
  transform: rotate(90deg);
}

.param-row {
  padding: 4px 16px 6px;
}

.param-label {
  display: block;
  font-size: 11px;
  color: #9090b0;
  margin-bottom: 3px;
}

.param-control {
  display: flex;
  align-items: center;
  gap: 6px;
}

.param-control input[type="range"] {
  flex: 1;
  accent-color: #4a90d9;
}

.param-control input[type="number"] {
  width: 60px;
  background: #12122a;
  color: #d0d0e0;
  border: 1px solid #2a2a4a;
  border-radius: 3px;
  padding: 2px 4px;
  font-family: inherit;
  font-size: 12px;
  text-align: right;
}

.param-control input[type="checkbox"] {
  accent-color: #4a90d9;
}

.param-control select {
  flex: 1;
  background: #12122a;
  color: #d0d0e0;
  border: 1px solid #2a2a4a;
  border-radius: 3px;
  padding: 2px 4px;
  font-family: inherit;
  font-size: 12px;
}

.param-vec2 {
  display: flex;
  gap: 6px;
}

.param-vec2 label {
  font-size: 11px;
  color: #7070a0;
}

.param-vec2 input[type="number"] {
  width: 70px;
  background: #12122a;
  color: #d0d0e0;
  border: 1px solid #2a2a4a;
  border-radius: 3px;
  padding: 2px 4px;
  font-family: inherit;
  font-size: 12px;
  text-align: right;
}

.param-btn-row {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
}

.restart-btn, .reset-btn {
  flex: 1;
  background: #2a3a5e;
  color: #d0d0e0;
  border: 1px solid #3a4a6e;
  padding: 6px;
  border-radius: 3px;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  text-align: center;
  transition: background 0.1s;
}

.restart-btn {
  background: #2a5e3a;
  border-color: #3a6e4a;
}

.restart-btn:hover {
  background: #3a6e4a;
  color: #ffffff;
}

.reset-btn:hover {
  background: #3a4a6e;
  color: #ffffff;
}
`;
