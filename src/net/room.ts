// The room layer: who is in the game, what seed it runs, when it starts.
// Star topology over a bus transport — one endpoint is the RoomHost (assigns
// player ids, dictates seed + session config, orchestrates late joins and
// leaves); everyone else is a RoomClient. Both end up owning the same thing:
// a World plus a running net session.
//
// Late join (lockstep only): the host schedules the newcomer at a future
// frame, snapshots the world exactly when it reaches that frame, and ships
// the snapshot; every peer adds the player at the same agreed frame, so all
// rosters stay identical. Rollback rooms reject late joins — a joiner would
// need a *confirmed* snapshot, which is future work.

import type { World, WorldSnapshot } from '../world';
import type { PlayerId } from './players';
import {
  DEFAULT_SESSION_CONFIG,
  decodeMessage,
  encodeMessage,
  netMessage,
  type NetMessage,
  type NetSessionConfig,
} from './protocol';
import type { Transport } from './transport';
import { LockstepSession, type DesyncInfo } from './lockstep';
import { RollbackSession } from './rollback';

/** A live networked game, the same shape on host and client. */
export interface NetGame {
  world: World;
  session: LockstepSession | RollbackSession;
  localPlayer: PlayerId;
  /** Roster at the time the game handle was created. */
  players: PlayerId[];
  /** Drive this from the render loop instead of world.advance(). */
  advance(realMs: number, localActions?: readonly string[]): number;
  dispose(): void;
}

export interface RoomCallbacks {
  onDesync?: (info: DesyncInfo) => void;
  onPlayerJoin?: (player: PlayerId, atFrame: number) => void;
  onPlayerLeave?: (player: PlayerId, atFrame: number) => void;
}

function makeUid(): string {
  return globalThis.crypto.randomUUID();
}

function buildSession(
  mode: NetSessionConfig['mode'],
  world: World,
  transport: Transport,
  localPlayer: PlayerId,
  players: PlayerId[],
  startFrame: number,
  config: NetSessionConfig,
  attach: ((world: World) => void) | undefined,
  callbacks: RoomCallbacks,
): LockstepSession | RollbackSession {
  if (mode === 'rollback') {
    return new RollbackSession({ world, transport, localPlayer, players, config, attach, onDesync: callbacks.onDesync });
  }
  return new LockstepSession({ world, transport, localPlayer, players, startFrame, config, onDesync: callbacks.onDesync });
}

function makeGame(
  world: World,
  session: LockstepSession | RollbackSession,
  localPlayer: PlayerId,
  players: PlayerId[],
  extraDispose?: () => void,
): NetGame {
  return {
    world,
    session,
    localPlayer,
    players,
    advance: (realMs, localActions = []) => session.advance(realMs, localActions),
    dispose: () => {
      session.dispose();
      extraDispose?.();
    },
  };
}

// ── host ─────────────────────────────────────────────────────────

export interface RoomHostOptions extends RoomCallbacks {
  transport: Transport;
  /** Build the deterministic world every peer will run. */
  makeWorld: (seed: number) => World;
  seed?: number;
  config?: Partial<NetSessionConfig>;
  maxPlayers?: number;
  /** Frames between "a joiner exists" and their first live frame. */
  joinMargin?: number;
  /** Re-attach behaviors after restore (rollback / late-join snapshot). */
  attach?: (world: World) => void;
}

export class RoomHost {
  readonly localPlayer: PlayerId = 'p1';
  readonly seed: number;
  readonly config: NetSessionConfig;

  private readonly transport: Transport;
  private readonly makeWorld: (seed: number) => World;
  private readonly maxPlayers: number;
  private readonly joinMargin: number;
  private readonly attach?: (world: World) => void;
  private readonly callbacks: RoomCallbacks;

  private players: PlayerId[] = ['p1'];
  private uidToPlayer = new Map<string, PlayerId>();
  private nextPlayerIndex = 2;
  private started = false;
  private game: NetGame | null = null;
  private pendingSnapshots: Array<{ uid: string; player: PlayerId; atFrame: number }> = [];
  private unsubscribe: () => void;

  constructor(opts: RoomHostOptions) {
    this.transport = opts.transport;
    this.makeWorld = opts.makeWorld;
    this.seed = opts.seed ?? 1;
    this.config = { ...DEFAULT_SESSION_CONFIG, ...opts.config };
    this.maxPlayers = opts.maxPlayers ?? 4;
    this.joinMargin = opts.joinMargin ?? 30;
    this.attach = opts.attach;
    this.callbacks = opts;
    this.unsubscribe = this.transport.onMessage((data) => this.receive(data));
  }

  /** Players currently in the room (host first). */
  get roster(): PlayerId[] {
    return [...this.players];
  }

  get isStarted(): boolean {
    return this.started;
  }

  /** Freeze the roster's frame 0 and begin simulating. */
  start(): NetGame {
    if (this.game) return this.game;
    this.started = true;
    const world = this.makeWorld(this.seed);
    const session = buildSession(
      this.config.mode,
      world,
      this.transport,
      this.localPlayer,
      this.players,
      0,
      this.config,
      this.attach,
      this.callbacks,
    );
    if (session instanceof LockstepSession) {
      session.onAfterStep((frame) => this.serviceSnapshots(frame, world));
    }
    this.transport.send(encodeMessage(netMessage({ t: 'start', players: [...this.players] })));
    this.game = makeGame(world, session, this.localPlayer, this.players, () => this.unsubscribe());
    return this.game;
  }

  /** Announce a player's departure (disconnect handling is the app's call). */
  dropPlayer(player: PlayerId): void {
    const session = this.game?.session;
    if (!session) return;
    // Cut at the first frame nobody can have merged yet: one past the last
    // contiguous input everyone received from the departed player. Peers on a
    // reliable bus share the same received set, so the cutoff is consistent.
    // Rollback peers may already have PREDICTED past the cutoff — that's an
    // ordinary misprediction; removePlayer rolls back and re-simulates.
    const atFrame =
      session instanceof LockstepSession
        ? Math.max(session.frame, session.confirmedFrame + 1)
        : session.lastKnownFrame(player) + 1;
    this.transport.send(encodeMessage(netMessage({ t: 'leave', player, atFrame })));
    session.removePlayer(player, atFrame);
    this.players = this.players.filter((p) => p !== player);
    this.callbacks.onPlayerLeave?.(player, atFrame);
  }

  dispose(): void {
    this.unsubscribe();
    this.game?.dispose();
  }

  // ── internals ────────────────────────────────────────────────
  private receive(data: string): void {
    const msg = decodeMessage(data);
    if (!msg) return;
    if (msg.t === 'hello') this.handleHello(msg);
    else if (msg.t === 'bye') {
      const player = this.uidToPlayer.get(msg.uid);
      if (player && this.started) this.dropPlayer(player);
      else if (player) {
        this.players = this.players.filter((p) => p !== player);
        this.uidToPlayer.delete(msg.uid);
      }
    }
  }

  private handleHello(msg: Extract<NetMessage, { t: 'hello' }>): void {
    if (this.uidToPlayer.has(msg.uid)) return; // duplicate hello — already welcomed
    if (this.players.length >= this.maxPlayers) {
      this.transport.send(encodeMessage(netMessage({ t: 'deny', to: msg.uid, reason: 'room full' })));
      return;
    }
    if (this.started && this.config.mode === 'rollback') {
      this.transport.send(encodeMessage(netMessage({ t: 'deny', to: msg.uid, reason: 'rollback rooms cannot be joined mid-game' })));
      return;
    }

    const player: PlayerId = `p${this.nextPlayerIndex++}`;
    this.uidToPlayer.set(msg.uid, player);
    this.players.push(player);

    if (!this.started) {
      this.transport.send(
        encodeMessage(
          netMessage({
            t: 'welcome',
            to: msg.uid,
            player,
            players: [...this.players],
            seed: this.seed,
            config: this.config,
            startFrame: 0,
          }),
        ),
      );
      this.callbacks.onPlayerJoin?.(player, 0);
      return;
    }

    // Late join: everyone (including us) adds the player at a future frame;
    // the snapshot ships when the host's world actually reaches it.
    const session = this.game!.session as LockstepSession;
    const atFrame = session.frame + this.joinMargin;
    this.transport.send(encodeMessage(netMessage({ t: 'join', player, atFrame })));
    session.addPlayer(player, atFrame);
    this.pendingSnapshots.push({ uid: msg.uid, player, atFrame });
    this.callbacks.onPlayerJoin?.(player, atFrame);
  }

  private serviceSnapshots(frame: number, world: World): void {
    if (this.pendingSnapshots.length === 0) return;
    const due = this.pendingSnapshots.filter((p) => p.atFrame === frame);
    if (due.length === 0) return;
    this.pendingSnapshots = this.pendingSnapshots.filter((p) => p.atFrame !== frame);
    const snapshot: WorldSnapshot = world.snapshot();
    for (const join of due) {
      // Joiners scheduled but not yet live go in `joins`, not the roster —
      // the newcomer must add them at THEIR frame, not its own startFrame.
      const stillPending = this.pendingSnapshots.filter((p) => p.player !== join.player);
      const pendingIds = new Set(stillPending.map((p) => p.player));
      this.transport.send(
        encodeMessage(
          netMessage({
            t: 'welcome',
            to: join.uid,
            player: join.player,
            players: this.players.filter((p) => !pendingIds.has(p)),
            seed: this.seed,
            config: this.config,
            startFrame: frame,
            snapshot,
            joins: stillPending.map((p) => ({ player: p.player, atFrame: p.atFrame })),
          }),
        ),
      );
    }
  }
}

// ── client ───────────────────────────────────────────────────────

export interface RoomClientOptions extends RoomCallbacks {
  transport: Transport;
  makeWorld: (seed: number) => World;
  attach?: (world: World) => void;
  name?: string;
}

/**
 * Join a room: send hello, wait for welcome (+start or snapshot), come back
 * with a NetGame. Session-layer messages that arrive while the snapshot is in
 * flight are buffered and replayed so no input is ever missed.
 */
export function joinRoom(opts: RoomClientOptions): Promise<NetGame> {
  const uid = makeUid();
  const transport = opts.transport;

  return new Promise((resolve, reject) => {
    let welcome: Extract<NetMessage, { t: 'welcome' }> | null = null;
    let started = false;
    /** Final frame-0 roster from `start` (a lobby can grow after our welcome). */
    let startRoster: PlayerId[] | null = null;
    const buffered: string[] = [];
    const pendingRoster: Array<Extract<NetMessage, { t: 'join' } | { t: 'leave' }>> = [];

    const finish = () => {
      if (!welcome || !started) return;
      unsub();
      const roster = startRoster ?? welcome.players;
      const world = opts.makeWorld(welcome.seed);
      if (welcome.snapshot) {
        world.restore(welcome.snapshot);
        opts.attach?.(world);
      }
      const session = buildSession(
        welcome.config.mode,
        world,
        transport,
        welcome.player,
        roster,
        welcome.startFrame,
        welcome.config,
        opts.attach,
        opts,
      );
      // Joins the host announced before our welcome (still-pending joiners):
      if (welcome.joins && session instanceof LockstepSession) {
        for (const j of welcome.joins) session.addPlayer(j.player, j.atFrame);
      }
      // Roster changes and inputs that raced past us while restoring:
      for (const m of pendingRoster) {
        if (m.t === 'join' && session instanceof LockstepSession) session.addPlayer(m.player, m.atFrame);
        if (m.t === 'leave') session.removePlayer(m.player, m.atFrame);
      }
      const roomUnsub = transport.onMessage((data) => {
        const msg = decodeMessage(data);
        if (!msg) return;
        if (msg.t === 'join' && session instanceof LockstepSession) {
          session.addPlayer(msg.player, msg.atFrame);
          opts.onPlayerJoin?.(msg.player, msg.atFrame);
        } else if (msg.t === 'leave') {
          session.removePlayer(msg.player, msg.atFrame);
          opts.onPlayerLeave?.(msg.player, msg.atFrame);
        }
      });
      const game = makeGame(world, session, welcome.player, roster, () => {
        roomUnsub();
        transport.send(encodeMessage(netMessage({ t: 'bye', uid })));
      });
      // Replay whatever the session missed while the snapshot was in flight.
      for (const data of buffered) session.deliver(data);
      resolve(game);
    };

    const unsub = transport.onMessage((data) => {
      const msg = decodeMessage(data);
      if (!msg) return;
      switch (msg.t) {
        case 'welcome':
          if (msg.to === uid) {
            welcome = msg;
            // A snapshot welcome means the game is already running.
            if (msg.snapshot || msg.startFrame > 0) started = true;
            finish();
          }
          break;
        case 'deny':
          if (msg.to === uid) {
            unsub();
            reject(new Error(`hayao-net: join denied — ${msg.reason}`));
          }
          break;
        case 'start':
          started = true;
          startRoster = msg.players;
          finish();
          break;
        case 'join':
        case 'leave':
          pendingRoster.push(msg);
          break;
        case 'input':
        case 'hash':
          buffered.push(data);
          break;
      }
    });

    transport.send(encodeMessage(netMessage({ t: 'hello', uid, name: opts.name })));
  });
}

/** Create a room host over a transport. Call `start()` when the lobby is set. */
export function hostRoom(opts: RoomHostOptions): RoomHost {
  return new RoomHost(opts);
}
