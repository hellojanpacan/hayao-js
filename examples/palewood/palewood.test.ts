import { describe, expect, it } from 'vitest';
import { Rng, createWorld } from '@hayao';
import { inLight, initialPw, stepPw, WOODS_ROWS, LANTERN } from './logic';
import { pwState, palewoodGame } from './game';

const DT = 1 / 60;
const idle = { moveX: 0, moveY: 0 };

describe('woods lint', () => {
  it('map is 40×22 sealed', () => {
    expect(WOODS_ROWS.length).toBe(22);
    for (const r of WOODS_ROWS) expect(r.length).toBe(40);
  });
});

describe('light', () => {
  it('radius-bounds and LOS-bounds the lantern; no fuel = no light', () => {
    const s = initialPw();
    expect(inLight(s, s.x + 100, s.y)).toBe(true);
    expect(inLight(s, s.x + LANTERN.radius + 40, s.y)).toBe(false);
    s.fuel = 0;
    expect(inLight(s, s.x + 100, s.y)).toBe(false);
  });

  it('trees block the light (shadowing)', () => {
    const s = initialPw();
    // Copse at cols 20-21, rows 5-6 (x 640-704, y 160-224). Stand west of it.
    s.x = 560;
    s.y = 192;
    expect(inLight(s, 740, 192)).toBe(false); // behind the trees
    expect(inLight(s, 600, 192)).toBe(true);
  });
});

describe('night sim', () => {
  it('fuel drains in real time and cans refuel', () => {
    const rng = new Rng(1);
    const s = initialPw();
    for (let f = 0; f < 60; f++) stepPw(s, idle, DT, rng);
    expect(s.fuel).toBeLessThan(LANTERN.fuelMax);
    s.cans[0] = { x: s.x, y: s.y };
    const fuel = s.fuel;
    stepPw(s, idle, DT, rng);
    expect(s.fuel).toBeGreaterThan(fuel);
    expect(s.fetched).toBe(1);
  });

  it('pales spawn as the night deepens', () => {
    const rng = new Rng(1);
    const s = initialPw();
    for (let f = 0; f < 60 * 20; f++) stepPw(s, idle, DT, rng);
    expect(s.pales.length).toBeGreaterThan(0);
  });
});

describe('game wiring', () => {
  it('moves through the input layer', () => {
    const world = createWorld(palewoodGame);
    for (let i = 0; i < 30; i++) world.step(['right']);
    expect(pwState(world).x).toBeGreaterThan(660);
  });
});
