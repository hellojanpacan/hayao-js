// runStudio: the Studio-instrumented browser driver. Wraps runBrowser (which
// stays lean for shipped games) with: URL overrides (?seed=, ?tuning=), the
// session recorder riding the onAdvance hook, shell/overlay/wall-clock
// observers, autosave + pagehide flush to the dev server, and a window.__studio
// API the Studio shell page drives across the iframe boundary.

import { runBrowser, type GameHandle, type RunOptions } from '../app/browser';
import { resolveTuning, type TuningSpec, type TuningValues, type Variant } from '../app/tuning';
import type { GameDefinition } from '../app/game';
import { setScreenObserver } from '../ui/overlay';
import { SessionRecorder } from './record';
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
    if (recorder.frame === 0 && flushed) return; // nothing new since the last write
    post(recorder.toSession(reason), beacon);
    flushed = true;
  };

  const handle = runBrowser(def, mount, {
    ...opts,
    world: { seed, tuning: overrides },
    onAdvance: (world, steps, actions) => {
      for (let i = 0; i < steps; i++) recorder.step(actions, world.input.axes);
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
    annotate: (tag, note) => recorder.annotate(tag, note),
    flush: (reason = 'idle') => flush(reason),
    session: () => recorder.toSession('idle'),
    stop: () => cleanup('navigate'),
  };

  window.__studio = studio;
  return studio;
}
