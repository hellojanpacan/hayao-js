// Browser driver: mounts a renderer, samples real input into the fixed-step
// kernel, projects to the renderer each frame, and wires audio + the pause shell.
// Wall-clock only feeds the accumulator (how many steps to run) — replays use the
// input log, not wall time, so the sim stays deterministic.

import type { CreateWorldOptions, GameDefinition, SplashConfig } from './game';
import { createWorld } from './game';
import { KeyboardSource, PointerSource, type InputSource } from '../input/source';
import type { Vec2 } from '../core/math';
import type { DrawCommand } from '../render/commands';
import { relLuminance } from '../verify/gates';
import { SvgRenderer } from '../render/svg';
import { Canvas2DRenderer } from '../render/canvas';
import { WebGL2Renderer } from '../render/webgl';
import type { Renderer, Viewport } from '../render/renderer';
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
   * exactly. Studio's session recorder rides this; it must never mutate.
   */
  onAdvance?: (world: World, steps: number, actions: readonly string[]) => void;
  /** Shell pause/resume observer (true = paused). */
  onPause?: (paused: boolean) => void;
  /**
   * Freeze gate: while it returns true the loop keeps rendering but runs no
   * steps (no pause overlay — Studio's scrubber holds the sim with this).
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

/**
 * A palette-guaranteed splash display list. The fg is picked to clear the WCAG AA
 * bar against the bg, so the boot cover can never ship the low-contrast defect a
 * hand-rolled loading <div> can (that's the whole reason this lives in the engine).
 */
function splashCommands(cfg: SplashConfig, def: GameDefinition, width: number, height: number): DrawCommand[] {
  const bg = cfg.palette?.bg ?? '#141821';
  // Guaranteed-contrast ink: whichever of near-black / near-white reads on the bg.
  const fg = cfg.palette?.fg ?? (relLuminance(bg) > 0.4 ? '#14171f' : '#f4efe3');
  const title = cfg.title ?? def.title;
  const t = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  return [
    { kind: 'rect', x: 0, y: 0, w: width, h: height, fill: bg, transform: t, z: 0 },
    { kind: 'text', text: title, x: width / 2, y: height / 2, size: Math.round(height * 0.06), align: 'center', weight: 700, fill: fg, transform: t, z: 1 },
    { kind: 'text', text: 'loading…', x: width / 2, y: height / 2 + height * 0.08, size: Math.round(height * 0.03), align: 'center', fill: fg, opacity: 0.7, transform: t, z: 1 },
  ];
}

export function runBrowser(def: GameDefinition, mount: HTMLElement, opts: RunOptions = {}): GameHandle {
  const width = def.width ?? 1280;
  const height = def.height ?? 720;
  const background = def.background ?? '#f3ecdb';

  let world = createWorld(def, opts.world);
  const renderer: Renderer =
    opts.renderer === 'canvas'
      ? new Canvas2DRenderer({ width, height, background })
      : opts.renderer === 'webgl'
        ? new WebGL2Renderer({ width, height, background })
        : new SvgRenderer({ width, height, background });

  mount.style.position = mount.style.position || 'relative';
  renderer.mount?.(mount);
  setOverlayHost(mount);

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
    world = createWorld(def, opts.world);
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
  const splash = splashCfg && !capture ? splashCommands(splashCfg, def, width, height) : null;
  let booting = !capture;
  const readyCbs: Array<() => void> = [];
  let resolveReady!: () => void;
  const ready = new Promise<void>((r) => (resolveReady = r));
  const bootStart = performance.now();

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
      if (splash) renderer.draw(splash);
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
    const minDur = splashCfg?.minDurationMs ?? 0;
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
