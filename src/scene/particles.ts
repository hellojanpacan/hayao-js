// Particles + screen shake: the juice kit. Both are COSMETIC by construction —
// they carry their own tiny Rng stream (never the world's), are excluded from
// hashing/serialization, and can be deleted without changing any game outcome.
// Emission is driven by sim events (jumped, landed, hit…), so replays produce
// identical visuals, but no canonical state ever depends on them.

import { dcos, dsin } from '../core/dmath';
import { Rng } from '../core/rng';
import { smoothstep, TAU, type Transform, type Vec2 } from '../core/math';
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

// ── Ambient particle field (snow / rain / weather) ──────────────
// A distinct preset family from the burst emitters above: instead of one-shot
// `burst()` events, an AmbientField seeds a FIXED set of particles across a
// screen-sized region and drifts them continuously, wrapping at the edges so the
// field is effectively infinite. Fully cosmetic — its own Rng, out of the hash.
// Weather intensity is a smoothstep envelope over SIM time (fixed `dt` from the
// clock), never wall-clock, so replays and peers see the same storm.

export interface AmbientStyle {
  /** Colors drawn from at random per particle. */
  colors: string[];
  /** Particle radius range (px). */
  sizeMin: number;
  sizeMax: number;
  /** Steady horizontal wind (px/s). */
  windX?: number;
  /** Fall speed (px/s, +y down). Snow ≈ 40, rain ≈ 600. */
  fallY: number;
  /** Horizontal sway amplitude (px) and frequency (Hz) — gives snow its wobble. */
  swayAmp?: number;
  swayFreq?: number;
  /** Draw vertical streaks instead of dots (rain). */
  streak?: boolean;
  /** Streak length (px) in streak mode. Default = fallY * 0.03. */
  streakLen?: number;
}

/** A single weather keyframe: `intensity` (0..1) reached at sim `time` (s). */
export interface WeatherKey {
  time: number;
  intensity: number;
}

/**
 * Smoothstep-interpolated weather intensity at sim time `t` over an ordered list
 * of keyframes. Before the first / after the last key it holds that key's value.
 * Pure — drive it with `world.time`, never wall-clock.
 */
export function weatherEnvelope(t: number, keys: readonly WeatherKey[]): number {
  if (keys.length === 0) return 1;
  if (t <= keys[0].time) return keys[0].intensity;
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i].time) {
      const a = keys[i - 1];
      const b = keys[i];
      return a.intensity + (b.intensity - a.intensity) * smoothstep(a.time, b.time, t);
    }
  }
  return keys[keys.length - 1].intensity;
}

interface AmbientParticle {
  x: number;
  y: number;
  size: number;
  color: string;
  /** Sway phase offset so particles don't wobble in lockstep. */
  phase: number;
  /** Per-particle fall-speed multiplier (parallax depth). */
  depth: number;
}

/**
 * A screen-wrapping ambient field for snow, rain, dust, or ash. Seed once with a
 * region size; it fills itself and drifts forever. Set `.envelope` to fade the
 * weather in/out over sim time. Always cosmetic.
 */
export class AmbientField extends Node {
  override readonly type: string = 'AmbientField';
  private rng: Rng;
  private field: AmbientParticle[] = [];
  private time = 0;
  private style: AmbientStyle;
  /** Field region (px). Particles wrap within [0,width] × [0,height]. */
  width: number;
  height: number;
  /** Optional weather intensity schedule; scales count/opacity. */
  envelope?: WeatherKey[];

  constructor(
    config: NodeConfig & {
      seed?: number;
      count?: number;
      width: number;
      height: number;
      style: AmbientStyle;
      envelope?: WeatherKey[];
    },
  ) {
    super(config);
    this.cosmetic = true;
    this.rng = new Rng(config.seed ?? 11);
    this.width = config.width;
    this.height = config.height;
    this.style = config.style;
    this.envelope = config.envelope;
    const count = config.count ?? 120;
    const s = this.style;
    for (let i = 0; i < count; i++) {
      this.field.push({
        x: this.rng.float() * this.width,
        y: this.rng.float() * this.height,
        size: s.sizeMin + this.rng.float() * (s.sizeMax - s.sizeMin),
        color: s.colors[this.rng.int(s.colors.length)],
        phase: this.rng.float() * TAU,
        depth: 0.5 + this.rng.float() * 0.5,
      });
    }
  }

  private intensity(): number {
    return this.envelope ? weatherEnvelope(this.time, this.envelope) : 1;
  }

  protected override onProcess(dt: number): void {
    this.time += dt;
    const s = this.style;
    const wind = s.windX ?? 0;
    const w = this.width;
    const h = this.height;
    for (const p of this.field) {
      p.y += s.fallY * p.depth * dt;
      p.x += wind * dt;
      // Wrap toroidally so the field never empties.
      if (p.y > h) p.y -= h;
      else if (p.y < 0) p.y += h;
      if (p.x > w) p.x -= w;
      else if (p.x < 0) p.x += w;
    }
  }

  protected override draw(out: DrawCommand[], world: Transform): void {
    const s = this.style;
    const intensity = this.intensity();
    if (intensity <= 0) return;
    // Envelope thins the field: draw only the first `intensity` fraction.
    const shown = Math.round(this.field.length * intensity);
    const swayAmp = s.swayAmp ?? 0;
    const swayFreq = s.swayFreq ?? 0;
    for (let i = 0; i < shown; i++) {
      const p = this.field[i];
      const sway = swayAmp !== 0 ? dsin(this.time * swayFreq * TAU + p.phase) * swayAmp : 0;
      const x = p.x + sway;
      if (s.streak) {
        const len = s.streakLen ?? s.fallY * 0.03;
        out.push({
          kind: 'poly',
          points: [x, p.y, x, p.y + len],
          closed: false,
          stroke: p.color,
          strokeWidth: p.size,
          opacity: intensity,
          transform: world,
          z: this.z,
        });
      } else {
        out.push({
          kind: 'circle',
          cx: x,
          cy: p.y,
          radius: p.size,
          fill: p.color,
          opacity: intensity,
          transform: world,
          z: this.z,
        });
      }
    }
  }

  get liveCount(): number {
    return this.field.length;
  }
}

/** Ready-made ambient weather styles (pair with `AmbientField`). */
export const AMBIENT_PRESETS = {
  snow: (colors = ['#ffffff', '#e8f0f8', '#cdd9e6']): AmbientStyle => ({ colors, sizeMin: 1.5, sizeMax: 3.5, windX: 8, fallY: 42, swayAmp: 14, swayFreq: 0.25 }),
  rain: (colors = ['#9fb4c8', '#c3d2e0']): AmbientStyle => ({ colors, sizeMin: 1, sizeMax: 1.8, windX: -40, fallY: 620, streak: true, streakLen: 16 }),
  ash: (colors = ['#6b6b6b', '#8a8580', '#3d3a36']): AmbientStyle => ({ colors, sizeMin: 1, sizeMax: 2.5, windX: 14, fallY: 26, swayAmp: 20, swayFreq: 0.18 }),
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
