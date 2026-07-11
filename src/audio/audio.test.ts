import { describe, it, expect } from 'vitest';
import { AudioBus, bootChimeScore } from './audio';
import { SOUNDTRACK } from './soundtrack';

// The boot chime is a signature identity cue: its score must stay stable and
// stay on the pentatonic. These lock the "sound" so a stray edit can't silently
// drift the pane's cold-open.
describe('boot chime', () => {
  it('is a deterministic four-voice score', () => {
    const a = bootChimeScore();
    const b = bootChimeScore();
    expect(a).toHaveLength(4);
    expect(a).toEqual(b); // no rng, no clock — same every call
  });

  it('stays on the C-major pentatonic (pitch classes C D E G A)', () => {
    const PENTA = new Set([0, 2, 4, 7, 9]); // C D E G A
    for (const t of bootChimeScore()) {
      const midi = Math.round(69 + 12 * Math.log2(t.freq / 440));
      expect(PENTA.has(((midi % 12) + 12) % 12)).toBe(true);
    }
  });

  it('keeps every voice soft and inside a ~1.5s window', () => {
    for (const t of bootChimeScore()) {
      expect(t.gain).toBeGreaterThan(0);
      expect(t.gain).toBeLessThanOrEqual(0.2);
      expect((t.delay ?? 0) + t.duration).toBeLessThanOrEqual(1.5);
    }
  });

  it('is a no-op on an unstarted (headless) bus', () => {
    const bus = new AudioBus(); // never start()ed → no AudioContext
    expect(() => bus.bootChime()).not.toThrow();
  });
});

// The playback layer must never render on the hot path (issue #104). prepareSong
// pays the synthesis cost off-thread and works headlessly (before any gesture),
// so a game pre-renders cues at load; playSong stays non-blocking.
describe('song playback (real-time-safe)', () => {
  const foyer = SOUNDTRACK.cues.find((c) => c.state === 'title')!.make();

  it('prepareSong renders headlessly (no AudioContext) to reusable samples', async () => {
    const bus = new AudioBus(); // headless
    const prepared = await bus.prepareSong(foyer, { sampleRate: 22050, yieldEvery: 8 });
    expect(prepared.sampleRate).toBe(22050);
    expect(prepared.left.length).toBeGreaterThan(0);
    expect(prepared.left.length).toBe(prepared.right.length);
    expect(prepared.loopEndSec).toBeGreaterThan(0);
  });

  it('playPrepared and playSong are no-ops on a headless bus but still return a live handle', async () => {
    const bus = new AudioBus();
    const prepared = await bus.prepareSong(foyer, { sampleRate: 22050 });
    const h1 = bus.playPrepared(prepared, { loop: true });
    expect(h1.playing).toBe(false); // nothing to play without a context
    expect(() => h1.stop()).not.toThrow();

    const h2 = bus.playSong(foyer, { loop: true });
    expect(() => h2.stop()).not.toThrow();
    await expect(h2.ready).resolves.toBeUndefined(); // resolves without throwing
  });

  it('playSong returns synchronously — the render never blocks the caller', () => {
    const bus = new AudioBus();
    const handle = bus.playSong(foyer, { loop: true });
    // If render were synchronous this line would only run seconds later; the
    // handle exists immediately and stop() is safe before the render resolves.
    expect(typeof handle.stop).toBe('function');
    expect(handle.ready).toBeInstanceOf(Promise);
    handle.stop();
  });
});
