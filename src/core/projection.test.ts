import { describe, it, expect } from 'vitest';
import { iso } from './projection';

describe('iso projection', () => {
  it('round-trips every integer cell exactly (2:1 iso)', () => {
    const p = iso({ tileW: 64, tileH: 32, origin: { x: 400, y: 100 } });
    for (let gx = -20; gx <= 20; gx++) {
      for (let gy = -20; gy <= 20; gy++) {
        const s = p.toScreen(gx, gy);
        const g = p.toGrid(s.x, s.y);
        expect(g.x).toBe(gx);
        expect(g.y).toBe(gy);
      }
    }
  });

  it('places the origin cell at the configured origin', () => {
    const p = iso({ tileW: 64, tileH: 32, origin: { x: 400, y: 100 } });
    expect(p.toScreen(0, 0)).toEqual({ x: 400, y: 100 });
  });

  it('elevation lifts the point by elevStep per unit toward -y', () => {
    const p = iso({ tileW: 64, tileH: 32, elevStep: 16 });
    const flat = p.toScreen(2, 3, 0);
    const raised = p.toScreen(2, 3, 2);
    expect(raised.x).toBe(flat.x);
    expect(raised.y).toBe(flat.y - 32);
  });

  it('elevStep defaults to tileH', () => {
    const p = iso({ tileW: 64, tileH: 32 });
    expect(p.elevStep).toBe(32);
  });

  it('toGrid ignores elevation (ground-plane pick)', () => {
    const p = iso({ tileW: 80, tileH: 40 });
    // A screen point returns a fractional ground cell; floor for the tile.
    const g = p.toGrid(40, 20);
    expect(g.x).toBeCloseTo(1, 10);
    expect(g.y).toBeCloseTo(0, 10);
  });
});
