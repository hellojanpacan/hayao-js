// Deterministic tweening. Tweens advance by the fixed dt, so animations are
// exactly reproducible. Tweens animate via setter closures (transient visual
// polish — not part of the hashed logic state), Godot AnimationPlayer-style.

import { clamp } from '../core/math';
import { Node } from './node';

export type Easing = (t: number) => number;

const pow = Math.pow;
export const EASINGS: Record<string, Easing> = {
  linear: (t) => t,
  quadIn: (t) => t * t,
  quadOut: (t) => 1 - (1 - t) * (1 - t),
  quadInOut: (t) => (t < 0.5 ? 2 * t * t : 1 - pow(-2 * t + 2, 2) / 2),
  cubicIn: (t) => t * t * t,
  cubicOut: (t) => 1 - pow(1 - t, 3),
  cubicInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - pow(-2 * t + 2, 3) / 2),
  sineIn: (t) => 1 - Math.cos((t * Math.PI) / 2),
  sineOut: (t) => Math.sin((t * Math.PI) / 2),
  sineInOut: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  backOut: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * pow(t - 1, 3) + c1 * pow(t - 1, 2);
  },
  elasticOut: (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  bounceOut: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
};

interface Track {
  apply: (v: number) => void;
  from: number;
  to: number;
  duration: number;
  elapsed: number;
  ease: Easing;
  onDone?: () => void;
  delay: number;
}

/** A node that runs one or more property tweens and reports when they finish. */
export class AnimationPlayer extends Node {
  override readonly type = 'AnimationPlayer';
  private tracks: Track[] = [];

  /**
   * Animate a value from → to over `duration` seconds via `apply(value)`.
   * Returns this for chaining.
   */
  to(
    apply: (v: number) => void,
    from: number,
    to: number,
    duration: number,
    ease: keyof typeof EASINGS | Easing = 'cubicOut',
    opts: { delay?: number; onDone?: () => void } = {},
  ): this {
    this.tracks.push({
      apply,
      from,
      to,
      duration: Math.max(1e-6, duration),
      elapsed: 0,
      ease: typeof ease === 'function' ? ease : EASINGS[ease] ?? EASINGS.linear,
      delay: opts.delay ?? 0,
      onDone: opts.onDone,
    });
    return this;
  }

  get active(): boolean {
    return this.tracks.length > 0;
  }

  /** Signal emitted when all tracks complete. */
  get finished() {
    return this.signal('finished');
  }

  protected override onProcess(dt: number): void {
    if (this.tracks.length === 0) return;
    for (let i = this.tracks.length - 1; i >= 0; i--) {
      const tk = this.tracks[i];
      if (tk.delay > 0) {
        tk.delay -= dt;
        continue;
      }
      tk.elapsed += dt;
      const t = clamp(tk.elapsed / tk.duration, 0, 1);
      tk.apply(tk.from + (tk.to - tk.from) * tk.ease(t));
      if (t >= 1) {
        tk.onDone?.();
        this.tracks.splice(i, 1);
      }
    }
    if (this.tracks.length === 0) this.emit('finished', undefined);
  }
}
