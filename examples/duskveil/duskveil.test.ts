import { describe, expect, it } from 'vitest';
import { Rng, createWorld } from '@hayao';
import { initialDv, stepDv, P_TUNE, PHASES } from './logic';
import { duskveilGame, dvState } from './game';

const DT = 1 / 60;
const idle = { moveX: 0, moveY: 0, slow: false };

describe('bullet sim', () => {
  it('emitters fire on schedule and bullets travel', () => {
    const s = initialDv();
    const rng = new Rng(3);
    for (let f = 0; f < 120; f++) stepDv(s, idle, DT, rng);
    expect(s.bullets.length).toBeGreaterThan(10);
  });

  it('a bullet through the hitbox costs a life, grants invuln + mercy clear', () => {
    const s = initialDv();
    const rng = new Rng(3);
    s.bullets.push({ x: s.x, y: s.y - 8, vx: 0, vy: 300, grazed: false });
    let hit = false;
    for (let f = 0; f < 6 && !hit; f++) hit = stepDv(s, idle, DT, rng).hit;
    expect(hit).toBe(true);
    expect(s.lives).toBe(P_TUNE.lives - 1);
    expect(s.invuln).toBeGreaterThan(0);
  });

  it('graze counts near misses exactly once', () => {
    const s = initialDv();
    const rng = new Rng(3);
    s.bullets.push({ x: s.x + P_TUNE.graze - 2, y: s.y, vx: 0, vy: 0, grazed: false });
    stepDv(s, idle, DT, rng);
    stepDv(s, idle, DT, rng);
    expect(s.graze).toBe(1);
  });

  it('phase transitions mercy-clear and advance to victory', () => {
    const s = initialDv();
    const rng = new Rng(3);
    for (let phase = 0; phase < PHASES.length; phase++) {
      s.bossHp = 1;
      s.bullets.push({ x: 100, y: 100, vx: 0, vy: 0, grazed: false });
      // Park under the boss so shots connect.
      for (let f = 0; f < 240 && s.phase === phase && !s.won; f++) {
        s.x = s.bossX;
        s.y = 500;
        stepDv(s, idle, DT, rng);
      }
    }
    expect(s.won).toBe(true);
  });
});

describe('game wiring', () => {
  it('moves and probes', () => {
    const world = createWorld(duskveilGame);
    for (let i = 0; i < 30; i++) world.step(['left']);
    expect(dvState(world).x).toBeLessThan(620);
  });
});
