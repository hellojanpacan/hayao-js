// Tests for the expressive/arrangement features that lift the music above a
// robotic MIDI demo: reverb, oscillator detune, swing, velocity→brightness,
// and the sidechain pump. Each is asserted at the signal level.
import { describe, it, expect } from 'vitest';
import { renderSound } from './synth';
import { renderSong, type Song, INSTRUMENTS } from './music';
import { applyReverb } from './reverb';
import { createStereo } from './pcm';
import { spectralCentroid, rms, peakAmp } from './analysis';

const SR = 44100;
const firstOnset = (sig: Float32Array, thresh = 0.03): number => {
  for (let i = 0; i < sig.length; i++) if (Math.abs(sig[i]) > thresh) return i;
  return -1;
};

describe('reverb', () => {
  it('adds a decaying tail after a dry click', () => {
    const buf = createStereo(0.5, SR);
    for (let i = 0; i < 200; i++) buf.left[i] = buf.right[i] = 1 - i / 200; // short click
    applyReverb(buf, { wet: 0.6, roomSize: 0.8 });
    // well after the dry click there should still be energy (the tail)
    let tail = 0;
    for (let i = SR * 0.1; i < SR * 0.2; i++) tail += Math.abs(buf.left[i]);
    expect(tail).toBeGreaterThan(0.1);
  });
});

describe('oscillator detune', () => {
  it('changes the tone and stays in range', () => {
    const dry = renderSound({ freq: 220, wave: 'saw', sustain: 0.3, detune: 0 });
    const wide = renderSound({ freq: 220, wave: 'saw', sustain: 0.3, detune: 18 });
    expect(peakAmp(wide)).toBeLessThanOrEqual(1.001);
    // the detuned pair beats/combs → a measurably different spectrum
    expect(spectralCentroid(wide)).not.toBeCloseTo(spectralCentroid(dry), 0);
  });
});

describe('swing', () => {
  it('delays an off-beat 8th note', () => {
    const song = (swing: number): Song => ({
      bpm: 120,
      swing,
      tracks: [{
        instrument: INSTRUMENTS.pluck,
        patterns: [[{ pitch: null, beats: 0.5 }, { pitch: 'A4', beats: 0.5 }]], // note on the "and"
        sequence: [0],
      }],
      tailSec: 0.3,
    });
    const straight = firstOnset(renderSong(song(0)).left);
    const swung = firstOnset(renderSong(song(1)).left);
    expect(swung).toBeGreaterThan(straight); // the off-beat note arrives later
  });
});

describe('velocity → brightness', () => {
  it('a soft note is darker than a loud one', () => {
    const song = (vel: number): Song => ({
      bpm: 120,
      tracks: [{
        instrument: { ...INSTRUMENTS.pad, lowpass: 3000 },
        patterns: [[{ pitch: 'A3', beats: 2, vel }]],
        sequence: [0],
      }],
      velBrightness: 1,
      tailSec: 0.3,
    });
    const soft = spectralCentroid(renderSong(song(0.3)).left);
    const loud = spectralCentroid(renderSong(song(1.0)).left);
    expect(soft).toBeLessThan(loud);
  });
});

describe('sidechain pump', () => {
  it('modulates the mix so short-window energy dips and swells', () => {
    const base: Song = {
      bpm: 120,
      tracks: [{ instrument: { ...INSTRUMENTS.pad, attack: 0.01 }, patterns: [[{ pitch: 'A3', beats: 4 }]], sequence: [0] }],
      tailSec: 0.2,
    };
    const flat = renderSong(base);
    const pumped = renderSong({ ...base, sidechain: { depth: 0.8, beatsPerCycle: 1 } });
    // both audible…
    expect(rms(pumped.left)).toBeGreaterThan(0.02);
    // …but the pump creates deeper amplitude dips: the minimum short-window RMS
    // over the sustained section is lower than the flat version's.
    const minWin = (sig: Float32Array): number => {
      const w = Math.round(SR * 0.02);
      let mn = Infinity;
      for (let s = SR * 0.5; s + w < SR * 1.5; s += w) {
        let e = 0;
        for (let i = 0; i < w; i++) e += sig[s + i] * sig[s + i];
        mn = Math.min(mn, Math.sqrt(e / w));
      }
      return mn;
    };
    expect(minWin(pumped.left)).toBeLessThan(minWin(flat.left));
  });
});
