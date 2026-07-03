import { describe, expect, it } from 'vitest';
import { createWorld } from '@hayao';
import { initialPs, makePegs, stepPs, sweptCircleHit } from './logic';
import { pinshineGame, psState } from './game';

const DT = 1 / 60;
const idle = { aimDir: 0, launch: false };

describe('swept collision', () => {
  it('finds the exact time of impact', () => {
    // Ball at x=0 moving 100px/s toward a circle at x=50 with combined R 19:
    // contact at x=31 → t=0.31s.
    const t = sweptCircleHit(0, 0, 100, 0, 50, 0, 19, 1);
    expect(t).toBeCloseTo(0.31, 5);
  });

  it('returns 0 for already-overlapping and null for misses', () => {
    expect(sweptCircleHit(0, 0, 10, 0, 5, 0, 19, 1)).toBe(0);
    expect(sweptCircleHit(0, 0, 100, 0, 50, 40, 19, 1)).toBeNull();
  });
});

describe('board', () => {
  it('has 10 orange pegs in the lattice', () => {
    const pegs = makePegs();
    expect(pegs.filter((p) => p.orange).length).toBe(10);
    expect(pegs.length).toBeGreaterThan(50);
  });

  it('launching spends a ball; the flight lights pegs; exit clears them', () => {
    const s = initialPs();
    s.aim = 0.1;
    stepPs(s, { aimDir: 0, launch: true }, DT);
    expect(s.ballsLeft).toBe(7);
    const pegsBefore = s.pegs.length;
    for (let f = 0; f < 60 * 20 && s.ball; f++) stepPs(s, idle, DT);
    expect(s.ball).toBeNull();
    expect(s.pegs.length).toBeLessThan(pegsBefore);
    expect(s.score).toBeGreaterThan(0);
  });

  it('aiming clamps to the fan', () => {
    const s = initialPs();
    for (let f = 0; f < 240; f++) stepPs(s, { aimDir: 1, launch: false }, DT);
    expect(s.aim).toBeLessThanOrEqual(1.2);
  });
});

describe('game wiring', () => {
  it('aim + launch flow through input actions', () => {
    const world = createWorld(pinshineGame);
    for (let i = 0; i < 10; i++) world.step(['left']);
    world.step(['launch']);
    expect(psState(world).ballsLeft).toBe(7);
  });
});
