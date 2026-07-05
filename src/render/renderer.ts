import type { DrawCommand } from './commands';
import type { Vec2 } from '../core/math';

/** A backend that paints a display list into a host (DOM, canvas, or nothing). */
export interface Renderer {
  readonly width: number;
  readonly height: number;
  /** Paint one frame. */
  draw(commands: DrawCommand[]): void;
  /** Attach to a DOM parent (browser backends). */
  mount?(parent: HTMLElement): void;
  /** The mounted DOM node (canvas or svg), for attaching pointer listeners. */
  readonly element?: HTMLElement | SVGElement;
  /**
   * Invert the display transform: a browser pointer event's clientX/clientY →
   * design-space coordinates. The backend owns the letterbox (`object-fit:
   * contain` / `preserveAspectRatio`) and DPR, so it's the only place that can
   * undo them correctly. Returns design coords even outside the letterbox
   * (values fall outside 0..width/height there).
   */
  toDesign?(clientX: number, clientY: number): Vec2;
  /**
   * The drawn (letterboxed) design area within the mount, in mount-local px:
   * `{ x, y, width, height, scale }`. Host-drawn UI (floating touch controls,
   * DOM HUD) anchors to this rect instead of re-deriving the `object-fit:
   * contain` math the backend already does for `toDesign`. Undefined for
   * headless backends.
   */
  viewport?(): Viewport;
  dispose?(): void;
}

/** The drawn area within the mount: offset + size in host px, plus design→px scale. */
export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export interface RendererConfig {
  width: number;
  height: number;
  background?: string;
}

/**
 * Undo a centered uniform-fit (`object-fit: contain` / SVG `xMidYMid meet`):
 * map a client pixel inside `rect` back to the design box `width×height`. Shared
 * by every DOM backend so the letterbox math lives in exactly one place.
 */
export function clientToDesign(rect: { left: number; top: number; width: number; height: number }, width: number, height: number, clientX: number, clientY: number): Vec2 {
  const scale = Math.min(rect.width / width, rect.height / height) || 1;
  const offsetX = (rect.width - width * scale) / 2;
  const offsetY = (rect.height - height * scale) / 2;
  return {
    x: (clientX - rect.left - offsetX) / scale,
    y: (clientY - rect.top - offsetY) / scale,
  };
}

/**
 * The centered uniform-fit rect for a design box inside an element of size
 * `rect` — the inverse framing of `clientToDesign`, in element-local px. Shared
 * by every DOM backend's `viewport()`.
 */
export function fitViewport(rect: { width: number; height: number }, width: number, height: number): Viewport {
  const scale = Math.min(rect.width / width, rect.height / height) || 1;
  return {
    x: (rect.width - width * scale) / 2,
    y: (rect.height - height * scale) / 2,
    width: width * scale,
    height: height * scale,
    scale,
  };
}
