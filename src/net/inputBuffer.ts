// Per-player input history. Both session kinds keep one: lockstep asks "do I
// have everyone's frame N?", rollback asks "what changed vs. my prediction?".
// First-write-wins per (player, frame) so duplicated or reordered redundancy
// windows can never rewrite history.

import type { PlayerId } from './players';

export class InputBuffer {
  /** player → frame → actions (sorted). */
  private frames = new Map<PlayerId, Map<number, string[]>>();
  /** player → highest contiguous frame received (for prediction + confirm). */
  private contiguous = new Map<PlayerId, number>();

  addPlayer(player: PlayerId): void {
    if (!this.frames.has(player)) {
      this.frames.set(player, new Map());
      this.contiguous.set(player, -1);
    }
  }

  removePlayer(player: PlayerId): void {
    this.frames.delete(player);
    this.contiguous.delete(player);
  }

  players(): PlayerId[] {
    return [...this.frames.keys()];
  }

  /**
   * Record a player's actions for a frame. Returns true if this was new
   * information (first write for that slot).
   */
  set(player: PlayerId, frame: number, actions: readonly string[]): boolean {
    const perPlayer = this.frames.get(player);
    if (!perPlayer || perPlayer.has(frame)) return false;
    perPlayer.set(frame, [...actions].sort());
    // Advance the contiguous watermark as far as the new frame allows.
    let c = this.contiguous.get(player) ?? -1;
    while (perPlayer.has(c + 1)) c++;
    this.contiguous.set(player, c);
    return true;
  }

  has(player: PlayerId, frame: number): boolean {
    return this.frames.get(player)?.has(frame) ?? false;
  }

  get(player: PlayerId, frame: number): string[] | undefined {
    return this.frames.get(player)?.get(frame);
  }

  /** The last actions at or before `frame` — the rollback predictor's guess. */
  latestAt(player: PlayerId, frame: number): string[] {
    const perPlayer = this.frames.get(player);
    if (!perPlayer) return [];
    for (let f = frame; f >= 0; f--) {
      const a = perPlayer.get(f);
      if (a) return a;
    }
    return [];
  }

  /** Highest frame such that this player's inputs 0..frame are all known. */
  contiguousThrough(player: PlayerId): number {
    return this.contiguous.get(player) ?? -1;
  }

  /** Highest frame with ALL players' inputs known contiguously. */
  confirmedFrame(): number {
    let min = Infinity;
    for (const c of this.contiguous.values()) min = Math.min(min, c);
    return min === Infinity ? -1 : min;
  }

  /** Forget a player's frames at/after `frame` (leave cutoff). */
  clearFrom(player: PlayerId, frame: number): void {
    const perPlayer = this.frames.get(player);
    if (!perPlayer) return;
    for (const f of perPlayer.keys()) if (f >= frame) perPlayer.delete(f);
    let c = this.contiguous.get(player) ?? -1;
    if (c >= frame) c = frame - 1;
    this.contiguous.set(player, c);
  }

  /** Drop history strictly before `frame` (memory hygiene on long sessions). */
  prune(frame: number): void {
    for (const perPlayer of this.frames.values()) {
      for (const f of perPlayer.keys()) if (f < frame) perPlayer.delete(f);
    }
  }
}
