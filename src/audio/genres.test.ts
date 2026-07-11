import { describe, it, expect } from 'vitest';
import { GENRES, genre } from './genres';
import { lintSong } from './lint';
import { renderSong } from './music';
import { signalHash, peak } from './pcm';
import { features } from './analysis';

describe('genre songbook', () => {
  it('exposes six named genres', () => {
    expect(GENRES.map((g) => g.id).sort()).toEqual(['ambient', 'electronic', 'jazzfunk', 'lofi', 'orchestral', 'piano']);
    expect(genre('lofi')?.name).toBe('Lo-fi Beats');
    expect(genre('ambient')?.name).toBe('Ambient Prologue');
  });

  for (const g of GENRES) {
    describe(g.name, () => {
      const song = g.make();
      it('passes the linter (well-formed, in structure)', () => {
        const r = lintSong(song);
        expect(r.ok, r.errors.join('; ')).toBe(true);
      });
      it('renders deterministically without clipping and without silence', () => {
        const a = renderSong(song);
        const b = renderSong(song);
        expect(signalHash(a.left)).toBe(signalHash(b.left));
        expect(peak(a)).toBeLessThanOrEqual(0.9 + 1e-3); // headroom kept
        const f = features(a.left);
        expect(f.rms).toBeGreaterThan(0.05); // not silent / not too quiet
      });
    });
  }

  it('genres sit in sensible brightness territory', () => {
    const feat = (id: string) => features(renderSong(genre(id)!.make()).left);
    const electronic = feat('electronic');
    const piano = feat('piano');
    const lofi = feat('lofi');
    // the melancholic piano is much darker than the bright electronic track
    expect(piano.centroidHz).toBeLessThan(electronic.centroidHz);
    // lo-fi is warmer/darker than electronic (dusty, filtered) — its identity
    expect(lofi.centroidHz).toBeLessThan(electronic.centroidHz);
    // the ambient prologue is the darkest of all — a soft, low-centred bed
    expect(feat('ambient').centroidHz).toBeLessThan(piano.centroidHz);
  });
});
