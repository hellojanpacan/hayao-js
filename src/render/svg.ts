// SVG DOM backend. Resolution-independent (crisp at any DPR — the OHYG lesson:
// SVG sidesteps canvas text fuzz entirely) and DOM-inspectable, which makes
// browser verification trivial: querySelector IS the probe.

import type { DrawCommand } from './commands';
import { viewBoxToDesign, safeViewport, type Renderer, type RendererConfig, type Viewport, type ViewBox } from './renderer';
import { commandsToSVGInner } from './svgString';
import type { Vec2 } from '../core/math';

const SVGNS = 'http://www.w3.org/2000/svg';

// Per-instance clip-path ids so two SvgRenderers on one page never collide
// (Math.random is banned engine-wide; a module counter is deterministic enough
// for a DOM id and never enters the sim).
let clipSeq = 0;

export class SvgRenderer implements Renderer {
  readonly width: number;
  readonly height: number;
  private view: ViewBox;
  private background: string;
  private svg: SVGSVGElement;
  private bg: SVGRectElement;
  private layer: SVGGElement;
  private clipRect: SVGRectElement;

  constructor(config: RendererConfig) {
    this.width = config.width;
    this.height = config.height;
    this.view = { minX: 0, minY: 0, width: this.width, height: this.height };
    this.background = config.background ?? '#ffffff';

    this.svg = document.createElementNS(SVGNS, 'svg');
    this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    this.svg.style.width = '100%';
    this.svg.style.height = '100%';
    this.svg.style.display = 'block';

    // Clip everything to the view box so content authored outside it (scenery
    // spilling past a bleed margin, or anything beyond the safe box under
    // contain) never leaks into the letterbox — the fair play-field stays exact.
    // Canvas2D/WebGL clip for free (the buffer IS the view box); SVG needs this.
    const clipId = `hy-view-clip-${clipSeq++}`;
    const defs = document.createElementNS(SVGNS, 'defs');
    const clip = document.createElementNS(SVGNS, 'clipPath');
    clip.setAttribute('id', clipId);
    clip.setAttribute('clipPathUnits', 'userSpaceOnUse');
    this.clipRect = document.createElementNS(SVGNS, 'rect');
    clip.appendChild(this.clipRect);
    defs.appendChild(clip);
    this.svg.appendChild(defs);

    this.bg = document.createElementNS(SVGNS, 'rect');
    this.bg.setAttribute('fill', this.background);
    this.svg.appendChild(this.bg);

    this.layer = document.createElementNS(SVGNS, 'g');
    this.layer.setAttribute('clip-path', `url(#${clipId})`);
    this.svg.appendChild(this.layer);
    this.applyView();
  }

  /** Sync the SVG viewBox + background + clip rect to the current view box. */
  private applyView(): void {
    const v = this.view;
    this.svg.setAttribute('viewBox', `${v.minX} ${v.minY} ${v.width} ${v.height}`);
    for (const r of [this.bg, this.clipRect]) {
      r.setAttribute('x', String(v.minX));
      r.setAttribute('y', String(v.minY));
      r.setAttribute('width', String(v.width));
      r.setAttribute('height', String(v.height));
    }
  }

  setViewBox(view: ViewBox): void {
    this.view = { ...view };
    this.applyView();
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.svg);
  }

  draw(commands: DrawCommand[]): void {
    // Simple and correct for v0.1: rebuild the layer markup each frame. SVG is
    // retained-mode so the browser diffs efficiently; heavy scenes use Canvas2D.
    this.layer.innerHTML = commandsToSVGInner(commands);
  }

  setBackground(color: string): void {
    this.background = color;
    this.bg.setAttribute('fill', color);
  }

  get element(): SVGSVGElement {
    return this.svg;
  }

  /** Map a pointer event's clientX/Y into design space (undoes the letterbox/bleed). */
  toDesign(clientX: number, clientY: number): Vec2 {
    return viewBoxToDesign(this.svg.getBoundingClientRect(), this.view, clientX, clientY);
  }

  viewport(): Viewport {
    return safeViewport(this.svg.getBoundingClientRect(), this.view, this.width, this.height);
  }

  dispose(): void {
    this.svg.remove();
  }
}
