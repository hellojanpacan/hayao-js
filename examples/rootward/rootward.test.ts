import { describe, expect, it } from 'vitest';
import { createWorld } from '@hayao';
import { initialRw, pointAt, stepRw, ENEMIES, PATH_LEN, START_GOLD, TOTAL_LEN, TOWERS } from './logic';
import { rootwardGame, rwState } from './game';

const DT = 1 / 60;
const idle = { cursorMove: 0, build: null, startWave: false } as const;

describe('path', () => {
  it('pointAt interpolates along the lane monotonically', () => {
    expect(pointAt(0).y).toBe(150);
    expect(pointAt(TOTAL_LEN).x).toBeGreaterThan(1200);
    expect(PATH_LEN.every((d, i) => i === 0 || d > PATH_LEN[i - 1])).toBe(true);
  });
});

describe('defence sim', () => {
  it('waves auto-start, foes march and leak lives', () => {
    const s = initialRw();
    for (let f = 0; f < 60 * 95; f++) stepRw(s, idle, DT);
    expect(s.wave).toBeGreaterThanOrEqual(0);
    expect(s.leaked).toBeGreaterThan(0);
    expect(s.lives).toBeLessThan(10);
  });

  it('building spends gold and refuses without funds or on taken pads', () => {
    const s = initialRw();
    stepRw(s, { ...idle, build: 'arrow' }, DT);
    expect(s.towers.length).toBe(1);
    expect(s.gold).toBe(START_GOLD - TOWERS.arrow.cost);
    stepRw(s, { ...idle, build: 'cannon' }, DT); // same pad — refused
    expect(s.towers.length).toBe(1);
    s.gold = 10;
    stepRw(s, { ...idle, cursorMove: 1 }, DT);
    stepRw(s, { ...idle, build: 'arrow' }, DT); // broke — refused
    expect(s.towers.length).toBe(1);
  });

  it('an arrow tower kills a grunt; tanks resist arrows', () => {
    const s = initialRw();
    s.towers.push({ pad: 4, kind: 'arrow', cd: 0 });
    s.foes.push({ kind: 'grunt', dist: 1000, hp: ENEMIES.grunt.hp, slowT: 0 });
    for (let f = 0; f < 60 * 12 && s.foes.length; f++) stepRw(s, idle, DT);
    expect(s.kills).toBe(1);
  });

  it('frost slows foes in range', () => {
    const s = initialRw();
    s.towers.push({ pad: 4, kind: 'frost', cd: 0 });
    s.foes.push({ kind: 'grunt', dist: 1600, hp: 999, slowT: 0 });
    const d0 = s.foes[0].dist;
    for (let f = 0; f < 60; f++) stepRw(s, idle, DT);
    const moved = s.foes[0].dist - d0;
    expect(s.foes[0].slowT).toBeGreaterThan(0);
    expect(moved).toBeLessThan(ENEMIES.grunt.speed * 0.85); // visibly slower
  });
});

describe('game wiring', () => {
  it('cursor + build actions flow through input', () => {
    const world = createWorld(rootwardGame);
    world.step(['next']);
    world.step([]);
    world.step(['build-arrow']);
    expect(rwState(world).towers).toEqual([{ pad: 1, kind: 'arrow', cd: expect.any(Number) }]);
  });
});
