// Declarative input scripts: the ergonomic way to author headless playthroughs
// for real-time games, where hand-writing per-frame action arrays is hopeless.
// A script is a list of segments; each holds actions for N frames, optionally
// tapping others on its first frame.

import type { World } from '../world';

export interface ScriptSegment {
  /** Actions held down for every frame of this segment. */
  hold?: string[];
  /** Actions pressed only on the first frame of this segment (taps). */
  press?: string[];
  /** How many fixed steps this segment lasts (default 1). */
  frames?: number;
}

export type InputScript = ScriptSegment[];

/** Expand a script into per-frame action arrays (an InputLog's frames). */
export function scriptToFrames(script: InputScript): string[][] {
  const out: string[][] = [];
  for (const seg of script) {
    const n = seg.frames ?? 1;
    const hold = seg.hold ?? [];
    for (let i = 0; i < n; i++) out.push(i === 0 && seg.press ? [...hold, ...seg.press] : [...hold]);
  }
  return out;
}

export interface DriveResult {
  frames: number;
  /** True if driving stopped early because `until` matched. */
  matched: boolean;
}

/**
 * Step a world through a script. Pass `until` to stop as soon as a probe
 * predicate holds (e.g. level solved) — the tail of the script is slack, so
 * playthrough scripts don't need frame-perfect lengths.
 */
export function drive(world: World, script: InputScript, until?: (probe: Record<string, unknown>) => boolean): DriveResult {
  let frames = 0;
  for (const f of scriptToFrames(script)) {
    if (until && until(world.probe())) return { frames, matched: true };
    world.step(f);
    frames++;
  }
  return { frames, matched: until ? until(world.probe()) : false };
}
