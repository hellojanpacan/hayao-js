import { describe, it, expect } from 'vitest';
import { World } from '../world';
import { Node } from '../scene/node';
import { HeadlessRenderer } from '../render/headless';
import {
  PixelBuffer,
  decodeBits,
  decode2bit,
  decodeRLE,
  encodeRLE,
  pixelsToCommands,
  TextureSprite,
} from './texture';
import { FONT_5 } from './font5';
import {
  parseRich,
  measureText,
  layoutText,
  typewriterCount,
  textToCommands,
  BitmapText,
} from './bitmapFont';
import {
  gridFromRows,
  mask4,
  mask8,
  wangTile,
  autotile4,
  WangFrame,
  Edge,
  marchingSquaresCases,
  marchingSquaresContours,
  autotileToCommands,
  contourToCommands,
} from './autotile';

describe('procedural texture', () => {
  it('decodes a 1-bit BigInt/hex bitmap MSB-first', () => {
    // 4×2 checker: top row 1010, bottom row 0101 → 0b10100101 = 0xA5.
    const buf = decodeBits('A5', 4, 2);
    expect([...buf.data]).toEqual([1, 0, 1, 0, 0, 1, 0, 1]);
    expect(decodeBits(0xa5n, 4, 2).data).toEqual(buf.data);
  });

  it('decodes 2-bit indices then remaps through a palette LUT', () => {
    // Two pixels: index 3 then index 1 → 0b1101 = 0xD.
    const buf = decode2bit('D', 2, 1);
    expect([...buf.data]).toEqual([3, 1]);
    const remapped = buf.remap([0, 5, 6, 7]);
    expect([...remapped.data]).toEqual([7, 5]);
  });

  it('round-trips RLE decode/encode', () => {
    const runs = [3, 1, 2, 0, 1, 2];
    const buf = decodeRLE(runs, 3, 2);
    expect([...buf.data]).toEqual([1, 1, 1, 0, 0, 2]);
    expect(encodeRLE(buf)).toEqual(runs);
  });

  it('run-merges horizontal spans and skips transparent (null) swatches', () => {
    const buf = PixelBuffer.fromRows(['..#', '###'], { '.': 0, '#': 1 });
    const cmds = pixelsToCommands(buf, [null, '#c00'], { cell: 4 });
    // Row 0: one 1-wide rect at x=8; row 1: one 3-wide rect at x=0.
    expect(cmds.length).toBe(2);
    expect(cmds[0]).toMatchObject({ x: 8, y: 0, w: 4, h: 4, fill: '#c00' });
    expect(cmds[1]).toMatchObject({ x: 0, y: 4, w: 12, h: 4, fill: '#c00' });
  });

  it('TextureSprite is cosmetic — excluded from serialize/hash', () => {
    const world = new World({ seed: 1 });
    const root = new Node({ name: 'root' });
    root.addChild(new TextureSprite({ buffer: decodeBits('F', 2, 2), palette: [null, '#000'] }));
    world.setRoot(root);
    world.step();
    expect(root.serialize().children).toHaveLength(0);
  });
});

describe('bitmap font + rich text', () => {
  it('measures proportional width (I is narrow, M is wide)', () => {
    expect(measureText(FONT_5, 'I')).toBe(1);
    expect(measureText(FONT_5, 'M')).toBe(5);
    // "II": two 1-wide glyphs + one tracking column.
    expect(measureText(FONT_5, 'II')).toBe(1 + FONT_5.tracking + 1);
  });

  it('parses a {tag}…{/} colour stack', () => {
    const rich = parseRich('a{red}b{/}c', { red: '#f00' });
    expect(rich.map((r) => r.ch).join('')).toBe('abc');
    expect(rich[0].color).toBeUndefined();
    expect(rich[1].color).toBe('#f00');
    expect(rich[2].color).toBeUndefined();
  });

  it('treats {{ as a literal brace and #hex tags literally', () => {
    const rich = parseRich('{#0f0}x{/}{{');
    expect(rich.map((r) => r.ch).join('')).toBe('x{');
    expect(rich[0].color).toBe('#0f0');
  });

  it('word-wraps to a max width', () => {
    const layout = layoutText(FONT_5, 'AA AA AA', { maxWidth: 10 });
    expect(layout.lines).toBeGreaterThan(1);
    // No glyph exceeds the wrap width.
    for (const g of layout.glyphs) expect(g.x + g.w).toBeLessThanOrEqual(layout.width);
  });

  it('reveals characters over time (typewriter, pure fn of elapsed)', () => {
    expect(typewriterCount(10, 0, 5)).toBe(0);
    expect(typewriterCount(10, 1, 5)).toBe(5);
    expect(typewriterCount(10, 100, 5)).toBe(10);
    expect(typewriterCount(10, 1, 0)).toBe(10); // cps<=0 → all
  });

  it('emits only revealed glyphs and carries inline colour', () => {
    const layout = layoutText(FONT_5, parseRich('A{r}B{/}', { r: '#f00' }));
    const all = textToCommands(FONT_5, layout, { color: '#111' });
    expect(all.some((c) => c.fill === '#f00')).toBe(true); // B is red
    const firstOnly = textToCommands(FONT_5, layout, { color: '#111', reveal: 1 });
    // With only 'A' revealed, no red pixels appear.
    expect(firstOnly.every((c) => c.fill === '#111')).toBe(true);
  });

  it('BitmapText is cosmetic and clock-driven', () => {
    const world = new World({ seed: 1 });
    const root = new Node({ name: 'root' });
    root.addChild(new BitmapText({ text: 'HI', charsPerSec: 10 }));
    world.setRoot(root);
    world.step();
    expect(root.serialize().children).toHaveLength(0);
  });
});

describe('autotiling', () => {
  it('mask4 reads the four edge neighbours', () => {
    const g = gridFromRows(['.#.', '###', '.#.']);
    expect(mask4(g, 1, 1)).toBe(Edge.N | Edge.E | Edge.S | Edge.W); // 15, cross
    expect(mask4(g, 0, 1)).toBe(Edge.E); // only right neighbour solid
  });

  it('Wang table covers all 16 masks and classifies by frame', () => {
    for (let m = 0; m < 16; m++) expect(wangTile(m)).toBeDefined();
    expect(wangTile(0).frame).toBe(WangFrame.Isolated);
    expect(wangTile(15).frame).toBe(WangFrame.Cross);
    expect(wangTile(Edge.N | Edge.S).frame).toBe(WangFrame.Straight);
    expect(wangTile(Edge.N | Edge.E).frame).toBe(WangFrame.Bend);
    expect(wangTile(Edge.N).frame).toBe(WangFrame.Cap);
    // The four caps are the same frame at four rotations.
    const rots = [Edge.N, Edge.E, Edge.S, Edge.W].map((m) => wangTile(m).rotation);
    expect(new Set(rots).size).toBe(4);
  });

  it('mask8 encodes diagonals in documented bit order', () => {
    const g = gridFromRows(['#..', '...', '...']);
    // Only NW (bit 7) is solid relative to center.
    expect(mask8(g, 1, 1)).toBe(1 << 7);
  });

  it('autotile4 yields null for empty cells and a tile for solid', () => {
    const g = gridFromRows(['#.', '##']);
    const tiles = autotile4(g);
    expect(tiles[0][1]).toBeNull();
    expect(tiles[1][0]).not.toBeNull();
  });

  it('marching squares produces per-corner case indices', () => {
    const g = gridFromRows(['#.', '..']); // only TL of the single cell is solid
    expect(marchingSquaresCases(g)).toEqual([[1]]);
    const full = gridFromRows(['##', '##']);
    expect(marchingSquaresCases(full)).toEqual([[15]]);
  });

  it('contour segments trace the boundary of a solid corner', () => {
    const g = gridFromRows(['#.', '..']);
    const segs = marchingSquaresContours(g, { cell: 8 });
    expect(segs).toHaveLength(1); // case 1 → one segment (L→T)
    expect(segs[0]).toEqual({ a: { x: 0, y: 4 }, b: { x: 4, y: 0 } });
  });

  it('autotileToCommands strokes only exposed edges', () => {
    const g = gridFromRows(['#']); // lone tile: all four sides exposed
    const cmds = autotileToCommands(g, { tile: 8, fill: '#555', edge: '#000' });
    const polys = cmds.filter((c) => c.kind === 'poly');
    expect(polys).toHaveLength(4);
    expect(cmds.filter((c) => c.kind === 'rect')).toHaveLength(1);
  });
});

describe('generated art renders headlessly', () => {
  it('produces a valid SVG string from decoded pixels', () => {
    const buf = PixelBuffer.fromRows(['.##.', '####', '#..#'], { '.': 0, '#': 1 });
    const cmds = pixelsToCommands(buf, [null, '#a11d3a'], { cell: 10 });
    const r = new HeadlessRenderer({ width: 40, height: 30 });
    r.draw(cmds);
    const svg = r.toSVGString();
    expect(svg).toContain('<svg');
    expect(svg).toContain('#a11d3a');
    expect(r.count('rect')).toBeGreaterThan(0);
  });

  it('contour + text + tiles compose into one display list', () => {
    const g = gridFromRows(['.##.', '####', '.##.']);
    const cmds = [
      ...autotileToCommands(g, { tile: 8, fill: '#5a7d4e', edge: '#3d3323' }),
      ...contourToCommands(g, { tile: 8, edge: '#a11d3a' }),
      ...textToCommands(FONT_5, layoutText(FONT_5, 'HAYAO'), { cell: 2, y: 40, color: '#3d3323' }),
    ];
    const r = new HeadlessRenderer({ width: 64, height: 64 });
    r.draw(cmds);
    expect(r.toSVGString()).toContain('<svg');
    expect(cmds.length).toBeGreaterThan(5);
  });
});
