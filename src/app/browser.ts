// Browser driver: mounts a renderer, samples real input into the fixed-step
// kernel, projects to the renderer each frame, and wires audio + the pause shell.
// Wall-clock only feeds the accumulator (how many steps to run) — replays use the
// input log, not wall time, so the sim stays deterministic.

import type { GameDefinition } from './game';
import { createWorld } from './game';
import { KeyboardSource } from '../input/source';
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
}

export interface GameHandle {
  world: World;
  renderer: Renderer;
  /** The live input source — game UI calls input.press('action') for buttons. */
  input: KeyboardSource;
  stop(): void;
  restart(): void;
}

export function runBrowser(def: GameDefinition, mount: HTMLElement, opts: RunOptions = {}): GameHandle {
  const width = def.width ?? 1280;
  const height = def.height ?? 720;
  const background = def.background ?? '#f3ecdb';

  let world = createWorld(def);
  const renderer: Renderer =
    opts.renderer === 'canvas'
      ? new Canvas2DRenderer({ width, height, background })
      : new SvgRenderer({ width, height, background });

  mount.style.position = mount.style.position || 'relative';
  renderer.mount?.(mount);
  setOverlayHost(mount);

  const input = new KeyboardSource(def.inputMap ?? {}, document);
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
    world = createWorld(def);
    renderFrame();
  };

  const shell =
    opts.shell === false
      ? null
      : new Shell({
          title: def.title,
          onRestart: opts.onRestart ?? restart,
          onPause: () => {},
        });

  let raf = 0;
  let last = performance.now();
  const loop = (now: number) => {
    const dt = now - last;
    last = now;
    if (!capture && !(shell?.isPaused)) {
      const steps = world.advance(dt, input.currentActions());
      if (steps > 0) input.clearPressed(); // virtual taps held until sampled
    }
    renderFrame();
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  const handle: GameHandle = {
    get world() {
      return world;
    },
    renderer,
    input,
    stop() {
      cancelAnimationFrame(raf);
      input.dispose();
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
