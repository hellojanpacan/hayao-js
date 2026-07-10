// Deterministic 2D math. Plain data + pure functions (no classes with hidden
// state) so everything serializes and hashes cleanly. Trig/hypot route through
// dmath so results are bit-identical across JS engines (netplay-safe).

import { dcos, dhypot, dsin } from './dmath';

export interface Vec2 {
  x: number;
  y: number;
}

export const vec2 = (x = 0, y = 0): Vec2 => ({ x, y });
export const vadd = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const vsub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
export const vscale = (a: Vec2, s: number): Vec2 => ({ x: a.x * s, y: a.y * s });
export const vdot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;
export const vlen = (a: Vec2): number => dhypot(a.x, a.y);
export const vdist = (a: Vec2, b: Vec2): number => dhypot(a.x - b.x, a.y - b.y);
export function vnorm(a: Vec2): Vec2 {
  const l = vlen(a);
  return l === 0 ? { x: 0, y: 0 } : { x: a.x / l, y: a.y / l };
}

export const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const invLerp = (a: number, b: number, v: number): number => (a === b ? 0 : (v - a) / (b - a));
export const remap = (v: number, a0: number, a1: number, b0: number, b1: number): number =>
  lerp(b0, b1, invLerp(a0, a1, v));

/** Hermite smoothstep: 0 below `edge0`, 1 above `edge1`, eased in between. */
export const smoothstep = (edge0: number, edge1: number, v: number): number => {
  const t = clamp(edge0 === edge1 ? (v < edge0 ? 0 : 1) : invLerp(edge0, edge1, v), 0, 1);
  return t * t * (3 - 2 * t);
};

export const TAU = Math.PI * 2;
export const deg2rad = (d: number): number => (d * Math.PI) / 180;
export const rad2deg = (r: number): number => (r * 180) / Math.PI;

/** Wrap `v` into [lo, hi) — the modular clamp for toroidal worlds and angle bins. */
export function wrap(v: number, lo: number, hi: number): number {
  const size = hi - lo;
  if (size <= 0) return lo;
  const m = (v - lo) % size;
  return m < 0 ? m + size + lo : m + lo;
}

/**
 * Signed shortest difference `b − a` on a wrapping axis of the given `size`
 * (screen-wrap distance): result ∈ [−size/2, size/2).
 */
export function distanceWrap(a: number, b: number, size: number): number {
  const d = (b - a) % size;
  return wrap(d, -size / 2, size / 2);
}

/** Signed shortest angular difference `b − a`, in (−π, π]. */
export function angleDelta(a: number, b: number): number {
  return -distanceWrap(b, a, TAU);
}

/** Lerp between angles along the SHORTEST arc (no 350°→10° long-way spin). */
export function lerpAngle(a: number, b: number, t: number): number {
  return a + angleDelta(a, b) * t;
}

export type WaveKind = 'sine' | 'triangle' | 'square' | 'saw';

/**
 * A periodic wave of `time`, `frequency` cycles per second, in [−1, 1] — the
 * idle-bob / blink / hover primitive. Phase convention: sine and triangle
 * cross zero rising at t = 0; square starts its high half; saw rises from −1
 * over the whole cycle. Deterministic (sine routes through dsin), so it is
 * safe inside the sim.
 */
export function oscillate(time: number, frequency = 1, wave: WaveKind = 'sine'): number {
  const phase = wrap(time * frequency, 0, 1);
  switch (wave) {
    case 'sine':
      return dsin(phase * TAU);
    case 'triangle':
      return phase < 0.25 ? phase * 4 : phase < 0.75 ? 2 - phase * 4 : phase * 4 - 4;
    case 'square':
      return phase < 0.5 ? 1 : -1;
    case 'saw':
      return phase * 2 - 1;
  }
}

/**
 * Seconds → a clock string: `"1:05"`, `"12:07"`, or `"1:02:33"` past an hour.
 * Negative or non-finite input reads `"0:00"`. For HUD timers and results screens.
 */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const total = Math.floor(seconds);
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** Axis-aligned rectangle. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function rectContains(r: Rect, p: Vec2): boolean {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** 2D affine transform as a 6-value matrix [a b c d e f] (like SVG/Canvas). */
export interface Transform {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

export const IDENTITY: Transform = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

export function composeTransform(m: Transform, n: Transform): Transform {
  return {
    a: m.a * n.a + m.c * n.b,
    b: m.b * n.a + m.d * n.b,
    c: m.a * n.c + m.c * n.d,
    d: m.b * n.c + m.d * n.d,
    e: m.a * n.e + m.c * n.f + m.e,
    f: m.b * n.e + m.d * n.f + m.f,
  };
}

/** Build a transform from position, rotation (radians), scale. */
export function makeTransform(pos: Vec2, rotation: number, scale: Vec2): Transform {
  const cos = dcos(rotation);
  const sin = dsin(rotation);
  return {
    a: cos * scale.x,
    b: sin * scale.x,
    c: -sin * scale.y,
    d: cos * scale.y,
    e: pos.x,
    f: pos.y,
  };
}

export function applyTransform(m: Transform, p: Vec2): Vec2 {
  return { x: m.a * p.x + m.c * p.y + m.e, y: m.b * p.x + m.d * p.y + m.f };
}

/** Invert an affine transform (returns identity if singular). */
export function invertTransform(m: Transform): Transform {
  const det = m.a * m.d - m.b * m.c;
  if (det === 0) return { ...IDENTITY };
  const id = 1 / det;
  return {
    a: m.d * id,
    b: -m.b * id,
    c: -m.c * id,
    d: m.a * id,
    e: (m.c * m.f - m.d * m.e) * id,
    f: (m.b * m.e - m.a * m.f) * id,
  };
}
