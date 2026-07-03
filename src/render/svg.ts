// SVG DOM backend. Resolution-independent (crisp at any DPR — the OHYG lesson:
// SVG sidesteps canvas text fuzz entirely) and DOM-inspectable, which makes
// browser verification trivial: querySelector IS the probe.

import type { DrawCommand } from './commands';
import type { Renderer, RendererConfig } from './renderer';
import { commandsToSVGInner } from './svgString';

const SVGNS = 'http://www.w3.org/2000/svg';

export class SvgRenderer implements Renderer {
  readonly width: number;
  readonly height: number;
  private background: string;
  private svg: SVGSVGElement;
  private bg: SVGRectElement;
  private layer: SVGGElement;

  constructor(config: RendererConfig) {
    this.width = config.width;
    this.height = config.height;
    this.background = config.background ?? '#ffffff';

    this.svg = document.createElementNS(SVGNS, 'svg');
    this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
    this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    this.svg.style.width = '100%';
    this.svg.style.height = '100%';
    this.svg.style.display = 'block';

    this.bg = document.createElementNS(SVGNS, 'rect');
    this.bg.setAttribute('x', '0');
    this.bg.setAttribute('y', '0');
    this.bg.setAttribute('width', String(this.width));
    this.bg.setAttribute('height', String(this.height));
    this.bg.setAttribute('fill', this.background);
    this.svg.appendChild(this.bg);

    this.layer = document.createElementNS(SVGNS, 'g');
    this.svg.appendChild(this.layer);
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

  dispose(): void {
    this.svg.remove();
  }
}
