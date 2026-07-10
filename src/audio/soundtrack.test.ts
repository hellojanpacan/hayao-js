import { describe, it, expect } from 'vitest';
import { SOUNDTRACK, BACKGROUND_PROFILE, soundtrackCue, cueForState } from './soundtrack';
import { renderSong } from './music';
import { lintSong } from './lint';
import { signalHash, peak } from './pcm';
import { features, crestFactorDb } from './analysis';
import { scoreTrack } from './quality';

describe('Palace Hours (game soundtrack)', () => {
  it('has four titled, intentioned cues — one per game state', () => {
    expect(SOUNDTRACK.title).toBe('Palace Hours');
    expect(SOUNDTRACK.cues.length).toBe(4);
    const states = SOUNDTRACK.cues.map((c) => c.state);
    expect(new Set(states)).toEqual(new Set(['title', 'explore', 'tension', 'reward']));
    for (const c of SOUNDTRACK.cues) {
      expect(c.title.length).toBeGreaterThan(0);
      expect(c.intent.length).toBeGreaterThan(0);
    }
    expect(soundtrackCue('long-gallery')?.title).toBe('The Long Gallery');
    expect(cueForState('reward')?.id).toBe('bright-coin');
  });

  for (const c of SOUNDTRACK.cues) {
    describe(c.title, () => {
      const song = c.make();

      it('lints clean and renders deterministically without clipping', () => {
        const lint = lintSong(song);
        expect(lint.ok, lint.errors.join('; ')).toBe(true);
        const a = renderSong(song);
        const b = renderSong(song);
        expect(signalHash(a.left)).toBe(signalHash(b.left));
        expect(peak(a)).toBeLessThanOrEqual(0.9 + 1e-3);
      });

      // The whole point of this score: it must vacate the SFX neighbourhood.
      it('leaves a pocket for SFX — dark spectrum and dynamic headroom', () => {
        const buf = renderSong(song);
        const f = features(buf.left);
        // SPECTRAL pocket: the mix's energy sits low, so bright one-shots
        // (coin/blip/laser, 1–5 kHz) have an open high band to cut through.
        expect(f.centroidHz, `centroid ${Math.round(f.centroidHz)}Hz`).toBeLessThan(2600);
        // DYNAMIC pocket: not brickwalled — peak headroom above the bed so a
        // transient one-shot pops. (Music usually ~8–20 dB; a bed wants ample.)
        expect(crestFactorDb(buf.left), 'crest factor').toBeGreaterThan(11);
        // It's a bed, not a wall: modest sustained loudness.
        expect(f.rms, `rms ${f.rms.toFixed(3)}`).toBeLessThan(0.19);
      });

      it('scores as professional-quality underscore (≥ 88)', () => {
        const q = scoreTrack(renderSong(song), BACKGROUND_PROFILE);
        expect(q.score, `${c.title}: ${q.notes.join('; ')}`).toBeGreaterThanOrEqual(88);
      });
    });
  }

  it('the whole score averages high background quality (≥ 92)', () => {
    const scores = SOUNDTRACK.cues.map((c) => scoreTrack(renderSong(c.make()), BACKGROUND_PROFILE).score);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    expect(avg).toBeGreaterThanOrEqual(92);
  });
});
