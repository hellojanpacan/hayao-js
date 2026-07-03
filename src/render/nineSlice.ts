// 9-slice panels: one scalable UI frame from a handful of params. A rectangle is
// split into a 3×3 grid — the four corners keep a fixed size while the edges
// stretch along one axis and the center fills — so a frame drawn at any size
// keeps crisp, undistorted corners. Pure: it just emits DrawCommands into a
// display list, so it renders headlessly and never touches game state. Colour the
// regions differently (light top/left, dark bottom/right) for an instant bevel.

import { IDENTITY, type Rect, type Transform } from '../core/math';
import type { DrawCommand } from './commands';

export interface NineSliceStyle {
  /** Corner size in px — the slice inset that never stretches. */
  border: number;
  /** Center fill (the panel body). */
  fill?: string;
  /** Edge fill (top/bottom/left/right strips). Defaults to `fill`. */
  edge?: string;
  /** Corner fill (the four fixed squares). Defaults to `edge`. */
  corner?: string;
  /** Optional bevel: lighten the top/left, darken the bottom/right. */
  highlight?: string;
  shadow?: string;
  /** Outline stroke drawn around the whole frame. */
  stroke?: string;
  strokeWidth?: number;
  /** Outer corner radius applied to the four corner squares. */
  radius?: number;
}

/**
 * Emit the draw commands for a 9-slice panel filling `rect`. Regions are pushed
 * back-to-front (center → edges → corners) at painter key `z`, transformed by
 * `transform` (screen space by default). Border is clamped so it never exceeds
 * half the smaller side, keeping the grid valid at any size.
 */
export function nineSlice(rect: Rect, style: NineSliceStyle, z = 0, transform: Transform = IDENTITY): DrawCommand[] {
  const b = Math.max(0, Math.min(style.border, rect.w / 2, rect.h / 2));
  const fill = style.fill ?? '#fbf6ea';
  const edge = style.edge ?? fill;
  const corner = style.corner ?? edge;
  const out: DrawCommand[] = [];
  const x0 = rect.x;
  const x1 = rect.x + b;
  const x2 = rect.x + rect.w - b;
  const y0 = rect.y;
  const y1 = rect.y + b;
  const y2 = rect.y + rect.h - b;
  const iw = rect.w - 2 * b; // inner (stretched) width
  const ih = rect.h - 2 * b; // inner (stretched) height

  const push = (x: number, y: number, w: number, h: number, f: string, r?: number): void => {
    if (w <= 0 || h <= 0) return;
    out.push({ kind: 'rect', x, y, w, h, r, fill: f, transform, z });
  };

  // Center + the four stretchable edges.
  push(x1, y1, iw, ih, fill);
  push(x1, y0, iw, b, style.highlight ?? edge); // top
  push(x1, y2, iw, b, style.shadow ?? edge); // bottom
  push(x0, y1, b, ih, style.highlight ?? edge); // left
  push(x2, y1, b, ih, style.shadow ?? edge); // right

  // Four fixed corners (drawn last so their radius reads clean over the edges).
  const r = style.radius;
  push(x0, y0, b, b, corner, r);
  push(x2, y0, b, b, corner, r);
  push(x0, y2, b, b, corner, r);
  push(x2, y2, b, b, corner, r);

  // Optional outline around the whole frame.
  if (style.stroke) {
    out.push({
      kind: 'rect',
      x: rect.x,
      y: rect.y,
      w: rect.w,
      h: rect.h,
      r: style.radius,
      fill: 'none',
      stroke: style.stroke,
      strokeWidth: style.strokeWidth ?? 2,
      transform,
      z: z + 0.001,
    });
  }
  return out;
}

/** Ready-made frame looks. */
export const PANEL_PRESETS = {
  parchment: (): NineSliceStyle => ({ border: 10, fill: '#fbf6ea', edge: '#efe4c8', corner: '#e2d3a8', highlight: '#fdfaf0', shadow: '#d9c79c', stroke: '#b8a06a', strokeWidth: 2, radius: 4 }),
  slate: (): NineSliceStyle => ({ border: 8, fill: '#2c3040', edge: '#363c4f', corner: '#454c63', highlight: '#4a5268', shadow: '#20242f', stroke: '#151821', strokeWidth: 2, radius: 3 }),
} as const;
