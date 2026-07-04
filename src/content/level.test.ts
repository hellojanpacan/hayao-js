import { describe, expect, it } from 'vitest';
import { defineLevel, levelIssues, levelToTilemap, levelReachable, platformerReachable, diffLevels } from './level';
import { TILE } from '../physics/tilemap';

describe('defineLevel', () => {
  const level = defineLevel({
    name: 'test',
    tileSize: 32,
    rows: [
      '......G',
      '....###',
      '..o....',
      'S###...',
      '#######',
    ],
    legend: { o: 'crystal' },
  });

  it('resolves spawn, goal, and legend entities', () => {
    expect(level.spawn).toEqual({ x: 0, y: 3 });
    expect(level.goal).toEqual({ x: 6, y: 0 });
    expect(level.entities).toEqual([{ kind: 'crystal', tx: 2, ty: 2, x: 2.5 * 32, y: 2.5 * 32 }]);
    expect(level.cols).toBe(7);
  });

  it('builds a collision tilemap with markers as empty', () => {
    const map = levelToTilemap(level);
    expect(map.tiles[3 * map.cols + 0]).toBe(TILE.EMPTY); // 'S' → empty
    expect(map.tiles[4 * map.cols + 0]).toBe(TILE.SOLID); // '#'
  });

  it('throws without a spawn or goal', () => {
    expect(() => defineLevel({ name: 'x', rows: ['G'] })).toThrow(/no spawn/);
    expect(() => defineLevel({ name: 'x', rows: ['S'] })).toThrow(/no goal/);
  });
});

describe('levelIssues', () => {
  it('is clean for a well-formed level', () => {
    const level = defineLevel({ name: 'ok', rows: ['.G', 'S.', '##'] });
    expect(levelIssues(level)).toEqual([]);
  });
  it('flags unknown glyphs and buried markers', () => {
    const level = defineLevel({ name: 'bad', rows: ['?G', 'S#', '##'] });
    const issues = levelIssues(level);
    expect(issues.some((i) => i.includes("unknown glyph '?'"))).toBe(true);
  });
  it('flags a goal inside a solid', () => {
    // Author G, then wall it — simulate by overwriting the tile under the marker.
    const level = defineLevel({ name: 'buried', rows: ['S.', '#G', '##'] });
    // Force goal into a solid cell for the check.
    level.goal = { x: 0, y: 1 };
    expect(levelIssues(level).some((i) => i.includes('goal'))).toBe(true);
  });
});

describe('levelReachable (flood connectivity)', () => {
  it('passes when the goal is openly connected', () => {
    const level = defineLevel({ name: 'open', rows: ['....G', '.....', 'S....', '#####'] });
    expect(levelReachable(level).ok).toBe(true);
  });
  it('fails when the goal is walled off', () => {
    const level = defineLevel({ name: 'walled', rows: ['S.#.G', '..#..', '#####'] });
    const r = levelReachable(level);
    expect(r.ok).toBe(false);
    expect(r.unreachable).toContain('goal');
  });
});

describe('platformerReachable (jump-arc)', () => {
  // A staircase of ledges within a 2-up / 3-across envelope: climbable.
  const climbable = defineLevel({
    name: 'stair',
    rows: [
      '..........G',
      '.........##',
      '.......##..',
      '.....##....',
      '...##......',
      'S##........',
      '###########',
    ],
  });
  it('reaches a goal up a stair inside the jump envelope', () => {
    expect(platformerReachable(climbable, { jumpTiles: 2, runTiles: 3 }).ok).toBe(true);
  });
  it('fails when a ledge is beyond the jump height', () => {
    // Goal marooned five tiles above the highest foothold — no jump reaches it.
    const tooHigh = defineLevel({
      name: 'marooned',
      rows: ['G', '.', '.', '.', '.', 'S', '#'],
    });
    expect(platformerReachable(tooHigh, { jumpTiles: 2, runTiles: 3 }).ok).toBe(false);
  });
});

describe('diffLevels', () => {
  it('reports exactly the tiles and entities that changed', () => {
    const a = defineLevel({ name: 'a', rows: ['S.G', '...', '###'], legend: { o: 'crystal' } });
    const b = defineLevel({ name: 'b', rows: ['S.G', '.o.', '###'], legend: { o: 'crystal' } });
    const changes = diffLevels(a, b);
    expect(changes.some((c) => c.kind === 'entity+' && c.detail.includes('crystal@1,1'))).toBe(true);
    expect(changes.some((c) => c.kind === 'tile' && c.detail.includes('(1,1)'))).toBe(true);
  });
});
