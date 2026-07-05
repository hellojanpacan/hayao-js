// The scrub timeline: a ring of periodic world snapshots + the session's own
// input log = exact time travel. Scrubbing restores the nearest snapshot at or
// before the target frame and re-steps the RECORDED inputs to it — determinism
// makes the result identical to having stopped there live. Pure module (no
// DOM): runStudio drives it in the browser, tests drive it headlessly.

import type { GameDefinition } from '../app/game';
import type { World, WorldSnapshot } from '../world';
import type { KnobEvent } from './session';

export interface TimelineEntry {
  frame: number;
  snap: WorldSnapshot;
}

/**
 * Periodic snapshot keeper. Every `stride` frames costs one snapshot; `cap`
 * bounds memory (oldest evicted), so scrub range ≈ stride × cap frames back.
 */
export class SnapshotRing {
  private entries: TimelineEntry[] = [];
  constructor(
    readonly stride = 30,
    readonly cap = 240,
  ) {}

  /** Call after every recorded step; keeps frame 0 and every stride-th frame. */
  push(frame: number, world: World): void {
    if (frame % this.stride !== 0) return;
    this.entries.push({ frame, snap: world.snapshot() });
    if (this.entries.length > this.cap) this.entries.shift();
  }

  /** Nearest entry at or before `frame` (null if it fell off the ring). */
  nearest(frame: number): TimelineEntry | null {
    let best: TimelineEntry | null = null;
    for (const e of this.entries) {
      if (e.frame <= frame && (!best || e.frame > best.frame)) best = e;
    }
    return best;
  }

  /** Oldest reachable frame (scrubbing earlier than this is off the ring). */
  get minFrame(): number {
    return this.entries.length > 0 ? this.entries[0].frame : 0;
  }

  /** Drop entries after `frame` — a rewind-and-resume forked the timeline. */
  truncate(frame: number): void {
    this.entries = this.entries.filter((e) => e.frame <= frame);
  }

  clear(): void {
    this.entries = [];
  }
}

/**
 * Scrub a live world to `target`: restore the nearest ring snapshot, then
 * re-step the recorded inputs. `inputFrames[i]` is the input DURING step i, so
 * stepping frames[entry..target-1] lands the world exactly AT `target`.
 * Returns the frame actually reached (clamped to the ring's reachable range),
 * or null if the ring is empty. `def.attach` runs after the restore — the same
 * contract as every other restore path.
 */
export function scrubTo(
  world: World,
  def: GameDefinition,
  ring: SnapshotRing,
  inputFrames: readonly string[][],
  axesLog: ReadonlyArray<readonly [number, string, number]>,
  knobEvents: readonly KnobEvent[],
  target: number,
): number | null {
  const clamped = Math.max(ring.minFrame, Math.min(target, inputFrames.length));
  const entry = ring.nearest(clamped);
  if (!entry) return null;
  world.restore(structuredClone(entry.snap));
  def.attach?.(world);
  // Axes are inputs, not snapshotted state: CLEAR the live world's stale
  // values (replaySession starts fresh; a scrub reuses the world), then
  // rebuild them at the snapshot frame and feed deltas as we re-step.
  world.input.axes.clear();
  const axesNow = new Map<string, number>();
  let axisIdx = 0;
  while (axisIdx < axesLog.length && axesLog[axisIdx][0] < entry.frame) {
    const [, name, value] = axesLog[axisIdx++];
    axesNow.set(name, value);
  }
  for (const [name, value] of axesNow) world.input.axes.set(name, value);
  let knobIdx = knobEvents.findIndex((k) => k.frame >= entry.frame);
  if (knobIdx < 0) knobIdx = knobEvents.length;
  for (let i = entry.frame; i < clamped; i++) {
    // Mid-play knob changes replay at their exact frame (same as replaySession).
    while (knobIdx < knobEvents.length && knobEvents[knobIdx].frame === i) {
      const k = knobEvents[knobIdx++];
      const snap = world.snapshot();
      snap.tuning = { ...snap.tuning, [k.key]: k.value };
      world.restore(snap);
      def.attach?.(world);
    }
    while (axisIdx < axesLog.length && axesLog[axisIdx][0] === i) {
      const [, name, value] = axesLog[axisIdx++];
      world.input.axes.set(name, value);
    }
    world.step(inputFrames[i]);
  }
  return clamped;
}
