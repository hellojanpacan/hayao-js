// The wire protocol. Plain JSON messages over a bus transport (every peer sees
// every message; `to` filters when a message is for one endpoint). Two layers
// share the bus: the room layer (hello/welcome/join/leave/start — owned by
// RoomHost/RoomClient) and the session layer (input/hash — owned by the
// lockstep/rollback sessions).

import type { WorldSnapshot } from '../world';
import type { PlayerId } from './players';

export const NET_PROTOCOL_VERSION = 1;

/** Session tuning shared by every peer (the host dictates it in `welcome`). */
export interface NetSessionConfig {
  mode: 'lockstep' | 'rollback';
  /** Frames of input delay (lockstep) — hides transport latency. */
  inputDelay: number;
  /** Exchange a state hash every N frames to catch desyncs early. */
  hashInterval: number;
  /** Rollback: how many frames of history can be rewound. */
  maxRollback: number;
  /** How many recent frames each input message re-sends (loss tolerance). */
  redundancy: number;
}

export const DEFAULT_SESSION_CONFIG: NetSessionConfig = {
  mode: 'lockstep',
  inputDelay: 2,
  hashInterval: 20,
  maxRollback: 12,
  redundancy: 3,
};

export type NetMessage =
  // ── room layer ──────────────────────────────────────────────
  /** A new endpoint asks to join. `uid` is its transport-unique id. */
  | { v: number; t: 'hello'; uid: string; name?: string }
  /** Host → one endpoint: your player id + everything needed to start/join. */
  | {
      v: number;
      t: 'welcome';
      to: string;
      player: PlayerId;
      players: PlayerId[];
      seed: number;
      config: NetSessionConfig;
      /** Frame the joiner starts at (0 for a fresh game). */
      startFrame: number;
      /** Mid-game join: the world state at `startFrame`. */
      snapshot?: WorldSnapshot;
      /** Other joins announced but not yet live (their bootstrap frames). */
      joins?: Array<{ player: PlayerId; atFrame: number }>;
    }
  /** Host → all: a player will exist from `atFrame` on (late join). */
  | { v: number; t: 'join'; player: PlayerId; atFrame: number }
  /** Host → all: a player's inputs end at `atFrame` (disconnect/quit). */
  | { v: number; t: 'leave'; player: PlayerId; atFrame: number }
  /** Host → all: begin simulating from frame 0 with this final roster. */
  | { v: number; t: 'start'; players: PlayerId[] }
  /** Any endpoint → host: polite disconnect. */
  | { v: number; t: 'bye'; uid: string }
  /** Host → one endpoint: join refused (room full, mode without late join…). */
  | { v: number; t: 'deny'; to: string; reason: string }
  // ── session layer ───────────────────────────────────────────
  /** Player inputs for frames [from, from+frames.length). Re-sends a small
   *  window so a dropped message doesn't stall anyone. */
  | { v: number; t: 'input'; player: PlayerId; from: number; frames: string[][] }
  /** Structural world hash at a frame — cross-checked by every peer. */
  | { v: number; t: 'hash'; player: PlayerId; frame: number; hash: string };

export function encodeMessage(msg: NetMessage): string {
  return JSON.stringify(msg);
}

/** Decode + shallow-validate. Returns null for junk or version mismatch. */
export function decodeMessage(data: string): NetMessage | null {
  try {
    const msg = JSON.parse(data) as NetMessage;
    if (!msg || typeof msg !== 'object' || msg.v !== NET_PROTOCOL_VERSION || typeof msg.t !== 'string') return null;
    return msg;
  } catch {
    return null;
  }
}

/** Build a message with the protocol version stamped in. */
export function netMessage<T extends Omit<NetMessage, 'v'>>(msg: T): T & { v: number } {
  return { v: NET_PROTOCOL_VERSION, ...msg };
}
