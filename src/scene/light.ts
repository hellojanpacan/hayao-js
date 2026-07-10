// 2D lighting nodes. The light *set* is deterministic DrawCommands every backend
// sees (tagged `layer: LAYER_LIGHT`, parsed by render/lightRun.ts); *compositing*
// is observer-side. Both nodes are cosmetic by construction — they render state
// that lives elsewhere and never enter world.hash(). Flicker uses a private
// observer-seeded Rng advanced in `onProcess` (never `draw`, which may run 0..n
// times per step), exactly like Particles — so replays produce identical light.
//
// SEAM: gameplay-driving light state lives in `world.state` and feeds these
// nodes; never the reverse. A LightLayer must sit in WORLD space (not under a
// `screenSpace` subtree — the layer-1 clamp would promote its run out of the
// LAYER_LIGHT band). Place it at the tree origin so the transform it receives in
// `draw(out, world)` is the camera's viewTransform: pools/quads compose it, the
// ambient rect uses IDENTITY (full viewport, screen space) with width/height
// from config.

import { Rng } from '../core/rng';
import { dsin, dhypot } from '../core/dmath';
import { IDENTITY, type Transform } from '../core/math';
import { REGALIA_NIGHT, mixLinear } from '../art/palette';
import { LAYER_LIGHT, type CircleCommand, type DrawCommand, type PolyCommand, type RectCommand } from '../render/commands';
import { Node, type NodeConfig } from './node';
import { cullSegments, shadowQuads, type Occluder } from './shadow2d';

// ── PointLight ────────────────────────────────────────────────────
export interface PointLightConfig extends NodeConfig {
  /** Pool radius in design-space px. */
  radius?: number;
  /** Light color (hex). */
  color?: string;
  /** Peak intensity 0..1 (scales the pool's brightness). */
  intensity?: number;
  /**
   * Falloff exponent for the radial gradient's mid stop (>1 = tighter core,
   * <1 = broader glow). Default 1.
   */
  falloff?: number;
  /** Flicker: sinusoidal + noise wobble of intensity. Off (amount 0) by default. */
  flicker?: { amount: number; speed: number };
  /** Private flicker-Rng seed (observer-side, not serialized). Default 43. */
  seed?: number;
}

/**
 * A radial point light. Emits nothing itself (`draw` is empty) — its parent
 * LightLayer reads its world position, radius, color, and `litIntensity` to
 * build the run. `litIntensity` is cached each `onProcess` from the flicker
 * stream; with flicker off it equals `intensity` exactly.
 */
export class PointLight extends Node {
  override readonly type: string = 'PointLight';
  radius: number;
  color: string;
  intensity: number;
  falloff: number;
  flicker: { amount: number; speed: number };
  /** Current intensity after flicker — read by the LightLayer during draw. */
  litIntensity: number;

  private rng: Rng;
  private phase = 0;

  constructor(config: PointLightConfig = {}) {
    super(config);
    this.cosmetic = true;
    this.radius = config.radius ?? 160;
    this.color = config.color ?? '#ffe6b0';
    this.intensity = config.intensity ?? 1;
    this.falloff = config.falloff ?? 1;
    this.flicker = config.flicker ?? { amount: 0, speed: 0 };
    this.litIntensity = this.intensity;
    this.rng = new Rng(config.seed ?? 43);
  }

  protected override onProcess(dt: number): void {
    if (this.flicker.amount <= 0) {
      this.litIntensity = this.intensity;
      return;
    }
    // Advance the flicker stream HERE (never in draw): a sine base for a steady
    // pulse plus a small per-tick noise draw for organic variation. Bounded so
    // intensity never goes negative or wildly bright.
    this.phase += dt * this.flicker.speed;
    const wobble = dsin(this.phase) * 0.5 + (this.rng.float() - 0.5);
    const factor = 1 + wobble * this.flicker.amount;
    this.litIntensity = Math.max(0, this.intensity * factor);
  }

  protected override serializeProps(): Record<string, unknown> {
    return {};
  }
}

// ── LightLayer ────────────────────────────────────────────────────
export interface LightLayerConfig extends NodeConfig {
  /** Ambient darkness the pools lift out of. `color` multiplies the world; `level` blends toward white (1 = no darkening). */
  ambient?: { color?: string; level?: number };
  /** Soft shadows: add a half-opacity penumbra quad per segment (pure geometry, no blur). */
  softShadows?: boolean;
  /** Ambient-rect viewport size (screen space). Default 1280×720. */
  width?: number;
  height?: number;
}

/**
 * The lighting container. Emits the whole light run from its direct PointLight
 * children: an ambient darkness base, then per light a screen-blended pool plus
 * its multiply shadow quads. Cosmetic; place at the tree origin in world space.
 */
export class LightLayer extends Node {
  override readonly type: string = 'LightLayer';
  ambient: { color: string; level: number };
  softShadows: boolean;
  width: number;
  height: number;
  private occluders: Occluder[] = [];

  constructor(config: LightLayerConfig = {}) {
    super(config);
    this.cosmetic = true;
    this.ambient = {
      color: config.ambient?.color ?? REGALIA_NIGHT.bg,
      level: config.ambient?.level ?? 0,
    };
    this.softShadows = config.softShadows ?? false;
    this.width = config.width ?? 1280;
    this.height = config.height ?? 720;
  }

  /** Set the occluder edges (design-space segments) this layer casts shadows from. */
  setOccluders(segs: Occluder[]): void {
    this.occluders = segs;
  }

  protected override draw(out: DrawCommand[], world: Transform): void {
    // 1. Ambient base — full viewport, IDENTITY (screen space), multiply. `level`
    //    lifts the darkness toward white so the scene is never fully black.
    const ambientFill = this.ambient.level >= 1 ? '#ffffff' : mixLinear(this.ambient.color, '#ffffff', clamp01(this.ambient.level));
    const ambient: RectCommand = {
      kind: 'rect',
      x: 0,
      y: 0,
      w: this.width,
      h: this.height,
      fill: ambientFill,
      blend: 'multiply',
      transform: IDENTITY,
      z: 0,
      layer: LAYER_LIGHT,
    };
    out.push(ambient);

    // 2. Per direct-child PointLight, in child order: pool then shadow quads.
    for (const child of this.children) {
      if (!(child instanceof PointLight) || !child.visible) continue;
      const lt = child.localTransform();
      const lx = lt.e;
      const ly = lt.f;
      const radius = child.radius;
      const intensity = Math.max(0, Math.min(1, child.litIntensity));

      // Pool: a screen-blended circle with a radial gradient. Under SCREEN blend
      // (SVG mix-blend-mode / canvas 'lighter'→multiply), brightness is encoded
      // in the stop's LIGHTNESS — black adds nothing, the tint adds light — so we
      // scale the color from black by intensity. No per-stop alpha (keeps resvg
      // and the canvas buffer identical: opaque colors, additive accumulation).
      const tint = child.color;
      const core = mixLinear('#000000', tint, intensity);
      const mid = mixLinear('#000000', tint, intensity * 0.5);
      const edge = '#000000';
      const midStop = clamp01(0.6 / Math.max(0.01, child.falloff));
      const pool: CircleCommand = {
        kind: 'circle',
        cx: lx,
        cy: ly,
        radius,
        gradient: {
          type: 'radial',
          cx: 0.5,
          cy: 0.5,
          r: 0.5,
          stops: [
            { offset: 0, color: core },
            { offset: midStop, color: mid },
            { offset: 1, color: edge },
          ],
        },
        blend: 'screen',
        transform: world,
        z: 0,
        layer: LAYER_LIGHT,
      };
      out.push(pool);

      // Shadow quads: cull to reach, then extrude. Fill = ambient darkness so the
      // shadow erases the pool back to the ambient level (multiply).
      if (this.occluders.length) {
        const culled = cullSegments({ x: lx, y: ly }, radius, this.occluders);
        const quads = shadowQuads({ x: lx, y: ly }, radius, culled);
        for (const q of quads) {
          out.push(shadowPoly(q, ambientFill, world, 1));
          // Soft mode: one expanded 50%-opacity penumbra quad (pure geometry).
          if (this.softShadows) out.push(shadowPoly(expandQuad(q), ambientFill, world, 0.5));
        }
      }
    }
  }
}

// ── helpers ───────────────────────────────────────────────────────
const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

function shadowPoly(points: number[], fill: string, world: Transform, opacity: number): PolyCommand {
  const c: PolyCommand = {
    kind: 'poly',
    points,
    closed: true,
    fill,
    blend: 'multiply',
    transform: world,
    z: 0,
    layer: LAYER_LIGHT,
  };
  if (opacity !== 1) c.opacity = opacity;
  return c;
}

/**
 * Widen a shadow quad slightly around its far edge for the soft-shadow penumbra:
 * push the two extruded (far) vertices outward from the near edge's midpoint so
 * the half-opacity poly overhangs the hard shadow. Pure geometry — deterministic.
 */
function expandQuad(q: number[]): number[] {
  // q = [ax,ay, bx,by, bex,bey, aex,aey]. Fan the far edge out around the shadow axis.
  const midNearX = (q[0] + q[2]) / 2;
  const midNearY = (q[1] + q[3]) / 2;
  const spread = (fx: number, fy: number): [number, number] => {
    const dx = fx - midNearX;
    const dy = fy - midNearY;
    const l = dhypot(dx, dy);
    if (l === 0) return [fx, fy];
    const px = -dy / l;
    const py = dx / l;
    // Perpendicular nudge scaled to the extrusion length keeps it deterministic.
    const s = l * 0.08;
    return [fx + px * s, fy + py * s];
  };
  const [aex, aey] = spread(q[6], q[7]);
  const [bex, bey] = spread(q[4], q[5]);
  return [q[0], q[1], q[2], q[3], bex, bey, aex, aey];
}
