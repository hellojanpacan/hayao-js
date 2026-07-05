// Browser driver: mounts a renderer, samples real input into the fixed-step
// kernel, projects to the renderer each frame, and wires audio + the pause shell.
// Wall-clock only feeds the accumulator (how many steps to run) — replays use the
// input log, not wall time, so the sim stays deterministic.

import type { CreateWorldOptions, GameDefinition, SplashConfig } from './game';
import { createWorld } from './game';
import { KeyboardSource, PointerSource } from '../input/source';
import type { Vec2 } from '../core/math';
import type { DrawCommand } from '../render/commands';
import { relLuminance } from '../verify/gates';
import { SvgRenderer } from '../render/svg';
import { Canvas2DRenderer } from '../render/canvas';
import type { Renderer } from '../render/renderer';
import { renderToSVGString } from '../render/svgString';
import { audio } from '../audio/audio';
import { settings } from '../ui/settings';
import { setOverlayHost } from '../ui/overlay';
import { Shell } from '../ui/shell';
import { installCapture, isCaptureMode } from '../verify/capture';
import type { World } from '../world';

export interface RunOptions {
  renderer?: 'svg' | 'canvas';
  /** Start the pause/settings shell (Esc). Default true. */
  shell?: boolean;
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
  /** Resolves after preload completes and the first real frame has rendered. */
  ready: Promise<void>;
  /** Run a callback once the game is ready (fires immediately if already ready). */
  onReady(cb: () => void): void;
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
      : new SvgRenderer({ width, height, background });

  mount.style.position = mount.style.position || 'relative';
  renderer.mount?.(mount);
  setOverlayHost(mount);

  const input = new KeyboardSource(def.inputMap ?? {}, document);
  const pointer = new PointerSource(renderer);
  const capture = isCaptureMode();

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

  const renderFrame = () => renderer.draw(world.render());
  const restart = () => {
    world = createWorld(def, opts.world);
    renderFrame();
  };

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

  let raf = 0;
  let last = performance.now();
  const finishBoot = () => {
    if (!booting) return;
    booting = false;
    last = performance.now(); // don't hand the first real frame a boot-sized dt
    renderFrame();
    resolveReady();
    for (const cb of readyCbs.splice(0)) cb();
  };

  const loop = (now: number) => {
    if (booting) {
      if (splash) renderer.draw(splash);
      raf = requestAnimationFrame(loop);
      return;
    }
    const dt = now - last;
    last = now;
    if (!capture && !(shell?.isPaused) && !opts.isHeld?.()) {
      pointer.sample(world.input); // pointer.x/y/down into axes before the step reads them
      const actions = input.currentActions();
      const steps = world.advance(dt, actions);
      if (steps > 0) {
        input.clearPressed(); // virtual taps held until sampled
        opts.onAdvance?.(world, steps, actions);
      }
    }
    renderFrame();
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

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
    ready,
    onReady(cb) {
      if (booting) readyCbs.push(cb);
      else cb();
    },
    stop() {
      cancelAnimationFrame(raf);
      input.dispose();
      pointer.dispose();
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
