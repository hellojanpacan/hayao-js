import type { DrawCommand } from './commands';

/** A backend that paints a display list into a host (DOM, canvas, or nothing). */
export interface Renderer {
  readonly width: number;
  readonly height: number;
  /** Paint one frame. */
  draw(commands: DrawCommand[]): void;
  /** Attach to a DOM parent (browser backends). */
  mount?(parent: HTMLElement): void;
  dispose?(): void;
}

export interface RendererConfig {
  width: number;
  height: number;
  background?: string;
}
