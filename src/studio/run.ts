// runStudio: the Studio-instrumented browser driver. Wraps runBrowser (which
// stays lean for shipped games) with: URL overrides (?seed=, ?tuning=), the
// session recorder riding the onAdvance hook, shell/overlay/wall-clock
// observers, autosave + pagehide flush to the dev server, and a window.__studio
// API the Studio shell page drives across the iframe boundary.

import { runBrowser, type GameHandle, type RunOptions } from '../app/browser';
import { resolveTuning, type TuningSpec, type TuningValues, type Variant } from '../app/tuning';
import { createWorld, type GameDefinition } from '../app/game';
import { setScreenObserver } from '../ui/overlay';
import { SessionRecorder } from './record';
import { SnapshotRing, scrubTo } from './timeline';
import type { EndReason, PlaytestSession, VariantRef } from './session';

/** The slice of Vite's import.meta.hot the carryover needs (structural, no vite type dep). */
export interface HotContext {
  data: Record<string, unknown>;
  dispose(cb: (data: Record<string, unknown>) => void): void;
}

export interface StudioOptions extends RunOptions {
  /**
   * Named A/B variants of this game. `?variant=<name>` picks one: its `patch`
   * rewrites the definition, its `tuning` seeds the knob values (explicit
   * `?tuning=`/opts overrides still win). Sessions are stamped with the name.
   */
  variants?: Record<string, Variant>;
  /** Variant identity override (worktree builds stamp commit info here). */
  variant?: VariantRef;
  /**
   * Pass `import.meta.hot` (only the game's own entry module has it) to carry
   * the live world ACROSS code hot-swaps: snapshot on dispose, restore into
   * the re-executed module. The old session flushes as 'hot-swap'; the new
   * segment records the restored snapshot so it stays fully replayable.
   *
   * The entry MUST also contain the literal line `import.meta.hot?.accept();`
   * — Vite decides HMR boundaries by statically scanning module source, so an
   * accept() call inside this library cannot mark your entry self-accepting.
   */
  hot?: HotContext;
}

export interface StudioHandle extends GameHandle {
  /** Live-change a tuning knob: rebuild-with-carryover, recorded as a knob event. */
  setKnob(key: string, value: number | string): void;
  /** Current resolved tuning values. */
  knobValues(): TuningValues;
  /** The game's declared knob spec (the Studio panel builds its controls from this). */
  tuningSpec(): TuningSpec | undefined;
  /** Declared A/B variants: name → label. */
  variants(): Record<string, string>;
  /** The variant this run is playing (name + kind, worktrees include commit). */
  activeVariant(): VariantRef;
  /** The game title (the Studio page labels panes with it). */
  title(): string;
  /** Drop a human annotation at the current frame ("felt bad here"). */
  annotate(tag: string, note?: string): void;
  /** Freeze/unfreeze the sim (rendering continues; no pause overlay). */
  setFrozen(frozen: boolean): void;
  frozen(): boolean;
  /**
   * Time-travel to a recorded frame (freezes first). Exact: restores the
   * nearest ring snapshot and re-steps the recorded inputs. Returns the frame
   * reached, or null if it's off the ring. Resuming after a rewind FORKS the
   * timeline: the discarded future is truncated from the session.
   */
  scrub(frame: number): number | null;
  /** Scrub bounds + position: min reachable frame, current, recorded max. */
  timeline(): { min: number; frame: number; max: number };
  /**
   * 'live' = playing + recording; 'replay' = watching a past session loaded
   * via ?session=<id> (read-only: scrub/playback over the whole recording,
   * knobs and annotation disabled, nothing records).
   */
  mode(): 'live' | 'replay';
  /** Flush the session artifact to the dev server now. */
  flush(reason?: EndReason): void;
  /** The in-progress session (for inspection/tests). */
  session(): PlaytestSession;
}

declare global {
  interface Window {
    __studio?: StudioHandle;
  }
}

/** Parse ?seed= and ?tuning= (base64 JSON) — silently ignore malformed input. */
function urlOverrides(): { seed?: number; tuning?: TuningValues } {
  if (typeof location === 'undefined') return {};
  const params = new URLSearchParams(location.search);
  const out: { seed?: number; tuning?: TuningValues } = {};
  const seed = params.get('seed');
  if (seed !== null && Number.isFinite(Number(seed))) out.seed = Number(seed);
  const tuning = params.get('tuning');
  if (tuning) {
    try {
      const parsed = JSON.parse(atob(tuning)) as TuningValues;
      if (parsed && typeof parsed === 'object') out.tuning = parsed;
    } catch {
      /* malformed ?tuning= is a no-op, not a crash */
    }
  }
  return out;
}

export function runStudio(baseDef: GameDefinition, mount: HTMLElement, opts: StudioOptions = {}): StudioHandle {
  const url = urlOverrides();

  // Variant resolution: ?variant= picks a named alternative; its patch rewrites
  // the def, its tuning seeds the overrides (explicit URL/opts tuning wins).
  const variantName = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('variant') : null;
  const variantDef = variantName ? opts.variants?.[variantName] : undefined;
  const def = variantDef?.patch ? variantDef.patch(baseDef) : baseDef;
  const variantRef: VariantRef = opts.variant ?? (variantDef && variantName ? { name: variantName, kind: 'module' } : { name: 'dev', kind: 'dev' });

  const seed = opts.world?.seed ?? url.seed ?? def.seed ?? 1;
  const overrides = { ...variantDef?.tuning, ...url.tuning, ...opts.world?.tuning };
  const tuningValues = resolveTuning(def.tuning, overrides);
  const values: TuningValues = { ...tuningValues };
  const start = typeof performance !== 'undefined' ? performance.now() : 0;

  let recorder = new SessionRecorder({
    game: def.title,
    seed,
    tuningValues,
    variant: variantRef,
  });
  let flushed = false;

  const post = (session: PlaytestSession, beacon: boolean) => {
    const body = JSON.stringify(session);
    if (beacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/__studio/session', new Blob([body], { type: 'application/json' }));
      return;
    }
    void fetch('/__studio/session', { method: 'POST', headers: { 'content-type': 'application/json' }, body }).catch(() => {
      /* dev server gone — the session still lives in memory */
    });
  };
  const flush = (reason: EndReason = 'quit', beacon = false) => {
    if (replay) return; // replay mode records nothing — the artifact already exists
    if (recorder.frame === 0 && flushed) return; // nothing new since the last write
    post(recorder.toSession(reason), beacon);
    flushed = true;
  };

  // ── replay mode ("watch the tape"): ?session=<id> loads a past artifact ─────
  const replayId = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('session') : null;
  let replay: { session: PlaytestSession; pos: number } | null = null;
  let playbackTimer: number | null = null;

  // ── scrub timeline: periodic snapshots + the recorder's own log ─────────────
  // (`let`: replay mode swaps in a ring whose stride covers the whole tape.)
  let ring = new SnapshotRing();
  let isFrozen = false;
  let scrubbedTo: number | null = null; // set while paused earlier than the recorded tip

  /**
   * Commit a rewound position as the new present: the discarded future never
   * happened — truncate it from the recorder and the ring so the session
   * artifact stays exactly what the player kept.
   */
  const forkIfRewound = () => {
    if (scrubbedTo === null || scrubbedTo >= recorder.frame) {
      scrubbedTo = null;
      return;
    }
    recorder.truncate(scrubbedTo);
    ring.truncate(scrubbedTo);
    recorder.screen('scrub', `forked@${scrubbedTo}`);
    scrubbedTo = null;
  };

  const handle = runBrowser(def, mount, {
    ...opts,
    world: { seed, tuning: overrides },
    isHeld: () => isFrozen || (opts.isHeld?.() ?? false),
    onAdvance: (world, steps, actions) => {
      for (let i = 0; i < steps; i++) {
        recorder.step(actions, world.input.axes);
        ring.push(recorder.frame, world);
      }
      opts.onAdvance?.(world, steps, actions);
    },
    onPause: (paused) => {
      recorder.screen(paused ? 'pause' : 'resume');
      opts.onPause?.(paused);
    },
    onRestart: () => {
      // A restart ends the run: flush it, then record into a fresh session.
      flush('restart');
      recorder = new SessionRecorder({
        game: def.title,
        seed,
        tuningValues: { ...values },
        variant: variantRef,
        buildRef: recorder.buildRef,
      });
      (opts.onRestart ?? handle.restart)();
    },
  });

  // ── HMR carryover: play continues across code edits ─────────────────────────
  const carried = opts.hot?.data.hayaoSnap as ReturnType<typeof handle.world.snapshot> | undefined;
  if (carried) {
    delete opts.hot!.data.hayaoSnap;
    const snap = structuredClone(carried);
    snap.tuning = { ...values }; // the NEW module's resolved tuning wins
    handle.world.restore(snap);
    def.attach?.(handle.world);
    // The new segment replays from this exact state — record it as the origin.
    recorder = new SessionRecorder({
      game: def.title,
      seed,
      tuningValues: { ...values },
      variant: variantRef,
      startSnapshot: snap,
    });
    recorder.screen('hot-swap');
  }
  opts.hot?.dispose((data) => {
    data.hayaoSnap = handle.world.snapshot();
    cleanup('hot-swap');
  });
  // Seed the scrub floor: frame 0 of this run (post-carryover if any).
  ring.push(0, handle.world);

  /**
   * Load a past session into the live pane: rebuild its exact starting world,
   * fast-replay the whole recording once to fill the snapshot ring, then land
   * scrubbed at `at` (or frame 0). Determinism turns the artifact into footage.
   */
  async function enterReplay(id: string, at: number): Promise<void> {
    const res = await fetch(`/__studio/session/${encodeURIComponent(id)}`);
    if (!res.ok) return;
    const artifact = (await res.json()) as PlaytestSession;
    isFrozen = true;
    const w = handle.world;
    // Transplant the artifact's origin into the live world (seed, rng, tuning).
    const base = createWorld(def, { seed: artifact.seed, tuning: artifact.tuningValues });
    w.restore(artifact.startSnapshot ? structuredClone(artifact.startSnapshot) : base.snapshot());
    def.attach?.(w);
    w.input.axes.clear();
    const frames = artifact.inputLog.frames;
    // Adaptive stride so the WHOLE tape stays scrubbable within the ring cap
    // (a fixed 30 would evict the start of any session longer than ~2 min).
    const stride = Math.max(30, Math.ceil(frames.length / 220 / 30) * 30);
    ring = new SnapshotRing(stride);
    ring.push(0, w);
    let axisIdx = 0;
    let knobIdx = 0;
    for (let i = 0; i < frames.length; i++) {
      while (knobIdx < artifact.knobEvents.length && artifact.knobEvents[knobIdx].frame === i) {
        const k = artifact.knobEvents[knobIdx++];
        const snap = w.snapshot();
        snap.tuning = { ...snap.tuning, [k.key]: k.value };
        w.restore(snap);
        def.attach?.(w);
      }
      while (axisIdx < artifact.axesLog.length && artifact.axesLog[axisIdx][0] === i) {
        const [, name, value] = artifact.axesLog[axisIdx++];
        w.input.axes.set(name, value);
      }
      w.step(frames[i]);
      ring.push(i + 1, w);
    }
    replay = { session: artifact, pos: frames.length };
    studio.scrub(Number.isFinite(at) ? at : 0);
  }

  /**
   * Playback: step recorded frames in real time while "unfrozen" in replay.
   * Elapsed-time accumulator, not per-tick stepping — browsers throttle timers
   * in hidden tabs, so each tick steps however many frames wall time owes
   * (capped, to avoid a giant catch-up after a long throttle).
   */
  function startPlayback(): void {
    if (!replay || playbackTimer !== null) return;
    const s = replay.session;
    let last = performance.now();
    playbackTimer = window.setInterval(() => {
      if (!replay) return;
      const nowMs = performance.now();
      const owed = Math.min(120, Math.floor((nowMs - last) / (1000 / 60)));
      if (owed <= 0) return;
      last = nowMs;
      const w = handle.world;
      for (let n = 0; n < owed; n++) {
        const i = replay.pos;
        if (i >= s.inputLog.frames.length) {
          stopPlayback();
          return;
        }
        for (const k of s.knobEvents) {
          if (k.frame === i) {
            const snap = w.snapshot();
            snap.tuning = { ...snap.tuning, [k.key]: k.value };
            w.restore(snap);
            def.attach?.(w);
          }
        }
        for (const [f, name, value] of s.axesLog) if (f === i) w.input.axes.set(name, value);
        w.step(s.inputLog.frames[i]);
        replay.pos = i + 1;
      }
    }, 1000 / 60);
  }
  function stopPlayback(): void {
    if (playbackTimer !== null) {
      window.clearInterval(playbackTimer);
      playbackTimer = null;
    }
  }

  if (replayId) void enterReplay(replayId, Number(new URLSearchParams(location.search).get('at') ?? 'NaN'));

  // Build identity comes from the dev server (git sha) — best-effort, async.
  void fetch('/__studio/state')
    .then((r) => (r.ok ? r.json() : null))
    .then((s: { buildRef?: string } | null) => {
      if (s?.buildRef) recorder.buildRef = s.buildRef;
    })
    .catch(() => {});

  setScreenObserver((kind, title) => recorder.screen(kind === 'show' ? 'overlay-show' : 'overlay-hide', title));

  const now = () => (typeof performance !== 'undefined' ? performance.now() - start : 0);
  const onVisibility = () => recorder.mark(document.hidden ? 'visibility-hidden' : 'visibility-visible', now());
  const onBlur = () => recorder.mark('blur', now());
  const onFocus = () => recorder.mark('focus', now());
  const onPageHide = () => flush('quit', true);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('blur', onBlur);
  window.addEventListener('focus', onFocus);
  window.addEventListener('pagehide', onPageHide);
  // Mobile Safari kills tabs without ceremony — autosave so a session is never lost.
  const autosave = window.setInterval(() => flush('idle'), 10_000);

  /** Flush + release everything this run owns (stop() and HMR dispose share it). */
  const cleanup = (reason: EndReason) => {
    stopPlayback();
    flush(reason, reason === 'hot-swap');
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('blur', onBlur);
    window.removeEventListener('focus', onFocus);
    window.removeEventListener('pagehide', onPageHide);
    window.clearInterval(autosave);
    setScreenObserver(null);
    handle.stop();
  };

  const studio: StudioHandle = {
    ...handle,
    get world() {
      return handle.world;
    },
    setKnob(key, value) {
      if (replay) return; // the tape is read-only
      forkIfRewound(); // a knob turned while rewound commits that position first
      values[key] = value;
      const snap = handle.world.snapshot();
      snap.tuning = { ...values };
      handle.world.restore(snap);
      def.attach?.(handle.world);
      recorder.knob(key, value);
    },
    knobValues: () => ({ ...values }),
    tuningSpec: () => def.tuning,
    variants: () => Object.fromEntries(Object.entries(opts.variants ?? {}).map(([name, v]) => [name, v.label])),
    activeVariant: () => ({ ...variantRef }),
    title: () => def.title,
    annotate: (tag, note) => {
      if (!replay) recorder.annotate(tag, note);
    },
    setFrozen(frozen) {
      if (replay) {
        // In replay, "unfrozen" means the tape plays; the sim stays held.
        frozen ? stopPlayback() : startPlayback();
        return;
      }
      if (frozen === isFrozen) return;
      if (frozen) {
        isFrozen = true;
        return;
      }
      const wasRewound = scrubbedTo !== null;
      forkIfRewound();
      if (wasRewound) {
        // Knob values may have been rewound past — resync from the live world.
        const t = handle.world.snapshot().tuning ?? {};
        for (const key of Object.keys(values)) if (key in t) values[key] = t[key];
      }
      isFrozen = false;
    },
    frozen: () => (replay ? playbackTimer === null : isFrozen),
    scrub(frame) {
      if (replay) {
        stopPlayback();
        const s = replay.session;
        const reached = scrubTo(handle.world, def, ring, s.inputLog.frames, s.axesLog, s.knobEvents, frame);
        if (reached !== null) replay.pos = reached;
        return reached;
      }
      isFrozen = true;
      const reached = scrubTo(handle.world, def, ring, recorder.liveInputFrames, recorder.liveAxesLog, recorder.liveKnobEvents, frame);
      if (reached !== null) scrubbedTo = reached < recorder.frame ? reached : null;
      return reached;
    },
    timeline: () =>
      replay
        ? { min: ring.minFrame, frame: replay.pos, max: replay.session.inputLog.frames.length }
        : { min: ring.minFrame, frame: scrubbedTo ?? recorder.frame, max: recorder.frame },
    mode: () => (replay ? 'replay' : 'live'),
    flush: (reason = 'idle') => flush(reason),
    session: () => recorder.toSession('idle'),
    stop: () => cleanup('navigate'),
  };

  window.__studio = studio;
  return studio;
}
