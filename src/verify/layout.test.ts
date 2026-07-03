import { describe, expect, it } from 'vitest';
import { IDENTITY } from '../core/math';
import { layoutIssues, textBox, keyMentions } from './layout';
import type { DrawCommand } from '../render/commands';

const T = (text: string, x: number, y: number, z = 5, size = 20): DrawCommand => ({ kind: 'text', text, x: 0, y: 0, size, align: 'center', transform: { ...IDENTITY, e: x, f: y }, z });
const R = (x: number, y: number, w: number, h: number, z = 2, opacity?: number): DrawCommand => ({ kind: 'rect', x: -w / 2, y: -h / 2, w, h, transform: { ...IDENTITY, e: x, f: y }, z, opacity });

describe('layoutIssues', () => {
  it('flags text partially covered by a foreground shape (the Shard Ascent bug)', () => {
    const issues = layoutIssues([T('HUD LINE', 640, 20), R(640, 16, 64, 32, 6)]);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]).toContain('collides');
  });

  it('forgives text sitting fully inside a panel', () => {
    expect(layoutIssues([T('card text', 640, 400, 5), R(640, 400, 800, 300, 1)])).toEqual([]);
    // Even a z2 panel is fine when it CONTAINS the text.
    expect(layoutIssues([T('card text', 640, 400, 5), R(640, 400, 800, 300, 2)])).toEqual([]);
  });

  it('a scrim panel absolves collisions with shapes it covers', () => {
    const tile = R(640, 16, 32, 32, 2); // a wall tile poking into the HUD band
    const scrim = R(640, 18, 1280, 36, 9); // the HUD scrim above it
    const hud = T('1/6 · First Steps', 640, 22, 10, 17);
    expect(layoutIssues([tile, hud]).length).toBeGreaterThan(0); // no scrim: bug
    expect(layoutIssues([tile, scrim, hud])).toEqual([]); // scrim: clean
  });

  it('ignores the background lattice (z ≤ 1) and near-invisible ghosts', () => {
    expect(layoutIssues([T('+4', 300, 300), R(300, 300, 64, 64, 1)])).toEqual([]);
    expect(layoutIssues([T('+4', 300, 300), R(300, 300, 64, 64, 6, 0.1)])).toEqual([]);
  });

  it('flags overlapping texts', () => {
    const issues = layoutIssues([T('first line of text', 640, 100), T('second line of text', 650, 104)]);
    expect(issues.some((i) => i.includes('overlap'))).toBe(true);
  });

  it('textBox centers on the transform for centered text', () => {
    const b = textBox({ kind: 'text', text: 'ab', x: 0, y: 0, size: 20, align: 'center', transform: { ...IDENTITY, e: 100, f: 50 }, z: 0 });
    expect(b.x).toBeLessThan(100);
    expect(b.x + b.w).toBeGreaterThan(100);
  });
});

describe('keyMentions', () => {
  it('maps codes to the words hints actually use', () => {
    expect(keyMentions('Digit3')).toContain('3');
    expect(keyMentions('KeyM')).toContain('m');
    expect(keyMentions('ArrowLeft')).toContain('arrow');
    expect(keyMentions('Space')).toContain('space');
  });
});
