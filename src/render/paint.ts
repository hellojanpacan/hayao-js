// Paint builders + backend resolution for gradients and soft shadows/glows.
// The display-list vocabulary (commands.ts) carries gradients/shadows as pure
// data in OBJECT-BOUNDING-BOX space (all coords 0..1 of the painted shape's
// bounds); this module turns that data into SVG <defs> or Canvas paint objects.
//
// COSMETIC: these describe *look*, never state. Used on cosmetic nodes they stay
// out of world.hash(); on canonical nodes the plain-JSON descriptors hash
// deterministically like any other paint prop. No wall-clock, no Math.random.

import { dcos, dsin } from '../core/dmath';
import type {
  DrawCommand,
  Gradient,
  GradientStop,
  LinearGradient,
  RadialGradient,
  Shadow,
} from './commands';

const n = (v: number): string => (Number.isInteger(v) ? String(v) : (Math.round(v * 1000) / 1000).toString());

type StopInput = string | GradientStop;

/** Colors → evenly-spaced stops; explicit `{offset,color}` pass through. */
function toStops(stops: readonly StopInput[]): GradientStop[] {
  const last = Math.max(1, stops.length - 1);
  return stops.map((s, i) => (typeof s === 'string' ? { offset: i / last, color: s } : s));
}

/**
 * A linear gradient by angle in degrees (0 = left→right, 90 = top→bottom).
 * Stops are colors (auto-spaced) or explicit `{offset, color}`.
 */
export function linearGradient(stops: readonly StopInput[], angleDeg = 90): LinearGradient {
  const a = (angleDeg * Math.PI) / 180;
  const dx = dcos(a) * 0.5;
  const dy = dsin(a) * 0.5;
  return { type: 'linear', x1: 0.5 - dx, y1: 0.5 - dy, x2: 0.5 + dx, y2: 0.5 + dy, stops: toStops(stops) };
}

/** A radial gradient centered in the shape by default (inner stop first). */
export function radialGradient(
  stops: readonly StopInput[],
  opts: { cx?: number; cy?: number; r?: number } = {},
): RadialGradient {
  return { type: 'radial', cx: opts.cx ?? 0.5, cy: opts.cy ?? 0.5, r: opts.r ?? 0.5, stops: toStops(stops) };
}

/** A symmetric soft outer glow. */
export function glow(color: string, blur: number): Shadow {
  return { color, blur };
}

/** A soft drop shadow, offset by (dx,dy). */
export function dropShadow(color: string, blur: number, dx = 0, dy = 0): Shadow {
  return { color, blur, dx, dy };
}

// ── SVG <defs> emission ────────────────────────────────────────────
function stopMarkup(stop: GradientStop): string {
  // A stop color may carry its own alpha as `rgba(...)`; SVG needs it split off,
  // but for our hex/rgb palette we simply pass stop-color through.
  return `<stop offset="${n(stop.offset)}" stop-color="${stop.color}"/>`;
}

export function gradientDef(g: Gradient, id: string): string {
  const stops = g.stops.map(stopMarkup).join('');
  if (g.type === 'linear') {
    return `<linearGradient id="${id}" x1="${n(g.x1)}" y1="${n(g.y1)}" x2="${n(g.x2)}" y2="${n(g.y2)}">${stops}</linearGradient>`;
  }
  return `<radialGradient id="${id}" cx="${n(g.cx)}" cy="${n(g.cy)}" r="${n(g.r)}">${stops}</radialGradient>`;
}

export function shadowDef(s: Shadow, id: string): string {
  // Generous region so wide blurs aren't clipped by the default filter box.
  return (
    `<filter id="${id}" x="-60%" y="-60%" width="220%" height="220%">` +
    `<feDropShadow dx="${n(s.dx ?? 0)}" dy="${n(s.dy ?? 0)}" stdDeviation="${n(s.blur / 2)}" flood-color="${s.color}"/>` +
    `</filter>`
  );
}

// ── Canvas resolution ──────────────────────────────────────────────
export interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Local-space bounding box of a shape command (null for paths/text/image). */
export function shapeBBox(c: DrawCommand): BBox | null {
  switch (c.kind) {
    case 'rect':
      return { x: c.x, y: c.y, w: c.w, h: c.h };
    case 'circle':
      return { x: c.cx - c.radius, y: c.cy - c.radius, w: c.radius * 2, h: c.radius * 2 };
    case 'ellipse':
      return { x: c.cx - c.rx, y: c.cy - c.ry, w: c.rx * 2, h: c.ry * 2 };
    case 'arc':
      // The full circle the arc lies on — good enough for gradient mapping.
      return { x: c.cx - c.radius, y: c.cy - c.radius, w: c.radius * 2, h: c.radius * 2 };
    case 'poly': {
      if (c.points.length < 2) return null;
      let minX = c.points[0];
      let maxX = c.points[0];
      let minY = c.points[1];
      let maxY = c.points[1];
      for (let i = 0; i < c.points.length; i += 2) {
        minX = Math.min(minX, c.points[i]);
        maxX = Math.max(maxX, c.points[i]);
        minY = Math.min(minY, c.points[i + 1]);
        maxY = Math.max(maxY, c.points[i + 1]);
      }
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }
    default:
      return null;
  }
}

// ── Renderer robustness ────────────────────────────────────────────
// A malformed DrawCommand (NaN position from a physics blowup, a negative
// radius from an over-eager tween) must never kill the render loop. Backends
// call invalidCommandReason() per command and skip+warn instead of throwing
// (triage: ptg 34). Valid commands cost only a few Number.isFinite calls —
// no allocation on the hot path.

/** Why a command's geometry is unpaintable, or null when it's fine. */
export function invalidCommandReason(c: DrawCommand): string | null {
  switch (c.kind) {
    case 'rect':
      if (!Number.isFinite(c.x) || !Number.isFinite(c.y) || !Number.isFinite(c.w) || !Number.isFinite(c.h))
        return 'non-finite x/y/w/h';
      return null;
    case 'circle':
      if (!Number.isFinite(c.cx) || !Number.isFinite(c.cy)) return 'non-finite center';
      if (!Number.isFinite(c.radius)) return 'non-finite radius';
      if (c.radius < 0) return 'negative radius';
      return null;
    case 'ellipse':
      if (!Number.isFinite(c.cx) || !Number.isFinite(c.cy)) return 'non-finite center';
      if (!Number.isFinite(c.rx) || !Number.isFinite(c.ry)) return 'non-finite rx/ry';
      if (c.rx < 0 || c.ry < 0) return 'negative rx/ry';
      return null;
    case 'arc':
      if (!Number.isFinite(c.cx) || !Number.isFinite(c.cy)) return 'non-finite center';
      if (!Number.isFinite(c.radius)) return 'non-finite radius';
      if (c.radius < 0) return 'negative radius';
      if (!Number.isFinite(c.start) || !Number.isFinite(c.end)) return 'non-finite start/end';
      return null;
    default:
      return null;
  }
}

const warnedCommands = new Set<string>();

/**
 * console.warn once per (kind + reason) — a bad value animating every frame
 * logs a single line, not sixty a second. `detail` (the offending command or
 * error) is passed through so the console shows the actual value.
 */
export function warnCommandOnce(kind: string, reason: string, detail?: unknown): void {
  const key = `${kind}:${reason}`;
  if (warnedCommands.has(key)) return;
  warnedCommands.add(key);
  console.warn(`hayao/render: skipped '${kind}' command — ${reason}`, detail);
}

/** Build a Canvas gradient mapped from object-bounding-box space into `bbox`. */
export function canvasGradient(
  ctx: { createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient; createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): CanvasGradient },
  g: Gradient,
  bbox: BBox,
): CanvasGradient {
  const px = (u: number): number => bbox.x + u * bbox.w;
  const py = (v: number): number => bbox.y + v * bbox.h;
  let grad: CanvasGradient;
  if (g.type === 'linear') {
    grad = ctx.createLinearGradient(px(g.x1), py(g.y1), px(g.x2), py(g.y2));
  } else {
    // Map the unit radius by the larger box extent so it reads round-ish.
    const r = g.r * Math.max(bbox.w, bbox.h);
    grad = ctx.createRadialGradient(px(g.cx), py(g.cy), 0, px(g.cx), py(g.cy), r);
  }
  for (const s of g.stops) grad.addColorStop(Math.max(0, Math.min(1, s.offset)), s.color);
  return grad;
}
