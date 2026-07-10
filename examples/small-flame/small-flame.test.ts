// Sim tests — the machine-checkable heart of Small Flame, run headlessly by
// `npm test`. The full feel-gate + golden suite lives in verify.ts.

import { describe, it, expect } from 'vitest';
import { createWorld, checkDeterministic, tilemapFromAscii, levelIssues, type InputLog } from '@hayao';
import { DEFAULT_FLAME, FLAME_NEUTRAL, GOAL_POINT, LEVEL, MAP, TILE, spawnState, stepFlame, type Point } from './logic';
import { smallFlameGame } from './game';
import { driveBot } from './bot';

const DT = 1 / 60;
const cfg = DEFAULT_FLAME;
const FAR: Point = { x: -9999, y: -9999 };
const openMap = tilemapFromAscii(Array.from({ length: 48 }, () => '.'.repeat(8)), TILE);

describe('Small Flame', () => {
  it('has clean level data', () => {
    expect(levelIssues(LEVEL)).toEqual([]);
  });

  it('is winnable by a 0-death fuel-aware bot', () => {
    const run = driveBot(cfg);
    expect(run.deaths).toBe(0);
    expect(run.won).toBe(true);
  });

  it('replays the bot flight deterministically to a win', () => {
    const run = driveBot(cfg);
    const log: InputLog = { frames: run.frames };
    const world = createWorld(smallFlameGame);
    for (const f of log.frames) world.step(f);
    expect(world.probe().won).toBe(true);
    expect(checkDeterministic(() => createWorld(smallFlameGame), log).ok).toBe(true);
  });

  it('makes fuel bite: one tank cannot clear the screen in open air', () => {
    const s = spawnState(cfg);
    s.onGround = false;
    s.x = 120;
    s.y = 1600;
    const startY = s.y;
    let minY = s.y;
    let pressed = true;
    for (let i = 0; i < 600 && s.fuel > 0; i++) {
      stepFlame(s, { moveX: 0, thrustHeld: true, thrustPressed: pressed }, DT, openMap, cfg, [], FAR);
      pressed = false;
      minY = Math.min(minY, s.y);
    }
    const oneTankClimb = startY - minY;
    const riseNeeded = spawnState(cfg).y - (GOAL_POINT.y - cfg.height / 2);
    expect(oneTankClimb).toBeLessThan(riseNeeded);
    expect(oneTankClimb).toBeGreaterThanOrEqual(250);
  });

  it('pops off coyote time but refuses a press past the window', () => {
    const acceptsCoyote = (delayFrames: number): boolean => {
      const s = spawnState(cfg);
      s.onGround = false;
      s.x = 120;
      s.y = 200;
      for (let i = 0; i < delayFrames; i++) stepFlame(s, FLAME_NEUTRAL, DT, openMap, cfg, [], FAR);
      return stepFlame(s, { moveX: 0, thrustHeld: true, thrustPressed: true }, DT, openMap, cfg, [], FAR).popped;
    };
    expect(acceptsCoyote(0)).toBe(true);
    expect(acceptsCoyote(2)).toBe(true);
    expect(acceptsCoyote(30)).toBe(false); // long past the window
  });

  it('refuels on landing and never exceeds the tank', () => {
    const s = spawnState(cfg);
    s.fuel = 0.1;
    // Sit on the spawn floor and let it refill.
    for (let i = 0; i < 120; i++) stepFlame(s, FLAME_NEUTRAL, DT, MAP, cfg, [], FAR);
    expect(s.fuel).toBeLessThanOrEqual(cfg.fuelMax);
    expect(s.fuel).toBeGreaterThan(0.1);
  });
});
