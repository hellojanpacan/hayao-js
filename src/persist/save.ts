// Player-facing save/load over a pluggable StorageAdapter. Built ON TOP of the
// existing `world.snapshot()`/`world.restore()` seam — it does NOT reinvent
// serialization; it versions, guards, and persists what the world already emits.
// A restored world reproduces the saved `hash()`/`probe()` exactly.

import type { World, WorldSnapshot } from '../world';
import { defaultStorage, type StorageAdapter } from './storage';

/** Envelope stored per slot: a version tag around the raw WorldSnapshot. */
interface SaveEnvelope {
  v: number;
  snap: WorldSnapshot;
}

/** Bump when the snapshot shape changes in a way old saves can't satisfy. */
export const SAVE_FORMAT_VERSION = 1;

/** Serialize a snapshot to a compact JSON string with a version envelope. */
export function serializeSnapshot(snap: WorldSnapshot): string {
  const envelope: SaveEnvelope = { v: SAVE_FORMAT_VERSION, snap };
  return JSON.stringify(envelope);
}

/**
 * Parse a serialized snapshot back. Returns `null` on anything malformed —
 * corrupt JSON, wrong version, missing fields — so a bad save is a clean miss,
 * never a thrown exception mid-game. Guards `JSON.parse` per the invariant.
 */
export function parseSnapshot(text: string | null): WorldSnapshot | null {
  if (!text) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const env = parsed as Partial<SaveEnvelope>;
  if (env.v !== SAVE_FORMAT_VERSION || !env.snap || typeof env.snap !== 'object') return null;
  const snap = env.snap as Partial<WorldSnapshot>;
  // Minimal shape check on the fields `restore()` reads.
  if (typeof snap.seed !== 'number' || !snap.rng || !snap.clock || !snap.input || !snap.state || !snap.tree) {
    return null;
  }
  return snap as WorldSnapshot;
}

/**
 * A tiny save API bound to one World and one storage backend. Slots are named
 * ('auto', 'slot1', …). Everything routes through `world.snapshot()`/`restore()`
 * so the saved and restored states share a hash.
 */
export class SaveManager {
  constructor(
    private readonly world: World,
    private readonly storage: StorageAdapter = defaultStorage(),
  ) {}

  /** Snapshot the world and persist it under `slot`. */
  save(slot = 'auto'): void {
    this.storage.set(slot, serializeSnapshot(this.world.snapshot()));
  }

  /** Restore `slot` into the world. Returns false if absent/corrupt (world untouched). */
  load(slot = 'auto'): boolean {
    const snap = parseSnapshot(this.storage.get(slot));
    if (!snap) return false;
    this.world.restore(snap);
    return true;
  }

  /** Is there a well-formed save in `slot`? */
  has(slot = 'auto'): boolean {
    return parseSnapshot(this.storage.get(slot)) !== null;
  }

  /** Delete a save slot. */
  delete(slot = 'auto'): void {
    this.storage.remove(slot);
  }

  /** All slot names currently persisted. */
  slots(): string[] {
    return this.storage.keys();
  }
}
