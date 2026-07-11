import { describe, it, expect } from 'vitest';
import { LOOPS, loop } from './loops';
import { stepPattern, renderSong, songBeats } from './music';
import { lintSong } from './lint';
import { signalHash, peak } from './pcm';
import { features } from './analysis';
import { scoreTrack, GENRE_PROFILES } from './quality';

describe('stepPattern (drum grid authoring)', () => {
  it('maps symbols to velocities and coalesces rests', () => {
    const p = stepPattern('X.x.', 'C2', { accentVel: 1, hitVel: 0.6 });
    expect(p).toEqual([
      { pitch: 'C2', beats: 0.25, vel: 1 },
      { pitch: null, beats: 0.25 },
      { pitch: 'C2', beats: 0.25, vel: 0.6 },
      { pitch: null, beats: 0.25 },
    ]);
  });

  it('grades digit velocities as d/9 (ghost notes)', () => {
    const [ghost] = stepPattern('2', 'D4');
    expect(ghost.vel).toBeCloseTo(2 / 9, 6);
  });

  it('ignores bar separators and whitespace, keeps total beats correct', () => {
    const p = stepPattern('X... ..x. | ..x. .4..', 'C2');
    const beats = p.reduce((b, n) => b + n.beats, 0);
    expect(beats).toBeCloseTo(4, 6); // 16 sixteenths = one bar
  });
});

describe('drum-loop library', () => {
  it('exposes the kick-snare-bass groove', () => {
    expect(LOOPS.map((l) => l.id)).toContain('kick-snare');
    expect(loop('kick-snare')?.name).toBe('Kick, Snare & Bass');
  });

  for (const l of LOOPS) {
    describe(l.name, () => {
      const song = l.make();
      it('lints clean', () => {
        const r = lintSong(song);
        expect(r.ok, r.errors.join('; ')).toBe(true);
      });
      it('renders deterministically without clipping', () => {
        const a = renderSong(song);
        const b = renderSong(song);
        expect(signalHash(a.left)).toBe(signalHash(b.left));
        expect(peak(a)).toBeLessThanOrEqual(0.9 + 1e-3);
      });
      it('scores as a good beat on its own profile (≥ 90)', () => {
        const buf = renderSong(song);
        const q = scoreTrack(buf, GENRE_PROFILES[l.profile]);
        expect(q.score, q.notes.join('; ')).toBeGreaterThanOrEqual(90);
      });
    });
  }

  it('is a developed eight-bar phrase, not a two-bar loop', () => {
    const song = loop('kick-snare')!.make();
    expect(songBeats(song) / 4).toBe(8); // 8 bars of 4/4
    // development, not repetition: the drum & bass lanes carry several distinct
    // patterns (fills, the octave lift, the turnaround), not one stamped bar.
    const lanes = song.tracks.filter((t) => t.name === 'kick' || t.name === 'bass');
    for (const t of lanes) expect(t.patterns.length).toBeGreaterThanOrEqual(3);
  });

  it('reads as a sensible funk tempo with real motion', () => {
    const f = features(renderSong(loop('kick-snare')!.make()).left);
    expect(f.tempoBpm).toBeGreaterThan(90);
    expect(f.tempoBpm).toBeLessThan(120);
    expect(f.onsetDensity).toBeGreaterThan(1.5);
  });
});
