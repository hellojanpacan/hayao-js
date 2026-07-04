import { describe, expect, it } from 'vitest';
import { createWorld, checkDeterministic, platformerReachable, forgivenessIssues } from '@hayao';
import { updriftGame } from './game';
import { CONFIG, LEVEL, ENVELOPE } from './logic';
import { runClimb } from './drive';

describe('updrift — the golden platformer reference', () => {
  it('the ascent is provably climbable from the level DATA', () => {
    expect(platformerReachable(LEVEL, ENVELOPE).ok).toBe(true);
  });

  it('a bot climbs to the summit with zero deaths', () => {
    const world = createWorld(updriftGame);
    const r = runClimb(world);
    expect(r.won).toBe(true);
    expect(r.deaths).toBe(0);
    expect(r.frames).toBeLessThan(1500);
  });

  it('the controller passes the forgiveness gate', () => {
    expect(forgivenessIssues(CONFIG)).toEqual([]);
  });

  it('the climb is deterministic', () => {
    const world = createWorld(updriftGame);
    const { log } = runClimb(world);
    expect(checkDeterministic(() => createWorld(updriftGame), { frames: log }).ok).toBe(true);
  });
});
