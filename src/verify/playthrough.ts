// Scripted playthroughs: drive a world headlessly with a sequence of held-input
// segments and collect probe snapshots. This is Channel 1a — proving behavior on
// game state, in Node, no browser. (Hold keys ≥ a few frames: variable-height
// jumps treat a 1-frame synthetic tap as a real short tap.)

import type { World } from '../world';

export interface Segment {
  /** Actions held down for this segment. */
  actions?: string[];
  /** Number of fixed steps to run. */
  frames: number;
}

/** Build a segment: hold `actions` for `frames` steps. */
export function hold(actions: string[], frames: number): Segment {
  return { actions, frames };
}
/** Build an idle segment (no input) for `frames` steps. */
export function wait(frames: number): Segment {
  return { actions: [], frames };
}

export interface PlaythroughResult {
  totalFrames: number;
  finalHash: string;
  /** Probe snapshot after each segment. */
  probes: Record<string, unknown>[];
}

/** Run a scripted playthrough; returns a probe after each segment. */
export function scriptedPlaythrough(world: World, script: Segment[]): PlaythroughResult {
  const probes: Record<string, unknown>[] = [];
  let total = 0;
  for (const seg of script) {
    for (let i = 0; i < seg.frames; i++) world.step(seg.actions ?? []);
    total += seg.frames;
    probes.push(world.probe());
  }
  return { totalFrames: total, finalHash: world.hash(), probes };
}

/** Convenience: advance a world N frames with a fixed input set. */
export function pump(world: World, frames: number, actions: string[] = []): void {
  for (let i = 0; i < frames; i++) world.step(actions);
}
