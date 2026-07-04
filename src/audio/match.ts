// Feature matching — the engine of the AI-led improvement loop. Given a
// reference track's measured features and a candidate render, compute how far
// apart they are and, crucially, WHICH way each feature is off ("too dark",
// "too slow", "too quiet"). That actionable diff is what lets an LLM recreate
// good game music in the engine, discover where the synthesis falls short, and
// drive what to build next. Pure and deterministic.

import type { AudioFeatures } from './analysis';

/** Per-feature normalization scales — the "how much is a lot" for each axis. */
interface FeatureWeights {
  tempoBpm: number;
  centroidHz: number;
  rms: number;
  zcr: number;
  onsetDensity: number;
  peakDb: number;
}

// Denominators chosen so a "musically noticeable" difference is ~1.0 on each
// axis: ~20 BPM, ~1200 Hz of brightness, a doubling of level, etc.
const DEFAULT_WEIGHTS: FeatureWeights = {
  tempoBpm: 20,
  centroidHz: 1200,
  rms: 0.1,
  zcr: 1500,
  onsetDensity: 4,
  peakDb: 6,
};

export interface FeatureDelta {
  feature: keyof FeatureWeights;
  reference: number;
  candidate: number;
  /** Normalized signed error (candidate − reference) / scale. */
  normalized: number;
  /** Human/LLM-actionable direction, e.g. "too dark", "too fast". */
  note: string;
}

export interface MatchResult {
  /** Overall distance (RMS of normalized per-feature errors). 0 = identical. */
  distance: number;
  /** Per-feature breakdown, largest error first. */
  deltas: FeatureDelta[];
  /** The single most-off feature's note, or 'close match'. */
  headline: string;
}

const NOTES: Record<keyof FeatureWeights, [string, string]> = {
  // [candidate < reference, candidate > reference]
  tempoBpm: ['too slow', 'too fast'],
  centroidHz: ['too dark / muffled', 'too bright / harsh'],
  rms: ['too quiet', 'too loud'],
  zcr: ['too smooth / tonal', 'too noisy / gritty'],
  onsetDensity: ['too sparse', 'too busy'],
  peakDb: ['more headroom than reference', 'hotter / less headroom than reference'],
};

/**
 * Compare a candidate feature vector to a reference. Returns an overall
 * distance plus a per-feature, direction-aware breakdown sorted by severity.
 */
export function featureDistance(
  reference: AudioFeatures,
  candidate: AudioFeatures,
  weights: Partial<FeatureWeights> = {},
): MatchResult {
  const w = { ...DEFAULT_WEIGHTS, ...weights };
  const keys = Object.keys(w) as (keyof FeatureWeights)[];
  const deltas: FeatureDelta[] = [];
  let sumSq = 0;

  for (const k of keys) {
    const ref = reference[k];
    const cand = candidate[k];
    // guard non-finite (e.g. peakDb = -Infinity on silence)
    const refN = Number.isFinite(ref) ? ref : 0;
    const candN = Number.isFinite(cand) ? cand : 0;
    const normalized = (candN - refN) / w[k];
    sumSq += normalized * normalized;
    const [lo, hi] = NOTES[k];
    const note = Math.abs(normalized) < 0.25 ? 'ok' : normalized < 0 ? lo : hi;
    deltas.push({ feature: k, reference: refN, candidate: candN, normalized, note });
  }

  deltas.sort((a, b) => Math.abs(b.normalized) - Math.abs(a.normalized));
  const distance = Math.sqrt(sumSq / keys.length);
  const worst = deltas[0];
  const headline =
    Math.abs(worst.normalized) < 0.25 ? 'close match' : `${worst.feature}: ${worst.note}`;

  return { distance, deltas, headline };
}

/**
 * A compact, printable report of the mismatch — the "shortcomings" surface an
 * AI loop reads to decide its next move.
 */
export function matchReport(reference: AudioFeatures, candidate: AudioFeatures): string {
  const r = featureDistance(reference, candidate);
  const lines = r.deltas
    .filter((d) => d.note !== 'ok')
    .map((d) => `  ${d.feature.padEnd(13)} ${d.candidate.toFixed(1)} vs ${d.reference.toFixed(1)} → ${d.note}`);
  return (
    `match distance ${r.distance.toFixed(3)} — ${r.headline}\n` +
    (lines.length ? lines.join('\n') : '  (all features within tolerance)')
  );
}
