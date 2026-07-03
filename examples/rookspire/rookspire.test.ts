import { describe, expect, it } from 'vitest';
import { createWorld, getBody, hashValue } from '@hayao';
import { GROUND_Y, LEVEL_SHOTS, idolsLeft, initialRk, stepRk, type RkState } from './logic';
import { rookspireGame, rkState } from './game';

const DT = 1 / 60;
const NO_INPUT = { aimDir: 0, powerDir: 0, launch: false };
const pump = (s: RkState, n: number) => {
  for (let k = 0; k < n; k++) stepRk(s, NO_INPUT, DT);
};

describe('rookspire logic', () => {
  it('levels build with the right rooks and stone budgets', () => {
    for (const [level, expectIdols] of [[0, 1], [1, 3], [2, 2]] as const) {
      const s = initialRk(level);
      expect(idolsLeft(s)).toBe(expectIdols);
      expect(s.shotsLeft).toBe(LEVEL_SHOTS[level]);
      expect(s.phys.bodies.length).toBeGreaterThan(3);
    }
  });

  it('castles settle and sleep without a shot fired', () => {
    const s = initialRk(1);
    pump(s, 300);
    const awake = s.phys.bodies.filter((b) => b.kind === 'dynamic' && !b.sleeping);
    expect(awake.length).toBe(0);
    expect(idolsLeft(s)).toBe(3); // nothing collapsed on its own
  });

  it('launching spends a stone and puts a bullet in flight', () => {
    const s = initialRk(0);
    stepRk(s, { ...NO_INPUT, launch: true }, DT);
    expect(s.shotsLeft).toBe(LEVEL_SHOTS[0] - 1);
    expect(s.proj).not.toBe(0);
    const p = getBody(s.phys, s.proj)!;
    expect(p.bullet).toBe(true);
    expect(Math.hypot(p.vx, p.vy)).toBeGreaterThan(400);
  });

  it('a rook that touches the earth shatters', () => {
    const s = initialRk(0);
    pump(s, 120); // settle
    const rook = s.idols[0];
    const b = getBody(s.phys, rook.id)!;
    b.x = 600; b.y = GROUND_Y - 20; // place it on the ground plain
    b.sleeping = false;
    stepRk(s, NO_INPUT, DT);
    expect(rook.alive).toBe(false);
    expect(s.won).toBe(true);
  });

  it('running out of stones with rooks standing loses (after the dust settles)', () => {
    const s = initialRk(0);
    s.aim = -1.3; s.power = 0; // lob three duds straight up-left
    for (let shot = 0; shot < 3; shot++) {
      stepRk(s, { ...NO_INPUT, launch: true }, DT);
      for (let f = 0; f < 600 && s.proj !== 0; f++) stepRk(s, NO_INPUT, DT);
    }
    pump(s, 200);
    expect(s.dead).toBe(true);
    expect(s.won).toBe(false);
  });

  it('is deterministic: same script → identical state hash', () => {
    const run = () => {
      const s = initialRk(1);
      pump(s, 30);
      stepRk(s, { ...NO_INPUT, launch: true }, DT);
      pump(s, 400);
      return s;
    };
    expect(hashValue(run())).toBe(hashValue(run()));
  });

  it('a mid-collapse structuredClone resumes identically', () => {
    const a = initialRk(2);
    stepRk(a, { ...NO_INPUT, launch: true }, DT);
    for (let f = 0; f < 40; f++) stepRk(a, NO_INPUT, DT);
    const b = structuredClone(a);
    for (let f = 0; f < 200; f++) { stepRk(a, NO_INPUT, DT); stepRk(b, NO_INPUT, DT); }
    expect(hashValue(a)).toBe(hashValue(b));
  });
});

describe('rookspire through the input layer', () => {
  it('keys aim the sling and the probe tracks flight', () => {
    const world = createWorld(rookspireGame);
    const aim0 = rkState(world).aim;
    for (let k = 0; k < 20; k++) world.step(['up']);
    expect(rkState(world).aim).toBeLessThan(aim0);
    world.step(['launch']);
    expect((world.probe() as { inFlight: boolean }).inFlight).toBe(true);
  });
});
