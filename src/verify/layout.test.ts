import { describe, expect, it } from 'vitest';
import { IDENTITY } from '../core/math';
import { layoutIssues, safeAreaIssues, textBox, keyMentions } from './layout';
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

  it('flags text buried under an opaque higher-z shape (the invisible-label bug, #31)', () => {
    // tile at z4 fully covering a label at default z0 → painted underneath, invisible.
    const issues = layoutIssues([T('42', 300, 300, 0), R(300, 300, 64, 64, 4, 1)]);
    expect(issues.some((i) => i.includes('hidden behind'))).toBe(true);
    // Same tile with the label lifted above it (z6) is fine.
    expect(layoutIssues([T('42', 300, 300, 6), R(300, 300, 64, 64, 4, 1)])).toEqual([]);
    // A translucent overlay above the text is not an occluder.
    expect(layoutIssues([T('42', 300, 300, 0), R(300, 300, 64, 64, 4, 0.3)])).toEqual([]);
  });

  it('skips transient popups/particles by default (#26), but lints them on request', () => {
    const popup: DrawCommand = { kind: 'text', text: '+10', x: 0, y: 0, size: 20, align: 'center', transform: { ...IDENTITY, e: 645, f: 102 }, z: 40, transient: true };
    const hud = T('score 0', 640, 100, 40);
    expect(layoutIssues([hud, popup])).toEqual([]); // motion, not a collision
    expect(layoutIssues([hud, popup], { includeTransient: true }).length).toBeGreaterThan(0);
  });

  it('flags low-contrast shapes and text when a background is given (#30)', () => {
    // near-black bomb on near-black ground (the reported case).
    const bomb: DrawCommand = { kind: 'circle', cx: 0, cy: 0, radius: 20, fill: '#191c24', transform: { ...IDENTITY, e: 200, f: 200 }, z: 5 };
    const issues = layoutIssues([bomb], { background: '#0e1220' });
    expect(issues.some((i) => i.includes('vanishes into the ground'))).toBe(true);
    // A bright shape on the same ground is fine.
    const coin: DrawCommand = { kind: 'circle', cx: 0, cy: 0, radius: 20, fill: '#ffd24a', transform: { ...IDENTITY, e: 200, f: 200 }, z: 5 };
    expect(layoutIssues([coin], { background: '#0e1220' })).toEqual([]);
    // Faint text below the AA bar is flagged.
    const faint = T('hint', 640, 400, 5);
    (faint as { fill?: string }).fill = '#2a2f3a';
    expect(layoutIssues([faint], { background: '#0e1220' }).some((i) => i.includes('barely readable'))).toBe(true);
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

describe('safeAreaIssues', () => {
  const box = { width: 900, height: 520 };

  it('passes text comfortably inside the safe box', () => {
    expect(safeAreaIssues([T('SCORE 1200', 450, 40), T('ready', 450, 260)], box)).toEqual([]);
  });

  it('flags a label hard-coded past the design width (the off-ratio bug)', () => {
    const issues = safeAreaIssues([T('paused', 1180, 40)], box); // authored for a 1280-wide canvas
    expect(issues.length).toBe(1);
    expect(issues[0]).toContain('safe box');
  });

  it('flags text stranded above the top edge (negative coords)', () => {
    expect(safeAreaIssues([T('title', 450, -30)], box).length).toBe(1);
  });

  it('forgives a bottom HUD label whose baseline math pokes 1px past the edge (epsilon slack)', () => {
    // size-16 text at baseline 517 → box bottom ≈ 521, just 1px past height 520.
    expect(safeAreaIssues([T('x', 450, 517, 5, 16)], box)).toEqual([]);
  });

  it('ignores shapes by default (scenery may bleed into the margin) but flags them with includeShapes', () => {
    const scenery = R(-40, 260, 200, 200, 3); // a mural spilling left of the box
    expect(safeAreaIssues([scenery], box)).toEqual([]);
    expect(safeAreaIssues([scenery], { ...box, includeShapes: true }).length).toBe(1);
  });

  it('skips transient chrome', () => {
    const popup: DrawCommand = { ...(T('+10', 1200, 40) as DrawCommand), transient: true };
    expect(safeAreaIssues([popup], box)).toEqual([]);
  });

  it('honors a margin inset', () => {
    // A label 30px from the right edge passes with margin 0 but fails a 60px margin.
    const near = T('hp', 855, 260, 5, 16);
    expect(safeAreaIssues([near], box)).toEqual([]);
    expect(safeAreaIssues([near], { ...box, margin: 60 }).length).toBe(1);
  });
});
