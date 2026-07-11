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
  /**
   * Set the painted design region (for `fit: 'bleed'`). The authored safe box
   * (`width×height`) is unchanged — only the surrounding, scenery-bearing margin
   * grows/shrinks. Default view is `{ minX: 0, minY: 0, width, height }`. No-op on
   * headless backends.
   */
  setViewBox?(view: ViewBox): void;
  dispose?(): void;
}

/**
 * The drawn area of the authored design box (the "safe box") within the mount:
 * offset + size in host px, plus design→px scale. Under `fit: 'contain'` this IS
 * the letterboxed picture; under `fit: 'bleed'` it is the guaranteed-visible safe
 * box centered inside a larger, scenery-filled view. Host UI (touch controls,
 * DOM HUD) anchors here so it always tracks the play-field, never the bars/margins.
 */
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
 * The design-space region a backend actually paints. Under `fit: 'contain'` this
 * equals the authored box (`{ minX: 0, minY: 0, width, height }`); under
 * `fit: 'bleed'` it grows in the deficient axis so its aspect matches the
 * container, with the authored box centered (so `minX`/`minY` go negative and the
 * revealed margins carry cosmetic scenery — never gameplay). `world.width/height`
 * stay the authored box, so the camera and determinism are untouched.
 */
export interface ViewBox {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

/** Object-fit-contain a `vbW×vbH` picture into `rect`: the scale + centering offset. */
function containFit(rect: { width: number; height: number }, vbW: number, vbH: number): { scale: number; offX: number; offY: number } {
  const scale = Math.min(rect.width / vbW, rect.height / vbH) || 1;
  return { scale, offX: (rect.width - vbW * scale) / 2, offY: (rect.height - vbH * scale) / 2 };
}

/**
 * Undo a centered uniform-fit (`object-fit: contain` / SVG `xMidYMid meet`) for a
 * (possibly offset) view box: map a client pixel inside `rect` back to design
 * coordinates. Shared by every DOM backend so the letterbox math lives in one place.
 */
export function viewBoxToDesign(rect: { left: number; top: number; width: number; height: number }, view: ViewBox, clientX: number, clientY: number): Vec2 {
  const { scale, offX, offY } = containFit(rect, view.width, view.height);
  return {
    x: view.minX + (clientX - rect.left - offX) / scale,
    y: view.minY + (clientY - rect.top - offY) / scale,
  };
}

/**
 * The on-screen rect of the authored safe box `safeW×safeH` inside an element of
 * size `rect` painting `view` — the inverse framing of `viewBoxToDesign`, in
 * element-local px. Shared by every DOM backend's `viewport()`.
 */
export function safeViewport(rect: { width: number; height: number }, view: ViewBox, safeW: number, safeH: number): Viewport {
  const { scale, offX, offY } = containFit(rect, view.width, view.height);
  return {
    x: offX + (0 - view.minX) * scale,
    y: offY + (0 - view.minY) * scale,
    width: safeW * scale,
    height: safeH * scale,
    scale,
  };
}

/** Back-compat contain-fit inverse: the safe box sits at the origin and IS the view. */
export function clientToDesign(rect: { left: number; top: number; width: number; height: number }, width: number, height: number, clientX: number, clientY: number): Vec2 {
  return viewBoxToDesign(rect, { minX: 0, minY: 0, width, height }, clientX, clientY);
}

/** Back-compat contain-fit framing: the letterboxed rect of a design box in `rect`. */
export function fitViewport(rect: { width: number; height: number }, width: number, height: number): Viewport {
  return safeViewport(rect, { minX: 0, minY: 0, width, height }, width, height);
}

/**
 * How far `fit: 'bleed'` may stretch one axis past the safe box before it gives
 * up and letterboxes the remainder — a phone in the "wrong" orientation for a
 * game should show tasteful margins, not a 3× scenery desert. 1.6 covers the real
 * spread (16:9 ↔ 4:3 ↔ 9:16-ish) while capping the pathological cases.
 */
export const BLEED_MAX = 1.6;

/**
 * The paint region for `fit: 'bleed'`: grow the deficient axis of the safe box
 * until the view's aspect matches the container (capped at `maxScale`), keeping
 * the safe box centered. When the container is more extreme than the cap, the
 * view stops growing and `object-fit: contain` letterboxes the small remainder.
 */
export function bleedViewBox(containerW: number, containerH: number, safeW: number, safeH: number, maxScale: number = BLEED_MAX): ViewBox {
  const containerAspect = containerW / containerH || 1;
  const safeAspect = safeW / safeH;
  let vbW = safeW;
  let vbH = safeH;
  if (containerAspect > safeAspect) {
    vbW = Math.min(safeW * maxScale, safeH * containerAspect);
  } else if (containerAspect < safeAspect) {
    vbH = Math.min(safeH * maxScale, safeW / containerAspect);
  }
  // `|| 0` collapses a `-0` (no growth on that axis) to `+0` so the SVG viewBox
  // attribute and equality checks stay clean.
  return { minX: -(vbW - safeW) / 2 || 0, minY: -(vbH - safeH) / 2 || 0, width: vbW, height: vbH };
}
