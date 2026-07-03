import { describe, expect, it } from 'vitest';
import { tilemapFromAscii } from './tilemap';
import { inVisionCone, lineOfSight, raycastTiles } from './raycast';

// 10×6 room with a pillar at cols 4-5, row 2.
const map = tilemapFromAscii([
  '##########',
  '#        #',
  '#   ##   #',
  '#        #',
  '#        #',
  '##########',
]);

describe('raycastTiles', () => {
  it('clear ray reaches its target', () => {
    const r = raycastTiles(map, 48, 112, 240, 112); // row 3, left to right — under the pillar
    expect(r.blocked).toBe(false);
    expect(r.x).toBe(240);
  });

  it('solid tile blocks and reports the hit point', () => {
    const r = raycastTiles(map, 48, 80, 240, 80); // row 2 — straight into the pillar
    expect(r.blocked).toBe(true);
    expect(r.x).toBeCloseTo(128, 0); // pillar's left face (col 4 → x=128)
    expect(r.dist).toBeLessThan(200);
  });

  it('diagonal rays block on corners correctly', () => {
    const r = raycastTiles(map, 48, 48, 260, 150);
    expect(r.blocked).toBe(true); // clips the pillar
    const clear = raycastTiles(map, 48, 140, 260, 150);
    expect(clear.blocked).toBe(false);
  });

  it('lineOfSight is symmetric for clear and blocked pairs', () => {
    expect(lineOfSight(map, 48, 112, 240, 112)).toBe(true);
    expect(lineOfSight(map, 48, 80, 240, 80)).toBe(false);
    expect(lineOfSight(map, 240, 80, 48, 80)).toBe(false);
  });
});

describe('inVisionCone', () => {
  it('sees inside the cone, not outside it, never through walls', () => {
    // Watcher at (60, 112) facing right, 90° cone, range 220.
    const fov = Math.PI / 2;
    expect(inVisionCone(map, 60, 112, 1, 0, fov, 220, 200, 112)).toBe(true); // dead ahead
    expect(inVisionCone(map, 60, 112, 1, 0, fov, 220, 60, 30)).toBe(false); // 90°+ off-axis
    expect(inVisionCone(map, 60, 112, 1, 0, fov, 220, 290, 112)).toBe(false); // out of range
    expect(inVisionCone(map, 60, 80, 1, 0, fov, 220, 240, 80)).toBe(false); // behind the pillar
  });
});
