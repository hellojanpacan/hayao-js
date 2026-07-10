// Browser input source: tracks physical keys and maps them to actions each step.
// Kept separate from InputState so the pure sim never imports DOM.
//
// The INPUT-SOURCE CONTRACT (for custom sources like GamepadSource):
//   - Implement sample(input: InputState): void — called once per fixed step,
//     BEFORE world.advance(), to write quantized values into input.axes.
//   - Optionally implement dispose(): void — called when the source is removed.
//   - Axis key naming: dotted namespace, e.g. "gamepad.lx", "pointer.x".
//   - QUANTIZE at the host edge (snapAxis / quantizeAngle) before writing axes
//     so recorded logs replay bit-exactly on any machine.
//   - For discrete input (button press → action), call keyboard.setHeld(action)
//     so presses enter the same deterministic action log as keys.
//   - Axes written by sample() are NOT part of world.hash() by default. To make
//     analog input hash/replay-exact, pass the quantized axes as the second arg
//     to world.step(actions, axes) — they then enter getState() and the log.
//   See docs/CONVENTIONS.md §"Custom input sources" for full details.

import { keysToActions, type InputMap, type InputState } from './actions';

/**
 * Minimal contract for a host-side input source. Implement this to feed any
 * hardware (gamepad, MIDI, accelerometer, on-screen controls) into the sim's
 * InputState.axes without touching the engine internals.
 *
 * The engine samples each registered source once per fixed step, BEFORE
 * world.advance(). Register via RunOptions.sources or GameHandle.addSource().
 */
export interface InputSource {
  /** Write quantized values into input.axes. Called before each world.advance(). */
  sample(input: InputState): void;
  /** Optional cleanup (remove listeners, release held actions). */
  dispose?(): void;
}
import type { Vec2 } from '../core/math';

export class KeyboardSource {
  private keysDown = new Set<string>();
  /** Virtual action taps (from DOM buttons etc.) pending consumption by a step. */
  private pressed = new Set<string>();
  /** Sustained virtual actions (held on-screen controls) — persist until released. */
  private held = new Set<string>();
  private map: InputMap;
  private target: Document | HTMLElement;
  private onDown: (e: KeyboardEvent) => void;
  private onUp: (e: KeyboardEvent) => void;
  private onBlur: () => void;

  constructor(map: InputMap, target: Document | HTMLElement = document) {
    this.map = map;
    this.target = target;
    this.onDown = (e) => {
      this.keysDown.add(e.code);
      // Prevent scroll on arrows/space during play.
      if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
    };
    this.onUp = (e) => this.keysDown.delete(e.code);
    this.onBlur = () => this.keysDown.clear();
    target.addEventListener('keydown', this.onDown as EventListener);
    target.addEventListener('keyup', this.onUp as EventListener);
    globalThis.addEventListener?.('blur', this.onBlur);
  }

  /**
   * Release everything currently held. Embedding hosts call this when focus
   * leaves the game's wrapper (an element-bound source never hears the keyup
   * that happens elsewhere, so a held key would otherwise stick).
   */
  clear(): void {
    this.keysDown.clear();
    this.pressed.clear();
    this.held.clear();
  }

  /** The actions currently held down, as a stable sorted array. */
  currentActions(): string[] {
    // Held entries double as binding codes: PointerSource holds `mouse.right`
    // etc., so a map binding like `shield: ['mouse.right']` resolves exactly
    // like a key code. Held names also pass through as actions themselves.
    const codes = this.held.size === 0 ? this.keysDown : new Set([...this.keysDown, ...this.held]);
    const acts = keysToActions(this.map, codes);
    if (this.pressed.size === 0 && this.held.size === 0) return acts;
    const merged = new Set(acts);
    for (const a of this.pressed) merged.add(a);
    for (const a of this.held) merged.add(a);
    return [...merged].sort();
  }

  /** The action names this source's map can produce (for InputState.declareActions). */
  actionNames(): string[] {
    return Object.keys(this.map);
  }

  /**
   * Virtually tap an action (DOM button, touch control). The tap is held until
   * at least one fixed step has sampled it — the driver calls clearPressed()
   * after a successful advance — so UI clicks enter the SAME deterministic
   * input log as keys, and record/replay covers them.
   */
  press(action: string): void {
    this.pressed.add(action);
  }

  /** Consume pending virtual taps (driver-called after ≥1 step ran). */
  clearPressed(): void {
    this.pressed.clear();
  }

  /**
   * Sustain an action for as long as an on-screen control is held. Unlike
   * `press()` (an edge-shaped tap cleared after one step), a held action models
   * STATE: it stays in `currentActions()` every step until `setHeld(action,
   * false)` / `releaseHeld(action)`. This is what a virtual joystick or
   * hold-to-fire button wants — set it on drag-start, clear it on release, no
   * re-press-per-frame. Held actions still flow through the same deterministic
   * action set as keys.
   */
  setHeld(action: string, on = true): void {
    if (on) this.held.add(action);
    else this.held.delete(action);
  }

  /** Release a sustained action (sugar for `setHeld(action, false)`). */
  releaseHeld(action: string): void {
    this.held.delete(action);
  }

  /** Drop all sustained actions (e.g. on blur / control teardown). */
  clearHeld(): void {
    this.held.clear();
  }

  setMap(map: InputMap): void {
    this.map = map;
  }

  dispose(): void {
    this.target.removeEventListener('keydown', this.onDown as EventListener);
    this.target.removeEventListener('keyup', this.onUp as EventListener);
    globalThis.removeEventListener?.('blur', this.onBlur);
  }
}

/** A live pointer reading, in DESIGN space (already un-letterboxed). */
export interface PointerReadout {
  /** Design-space x. Falls outside 0..width when the pointer leaves the letterbox. */
  x: number;
  y: number;
  /** Is the primary pointer/finger currently pressed? */
  down: boolean;
  /** Has the pointer ever produced an event (else x/y are a neutral 0,0)? */
  active: boolean;
  /** Stable per-touch id (from PointerEvent.pointerId). Absent on the primary hover readout. */
  id?: number;
}

/** What a PointerSource needs from a renderer: the DOM node + the design mapper. */
export interface PointerTarget {
  readonly element?: HTMLElement | SVGElement;
  toDesign?(clientX: number, clientY: number): Vec2;
}

export interface PointerSourceOptions {
  /**
   * Allow the browser's context menu on the attached element. Default false —
   * the menu is suppressed (preventDefault on 'contextmenu') so right-click is
   * usable as game input.
   */
  contextMenu?: boolean;
  /**
   * Route pointer buttons into the deterministic action pipeline: while a
   * button is held, `sample()` calls `keyboard.setHeld('mouse.left' |
   * 'mouse.right' | 'mouse.middle')` so buttons enter the SAME actionsDown log
   * as keys — `justPressed('mouse.right')` works, replays stay exact, and an
   * inputMap can bind them (`shield: ['mouse.right']`). The browser driver
   * wires this to the GameHandle's KeyboardSource automatically.
   */
  keyboard?: KeyboardSource;
  /**
   * Let wheel events scroll the page. Default false — scrolling over the game
   * is game input (`pointer.wheel` axis), so the page must not move under it.
   */
  pageScroll?: boolean;
}

/** The pointer-button action names PointerSource can hold (via its keyboard). */
export const MOUSE_ACTIONS = ['mouse.left', 'mouse.right', 'mouse.middle'] as const;

/**
 * Continuous pointer / touch input — the sibling of KeyboardSource for games
 * driven by *where* the cursor is (slice, aim, drag, point-and-click, placement).
 * It listens on the renderer's canvas, converts every event to DESIGN space via
 * `renderer.toDesign`, and each fixed step writes the sample into InputState's
 * analog axes: `pointer.x`, `pointer.y`, `pointer.down` (1/0), plus
 * `pointer.right` / `pointer.middle` (1/0) for the secondary mouse buttons
 * (the context menu is suppressed by default so right-click is usable — see
 * PointerSourceOptions), `pointer.wheel` (integer scroll notches this step),
 * and `pointer.dx` / `pointer.dy` (relative motion since the last step — the
 * aiming channel under `lockPointer()`). Sim code then reads `world.input.axis('pointer.x')`
 * — no out-of-engine letterbox glue. With `keyboard` wired, buttons also enter
 * the action pipeline as `mouse.left/right/middle` (bindable in an inputMap,
 * `justPressed`-able, replay-exact).
 *
 * Determinism note: axes are host-sampled live input and are NOT part of the
 * string input log or the world hash. `sample()` QUANTIZES design coords to a
 * 1/8-px grid so a recorded axes log (Workshop sessions) replays bit-exactly —
 * the sim only ever sees the quantized values, live or replayed. For lockstep
 * netplay, still prefer discrete actions (map a tap to a key via
 * KeyboardSource.press, or snap position to a grid cell). See docs/CONVENTIONS.md.
 *
 * Multitouch: `read()`/`sample()` describe the PRIMARY pointer (mouse or the
 * most-recent finger) and are byte-identical to the single-pointer past. For
 * dual-stick / multi-finger schemes, read every live touch via `readAll()` —
 * each carries its stable `id` so you can tell which finger is which.
 */
export class PointerSource {
  private clientX = 0;
  private clientY = 0;
  private isDown = false;
  private rightDown = false;
  private middleDown = false;
  private seen = false;
  /** Live touches by pointerId (a pressed finger/button); excludes hover-only mouse. */
  private touches = new Map<number, { clientX: number; clientY: number }>();
  /** Wheel scroll accumulated since the last sample, in normalized px (~100/notch). */
  private wheelAcc = 0;
  /** Relative movement accumulated since the last sample (movementX/Y, client px). */
  private dxAcc = 0;
  private dyAcc = 0;
  private target: PointerTarget;
  private el: EventTarget | undefined;
  private keyboard: KeyboardSource | undefined;
  private onMove: (e: PointerEvent) => void;
  private onDown: (e: PointerEvent) => void;
  private onUp: (e: PointerEvent) => void;
  private onCtx: (e: Event) => void;
  private onWheel: (e: WheelEvent) => void;

  constructor(target: PointerTarget, opts: PointerSourceOptions = {}) {
    this.target = target;
    this.el = target.element;
    this.keyboard = opts.keyboard;
    // Chorded button changes (right pressed while left held) arrive as
    // pointermove per the Pointer Events spec, so every handler reads the
    // `buttons` bitmask (1=left/touch, 2=right, 4=middle) when present.
    const readButtons = (e: PointerEvent): boolean => {
      if (typeof e.buttons !== 'number') return false;
      this.isDown = (e.buttons & 1) !== 0;
      this.rightDown = (e.buttons & 2) !== 0;
      this.middleDown = (e.buttons & 4) !== 0;
      return true;
    };
    this.onMove = (e) => {
      this.clientX = e.clientX;
      this.clientY = e.clientY;
      this.seen = true;
      // Relative motion (the pointer-lock channel; also live unlocked).
      this.dxAcc += e.movementX ?? 0;
      this.dyAcc += e.movementY ?? 0;
      // Hover-only moves carry buttons=0 and must not clear a press tracked
      // from pointerdown — only chorded changes (some button held) apply.
      if (typeof e.buttons === 'number' && e.buttons !== 0) readButtons(e);
      const t = this.touches.get(e.pointerId);
      if (t) {
        t.clientX = e.clientX;
        t.clientY = e.clientY;
      }
    };
    this.onDown = (e) => {
      this.clientX = e.clientX;
      this.clientY = e.clientY;
      this.seen = true;
      if (!readButtons(e)) {
        // No bitmask (stub events in tests): fall back to the changed button.
        if (e.button === 2) this.rightDown = true;
        else if (e.button === 1) this.middleDown = true;
        else this.isDown = true;
      }
      this.touches.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
    };
    this.onUp = (e) => {
      if (!readButtons(e)) {
        this.isDown = false;
        if (e.button === 2) this.rightDown = false;
        else if (e.button === 1) this.middleDown = false;
        else {
          this.rightDown = false;
          this.middleDown = false;
        }
      }
      this.touches.delete((e as PointerEvent)?.pointerId);
    };
    // Right-click is game input: suppress the context menu unless opted back in.
    this.onCtx = (e) => e.preventDefault();
    // Wheel is game input too (zoom, weapon cycle): normalize the three delta
    // modes to ~px so a notch reads ≈100 whatever the browser reports.
    this.onWheel = (e) => {
      const scale = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? 400 : 1;
      this.wheelAcc += (e.deltaY ?? 0) * scale;
      if (!opts.pageScroll) e.preventDefault();
    };
    this.el?.addEventListener('wheel', this.onWheel as EventListener, { passive: !!opts.pageScroll });
    this.el?.addEventListener('pointermove', this.onMove as EventListener);
    this.el?.addEventListener('pointerdown', this.onDown as EventListener);
    // A finger lifted on the canvas ends its own touch…
    this.el?.addEventListener('pointerup', this.onUp as EventListener);
    this.el?.addEventListener('pointercancel', this.onUp as EventListener);
    if (!opts.contextMenu) this.el?.addEventListener('contextmenu', this.onCtx);
    // …and release anywhere counts too — lifted off the canvas still ends the press.
    globalThis.addEventListener?.('pointerup', this.onUp as EventListener);
    globalThis.addEventListener?.('pointercancel', this.onUp as EventListener);
  }

  /** The current pointer position in design space + press state. */
  read(): PointerReadout {
    const p = this.target.toDesign?.(this.clientX, this.clientY) ?? { x: 0, y: 0 };
    return { x: p.x, y: p.y, down: this.isDown, active: this.seen };
  }

  /**
   * Every live (pressed) touch in DESIGN space, ordered by ascending id so the
   * array is stable to iterate. Empty when nothing is pressed. This is the
   * multitouch channel — a dual-stick game reads `left = touches[0]`, etc., or
   * partitions by screen half.
   */
  readAll(): PointerReadout[] {
    const ids = [...this.touches.keys()].sort((a, b) => a - b);
    return ids.map((id) => {
      const t = this.touches.get(id)!;
      const p = this.target.toDesign?.(t.clientX, t.clientY) ?? { x: 0, y: 0 };
      return { x: p.x, y: p.y, down: true, active: true, id };
    });
  }

  /**
   * Write the current sample into an InputState's axes as pointer.x / pointer.y /
   * pointer.down, plus pointer.right / pointer.middle (0/1) for the secondary
   * buttons. Call once per step (the browser driver does this before advance).
   *
   * When a keyboard is wired (PointerSourceOptions.keyboard), buttons are ALSO
   * held as actions `mouse.left` / `mouse.right` / `mouse.middle` so they flow
   * through the same deterministic actionsDown log as keys.
   */
  sample(input: InputState): void {
    const r = this.read();
    // 1/8-px grid: sub-pixel precision no game needs, exact float replay for free.
    const q = (v: number) => Math.round(v * 8) / 8;
    input.axes.set('pointer.x', q(r.x));
    input.axes.set('pointer.y', q(r.y));
    input.axes.set('pointer.down', r.down ? 1 : 0);
    input.axes.set('pointer.right', this.rightDown ? 1 : 0);
    input.axes.set('pointer.middle', this.middleDown ? 1 : 0);
    // Wheel: integer notches this step (~100 normalized px each); the sub-notch
    // remainder carries over so trackpad micro-deltas accumulate instead of dying.
    const notches = Math.trunc(this.wheelAcc / 100);
    this.wheelAcc -= notches * 100;
    input.axes.set('pointer.wheel', notches);
    // Relative motion since the last step (client px, 1/8-px quantized) — THE
    // aiming channel under pointer lock, where absolute x/y stops moving.
    input.axes.set('pointer.dx', q(this.dxAcc));
    input.axes.set('pointer.dy', q(this.dyAcc));
    this.dxAcc = 0;
    this.dyAcc = 0;
    if (this.keyboard) {
      input.declareActions(MOUSE_ACTIONS);
      this.keyboard.setHeld('mouse.left', this.isDown);
      this.keyboard.setHeld('mouse.right', this.rightDown);
      this.keyboard.setHeld('mouse.middle', this.middleDown);
    }
  }

  /**
   * Request pointer lock on the game element (FPS-style relative aiming).
   * Browsers only grant it inside a user gesture — call from a click/key
   * handler. While locked, read `pointer.dx` / `pointer.dy`; the absolute
   * `pointer.x/y` freezes because the OS cursor stops moving.
   */
  lockPointer(): void {
    (this.el as HTMLElement | undefined)?.requestPointerLock?.();
  }

  /** Release pointer lock (also freed by the browser on Esc). */
  unlockPointer(): void {
    if (typeof document !== 'undefined') document.exitPointerLock?.();
  }

  /** Is the pointer currently locked to the game element? */
  get isLocked(): boolean {
    return typeof document !== 'undefined' && !!this.el && document.pointerLockElement === this.el;
  }

  /**
   * Set the CSS cursor over the game ('crosshair', 'grab', 'none' to hide —
   * pair 'none' with a cosmetic in-world cursor sprite).
   */
  setCursor(cursor: string): void {
    const el = this.el as HTMLElement | SVGElement | undefined;
    if (el && 'style' in el) el.style.cursor = cursor;
  }

  dispose(): void {
    if (this.keyboard) for (const a of MOUSE_ACTIONS) this.keyboard.releaseHeld(a);
    this.el?.removeEventListener('wheel', this.onWheel as EventListener);
    this.el?.removeEventListener('pointermove', this.onMove as EventListener);
    this.el?.removeEventListener('pointerdown', this.onDown as EventListener);
    this.el?.removeEventListener('pointerup', this.onUp as EventListener);
    this.el?.removeEventListener('pointercancel', this.onUp as EventListener);
    this.el?.removeEventListener('contextmenu', this.onCtx);
    globalThis.removeEventListener?.('pointerup', this.onUp as EventListener);
    globalThis.removeEventListener?.('pointercancel', this.onUp as EventListener);
  }
}
