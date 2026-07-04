// Audio filmstrip: the "judge looks from a headless artifact" step, for sound.
// A rendered StereoBuffer can't be heard in CI, so we make it VISIBLE and
// MEASURABLE — a standalone SVG with a waveform overview, a log-magnitude
// spectrogram, and the extracted feature vector printed alongside. State (the
// notes, the mix) was already proven numerically; this is looks-and-listens
// only, exactly mirroring renderFilmstrip for the visual channel.

import { dlog10 } from '../core/dmath';
import { type StereoBuffer, type Samples } from '../audio/pcm';
import { features, magnitudeSpectrum, type AudioFeatures } from '../audio/analysis';

export interface AudioFilmstripOptions {
  /** Overall SVG width in px (default 900). */
  width?: number;
  /** Time columns in the spectrogram (default 220). */
  timeBins?: number;
  /** Frequency bands in the spectrogram (default 64). */
  freqBands?: number;
  /** Title shown above the strip. */
  title?: string;
}

/** Downmix to mono for analysis (average of the two channels). */
function mono(buf: StereoBuffer): Samples {
  const n = buf.left.length;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = (buf.left[i] + buf.right[i]) * 0.5;
  return out;
}

/** Peak-per-column min/max for a compact waveform overview. */
function waveformPath(ch: Samples, cols: number, w: number, h: number, midY: number): string {
  const per = Math.max(1, Math.floor(ch.length / cols));
  let up = `M0 ${midY}`;
  let dn = '';
  for (let c = 0; c < cols; c++) {
    let mn = 0;
    let mx = 0;
    const start = c * per;
    for (let i = 0; i < per && start + i < ch.length; i++) {
      const v = ch[start + i];
      if (v > mx) mx = v;
      if (v < mn) mn = v;
    }
    const x = (c / cols) * w;
    up += ` L${x.toFixed(1)} ${(midY - mx * (h / 2)).toFixed(1)}`;
    dn = ` L${x.toFixed(1)} ${(midY - mn * (h / 2)).toFixed(1)}` + dn;
  }
  return up + dn + ' Z';
}

/**
 * Render an audio filmstrip SVG for a stereo buffer: L/R waveforms, a
 * spectrogram heatmap, and the feature readout. Deterministic and standalone
 * (inline styles, no external refs) so it drops straight into t.artifact().
 */
export function renderAudioFilmstrip(buf: StereoBuffer, opts: AudioFilmstripOptions = {}): string {
  const W = opts.width ?? 900;
  const tBins = opts.timeBins ?? 220;
  const fBands = opts.freqBands ?? 64;
  const pad = 16;
  const inner = W - pad * 2;
  const waveH = 70;
  const specH = 200;
  const featH = 84;
  const H = pad * 5 + waveH * 2 + specH + featH;

  const f = features(mono(buf));

  // ── waveforms ──
  const lPath = waveformPath(buf.left, tBins, inner, waveH, waveH / 2);
  const rPath = waveformPath(buf.right, tBins, inner, waveH, waveH / 2);

  // ── spectrogram ── frame the mono signal, log-compress magnitudes to alpha
  const m = mono(buf);
  const frameSize = 2048;
  const hop = Math.max(1, Math.floor(m.length / tBins));
  const cellW = inner / tBins;
  const cellH = specH / fBands;
  let cells = '';
  for (let c = 0; c < tBins; c++) {
    const start = c * hop;
    if (start + 64 >= m.length) break;
    const mag = magnitudeSpectrum(m.subarray(start, Math.min(start + frameSize, m.length)));
    if (mag.length === 0) continue;
    const binsPerBand = Math.max(1, Math.floor(mag.length / fBands));
    for (let b = 0; b < fBands; b++) {
      let e = 0;
      for (let k = 0; k < binsPerBand; k++) e += mag[b * binsPerBand + k] ?? 0;
      // log-compress: map ~[-60,0] dB → [0,1] alpha
      const db = e > 1e-6 ? 20 * dlog10(e) : -120;
      const a = Math.max(0, Math.min(1, (db + 60) / 60));
      if (a < 0.03) continue;
      const x = pad + c * cellW;
      const y = pad * 3 + waveH * 2 + specH - (b + 1) * cellH; // low freq at bottom
      const col = specColor(a);
      cells += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(cellW + 0.6).toFixed(1)}" height="${(cellH + 0.6).toFixed(1)}" fill="${col}"/>`;
    }
  }

  const featText = featureLines(f)
    .map((line, i) => `<text x="${pad + 4}" y="${H - featH + 20 + i * 18}" font-family="monospace" font-size="12" fill="#e8e4d8">${line}</text>`)
    .join('');

  const y0 = pad;
  const y1 = pad * 2 + waveH;
  const yLabelWave = (label: string, y: number) =>
    `<text x="${pad}" y="${y - 3}" font-family="monospace" font-size="10" fill="#8a8474">${label}</text>`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
    `<rect width="${W}" height="${H}" fill="#1a1814"/>` +
    (opts.title ? `<text x="${pad}" y="${pad - 3}" font-family="monospace" font-size="12" fill="#d8b25a">${escapeXml(opts.title)}</text>` : '') +
    // waveforms
    yLabelWave('L', y0) +
    `<g transform="translate(${pad} ${y0})"><rect width="${inner}" height="${waveH}" fill="#211e18"/><path d="${lPath}" fill="#5a9ac4" opacity="0.9"/></g>` +
    yLabelWave('R', y1) +
    `<g transform="translate(${pad} ${y1})"><rect width="${inner}" height="${waveH}" fill="#211e18"/><path d="${rPath}" fill="#5ac48f" opacity="0.9"/></g>` +
    // spectrogram
    `<rect x="${pad}" y="${pad * 3 + waveH * 2}" width="${inner}" height="${specH}" fill="#0d0c0a"/>` +
    cells +
    // features
    `<rect x="${pad}" y="${H - featH}" width="${inner}" height="${featH - pad}" fill="#211e18"/>` +
    featText +
    `</svg>`
  );
}

/** Warm heat ramp (washi/ember palette) for spectrogram energy. */
function specColor(a: number): string {
  // dark → shu red → gold, keeping it on-brand and legible on dark
  const r = Math.round(40 + a * 200);
  const g = Math.round(20 + a * a * 150);
  const b = Math.round(30 + a * 40);
  return `rgb(${r},${g},${b})`;
}

function featureLines(f: AudioFeatures): string[] {
  return [
    `dur ${f.durationSec.toFixed(2)}s   peak ${f.peakDb.toFixed(1)} dBFS   rms ${f.rms.toFixed(3)}`,
    `centroid ${Math.round(f.centroidHz)} Hz   zcr ${Math.round(f.zcr)}/s`,
    `tempo ~${Math.round(f.tempoBpm)} bpm   onsets ${f.onsetDensity.toFixed(1)}/s`,
  ];
}

function escapeXml(s: string): string {
  return s.replace(/[<>&]/g, (c) => (c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&amp;'));
}

export interface AudioExpectation {
  minDurationSec?: number;
  maxDurationSec?: number;
  maxPeakDb?: number; // e.g. -1 to guarantee headroom / no clipping
  minRms?: number; // guarantee it isn't silent
  minCentroidHz?: number;
  maxCentroidHz?: number;
  tempoBpm?: number; // expected tempo…
  tempoToleranceBpm?: number; // …within this tolerance (default 12)
}

export interface AudioAssertion {
  ok: boolean;
  failures: string[];
  features: AudioFeatures;
}

/**
 * Assert a rendered buffer's measured features against an expectation. This is
 * the numeric half of the audio channel — what a verify.ts suite calls to prove
 * "this track is a ~120bpm piece that isn't clipping and isn't silent".
 */
export function assertAudio(buf: StereoBuffer, exp: AudioExpectation): AudioAssertion {
  const f = features(mono(buf));
  const failures: string[] = [];
  const chk = (cond: boolean, msg: string) => {
    if (!cond) failures.push(msg);
  };
  if (exp.minDurationSec !== undefined) chk(f.durationSec >= exp.minDurationSec, `duration ${f.durationSec.toFixed(2)}s < min ${exp.minDurationSec}`);
  if (exp.maxDurationSec !== undefined) chk(f.durationSec <= exp.maxDurationSec, `duration ${f.durationSec.toFixed(2)}s > max ${exp.maxDurationSec}`);
  if (exp.maxPeakDb !== undefined) chk(f.peakDb <= exp.maxPeakDb, `peak ${f.peakDb.toFixed(1)}dB > max ${exp.maxPeakDb}`);
  if (exp.minRms !== undefined) chk(f.rms >= exp.minRms, `rms ${f.rms.toFixed(3)} < min ${exp.minRms} (too quiet?)`);
  if (exp.minCentroidHz !== undefined) chk(f.centroidHz >= exp.minCentroidHz, `centroid ${Math.round(f.centroidHz)}Hz < min ${exp.minCentroidHz}`);
  if (exp.maxCentroidHz !== undefined) chk(f.centroidHz <= exp.maxCentroidHz, `centroid ${Math.round(f.centroidHz)}Hz > max ${exp.maxCentroidHz}`);
  if (exp.tempoBpm !== undefined) {
    const tol = exp.tempoToleranceBpm ?? 12;
    chk(Math.abs(f.tempoBpm - exp.tempoBpm) <= tol, `tempo ${Math.round(f.tempoBpm)}bpm not within ${tol} of ${exp.tempoBpm}`);
  }
  return { ok: failures.length === 0, failures, features: f };
}
