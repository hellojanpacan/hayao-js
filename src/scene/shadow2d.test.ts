import { describe, expect, it } from 'vitest';
import { cullSegments, occludersFromTilemap, shadowQuads } from './shadow2d';
import { tilemapFromAscii } from '../physics/tilemap';

describe('shadow2d — occludersFromTilemap', () => {
  it('traces the solid/empty boundary of an ASCII map into design-space segments', () => {
    // A single solid block in the middle of a 3×3 open map.
    const map = tilemapFromAscii(['...', '.#.', '...'], 10);
    const segs = occludersFromTilemap(map);
    expect(segs.length).toBeGreaterThan(0);
    // Every endpoint is inside the map's design bounds (30×30).
    for (const s of segs) {
      expect(s.a.x).toBeGreaterThanOrEqual(0);
      expect(s.a.x).toBeLessThanOrEqual(30);
      expect(s.b.y).toBeLessThanOrEqual(30);
    }
  });

  it('is deterministic — same map yields identical segments', () => {
    const rows = ['#....', '..#..', '....#'];
    const a = occludersFromTilemap(tilemapFromAscii(rows, 8));
    const b = occludersFromTilemap(tilemapFromAscii(rows, 8));
    expect(a).toEqual(b);
  });

  it('an all-empty map casts no occluders', () => {
    expect(occludersFromTilemap(tilemapFromAscii(['...', '...'], 10))).toEqual([]);
  });
});

describe('shadow2d — cullSegments', () => {
  const light = { x: 0, y: 0 };
  const near = { a: { x: 5, y: 0 }, b: { x: 5, y: 10 } };
  const far = { a: { x: 500, y: 500 }, b: { x: 510, y: 500 } };

  it('keeps segments within the light radius and drops far ones', () => {
    const kept = cullSegments(light, 50, [near, far]);
    expect(kept).toEqual([near]);
  });

  it('keeps a segment that straddles the disc even with both endpoints outside', () => {
    // A long horizontal wall passing near the light: endpoints far, midpoint close.
    const straddle = { a: { x: -100, y: 5 }, b: { x: 100, y: 5 } };
    expect(cullSegments(light, 20, [straddle])).toEqual([straddle]);
  });
});

describe('shadow2d — shadowQuads', () => {
  it('extrudes one closed quad per segment away from the light by 2×radius', () => {
    const light = { x: 0, y: 0 };
    const radius = 100;
    const seg = { a: { x: 10, y: -5 }, b: { x: 10, y: 5 } };
    const quads = shadowQuads(light, radius, [seg]);
    expect(quads).toHaveLength(1);
    const q = quads[0];
    expect(q).toHaveLength(8); // [ax,ay,bx,by, bex,bey, aex,aey]
    // Near edge is the segment itself.
    expect([q[0], q[1], q[2], q[3]]).toEqual([10, -5, 10, 5]);
    // Far vertices are further from the light than the near ones (extruded outward).
    const nearDist = Math.hypot(q[0], q[1]);
    const farDist = Math.hypot(q[6], q[7]);
    expect(farDist).toBeGreaterThan(nearDist);
  });

  it('is deterministic (dmath extrusion) — identical quads for identical input', () => {
    const light = { x: 3, y: 7 };
    const segs = [{ a: { x: 40, y: 40 }, b: { x: 60, y: 40 } }];
    expect(shadowQuads(light, 80, segs)).toEqual(shadowQuads(light, 80, segs));
  });

  it('snapshot: a wall to the right of the light casts a rightward shadow quad', () => {
    const quads = shadowQuads({ x: 0, y: 50 }, 90, [{ a: { x: 70, y: 40 }, b: { x: 70, y: 60 } }]);
    expect(quads).toMatchSnapshot();
  });

  it('skips a segment whose endpoint sits on the light (no extrusion direction)', () => {
    const light = { x: 10, y: 10 };
    const seg = { a: { x: 10, y: 10 }, b: { x: 20, y: 10 } };
    // The a-endpoint is on the light; that quad is skipped entirely.
    expect(shadowQuads(light, 50, [seg])).toEqual([]);
  });
});
