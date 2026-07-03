import { describe, expect, it } from 'vitest';
import { createWorld, getBody, hashValue } from '@hayao';
import { BALLS, TABLE, ballPos, flipperAngle, initialPb, stepPb, type PbState } from './logic';
import { brasswickGame, pbState } from './game';

const DT = 1 / 60;
const NO = { left: false, right: false, launch: false };
const pump = (s: PbState, n: number, input = NO) => {
  for (let k = 0; k < n; k++) stepPb(s, input, DT);
};

describe('brasswick logic', () => {
  it('the table builds: three bells, two flippers, a drain, three balls', () => {
    const s = initialPb();
    expect(s.bells.length).toBe(3);
    expect(s.ballsLeft).toBe(BALLS);
    expect(getBody(s.phys, s.flipL)?.kind).toBe('kinematic');
    expect(getBody(s.phys, s.drain)?.sensor).toBe(true);
  });

  it('flippers snap up when held and fall back when released', () => {
    const s = initialPb();
    pump(s, 30);
    const rest = flipperAngle(s, 'L');
    pump(s, 6, { ...NO, left: true });
    expect(flipperAngle(s, 'L')).toBeLessThan(rest - 0.8); // swung up
    pump(s, 20);
    expect(Math.abs(flipperAngle(s, 'L') - rest)).toBeLessThan(0.05); // back to rest
  });

  it('serving spends a ball and puts a CCD bullet in play', () => {
    const s = initialPb();
    stepPb(s, { ...NO, launch: true }, DT);
    expect(s.ballsLeft).toBe(BALLS - 1);
    expect(s.ball).not.toBe(0);
    expect(getBody(s.phys, s.ball)?.bullet).toBe(true);
  });

  it('an unplayed ball drains and three drains lose the game', () => {
    const s = initialPb();
    for (let ball = 0; ball < BALLS; ball++) {
      stepPb(s, { ...NO, launch: true }, DT);
      for (let f = 0; f < 60 * 30 && s.ball !== 0; f++) stepPb(s, NO, DT);
      expect(s.ball).toBe(0); // gravity always wins an unflipped table
    }
    expect(s.dead).toBe(true);
  });

  it('a bell contact scores, lights the bell, and kicks the ball away', () => {
    const s = initialPb();
    stepPb(s, { ...NO, launch: true }, DT);
    const b = getBody(s.phys, s.ball)!;
    const bell = s.bells[2]; // center bell
    b.x = bell.x; b.y = bell.y - bell.r - 12; b.vx = 0; b.vy = 300;
    let hit = false;
    for (let f = 0; f < 30 && !hit; f++) hit = stepPb(s, NO, DT).bells > 0;
    expect(hit).toBe(true);
    expect(s.score).toBeGreaterThan(0);
    expect(s.bells[2].lit).toBe(true);
    expect(getBody(s.phys, s.ball)!.vy).toBeLessThan(0); // kicked back up
  });

  it('is deterministic and clone-resumable mid-rally', () => {
    const play = (s: PbState) => {
      stepPb(s, { ...NO, launch: true }, DT);
      for (let f = 0; f < 300; f++) stepPb(s, { left: f % 40 < 8, right: f % 56 < 8, launch: false }, DT);
    };
    const a = initialPb(); play(a);
    const b = initialPb(); play(b);
    expect(hashValue(a)).toBe(hashValue(b));
    const c = structuredClone(a);
    pump(a, 120); pump(c, 120);
    expect(hashValue(a)).toBe(hashValue(c));
  });

  it('the ball never leaves the table (CCD at play speeds)', () => {
    const s = initialPb();
    stepPb(s, { ...NO, launch: true }, DT);
    for (let f = 0; f < 60 * 20; f++) {
      const b = ballPos(s);
      stepPb(s, { left: f % 30 < 8, right: f % 30 < 8, launch: !b && s.ballsLeft > 0 }, DT);
      const p = ballPos(s);
      if (!p) continue;
      expect(p.x).toBeGreaterThan(TABLE.left - 6);
      expect(p.x).toBeLessThan(TABLE.right + 6);
      expect(p.y).toBeGreaterThan(TABLE.top - 6);
    }
  });
});

describe('brasswick through the input layer', () => {
  it('keys serve and flip; the probe tracks play', () => {
    const world = createWorld(brasswickGame);
    world.step(['launch']);
    expect((world.probe() as { inPlay: boolean }).inPlay).toBe(true);
    const angBefore = flipperAngle(pbState(world), 'L');
    for (let k = 0; k < 6; k++) world.step(['left']);
    expect(flipperAngle(pbState(world), 'L')).toBeLessThan(angBefore - 0.5);
  });
});
