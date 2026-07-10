// The ethnographer: turns a recorded playtest session into a compact, factual
// report an agent can reason over — hesitations, deaths, futile inputs, the
// quit moment — WITHOUT an LLM reading 40k raw frames. Pure and deterministic:
// pass 1 mines the input log alone (no sim), pass 2 replays once and samples
// probes/events at the frames pass 1 flagged.
//
// Doctrine: telemetry DESCRIBES, the human DIRECTS. A hesitation is a
// hypothesis (confused? admiring? distracted?), never a verdict — reports feed
// the director's questions, and nothing here auto-triggers a code change.
//
// Event convention: games that emit `world.events` 'death' / 'goal' get death
// topology and honest quit detection; games that don't still get every
// log-derived metric. Emit 'death' AT the death location (before any respawn
// reset) — the cluster position is probed at emit time. Position comes from
// probe fields px/py (or x/y).

import type { GameDefinition } from '../app/game';
import { replaySession, type PlaytestSession } from '../workshop/session';

export interface HesitationSpan {
  startFrame: number;
  frames: number;
  /** Probe sampled at the span's first frame (what was on screen when input went quiet). */
  probe: Record<string, unknown>;
}

export interface DeathCluster {
  x: number;
  y: number;
  count: number;
  frames: number[];
}

export interface FutileVerb {
  action: string;
  /** Rising-edge presses after which no probe field changed within the window. */
  futilePresses: number;
  totalPresses: number;
  frames: number[];
}

export interface QuitContext {
  frame: number;
  probe: Record<string, unknown>;
  /** Deaths / hesitation starts inside the final window before the quit. */
  recentDeaths: number;
  recentHesitations: number;
  endReason: PlaytestSession['endReason'];
}

export interface AnnotationContext {
  frame: number;
  tag: string;
  note?: string;
  probe: Record<string, unknown>;
}

export interface PlaytestReport {
  sessionId: string;
  game: string;
  buildRef: string;
  seed: number;
  variant: PlaytestSession['variant'];
  frames: number;
  /** Sim seconds (frames × dt); wall time can be longer (pauses, hidden tab). */
  simSeconds: number;
  reachedGoal: boolean;
  deaths: number;
  hesitations: HesitationSpan[];
  deathClusters: DeathCluster[];
  futileVerbs: FutileVerb[];
  /** Present unless the session ended at the goal. */
  quit?: QuitContext;
  annotations: AnnotationContext[];
  knobEvents: PlaytestSession['knobEvents'];
  /** Verbs the player NEVER used (declared in the input map but absent from the log). */
  unusedActions: string[];
}

export interface AnalyzeOptions {
  /** Min quiet frames to count as a hesitation (default 45 ≈ 0.75s @ 60fps). */
  hesitationFrames?: number;
  /** Frames after a press in which SOMETHING must change, else it was futile (default 30). */
  futileWindow?: number;
  /** Final-window size for quit context, in frames (default 300 ≈ 5s). */
  quitWindow?: number;
  /** Death-cluster bucket size in world px (default 64). */
  clusterPx?: number;
}

/** Probe minus volatile bookkeeping — the fields that mean "state changed". */
function probeSignature(probe: Record<string, unknown>): string {
  const { frame: _f, time: _t, hash: _h, ...rest } = probe;
  return JSON.stringify(rest);
}

function probePosition(probe: Record<string, unknown>): { x: number; y: number } | null {
  const x = probe.px ?? probe.x;
  const y = probe.py ?? probe.y;
  return typeof x === 'number' && typeof y === 'number' ? { x, y } : null;
}

/** Frame ranges the sim ran but the human plausibly wasn't looking/playing. */
function excludedFrames(session: PlaytestSession): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  let hiddenAt: number | null = null;
  for (const m of session.wallClockMarks) {
    if (m.kind === 'visibility-hidden' && hiddenAt === null) hiddenAt = m.frame;
    if (m.kind === 'visibility-visible' && hiddenAt !== null) {
      out.push([hiddenAt, m.frame]);
      hiddenAt = null;
    }
  }
  if (hiddenAt !== null) out.push([hiddenAt, session.inputLog.frames.length]);
  let openAt: number | null = null;
  for (const e of session.screenEvents) {
    if ((e.kind === 'overlay-show' || e.kind === 'pause') && openAt === null) openAt = e.frame;
    if ((e.kind === 'overlay-hide' || e.kind === 'resume') && openAt !== null) {
      out.push([openAt, e.frame]);
      openAt = null;
    }
  }
  return out;
}

const inRanges = (frame: number, ranges: Array<[number, number]>): boolean =>
  ranges.some(([a, b]) => frame >= a && frame < b);

export function analyzePlaytest(def: GameDefinition, session: PlaytestSession, opts: AnalyzeOptions = {}): PlaytestReport {
  const hesitationMin = opts.hesitationFrames ?? 45;
  const futileWindow = opts.futileWindow ?? 30;
  const quitWindow = opts.quitWindow ?? 300;
  const clusterPx = opts.clusterPx ?? 64;
  const frames = session.inputLog.frames;
  const excluded = excludedFrames(session);

  // ── pass 1: mine the log alone (no sim) ────────────────────────────────────
  // Hesitation candidates: runs of empty action sets with no axis movement
  // (any axis change — pointer motion or press — counts as activity).
  const axisChangeAt = new Set(session.axesLog.map(([f]) => f));
  const hesitationCandidates: Array<{ startFrame: number; frames: number }> = [];
  let quietStart: number | null = null;
  for (let i = 0; i <= frames.length; i++) {
    const quiet = i < frames.length && frames[i].length === 0 && !axisChangeAt.has(i);
    if (quiet && quietStart === null) quietStart = i;
    if (!quiet && quietStart !== null) {
      const len = i - quietStart;
      if (len >= hesitationMin && !inRanges(quietStart, excluded)) hesitationCandidates.push({ startFrame: quietStart, frames: len });
      quietStart = null;
    }
  }

  // Rising-edge presses per action + the census of verbs never touched.
  const pressesByAction = new Map<string, number[]>();
  for (let i = 0; i < frames.length; i++) {
    const prev = i > 0 ? frames[i - 1] : [];
    for (const a of frames[i]) {
      if (!prev.includes(a)) {
        if (!pressesByAction.has(a)) pressesByAction.set(a, []);
        pressesByAction.get(a)!.push(i);
      }
    }
  }
  const declared = Object.keys(def.inputMap ?? {});
  const unusedActions = declared.filter((a) => !pressesByAction.has(a));

  // ── pass 2: one replay, sampling probes at flagged frames ──────────────────
  const wantProbe = new Set<number>();
  for (const h of hesitationCandidates) wantProbe.add(h.startFrame);
  for (const a of session.annotations) wantProbe.add(Math.max(0, Math.min(a.frame, frames.length - 1)));
  for (const [, presses] of pressesByAction) {
    for (const p of presses) {
      wantProbe.add(Math.max(0, p - 1)); // state just before the press…
      wantProbe.add(Math.min(frames.length - 1, p + futileWindow)); // …vs after the window
    }
  }
  if (frames.length > 0) wantProbe.add(frames.length - 1);

  const probes = new Map<number, Record<string, unknown>>();
  const deaths: Array<{ frame: number; pos: { x: number; y: number } | null }> = [];
  let reachedGoal = false;
  let frameNow = -1;
  const world = replaySession(def, session, {
    onWorld: (w) => {
      // The event convention: 'death' and 'goal' on world.events. Games that
      // don't emit still get every log-derived metric.
      w.events.on('death', () => deaths.push({ frame: frameNow + 1, pos: probePosition(w.probe()) }));
      w.events.on('goal', () => (reachedGoal = true));
    },
    onFrame: (w, i) => {
      frameNow = i;
      if (wantProbe.has(i)) probes.set(i, w.probe());
    },
  });
  const finalProbe = frames.length > 0 ? (probes.get(frames.length - 1) ?? world.probe()) : world.probe();
  // Probe-flag fallback for the win: many games expose `won` without emitting.
  if (finalProbe.won === true) reachedGoal = true;

  // ── assemble ────────────────────────────────────────────────────────────────
  const hesitations: HesitationSpan[] = hesitationCandidates.map((h) => ({
    ...h,
    probe: probes.get(h.startFrame) ?? {},
  }));

  const clusters = new Map<string, DeathCluster>();
  for (const d of deaths) {
    const key = d.pos ? `${Math.round(d.pos.x / clusterPx)}:${Math.round(d.pos.y / clusterPx)}` : 'unknown';
    const c = clusters.get(key) ?? { x: d.pos?.x ?? 0, y: d.pos?.y ?? 0, count: 0, frames: [] };
    c.count++;
    c.frames.push(d.frame);
    clusters.set(key, c);
  }

  const futileVerbs: FutileVerb[] = [];
  for (const [action, presses] of pressesByAction) {
    const futile: number[] = [];
    for (const p of presses) {
      const before = probes.get(Math.max(0, p - 1));
      const after = probes.get(Math.min(frames.length - 1, p + futileWindow));
      if (before && after && probeSignature(before) === probeSignature(after)) futile.push(p);
    }
    if (futile.length > 0) {
      futileVerbs.push({ action, futilePresses: futile.length, totalPresses: presses.length, frames: futile });
    }
  }

  const annotations: AnnotationContext[] = session.annotations.map((a) => {
    const f = Math.max(0, Math.min(a.frame, frames.length - 1));
    return { frame: a.frame, tag: a.tag, ...(a.note !== undefined ? { note: a.note } : {}), probe: probes.get(f) ?? {} };
  });

  const report: PlaytestReport = {
    sessionId: session.id,
    game: session.game,
    buildRef: session.buildRef,
    seed: session.seed,
    variant: session.variant,
    frames: frames.length,
    simSeconds: world.time,
    reachedGoal,
    deaths: deaths.length,
    hesitations,
    deathClusters: [...clusters.values()].sort((a, b) => b.count - a.count),
    futileVerbs: futileVerbs.sort((a, b) => b.futilePresses - a.futilePresses),
    annotations,
    knobEvents: session.knobEvents,
    unusedActions,
  };

  if (!reachedGoal && frames.length > 0) {
    const from = Math.max(0, frames.length - quitWindow);
    report.quit = {
      frame: frames.length - 1,
      probe: finalProbe,
      recentDeaths: deaths.filter((d) => d.frame >= from).length,
      recentHesitations: hesitations.filter((h) => h.startFrame >= from).length,
      endReason: session.endReason,
    };
  }

  return report;
}
