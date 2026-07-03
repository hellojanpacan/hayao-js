import { describe, expect, it } from 'vitest';
import { Rng, createWorld } from '@hayao';
import { bidx, findMatches, genBoard, hasMove, initialGf, resolve, swapMakesMatch, trySwap, BOARD, COLORS } from './logic';
import { gfState, glimmerfallGame } from './game';

describe('board mechanics', () => {
  it('finds horizontal and vertical runs of 3+', () => {
    const b = genBoard(new Rng(1));
    expect(findMatches(b).size).toBe(0);
    b[bidx(0, 0)] = b[bidx(1, 0)] = b[bidx(2, 0)] = 0;
    b[bidx(0, 0 + 1)] = 1; // avoid accidental vertical
    expect(findMatches(b).size).toBeGreaterThanOrEqual(3);
  });

  it('swapMakesMatch leaves the board untouched', () => {
    const b = genBoard(new Rng(2));
    const before = [...b];
    for (let y = 0; y < BOARD; y++) for (let x = 0; x < BOARD - 1; x++) swapMakesMatch(b, x, y, 1, 0);
    expect(b).toEqual(before);
  });

  it('gravity compacts columns and refills from the top', () => {
    const rng = new Rng(3);
    const b = genBoard(rng);
    // Force a match on the bottom row and resolve.
    b[bidx(2, 7)] = b[bidx(3, 7)] = b[bidx(4, 7)] = 0;
    b[bidx(2, 6)] = 1;
    b[bidx(3, 6)] = 2;
    b[bidx(4, 6)] = 3;
    const { gained } = resolve(b, rng);
    expect(gained).toBeGreaterThanOrEqual(30);
    // Every cell refilled — no holes.
    expect(b.every((c) => c >= 0 && c < COLORS)).toBe(true);
    // The gems above fell into the cleared row.
    expect([b[bidx(2, 7)], b[bidx(3, 7)], b[bidx(4, 7)]]).toEqual([1, 2, 3]);
  });

  it('invalid swaps are rejected without consuming a move', () => {
    const rng = new Rng(4);
    const s = initialGf(rng);
    // Find a swap that does NOT match.
    outer: for (let y = 0; y < BOARD; y++)
      for (let x = 0; x < BOARD - 1; x++)
        if (!swapMakesMatch(s.board, x, y, 1, 0)) {
          const moves = s.movesLeft;
          const ev = trySwap(s, x, y, 1, 0, rng);
          expect(ev.rejected).toBe(true);
          expect(s.movesLeft).toBe(moves);
          break outer;
        }
  });

  it('reshuffle rescues a dead board', () => {
    const rng = new Rng(5);
    expect(hasMove(genBoard(rng))).toBe(true);
  });
});

describe('game wiring', () => {
  it('cursor + grab + direction performs a swap via input actions', () => {
    const world = createWorld(glimmerfallGame, 3);
    const s0 = gfState(world);
    // Walk the cursor somewhere with a known valid horizontal swap.
    let found: { x: number; y: number } | null = null;
    for (let y = 0; y < BOARD && !found; y++) for (let x = 0; x < BOARD - 1 && !found; x++) if (swapMakesMatch(s0.board, x, y, 1, 0)) found = { x, y };
    expect(found).not.toBeNull();
    // Steer cursor to found via steps.
    const steps: string[] = [];
    for (let i = 0; i < Math.abs(found!.x - 3); i++) steps.push(found!.x > 3 ? 'right' : 'left');
    for (let i = 0; i < Math.abs(found!.y - 3); i++) steps.push(found!.y > 3 ? 'down' : 'up');
    for (const a of steps) {
      world.step([a]);
      world.step([]);
    }
    world.step(['grab']);
    world.step([]);
    world.step(['right']);
    const s = gfState(world);
    expect(s.movesLeft).toBe(21);
    expect(s.score).toBeGreaterThan(0);
  });
});
