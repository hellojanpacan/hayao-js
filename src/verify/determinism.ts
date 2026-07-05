// Determinism verification. Re-run the same seed + input log twice; if any step's
// state hash diverges, some hidden nondeterminism (Math.random, Date.now, Set
// iteration, unordered map) leaked in. This is the regression net that lets you
// refactor the sim fearlessly.

import type { World } from '../world';
import type { InputLog } from '../input/actions';
import { frameActions, frameAxes } from '../input/actions';

export type WorldFactory = () => World;

/** Run a world through an input log, returning the final hash and per-frame hashes. */
export function replay(makeWorld: WorldFactory, log: InputLog): { finalHash: string; hashes: string[] } {
  const world = makeWorld();
  const hashes: string[] = [];
  for (let i = 0; i < log.frames.length; i++) {
    world.step(frameActions(log, i), frameAxes(log, i));
    hashes.push(world.hash());
  }
  return { finalHash: world.hash(), hashes };
}

export interface DeterminismReport {
  ok: boolean;
  frames: number;
  /** First frame index where the two runs diverged, or -1. */
  divergedAt: number;
  finalHash: string;
}

/** Run twice and compare every step's hash. */
export function checkDeterministic(makeWorld: WorldFactory, log: InputLog): DeterminismReport {
  const a = replay(makeWorld, log);
  const b = replay(makeWorld, log);
  let divergedAt = -1;
  for (let i = 0; i < a.hashes.length; i++) {
    if (a.hashes[i] !== b.hashes[i]) {
      divergedAt = i;
      break;
    }
  }
  return {
    ok: divergedAt === -1 && a.finalHash === b.finalHash,
    frames: log.frames.length,
    divergedAt,
    finalHash: a.finalHash,
  };
}

/** Assert determinism (throws with the divergence frame). */
export function assertDeterministic(makeWorld: WorldFactory, log: InputLog): DeterminismReport {
  const report = checkDeterministic(makeWorld, log);
  if (!report.ok) {
    throw new Error(
      `hayao: sim is NON-deterministic — runs diverged at frame ${report.divergedAt} ` +
        `of ${report.frames}. Check for Math.random/Date.now/Set-iteration/unordered-map in the sim.`,
    );
  }
  return report;
}

/**
 * Assert that restoring a snapshot reproduces the exact same continuation —
 * i.e. save/load is lossless. Runs `warmup` steps, snapshots, runs `tail` more
 * on both the original and a restored copy, and compares final hashes.
 */
export function assertSnapshotStable(
  makeWorld: WorldFactory,
  log: InputLog,
  warmup: number,
): { ok: boolean; hashA: string; hashB: string } {
  const original = makeWorld();
  for (let i = 0; i < warmup; i++) original.step(frameActions(log, i), frameAxes(log, i));
  const snap = original.snapshot();

  const restored = makeWorld();
  restored.restore(snap);

  for (let i = warmup; i < log.frames.length; i++) {
    original.step(frameActions(log, i), frameAxes(log, i));
    restored.step(frameActions(log, i), frameAxes(log, i));
  }
  const hashA = original.hash();
  const hashB = restored.hash();
  return { ok: hashA === hashB, hashA, hashB };
}
