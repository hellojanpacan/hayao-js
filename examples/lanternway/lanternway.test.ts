import { describe, it, expect } from 'vitest';
import { createWorld, assertDeterministic, assertSnapshotStable, type World } from '@hayao';
import { lanternwayGame } from './game';
import { WORLD, START, GOAL } from './logic';
import { bearerBot, type LwProbe } from './bot';

const MAX_FRAMES = 2400; // 40 sim-seconds is ample for one crossing

/** Drive the bot to the shrine; returns the input log used. */
function crossing(world: World): string[][] {
  const log: string[][] = [];
  for (let f = 0; f < MAX_FRAMES; f++) {
    const p = world.probe() as unknown as LwProbe;
    if (p.won) break;
    const a = bearerBot(p);
    log.push(a);
    world.step(a);
  }
  return log;
}

describe('Lanternway — the crossing (content is reachable)', () => {
  it('the bearer walks from start to the far shrine and wins', () => {
    const world = createWorld(lanternwayGame);
    crossing(world);
    const p = world.probe() as { won: boolean; remaining: number };
    expect(p.won).toBe(true);
    expect(p.remaining).toBeLessThanOrEqual(80);
  });

  it('the goal really is offscreen from the start (world > viewport)', () => {
    // The whole point of the camera: you cannot see the goal at spawn.
    expect(GOAL.x - START.x).toBeGreaterThan(lanternwayGame.width);
    expect(WORLD.w).toBeGreaterThan(lanternwayGame.width * 2);
  });
});

describe('Lanternway — the camera scrolls but stays deterministic', () => {
  it('the camera pans across most of the world during the crossing', () => {
    const world = createWorld(lanternwayGame);
    const xs: number[] = [];
    for (let f = 0; f < MAX_FRAMES; f++) {
      const p = world.probe() as unknown as LwProbe & { camX: number };
      xs.push(p.camX);
      if (p.won) break;
      world.step(bearerBot(p));
    }
    const span = Math.max(...xs) - Math.min(...xs);
    expect(span).toBeGreaterThan(WORLD.w * 0.5);
  });

  it('the smooth follow never leaks into world.hash() (camera is cosmetic)', () => {
    const world = createWorld(lanternwayGame);
    const log = crossing(world).slice(0, 200);
    const report = assertDeterministic(() => createWorld(lanternwayGame), { frames: log });
    expect(report.ok).toBe(true);
    expect(report.divergedAt).toBe(-1);
  });

  it('snapshot → restore reproduces the exact continuation', () => {
    const world = createWorld(lanternwayGame);
    const log = crossing(world).slice(0, 120);
    const res = assertSnapshotStable(() => createWorld(lanternwayGame), { frames: log }, 40);
    expect(res.ok).toBe(true);
    expect(res.hashA).toBe(res.hashB);
  });
});

describe('Lanternway — headless vector screenshot', () => {
  it('renders the opening frame with the field, bearer, and HUD present', () => {
    const world = createWorld(lanternwayGame);
    world.step([]);
    const commands = world.render();
    expect(commands.length).toBeGreaterThan(20);
    expect(commands.some((c) => c.kind === 'text')).toBe(true); // the coach line
  });
});
