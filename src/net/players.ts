// Multiplayer inputs without touching the sim kernel: each player's actions are
// namespaced (`p1:left`, `p2:jump`) and merged into the single flat action set
// that `world.step()` already takes. The whole verify harness (InputLog, replay,
// determinism checks) works on multiplayer games unchanged — a merged frame is
// just a frame.

import type { World } from '../world';

/** A player identity: 'p1', 'p2', … (any short string without ':' works). */
export type PlayerId = string;

/** The canonical roster for n players: ['p1', …, 'pn']. */
export function playerIds(count: number): PlayerId[] {
  const out: PlayerId[] = [];
  for (let i = 1; i <= count; i++) out.push(`p${i}`);
  return out;
}

/** Namespace one action for a player: ('p2', 'left') → 'p2:left'. */
export const playerAction = (player: PlayerId, action: string): string => `${player}:${action}`;

/**
 * Merge per-player action sets into one flat, sorted frame for `world.step()`.
 * Deterministic: players are processed in roster order and the result is sorted,
 * so every peer computes the identical frame from the same inputs.
 */
export function mergePlayerFrames(players: readonly PlayerId[], inputs: ReadonlyMap<PlayerId, readonly string[]>): string[] {
  const out: string[] = [];
  for (const p of players) {
    const actions = inputs.get(p) ?? [];
    for (const a of actions) out.push(playerAction(p, a));
  }
  return out.sort();
}

/**
 * A per-player view over the world's input state. Game logic asks
 * `player.isDown('left')` and never sees the namespacing.
 */
export class PlayerInput {
  constructor(
    private readonly world: World,
    readonly player: PlayerId,
  ) {}

  isDown(action: string): boolean {
    return this.world.input.isDown(playerAction(this.player, action));
  }
  justPressed(action: string): boolean {
    return this.world.input.justPressed(playerAction(this.player, action));
  }
  justReleased(action: string): boolean {
    return this.world.input.justReleased(playerAction(this.player, action));
  }
}

/** Convenience: the input view for one player. */
export const playerInput = (world: World, player: PlayerId): PlayerInput => new PlayerInput(world, player);
