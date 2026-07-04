// Adaptive & spatial audio — FMOD/Wwise concepts in miniature, kept PURE so
// they verify headlessly. The whole system stays deterministic because audio is
// a projection of game state, never of wall-clock or Math.random:
//   • RTPC curves    — map a game value (health, depth, speed) through an
//                      authored breakpoint curve to an audio target.
//   • distance model — the exact Web Audio linear/inverse/exponential rolloff
//                      formulas, so our headless gain matches live PannerNode.
//   • vertical layers — layer gains as a pure function of an intensity value
//                      (the highest-leverage adaptive-music trick).
// A thin driver (elsewhere) pushes these numbers into GainNode/PannerNode; the
// numbers themselves are what tests assert on.

import { clamp } from '../core/math';
import { dexp2, dlog2 } from '../core/dmath';

/** A breakpoint on an RTPC curve: at input `x`, the target is `y`. */
export interface Breakpoint {
  x: number;
  y: number;
}

/**
 * Evaluate a piecewise-linear RTPC curve at `x`. Breakpoints are sorted by x;
 * values outside the range clamp to the nearest endpoint. This one primitive
 * drives volume, filter cutoff, layer gain, and distance in a uniform, testable
 * way — exactly what a Wwise RTPC / FMOD parameter automation does.
 */
export function evalCurve(curve: Breakpoint[], x: number): number {
  if (curve.length === 0) return 0;
  const pts = curve.length > 1 ? [...curve].sort((a, b) => a.x - b.x) : curve;
  if (x <= pts[0].x) return pts[0].y;
  if (x >= pts[pts.length - 1].x) return pts[pts.length - 1].y;
  for (let i = 1; i < pts.length; i++) {
    if (x <= pts[i].x) {
      const a = pts[i - 1];
      const b = pts[i];
      const t = b.x === a.x ? 0 : (x - a.x) / (b.x - a.x);
      return a.y + (b.y - a.y) * t;
    }
  }
  return pts[pts.length - 1].y;
}

export type DistanceModel = 'linear' | 'inverse' | 'exponential';

/**
 * Distance-attenuation gain, matching the Web Audio PannerNode formulas exactly
 * so an offline render agrees with live playback. `refDistance` is full volume,
 * `maxDistance` is the floor, `rolloff` shapes the falloff.
 */
export function distanceGain(
  model: DistanceModel,
  distance: number,
  refDistance = 1,
  maxDistance = 10000,
  rolloff = 1,
): number {
  const ref = Math.max(1e-6, refDistance);
  switch (model) {
    case 'linear': {
      const d = clamp(distance, ref, maxDistance);
      return 1 - (rolloff * (d - ref)) / Math.max(1e-6, maxDistance - ref);
    }
    case 'inverse': {
      const d = Math.max(distance, ref);
      return ref / (ref + rolloff * (Math.max(d, ref) - ref));
    }
    case 'exponential': {
      const d = Math.max(distance, ref);
      // (d/ref)^(-rolloff) via dexp2/dlog2 (Math.pow is banned in src)
      return dexp2(-rolloff * dlog2(d / ref));
    }
  }
}

/**
 * Equal-power stereo pan from a horizontal offset. dx is the source's screen-x
 * relative to the listener; `spread` is the half-width at which pan saturates.
 */
export function panFromOffset(dx: number, spread = 400): number {
  return clamp(dx / spread, -1, 1);
}

/**
 * A positional cue's mix: distance-attenuated gain × pan. Combines the two
 * above into what a 2-D game actually needs. `hearing` is the cutoff beyond
 * which the source is inaudible.
 */
export interface SpatialMix {
  gain: number;
  pan: number;
  audible: boolean;
}
export function spatialMix(dx: number, dy: number, hearing = 600, rolloff = 1): SpatialMix {
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > hearing) return { gain: 0, pan: 0, audible: false };
  const gain = distanceGain('inverse', dist, hearing * 0.15, hearing, rolloff);
  return { gain, pan: panFromOffset(dx, hearing * 0.7), audible: true };
}

/** A named layer of vertical (stacked) adaptive music. */
export interface MusicLayer {
  name: string;
  /** The layer fades in from `fadeIn` and reaches full gain by `full` intensity. */
  fadeIn: number;
  full: number;
  /** Optional cap on this layer's gain (default 1). */
  maxGain?: number;
}

/**
 * Vertical layering: given an intensity value (0..1, e.g. combat proximity),
 * return each layer's gain. Layers fade in at their thresholds so texture
 * thickens with intensity without ever interrupting the flow — the single
 * biggest adaptive-music payoff per line, and trivially deterministic.
 */
export function layerGains(layers: MusicLayer[], intensity: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const l of layers) {
    const span = Math.max(1e-6, l.full - l.fadeIn);
    const g = clamp((intensity - l.fadeIn) / span, 0, 1) * (l.maxGain ?? 1);
    out[l.name] = g;
  }
  return out;
}

/**
 * A ducking envelope target: while a higher-priority bus (dialogue, a stinger)
 * is active, the ducked bus drops by `amount` dB. Returns a linear gain the
 * driver ramps toward with setTargetAtTime — deterministic because it's keyed
 * off game state, not an audio sidechain.
 */
export function duckGain(active: boolean, amountDb = -12): number {
  return active ? dexp2((amountDb / 6.0206) ) : 1; // dB → linear via 2^(dB/6.02)
}
