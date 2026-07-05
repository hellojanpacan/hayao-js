// Browser input source: tracks physical keys and maps them to actions each step.
// Kept separate from InputState so the pure sim never imports DOM.

import { keysToActions, type InputMap, type InputState } from './actions';
import type { Vec2 } from '../core/math';

export class KeyboardSource {
  private keysDown = new Set<string>();
  /** Virtual action taps (from DOM buttons etc.) pending consumption by a step. */
  private pressed = new Set<string>();
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

  /** The actions currently held down, as a stable sorted array. */
  currentActions(): string[] {
    const acts = keysToActions(this.map, this.keysDown);
    if (this.pressed.size === 0) return acts;
    const merged = new Set(acts);
    for (const a of this.pressed) merged.add(a);
    return [...merged].sort();
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
}

/** What a PointerSource needs from a renderer: the DOM node + the design mapper. */
export interface PointerTarget {
  readonly element?: HTMLElement | SVGElement;
  toDesign?(clientX: number, clientY: number): Vec2;
}

/**
 * Continuous pointer / touch input — the sibling of KeyboardSource for games
 * driven by *where* the cursor is (slice, aim, drag, point-and-click, placement).
 * It listens on the renderer's canvas, converts every event to DESIGN space via
 * `renderer.toDesign`, and each fixed step writes the sample into InputState's
 * analog axes: `pointer.x`, `pointer.y`, `pointer.down` (1/0). Sim code then
 * reads `world.input.axis('pointer.x')` — no out-of-engine letterbox glue.
 *
 * Determinism note: axes are host-sampled live input and are NOT part of the
 * string input log or the world hash. `sample()` QUANTIZES design coords to a
 * 1/8-px grid so a recorded axes log (Studio sessions) replays bit-exactly —
 * the sim only ever sees the quantized values, live or replayed. For lockstep
 * netplay, still prefer discrete actions (map a tap to a key via
 * KeyboardSource.press, or snap position to a grid cell). See docs/CONVENTIONS.md.
 */
export class PointerSource {
  private clientX = 0;
  private clientY = 0;
  private isDown = false;
  private seen = false;
  private target: PointerTarget;
  private el: EventTarget | undefined;
  private onMove: (e: PointerEvent) => void;
  private onDown: (e: PointerEvent) => void;
  private onUp: (e: PointerEvent) => void;

  constructor(target: PointerTarget) {
    this.target = target;
    this.el = target.element;
    this.onMove = (e) => {
      this.clientX = e.clientX;
      this.clientY = e.clientY;
      this.seen = true;
    };
    this.onDown = (e) => {
      this.clientX = e.clientX;
      this.clientY = e.clientY;
      this.isDown = true;
      this.seen = true;
    };
    this.onUp = () => {
      this.isDown = false;
    };
    this.el?.addEventListener('pointermove', this.onMove as EventListener);
    this.el?.addEventListener('pointerdown', this.onDown as EventListener);
    // Release anywhere counts — a finger lifted off the canvas still ends the press.
    globalThis.addEventListener?.('pointerup', this.onUp as EventListener);
    globalThis.addEventListener?.('pointercancel', this.onUp as EventListener);
  }

  /** The current pointer position in design space + press state. */
  read(): PointerReadout {
    const p = this.target.toDesign?.(this.clientX, this.clientY) ?? { x: 0, y: 0 };
    return { x: p.x, y: p.y, down: this.isDown, active: this.seen };
  }

  /**
   * Write the current sample into an InputState's axes as pointer.x / pointer.y /
   * pointer.down. Call once per step (the browser driver does this before advance).
   */
  sample(input: InputState): void {
    const r = this.read();
    // 1/8-px grid: sub-pixel precision no game needs, exact float replay for free.
    const q = (v: number) => Math.round(v * 8) / 8;
    input.axes.set('pointer.x', q(r.x));
    input.axes.set('pointer.y', q(r.y));
    input.axes.set('pointer.down', r.down ? 1 : 0);
  }

  dispose(): void {
    this.el?.removeEventListener('pointermove', this.onMove as EventListener);
    this.el?.removeEventListener('pointerdown', this.onDown as EventListener);
    globalThis.removeEventListener?.('pointerup', this.onUp as EventListener);
    globalThis.removeEventListener?.('pointercancel', this.onUp as EventListener);
  }
}
