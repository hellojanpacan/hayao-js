// Browser driver for networked games — the net twin of runBrowser(). Same
// mount/renderer/input wiring, but the world is created only after the room
// handshake settles the seed and roster, and the RAF loop drives
// `session.advance()` (which gates steps on network input) instead of
// `world.advance()`.

import type { GameDefinition } from '../app/game';
import { createWorld } from '../app/game';
import { KeyboardSource } from '../input/source';
import { SvgRenderer } from '../render/svg';
import { Canvas2DRenderer } from '../render/canvas';
import type { Renderer } from '../render/renderer';
import { setOverlayHost } from '../ui/overlay';
import type { World } from '../world';
import type { Transport } from './transport';
import type { NetSessionConfig } from './protocol';
import type { NetGame, RoomCallbacks } from './room';
import { hostRoom, joinRoom, type RoomHost } from './room';
import type { PlayerId } from './players';

export interface NetRunOptions extends RoomCallbacks {
  transport: Transport;
  /** 'host' owns the lobby (first tab); 'join' connects to it. */
  role: 'host' | 'join';
  seed?: number;
  config?: Partial<NetSessionConfig>;
  maxPlayers?: number;
  /** Re-attach behaviors after any restore (rollback / late join). */
  attach?: (world: World) => void;
  renderer?: 'svg' | 'canvas';
  /** Lobby feedback ("waiting for players…", "connected as p2"). */
  onStatus?: (status: string) => void;
}

export interface NetGameHandle {
  /** Host only: freeze the lobby and start the game. No-op for joiners. */
  start(): void;
  /** The live game once running (null while in the lobby). */
  readonly game: NetGame | null;
  readonly localPlayer: PlayerId | null;
  readonly roster: PlayerId[];
  input: KeyboardSource;
  stop(): void;
}

/**
 * Run a game as a networked session. Host flow: call, wait for peers
 * (onPlayerJoin fires), then `handle.start()`. Join flow: call — the render
 * loop begins automatically when the host starts (or immediately mid-game
 * via snapshot late join).
 */
export function runBrowserNet(def: GameDefinition, mount: HTMLElement, opts: NetRunOptions): NetGameHandle {
  const width = def.width ?? 1280;
  const height = def.height ?? 720;
  const background = def.background ?? '#f3ecdb';

  const renderer: Renderer =
    opts.renderer === 'canvas'
      ? new Canvas2DRenderer({ width, height, background })
      : new SvgRenderer({ width, height, background });
  mount.style.position = mount.style.position || 'relative';
  renderer.mount?.(mount);
  setOverlayHost(mount);

  const input = new KeyboardSource(def.inputMap ?? {}, document);
  const makeWorld = (seed: number) => createWorld(def, seed);

  let game: NetGame | null = null;
  let host: RoomHost | null = null;
  let raf = 0;
  let stopped = false;

  const loop = (last: number) => (now: number) => {
    if (!stopped && game) {
      const stepped = game.advance(now - last, input.currentActions());
      if (stepped > 0) input.clearPressed();
      renderer.draw(game.world.render());
    }
    raf = requestAnimationFrame(loop(now));
  };

  const begin = (g: NetGame) => {
    game = g;
    opts.onStatus?.(`playing as ${g.localPlayer} (${g.players.length} players)`);
    raf = requestAnimationFrame(loop(performance.now()));
  };

  if (opts.role === 'host') {
    host = hostRoom({
      transport: opts.transport,
      makeWorld,
      seed: opts.seed ?? def.seed ?? 1,
      config: opts.config,
      maxPlayers: opts.maxPlayers,
      attach: opts.attach,
      onDesync: opts.onDesync,
      onPlayerJoin: (p, f) => {
        opts.onStatus?.(`${p} joined`);
        opts.onPlayerJoin?.(p, f);
      },
      onPlayerLeave: opts.onPlayerLeave,
    });
    opts.onStatus?.('hosting — waiting for players');
  } else {
    opts.onStatus?.('joining…');
    joinRoom({
      transport: opts.transport,
      makeWorld,
      attach: opts.attach,
      onDesync: opts.onDesync,
      onPlayerJoin: opts.onPlayerJoin,
      onPlayerLeave: opts.onPlayerLeave,
    })
      .then(begin)
      .catch((err: Error) => opts.onStatus?.(err.message));
  }

  return {
    start() {
      if (host && !game) begin(host.start());
    },
    get game() {
      return game;
    },
    get localPlayer() {
      return game?.localPlayer ?? (opts.role === 'host' ? 'p1' : null);
    },
    get roster() {
      return host?.roster ?? game?.players ?? [];
    },
    input,
    stop() {
      stopped = true;
      cancelAnimationFrame(raf);
      game?.dispose();
      host?.dispose();
      input.dispose();
      renderer.dispose?.();
    },
  };
}
