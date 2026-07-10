// SessionRecorder: accumulates a PlaytestSession during live play. DOM-free so
// tests can drive it directly; runWorkshop (run.ts) wires it to the browser
// driver's onAdvance hook, the shell/overlay observers, and the wall clock.

import type {
  Annotation,
  EndReason,
  KnobEvent,
  PlaytestSession,
  ScreenEvent,
  VariantRef,
  WallClockMark,
} from './session';
import type { TuningValues } from '../app/tuning';
import type { WorldSnapshot } from '../world';

export interface RecorderInit {
  game: string;
  seed: number;
  tuningValues: TuningValues;
  variant?: VariantRef;
  buildRef?: string;
  startedAt?: string;
  id?: string;
  /** Segment sessions (post hot-swap) replay from this snapshot. */
  startSnapshot?: WorldSnapshot;
}

let counter = 0;
/** Collision-safe within a page; slugified so the id is filesystem/URL-safe. */
function sessionId(game: string, startedAt: string): string {
  const slug = game.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'game';
  return `${slug}-${startedAt.replace(/[:.]/g, '-').toLowerCase()}-${(counter++).toString(36)}`;
}

export class SessionRecorder {
  private frames: string[][] = [];
  private axesLog: Array<[number, string, number]> = [];
  private lastAxes = new Map<string, number>();
  private knobEvents: KnobEvent[] = [];
  private screenEvents: ScreenEvent[] = [];
  private wallClockMarks: WallClockMark[] = [];
  private annotations: Annotation[] = [];
  private readonly init: RecorderInit;
  private readonly startedAt: string;
  readonly id: string;
  /** Set once the dev server reports the git sha (fetched async by runWorkshop). */
  buildRef: string;

  constructor(init: RecorderInit) {
    this.init = init;
    this.startedAt = init.startedAt ?? new Date().toISOString();
    this.id = init.id ?? sessionId(init.game, this.startedAt);
    this.buildRef = init.buildRef ?? 'unknown';
  }

  /** Frames recorded so far — event hooks stamp themselves with this. */
  get frame(): number {
    return this.frames.length;
  }

  /** Live view of the recorded input frames (the scrub timeline re-steps these). */
  get liveInputFrames(): readonly string[][] {
    return this.frames;
  }

  /** Live view of the delta-encoded axes log. */
  get liveAxesLog(): ReadonlyArray<readonly [number, string, number]> {
    return this.axesLog;
  }

  /** Live view of mid-play knob changes (scrubbing reapplies them exactly). */
  get liveKnobEvents(): readonly KnobEvent[] {
    return this.knobEvents;
  }

  /**
   * Record one sim step: the action set it saw and (optionally) the analog
   * axes. Axes are delta-encoded — an entry lands only when a value changed.
   */
  step(actions: readonly string[], axes?: ReadonlyMap<string, number>): void {
    if (axes) {
      for (const [name, value] of axes) {
        if (this.lastAxes.get(name) !== value) {
          this.axesLog.push([this.frames.length, name, value]);
          this.lastAxes.set(name, value);
        }
      }
    }
    this.frames.push([...actions].sort());
  }

  knob(key: string, value: number | string): void {
    this.knobEvents.push({ frame: this.frames.length, key, value });
    this.screen('knob', `${key}=${value}`);
  }

  screen(kind: ScreenEvent['kind'], detail?: string): void {
    this.screenEvents.push({ frame: this.frames.length, kind, ...(detail !== undefined ? { detail } : {}) });
  }

  mark(kind: WallClockMark['kind'], t: number): void {
    this.wallClockMarks.push({ frame: this.frames.length, t, kind });
  }

  annotate(tag: string, note?: string): void {
    this.annotations.push({ frame: this.frames.length, tag, ...(note !== undefined ? { note } : {}) });
  }

  /**
   * A rewind-and-resume forked the timeline: everything after `frame` never
   * happened in the final run. Drop those frames plus the events stamped in
   * them, so the artifact stays exactly replayable as what the player kept.
   */
  truncate(frame: number): void {
    if (frame >= this.frames.length) return;
    this.frames.length = frame;
    this.axesLog = this.axesLog.filter(([f]) => f < frame);
    this.lastAxes.clear();
    for (const [f, name, value] of this.axesLog) if (f < frame) this.lastAxes.set(name, value);
    this.knobEvents = this.knobEvents.filter((e) => e.frame <= frame);
    this.screenEvents = this.screenEvents.filter((e) => e.frame <= frame);
    this.wallClockMarks = this.wallClockMarks.filter((m) => m.frame <= frame);
    this.annotations = this.annotations.filter((a) => a.frame <= frame);
  }

  /** Finalize into the artifact. The recorder can keep recording afterwards (autosave). */
  toSession(endReason: EndReason): PlaytestSession {
    return {
      id: this.id,
      game: this.init.game,
      startedAt: this.startedAt,
      buildRef: this.buildRef,
      seed: this.init.seed,
      variant: this.init.variant ?? { name: 'dev', kind: 'dev' },
      tuningValues: { ...this.init.tuningValues },
      ...(this.init.startSnapshot ? { startSnapshot: this.init.startSnapshot } : {}),
      knobEvents: this.knobEvents.slice(),
      inputLog: { frames: this.frames.map((f) => f.slice()) },
      axesLog: this.axesLog.slice(),
      screenEvents: this.screenEvents.slice(),
      wallClockMarks: this.wallClockMarks.slice(),
      annotations: this.annotations.slice(),
      endReason,
    };
  }
}
