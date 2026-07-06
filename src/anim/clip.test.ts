import { describe, it, expect } from 'vitest';
import { clipEvents, clipFinished, clipIssues, clipTime, sampleClip, sampleTrack, type ClipDef } from './clip';

const walk: ClipDef = {
  duration: 1,
  loop: 'loop',
  tracks: [
    { target: 'legL', channel: 'rotation', keys: [{ t: 0, v: 0 }, { t: 0.5, v: 1 }, { t: 1, v: 0 }] },
    { target: 'legR', channel: 'x', keys: [{ t: 0, v: 10 }, { t: 1, v: 20 }] },
  ],
  events: [
    { t: 0.25, name: 'footL' },
    { t: 0.75, name: 'footR' },
  ],
};

describe('clipTime', () => {
  it('loop wraps into [0,duration)', () => {
    expect(clipTime(walk, 0)).toBe(0);
    expect(clipTime(walk, 0.3)).toBeCloseTo(0.3, 10);
    expect(clipTime(walk, 1.25)).toBeCloseTo(0.25, 10);
    expect(clipTime(walk, 2.5)).toBeCloseTo(0.5, 10);
  });

  it('once clamps at both ends', () => {
    const once: ClipDef = { ...walk, loop: 'once' };
    expect(clipTime(once, -1)).toBe(0);
    expect(clipTime(once, 5)).toBe(1);
  });

  it('pingpong folds back', () => {
    const pp: ClipDef = { ...walk, loop: 'pingpong' };
    expect(clipTime(pp, 0.3)).toBeCloseTo(0.3, 10);
    expect(clipTime(pp, 1.3)).toBeCloseTo(0.7, 10); // folded
    expect(clipTime(pp, 2.0)).toBeCloseTo(0, 10); // full period back to start
  });
});

describe('sampleTrack', () => {
  const keys = [
    { t: 0, v: 0 },
    { t: 1, v: 10 },
    { t: 2, v: 30 },
  ];
  it('interpolates linearly between keys by default', () => {
    expect(sampleTrack(keys, 0.5)).toBeCloseTo(5, 10);
    expect(sampleTrack(keys, 1.5)).toBeCloseTo(20, 10);
  });
  it('clamps before first / after last key', () => {
    expect(sampleTrack(keys, -3)).toBe(0);
    expect(sampleTrack(keys, 99)).toBe(30);
  });
  it('lands exactly on keyframe values', () => {
    expect(sampleTrack(keys, 0)).toBe(0);
    expect(sampleTrack(keys, 1)).toBe(10);
    expect(sampleTrack(keys, 2)).toBe(30);
  });
  it('applies the ease of the segment ending at a key', () => {
    const eased = [
      { t: 0, v: 0 },
      { t: 1, v: 10, ease: 'quadIn' as const },
    ];
    // quadIn(0.5) = 0.25 → 2.5
    expect(sampleTrack(eased, 0.5)).toBeCloseTo(2.5, 10);
  });
});

describe('sampleClip purity', () => {
  it('two calls at the same time are deep-equal and never mutate the def', () => {
    const before = JSON.stringify(walk);
    const a = sampleClip(walk, 0.4);
    const b = sampleClip(walk, 0.4);
    expect(a).toEqual(b);
    expect(JSON.stringify(walk)).toBe(before); // def untouched
  });
  it('returns one channel per track', () => {
    const s = sampleClip(walk, 0.5);
    expect(s).toHaveLength(2);
    expect(s[0]).toEqual({ target: 'legL', channel: 'rotation', value: 1 });
  });
});

describe('clipEvents — fixed semantics', () => {
  it('half-open (t0,t1]: fires an event at the new time, not the old', () => {
    // Crossing exactly onto 0.25 fires it.
    expect(clipEvents(walk, 0.1, 0.25)).toEqual(['footL']);
    // Starting exactly on 0.25 does NOT re-fire it.
    expect(clipEvents(walk, 0.25, 0.3)).toEqual([]);
  });

  it('fires events in ascending order within a segment', () => {
    expect(clipEvents(walk, 0.0, 1.0)).toEqual(['footL', 'footR']);
  });

  it('loop wrap emits tail then head', () => {
    // 0.8 → 1.3 : tail (0.8,1] has footR was already at 0.75 (not in tail),
    // head (0,0.3] has footL. So just footL. Use a wider window to see both.
    // 0.6 → 1.4 : tail (0.6,1] = footR ; head (0,0.4] = footL → [footR, footL]
    expect(clipEvents(walk, 0.6, 1.4)).toEqual(['footR', 'footL']);
  });

  it('once never re-fires an event once past the end', () => {
    const once: ClipDef = { ...walk, loop: 'once' };
    expect(clipEvents(once, 0.1, 0.3)).toEqual(['footL']);
    // Already past the end: no wrap, nothing re-fires.
    expect(clipEvents(once, 1.0, 5.0)).toEqual([]);
    // First arrival at the end fires an end-adjacent event once.
    const endEv: ClipDef = { duration: 1, loop: 'once', tracks: walk.tracks, events: [{ t: 1, name: 'done' }] };
    expect(clipEvents(endEv, 0.9, 1.0)).toEqual(['done']);
    expect(clipEvents(endEv, 1.0, 2.0)).toEqual([]);
  });

  it('no events when the window does not advance', () => {
    expect(clipEvents(walk, 0.5, 0.5)).toEqual([]);
    expect(clipEvents(walk, 0.5, 0.4)).toEqual([]);
  });
});

describe('clipFinished', () => {
  it('is true only for once clips at/after duration', () => {
    expect(clipFinished(walk, 5)).toBe(false); // loop never finishes
    const once: ClipDef = { ...walk, loop: 'once' };
    expect(clipFinished(once, 0.5)).toBe(false);
    expect(clipFinished(once, 1)).toBe(true);
    expect(clipFinished(once, 2)).toBe(true);
  });
});

describe('clipIssues', () => {
  it('is clean for a valid clip', () => {
    expect(clipIssues(walk)).toEqual([]);
  });
  it('flags bad duration, empty tracks, bad channel, out-of-range key, unsorted keys, unknown ease', () => {
    const bad: ClipDef = {
      duration: 0,
      loop: 'loop',
      tracks: [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { target: 't', channel: 'nope' as any, keys: [{ t: 5, v: 0 }, { t: 1, v: 0, ease: 'wut' as any }] },
        { target: 'empty', channel: 'x', keys: [] },
      ],
    };
    const issues = clipIssues(bad);
    expect(issues.some((i) => i.includes('duration must be > 0'))).toBe(true);
    expect(issues.some((i) => i.includes("unknown channel 'nope'"))).toBe(true);
    expect(issues.some((i) => i.includes('outside'))).toBe(true);
    expect(issues.some((i) => i.includes('ascending'))).toBe(true);
    expect(issues.some((i) => i.includes('unknown ease'))).toBe(true);
    expect(issues.some((i) => i.includes('no keyframes'))).toBe(true);
  });
  it('flags a track targeting a node not in the rig when knownTargets is given', () => {
    const issues = clipIssues(walk, ['legL']); // legR missing
    expect(issues.some((i) => i.includes("target 'legR' is not in the rig"))).toBe(true);
  });
});
