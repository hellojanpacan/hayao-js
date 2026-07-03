// Pure traversal rules for Lanternway — no engine, scene, or render imports.
// A lantern-bearer crosses a field far larger than the screen to reach a distant
// shrine. The canonical state is just the bearer's position (a point) plus the
// reached flag; the scene tree and the camera are a view over it. Because the
// world is 3200×1800 and the viewport is 1280×720, actually arriving proves the
// camera scrolled — you cannot see the goal from the start.

import { dhypot } from '@hayao';

export interface Pt {
  x: number;
  y: number;
}

/** The playfield, deliberately much larger than any viewport. */
export const WORLD = { w: 3200, h: 1800 };
export const START: Pt = { x: 220, y: 240 };
export const GOAL: Pt = { x: 2980, y: 1600 };

/** Movement feel. Fixed-step integration keeps it deterministic. */
export const SPEED = 360; // world px per second
export const BEARER_R = 20; // sprite radius, also the wall inset
export const GOAL_R = 80; // how close counts as "reached"

export const dist = (a: Pt, b: Pt): number => dhypot(a.x - b.x, a.y - b.y);

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

/** Keep the bearer wholly on-field (extent included, per "screen arrives intact"). */
export function clampToWorld(p: Pt): Pt {
  return {
    x: clamp(p.x, BEARER_R, WORLD.w - BEARER_R),
    y: clamp(p.y, BEARER_R, WORLD.h - BEARER_R),
  };
}

/**
 * Advance the bearer one fixed step. `ax`/`ay` are the raw -1..1 axis inputs;
 * diagonal speed is normalized so moving corner-wise isn't faster.
 */
export function stepBearer(p: Pt, ax: number, ay: number, dt: number): Pt {
  const len = dhypot(ax, ay);
  if (len === 0) return p;
  const nx = ax / len;
  const ny = ay / len;
  return clampToWorld({ x: p.x + nx * SPEED * dt, y: p.y + ny * SPEED * dt });
}

export const reached = (p: Pt): boolean => dist(p, GOAL) <= GOAL_R;
