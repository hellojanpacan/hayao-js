import { describe, expect, it } from 'vitest';
import {
  forgivenessIssues,
  graceWindowIssues,
  feedbackIssues,
  relLuminance,
  contrastRatio,
  salienceIssues,
  telegraphIssues,
  cameraIssues,
  lookAheadIssues,
  type FeedbackContract,
  type TelegraphFrame,
} from './gates';
import { DEFAULT_PLATFORMER } from '../physics/platformer';
import type { DrawCommand } from '../render/commands';
import { IDENTITY } from '../core/math';

describe('forgiveness gate', () => {
  it('passes the tuned default platformer', () => {
    expect(forgivenessIssues(DEFAULT_PLATFORMER)).toEqual([]);
  });
  it('flags a controller with no coyote time or buffer', () => {
    const issues = forgivenessIssues({ coyoteTime: 0, jumpBuffer: 0, jumpCornerNudge: 0 });
    expect(issues.length).toBe(3);
    expect(issues.some((i) => i.includes('coyote'))).toBe(true);
    expect(issues.some((i) => i.includes('buffer'))).toBe(true);
    expect(issues.some((i) => i.includes('corner'))).toBe(true);
  });
});

describe('grace-window prover', () => {
  // Model a window of exactly 6 frames: inputs at delay 0..6 take, delay 7 misses.
  const window = 6;
  it('passes an exactly-specced window', () => {
    expect(graceWindowIssues('coyote', window, (d) => d <= window)).toEqual([]);
  });
  it('flags a window that is too short (drops a late-but-legal input)', () => {
    const issues = graceWindowIssues('coyote', window, (d) => d <= window - 2);
    expect(issues.some((i) => i.includes('refused'))).toBe(true);
  });
  it('flags a window that is too long (unfair leniency)', () => {
    const issues = graceWindowIssues('coyote', window, (d) => d <= window + 3);
    expect(issues.some((i) => i.includes('past the window'))).toBe(true);
  });
});

describe('feedback-completeness gate', () => {
  const good: FeedbackContract = {
    jump: { channels: ['audio', 'visual'] },
    land: { channels: ['audio', 'visual', 'haptic'], shake: 0.2 },
    dash: { channels: ['audio', 'visual'], shake: 0.15 },
    death: { channels: ['audio', 'visual', 'haptic'], shake: 0.6, hitstopFrames: 6 },
  };
  it('passes a complete contract', () => {
    expect(feedbackIssues(good, ['jump', 'land', 'dash', 'death'])).toEqual([]);
  });
  it('flags a missing event', () => {
    expect(feedbackIssues(good, ['jump', 'collect'])[0]).toContain('collect');
  });
  it('flags a single-channel event', () => {
    const weak: FeedbackContract = { hit: { channels: ['audio'] } };
    expect(feedbackIssues(weak, ['hit'])[0]).toContain('1 channel');
  });
  it('flags shake and hit-stop outside the envelope', () => {
    const loud: FeedbackContract = { boom: { channels: ['audio', 'visual'], shake: 2, hitstopFrames: 40 } };
    const issues = feedbackIssues(loud, ['boom']);
    expect(issues.some((i) => i.includes('shake'))).toBe(true);
    expect(issues.some((i) => i.includes('hit-stop'))).toBe(true);
  });
});

describe('luminance + contrast', () => {
  it('white on black is maximal contrast', () => {
    expect(relLuminance('#ffffff')).toBeCloseTo(1, 3);
    expect(relLuminance('#000000')).toBeCloseTo(0, 3);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 1);
  });
  it('a color has no contrast with itself', () => {
    expect(contrastRatio('#8bad52', '#8bad52')).toBeCloseTo(1, 5);
  });
});

describe('salience gate', () => {
  const bg = '#efe7d3'; // washi
  const cmd = (fill: string): DrawCommand => ({ kind: 'circle', cx: 0, cy: 0, radius: 10, fill, transform: IDENTITY, z: 1 });
  it('passes a high-contrast avatar over muted scenery', () => {
    const commands = [cmd('#d8cbac'), cmd('#e4d8bd'), cmd('#b9a882')]; // low-contrast scenery
    expect(salienceIssues(commands, '#23201a', bg)).toEqual([]); // sumi avatar pops
  });
  it('flags an avatar that sinks into the background', () => {
    const commands = [cmd('#e4d8bd')];
    const issues = salienceIssues(commands, '#e4d8bd', bg); // avatar ≈ background
    expect(issues.length).toBeGreaterThan(0);
  });
});

describe('telegraph gate', () => {
  const frames = (spec: string): TelegraphFrame[] =>
    // 'w' = telegraphing, 'x' = active, '.' = idle
    [...spec].map((c) => ({ telegraphing: c === 'w', active: c === 'x' }));
  it('passes when a hitbox is warned before it goes live', () => {
    expect(telegraphIssues(frames('...wwwwwwxxx...'), 6)).toEqual([]);
  });
  it('flags a hitbox that activates with no wind-up', () => {
    expect(telegraphIssues(frames('....xxxx....'), 6)[0]).toContain('telegraph');
  });
  it('flags a wind-up that is too short', () => {
    expect(telegraphIssues(frames('..wwxxxx..'), 6)[0]).toContain('2 telegraph');
  });
});

describe('camera lawfulness gate', () => {
  const dt = 1 / 60;
  it('passes a smoothly damped follow', () => {
    const samples = Array.from({ length: 60 }, (_, i) => ({ x: 100 * (1 - Math.exp(-i / 20)), y: 0 }));
    expect(cameraIssues(samples, { dt })).toEqual([]);
  });
  it('flags a hard snap', () => {
    const samples = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 500, y: 0 }, { x: 500, y: 0 }];
    expect(cameraIssues(samples, { dt })[0]).toContain('snapped');
  });
  it('look-ahead passes when the camera leads the target', () => {
    const cam = [{ x: 0, y: 0 }, { x: 60, y: 0 }];
    const tgt = [{ x: 0, y: 0 }, { x: 50, y: 0 }];
    expect(lookAheadIssues(cam, tgt)).toEqual([]);
  });
  it('look-ahead flags a camera that trails backwards', () => {
    const cam = [{ x: 0, y: 0 }, { x: -20, y: 0 }];
    const tgt = [{ x: 0, y: 0 }, { x: 50, y: 0 }];
    expect(lookAheadIssues(cam, tgt)[0]).toContain('opposite');
  });
});
