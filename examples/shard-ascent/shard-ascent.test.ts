import { describe, expect, it } from 'vitest';
import { createWorld } from '@hayao';
import { LEVELS } from './levels';
import { moverX, parseLevel } from './logic';
import { gotoLevel, saState, shardAscentGame } from './game';

describe('level lint', () => {
  it('every level is 40×22, sealed, and has @ and E markers', () => {
    for (const [i, lvl] of LEVELS.entries()) {
      expect(lvl.rows.length, `level ${i} row count`).toBe(22);
      for (const [r, row] of lvl.rows.entries()) expect(row.length, `level ${i} row ${r} width`).toBe(40);
      expect(lvl.rows[0]).toBe('#'.repeat(40));
      expect(lvl.rows[21]).toBe('#'.repeat(40));
      for (const row of lvl.rows) {
        expect(row[0]).toBe('#');
        expect(row[39]).toBe('#');
      }
      expect(() => parseLevel(i)).not.toThrow();
      if (lvl.needsShard) expect(parseLevel(i).shard).not.toBeNull();
    }
  });
});

describe('movers', () => {
  it('ping-pong stays in bounds and is periodic', () => {
    const m = { x0: 288, x1: 736, y: 448, w: 96, h: 14, speed: 90 };
    const period = (2 * (m.x1 - m.x0)) / m.speed;
    for (let t = 0; t < period * 2; t += 0.37) {
      const x = moverX(m, t);
      expect(x).toBeGreaterThanOrEqual(m.x0);
      expect(x).toBeLessThanOrEqual(m.x1);
      expect(moverX(m, t + period)).toBeCloseTo(x, 6);
    }
    expect(moverX(m, 0)).toBe(m.x0);
  });
});

describe('game wiring', () => {
  it('spawns grounded and runs right deterministically', () => {
    const world = createWorld(shardAscentGame);
    for (let i = 0; i < 30; i++) world.step(['right']);
    const p = world.probe() as { x: number; onGround: boolean };
    expect(p.x).toBeGreaterThan(140);
    expect(p.onGround).toBe(true);
  });

  it('jump gains height', () => {
    const world = createWorld(shardAscentGame);
    world.step([]);
    const y0 = (world.probe() as { y: number }).y;
    world.step(['jump']);
    for (let i = 0; i < 15; i++) world.step(['jump']);
    expect((world.probe() as { y: number }).y).toBeLessThan(y0 - 60);
  });

  it('gotoLevel jumps levels and resets shard state', () => {
    const world = createWorld(shardAscentGame);
    gotoLevel(world, 3);
    world.step([]);
    expect(saState(world).level).toBe(3);
    expect(saState(world).shard).toBe(false);
  });
});
