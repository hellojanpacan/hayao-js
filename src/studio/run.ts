// runStudio: the Studio-instrumented browser driver. Wraps runBrowser (which
// stays lean for shipped games) with: URL overrides (?seed=, ?tuning=), the
// session recorder riding the onAdvance hook, shell/overlay/wall-clock
// observers, autosave + pagehide flush to the dev server, and a window.__studio
// API the Studio shell page drives across the iframe boundary.

import { runBrowser, type GameHandle, type RunOptions } from '../app/browser';
import { resolveTuning, type TuningValues } from '../app/tuning';
import type { GameDefinition } from '../app/game';
import { setScreenObserver } from '../ui/overlay';
import { SessionRecorder } from './record';
import type { EndReason, PlaytestSession, VariantRef } from './session';

export interface StudioOptions extends RunOptions {
  /** Variant identity to stamp on sessions (module/worktree variants set this). */
  variant?: VariantRef;
}

export interface StudioHandle extends GameHandle {
  /** Live-change a tuning knob: rebuild-with-carryover, recorded as a knob event. */
  setKnob(key: string, value: number | string): void;
  /** Current resolved tuning values. */
  knobValues(): TuningValues;
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

export function runStudio(def: GameDefinition, mount: HTMLElement, opts: StudioOptions = {}): StudioHandle {
  const url = urlOverrides();
  const seed = opts.world?.seed ?? url.seed ?? def.seed ?? 1;
  const overrides = { ...url.tuning, ...opts.world?.tuning };
  const tuningValues = resolveTuning(def.tuning, overrides);
  const values: TuningValues = { ...tuningValues };
  const start = typeof performance !== 'undefined' ? performance.now() : 0;

  let recorder = new SessionRecorder({
    game: def.title,
    seed,
    tuningValues,
    ...(opts.variant ? { variant: opts.variant } : {}),
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
        ...(opts.variant ? { variant: opts.variant } : {}),
        buildRef: recorder.buildRef,
      });
      (opts.onRestart ?? handle.restart)();
    },
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
    annotate: (tag, note) => recorder.annotate(tag, note),
    flush: (reason = 'idle') => flush(reason),
    session: () => recorder.toSession('idle'),
    stop() {
      flush('navigate');
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pagehide', onPageHide);
      window.clearInterval(autosave);
      setScreenObserver(null);
      handle.stop();
    },
  };

  window.__studio = studio;
  return studio;
}
