// Predict-rollback netcode (GGPO/Rune-style) on top of the engine's proven
// snapshot/restore. Every frame: send local input immediately, predict remote
// inputs (repeat-last), step. When a real input contradicts a prediction,
// restore the snapshot at the mispredicted frame and re-simulate to the
// present with corrected inputs. `assertSnapshotStable` already proves
// restore is lossless, so a rollback is exactly "rewind + replay".
//
// One engine-specific caveat: `World.restore()` rebuilds the scene tree from
// data, and behaviors (closures) do not survive that. Games played under
// rollback must either keep all sim logic in `world.state` + `onProcess`-free
// nodes, or pass `attach(world)` to re-wire behaviors after every restore —
// the same hook scene code already uses for save/load.

import type { World, WorldSnapshot } from '../world';
import type { InputLog } from '../input/actions';
import { hashValue } from '../core/hash';
import { InputBuffer } from './inputBuffer';
import { mergePlayerFrames, type PlayerId } from './players';
import { DEFAULT_SESSION_CONFIG, decodeMessage, encodeMessage, netMessage, type NetSessionConfig } from './protocol';
import type { Transport } from './transport';
import type { DesyncInfo } from './lockstep';

export interface RollbackOptions {
  world: World;
  transport: Transport;
  localPlayer: PlayerId;
  players: PlayerId[];
  config?: Partial<NetSessionConfig>;
  /** Re-attach behaviors/controllers after every restore (save/load hook). */
  attach?: (world: World) => void;
  onDesync?: (info: DesyncInfo) => void;
  /** A correction arrived deeper than maxRollback — unrecoverable. */
  onRollbackOverflow?: (frame: number) => void;
}

interface RingEntry {
  frame: number;
  snap: WorldSnapshot;
}

export class RollbackSession {
  readonly world: World;
  readonly localPlayer: PlayerId;
  readonly config: NetSessionConfig;

  private readonly transport: Transport;
  private readonly players: PlayerId[];
  private readonly buffer = new InputBuffer();
  private readonly attach?: (world: World) => void;
  private readonly onDesync?: (info: DesyncInfo) => void;
  private readonly onRollbackOverflow?: (frame: number) => void;

  /** Snapshot AT frame f (state before stepping f), keyed f % ring length. */
  private ring: Array<RingEntry | null>;
  /** What we actually fed `step()` per frame — prediction bookkeeping. */
  private usedInputs = new Map<number, Map<PlayerId, string>>();
  private earliestBad = Infinity;
  private rollbackCount = 0;
  private resimulatedFrames = 0;
  private localHashes = new Map<number, string>();
  /** player → cutoff frame: their inputs are [] from there on (departed). */
  private dropped = new Map<PlayerId, number>();
  private pendingRemoteHashes: Array<{ player: PlayerId; frame: number; hash: string }> = [];
  private hashedThrough = -1;
  private desynced = false;
  private overflowed = false;
  private unsubscribe: () => void;

  constructor(opts: RollbackOptions) {
    this.world = opts.world;
    this.transport = opts.transport;
    this.localPlayer = opts.localPlayer;
    this.players = [...opts.players];
    this.config = { ...DEFAULT_SESSION_CONFIG, mode: 'rollback', inputDelay: 0, ...opts.config };
    this.attach = opts.attach;
    this.onDesync = opts.onDesync;
    this.onRollbackOverflow = opts.onRollbackOverflow;
    this.ring = new Array(this.config.maxRollback + 1).fill(null);
    for (const p of this.players) this.buffer.addPlayer(p);
    this.unsubscribe = this.transport.onMessage((data) => this.receive(data));
  }

  get frame(): number {
    return this.world.frame;
  }

  /** Highest frame all players' real inputs are known for (inclusive). */
  get confirmedFrame(): number {
    let min = Infinity;
    for (const p of this.players) {
      const cut = this.dropped.get(p);
      let c = this.buffer.contiguousThrough(p);
      // A departed player's inputs are [] forever from the cutoff — known.
      if (cut !== undefined && c >= cut - 1) c = Infinity;
      min = Math.min(min, c);
    }
    return min === Infinity ? -1 : min;
  }

  /** Highest contiguous frame received from `player` — the drop-cutoff basis. */
  lastKnownFrame(player: PlayerId): number {
    return this.buffer.contiguousThrough(player);
  }

  /**
   * A player left (or vanished): their inputs are [] from `atFrame` on, so the
   * session stops waiting on them. All peers must apply the SAME atFrame (the
   * room layer broadcasts it). Frames already simulated with a non-empty
   * prediction for the departed player roll back and re-simulate as usual.
   */
  removePlayer(player: PlayerId, atFrame: number): void {
    if (player === this.localPlayer || this.dropped.has(player)) return;
    this.dropped.set(player, atFrame);
    // Inputs at/after the cutoff must never merge, even if they arrived.
    this.buffer.clearFrom(player, atFrame);
    for (let f = atFrame; f < this.world.frame; f++) {
      const used = this.usedInputs.get(f)?.get(player);
      if (used !== undefined && used !== '[]') this.earliestBad = Math.min(this.earliestBad, f);
    }
    this.settleHashes();
  }

  get stats(): { rollbacks: number; resimulatedFrames: number } {
    return { rollbacks: this.rollbackCount, resimulatedFrames: this.resimulatedFrames };
  }

  /**
   * Advance one frame: publish local input, apply any pending correction,
   * then step with confirmed-or-predicted inputs. Returns 1 unless the sim
   * has outrun its rollback window (backpressure) or is desynced.
   */
  tick(localActions: readonly string[] = []): number {
    if (this.desynced || this.overflowed) return 0;
    const f = this.world.frame;

    // Backpressure: never outrun the ring — a correction must always land.
    if (f - (this.confirmedFrame + 1) >= this.config.maxRollback) return 0;

    this.publishLocal(f, localActions);
    if (!this.resolveCorrections()) return 0;

    this.storeSnapshot(f);
    this.stepFrame(f);
    this.settleHashes();
    if (f % 64 === 0) this.pruneOld(f);
    return 1;
  }

  /** Feed real elapsed ms; runs the fixed steps the clock grants. */
  advance(realMs: number, localActions: readonly string[] = []): number {
    let stepped = 0;
    const steps = this.world.clock.advance(realMs);
    for (let i = 0; i < steps; i++) {
      if (this.tick(localActions) === 0) break;
      stepped++;
    }
    return stepped;
  }

  /** Merged CONFIRMED input log from frame 0 — replayable ground truth. */
  inputLog(): InputLog {
    const frames: string[][] = [];
    const through = this.confirmedFrame;
    for (let f = 0; f <= through; f++) {
      const inputs = new Map<PlayerId, readonly string[]>();
      for (const p of this.players) inputs.set(p, this.buffer.get(p, f) ?? []);
      frames.push(mergePlayerFrames(this.players, inputs));
    }
    return { frames };
  }

  dispose(): void {
    this.unsubscribe();
  }

  /** Feed a raw transport message that arrived before this session existed. */
  deliver(data: string): void {
    this.receive(data);
  }

  // ── internals ────────────────────────────────────────────────
  private publishLocal(frame: number, actions: readonly string[]): void {
    if (!this.buffer.set(this.localPlayer, frame, actions)) return;
    const from = Math.max(0, frame - this.config.redundancy + 1);
    const frames: string[][] = [];
    for (let f = from; f <= frame; f++) frames.push(this.buffer.get(this.localPlayer, f) ?? []);
    this.transport.send(encodeMessage(netMessage({ t: 'input', player: this.localPlayer, from, frames })));
  }

  private inputsFor(frame: number): Map<PlayerId, readonly string[]> {
    const inputs = new Map<PlayerId, readonly string[]>();
    for (const p of this.players) {
      const cut = this.dropped.get(p);
      if (cut !== undefined && frame >= cut) inputs.set(p, []);
      else inputs.set(p, this.buffer.get(p, frame) ?? this.buffer.latestAt(p, frame));
    }
    return inputs;
  }

  private stepFrame(frame: number): void {
    const inputs = this.inputsFor(frame);
    const used = new Map<PlayerId, string>();
    for (const p of this.players) used.set(p, JSON.stringify(inputs.get(p)));
    this.usedInputs.set(frame, used);
    this.world.step(mergePlayerFrames(this.players, inputs));
  }

  /** Apply pending corrections. False = overflow (fatal). */
  private resolveCorrections(): boolean {
    if (this.earliestBad === Infinity) return true;
    const target = this.world.frame;
    const bad = this.earliestBad;
    this.earliestBad = Infinity;

    const entry = this.ring[bad % this.ring.length];
    if (!entry || entry.frame !== bad) {
      this.overflowed = true;
      this.onRollbackOverflow?.(bad);
      return false;
    }

    this.rollbackCount++;
    this.world.restore(entry.snap);
    this.attach?.(this.world);
    for (let f = bad; f < target; f++) {
      this.storeSnapshot(f);
      this.stepFrame(f);
      this.resimulatedFrames++;
    }
    return true;
  }

  private storeSnapshot(frame: number): void {
    this.ring[frame % this.ring.length] = { frame, snap: this.world.snapshot() };
  }

  private receive(data: string): void {
    const msg = decodeMessage(data);
    if (!msg) return;
    if (msg.t === 'input' && msg.player !== this.localPlayer) {
      const cut = this.dropped.get(msg.player);
      for (let i = 0; i < msg.frames.length; i++) {
        const frame = msg.from + i;
        if (cut !== undefined && frame >= cut) continue; // post-cutoff never merges
        if (!this.buffer.set(msg.player, frame, msg.frames[i])) continue;
        // Did we already simulate this frame with a different guess?
        if (frame < this.world.frame) {
          const used = this.usedInputs.get(frame)?.get(msg.player);
          const actual = JSON.stringify([...msg.frames[i]].sort());
          if (used !== undefined && used !== actual) this.earliestBad = Math.min(this.earliestBad, frame);
        }
      }
      this.settleHashes();
    } else if (msg.t === 'hash' && msg.player !== this.localPlayer) {
      this.pendingRemoteHashes.push({ player: msg.player, frame: msg.frame, hash: msg.hash });
      this.compareHashes();
    }
  }

  /**
   * Hash exchange runs on CONFIRMED frames only (predicted state is
   * provisional by design). A snapshot has exactly the shape `world.hash()`
   * hashes, so ring entries give us hashes of past frames for free.
   */
  private settleHashes(): void {
    // Frames ≤ confirmed+? — state AT frame h is confirmed once every input
    // for frames < h is known and no correction below h is pending.
    const settled = Math.min(this.confirmedFrame + 1, this.world.frame, this.earliestBad === Infinity ? Infinity : this.earliestBad);
    const interval = this.config.hashInterval;
    let h = (Math.floor(this.hashedThrough / interval) + 1) * interval;
    for (; h <= settled; h += interval) {
      const entry = this.ring[h % this.ring.length];
      if (!entry || entry.frame !== h) continue; // already recycled — skip
      const hash = hashValue(entry.snap);
      this.localHashes.set(h, hash);
      this.hashedThrough = h;
      this.transport.send(encodeMessage(netMessage({ t: 'hash', player: this.localPlayer, frame: h, hash })));
    }
    this.compareHashes();
  }

  private compareHashes(): void {
    const still: typeof this.pendingRemoteHashes = [];
    for (const remote of this.pendingRemoteHashes) {
      const local = this.localHashes.get(remote.frame);
      if (local === undefined) {
        if (remote.frame > this.hashedThrough - 512) still.push(remote);
        continue;
      }
      if (local !== remote.hash && !this.desynced) {
        this.desynced = true;
        this.onDesync?.({
          frame: remote.frame,
          player: remote.player,
          localHash: local,
          remoteHash: remote.hash,
          log: this.inputLog(),
          startFrame: 0,
        });
      }
    }
    this.pendingRemoteHashes = still;
  }

  private pruneOld(frame: number): void {
    this.buffer.prune(frame - 128);
    for (const f of this.usedInputs.keys()) if (f < frame - 128) this.usedInputs.delete(f);
    for (const f of this.localHashes.keys()) if (f < frame - 512) this.localHashes.delete(f);
  }
}
