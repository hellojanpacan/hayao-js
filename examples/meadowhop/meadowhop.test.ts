import { describe, it, expect } from 'vitest';
import { platformerReachable, levelIssues, type PadInput } from '@hayao';
import { LEVEL, JUMP_TILES, RUN_TILES, COINS, CONFIG, TILE_PX, DEATH_DELAY, freshMeadowState, stepMeadow, collectedCount, reachedGoal } from './logic';

const hold = (moveX: number, jump = false): PadInput => ({ moveX, moveY: 0, jumpHeld: jump, jumpPressed: jump, dashPressed: false });

describe('meadowhop room', () => {
  it('is well-formed', () => {
    expect(levelIssues(LEVEL)).toEqual([]);
  });

  it('has coins and a goal that are all reachable within the jump envelope', () => {
    expect(COINS.length).toBeGreaterThanOrEqual(4);
    const reach = platformerReachable(LEVEL, { jumpTiles: JUMP_TILES, runTiles: RUN_TILES });
    expect(reach.unreachable).toEqual([]);
    expect(reach.ok).toBe(true);
  });
});

describe('controls', () => {
  it('running right moves the hero and collects a ground coin', () => {
    const s = freshMeadowState();
    const x0 = s.pc.x;
    for (let f = 0; f < 80; f++) stepMeadow(s, hold(1), 1 / 60);
    expect(s.pc.x).toBeGreaterThan(x0);
    expect(collectedCount(s)).toBeGreaterThanOrEqual(1);
    expect(s.pc.facing).toBe(1);
  });

  it('jumping leaves the ground, then gravity returns the hero to it', () => {
    const s = freshMeadowState();
    for (let f = 0; f < 8; f++) stepMeadow(s, hold(0, true), 1 / 60);
    expect(s.pc.onGround).toBe(false);
    expect(s.pc.vy).toBeLessThan(0); // rising
    for (let f = 0; f < 120; f++) stepMeadow(s, hold(0), 1 / 60);
    expect(s.pc.onGround).toBe(true);
  });
});

describe('death and respawn', () => {
  it('falling onto a hazard kills the hero, then re-materializes at spawn', () => {
    const s = freshMeadowState();
    const spawnX = s.pc.x;
    // Drop the hero straight onto the spike patch (row 15, ~col 26).
    s.pc.x = 26 * TILE_PX + (TILE_PX - CONFIG.width) / 2;
    s.pc.y = 13 * TILE_PX;
    let died = false;
    for (let f = 0; f < 30 && !died; f++) {
      stepMeadow(s, hold(0), 1 / 60);
      died = s.pc.dead;
    }
    expect(died).toBe(true);
    expect(s.deaths).toBe(1);
    // After the death beat, it respawns back at the start.
    for (let f = 0; f < Math.ceil(DEATH_DELAY * 60) + 2; f++) stepMeadow(s, hold(0), 1 / 60);
    expect(s.pc.dead).toBe(false);
    expect(Math.abs(s.pc.x - spawnX)).toBeLessThan(2);
  });
});

describe('winning', () => {
  it('overlapping the goal tile sets won', () => {
    const s = freshMeadowState();
    // Teleport onto the goal and step once (cosmetic pad).
    s.pc.x = LEVEL.goal.x * TILE_PX;
    s.pc.y = LEVEL.goal.y * TILE_PX;
    expect(reachedGoal(s.pc)).toBe(true);
    stepMeadow(s, hold(0), 1 / 60);
    expect(s.won).toBe(true);
  });
});
