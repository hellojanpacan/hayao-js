// Canvas2D backend. For scenes with many primitives/particles where SVG's DOM
// node count would bite. Same display list, immediate-mode painting, DPR-aware.

import { sortCommands, type DrawCommand, type Paint } from './commands';
import { canvasGradient, shapeBBox } from './paint';
import { clientToDesign, type Renderer, type RendererConfig } from './renderer';
import type { Vec2 } from '../core/math';

export class Canvas2DRenderer implements Renderer {
  readonly width: number;
  readonly height: number;
  private background: string;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;

  constructor(config: RendererConfig) {
    this.width = config.width;
    this.height = config.height;
    this.background = config.background ?? '#ffffff';
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    // Letterbox, never stretch or crop: the design space must arrive intact
    // (a stretched canvas hides gameplay at the edges on off-ratio windows).
    this.canvas.style.objectFit = 'contain';
    this.canvas.style.display = 'block';
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('hayao: 2D canvas context unavailable');
    this.ctx = ctx;
    this.resize();
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.canvas);
    this.resize();
  }

  private resize(): void {
    this.dpr = Math.min(3, globalThis.devicePixelRatio || 1);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
  }

  draw(commands: DrawCommand[]): void {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = this.background;
    ctx.fillRect(0, 0, this.width, this.height);

    for (const c of sortCommands(commands)) {
      ctx.save();
      const t = c.transform;
      ctx.transform(t.a, t.b, t.c, t.d, t.e, t.f);
      ctx.globalAlpha = (c as Paint).opacity ?? 1;
      const sh = (c as Paint).shadow;
      if (sh) {
        ctx.shadowColor = sh.color;
        ctx.shadowBlur = sh.blur;
        ctx.shadowOffsetX = sh.dx ?? 0;
        ctx.shadowOffsetY = sh.dy ?? 0;
      }
      this.paint(ctx, c);
      ctx.restore();
    }
  }

  /** Resolve a fill: a gradient (mapped to the shape's bbox) or a solid color. */
  private fillFor(ctx: CanvasRenderingContext2D, c: DrawCommand): string | CanvasGradient | undefined {
    const p = c as Paint;
    if (p.gradient) {
      const bbox = shapeBBox(c);
      if (bbox && bbox.w > 0 && bbox.h > 0) return canvasGradient(ctx, p.gradient, bbox);
      const stops = p.gradient.stops; // path/degenerate box → fall back to last stop
      return stops.length ? stops[stops.length - 1].color : p.fill;
    }
    return p.fill;
  }

  private stroke(ctx: CanvasRenderingContext2D, c: DrawCommand): void {
    const fill = this.fillFor(ctx, c);
    if (fill && fill !== 'none') {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (c.stroke) {
      ctx.strokeStyle = c.stroke;
      ctx.lineWidth = c.strokeWidth ?? 1;
      if (c.round) {
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
      }
      ctx.stroke();
    }
  }

  private paint(ctx: CanvasRenderingContext2D, c: DrawCommand): void {
    switch (c.kind) {
      case 'rect':
        ctx.beginPath();
        if (c.r) this.roundRect(ctx, c.x, c.y, c.w, c.h, c.r);
        else ctx.rect(c.x, c.y, c.w, c.h);
        this.stroke(ctx, c);
        break;
      case 'circle':
        ctx.beginPath();
        ctx.arc(c.cx, c.cy, c.radius, 0, Math.PI * 2);
        this.stroke(ctx, c);
        break;
      case 'poly':
        ctx.beginPath();
        for (let i = 0; i < c.points.length; i += 2) {
          if (i === 0) ctx.moveTo(c.points[i], c.points[i + 1]);
          else ctx.lineTo(c.points[i], c.points[i + 1]);
        }
        if (c.closed) ctx.closePath();
        this.stroke(ctx, c);
        break;
      case 'path':
        {
          const p = new Path2D(c.d);
          const fill = this.fillFor(ctx, c);
          if (fill && fill !== 'none') {
            ctx.fillStyle = fill;
            ctx.fill(p);
          }
          if (c.stroke) {
            ctx.strokeStyle = c.stroke;
            ctx.lineWidth = c.strokeWidth ?? 1;
            if (c.round) {
              ctx.lineJoin = 'round';
              ctx.lineCap = 'round';
            }
            ctx.stroke(p);
          }
        }
        break;
      case 'text':
        ctx.font = `${c.weight ?? 400} ${c.size}px ${c.font ?? 'sans-serif'}`;
        ctx.textAlign = c.align ?? 'left';
        ctx.textBaseline = 'middle';
        // Stroke first, fill on top — the outline frames the glyph instead of
        // eating into it (matches SVG's paint-order="stroke"). Text carries
        // Paint, so an explicit `stroke` now renders instead of being dropped.
        if (c.stroke) {
          ctx.strokeStyle = c.stroke;
          ctx.lineWidth = c.strokeWidth ?? 1;
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.strokeText(c.text, c.x, c.y);
        }
        ctx.fillStyle = c.fill ?? '#000';
        ctx.fillText(c.text, c.x, c.y);
        break;
      case 'image':
        break; // images loaded async; omitted in v0.1 canvas backend
    }
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  get element(): HTMLCanvasElement {
    return this.canvas;
  }

  /** Map a pointer event's clientX/Y into design space (undoes the letterbox). */
  toDesign(clientX: number, clientY: number): Vec2 {
    return clientToDesign(this.canvas.getBoundingClientRect(), this.width, this.height, clientX, clientY);
  }

  dispose(): void {
    this.canvas.remove();
  }
}
