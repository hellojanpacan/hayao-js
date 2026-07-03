// Deterministic lockstep: every peer runs the identical sim and only steps
// frame N once it holds EVERY active player's input for N. Local input is
// scheduled `inputDelay` frames ahead to hide transport latency. Because
// `world.step(mergedFrame)` is already a pure transition, the network layer
// never touches the sim — it only decides when a step may run and what the
// merged frame contains.
//
// Desync safety: every `hashInterval` frames each peer broadcasts its
// `world.hash()`; any mismatch surfaces the frame, both hashes, and the full
// merged input log — which `replay()` can binary-search offline.

import type { World } from '../world';
import type { InputLog } from '../input/actions';
import { InputBuffer } from './inputBuffer';
import { mergePlayerFrames, type PlayerId } from './players';
import { DEFAULT_SESSION_CONFIG, decodeMessage, encodeMessage, netMessage, type NetSessionConfig } from './protocol';
import type { Transport } from './transport';

export interface DesyncInfo {
  frame: number;
  player: PlayerId;
  localHash: string;
  remoteHash: string;
  /** Merged frames from this session's startFrame — replay fodder. */
  log: InputLog;
  startFrame: number;
}

export interface LockstepOptions {
  world: World;
  transport: Transport;
  localPlayer: PlayerId;
  /** Roster at startFrame, in canonical order. */
  players: PlayerId[];
  /** Frame this session begins at (0 for a fresh game, >0 for a late joiner). */
  startFrame?: number;
  config?: Partial<NetSessionConfig>;
  onDesync?: (info: DesyncInfo) => void;
  /** Fired when a step is blocked waiting on a player's input. */
  onStall?: (player: PlayerId, frame: number) => void;
}

interface RosterEntry {
  player: PlayerId;
  from: number;
  until: number; // exclusive; Infinity = still present
}

export class LockstepSession {
  readonly world: World;
  readonly localPlayer: PlayerId;
  readonly config: NetSessionConfig;
  readonly startFrame: number;

  private readonly transport: Transport;
  private readonly buffer = new InputBuffer();
  private roster: RosterEntry[] = [];
  private mergedLog: string[][] = [];
  private localHashes = new Map<number, string>();
  private pendingRemoteHashes: Array<{ player: PlayerId; frame: number; hash: string }> = [];
  private sentThrough: number;
  private stallCount = 0;
  private desynced = false;
  private afterStepListeners: Array<(frame: number) => void> = [];
  private unsubscribe: () => void;
  private readonly onDesync?: (info: DesyncInfo) => void;
  private readonly onStall?: (player: PlayerId, frame: number) => void;

  constructor(opts: LockstepOptions) {
    this.world = opts.world;
    this.transport = opts.transport;
    this.localPlayer = opts.localPlayer;
    this.config = { ...DEFAULT_SESSION_CONFIG, ...opts.config, mode: 'lockstep' };
    this.startFrame = opts.startFrame ?? 0;
    this.onDesync = opts.onDesync;
    this.onStall = opts.onStall;

    for (const p of opts.players) {
      this.roster.push({ player: p, from: this.startFrame, until: Infinity });
      this.buffer.addPlayer(p);
      // Bootstrap: a player's first `inputDelay` frames are empty — identical
      // on every peer without a single message. At a fresh start that is
      // everyone; a late joiner seeds only ITSELF (the veterans have real
      // inputs at its startFrame, which must be used, not zeroed).
      if (this.startFrame === 0 || p === this.localPlayer) {
        for (let f = this.startFrame; f < this.startFrame + this.config.inputDelay; f++) this.buffer.set(p, f, []);
      }
    }
    this.sentThrough = this.startFrame + this.config.inputDelay - 1;

    this.unsubscribe = this.transport.onMessage((data) => this.receive(data));
  }

  // ── the roster (players can come and go at agreed frames) ────
  activePlayers(frame: number): PlayerId[] {
    return this.roster.filter((r) => r.from <= frame && frame < r.until).map((r) => r.player);
  }

  /** All peers must call this with the SAME atFrame (the room layer's job). */
  addPlayer(player: PlayerId, atFrame: number): void {
    if (this.roster.some((r) => r.player === player && r.until === Infinity)) return; // already present
    this.roster.push({ player, from: atFrame, until: Infinity });
    this.buffer.addPlayer(player);
    for (let f = atFrame; f < atFrame + this.config.inputDelay; f++) this.buffer.set(player, f, []);
  }

  /** All peers must call this with the SAME atFrame. */
  removePlayer(player: PlayerId, atFrame: number): void {
    const entry = this.roster.find((r) => r.player === player && r.until === Infinity);
    if (entry) entry.until = atFrame;
    // Frames at/after the cutoff must never merge, even if they arrived.
    this.buffer.clearFrom(player, atFrame);
  }

  // ── driving the sim ──────────────────────────────────────────
  get frame(): number {
    return this.world.frame;
  }

  /** Highest frame every currently-active player's input is known for. */
  get confirmedFrame(): number {
    let min = Infinity;
    for (const p of this.activePlayers(this.world.frame)) min = Math.min(min, this.buffer.contiguousThrough(p));
    return min === Infinity ? -1 : min;
  }

  get stalls(): number {
    return this.stallCount;
  }

  /**
   * Try to advance exactly one frame with the local player's current actions.
   * Returns 1 if the world stepped, 0 if blocked waiting for a remote input.
   */
  tick(localActions: readonly string[] = []): number {
    if (this.desynced) return 0;
    const f = this.world.frame;
    this.scheduleLocal(localActions);

    const active = this.activePlayers(f);
    for (const p of active) {
      if (!this.buffer.has(p, f)) {
        this.stallCount++;
        this.onStall?.(p, f);
        return 0;
      }
    }

    const inputs = new Map<PlayerId, readonly string[]>();
    for (const p of active) inputs.set(p, this.buffer.get(p, f)!);
    const merged = mergePlayerFrames(active, inputs);
    this.world.step(merged);
    this.mergedLog.push(merged);
    this.afterStep(this.world.frame);
    return 1;
  }

  /**
   * Feed real elapsed ms (the browser loop's dt). Runs the fixed steps the
   * clock grants — stalling drops time (the sim slows rather than desyncs) —
   * then catches up if we're measurably behind the other peers.
   */
  advance(realMs: number, localActions: readonly string[] = []): number {
    let stepped = 0;
    const steps = this.world.clock.advance(realMs);
    for (let i = 0; i < steps; i++) {
      if (this.tick(localActions) === 0) break;
      stepped++;
    }
    // Catch-up: if remote inputs prove peers are ahead, step extra frames now.
    let guard = 0;
    while (guard++ < 8 && this.world.frame < this.remoteFrameEstimate() && this.tick(localActions) === 1) stepped++;
    return stepped;
  }

  /** The merged input log from startFrame — replayable when startFrame is 0. */
  inputLog(): InputLog {
    return { frames: this.mergedLog.map((f) => f.slice()) };
  }

  dispose(): void {
    this.unsubscribe();
  }

  /** Feed a raw transport message that arrived before this session existed. */
  deliver(data: string): void {
    this.receive(data);
  }

  /** Subscribe to "the world just reached frame N" (room layer uses this). */
  onAfterStep(cb: (frame: number) => void): () => void {
    this.afterStepListeners.push(cb);
    return () => {
      this.afterStepListeners = this.afterStepListeners.filter((l) => l !== cb);
    };
  }

  // ── internals ────────────────────────────────────────────────
  private scheduleLocal(localActions: readonly string[]): void {
    const target = this.world.frame + this.config.inputDelay;
    if (this.sentThrough >= target) return;
    while (this.sentThrough < target) {
      this.sentThrough++;
      this.buffer.set(this.localPlayer, this.sentThrough, localActions);
    }
    // Send a small window ending at the newest frame so one lost message
    // cannot stall the room.
    const from = Math.max(this.startFrame, target - this.config.redundancy + 1);
    const frames: string[][] = [];
    for (let f = from; f <= target; f++) frames.push(this.buffer.get(this.localPlayer, f) ?? []);
    this.transport.send(encodeMessage(netMessage({ t: 'input', player: this.localPlayer, from, frames })));
  }

  private afterStep(frame: number): void {
    if (frame % this.config.hashInterval === 0) {
      const hash = this.world.hash();
      this.localHashes.set(frame, hash);
      this.transport.send(encodeMessage(netMessage({ t: 'hash', player: this.localPlayer, frame, hash })));
      this.checkPendingHashes();
    }
    // Memory hygiene: keep a generous tail, drop ancient history.
    if (frame % 64 === 0) {
      this.buffer.prune(frame - 128);
      for (const f of this.localHashes.keys()) if (f < frame - 512) this.localHashes.delete(f);
    }
    for (const cb of this.afterStepListeners) cb(frame);
  }

  private receive(data: string): void {
    const msg = decodeMessage(data);
    if (!msg) return;
    if (msg.t === 'input' && msg.player !== this.localPlayer) {
      for (let i = 0; i < msg.frames.length; i++) this.buffer.set(msg.player, msg.from + i, msg.frames[i]);
    } else if (msg.t === 'hash' && msg.player !== this.localPlayer) {
      this.pendingRemoteHashes.push({ player: msg.player, frame: msg.frame, hash: msg.hash });
      this.checkPendingHashes();
    }
  }

  private checkPendingHashes(): void {
    const still: typeof this.pendingRemoteHashes = [];
    for (const remote of this.pendingRemoteHashes) {
      const local = this.localHashes.get(remote.frame);
      if (local === undefined) {
        // We haven't reached (or have already pruned) that frame — keep it
        // unless it is ancient.
        if (remote.frame > this.world.frame - 512) still.push(remote);
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
          startFrame: this.startFrame,
        });
      }
    }
    this.pendingRemoteHashes = still;
  }

  private remoteFrameEstimate(): number {
    let max = -1;
    for (const entry of this.roster) {
      if (entry.player === this.localPlayer || entry.until !== Infinity) continue;
      // A peer schedules input `inputDelay` ahead of its sim frame.
      max = Math.max(max, this.buffer.contiguousThrough(entry.player) - this.config.inputDelay);
    }
    return max;
  }
}
