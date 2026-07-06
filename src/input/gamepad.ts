// Gamepad input source — polls navigator.getGamepads() each step, writes
// quantized analog axes into InputState.axes, and routes digital buttons
// through a KeyboardSource so they enter the same deterministic action log
// as keys (record/replay + lockstep netplay for free).
//
// Mirrors the PointerSource contract: implement sample(input) + dispose().

import { dhypot } from '../core/dmath';
import { snapAxis, type InputState } from './actions';
import type { KeyboardSource } from './source';

/** A mapping from Gamepad.buttons indices to action names. */
export type GamepadMap = Record<number, string>;

export interface GamepadSourceOptions {
  /**
   * Gamepad index (0–3). Default 0.
   * Tip: listen for the 'gamepadconnected' event to discover the right index;
   * the first connected controller is always index 0.
   */
  index?: number;
  /**
   * Bucket count for quantizing analog stick values (±1 range).
   * Higher = finer precision, larger axes log. Default 128 (~0.016 resolution).
   */
  stickBuckets?: number;
  /**
   * Bucket count for quantizing trigger values (0..1 range).
   * Default 64 (~0.016 resolution).
   */
  triggerBuckets?: number;
  /**
   * Deadzone magnitude radius (0..1) applied to each stick independently before
   * quantization. Values below this threshold are snapped to zero; above it the
   * range is remapped to 0..1 so the output always uses the full scale.
   * Default 0.12 (typical hardware drift).
   */
  deadzone?: number;
  /**
   * Gamepad button index → action name. Pressed buttons call
   * `keyboard.setHeld(action, on)` so they enter the SAME deterministic action
   * log as keys and are covered by record/replay + netplay.
   * Defaults to DEFAULT_GAMEPAD_MAP (face buttons + d-pad mapped to common actions).
   */
  buttonMap?: GamepadMap;
  /**
   * The KeyboardSource to drive actions through. Required for button→action
   * routing. Typically `handle.input` from the GameHandle returned by runBrowser.
   */
  keyboard?: KeyboardSource;
}

/**
 * Axis keys written each step:
 *
 *   gamepad.lx / gamepad.ly   — left stick, ±1 (after deadzone + quantize)
 *   gamepad.rx / gamepad.ry   — right stick, ±1
 *   gamepad.lt / gamepad.rt   — left / right trigger, 0..1
 *   gamepad.dpad.x            — d-pad horizontal, −1 / 0 / +1
 *   gamepad.dpad.y            — d-pad vertical,   −1 / 0 / +1 (−1 = up)
 *
 * Read them in the sim with `world.input.axis('gamepad.lx')`.
 *
 * Determinism note: axes written by sample() are live host samples and are NOT
 * part of the string input log or world.hash() by default. Buttons routed
 * through a KeyboardSource DO enter the log. For bit-exact analog replay, pass
 * quantized axes as the second argument to world.step(actions, axes) — they
 * then enter getState() → hash and InputRecorder.
 */
export class GamepadSource {
  private index: number;
  private stickBuckets: number;
  private triggerBuckets: number;
  private deadzone: number;
  private buttonMap: GamepadMap;
  private keyboard: KeyboardSource | undefined;
  /** Track which buttons were pressed last frame to detect edge transitions. */
  private prevPressed = new Map<number, boolean>();

  constructor(opts: GamepadSourceOptions = {}) {
    this.index = opts.index ?? 0;
    this.stickBuckets = opts.stickBuckets ?? 128;
    this.triggerBuckets = opts.triggerBuckets ?? 64;
    this.deadzone = opts.deadzone ?? 0.12;
    this.buttonMap = opts.buttonMap ?? DEFAULT_GAMEPAD_MAP;
    this.keyboard = opts.keyboard;
  }

  /**
   * Write the current gamepad state into InputState axes (quantized). Call once
   * per fixed step, before world.advance() — the browser driver does this via
   * the `sources` option in RunOptions. See also: runBrowser, GameHandle.
   */
  sample(input: InputState): void {
    const pad = navigator.getGamepads?.()[this.index] ?? null;
    if (!pad) return;

    // -- Analog sticks (with circular deadzone) --------------------------------
    const applyDeadzone = (x: number, y: number): { x: number; y: number } => {
      const mag = dhypot(x, y);
      if (mag < this.deadzone) return { x: 0, y: 0 };
      const scale = (mag - this.deadzone) / (1 - this.deadzone);
      const clampedMag = Math.min(scale, 1);
      return { x: (x / mag) * clampedMag, y: (y / mag) * clampedMag };
    };

    const ls = applyDeadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0);
    const rs = applyDeadzone(pad.axes[2] ?? 0, pad.axes[3] ?? 0);

    const qs = (v: number) => snapAxis(v, this.stickBuckets, -1, 1);
    const qt = (v: number) => snapAxis(v, this.triggerBuckets, 0, 1);

    input.axes.set('gamepad.lx', qs(ls.x));
    input.axes.set('gamepad.ly', qs(ls.y));
    input.axes.set('gamepad.rx', qs(rs.x));
    input.axes.set('gamepad.ry', qs(rs.y));

    // -- Triggers (standard layout: index 6 = LT, 7 = RT) ---------------------
    input.axes.set('gamepad.lt', qt(pad.buttons[6]?.value ?? 0));
    input.axes.set('gamepad.rt', qt(pad.buttons[7]?.value ?? 0));

    // -- D-pad as axes (standard layout: 12=up 13=down 14=left 15=right) ------
    const du = pad.buttons[12]?.pressed ? 1 : 0;
    const dd = pad.buttons[13]?.pressed ? 1 : 0;
    const dl = pad.buttons[14]?.pressed ? 1 : 0;
    const dr = pad.buttons[15]?.pressed ? 1 : 0;
    input.axes.set('gamepad.dpad.x', dr - dl);
    input.axes.set('gamepad.dpad.y', dd - du);

    // -- Buttons → deterministic action log (via KeyboardSource.setHeld) -------
    if (this.keyboard) {
      for (const [btnStr, action] of Object.entries(this.buttonMap)) {
        const idx = Number(btnStr);
        const pressed = pad.buttons[idx]?.pressed ?? false;
        this.keyboard.setHeld(action, pressed);
        this.prevPressed.set(idx, pressed);
      }
    }
  }

  /**
   * Release all held actions and clean up. Call when removing the source or
   * switching gamepads.
   */
  dispose(): void {
    if (this.keyboard) {
      for (const action of Object.values(this.buttonMap)) {
        this.keyboard.releaseHeld(action);
      }
    }
    this.prevPressed.clear();
  }
}

/**
 * Standard Gamepad API button mapping for a "Standard Gamepad" layout
 * (Xbox / PlayStation / Switch Pro controllers).
 *
 *   Index  Xbox        PlayStation   Action
 *   0      A           Cross         confirm
 *   1      B           Circle        cancel
 *   2      X           Square        action2
 *   3      Y           Triangle      action
 *   8      Select/View Share         restart (hold to restart)
 *   9      Start/Menu  Options       confirm (pause menu OK)
 *   12     D-pad up                  up
 *   13     D-pad down                down
 *   14     D-pad left                left
 *   15     D-pad right               right
 *
 * Triggers (6/7) and bumpers (4/5) are intentionally omitted — their analog
 * values are exposed as gamepad.lt / gamepad.rt axes instead, and games can
 * add them to a custom map if they want discrete actions.
 */
export const DEFAULT_GAMEPAD_MAP: GamepadMap = {
  0: 'confirm',
  1: 'cancel',
  2: 'action2',
  3: 'action',
  9: 'confirm',
  12: 'up',
  13: 'down',
  14: 'left',
  15: 'right',
};
