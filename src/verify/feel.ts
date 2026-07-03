// Feel probes (Channel 3): quality proxies computed from a per-frame probe
// timeline. The harness cannot feel fun, but it can measure fun's precursors —
// time-to-first-meaningful-action, event cadence, difficulty ramp, input
// decision density — and fail when a game drifts outside its tuned windows.
// These are proxies, not proof: pair them with the filmstrip and a human-set
// window per game (see docs/VERIFICATION.md §Channel 3).

import type { World } from '../world';

export type ProbeFrame = Record<string, unknown>;

/**
 * Step a world through per-frame action arrays, probing after every step.
 * Returns frames.length + 1 probes: index 0 is the pre-step state, index i is
 * the state after frame i. (With the default 60Hz clock, index / 60 = sim
 * seconds.) For a segment-level timeline use scriptedPlaythrough instead.
 */
export function recordTimeline(world: World, frames: string[][]): ProbeFrame[] {
  const out: ProbeFrame[] = [world.probe()];
  for (const f of frames) {
    world.step(f);
    out.push(world.probe());
  }
  return out;
}

/** First timeline index where `pred` holds, or -1 if it never does. */
export function firstFrame(timeline: ProbeFrame[], pred: (p: ProbeFrame) => boolean): number {
  for (let i = 0; i < timeline.length; i++) if (pred(timeline[i])) return i;
  return -1;
}

/** The value of one probe key across the timeline. */
export function series(timeline: ProbeFrame[], key: string): unknown[] {
  return timeline.map((p) => p[key]);
}

/** Timeline indices where `key`'s value differs from the previous frame — an event cadence. */
export function changeFrames(timeline: ProbeFrame[], key: string): number[] {
  const out: number[] = [];
  for (let i = 1; i < timeline.length; i++) if (timeline[i][key] !== timeline[i - 1][key]) out.push(i);
  return out;
}

/** Monotonic within slack: 'up' means every value ≥ previous − slack. */
export function isMonotonic(values: number[], dir: 'up' | 'down', slack = 0): boolean {
  for (let i = 1; i < values.length; i++) {
    if (dir === 'up' ? values[i] < values[i - 1] - slack : values[i] > values[i - 1] + slack) return false;
  }
  return true;
}

/**
 * Fraction of frames carrying at least one action — a crude engagement proxy.
 * Near 0 the player is waiting; near 1 they are mashing; a tuned game usually
 * lives somewhere in between (set the window per genre).
 */
export function inputDensity(frames: string[][]): number {
  if (frames.length === 0) return 0;
  return frames.filter((f) => f.length > 0).length / frames.length;
}

/** Largest gap (in frames) between consecutive events — dead-air detector. */
export function longestLull(eventFrames: number[], totalFrames: number): number {
  const pts = [0, ...eventFrames, totalFrames];
  let worst = 0;
  for (let i = 1; i < pts.length; i++) worst = Math.max(worst, pts[i] - pts[i - 1]);
  return worst;
}
