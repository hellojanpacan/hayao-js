// The playtest session artifact and its headless replay. A session is a
// RE-EXECUTABLE, not a recording: (seed, tuning, inputLog, axesLog) reproduce
// the whole run bit-exactly in Node, so any metric can be computed
// retroactively and any tick can be re-inspected. Pure module: no DOM — the
// browser recorder lives in record.ts, the analyzer and MCP sidecar replay
// through here.

import { createWorld, type GameDefinition } from '../app/game';
import type { TuningValues } from '../app/tuning';
import type { InputLog } from '../input/actions';
import type { World, WorldSnapshot } from '../world';

/** Which build/variant produced a session — a report is never ambiguous about code. */
export interface VariantRef {
  name: string;
  kind: 'dev' | 'module' | 'worktree';
  commit?: string;
}

export interface ScreenEvent {
  frame: number;
  kind: 'pause' | 'resume' | 'restart' | 'overlay-show' | 'overlay-hide' | 'knob' | 'variant' | 'hot-swap' | 'scrub';
  detail?: string;
}

/** Wall-clock context the sim can't see (tab hidden ≠ hesitation). */
export interface WallClockMark {
  frame: number;
  /** ms since session start (wall clock — context only, never sim input). */
  t: number;
  kind: 'visibility-hidden' | 'visibility-visible' | 'blur' | 'focus';
}

export interface Annotation {
  frame: number;
  tag: string;
  note?: string;
}

/** A mid-play tuning change (Studio knob): replay applies it AT its frame. */
export interface KnobEvent {
  frame: number;
  key: string;
  value: number | string;
}

export type EndReason = 'goal' | 'quit' | 'restart' | 'navigate' | 'idle' | 'hot-swap';

export interface PlaytestSession {
  id: string;
  game: string;
  startedAt: string;
  /** Git short sha of the code that ran (from the Studio dev server). */
  buildRef: string;
  seed: number;
  variant: VariantRef;
  /** Tuning at session start (resolved values). */
  tuningValues: TuningValues;
  /**
   * When play continued across a code hot-swap, the new segment records the
   * world it resumed FROM — replay restores it before stepping, so even
   * mid-development sessions stay bit-exactly re-executable.
   */
  startSnapshot?: WorldSnapshot;
  knobEvents: KnobEvent[];
  inputLog: InputLog;
  /** Delta-encoded analog axes: [frame, axis, value] whenever a value changed. */
  axesLog: Array<[number, string, number]>;
  screenEvents: ScreenEvent[];
  wallClockMarks: WallClockMark[];
  annotations: Annotation[];
  endReason: EndReason;
  /** Invited-playtester fields — creator sessions leave them unset. */
  playerId?: string;
  consent?: { recorded: boolean; at: string };
}

export interface ReplayOptions {
  toFrame?: number;
  /** Observer called once with the fresh world BEFORE any step (subscribe to events here). */
  onWorld?: (world: World) => void;
  /** Observer called AFTER each step with the frame index just played. */
  onFrame?: (world: World, frame: number) => void;
}

/**
 * Replay a session headlessly to `toFrame` (default: the whole log) and return
 * the live world. Bit-exact with the original run: axes deltas are applied
 * before the step that first saw them; knob events rebuild-with-carryover at
 * their frame exactly as the Studio panel did (including `def.attach`).
 * A bare number as `opts` is `toFrame`.
 */
export function replaySession(def: GameDefinition, session: PlaytestSession, opts?: number | ReplayOptions): World {
  const o: ReplayOptions = typeof opts === 'number' ? { toFrame: opts } : (opts ?? {});
  const world = createWorld(def, { seed: session.seed, tuning: session.tuningValues });
  if (session.startSnapshot) {
    world.restore(structuredClone(session.startSnapshot));
    def.attach?.(world);
  }
  o.onWorld?.(world);
  const end = Math.min(o.toFrame ?? session.inputLog.frames.length, session.inputLog.frames.length);
  let axisIdx = 0;
  let knobIdx = 0;
  const tuning: TuningValues = { ...session.tuningValues };
  for (let i = 0; i < end; i++) {
    while (knobIdx < session.knobEvents.length && session.knobEvents[knobIdx].frame === i) {
      const k = session.knobEvents[knobIdx++];
      tuning[k.key] = k.value;
      const snap = world.snapshot();
      snap.tuning = { ...tuning };
      world.restore(snap);
      def.attach?.(world);
    }
    while (axisIdx < session.axesLog.length && session.axesLog[axisIdx][0] === i) {
      const [, name, value] = session.axesLog[axisIdx++];
      world.input.axes.set(name, value);
    }
    world.step(session.inputLog.frames[i]);
    o.onFrame?.(world, i);
  }
  return world;
}
