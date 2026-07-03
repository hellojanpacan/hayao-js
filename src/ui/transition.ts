// Screen transitions + a cinematic sequencer — the layer between showScreen()
// (a static DOM dialog) and a scripted, animated scene change.
//
// Transition is a COSMETIC scene node that paints a full-screen wipe (fade /
// iris / dither) in SCREEN space, so it sits on top of the camera untouched. It
// runs on the fixed clock dt — not rAF delta — so a lockstep replay wipes
// identically, and because it draws through the display list it renders headless
// (a filmstrip can prove it). The classic move is cover → onMidpoint (swap the
// level) → reveal, all gated off `busy`.
//
// CinematicPlayer walks a list of pure-data steps: each step runs an `enter`
// hook (aim the camera, set text, mutate state) then holds until its duration
// elapses AND its `until` gate passes — which is how you fade-gate advancement
// (step waits on `!transition.busy`). Also cosmetic and dt-driven.

import { clamp, lerp, type Rect, type Transform, IDENTITY } from '../core/math';
import type { DrawCommand } from '../render/commands';
import { Node, type NodeConfig } from '../scene/node';

export type WipeKind = 'fade' | 'circle' | 'dither';

// Ordered 4×4 Bayer matrix (thresholds 0..15) for the dither dissolve.
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const smoothstep = (t: number): number => t * t * (3 - 2 * t);

interface Ramp {
  from: number | undefined; // resolved to current coverage when the ramp starts
  to: number;
  dur: number;
  elapsed: number;
  onEnd?: () => void;
}

export interface WipeOptions {
  /** Seconds to cover the screen (default 0.4). */
  cover?: number;
  /** Seconds to hold fully covered before revealing (default 0). */
  hold?: number;
  /** Seconds to reveal the scene again (default = cover). */
  reveal?: number;
  /** Fired at full cover — swap the level/scene here. */
  onMidpoint?: () => void;
  /** Fired once the reveal finishes. */
  onDone?: () => void;
}

export interface TransitionConfig extends NodeConfig {
  kind?: WipeKind;
  /** Overlay colour. */
  color?: string;
  /** Screen size in px (pass world.width / world.height). */
  width?: number;
  height?: number;
  /** Dither cell size in px (default 28). */
  cell?: number;
}

/**
 * A full-screen wipe overlay. Add it to the tree (cosmetic), then drive it with
 * `cover()` / `reveal()` / `wipe()`. `coverage` runs 0 (clear) → 1 (opaque).
 */
export class ScreenTransition extends Node {
  override readonly type: string = 'ScreenTransition';
  kind: WipeKind;
  color: string;
  screenW: number;
  screenH: number;
  cell: number;
  /** 0 = fully clear, 1 = fully covering. */
  coverage = 0;
  private queue: Ramp[] = [];

  constructor(config: TransitionConfig = {}) {
    super(config);
    this.cosmetic = true;
    this.kind = config.kind ?? 'fade';
    this.color = config.color ?? '#1a1410';
    this.screenW = config.width ?? 1280;
    this.screenH = config.height ?? 720;
    this.cell = config.cell ?? 28;
  }

  /** True while a wipe is animating. */
  get busy(): boolean {
    return this.queue.length > 0;
  }

  private enqueue(to: number, dur: number, onEnd?: () => void): void {
    this.queue.push({ from: undefined, to, dur: Math.max(1e-4, dur), elapsed: 0, onEnd });
  }

  /** Animate the overlay to fully covering over `dur` seconds. */
  cover(dur = 0.4, onEnd?: () => void): this {
    this.enqueue(1, dur, onEnd);
    return this;
  }

  /** Animate the overlay back to fully clear over `dur` seconds. */
  reveal(dur = 0.4, onEnd?: () => void): this {
    this.enqueue(0, dur, onEnd);
    return this;
  }

  /** Hold the current coverage for `dur` seconds (chains after cover/reveal). */
  hold(dur: number, onEnd?: () => void): this {
    // Target the pending end-state so a mid-queue hold keeps that coverage.
    const target = this.queue.length ? this.queue[this.queue.length - 1].to : this.coverage;
    this.enqueue(target, dur, onEnd);
    return this;
  }

  /** The classic cover → onMidpoint → reveal sequence. Returns this for chaining. */
  wipe(opts: WipeOptions = {}): this {
    const cover = opts.cover ?? 0.4;
    this.cover(cover, () => {
      this.emit('covered', undefined);
      opts.onMidpoint?.();
    });
    if (opts.hold) this.hold(opts.hold);
    this.reveal(opts.reveal ?? cover, () => {
      this.emit('done', undefined);
      opts.onDone?.();
    });
    return this;
  }

  /** Signal emitted at full cover (the midpoint). */
  get covered() {
    return this.signal('covered');
  }
  /** Signal emitted when a wipe fully finishes revealing. */
  get done() {
    return this.signal('done');
  }

  protected override onProcess(dt: number): void {
    const step = this.queue[0];
    if (!step) return;
    if (step.from === undefined) step.from = this.coverage;
    step.elapsed += dt;
    const t = clamp(step.elapsed / step.dur, 0, 1);
    this.coverage = lerp(step.from, step.to, smoothstep(t));
    if (t >= 1) {
      this.coverage = step.to;
      const end = step.onEnd;
      this.queue.shift();
      end?.();
    }
  }

  protected override draw(out: DrawCommand[], _world: Transform): void {
    const c = this.coverage;
    if (c <= 0) return;
    // Screen space: ignore the camera transform so the wipe stays fixed.
    const z = this.z;
    if (this.kind === 'fade') {
      out.push({ kind: 'rect', x: 0, y: 0, w: this.screenW, h: this.screenH, fill: this.color, opacity: c, transform: IDENTITY, z });
      return;
    }
    if (this.kind === 'circle') {
      // Iris: a filled disc grown from the centre to the far corner.
      const cx = this.screenW / 2;
      const cy = this.screenH / 2;
      const diag = Math.sqrt(cx * cx + cy * cy);
      out.push({ kind: 'circle', cx, cy, radius: c * diag, fill: this.color, transform: IDENTITY, z });
      return;
    }
    // Dither: an ordered dissolve — one opaque cell per Bayer threshold below c.
    const cols = Math.ceil(this.screenW / this.cell);
    const rows = Math.ceil(this.screenH / this.cell);
    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < cols; cx++) {
        const threshold = (BAYER4[(cx & 3) + ((cy & 3) << 2)] + 0.5) / 16;
        if (threshold < c) {
          out.push({ kind: 'rect', x: cx * this.cell, y: cy * this.cell, w: this.cell, h: this.cell, fill: this.color, transform: IDENTITY, z });
        }
      }
    }
  }
}

// ── Cinematic sequencer ──────────────────────────────────────────

export interface CinematicStep {
  /** Optional label (handy for debugging/skip logic). */
  name?: string;
  /** Runs once when the step begins — aim the camera, set text, mutate state. */
  enter?: () => void;
  /** Minimum seconds to hold on this step before advancing (default 0). */
  duration?: number;
  /** Gate: advance only once this returns true (e.g. `() => !transition.busy`). */
  until?: () => boolean;
}

/**
 * Runs a list of pure-data cinematic steps on the fixed clock. Each step's
 * `enter` fires once, then the player waits for both its `duration` and its
 * `until` gate before moving on — the fade-gate pattern for scripted intros.
 * Cosmetic: it only orchestrates view/state changes, holds no hashed state.
 */
export class CinematicPlayer extends Node {
  override readonly type: string = 'CinematicPlayer';
  private steps: CinematicStep[] = [];
  private index = -1;
  private elapsed = 0;
  private running = false;
  private onFinish?: () => void;

  constructor(config: NodeConfig = {}) {
    super(config);
    this.cosmetic = true;
  }

  /** Load and start a sequence. `onDone` fires after the last step advances. */
  play(steps: CinematicStep[], onDone?: () => void): this {
    this.steps = steps;
    this.onFinish = onDone;
    this.index = -1;
    this.elapsed = 0;
    this.running = steps.length > 0;
    this.advance();
    return this;
  }

  /** True while a sequence is playing. */
  get active(): boolean {
    return this.running;
  }
  /** Index of the step currently on screen (−1 before play / after finish). */
  get step(): number {
    return this.index;
  }

  /** Signal emitted when the whole sequence finishes. */
  get finished() {
    return this.signal('finished');
  }

  private advance(): void {
    this.index++;
    this.elapsed = 0;
    if (this.index >= this.steps.length) {
      this.running = false;
      this.index = -1;
      this.emit('finished', undefined);
      this.onFinish?.();
      return;
    }
    this.steps[this.index].enter?.();
  }

  /** Abort the sequence immediately (no further enters, no finish callback). */
  stop(): void {
    this.running = false;
    this.index = -1;
    this.steps = [];
  }

  protected override onProcess(dt: number): void {
    if (!this.running) return;
    this.elapsed += dt;
    const s = this.steps[this.index];
    const durationDone = this.elapsed >= (s.duration ?? 0);
    const gateOpen = s.until ? s.until() : true;
    if (durationDone && gateOpen) this.advance();
  }
}

/**
 * Convenience: make a Transition sized to a world and add it to a parent (the
 * scene root by default, so it paints over everything). Returns the node.
 */
export function addTransition(parent: Node, config: TransitionConfig = {}): ScreenTransition {
  const t = new ScreenTransition({ z: 10_000, ...config });
  return parent.addChild(t);
}

/** A cinematic step that fires a wipe and gates advancement on its completion. */
export function wipeStep(transition: ScreenTransition, opts: WipeOptions & { name?: string } = {}): CinematicStep {
  return {
    name: opts.name ?? 'wipe',
    enter: () => transition.wipe(opts),
    until: () => !transition.busy,
  };
}

/** Screen rect helper for wiring a Transition into other 9-slice/UI code. */
export const screenRect = (w: number, h: number): Rect => ({ x: 0, y: 0, w, h });
