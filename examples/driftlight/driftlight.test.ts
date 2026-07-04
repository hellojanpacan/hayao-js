import { describe, it, expect } from 'vitest';
import { createWorld, assertDeterministic, assertSnapshotStable, type World } from '@hayao';
import { driftlightGame } from './game';
import { RIVER, SEA_X, START } from './logic';
import { driftBot, type DlProbe } from './bot';

const MAX_FRAMES = 3000; // ~50 sim-seconds is ample for one drift

/** Drive the guidance bot until it wins, loses, or times out. */
function drift(world: World): string[][] {
  const log: string[][] = [];
  for (let f = 0; f < MAX_FRAMES; f++) {
    const p = world.probe() as unknown as DlProbe;
    if (p.won || p.lost) break;
    const a = driftBot(p);
    log.push(a);
    world.step(a);
  }
  return log;
}

describe('Driftlight — the drift is winnable', () => {
  it('a line-tracking pilot reaches the sea with the flame alive', () => {
    const world = createWorld(driftlightGame);
    drift(world);
    const p = world.probe() as unknown as DlProbe & { flame: number };
    expect(p.won).toBe(true);
    expect(p.lost).toBe(false);
    expect(p.flame).toBeGreaterThan(0);
  });

  it('the sea is far offscreen from the start (the river scrolls)', () => {
    expect(SEA_X - START.x).toBeGreaterThan(driftlightGame.width * 3);
    expect(RIVER.length).toBeGreaterThan(driftlightGame.width * 4);
  });
});

describe('Driftlight — lush view stays deterministic', () => {
  it('gradient/glow/parallax are cosmetic — no leak into world.hash()', () => {
    const world = createWorld(driftlightGame);
    const log = drift(world).slice(0, 240);
    const report = assertDeterministic(() => createWorld(driftlightGame), { frames: log });
    expect(report.ok).toBe(true);
    expect(report.divergedAt).toBe(-1);
  });

  it('snapshot → restore reproduces the exact continuation', () => {
    const world = createWorld(driftlightGame);
    const log = drift(world).slice(0, 160);
    const res = assertSnapshotStable(() => createWorld(driftlightGame), { frames: log }, 50);
    expect(res.ok).toBe(true);
    expect(res.hashA).toBe(res.hashB);
  });
});

describe('Driftlight — headless vector screenshot', () => {
  it('opening frame carries the atmospheric layers + HUD', () => {
    const world = createWorld(driftlightGame);
    world.step([]);
    const commands = world.render();
    // sky, water, rocks, fireflies, lantern, HUD → a busy display list
    expect(commands.length).toBeGreaterThan(60);
    expect(commands.some((c) => c.kind === 'text')).toBe(true); // coach line
    // the renderer leap is actually exercised (gradients + glow present)
    expect(commands.some((c) => c.gradient)).toBe(true);
    expect(commands.some((c) => c.shadow)).toBe(true);
  });
});
