// Gamepad navigation for DOM menu screens. The overlay owns keyboard/mouse;
// this poller owns the pad: d-pad / left stick moves the focus ring, Ⓐ
// activates, Ⓑ cancels, left/right adjusts sliders — through the SAME
// `screenNav()` seam the keyboard uses, so behaviour can't drift apart.
//
// Polls on its own rAF only while a screen is actually up (the check is one
// null-compare per frame otherwise). Wall-clock is fine here: menus are DOM
// chrome, outside the deterministic sim by doctrine.

import { screenNav } from './overlay';

export interface MenuGamepadOptions {
  /** Stick deflection that counts as a direction. Default 0.5. */
  deadzone?: number;
  /** ms before a held direction starts repeating. Default 400. */
  repeatDelayMs?: number;
  /** ms between repeats while held. Default 150. */
  repeatMs?: number;
}

const BTN_CONFIRM = 0; // Ⓐ / Cross
const BTN_CANCEL = 1; // Ⓑ / Circle
const DPAD = { up: 12, down: 13, left: 14, right: 15 } as const;

/**
 * Start gamepad navigation for menu screens. Runs for the life of the page
 * unless disposed; `runBrowser` starts one per game by default
 * (RunOptions.menuGamepad: false opts out).
 */
export class MenuGamepad {
  private deadzone: number;
  private repeatDelayMs: number;
  private repeatMs: number;
  private raf = 0;
  private disposed = false;
  /** Per-control previous state for edge detection. */
  private prev = new Map<string, boolean>();
  /** Repeat bookkeeping for held directions: control → next fire time. */
  private nextFire = new Map<string, number>();

  constructor(opts: MenuGamepadOptions = {}) {
    this.deadzone = opts.deadzone ?? 0.5;
    this.repeatDelayMs = opts.repeatDelayMs ?? 400;
    this.repeatMs = opts.repeatMs ?? 150;
    if (typeof requestAnimationFrame !== 'undefined' && typeof navigator !== 'undefined') {
      const loop = (now: number) => {
        if (this.disposed) return;
        this.poll(now);
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    }
  }

  /**
   * Edge detection with hold-to-repeat for directions, edge-only for buttons.
   * Returns true when the control should fire this frame.
   */
  private fires(key: string, down: boolean, now: number, repeats: boolean): boolean {
    const was = this.prev.get(key) ?? false;
    this.prev.set(key, down);
    if (!down) {
      this.nextFire.delete(key);
      return false;
    }
    if (!was) {
      if (repeats) this.nextFire.set(key, now + this.repeatDelayMs);
      return true;
    }
    if (!repeats) return false;
    const at = this.nextFire.get(key) ?? Infinity;
    if (now >= at) {
      this.nextFire.set(key, now + this.repeatMs);
      return true;
    }
    return false;
  }

  private poll(now: number): void {
    const nav = screenNav();
    if (!nav) {
      // No screen up: drop stale press state so a button held across the
      // screen opening doesn't fire instantly.
      if (this.prev.size) {
        this.prev.clear();
        this.nextFire.clear();
      }
      return;
    }
    if (!navigator.getGamepads) return;
    for (const pad of navigator.getGamepads()) {
      if (!pad) continue;
      const btn = (i: number) => pad.buttons[i]?.pressed ?? false;
      const id = pad.index;
      const up = btn(DPAD.up) || (pad.axes[1] ?? 0) < -this.deadzone;
      const down = btn(DPAD.down) || (pad.axes[1] ?? 0) > this.deadzone;
      const left = btn(DPAD.left) || (pad.axes[0] ?? 0) < -this.deadzone;
      const right = btn(DPAD.right) || (pad.axes[0] ?? 0) > this.deadzone;
      if (this.fires(`${id}.up`, up, now, true)) nav.move(-1);
      if (this.fires(`${id}.down`, down, now, true)) nav.move(1);
      if (this.fires(`${id}.left`, left, now, true)) nav.adjust(-1);
      if (this.fires(`${id}.right`, right, now, true)) nav.adjust(1);
      if (this.fires(`${id}.confirm`, btn(BTN_CONFIRM), now, false)) nav.select();
      if (this.fires(`${id}.cancel`, btn(BTN_CANCEL), now, false)) nav.cancel();
    }
  }

  dispose(): void {
    this.disposed = true;
    if (this.raf && typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(this.raf);
  }
}
