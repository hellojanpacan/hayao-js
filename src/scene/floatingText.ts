// Floating combat text: pooled rise-and-fade numbers/labels — the damage popups
// every action/survivors/RPG game leans on. Cosmetic by construction, exactly
// like Particles/Shaker: its own tiny Rng stream (never the world's, so deleting
// it changes no game outcome), excluded from hashing, driven by the fixed dt.
// Emission is triggered by sim events (hit for 12, healed, crit!), so replays
// reproduce identical popups without any canonical state depending on them.

import { clamp } from '../core/math';
import { Rng } from '../core/rng';
import type { Transform, Vec2 } from '../core/math';
import type { DrawCommand, TextAlign } from '../render/commands';
import { Node, type NodeConfig } from './node';

export interface FloatStyle {
  /** Text colour. */
  color: string;
  /** Font size in px. */
  size?: number;
  font?: string;
  weight?: number;
  align?: TextAlign;
  /** Upward speed in px/s (screen +y is down, so this is negated internally). */
  rise?: number;
  /** Gravity pulling the rise back down (px/s²) — arcs the pop. */
  gravity?: number;
  /** Lifetime in seconds. */
  life?: number;
  /** Random horizontal spread of the launch (px/s). */
  jitter?: number;
  /** Fraction of life spent fading out at the end (0..1, default 0.4). */
  fade?: number;
}

interface Popup {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  text: string;
  color: string;
  size: number;
  font?: string;
  weight?: number;
  align: TextAlign;
  fade: number;
}

/**
 * A pooled floating-text emitter. Call `pop(text, at, style)` from game code in
 * response to feel events. Always cosmetic; add it wherever the numbers should
 * live in the tree (usually the world layer, so pops ride the camera).
 */
export class FloatingText extends Node {
  override readonly type: string = 'FloatingText';
  private pool: Popup[] = [];
  private rng: Rng;
  /** Cap on live popups (oldest recycled first). */
  maxPopups: number;

  constructor(config: NodeConfig & { seed?: number; maxPopups?: number } = {}) {
    super(config);
    this.cosmetic = true;
    this.rng = new Rng(config.seed ?? 31);
    this.maxPopups = config.maxPopups ?? 128;
  }

  /** Spawn one popup at `at` (in this node's local space). */
  pop(text: string, at: Vec2, style: FloatStyle): void {
    const jitter = style.jitter ?? 0;
    const p: Popup = {
      x: at.x + (this.rng.float() - 0.5) * jitter * 0.1,
      y: at.y,
      vx: (this.rng.float() - 0.5) * jitter,
      vy: -(style.rise ?? 60),
      life: 0,
      maxLife: Math.max(0.05, style.life ?? 0.9),
      text,
      color: style.color,
      size: style.size ?? 20,
      font: style.font,
      weight: style.weight,
      align: style.align ?? 'center',
      fade: clamp(style.fade ?? 0.4, 0, 1),
    };
    // Stash the shared gravity for the update step (single-style is the common case).
    this.gravity = style.gravity ?? 0;
    if (this.pool.length >= this.maxPopups) this.pool.shift();
    this.pool.push(p);
  }

  private gravity = 0;

  protected override onProcess(dt: number): void {
    let write = 0;
    for (const p of this.pool) {
      p.life += dt;
      if (p.life >= p.maxLife) continue;
      p.vy += this.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      this.pool[write++] = p;
    }
    this.pool.length = write;
  }

  protected override draw(out: DrawCommand[], world: Transform): void {
    for (const p of this.pool) {
      const t = p.life / p.maxLife; // 0..1 through life
      const fadeStart = 1 - p.fade;
      const opacity = t < fadeStart ? 1 : clamp(1 - (t - fadeStart) / Math.max(1e-4, p.fade), 0, 1);
      out.push({
        kind: 'text',
        text: p.text,
        x: p.x,
        y: p.y,
        size: p.size,
        font: p.font,
        weight: p.weight,
        align: p.align,
        fill: p.color,
        opacity,
        transform: world,
        z: this.z,
        transient: true, // drifting popup — layout lints skip it (see verify/layout)
      });
    }
  }

  get liveCount(): number {
    return this.pool.length;
  }
}

/** Ready-made popup looks for the common combat moments. */
export const FLOAT_PRESETS = {
  damage: (color = '#e14b4b'): FloatStyle => ({ color, size: 22, weight: 700, rise: 70, gravity: 120, life: 0.8, jitter: 40, fade: 0.4 }),
  crit: (color = '#ffb020'): FloatStyle => ({ color, size: 32, weight: 800, rise: 100, gravity: 160, life: 1.0, jitter: 60, fade: 0.35 }),
  heal: (color = '#4bb06a'): FloatStyle => ({ color, size: 20, weight: 700, rise: 55, gravity: 40, life: 1.0, jitter: 20, fade: 0.5 }),
  label: (color = '#3d3323'): FloatStyle => ({ color, size: 18, weight: 600, rise: 40, gravity: 0, life: 1.2, jitter: 0, fade: 0.5 }),
} as const;
