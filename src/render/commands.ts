// The display list: a flat, backend-agnostic vocabulary of draw commands.
// The scene tree *projects* to DrawCommand[]; a backend (SVG/Canvas/Headless)
// consumes them. Pure data — no browser types — so the projection is testable.

import type { Transform } from '../core/math';

/** One color stop of a gradient. `offset` is 0..1 along the gradient axis. */
export interface GradientStop {
  offset: number;
  color: string;
}

/**
 * A gradient fill in OBJECT-BOUNDING-BOX space: all coordinates are 0..1
 * relative to the painted shape's bounds, so the same gradient reads correctly
 * on a shape of any size or position (matches SVG `gradientUnits`).
 */
export interface LinearGradient {
  type: 'linear';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stops: GradientStop[];
}

export interface RadialGradient {
  type: 'radial';
  /** Center + radius, all 0..1 in object-bounding-box space. */
  cx: number;
  cy: number;
  r: number;
  stops: GradientStop[];
}

export type Gradient = LinearGradient | RadialGradient;

/** A soft shadow / outer glow. `dx=dy=0` is a symmetric glow; offset = drop. */
export interface Shadow {
  color: string;
  /** Blur radius in local px. */
  blur: number;
  dx?: number;
  dy?: number;
}

export interface Paint {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  /** Round line joins/caps for organic shapes. */
  round?: boolean;
  /** A gradient fill; when present it overrides `fill` for the shape body. */
  gradient?: Gradient;
  /** A soft outer glow / drop shadow applied to the shape. */
  shadow?: Shadow;
  /**
   * Dash pattern for strokes, in local px (`[dash, gap, …]` — same as
   * Canvas2D `setLineDash` / SVG `stroke-dasharray`). Omit for solid lines.
   */
  lineDash?: number[];
  /**
   * Blend mode for compositing this command over what is already painted — the
   * Canvas2D/SVG-expressible intersection: `'multiply'` darkens (ambient base,
   * shadow quads), `'screen'` brightens (a light pool). Omit for normal
   * source-over. Consumed by the lighting run (see render/lightRun.ts); Canvas
   * maps it to `globalCompositeOperation`, SVG to `mix-blend-mode`.
   */
  blend?: 'multiply' | 'screen';
}

export type TextAlign = 'left' | 'center' | 'right';

interface Base extends Paint {
  /** World transform (design-space). */
  transform: Transform;
  /** Painter's-order key; ties broken by tree order. Default 0. */
  z: number;
  /**
   * Render layer: commands sort by layer FIRST, then z, then tree order.
   * Layer 0 (default) is the world; layer 1 is the screen-space overlay pass
   * (HUD, transitions) — set automatically for `Node.screenSpace` subtrees, so
   * overlays always paint above world content regardless of z values.
   */
  layer?: number;
  /**
   * Transient view chrome — a drifting popup, particle, or tween that lives for
   * a moment and is never something the player reads for meaning. Layout lints
   * (see verify/layout) skip these by default: a "+10" floating over a HUD label
   * is motion, not a collision. Set by cosmetic emitters (FloatingText/Particles).
   */
  transient?: boolean;
}

export interface RectCommand extends Base {
  kind: 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
  /** Corner radius. */
  r?: number;
}

export interface CircleCommand extends Base {
  kind: 'circle';
  cx: number;
  cy: number;
  radius: number;
}

export interface EllipseCommand extends Base {
  kind: 'ellipse';
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

/**
 * A circular arc (open stroke) or sector/pie (closed to the center).
 * Angles are radians, clockwise from +x (screen convention, y-down);
 * the arc runs from `start` to `end` in the clockwise direction.
 */
export interface ArcCommand extends Base {
  kind: 'arc';
  cx: number;
  cy: number;
  radius: number;
  start: number;
  end: number;
  /** When true, close through the center (a pie slice) so `fill` reads as a sector. */
  sector?: boolean;
}

export interface PolyCommand extends Base {
  kind: 'poly';
  /** Flat [x0,y0,x1,y1,…] in local space. */
  points: number[];
  closed: boolean;
}

export interface PathCommand extends Base {
  kind: 'path';
  /** SVG path data in local space. */
  d: string;
}

export interface TextCommand extends Base {
  kind: 'text';
  text: string;
  x: number;
  y: number;
  size: number;
  font?: string;
  align?: TextAlign;
  weight?: number;
}

export interface ImageCommand extends Base {
  kind: 'image';
  /** data: URI or path. */
  href: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export type DrawCommand =
  | RectCommand
  | CircleCommand
  | EllipseCommand
  | ArcCommand
  | PolyCommand
  | PathCommand
  | TextCommand
  | ImageCommand;

/**
 * Render-layer conventions. Commands sort by layer FIRST (see `sortCommands`),
 * so these are painter-order bands, not a fixed enum — a game may still use any
 * fractional layer. `LAYER_LIGHT` sits between world and HUD so the lighting run
 * multiplies over world content but never darkens the overlay pass.
 */
export const LAYER_WORLD = 0;
/** The lighting run: reserved band above the world, below the HUD. */
export const LAYER_LIGHT = 0.5;
/** Screen-space overlay pass (HUD, transitions) — set for `screenSpace` subtrees. */
export const LAYER_HUD = 1;

/** Stable painter's sort: by layer, then z, then original index (tree order) as tiebreak. */
export function sortCommands(cmds: DrawCommand[]): DrawCommand[] {
  return cmds
    .map((c, i) => [c, i] as const)
    .sort((a, b) => (a[0].layer ?? 0) - (b[0].layer ?? 0) || a[0].z - b[0].z || a[1] - b[1])
    .map(([c]) => c);
}
