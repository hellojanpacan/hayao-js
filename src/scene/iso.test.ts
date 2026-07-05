import { describe, it, expect } from 'vitest';
import type { DrawCommand, PolyCommand } from '../render/commands';
import { Node } from './node';
import { Sprite, diamondPoints, regularPolyPoints } from './nodes';
import { IsoPrism, DepthSort, shadeHex } from './iso';

describe('shape sugar', () => {
  it('diamond resolves to a center-anchored poly', () => {
    const out: DrawCommand[] = [];
    new Sprite({ shape: { kind: 'diamond', w: 64, h: 32 }, fill: '#abc' }).collectDraw(out);
    const poly = out[0] as PolyCommand;
    expect(poly.kind).toBe('poly');
    expect(poly.points).toEqual([0, -16, 32, 0, 0, 16, -32, 0]);
  });

  it('regularPoly first vertex points up', () => {
    const pts = regularPolyPoints(4, 10);
    expect(pts[0]).toBeCloseTo(0, 9); // x of top vertex
    expect(pts[1]).toBeCloseTo(-10, 9); // y straight up
  });

  it('diamondPoints matches the hand-typed corners', () => {
    expect(diamondPoints(10, 6)).toEqual([0, -3, 5, 0, 0, 3, -5, 0]);
  });
});

describe('shadeHex', () => {
  it('darkens and expands shorthand hex', () => {
    expect(shadeHex('#fff', 0.5)).toBe('#808080');
    expect(shadeHex('#204080', 0.5)).toBe('#102040');
  });
  it('leaves non-hex colours untouched', () => {
    expect(shadeHex('rebeccapurple', 0.5)).toBe('rebeccapurple');
  });
});

describe('IsoPrism', () => {
  it('emits three faces for a raised block, top drawn last', () => {
    const out: DrawCommand[] = [];
    new IsoPrism({ tileW: 64, tileH: 32, height: 20, fill: '#8080ff' }).collectDraw(out);
    expect(out.map((c) => c.kind)).toEqual(['poly', 'poly', 'poly']);
    // Auto-shaded side faces are darker than the top's base fill.
    expect(out[0].fill).toBe(shadeHex('#8080ff', 0.65));
    expect(out[1].fill).toBe(shadeHex('#8080ff', 0.85));
    expect(out[2].fill).toBe('#8080ff');
  });

  it('a flat block (height 0) is just the top diamond', () => {
    const out: DrawCommand[] = [];
    new IsoPrism({ tileW: 64, tileH: 32, height: 0, fill: '#8080ff' }).collectDraw(out);
    expect(out).toHaveLength(1);
    expect((out[0] as PolyCommand).points).toEqual(diamondPoints(64, 32));
  });
});

describe('DepthSort', () => {
  it('assigns child z from the key at draw time', () => {
    const sorter = new DepthSort({ key: (n) => n.pos.y });
    const a = sorter.addChild(new Node({ pos: { x: 0, y: 30 } }));
    const b = sorter.addChild(new Node({ pos: { x: 0, y: 10 } }));
    sorter.collectDraw([]);
    expect(a.z).toBe(30);
    expect(b.z).toBe(10);
  });

  it('is cosmetic (excluded from serialization)', () => {
    expect(new DepthSort({ key: () => 0 }).cosmetic).toBe(true);
  });
});
