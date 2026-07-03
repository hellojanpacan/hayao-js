import { describe, it, expect } from 'vitest';
import { Rng } from '../core/rng';
import { hashValue } from '../core/hash';
import { cellHash, cellFloat, scatter, scatterCells, valueNoise, fractalNoise } from './scatter';
import { generateCave } from './cave';
import { gridToTilemap, gridAt } from './grid';
import { terrainHeight, terrainSlice, isGround } from './terrain';
import { generateDungeon, roomCenter } from './rooms';
import { tileAt, TILE } from '../physics/tilemap';

describe('scatter (stateless coordinate hash)', () => {
  it('cellHash is deterministic and well-distributed', () => {
    expect(cellHash(3, 7, 42)).toBe(cellHash(3, 7, 42));
    expect(cellHash(3, 7, 42)).not.toBe(cellHash(7, 3, 42)); // order matters
    expect(cellHash(3, 7, 42)).not.toBe(cellHash(3, 7, 43)); // seed matters
  });

  it('cellFloat stays in [0,1)', () => {
    for (let x = 0; x < 40; x++)
      for (let y = 0; y < 40; y++) {
        const v = cellFloat(x, y, 1);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
  });

  it('scatter probability is roughly honored', () => {
    let hits = 0;
    const total = 100 * 100;
    for (let x = 0; x < 100; x++) for (let y = 0; y < 100; y++) if (scatter(x, y, 0.2, 5)) hits++;
    expect(hits / total).toBeGreaterThan(0.15);
    expect(hits / total).toBeLessThan(0.25);
  });

  it('scatterCells enumerates row-major and matches scatter()', () => {
    const cells = scatterCells(0, 0, 20, 20, 0.3, 9);
    for (const c of cells) expect(scatter(c.x, c.y, 0.3, 9)).toBe(true);
    // ordered: sorted by (y, x)
    const keys = cells.map((c) => c.y * 100 + c.x);
    expect(keys).toEqual([...keys].sort((a, b) => a - b));
  });

  it('valueNoise is smooth and bounded, fractalNoise too', () => {
    for (let i = 0; i < 200; i++) {
      const v = valueNoise(i * 0.3, i * 0.17, 3);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
    // integer coords reproduce the raw cell value
    expect(valueNoise(5, 8, 2)).toBeCloseTo(cellFloat(5, 8, 2), 10);
    expect(fractalNoise(1.5, 2.5, 4, { octaves: 3 })).toBe(fractalNoise(1.5, 2.5, 4, { octaves: 3 }));
  });
});

describe('cave carving (off world.rng, deterministic)', () => {
  const opts = { cols: 40, rows: 30, fill: 0.45, steps: 4 };

  it('same seed → identical cave', () => {
    const a = generateCave(new Rng(123), opts);
    const b = generateCave(new Rng(123), opts);
    expect(hashValue(a.cells)).toBe(hashValue(b.cells));
  });

  it('different seed → different cave', () => {
    const a = generateCave(new Rng(1), opts);
    const b = generateCave(new Rng(2), opts);
    expect(hashValue(a.cells)).not.toBe(hashValue(b.cells));
  });

  it('borders are sealed solid', () => {
    const g = generateCave(new Rng(7), opts);
    for (let x = 0; x < g.cols; x++) {
      expect(gridAt(g, x, 0)).toBe(1);
      expect(gridAt(g, x, g.rows - 1)).toBe(1);
    }
  });

  it('projects to a collision tilemap (1→SOLID, 0→EMPTY)', () => {
    const g = generateCave(new Rng(7), opts);
    const map = gridToTilemap(g, 16);
    expect(map.cols).toBe(40);
    expect(tileAt(map, 0, 0)).toBe(TILE.SOLID);
    // has at least some open floor
    expect(map.tiles.some((t) => t === TILE.EMPTY)).toBe(true);
  });
});

describe('endless terrain (stateless pure function of column)', () => {
  const opts = { base: 20, amplitude: 8, scale: 0.1, seed: 99, minRow: 4, maxRow: 38 };

  it('same column → same height, any sampling order', () => {
    expect(terrainHeight(1000, opts)).toBe(terrainHeight(1000, opts));
    const forward = terrainSlice(0, 50, opts);
    const scattered = [10, 40, 0, 25].map((c) => terrainHeight(c, opts));
    expect(scattered).toEqual([forward[10], forward[40], forward[0], forward[25]]);
  });

  it('height respects clamp bounds', () => {
    for (let c = -50; c < 50; c++) {
      const h = terrainHeight(c, opts);
      expect(h).toBeGreaterThanOrEqual(4);
      expect(h).toBeLessThanOrEqual(38);
    }
  });

  it('isGround is consistent with the surface row', () => {
    const h = terrainHeight(5, opts);
    expect(isGround(5, h, opts)).toBe(true);
    expect(isGround(5, h - 1, opts)).toBe(false);
  });
});

describe('room/segment layout (off world.rng)', () => {
  const opts = { cols: 48, rows: 32, attempts: 14, minSize: 4, maxSize: 8 };

  it('same seed → identical dungeon', () => {
    const a = generateDungeon(new Rng(5), opts);
    const b = generateDungeon(new Rng(5), opts);
    expect(a.rooms).toEqual(b.rooms);
    expect(hashValue(a.grid.cells)).toBe(hashValue(b.grid.cells));
  });

  it('rooms do not overlap and stay in bounds', () => {
    const { rooms } = generateDungeon(new Rng(8), opts);
    expect(rooms.length).toBeGreaterThan(1);
    for (const r of rooms) {
      expect(r.x).toBeGreaterThanOrEqual(1);
      expect(r.y).toBeGreaterThanOrEqual(1);
      expect(r.x + r.w).toBeLessThanOrEqual(opts.cols - 1);
      expect(r.y + r.h).toBeLessThanOrEqual(opts.rows - 1);
    }
    for (let i = 0; i < rooms.length; i++)
      for (let j = i + 1; j < rooms.length; j++) {
        const a = rooms[i];
        const b = rooms[j];
        const disjoint = a.x >= b.x + b.w || a.x + a.w <= b.x || a.y >= b.y + b.h || a.y + a.h <= b.y;
        expect(disjoint).toBe(true);
      }
  });

  it('room centers are carved floor (corridors connect them)', () => {
    const { rooms, grid } = generateDungeon(new Rng(8), opts);
    for (const r of rooms) {
      const c = roomCenter(r);
      expect(gridAt(grid, c.x, c.y)).toBe(0);
    }
  });
});
