// Browser driver: mounts a renderer, samples real input into the fixed-step
// kernel, projects to the renderer each frame, and wires audio + the pause shell.
// Wall-clock only feeds the accumulator (how many steps to run) — replays use the
// input log, not wall time, so the sim stays deterministic.

import type { CreateWorldOptions, GameDefinition } from './game';
import { createWorld, pickForm } from './game';
import { makeSplash } from './splash';
import { KeyboardSource, PointerSource, type InputSource } from '../input/source';
import type { Vec2 } from '../core/math';
import { SvgRenderer } from '../render/svg';
import { Canvas2DRenderer } from '../render/canvas';
import { WebGL2Renderer } from '../render/webgl';
import type { Renderer, Viewport } from '../render/renderer';
import { bleedViewBox } from '../render/renderer';
import { renderToSVGString } from '../render/svgString';
import { audio } from '../audio/audio';
import { settings } from '../ui/settings';
import { setOverlayHost } from '../ui/overlay';
import { MenuGamepad } from '../ui/menuNav';
import { Shell } from '../ui/shell';
import { installCapture, isCaptureMode } from '../verify/capture';
import { DebugPane } from '../debug/pane';
import { drainDebugCommands } from '../debug/draw';
import type { World } from '../world';

export interface RunOptions {
  /** Rendering backend. Default 'svg'. Use 'webgl' for post-processing effects. */
  renderer?: 'svg' | 'canvas' | 'webgl';
  /**
   * How the fixed design box meets an off-ratio container. Default `'contain'` —
   * letterbox the authored box intact (every player sees exactly the same
   * play-field; the classic console stance). `'bleed'` keeps that same safe box
   * centered but grows the view in the deficient axis so its aspect matches the
   * container, filling the bars with the game's own margins — put only cosmetic
   * scenery there (the safe box stays the fair, shared play-field; see
   * `safeAreaIssues` in verify/layout). Beyond a sane cap (`BLEED_MAX`) it
   * letterboxes the remainder rather than stretch to a scenery desert.
   */
  fit?: 'contain' | 'bleed';
  /** Start the pause/settings shell (Esc). Default true. */
  shell?: boolean;
  /** Gamepad navigation of menu screens (d-pad/stick + Ⓐ/Ⓑ). Default true. */
  menuGamepad?: boolean;
  /**
   * The runtime debug pane on Backspace (freeze/step, node inspector, probe,
   * screenshot/video). Default true; off automatically in capture mode.
   */
  debugPane?: boolean;
  onRestart?: () => void;
  /** World creation overrides (seed, tuning) — applied on start AND restart. */
  world?: CreateWorldOptions;
  /**
   * Observer hook: called after each advance that ran ≥1 step, with the step
   * count and the action set those steps saw. Every step in the batch saw the
   * SAME actions and axes, so recording `steps × (actions, axes)` replays
   * exactly. Workshop's session recorder rides this; it must never mutate.
   */
  onAdvance?: (world: World, steps: number, actions: readonly string[]) => void;
  /** Shell pause/resume observer (true = paused). */
  onPause?: (paused: boolean) => void;
  /**
   * Freeze gate: while it returns true the loop keeps rendering but runs no
   * steps (no pause overlay — Workshop's scrubber holds the sim with this).
   */
  isHeld?: () => boolean;
  /**
   * Extra input sources (e.g. GamepadSource) sampled each step alongside the
   * built-in KeyboardSource and PointerSource. Each source's sample() is called
   * before world.advance(), and dispose() on stop(). You can also add sources
   * after the handle is returned via GameHandle.addSource().
   */
  sources?: InputSource[];
  /**
   * Where the built-in KeyboardSource listens. Default `document` — right for a
   * game that owns the page. Pass a focusable wrapper element instead when
   * EMBEDDING a game in a content page: keys (and the arrow/space scroll
   * preventDefault) are then captured only while focus is inside the wrapper,
   * so the rest of the page keeps scrolling normally.
   */
  keyboardTarget?: Document | HTMLElement;
}

export interface GameHandle {
  world: World;
  renderer: Renderer;
  /** The live input source — game UI calls input.press('action') for buttons. */
  input: KeyboardSource;
  /**
   * Continuous pointer/touch in DESIGN space, sampled into world.input.axes each
   * step (pointer.x / pointer.y / pointer.down). Read `handle.pointer.read()` for
   * a one-off, or `world.input.axis('pointer.x')` inside the sim.
   */
  pointer: PointerSource;
  /** The mounted canvas/svg node (attach your own listeners here if needed). */
  canvas: HTMLElement | SVGElement | undefined;
  /** Map a pointer event's clientX/Y to design coordinates (undoes the letterbox). */
  toDesign(clientX: number, clientY: number): Vec2;
  /** The drawn (letterboxed) area within the mount — anchor host-drawn UI here. */
  viewport(): Viewport | undefined;
  /** Resolves after preload completes and the first real frame has rendered. */
  ready: Promise<void>;
  /** Run a callback once the game is ready (fires immediately if already ready). */
  onReady(cb: () => void): void;
  /**
   * Register an extra input source (e.g. GamepadSource) to be sampled each step
   * alongside PointerSource. Returns a cleanup function that removes the source
   * (calling its dispose()) when invoked.
   *
   * Typical pattern:
   *   const handle = runBrowser(def, mount);
   *   const gamepad = new GamepadSource({ keyboard: handle.input });
   *   const removeGamepad = handle.addSource(gamepad);
   */
  addSource(source: InputSource): () => void;
  /**
   * Drive one frame by hand: sample the pointer (and extra sources), advance
   * the world by dtMs with the currently-held actions, and render — exactly
   * what the real loop does per frame. Default dtMs is one fixed step's ms.
   * For headless/tool-driven frame-stepping with visuals updating; the wall-
   * clock loop keeps running independently (pause the shell or use isHeld to
   * make tick() the only driver).
   */
  tick(dtMs?: number): void;
  stop(): void;
  restart(): void;
}

// The animated boot cover (Hayao logo reveal) lives in ./splash — a pure
// DrawCommand[] builder, so it's unit-testable without a DOM.

// The cold-open holds the boot cover (and fires the chime) for at least this
// long — enough for the logo to fade/rise in, hold, and dissolve to the game.
// It's the default when a game doesn't set splash.minDurationMs; opt out of the
// whole ritual (cover + chime) with `splash: false`.
const BOOT_COLD_OPEN_MS = 900;

export function runBrowser(def: GameDefinition, mount: HTMLElement, opts: RunOptions = {}): GameHandle {
  const background = def.background ?? '#f3ecdb';
  const fit = opts.fit ?? 'contain';

  // Measure the container so we can pick the closest declared form (a phone loads
  // the portrait design, a laptop the landscape one). Falls back to the window,
  // then the design ratio, when the mount hasn't been laid out yet.
  const measureAspect = (): number => {
    const r = mount.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return r.width / r.height;
    if (typeof window !== 'undefined' && window.innerHeight > 0) return window.innerWidth / window.innerHeight;
    return (def.width ?? 1280) / (def.height ?? 720);
  };
  // The active form is chosen ONCE, at boot — a game is authored for a device
  // shape, and swapping the whole design mid-session would reset play. Live
  // resizes within the form are absorbed by `fit` (letterbox or bleed), not by
  // re-picking, so the game never resets under a window drag or rotation.
  const form = pickForm(def, measureAspect());
  const width = form.width;
  const height = form.height;
  // Run the chosen form's builder while keeping the rest of the definition.
  const activeDef: GameDefinition = form.build === def.build ? { ...def, width, height } : { ...def, width, height, build: form.build };

  let world = createWorld(activeDef, opts.world);
  const renderer: Renderer =
    opts.renderer === 'canvas'
      ? new Canvas2DRenderer({ width, height, background })
      : opts.renderer === 'webgl'
        ? new WebGL2Renderer({ width, height, background })
        : new SvgRenderer({ width, height, background });

  mount.style.position = mount.style.position || 'relative';
  renderer.mount?.(mount);
  setOverlayHost(mount);

  // ── Bleed: keep the view box tracking the container so its aspect matches and
  // the letterbox bars fill with the game's own scenery margins. Coalesced onto
  // one rAF; the world is untouched (dims aren't hashed), so no determinism cost.
  let bleedRaf = 0;
  const applyBleed = () => {
    bleedRaf = 0;
    const r = mount.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    renderer.setViewBox?.(bleedViewBox(r.width, r.height, width, height));
  };
  const scheduleBleed = () => {
    if (fit !== 'bleed' || bleedRaf !== 0 || typeof requestAnimationFrame === 'undefined') return;
    bleedRaf = requestAnimationFrame(applyBleed);
  };
  let resizeObserver: ResizeObserver | undefined;
  if (fit === 'bleed') {
    applyBleed(); // first frame renders already filled, no bars flash
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleBleed);
      resizeObserver.observe(mount);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', scheduleBleed);
      window.addEventListener('orientationchange', scheduleBleed);
    }
  }

  const input = new KeyboardSource(def.inputMap ?? {}, opts.keyboardTarget ?? document);
  // keyboard wired in so mouse buttons enter the same deterministic action log
  // as keys (mouse.left/right/middle held actions + inputMap bindings).
  const pointer = new PointerSource(renderer, { keyboard: input });
  const extraSources: InputSource[] = [...(opts.sources ?? [])];
  const capture = isCaptureMode();

  // Arm the unknown-action typo guard: declare what this host can produce.
  // Re-run on restart — a fresh world gets a fresh InputState.
  const declareInputs = () => world.input.declareActions(input.actionNames());
  declareInputs();

  // Start audio on first user gesture (autoplay policy).
  const startAudio = () => {
    audio.start();
    const s = settings.get();
    audio.setVolumes(s);
    window.removeEventListener('pointerdown', startAudio);
    window.removeEventListener('keydown', startAudio);
  };
  window.addEventListener('pointerdown', startAudio);
  window.addEventListener('keydown', startAudio);

  const renderFrame = () => {
    const cmds = world.render();
    // Immediate-mode debug draws paint above everything (see debug/draw.ts).
    const dbg = drainDebugCommands(world.viewTransform());
    renderer.draw(dbg.length > 0 ? cmds.concat(dbg) : cmds);
  };
  const restart = () => {
    world = createWorld(activeDef, opts.world);
    declareInputs();
    renderFrame();
  };

  // One fixed step with live-held inputs + a render — what the debug pane's
  // frame-stepper drives while the freeze gate holds the wall-clock loop.
  const debugStepOnce = () => {
    pointer.sample(world.input);
    for (const s of extraSources) s.sample(world.input);
    world.step(input.currentActions());
    input.clearPressed();
    renderFrame();
  };
  const debugPane =
    opts.debugPane === false || capture
      ? null
      : new DebugPane({
          get world() {
            return world;
          },
          stepOnce: debugStepOnce,
          canvas: renderer.element,
          mount,
        });

  const menuPad = opts.menuGamepad === false ? null : new MenuGamepad();
  const shell =
    opts.shell === false
      ? null
      : new Shell({
          title: def.title,
          onRestart: opts.onRestart ?? restart,
          onPause: (paused) => opts.onPause?.(paused),
        });

  // ── Boot lifecycle: splash → preload → first frame → ready ──────────────
  // Capture mode wants the real game immediately (headless SVG), so it skips boot.
  const splashCfg = def.splash === false ? null : def.splash ?? {};
  const showSplash = splashCfg !== null && !capture;
  const splashFrame = showSplash ? makeSplash(splashCfg!, def, width, height) : null;
  // Hold the cover at least this long; a game may lengthen it via minDurationMs.
  // With splash:false there is no cover, no hold, and no chime — boot is immediate.
  const minDur = splashCfg ? splashCfg.minDurationMs ?? BOOT_COLD_OPEN_MS : 0;
  let booting = !capture;
  const readyCbs: Array<() => void> = [];
  let resolveReady!: () => void;
  const ready = new Promise<void>((r) => (resolveReady = r));
  const bootStart = performance.now();
  // Fire the chime WITH the cover so the logo reveal and the sound land together
  // (no-op headless/muted, or when a game opts out of the splash).
  if (showSplash) audio.bootChime();

  let last = performance.now();
  const finishBoot = () => {
    if (!booting) return;
    booting = false;
    last = performance.now(); // don't hand the first real frame a boot-sized dt
    renderFrame();
    resolveReady();
    for (const cb of readyCbs.splice(0)) cb();
  };

  // One real frame: sample sources → advance → render. Shared verbatim by the
  // wall-clock loop and handle.tick() so tool-driven stepping IS the loop.
  const perFrame = (dtMs: number) => {
    if (!capture && !(shell?.isPaused) && !opts.isHeld?.() && !debugPane?.held) {
      pointer.sample(world.input); // pointer.x/y/down into axes before the step reads them
      for (const s of extraSources) s.sample(world.input);
      const actions = input.currentActions();
      const steps = world.advance(dtMs, actions);
      if (steps > 0) {
        input.clearPressed(); // virtual taps held until sampled
        opts.onAdvance?.(world, steps, actions);
      }
    }
    renderFrame();
  };

  // ── Frame scheduler: native rAF when visible, setTimeout when hidden ─────
  // rAF is throttled to death in hidden tabs/iframes, so the engine owns the
  // fallback (games must NOT patch the global requestAnimationFrame — that
  // road ends in double-fires and shared-slot races; see the 2026-07 triage).
  // Gate on document.hidden ONLY — hasFocus() is false for a merely-unfocused
  // window whose rAF still runs fine, and gating on it stalls the game.
  // Exactly one callback is pending at a time, and each timeout closes over
  // its own callback (no shared slot); visibilitychange re-arms the pending
  // callback onto the other mechanism.
  let raf = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pendingCb: FrameRequestCallback | null = null;
  let stopped = false;
  const HIDDEN_TICK_MS = 16;
  const clearScheduled = () => {
    if (raf !== 0) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };
  const schedule = (cb: FrameRequestCallback) => {
    if (stopped) return;
    pendingCb = cb;
    if (document.hidden) {
      timer = setTimeout(() => {
        timer = undefined;
        pendingCb = null;
        cb(performance.now());
      }, HIDDEN_TICK_MS);
    } else {
      raf = requestAnimationFrame((now) => {
        raf = 0;
        pendingCb = null;
        cb(now);
      });
    }
  };
  const onVisibility = () => {
    const cb = pendingCb;
    if (cb === null) return; // mid-frame or stopped; the next schedule() re-reads hidden
    clearScheduled();
    pendingCb = null;
    schedule(cb);
  };
  document.addEventListener('visibilitychange', onVisibility);

  const loop = (now: number) => {
    if (booting) {
      if (splashFrame) renderer.draw(splashFrame(now - bootStart, minDur));
      schedule(loop);
      return;
    }
    const dt = now - last;
    last = now;
    perFrame(dt);
    schedule(loop);
  };
  schedule(loop);

  if (booting) {
    const preload = def.preload ? Promise.resolve().then(() => def.preload!(world)) : Promise.resolve();
    const holdSplash = new Promise<void>((r) => setTimeout(r, Math.max(0, minDur - (performance.now() - bootStart))));
    Promise.all([preload, holdSplash])
      .then(finishBoot)
      .catch((err) => {
        console.error('hayao: preload failed —', err);
        finishBoot(); // never strand the player on the splash
      });
  } else {
    resolveReady();
  }

  const handle: GameHandle = {
    get world() {
      return world;
    },
    renderer,
    input,
    pointer,
    canvas: renderer.element,
    toDesign: (clientX, clientY) => renderer.toDesign?.(clientX, clientY) ?? { x: clientX, y: clientY },
    viewport: () => renderer.viewport?.(),
    ready,
    onReady(cb) {
      if (booting) readyCbs.push(cb);
      else cb();
    },
    addSource(source: InputSource) {
      extraSources.push(source);
      return () => {
        const i = extraSources.indexOf(source);
        if (i !== -1) extraSources.splice(i, 1);
        source.dispose?.();
      };
    },
    tick(dtMs) {
      perFrame(dtMs ?? world.clock.stepMs);
    },
    stop() {
      stopped = true;
      pendingCb = null;
      clearScheduled();
      if (bleedRaf !== 0 && typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(bleedRaf);
      resizeObserver?.disconnect();
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', scheduleBleed);
        window.removeEventListener('orientationchange', scheduleBleed);
      }
      document.removeEventListener('visibilitychange', onVisibility);
      input.dispose();
      pointer.dispose();
      for (const s of extraSources) s.dispose?.();
      extraSources.length = 0;
      menuPad?.dispose();
      debugPane?.dispose();
      shell?.dispose();
      renderer.dispose?.();
    },
    restart,
  };

  if (capture) {
    installCapture({
      get world() {
        return world;
      },
      stepOnce: (actions = []) => {
        world.step(actions);
        renderFrame();
      },
      renderSVG: () => renderToSVGString(world.render(), width, height, background),
      setPaused: () => {},
    });
  }

  return handle;
}
