// The display list: a flat, backend-agnostic vocabulary of draw commands.
// The scene tree *projects* to DrawCommand[]; a backend (SVG/Canvas/Headless)
// consumes them. Pure data — no browser types — so the projection is testable.

import type { Transform } from '../core/math';

export interface Paint {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  /** Round line joins/caps for organic shapes. */
  round?: boolean;
}

export type TextAlign = 'left' | 'center' | 'right';

interface Base extends Paint {
  /** World transform (design-space). */
  transform: Transform;
  /** Painter's-order key; ties broken by tree order. Default 0. */
  z: number;
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
  | PolyCommand
  | PathCommand
  | TextCommand
  | ImageCommand;

/** Stable painter's sort: by z, then original index (tree order) as tiebreak. */
export function sortCommands(cmds: DrawCommand[]): DrawCommand[] {
  return cmds
    .map((c, i) => [c, i] as const)
    .sort((a, b) => a[0].z - b[0].z || a[1] - b[1])
    .map(([c]) => c);
}
