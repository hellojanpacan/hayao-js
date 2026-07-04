import { describe, it, expect } from 'vitest';
import { tilemapFromAscii } from '@hayao';
import { KINTSUGI_WORLD } from './world';
import { roomSpec, roomRows, buildRoom, AUTHORED_REGIONS, RW, RH, type Dir } from './rooms';

const OPPOSITE: Record<Dir, Dir> = { left: 'right', right: 'left', up: 'down', down: 'up' };
const edgeExists = (a: string, b: string): boolean =>
  KINTSUGI_WORLD.edges.some((e) => (e.from === a && e.to === b) || (!e.oneWay && e.to === a && e.from === b));

describe('Kintsugi rooms — geometry honours the proven graph', () => {
  it('every authored room builds to a valid 40×22 tilemap', () => {
    for (const region of AUTHORED_REGIONS) {
      const rows = roomRows(region)!;
      expect(rows).toHaveLength(RH);
      for (const r of rows) expect(r.length).toBe(RW);
      // parses cleanly into a collision tilemap
      const map = tilemapFromAscii(rows, 32);
      expect(map.cols).toBe(RW);
      expect(map.rows).toBe(RH);
    }
  });

  it('every room exit corresponds to a real world-graph edge', () => {
    for (const region of AUTHORED_REGIONS) {
      const spec = roomSpec(region)!;
      for (const [, target] of Object.entries(spec.exits)) {
        expect(KINTSUGI_WORLD.regions.some((r) => r.id === target)).toBe(true);
        expect(edgeExists(region, target as string)).toBe(true);
      }
    }
  });

  it('exits between two authored rooms are reciprocal (seams line up)', () => {
    const authored = new Set(AUTHORED_REGIONS);
    for (const region of AUTHORED_REGIONS) {
      const spec = roomSpec(region)!;
      for (const [dir, target] of Object.entries(spec.exits) as [Dir, string][]) {
        if (!authored.has(target)) continue; // neighbour in another biome, not yet authored
        const back = roomSpec(target)!;
        expect(back.exits[OPPOSITE[dir]]).toBe(region);
      }
    }
  });

  it('the start room and its shrine are authored', () => {
    expect(AUTHORED_REGIONS).toContain(KINTSUGI_WORLD.start);
    expect(AUTHORED_REGIONS).toContain('grove_shrine');
    // the Goldstep marker exists in the shrine
    expect(buildRoom(roomSpec('grove_shrine')!).some((r) => r.includes('S'))).toBe(true);
  });
});
