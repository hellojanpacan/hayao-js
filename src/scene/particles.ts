// Particles + screen shake: the juice kit. Both are COSMETIC by construction —
// they carry their own tiny Rng stream (never the world's), are excluded from
// hashing/serialization, and can be deleted without changing any game outcome.
// Emission is driven by sim events (jumped, landed, hit…), so replays produce
// identical visuals, but no canonical state ever depends on them.

import { dcos, dsin } from '../core/dmath';
import { Rng } from '../core/rng';
import { TAU, type Transform, type Vec2 } from '../core/math';
import type { DrawCommand } from '../render/commands';
import { Node, type NodeConfig } from './node';

export interface ParticleStyle {
  /** Colors drawn from at random per particle. */
  colors: string[];
  /** Particle radius range (px). */
  sizeMin: number;
  sizeMax: number;
  /** Initial speed range (px/s). */
  speedMin: number;
  speedMax: number;
  /** Emission arc: center angle + spread (radians). Default: full circle. */
  angle?: number;
  spread?: number;
  /** Lifetime range (s). */
  lifeMin: number;
  lifeMax: number;
  /** Gravity applied to particles (px/s², +y is down). */
  gravity?: number;
  /** Velocity damping per second (0 = none, 5 = strong). */
  drag?: number;
  /** Shrink to zero over life (default true; also fades opacity). */
  shrink?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

/**
 * A pooled particle emitter node. Call `burst(n, at, style)` from game code in
 * response to feel events. Always cosmetic; safe to add anywhere in the tree.
 */
export class Particles extends Node {
  override readonly type: string = 'Particles';
  private pool: Particle[] = [];
  private rng: Rng;
  /** Cap on live particles (oldest are recycled first). */
  maxParticles: number;

  constructor(config: NodeConfig & { seed?: number; maxParticles?: number } = {}) {
    super(config);
    this.cosmetic = true;
    this.rng = new Rng(config.seed ?? 7);
    this.maxParticles = config.maxParticles ?? 512;
  }

  /** Emit a burst at a position (in this node's local space). */
  burst(count: number, at: Vec2, style: ParticleStyle): void {
    const r = this.rng;
    for (let i = 0; i < count; i++) {
      const angle = style.angle !== undefined ? style.angle + (r.float() - 0.5) * (style.spread ?? 0.6) : r.float() * TAU;
      const speed = style.speedMin + r.float() * (style.speedMax - style.speedMin);
      const p: Particle = {
        x: at.x,
        y: at.y,
        vx: dcos(angle) * speed,
        vy: dsin(angle) * speed,
        life: 0,
        maxLife: style.lifeMin + r.float() * (style.lifeMax - style.lifeMin),
        size: style.sizeMin + r.float() * (style.sizeMax - style.sizeMin),
        color: style.colors[r.int(style.colors.length)],
      };
      if (this.pool.length >= this.maxParticles) this.pool.shift();
      this.pool.push(p);
    }
    // Stash style scalars on the instance for update (single-style emitters are
    // the common case; per-particle style costs memory for no visible gain).
    this.gravity = style.gravity ?? 0;
    this.drag = style.drag ?? 0;
    this.shrink = style.shrink ?? true;
  }

  private gravity = 0;
  private drag = 0;
  private shrink = true;

  protected override onProcess(dt: number): void {
    const drag = Math.max(0, 1 - this.drag * dt);
    let write = 0;
    for (const p of this.pool) {
      p.life += dt;
      if (p.life >= p.maxLife) continue;
      p.vy += this.gravity * dt;
      p.vx *= drag;
      p.vy *= drag;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      this.pool[write++] = p;
    }
    this.pool.length = write;
  }

  protected override draw(out: DrawCommand[], world: Transform): void {
    for (const p of this.pool) {
      const t = 1 - p.life / p.maxLife;
      out.push({
        kind: 'circle',
        cx: p.x,
        cy: p.y,
        radius: this.shrink ? p.size * t : p.size,
        fill: p.color,
        opacity: Math.min(1, t * 2),
        transform: world,
        z: this.z,
      });
    }
  }

  get liveCount(): number {
    return this.pool.length;
  }
}

/** Ready-made styles for the common feel moments. */
export const PARTICLE_PRESETS = {
  dust: (colors = ['#c8c2b6', '#a09a8c']): ParticleStyle => ({ colors, sizeMin: 2, sizeMax: 4, speedMin: 30, speedMax: 90, lifeMin: 0.2, lifeMax: 0.45, gravity: 300, drag: 3, shrink: true }),
  burst: (colors = ['#ffd75e', '#ff9d47', '#fff2c9']): ParticleStyle => ({ colors, sizeMin: 2, sizeMax: 5, speedMin: 120, speedMax: 320, lifeMin: 0.25, lifeMax: 0.6, drag: 4, shrink: true }),
  hit: (colors = ['#ff5e5e', '#ffd0d0']): ParticleStyle => ({ colors, sizeMin: 2, sizeMax: 4, speedMin: 160, speedMax: 380, lifeMin: 0.15, lifeMax: 0.35, drag: 6, shrink: true }),
  sparkle: (colors = ['#9ef7ff', '#e8fdff', '#4ed8e8']): ParticleStyle => ({ colors, sizeMin: 1.5, sizeMax: 3.5, speedMin: 20, speedMax: 70, lifeMin: 0.4, lifeMax: 0.9, gravity: -40, drag: 2, shrink: true }),
} as const;

/**
 * Screen shake as a cosmetic camera offset with its own Rng and exponential
 * decay. Attach to whatever node the camera follows and read `offset` into the
 * camera's position AFTER canonical follow logic — or simpler, add the shaker
 * as the camera's parent so the offset composes for free.
 */
export class Shaker extends Node {
  override readonly type: string = 'Shaker';
  private rng: Rng;
  private trauma = 0;
  /** Max offset in px at full trauma. */
  amplitude: number;
  /** Trauma decay per second. */
  decay: number;

  constructor(config: NodeConfig & { seed?: number; amplitude?: number; decay?: number } = {}) {
    super(config);
    this.cosmetic = true;
    this.rng = new Rng(config.seed ?? 99);
    this.amplitude = config.amplitude ?? 14;
    this.decay = config.decay ?? 2.6;
  }

  /** Add shake (0..1). Stacks, clamped to 1. Quadratic falloff feels right. */
  addTrauma(amount: number): void {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  protected override onProcess(dt: number): void {
    this.trauma = Math.max(0, this.trauma - this.decay * dt);
    const s = this.trauma * this.trauma * this.amplitude;
    this.pos.x = (this.rng.float() * 2 - 1) * s;
    this.pos.y = (this.rng.float() * 2 - 1) * s;
  }
}
