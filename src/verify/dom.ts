// verify/dom — prove the ONE layer the headless proofs cannot see: the browser
// host controls (virtual sticks, buttons, pointer/touch aim). It boots the real
// `runBrowser` wiring under a DOM (jsdom/happy-dom), lets a test fire synthetic
// pointer/touch events, and then steps the sim so you can assert on `probe()`.
// This extends "prove it, don't vibe it" to the human-contact edge.
//
// Requires a DOM environment. In a Vitest file, opt in with:  // @vitest-environment jsdom
//
// Note: under jsdom `getBoundingClientRect()` returns a zero rect, so the
// letterbox maps client px 1:1 to design px — pass DESIGN coordinates straight
// to `touchDown(id, x, y)` and the sim sees them unchanged.

import { runBrowser, type GameHandle } from '../app/browser';
import type { GameDefinition } from '../app/game';

export interface DomHarness {
  /** The live game handle (world, input, pointer, renderer, viewport…). */
  handle: GameHandle;
  /** Press a finger/pointer down at design (x,y) with a stable id (default 1). */
  touchDown(x: number, y: number, id?: number): void;
  /** Move a tracked finger/pointer to design (x,y). */
  touchMove(x: number, y: number, id?: number): void;
  /** Lift a finger/pointer (default id 1). */
  touchUp(id?: number): void;
  /**
   * Sample the live pointer + keyboard input into the sim, then run `n` fixed
   * steps — the same order `runBrowser` uses, minus wall-clock. Held/virtual
   * actions and quantized axes flow through exactly as in production.
   */
  step(n?: number, axes?: Record<string, number>): void;
  dispose(): void;
}

function synthPointer(type: string, x: number, y: number, id: number): Event {
  const e = new Event(type, { bubbles: true }) as Event & { clientX: number; clientY: number; pointerId: number; button: number };
  e.clientX = x;
  e.clientY = y;
  e.pointerId = id;
  e.button = 0;
  return e;
}

/**
 * Boot a game's real host wiring under the DOM for a host-layer test. The loop is
 * frozen (`isHeld`) so stepping is deterministic and test-driven — call `step()`
 * after firing input. Attach a `TouchControls` to `harness.handle` to prove a
 * virtual gamepad end-to-end.
 */
export function bootDom(def: GameDefinition, mount?: HTMLElement): DomHarness {
  if (typeof document === 'undefined') {
    throw new Error("verify/dom: no DOM found — set the test's environment to jsdom (// @vitest-environment jsdom).");
  }
  const owned = !mount;
  const host = mount ?? document.createElement('div');
  if (owned) document.body.appendChild(host);

  const handle = runBrowser(def, host, { shell: false, isHeld: () => true });
  const el = handle.canvas as EventTarget | undefined;

  return {
    handle,
    touchDown(x, y, id = 1) {
      el?.dispatchEvent(synthPointer('pointerdown', x, y, id));
    },
    touchMove(x, y, id = 1) {
      el?.dispatchEvent(synthPointer('pointermove', x, y, id));
    },
    touchUp(id = 1) {
      // Release listens on the window (a finger lifted off-canvas still ends it).
      globalThis.dispatchEvent?.(synthPointer('pointerup', 0, 0, id));
    },
    step(n = 1, axes) {
      for (let i = 0; i < n; i++) {
        handle.pointer.sample(handle.world.input);
        handle.world.step(handle.input.currentActions(), axes);
        handle.input.clearPressed();
      }
    },
    dispose() {
      handle.stop();
      if (owned) host.remove();
    },
  };
}
