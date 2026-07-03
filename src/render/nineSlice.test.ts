import { describe, it, expect } from 'vitest';
import { nineSlice, PANEL_PRESETS, type RectCommand } from '@hayao';

const rects = (cmds: ReturnType<typeof nineSlice>): RectCommand[] => cmds.filter((c): c is RectCommand => c.kind === 'rect');

describe('nineSlice — scalable panel frame', () => {
  it('emits the 9 grid regions (no stroke)', () => {
    const cmds = nineSlice({ x: 0, y: 0, w: 200, h: 100 }, { border: 10 });
    expect(cmds.length).toBe(9);
    expect(cmds.every((c) => c.kind === 'rect')).toBe(true);
  });

  it('adds an outline rect when stroke is set', () => {
    const cmds = nineSlice({ x: 0, y: 0, w: 200, h: 100 }, { border: 10, stroke: '#000' });
    expect(cmds.length).toBe(10);
    const outline = rects(cmds).find((c) => c.stroke === '#000');
    expect(outline).toBeTruthy();
    expect(outline!.w).toBe(200);
    expect(outline!.h).toBe(100);
  });

  it('keeps corners a fixed size while the center stretches', () => {
    const small = rects(nineSlice({ x: 0, y: 0, w: 100, h: 100 }, { border: 12, fill: '#f', corner: '#c' }));
    const big = rects(nineSlice({ x: 0, y: 0, w: 400, h: 300 }, { border: 12, fill: '#f', corner: '#c' }));
    const corners = (rs: RectCommand[]) => rs.filter((c) => c.fill === '#c');
    // All four corners stay 12×12 at both sizes.
    for (const c of corners(small)) { expect(c.w).toBe(12); expect(c.h).toBe(12); }
    for (const c of corners(big)) { expect(c.w).toBe(12); expect(c.h).toBe(12); }
    // The centre grows with the panel.
    const center = (rs: RectCommand[]) => rs.find((c) => c.fill === '#f' && c.w > 12 && c.h > 12)!;
    expect(center(big).w).toBeGreaterThan(center(small).w);
  });

  it('clamps the border so it never exceeds half the smaller side', () => {
    // border 100 on a 40×40 rect would break the grid; expect it clamped to 20.
    const rs = rects(nineSlice({ x: 0, y: 0, w: 40, h: 40 }, { border: 100, corner: '#c' }));
    for (const c of rs.filter((c) => c.fill === '#c')) {
      expect(c.w).toBeLessThanOrEqual(20);
      expect(c.h).toBeLessThanOrEqual(20);
    }
  });

  it('offsets by the rect origin and carries z', () => {
    const rs = rects(nineSlice({ x: 50, y: 30, w: 120, h: 80 }, { border: 8 }, 5));
    expect(rs.every((c) => c.z === 5)).toBe(true);
    // Top-left corner sits at the rect origin.
    expect(rs.some((c) => c.x === 50 && c.y === 30)).toBe(true);
  });

  it('presets produce valid styles', () => {
    expect(nineSlice({ x: 0, y: 0, w: 100, h: 100 }, PANEL_PRESETS.parchment()).length).toBeGreaterThanOrEqual(9);
    expect(nineSlice({ x: 0, y: 0, w: 100, h: 100 }, PANEL_PRESETS.slate()).length).toBeGreaterThanOrEqual(9);
  });
});
