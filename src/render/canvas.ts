// Canvas2D backend. For scenes with many primitives/particles where SVG's DOM
// node count would bite. Same display list, immediate-mode painting, DPR-aware.

import type { DrawCommand } from './commands';
import { clientToDesign, fitViewport, type Renderer, type RendererConfig, type Viewport } from './renderer';
import { drawToCanvas2D } from './canvas2d-core';
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
    drawToCanvas2D(this.ctx, commands, this.width, this.height, this.background, this.dpr);
  }

  get element(): HTMLCanvasElement {
    return this.canvas;
  }

  /** Map a pointer event's clientX/Y into design space (undoes the letterbox). */
  toDesign(clientX: number, clientY: number): Vec2 {
    return clientToDesign(this.canvas.getBoundingClientRect(), this.width, this.height, clientX, clientY);
  }

  viewport(): Viewport {
    return fitViewport(this.canvas.getBoundingClientRect(), this.width, this.height);
  }

  dispose(): void {
    this.canvas.remove();
  }
}
