// Data-driven content: a small schema + interpreter for declarative game content,
// so waves, spawn tables, and upgrade trees are DATA (hashable, editable, diff-able)
// rather than hand-rolled control flow. Two primitives, one determinism rule —
// rolls draw from `world.rng`, scheduling reads `world.time` (fixed sim seconds):
//   • SpawnDirector   — a flat wave/spawn schedule (norman) with repeats and an
//                       optional weighted spawn set (cat-survivors' director).
//   • upgrade trees    — availability gating by owned prerequisites (evolutions).
// Weighted rolls reuse `logic/random` (WeightedEntry + pickEntry), not a private
// copy. The director's cursor state is plain JSON, so it lives in `world.state`
// and is snapshotted/hashed like everything else.

import type { Rng } from '../core/rng';
import { pickEntry, type WeightedEntry } from '../logic/random';

// ── Wave / spawn director ───────────────────────────────────────
/**
 * One declarative wave. Fires `count` of `spawn` at time `time` (sim seconds).
 * When `every` is set it repeats on that interval until `end` (exclusive),
 * modelling a continuous spawn stream. `spawn` may be a single id or a weighted
 * table, in which case each firing rolls the table via `world.rng`.
 */
export interface WaveDef {
  /** First fire time, in fixed sim seconds (compare against `world.time`). */
  time: number;
  /** What to spawn: a fixed id, or a weighted set rolled per firing. */
  spawn: string | WeightedEntry<string>[];
  /** How many per firing (default 1). */
  count?: number;
  /** Repeat interval in seconds; omit for a one-shot wave. */
  every?: number;
  /** Repeats stop once the next fire time reaches this (seconds). */
  end?: number;
}

/** Mutable director cursor — plain JSON, keep it in `world.state`. */
export interface DirectorState {
  /** Next fire time per wave index; Infinity once a wave is exhausted. */
  next: number[];
}

/** One resolved spawn instruction emitted by the director. */
export interface SpawnEvent {
  /** Concrete spawn id (already rolled if the wave used a weighted set). */
  spawn: string;
  count: number;
  /** Source wave index, for callers that want to key behavior off the wave. */
  wave: number;
}

/** Initialize a director cursor for a schedule. */
export function initDirector(waves: readonly WaveDef[]): DirectorState {
  return { next: waves.map((w) => w.time) };
}

/**
 * Advance the director to `time` (sim seconds) and return every spawn that is
 * now due, in wave order. Mutates `state.next` in place. Deterministic: it emits
 * the same events for the same (schedule, time, rng-state) on every machine.
 * A repeating wave can fire multiple times in one poll if the frame straddled
 * several intervals (e.g. after a restore), so catch-up never drops spawns.
 */
export function pollDirector(waves: readonly WaveDef[], state: DirectorState, time: number, rng?: Rng): SpawnEvent[] {
  const out: SpawnEvent[] = [];
  for (let i = 0; i < waves.length; i++) {
    const w = waves[i];
    let next = state.next[i] ?? w.time;
    while (next <= time) {
      let spawn: string;
      if (typeof w.spawn === 'string') {
        spawn = w.spawn;
      } else {
        if (!rng) throw new Error('hayao: pollDirector needs an Rng to roll a weighted wave');
        spawn = pickEntry(rng, w.spawn);
      }
      out.push({ spawn, count: w.count ?? 1, wave: i });
      if (w.every && w.every > 0) {
        next += w.every;
        if (w.end !== undefined && next >= w.end) {
          next = Infinity;
          break;
        }
      } else {
        next = Infinity;
        break;
      }
    }
    state.next[i] = next;
  }
  return out;
}

// ── Upgrade / evolution trees ───────────────────────────────────
/**
 * A declarative upgrade or evolution node. `requires` lists ids that must all be
 * owned before this one can be offered — the cat-survivors evolution gate and a
 * deckbuilder's upgrade prerequisites are the same shape.
 */
export interface UpgradeDef {
  id: string;
  /** Ids that must all be owned before this becomes available. */
  requires?: string[];
  /** Optional: only offer while UNDER this many owned copies (repeatable upgrades). */
  maxStacks?: number;
}

/**
 * Which upgrades are offerable given what's owned: prerequisites all met, and
 * not already at `maxStacks` (default 1 — offered until owned once). `owned` may
 * repeat ids to represent stacks. Ordered by definition order for hash stability.
 */
export function availableUpgrades(defs: readonly UpgradeDef[], owned: readonly string[]): UpgradeDef[] {
  const counts = new Map<string, number>();
  for (const id of owned) counts.set(id, (counts.get(id) ?? 0) + 1);
  const has = (id: string) => (counts.get(id) ?? 0) > 0;
  return defs.filter((d) => {
    const stacks = counts.get(d.id) ?? 0;
    if (stacks >= (d.maxStacks ?? 1)) return false;
    return (d.requires ?? []).every(has);
  });
}
