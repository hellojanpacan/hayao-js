// Pose blending. A Pose is a flat bag of channel values keyed by "target/channel"
// — the shape ClipPlayer samples into and applies from. Blending is pure math on
// these bags: `mixPose` linearly interpolates two poses, and Blend1D/Blend2D pick
// and weight a handful of source clips by a parameter (blend space). All of it is
// presentation: the weights never gate gameplay, and the arithmetic is plain
// (bit-identical everywhere).
//
// Normalized-phase sync (the walk/run foot-lock trick): blend spaces advance a
// single normalized phase [0,1) shared by all their clips, so a slow walk and a
// fast run stay foot-locked as the blend weight shifts — you never see the feet
// slide because both clips are sampled at the SAME fraction of their own loop.

import { clamp } from '../core/math';
import { clipTime, sampleTrack, type ClipDef } from './clip';

/** A sampled pose: "target/channel" → value. Plain object; order-insensitive. */
export type Pose = Record<string, number>;

/** Compose a pose key from a track's target + channel. */
export const poseKey = (target: string, channel: string): string => `${target}/${channel}`;

/**
 * Sample a whole clip into a Pose at NORMALIZED phase `phase` in [0,1) — the
 * blend-space entry point. `phase * duration` is the clip-local time (so two
 * clips of different length stay in step). Pure; allocates one fresh Pose.
 */
export function samplePose(def: ClipDef, phase: number): Pose {
  const local = clipTime(def, phase * def.duration);
  const pose: Pose = {};
  for (const tr of def.tracks) pose[poseKey(tr.target, tr.channel)] = sampleTrack(tr.keys, local);
  return pose;
}

/**
 * Linear blend of two poses: `out[k] = lerp(a[k], b[k], t)`. Keys present in only
 * one pose pass through unblended (the other side has no opinion). When `out` is
 * supplied it is reused (cleared then filled) — the allocation-free path
 * ClipPlayer takes during a crossfade. Returns `out`.
 */
export function mixPose(a: Pose, b: Pose, t: number, out: Pose = {}): Pose {
  for (const k in out) delete out[k];
  for (const k in a) {
    out[k] = k in b ? a[k] + (b[k] - a[k]) * t : a[k];
  }
  for (const k in b) {
    if (!(k in a)) out[k] = b[k];
  }
  return out;
}

/** One entry of a blend space: a clip pinned at a parameter position. */
export interface BlendSample {
  clip: ClipDef;
  /** Parameter position of this sample (e.g. speed). Blend1D reads `.x` only. */
  x: number;
  /** Second parameter (Blend2D only). */
  y?: number;
}

/**
 * A 1-D blend space (e.g. idle→walk→run along speed). Samples are sorted by `x`
 * on construction; `sample(param, phase)` finds the bracketing pair and mixes
 * them by the normalized distance, all clips sampled at the SAME phase (foot-lock).
 * Below the first / above the last sample it clamps to the end clip.
 */
export class Blend1D {
  readonly samples: BlendSample[];

  constructor(samples: BlendSample[]) {
    // Copy + sort by x (ascending) so lookup is a simple bracket scan.
    this.samples = samples.slice().sort((p, q) => p.x - q.x);
  }

  /** The clip weights at parameter `param` (sums to 1; empty space → {}). */
  weights(param: number): { clip: ClipDef; weight: number }[] {
    const s = this.samples;
    if (s.length === 0) return [];
    if (s.length === 1 || param <= s[0].x) return [{ clip: s[0].clip, weight: 1 }];
    if (param >= s[s.length - 1].x) return [{ clip: s[s.length - 1].clip, weight: 1 }];
    let i = 0;
    while (i < s.length - 1 && s[i + 1].x <= param) i++;
    const a = s[i];
    const b = s[i + 1];
    const span = b.x - a.x;
    const t = span <= 0 ? 0 : (param - a.x) / span;
    return [
      { clip: a.clip, weight: 1 - t },
      { clip: b.clip, weight: t },
    ];
  }

  /** Blend the neighbor clips at `param`, all sampled at normalized `phase`. */
  sample(param: number, phase: number): Pose {
    const w = this.weights(param);
    if (w.length === 0) return {};
    let pose = samplePose(w[0].clip, phase);
    if (w.length === 2) pose = mixPose(pose, samplePose(w[1].clip, phase), w[1].weight);
    return pose;
  }
}

/**
 * A 2-D blend space (e.g. a locomotion pad: forward/back × left/right). No
 * triangulation library — we pick the NEAREST THREE samples to the query point
 * and blend them barycentrically; if the point is outside their triangle the
 * barycentric weights are clamped to >= 0 and renormalized (a documented
 * approximation: no Delaunay, so a sparse/concave set can pick a non-ideal trio).
 */
export class Blend2D {
  readonly samples: Required<BlendSample>[];

  constructor(samples: BlendSample[]) {
    this.samples = samples.map((s) => ({ clip: s.clip, x: s.x, y: s.y ?? 0 }));
  }

  /** Clip weights at (px,py): nearest-3 barycentric, clamped + renormalized. */
  weights(px: number, py: number): { clip: ClipDef; weight: number }[] {
    const s = this.samples;
    if (s.length === 0) return [];
    if (s.length <= 3) return this.barycentric(s, px, py);
    // Nearest three by squared distance (ordered, deterministic tie-break by index).
    const idx = s.map((_, i) => i);
    idx.sort((a, b) => {
      const da = (s[a].x - px) ** 2 + (s[a].y - py) ** 2;
      const db = (s[b].x - px) ** 2 + (s[b].y - py) ** 2;
      return da - db || a - b;
    });
    return this.barycentric([s[idx[0]], s[idx[1]], s[idx[2]]], px, py);
  }

  private barycentric(tri: Required<BlendSample>[], px: number, py: number): { clip: ClipDef; weight: number }[] {
    if (tri.length === 1) return [{ clip: tri[0].clip, weight: 1 }];
    if (tri.length === 2) {
      // Project onto the segment, clamp to [0,1].
      const [a, b] = tri;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len2 = dx * dx + dy * dy;
      const t = len2 <= 0 ? 0 : clamp(((px - a.x) * dx + (py - a.y) * dy) / len2, 0, 1);
      return [
        { clip: a.clip, weight: 1 - t },
        { clip: b.clip, weight: t },
      ];
    }
    const [a, b, c] = tri;
    const det = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
    let wa: number;
    let wb: number;
    if (det === 0) {
      // Degenerate (collinear) triangle → fall back to equal thirds.
      wa = wb = 1 / 3;
    } else {
      wa = ((b.y - c.y) * (px - c.x) + (c.x - b.x) * (py - c.y)) / det;
      wb = ((c.y - a.y) * (px - c.x) + (a.x - c.x) * (py - c.y)) / det;
    }
    let wc = 1 - wa - wb;
    // Clamp negatives (point outside the triangle) and renormalize.
    wa = wa < 0 ? 0 : wa;
    wb = wb < 0 ? 0 : wb;
    wc = wc < 0 ? 0 : wc;
    const sum = wa + wb + wc;
    if (sum <= 0) return [{ clip: a.clip, weight: 1 }];
    return [
      { clip: a.clip, weight: wa / sum },
      { clip: b.clip, weight: wb / sum },
      { clip: c.clip, weight: wc / sum },
    ];
  }

  /** Blend the nearest-3 clips at (px,py), all sampled at normalized `phase`. */
  sample(px: number, py: number, phase: number): Pose {
    const w = this.weights(px, py);
    if (w.length === 0) return {};
    const out: Pose = {};
    for (const { clip, weight } of w) {
      if (weight === 0) continue;
      const p = samplePose(clip, phase);
      for (const k in p) out[k] = (out[k] ?? 0) + p[k] * weight;
    }
    return out;
  }
}

/**
 * Validate a blend space's samples (levelIssues idiom). Catches empty spaces,
 * duplicate parameter positions (a degenerate bracket / triangle), and non-finite
 * coordinates. `dims` selects which axes must be finite.
 */
export function blendIssues(samples: BlendSample[], dims: 1 | 2 = 1): string[] {
  const issues: string[] = [];
  if (!samples || samples.length === 0) {
    issues.push('blend space has no samples');
    return issues;
  }
  samples.forEach((s, i) => {
    if (!Number.isFinite(s.x)) issues.push(`sample ${i}: x is not finite`);
    if (dims === 2 && !Number.isFinite(s.y ?? 0)) issues.push(`sample ${i}: y is not finite`);
    if (!s.clip) issues.push(`sample ${i}: missing clip`);
  });
  // Duplicate positions.
  const seen = new Map<string, number>();
  samples.forEach((s, i) => {
    const key = dims === 2 ? `${s.x},${s.y ?? 0}` : `${s.x}`;
    if (seen.has(key)) issues.push(`sample ${i} duplicates the position of sample ${seen.get(key)} (${key})`);
    else seen.set(key, i);
  });
  return [...new Set(issues)];
}
