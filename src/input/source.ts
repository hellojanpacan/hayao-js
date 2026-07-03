// Browser input source: tracks physical keys and maps them to actions each step.
// Kept separate from InputState so the pure sim never imports DOM.

import { keysToActions, type InputMap } from './actions';

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
