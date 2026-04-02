/** References to the key DOM regions created by buildLayout(). */
export interface LayoutRefs {
  root: HTMLDivElement;
  sidebarLeft: HTMLDivElement;
  canvasWrapper: HTMLDivElement;
  canvas: HTMLCanvasElement;
  toolbar: HTMLDivElement;
  sidebarRight: HTMLDivElement;
}

/**
 * Build the three-panel CSS Grid DOM structure inside the given mount point.
 */
export function buildLayout(mount: HTMLElement): LayoutRefs {
  mount.innerHTML = '';

  const root = mount as HTMLDivElement;

  const sidebarLeft = document.createElement('div');
  sidebarLeft.className = 'sidebar-left';

  const canvasWrapper = document.createElement('div');
  canvasWrapper.className = 'canvas-wrapper';

  const canvas = document.createElement('canvas');
  canvasWrapper.appendChild(canvas);

  const toolbar = document.createElement('div');
  toolbar.className = 'toolbar';

  const sidebarRight = document.createElement('div');
  sidebarRight.className = 'sidebar-right';

  root.appendChild(sidebarLeft);
  root.appendChild(canvasWrapper);
  root.appendChild(toolbar);
  root.appendChild(sidebarRight);

  return { root, sidebarLeft, canvasWrapper, canvas, toolbar, sidebarRight };
}
