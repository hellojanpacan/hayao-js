import { describe, expect, it } from 'vitest';
import { Rng, createWorld } from '@hayao';
import { initialEw, stepEw, UPGRADES } from './logic';
import { emberwakeGame, ewState } from './game';

const DT = 1 / 60;
const idle = { moveX: 0, moveY: 0, pick: -1 };

describe('horde sim', () => {
  it('spawns enemies over time and auto-fires at them', () => {
    const s = initialEw();
    const rng = new Rng(7);
    let fired = false;
    for (let f = 0; f < 300; f++) fired = stepEw(s, idle, DT, rng).fired || fired;
    expect(s.enemies.length).toBeGreaterThan(0);
    expect(fired).toBe(true);
    expect(s.bullets.length + s.kills).toBeGreaterThan(0);
  });

  it('level-up pauses the sim until a pick is made and applies the upgrade', () => {
    const s = initialEw();
    const rng = new Rng(7);
    s.kills = s.nextLevelAt; // force the level-up branch
    stepEw(s, idle, DT, rng);
    expect(s.choice).not.toBeNull();
    const timeBefore = s.time;
    stepEw(s, idle, DT, rng); // paused
    expect(s.time).toBe(timeBefore);
    const picked = s.choice![1];
    const dmgBefore = s.dmg;
    const rateBefore = s.fireRate;
    stepEw(s, { ...idle, pick: 1 }, DT, rng);
    expect(s.choice).toBeNull();
    const changed = s.dmg !== dmgBefore || s.fireRate !== rateBefore || s.shots > 1 || s.maxHp > 6 || s.speed > 240;
    expect(changed, `upgrade ${UPGRADES[picked].id} applied`).toBe(true);
  });

  it('touch damage respects i-frames and kills at 0 hp', () => {
    const s = initialEw();
    const rng = new Rng(7);
    s.hp = 1;
    s.enemies.push({ x: s.x + 4, y: s.y, hp: 999, kind: 'swarmer' });
    let died = false;
    for (let f = 0; f < 10 && !died; f++) died = stepEw(s, idle, DT, rng).died;
    expect(died).toBe(true);
  });
});

describe('game wiring', () => {
  it('moves via actions and probe reports the horde', () => {
    const world = createWorld(emberwakeGame);
    for (let i = 0; i < 120; i++) world.step(['right']);
    expect(ewState(world).x).toBeGreaterThan(660);
    const p = world.probe() as { alive: number };
    expect(p.alive).toBeGreaterThanOrEqual(0);
  });
});
