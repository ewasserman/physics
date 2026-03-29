import type { BodySnapshot, ConstraintSnapshot, ContactSnapshot, WorldSnapshot } from '../sim/snapshot.js';

/** Renderer configuration. */
export interface RendererConfig {
  /** Default fill color for dynamic bodies. */
  fillColor?: string;
  /** Fill color for static bodies. */
  staticColor?: string;
  /** Stroke color for body outlines. */
  strokeColor?: string;
  /** Color for constraints. */
  constraintColor?: string;
  /** Color for broken constraints. */
  brokenConstraintColor?: string;
  /** Color for contact debug dots. */
  contactColor?: string;
  /** Grid line color. */
  gridColor?: string;
  /** Background color. */
  backgroundColor?: string;
  /** Whether to show grid by default. */
  showGrid?: boolean;
  /** Whether to show contacts by default. */
  showContacts?: boolean;
}

const DEFAULT_CONFIG: Required<RendererConfig> = {
  fillColor: '#4a90d9',
  staticColor: '#555555',
  strokeColor: '#222222',
  constraintColor: '#888888',
  brokenConstraintColor: '#cc3333',
  contactColor: '#ff4444',
  gridColor: '#e0e0e0',
  backgroundColor: '#f8f8f8',
  showGrid: true,
  showContacts: false,
};

/** A body-color palette for auto-assignment. */
const PALETTE = [
  '#4a90d9', '#e06c75', '#98c379', '#e5c07b', '#c678dd',
  '#56b6c2', '#d19a66', '#61afef', '#be5046', '#7ec699',
];

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: Required<RendererConfig>;

  // Camera state
  private cameraCX = 0;
  private cameraCY = 0;
  private cameraZoom = 40; // pixels per world-unit

  constructor(canvas: HTMLCanvasElement, config: RendererConfig = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D rendering context');
    this.ctx = ctx;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  get width(): number { return this.canvas.width; }
  get height(): number { return this.canvas.height; }

  /** Set the camera center (world coords) and zoom (pixels per world-unit). */
  setCamera(cx: number, cy: number, zoom: number): void {
    this.cameraCX = cx;
    this.cameraCY = cy;
    this.cameraZoom = zoom;
  }

  /** Convert world coordinates to screen (canvas) coordinates. */
  worldToScreen(wx: number, wy: number): { x: number; y: number } {
    const x = (wx - this.cameraCX) * this.cameraZoom + this.width / 2;
    const y = this.height / 2 - (wy - this.cameraCY) * this.cameraZoom;
    return { x, y };
  }

  /** Convert screen coordinates to world coordinates. */
  screenToWorld(sx: number, sy: number): { x: number; y: number } {
    const wx = (sx - this.width / 2) / this.cameraZoom + this.cameraCX;
    const wy = -(sy - this.height / 2) / this.cameraZoom + this.cameraCY;
    return { x: wx, y: wy };
  }

  /** Auto-fit camera to include all bodies. */
  autoFit(bodies: BodySnapshot[], padding = 2): void {
    if (bodies.length === 0) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const b of bodies) {
      const r = b.radius ?? Math.max(b.halfWidth ?? 1, b.halfHeight ?? 1);
      const px = b.position.x;
      const py = b.position.y;
      if (px - r < minX) minX = px - r;
      if (px + r > maxX) maxX = px + r;
      if (py - r < minY) minY = py - r;
      if (py + r > maxY) maxY = py + r;
    }
    minX -= padding; maxX += padding;
    minY -= padding; maxY += padding;

    this.cameraCX = (minX + maxX) / 2;
    this.cameraCY = (minY + maxY) / 2;

    const spanX = maxX - minX;
    const spanY = maxY - minY;
    const zoomX = this.width / spanX;
    const zoomY = this.height / spanY;
    this.cameraZoom = Math.min(zoomX, zoomY);
  }

  /** Clear the canvas. */
  clear(): void {
    const ctx = this.ctx;
    ctx.fillStyle = this.config.backgroundColor;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  /** Draw a background grid. */
  renderGrid(): void {
    const ctx = this.ctx;
    const topLeft = this.screenToWorld(0, 0);
    const bottomRight = this.screenToWorld(this.width, this.height);

    // Determine grid spacing based on zoom
    let spacing = 1;
    const pixelsPerUnit = this.cameraZoom;
    if (pixelsPerUnit < 10) spacing = 10;
    else if (pixelsPerUnit < 25) spacing = 5;
    else if (pixelsPerUnit > 200) spacing = 0.25;
    else if (pixelsPerUnit > 100) spacing = 0.5;

    ctx.strokeStyle = this.config.gridColor;
    ctx.lineWidth = 0.5;
    ctx.beginPath();

    // Vertical lines
    const startX = Math.floor(topLeft.x / spacing) * spacing;
    for (let wx = startX; wx <= bottomRight.x; wx += spacing) {
      const s = this.worldToScreen(wx, 0);
      ctx.moveTo(s.x, 0);
      ctx.lineTo(s.x, this.height);
    }

    // Horizontal lines (topLeft.y is higher world-y)
    const startY = Math.floor(bottomRight.y / spacing) * spacing;
    for (let wy = startY; wy <= topLeft.y; wy += spacing) {
      const s = this.worldToScreen(0, wy);
      ctx.moveTo(0, s.y);
      ctx.lineTo(this.width, s.y);
    }

    ctx.stroke();

    // Draw axes
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const originX = this.worldToScreen(0, 0);
    ctx.moveTo(originX.x, 0);
    ctx.lineTo(originX.x, this.height);
    ctx.moveTo(0, originX.y);
    ctx.lineTo(this.width, originX.y);
    ctx.stroke();
  }

  /** Render a single body. */
  renderBody(body: BodySnapshot): void {
    const ctx = this.ctx;
    const pos = this.worldToScreen(body.position.x, body.position.y);
    const isStatic = body.isStatic;

    ctx.save();
    ctx.translate(pos.x, pos.y);
    // Note: screen-space rotation is negated because y-axis is flipped
    ctx.rotate(-body.angle);

    const fillColor = isStatic
      ? this.config.staticColor
      : PALETTE[body.id % PALETTE.length];

    ctx.fillStyle = fillColor;
    ctx.strokeStyle = this.config.strokeColor;
    ctx.lineWidth = 1;

    switch (body.shapeType) {
      case 'circle': {
        const r = (body.radius ?? 1) * this.cameraZoom;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Radius line to show rotation
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(r, 0);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
      }
      case 'aabb': {
        const hw = (body.halfWidth ?? 1) * this.cameraZoom;
        const hh = (body.halfHeight ?? 1) * this.cameraZoom;
        ctx.fillRect(-hw, -hh, hw * 2, hh * 2);
        ctx.strokeRect(-hw, -hh, hw * 2, hh * 2);
        break;
      }
      case 'polygon': {
        if (body.vertices && body.vertices.length > 0) {
          ctx.beginPath();
          // Vertices are in local space, need to scale by zoom
          const v0 = body.vertices[0];
          ctx.moveTo(v0.x * this.cameraZoom, -v0.y * this.cameraZoom);
          for (let i = 1; i < body.vertices.length; i++) {
            const v = body.vertices[i];
            ctx.lineTo(v.x * this.cameraZoom, -v.y * this.cameraZoom);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        break;
      }
    }

    ctx.restore();
  }

  /** Render a constraint line between two bodies. */
  renderConstraint(constraint: ConstraintSnapshot, bodies: Map<number, BodySnapshot>): void {
    const ctx = this.ctx;
    const bodyA = bodies.get(constraint.bodyAId);
    const bodyB = bodies.get(constraint.bodyBId);
    if (!bodyA || !bodyB) return;

    const posA = this.worldToScreen(bodyA.position.x, bodyA.position.y);
    const posB = this.worldToScreen(bodyB.position.x, bodyB.position.y);

    ctx.strokeStyle = constraint.broken
      ? this.config.brokenConstraintColor
      : this.config.constraintColor;
    ctx.lineWidth = 2;
    ctx.setLineDash(constraint.broken ? [4, 4] : []);
    ctx.beginPath();
    ctx.moveTo(posA.x, posA.y);
    ctx.lineTo(posB.x, posB.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /** Render a contact point (debug). */
  renderContact(contact: ContactSnapshot): void {
    const ctx = this.ctx;
    const pos = this.worldToScreen(contact.point.x, contact.point.y);

    // Dot at contact point
    ctx.fillStyle = this.config.contactColor;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
    ctx.fill();

    // Normal line
    const normalLen = 15; // pixels
    ctx.strokeStyle = this.config.contactColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    // Normal in screen space: flip y
    ctx.lineTo(
      pos.x + contact.normal.x * normalLen,
      pos.y - contact.normal.y * normalLen,
    );
    ctx.stroke();
  }

  /** Render an entire frame. */
  renderFrame(snapshot: WorldSnapshot): void {
    this.clear();

    if (this.config.showGrid) {
      this.renderGrid();
    }

    // Build body map for constraint rendering
    const bodyMap = new Map<number, BodySnapshot>();
    for (const body of snapshot.bodies) {
      bodyMap.set(body.id, body);
    }

    // Render constraints first (behind bodies)
    for (const constraint of snapshot.constraints) {
      this.renderConstraint(constraint, bodyMap);
    }

    // Render bodies
    for (const body of snapshot.bodies) {
      this.renderBody(body);
    }

    // Render contacts (debug overlay)
    if (this.config.showContacts) {
      for (const contact of snapshot.contacts) {
        this.renderContact(contact);
      }
    }
  }

  /** Toggle contact debug overlay. */
  setShowContacts(show: boolean): void {
    this.config.showContacts = show;
  }

  /** Toggle grid. */
  setShowGrid(show: boolean): void {
    this.config.showGrid = show;
  }

  /** Get the current camera zoom (pixels per world-unit). */
  getZoom(): number {
    return this.cameraZoom;
  }

  /**
   * Draw an arrow from world-space start to world-space end.
   * Used for force visualization during drag interactions.
   */
  drawArrow(
    startWX: number, startWY: number,
    endWX: number, endWY: number,
    color = '#ff6600',
    lineWidth = 3,
  ): void {
    const ctx = this.ctx;
    const start = this.worldToScreen(startWX, startWY);
    const end = this.worldToScreen(endWX, endWY);

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 2) return;

    const angle = Math.atan2(dy, dx);
    const headLen = Math.min(14, len * 0.3);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;

    // Shaft
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(
      end.x - headLen * Math.cos(angle - Math.PI / 6),
      end.y - headLen * Math.sin(angle - Math.PI / 6),
    );
    ctx.lineTo(
      end.x - headLen * Math.cos(angle + Math.PI / 6),
      end.y - headLen * Math.sin(angle + Math.PI / 6),
    );
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  /**
   * Draw a highlighted constraint line (thicker, colored) between two world positions.
   */
  drawHighlightedConstraint(
    ax: number, ay: number,
    bx: number, by: number,
    color = '#ff8800',
    lineWidth = 4,
  ): void {
    const ctx = this.ctx;
    const posA = this.worldToScreen(ax, ay);
    const posB = this.worldToScreen(bx, by);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(posA.x, posA.y);
    ctx.lineTo(posB.x, posB.y);
    ctx.stroke();
    ctx.restore();
  }
}
