// Deterministic tweening. Tweens advance by the fixed dt, so animations are
// exactly reproducible. Tweens animate via setter closures (transient visual
// polish — not part of the hashed logic state), Godot AnimationPlayer-style.

import { clamp, lerp } from '../core/math';
import { dcos, dexp, dexp2, dsin } from '../core/dmath';
import { Node } from './node';

export type Easing = (t: number) => number;

// ── Framerate-independent smoothing ──────────────────────────────
// The naive `x += (target - x) * k` follows a target, but its stiffness scales
// with frame count: halving dt halves the approach per step. These helpers fold
// dt into an exponential so the same real-time response falls out of any fixed
// step. Feed the FIXED clock dt (never a variable rAF delta) or a lockstep sim
// desyncs. All pure + deterministic (exp routes through dmath), so they are safe
// to use on hashed values as well as cosmetic ones.

/**
 * Exponentially damp `current` toward `target`, framerate-independent.
 * `lambda` is the decay rate (1/s): larger = snappier. Reaches ~63% of the way
 * to the target after 1/lambda seconds regardless of how dt is subdivided.
 */
export const lerpDamp = (current: number, target: number, lambda: number, dt: number): number =>
  lerp(target, current, dexp(-lambda * dt));

/** A critically-damped spring value: rides toward a target with no overshoot. */
export interface SpringState {
  value: number;
  vel: number;
}

/** Make a spring at rest on `value`. */
export const spring = (value = 0): SpringState => ({ value, vel: 0 });

/**
 * Advance a critically-damped spring one fixed step toward `target`. `omega` is
 * the angular frequency (rad/s) — higher snaps faster. Critical damping means it
 * settles as fast as possible without oscillating. Mutates and returns the state.
 * Uses the closed-form solution so it is stable at any dt (no stiffness blow-up).
 */
export function springStep(s: SpringState, target: number, omega: number, dt: number): SpringState {
  const decay = dexp(-omega * dt);
  const d = s.value - target; // displacement from rest
  const c = s.vel + omega * d; // integration constant for x(t) = (d + c·t)·e^(−ωt)
  s.value = target + (d + c * dt) * decay;
  s.vel = (s.vel - c * omega * dt) * decay;
  return s;
}

/**
 * One-liner critically-damped follow that owns its own velocity in a closure —
 * for camera/value chase where you don't want to thread a SpringState around.
 * `settle` is the approximate time (s) to arrive. Returns a `(target, dt) → value`.
 */
export function makeReach(start = 0, settle = 0.25): (target: number, dt: number) => number {
  // omega ≈ 4/settle puts ~98% of the move inside `settle` seconds.
  const omega = 4 / Math.max(1e-4, settle);
  const s = spring(start);
  return (target: number, dt: number) => springStep(s, target, omega, dt).value;
}

// Integer powers are spelled out as multiplication and 2^x routes through
// dexp2: Math.pow is implementation-defined, and eased values land in hashed
// node props, so easings must be bit-identical across engines.
const sq = (x: number) => x * x;
const cube = (x: number) => x * x * x;
export const EASINGS: Record<string, Easing> = {
  linear: (t) => t,
  quadIn: (t) => t * t,
  quadOut: (t) => 1 - (1 - t) * (1 - t),
  quadInOut: (t) => (t < 0.5 ? 2 * t * t : 1 - sq(-2 * t + 2) / 2),
  cubicIn: (t) => t * t * t,
  cubicOut: (t) => 1 - cube(1 - t),
  cubicInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - cube(-2 * t + 2) / 2),
  sineIn: (t) => 1 - dcos((t * Math.PI) / 2),
  sineOut: (t) => dsin((t * Math.PI) / 2),
  sineInOut: (t) => -(dcos(Math.PI * t) - 1) / 2,
  backOut: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * cube(t - 1) + c1 * sq(t - 1);
  },
  elasticOut: (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : dexp2(-10 * t) * dsin((t * 10 - 0.75) * c4) + 1;
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
