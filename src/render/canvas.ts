// Canvas2D backend. For scenes with many primitives/particles where SVG's DOM
// node count would bite. Same display list, immediate-mode painting, DPR-aware.

import type { DrawCommand } from './commands';
import { viewBoxToDesign, safeViewport, type Renderer, type RendererConfig, type Viewport, type ViewBox } from './renderer';
import { drawToCanvas2D } from './canvas2d-core';
import type { Vec2 } from '../core/math';

export class Canvas2DRenderer implements Renderer {
  readonly width: number;
  readonly height: number;
  private view: ViewBox;
  private background: string;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;

  constructor(config: RendererConfig) {
    this.width = config.width;
    this.height = config.height;
    this.view = { minX: 0, minY: 0, width: this.width, height: this.height };
    this.background = config.background ?? '#ffffff';
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    // Letterbox, never stretch or crop: the design space must arrive intact
    // (a stretched canvas hides gameplay at the edges on off-ratio windows).
    // Under `fit: 'bleed'` the buffer's aspect matches the container, so contain
    // fills it with no bars — the extra buffer is the scenery margin.
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
    this.canvas.width = Math.round(this.view.width * this.dpr);
    this.canvas.height = Math.round(this.view.height * this.dpr);
  }

  setViewBox(view: ViewBox): void {
    this.view = { ...view };
    this.resize();
  }

  draw(commands: DrawCommand[]): void {
    drawToCanvas2D(this.ctx, commands, this.view.width, this.view.height, this.background, this.dpr, this.view.minX, this.view.minY);
  }

  get element(): HTMLCanvasElement {
    return this.canvas;
  }

  /** Map a pointer event's clientX/Y into design space (undoes the letterbox/bleed). */
  toDesign(clientX: number, clientY: number): Vec2 {
    return viewBoxToDesign(this.canvas.getBoundingClientRect(), this.view, clientX, clientY);
  }

  viewport(): Viewport {
    return safeViewport(this.canvas.getBoundingClientRect(), this.view, this.width, this.height);
  }

  dispose(): void {
    this.canvas.remove();
  }
}
