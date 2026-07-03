// The headless backend: records the last display list instead of painting it.
// Tests assert on the commands directly; scripts turn them into a vector
// screenshot via renderToSVGString. This is why a hayao game is testable with
// zero browser — the renderer is just a data sink.

import type { DrawCommand } from './commands';
import type { Renderer, RendererConfig } from './renderer';
import { renderToSVGString } from './svgString';

export class HeadlessRenderer implements Renderer {
  readonly width: number;
  readonly height: number;
  private background: string;
  private last: DrawCommand[] = [];
  frameCount = 0;

  constructor(config: RendererConfig) {
    this.width = config.width;
    this.height = config.height;
    this.background = config.background ?? '#ffffff';
  }

  draw(commands: DrawCommand[]): void {
    this.last = commands;
    this.frameCount++;
  }

  /** The most recently drawn display list. */
  get commands(): DrawCommand[] {
    return this.last;
  }

  /** Count commands of a given kind (handy for assertions). */
  count(kind: DrawCommand['kind']): number {
    return this.last.filter((c) => c.kind === kind).length;
  }

  /** A vector screenshot of the last frame. */
  toSVGString(): string {
    return renderToSVGString(this.last, this.width, this.height, this.background);
  }
}
