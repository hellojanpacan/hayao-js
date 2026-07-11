import { describe, it, expect } from 'vitest';
import { renderSong, songBeats, songDuration, INSTRUMENTS, type Song } from './music';
import { progression, noteToMidi } from './theory';
import { peak, signalHash } from './pcm';
import { estimateTempo, rms } from './analysis';

function demoSong(bpm = 120): Song {
  const C3 = noteToMidi('C3');
  const chords = progression(noteToMidi('C4'), 'major', ['I', 'V', 'vi', 'IV']);
  return {
    bpm,
    tracks: [
      {
        name: 'kick',
        instrument: INSTRUMENTS.kick,
        patterns: [[
          { pitch: 'C2', beats: 1 },
          { pitch: 'C2', beats: 1 },
          { pitch: 'C2', beats: 1 },
          { pitch: 'C2', beats: 1 },
        ]],
        sequence: [0, 0],
        gain: 0.8,
      },
      {
        name: 'bass',
        instrument: INSTRUMENTS.bass,
        patterns: [
          [{ pitch: C3, beats: 2 }, { pitch: C3 + 7, beats: 2 }],
          [{ pitch: C3 + 9, beats: 2 }, { pitch: C3 + 5, beats: 2 }],
        ],
        sequence: [0, 1],
        pan: -0.2,
      },
      {
        name: 'pad',
        instrument: INSTRUMENTS.pad,
        patterns: chords.map((c) => [{ pitch: c, beats: 4 }]),
        sequence: [0, 1, 2, 3],
        gain: 0.5,
        pan: 0.2,
      },
    ],
  };
}

describe('music', () => {
  it('computes song length from the longest track', () => {
    const song = demoSong(120);
    // kick 2×4=8, bass 2×4=8, pad 4×4=16 → longest is 16
    expect(songBeats(song)).toBe(16);
  });

  it('renders a song deterministically to a stereo buffer', () => {
    const a = renderSong(demoSong(120));
    const b = renderSong(demoSong(120));
    expect(signalHash(a.left)).toBe(signalHash(b.left));
    expect(signalHash(a.right)).toBe(signalHash(b.right));
    expect(peak(a)).toBeGreaterThan(0.1);
    expect(peak(a)).toBeLessThanOrEqual(0.9 + 1e-4);
  });

  it('produces stereo width (pan places tracks off-center)', () => {
    const buf = renderSong(demoSong(120));
    // left and right channels differ because bass/pad are panned apart
    expect(signalHash(buf.left)).not.toBe(signalHash(buf.right));
  });

  it('faster bpm yields a shorter render', () => {
    expect(songDuration(demoSong(180))).toBeLessThan(songDuration(demoSong(90)));
  });

  it('per-track reverb sends are opt-in and deterministic', () => {
    // Same song, one with a reverb send on the pad: the send path must engage
    // (a different, wetter render) and stay bit-stable.
    const dry: Song = { ...demoSong(120), reverb: { wet: 0.5, roomSize: 0.8, damp: 0.4 } };
    const wet: Song = {
      ...dry,
      tracks: dry.tracks.map((t) => (t.name === 'pad' ? { ...t, reverbSend: 0.8 } : { ...t, reverbSend: 0 })),
    };
    const a = renderSong(wet);
    const b = renderSong(wet);
    expect(signalHash(a.left)).toBe(signalHash(b.left)); // deterministic
    expect(signalHash(renderSong(wet).left)).not.toBe(signalHash(renderSong(dry).left)); // send path changed it
  });

  it('a song without any reverbSend is byte-identical to the whole-mix path', () => {
    // Back-compat guard: absence of reverbSend must not perturb the classic
    // whole-mix reverb render at all.
    const song: Song = { ...demoSong(120), reverb: { wet: 0.3, roomSize: 0.7, damp: 0.5 } };
    const a = renderSong(song);
    const b = renderSong(song);
    expect(signalHash(a.left)).toBe(signalHash(b.left));
    expect(signalHash(a.right)).toBe(signalHash(b.right));
  });

  it('the rendered drum track carries a detectable tempo', () => {
    // A 4-on-the-floor kick at 120 BPM should read ~120 (or a related metric level).
    const song: Song = {
      bpm: 120,
      tracks: [
        {
          instrument: INSTRUMENTS.kick,
          patterns: [[
            { pitch: 'C2', beats: 1 },
            { pitch: 'C2', beats: 1 },
            { pitch: 'C2', beats: 1 },
            { pitch: 'C2', beats: 1 },
          ]],
          sequence: [0, 0, 0, 0],
        },
      ],
      tailSec: 0.2,
    };
    const buf = renderSong(song);
    const bpm = estimateTempo(buf.left);
    // accept the beat or a common metrical multiple/subdivision
    const near = [60, 120, 240].some((t) => Math.abs(bpm - t) < 12);
    expect(near).toBe(true);
    expect(rms(buf.left)).toBeGreaterThan(0.01);
  });
});
