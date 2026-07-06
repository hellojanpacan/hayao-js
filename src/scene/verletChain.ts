// VerletChain — an N-segment verlet rope/streamer node for character
// appendages (tails, scarves), ropes, and banners. The head is pinned to the
// node's own position, so parenting it to a character makes the chain trail
// and flick as the character moves; an optional tail pin turns it into a
// hanging banner. COSMETIC by default: the chain is pure view (springy motion
// derived from where the node went), so it stays out of world.hash() and can
// be deleted without changing any game outcome. The simulation itself is
// deterministic — plain loops on fixed dt, no rng, allocation-free hot path —
// so replays wave the same flag the same way.

import { datan2 } from '../core/dmath';
import { invertTransform, type Transform, type Vec2 } from '../core/math';
import type { DrawCommand } from '../render/commands';
import { Node, type NodeConfig } from './node';

export interface VerletChainConfig extends NodeConfig {
  /** Number of segments (points = segments + 1). */
  segments: number;
  /** Total rest length of the chain, px. */
  length: number;
  /** Acceleration applied to free points, px/s² in WORLD space (+y is down). */
  gravity?: Vec2;
  /** Per-step velocity retention 0..1 (1 = undamped). Default 0.985. */
  damping?: number;
  /** Constraint-relaxation passes per step. Default 3. */
  iterations?: number;
  /** Pin the tail too (set `tailTarget` for where). Default false. */
  pinTail?: boolean;
  /** Stroke color for draw(). Default '#333'. */
  stroke?: string;
  /** Stroke width at the head, px. Default 3. */
  strokeWidth?: number;
  /** Taper the stroke toward the tail (draws per-segment polys). Default false. */
  taper?: boolean;
}

/**
 * The rope node. Read `points` (node-local) to attach child sprites along the
 * chain, `segmentAngle(i)` to orient them, and call `impulse(v)` to flick it.
 */
export class VerletChain extends Node {
  override readonly type: string = 'VerletChain';

  gravity: Vec2;
  damping: number;
  iterations: number;
  pinTail: boolean;
  stroke: string;
  strokeWidth: number;
  taper: boolean;
  /**
   * Where the tail is pinned when `pinTail` is true, in NODE-LOCAL space
   * (same space as `points`). null leaves the tail free even with pinTail set.
   */
  tailTarget: Vec2 | null = null;

  readonly segments: number;
  /** Rest length of one segment. */
  readonly segmentLength: number;

  // World-space simulation state (flat arrays: allocation-free hot path).
  private px: Float64Array;
  private py: Float64Array;
  private prevx: Float64Array;
  private prevy: Float64Array;
  /** Node-local mirror of the sim points, updated after each step. */
  private readonly local: Vec2[];
  private initialized = false;
  // Pending impulse (world px/s), applied to free points on the next step.
  private impX = 0;
  private impY = 0;

  constructor(config: VerletChainConfig) {
    super(config);
    this.cosmetic = true;
    this.segments = Math.max(1, Math.floor(config.segments));
    this.segmentLength = config.length / this.segments;
    this.gravity = config.gravity ? { ...config.gravity } : { x: 0, y: 600 };
    this.damping = config.damping ?? 0.985;
    this.iterations = Math.max(1, config.iterations ?? 3);
    this.pinTail = config.pinTail ?? false;
    this.stroke = config.stroke ?? '#333';
    this.strokeWidth = config.strokeWidth ?? 3;
    this.taper = config.taper ?? false;
    const n = this.segments + 1;
    this.px = new Float64Array(n);
    this.py = new Float64Array(n);
    this.prevx = new Float64Array(n);
    this.prevy = new Float64Array(n);
    this.local = [];
    for (let i = 0; i < n; i++) this.local.push({ x: 0, y: i * this.segmentLength });
  }

  /**
   * Chain points in NODE-LOCAL space, head first (`points[0]` ≈ {0,0}).
   * The Vec2 objects are reused across steps — read, don't retain copies-by-ref.
   */
  get points(): readonly Vec2[] {
    return this.local;
  }

  /**
   * Direction of segment i (0..segments-1) in node-local space, radians
   * (0 = +x, y-down screen convention). Map child sprites to segments with
   * `sprite.pos = chain.points[i]; sprite.rotation = chain.segmentAngle(i)`.
   */
  segmentAngle(i: number): number {
    const a = this.local[i];
    const b = this.local[i + 1];
    return datan2(b.y - a.y, b.x - a.x);
  }

  /** Flick the chain: add a velocity (world px/s) to every free point next step. */
  impulse(v: Vec2): void {
    this.impX += v.x;
    this.impY += v.y;
  }

  protected override onProcess(dt: number): void {
    const wt = this.worldTransform();
    const headX = wt.e;
    const headY = wt.f;
    const n = this.segments + 1;
    const px = this.px;
    const py = this.py;
    const prevx = this.prevx;
    const prevy = this.prevy;

    if (!this.initialized) {
      // Lay the chain out from the head along +y (world), at rest.
      for (let i = 0; i < n; i++) {
        px[i] = headX;
        py[i] = headY + i * this.segmentLength;
        prevx[i] = px[i];
        prevy[i] = py[i];
      }
      this.initialized = true;
    }

    // Tail pin target in world space (tailTarget is node-local).
    const tailPinned = this.pinTail && this.tailTarget !== null;
    let tailX = 0;
    let tailY = 0;
    if (tailPinned) {
      const t = this.tailTarget as Vec2;
      tailX = wt.a * t.x + wt.c * t.y + wt.e;
      tailY = wt.b * t.x + wt.d * t.y + wt.f;
    }

    // Verlet integration (free points only; head — and pinned tail — are set).
    const gdt2x = this.gravity.x * dt * dt;
    const gdt2y = this.gravity.y * dt * dt;
    const impDx = this.impX * dt;
    const impDy = this.impY * dt;
    const damp = this.damping;
    const last = n - 1;
    for (let i = 1; i < n; i++) {
      if (tailPinned && i === last) continue;
      const x = px[i];
      const y = py[i];
      px[i] = x + (x - prevx[i]) * damp + gdt2x + impDx;
      py[i] = y + (y - prevy[i]) * damp + gdt2y + impDy;
      prevx[i] = x;
      prevy[i] = y;
    }
    this.impX = 0;
    this.impY = 0;

    // Constraint relaxation: pin ends, then enforce segment rest lengths.
    const rest = this.segmentLength;
    for (let k = 0; k < this.iterations; k++) {
      px[0] = headX;
      py[0] = headY;
      if (tailPinned) {
        px[last] = tailX;
        py[last] = tailY;
      }
      for (let i = 0; i < last; i++) {
        const dx = px[i + 1] - px[i];
        const dy = py[i + 1] - py[i];
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d === 0) continue;
        const diff = (d - rest) / d;
        // Head never moves; pinned tail never moves; otherwise split the error.
        const aFixed = i === 0;
        const bFixed = tailPinned && i + 1 === last;
        if (aFixed && bFixed) continue;
        const wA = aFixed ? 0 : bFixed ? 1 : 0.5;
        const wB = bFixed ? 0 : aFixed ? 1 : 0.5;
        px[i] += dx * diff * wA;
        py[i] += dy * diff * wA;
        px[i + 1] -= dx * diff * wB;
        py[i + 1] -= dy * diff * wB;
      }
    }
    px[0] = headX;
    py[0] = headY;
    if (tailPinned) {
      px[last] = tailX;
      py[last] = tailY;
    }

    // Mirror into node-local space (mutate the reusable Vec2s — no allocs).
    const inv = invertTransform(wt);
    for (let i = 0; i < n; i++) {
      const p = this.local[i];
      const wx = px[i];
      const wy = py[i];
      p.x = inv.a * wx + inv.c * wy + inv.e;
      p.y = inv.b * wx + inv.d * wy + inv.f;
    }
  }

  /**
   * Stroked open poly of the chain. `points` are node-local and `world` is the
   * self-inclusive world transform handed to draw(), so commands emit with it
   * directly. With `taper`, each segment is its own 2-point poly at a linearly
   * decreasing width (segments are few, so this stays cheap); otherwise one poly.
   */
  protected override draw(out: DrawCommand[], world: Transform): void {
    const n = this.local.length;
    if (n < 2) return;
    if (this.taper) {
      for (let i = 0; i < n - 1; i++) {
        const a = this.local[i];
        const b = this.local[i + 1];
        const t = 1 - i / (n - 1); // 1 at the head → thin at the tail
        out.push({
          kind: 'poly',
          points: [a.x, a.y, b.x, b.y],
          closed: false,
          stroke: this.stroke,
          strokeWidth: Math.max(0.5, this.strokeWidth * t),
          round: true,
          transform: world,
          z: this.z,
          transient: true,
        });
      }
      return;
    }
    const pts: number[] = [];
    for (const p of this.local) pts.push(p.x, p.y);
    out.push({
      kind: 'poly',
      points: pts,
      closed: false,
      stroke: this.stroke,
      strokeWidth: this.strokeWidth,
      round: true,
      transform: world,
      z: this.z,
      transient: true,
    });
  }
}
