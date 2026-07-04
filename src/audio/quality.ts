// Objective quality scorer — turns "is this track any good?" into numbers so
// the Build-Measure-Learn loop has a hard gate, not a vibe. Measures the things
// that actually make a mix sound professional vs amateurish: loudness, headroom,
// dynamics (crest factor), stereo width, spectral balance (mud/harshness), and
// genre-fit (tempo/brightness/density). Pure and deterministic.

import { features, crestFactorDb, bandBalance, rms } from './analysis';
import type { StereoBuffer } from './pcm';

/** Stereo width via mid/side energy ratio. 0 = mono, ~0.3+ = a wide mix. */
export function stereoWidth(buf: StereoBuffer): number {
  const n = buf.left.length;
  const mid = new Float32Array(n);
  const side = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    mid[i] = (buf.left[i] + buf.right[i]) * 0.5;
    side[i] = (buf.left[i] - buf.right[i]) * 0.5;
  }
  const m = rms(mid);
  return m < 1e-9 ? 0 : rms(side) / m;
}

type Range = [number, number];

export interface GenreProfile {
  tempo: Range;
  centroid: Range; // Hz — spectral centroid of the FULL mix; bright percussion
  // (hats/cymbals/noise) legitimately raises this, so windows reflect the norm
  // for a *balanced* mix, not a bass-heavy one.
  onsets: Range; // per second
  rms: Range;
  crestDb: Range;
  width: Range;
  /** Max acceptable low-mid (250–800 Hz) fraction — warm genres tolerate more. */
  maxMud?: number;
}

/** Target windows per genre — set to real genre norms for a balanced mix. */
export const GENRE_PROFILES: Record<string, GenreProfile> = {
  electronic: { tempo: [118, 132], centroid: [3000, 7200], onsets: [7, 15], rms: [0.16, 0.27], crestDb: [6, 15], width: [0.03, 0.6], maxMud: 0.34 },
  lofi: { tempo: [70, 88], centroid: [1600, 4300], onsets: [5, 13], rms: [0.12, 0.24], crestDb: [7, 17], width: [0.04, 0.6], maxMud: 0.5 },
  // rubato solo piano defeats autocorrelation tempo — window widened honestly.
  piano: { tempo: [58, 100], centroid: [700, 2100], onsets: [3, 11], rms: [0.1, 0.22], crestDb: [9, 22], width: [0.04, 0.7], maxMud: 0.42 },
  orchestral: { tempo: [80, 96], centroid: [1100, 3000], onsets: [4, 12], rms: [0.11, 0.22], crestDb: [8, 21], width: [0.05, 0.7], maxMud: 0.4 },
  jazzfunk: { tempo: [106, 126], centroid: [2200, 5600], onsets: [6, 16], rms: [0.13, 0.25], crestDb: [7, 18], width: [0.04, 0.6], maxMud: 0.4 },
};

/** 1.0 inside [lo,hi]; ramps linearly to 0 across `margin` (relative) outside. */
function windowScore(x: number, [lo, hi]: Range): number {
  if (x >= lo && x <= hi) return 1;
  const span = Math.max(1e-6, hi - lo);
  const d = x < lo ? lo - x : x - hi;
  return Math.max(0, 1 - d / (span * 0.6));
}

export interface QualityScore {
  score: number; // 0..100
  dims: Record<string, number>; // 0..1 each
  notes: string[]; // actionable failings
}

/**
 * Score a rendered track against a genre profile. Weighted mean of dimensions,
 * ×100. `notes` lists any dimension below a comfortable threshold with the
 * measured value and direction, so a composer knows exactly what to fix.
 */
export function scoreTrack(buf: StereoBuffer, profile: GenreProfile): QualityScore {
  const mono = new Float32Array(buf.left.length);
  for (let i = 0; i < mono.length; i++) mono[i] = (buf.left[i] + buf.right[i]) * 0.5;
  const f = features(mono);
  const crest = crestFactorDb(mono);
  const bands = bandBalance(mono);
  const width = stereoWidth(buf);
  const mud = bands.lowMid; // energy piled in 250–800 Hz reads as muddy
  const harsh = bands.high + bands.air; // 2.5 kHz+ excess reads as harsh/fatiguing
  const lowEnd = bands.sub + bands.bass;

  const dims: Record<string, number> = {
    loudness: windowScore(f.rms, profile.rms),
    headroom: f.peakDb <= -0.5 ? (f.peakDb >= -3 ? 1 : windowScore(f.peakDb, [-3, -0.5])) : 0, // no clipping
    dynamics: windowScore(crest, profile.crestDb),
    width: windowScore(width, profile.width),
    brightness: windowScore(f.centroidHz, profile.centroid),
    density: windowScore(f.onsetDensity, profile.onsets),
    tempo: windowScore(f.tempoBpm, profile.tempo),
    lowEnd: windowScore(lowEnd, [0.12, 0.7]), // present but not boomy
    clarity: windowScore(mud, [0, profile.maxMud ?? 0.34]), // not muddy (genre-aware)
    smoothness: windowScore(harsh, [0, 0.4]), // not harsh
  };

  const weights: Record<string, number> = {
    loudness: 1.2, headroom: 1.4, dynamics: 1, width: 0.7, brightness: 1.1,
    density: 0.9, tempo: 0.7, lowEnd: 1, clarity: 1.2, smoothness: 1.1,
  };
  let sum = 0;
  let wsum = 0;
  for (const k of Object.keys(dims)) {
    sum += dims[k] * weights[k];
    wsum += weights[k];
  }
  const score = Math.round((sum / wsum) * 100);

  const notes: string[] = [];
  const say = (dim: string, msg: string) => {
    if (dims[dim] < 0.75) notes.push(`${dim}: ${msg}`);
  };
  say('loudness', `rms ${f.rms.toFixed(3)} (target ${profile.rms.join('–')})`);
  say('headroom', `peak ${f.peakDb.toFixed(1)}dB (want ≤ −0.5, ≥ −3)`);
  say('dynamics', `crest ${crest.toFixed(1)}dB (target ${profile.crestDb.join('–')})`);
  say('width', `width ${width.toFixed(2)} (target ${profile.width.join('–')})`);
  say('brightness', `centroid ${Math.round(f.centroidHz)}Hz (target ${profile.centroid.join('–')})`);
  say('density', `onsets ${f.onsetDensity.toFixed(1)}/s (target ${profile.onsets.join('–')})`);
  say('tempo', `tempo ${Math.round(f.tempoBpm)} (target ${profile.tempo.join('–')})`);
  say('lowEnd', `low-end fraction ${lowEnd.toFixed(2)} (want 0.12–0.62)`);
  say('clarity', `low-mid mud ${mud.toFixed(2)} (want ≤ ${(profile.maxMud ?? 0.34).toFixed(2)})`);
  say('smoothness', `high/air ${harsh.toFixed(2)} (want ≤ 0.40)`);

  return { score, dims, notes };
}
