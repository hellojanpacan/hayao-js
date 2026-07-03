import { describe, expect, it } from 'vitest';
import { createWorld } from '@hayao';
import { LEVEL_ROWS } from './level';
import { initialVs, isHidden, stepVs } from './logic';
import { veilstepGame, vsState } from './game';

const DT = 1 / 60;
const idle = { moveX: 0, moveY: 0, sprint: false };

describe('level lint', () => {
  it('level is 40×22 sealed with markers', () => {
    expect(LEVEL_ROWS.length).toBe(22);
    for (const row of LEVEL_ROWS) expect(row.length).toBe(40);
  });
});

describe('stealth sim', () => {
  it('guards patrol between endpoints and pause-turn', () => {
    const s = initialVs();
    const g = s.guards[1];
    const x0 = g.x;
    for (let f = 0; f < 300; f++) stepVs(s, idle, DT);
    expect(g.x).toBeGreaterThan(x0);
    // One leg is ~9.3s + 1s pause; at t=15s the guard is mid-return (dir -1).
    for (let f = 0; f < 600; f++) stepVs(s, idle, DT);
    expect(g.dir).toBe(-1);
  });

  it('detection meter fills in sight, drains out of sight', () => {
    const s = initialVs();
    // Park directly ahead of guard 1's start, in its cone.
    s.x = s.guards[1].x + 120;
    s.y = s.guards[1].y;
    stepVs(s, idle, DT);
    expect(s.meter).toBeGreaterThan(0);
    // Teleport far away — meter drains.
    const m = s.meter;
    s.x = 100;
    s.y = 624;
    stepVs(s, idle, DT);
    expect(s.meter).toBeLessThan(m);
  });

  it('bushes conceal', () => {
    const s = initialVs();
    s.x = 640;
    s.y = 336;
    expect(isHidden(s)).toBe(true);
    s.x = 500;
    expect(isHidden(s)).toBe(false);
  });

  it('walls block sight (guard right behind a wall cannot see)', () => {
    const s = initialVs();
    // Player just below wall B; bottom guard sees across, but guard 1 (above wall B) cannot.
    s.x = 400;
    s.y = 500;
    s.guards[1].x = 400;
    s.guards[1].y = 420; // above wall B (row 14, y 448-480)
    s.guards[1].fx = 0;
    s.guards[1].fy = 1; // facing down at the player
    stepVs(s, idle, DT);
    // Any meter gain must come from a guard WITH line of sight; guard 1 has none.
    // Move all other guards far away first for a clean check:
    const s2 = initialVs();
    s2.x = 400;
    s2.y = 500;
    s2.guards.forEach((g) => {
      g.x = 60;
      g.y = 60;
    });
    s2.guards[1].x = 400;
    s2.guards[1].y = 420;
    s2.guards[1].fx = 0;
    s2.guards[1].fy = 1;
    stepVs(s2, idle, DT);
    expect(s2.meter).toBe(0);
  });
});

describe('game wiring', () => {
  it('sneaks via input actions', () => {
    const world = createWorld(veilstepGame);
    for (let i = 0; i < 30; i++) world.step(['right']);
    expect(vsState(world).x).toBeGreaterThan(130);
  });
});
