// Pure sim for Driftlight — no scene/render imports (only pure math + Rng from
// @hayao). A paper lantern drifts downstream (auto, +x) toward the dawn sea; the
// player steers across-stream (y) to thread rock gates and gather firefly-light
// that keeps the flame alive. The course is generated deterministically from a
// seed as a chain of GATES (a moving gap); rocks are derived around each gap and
// lights are strung along the safe line, so a player who tracks the path both
// survives and refuels — which also makes the course provably winnable.

import { Rng, dhypot } from '@hayao';

export interface Pt {
  x: number;
  y: number;
}

/** The river: `length` downstream dwarfs the 1280 viewport, so it scrolls. */
export const RIVER = { length: 6600, top: 140, bottom: 600 };
export const START: Pt = { x: 150, y: 370 };
/** Reaching this downstream x is the sea — the win line. */
export const SEA_X = RIVER.length - 160;

/** The single designed course seed (game and bot build the same river). */
export const COURSE_SEED = 4073;

export const DRIFT = 300; // downstream px/s (automatic)
export const STEER = 320; // across-stream px/s (player)
export const LANTERN_R = 18;

// Flame economy, normalized 0..1.
export const FLAME_MAX = 1;
export const FLAME_START = 0.6;
export const DRAIN = 0.07; // per second, always
export const HIT_COST = 0.85; // per second while scraping a rock
export const LIGHT_GAIN = 0.12; // per firefly gathered

export interface Rock {
  x: number;
  y: number;
  r: number;
}
export interface Light {
  x: number;
  y: number;
}
export interface Gate {
  x: number;
  y: number; // safe-line center at this station
}
export interface Course {
  gates: Gate[];
  rocks: Rock[];
  lights: Light[];
}

const clampNum = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
export const dist = (a: Pt, b: Pt): number => dhypot(a.x - b.x, a.y - b.y);
export const progress = (x: number): number => clampNum((x - START.x) / (SEA_X - START.x), 0, 1);

const GAP = 168; // vertical opening the lantern threads
const STATION = 250; // downstream spacing between gates

/** Deterministic course: a chain of gates with rocks + lights derived from it. */
export function buildCourse(seed: number): Course {
  const rng = new Rng(seed);
  const gates: Gate[] = [];
  const rocks: Rock[] = [];
  const lights: Light[] = [];
  const midLo = RIVER.top + GAP / 2 + 26;
  const midHi = RIVER.bottom - GAP / 2 - 26;
  let gapY = (RIVER.top + RIVER.bottom) / 2;

  for (let x = 620; x < SEA_X - 260; x += STATION) {
    // The gap wanders, but slowly enough to be trackable at steering speed.
    gapY = clampNum(gapY + rng.range(-96, 96), midLo, midHi);
    gates.push({ x, y: gapY });

    // Rocks fill the banks above and below the gap (leaving GAP clear).
    fillColumn(rng, rocks, x, RIVER.top, gapY - GAP / 2);
    fillColumn(rng, rocks, x, gapY + GAP / 2, RIVER.bottom);

    // Fireflies sit ON the gate line (where a good pilot already is), scarce
    // enough that the flame rides a nervous sawtooth, not a saturated cap.
    if (rng.float() < 0.66) lights.push({ x: x + 30, y: gapY + rng.range(-18, 18) });
  }
  return { gates, rocks, lights };
}

/** Pack a vertical span [y0,y1] with a few rocks that don't cross the gap. */
function fillColumn(rng: Rng, out: Rock[], x: number, y0: number, y1: number): void {
  const span = y1 - y0;
  if (span < 30) return;
  const count = Math.max(1, Math.round(span / 78));
  for (let i = 0; i < count; i++) {
    const cy = y0 + ((i + 0.5) / count) * span;
    const r = clampNum(28 + rng.range(-6, 12), 20, 42);
    out.push({ x: x + rng.range(-30, 30), y: clampNum(cy + rng.range(-14, 14), y0 + 6, y1 - 6), r });
  }
}

/** The safe across-stream y for a given downstream x (for guidance + the bot). */
export function guideY(course: Course, x: number): number {
  const gates = course.gates;
  if (!gates.length) return (RIVER.top + RIVER.bottom) / 2;
  // Find the gate just ahead; lerp from the previous for a smooth line.
  let i = 0;
  while (i < gates.length && gates[i].x < x) i++;
  if (i === 0) return gates[0].y;
  if (i >= gates.length) return gates[gates.length - 1].y;
  const a = gates[i - 1];
  const b = gates[i];
  const t = clampNum((x - a.x) / (b.x - a.x), 0, 1);
  return a.y + (b.y - a.y) * t;
}

/** Index of the first rock the lantern is touching, or -1. */
export function rockHit(course: Course, p: Pt): number {
  for (let i = 0; i < course.rocks.length; i++) {
    const r = course.rocks[i];
    if (dhypot(p.x - r.x, p.y - r.y) <= r.r + LANTERN_R) return i;
  }
  return -1;
}

export const LIGHT_R = 15;
/** Index of the first ungathered firefly within reach, or -1. */
export function lightHit(course: Course, p: Pt, gathered: boolean[]): number {
  for (let i = 0; i < course.lights.length; i++) {
    if (gathered[i]) continue;
    const l = course.lights[i];
    if (dhypot(p.x - l.x, p.y - l.y) <= LIGHT_R + LANTERN_R + 10) return i;
  }
  return -1;
}

export const clampAcross = (y: number): number => clampNum(y, RIVER.top + LANTERN_R, RIVER.bottom - LANTERN_R);
