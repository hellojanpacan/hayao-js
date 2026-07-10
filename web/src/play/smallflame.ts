// The "2D Platformer" the site plays: Small Flame, imported straight from the
// monorepo example (single source of truth — the site never drifts from the real
// game). Mounted with the pause shell off, since the page frames it itself.

import { runBrowser, type GameHandle } from "@hayao";
import { smallFlameGame } from "../../../examples/small-flame/game";

export function createSmallFlame(mount: HTMLElement): GameHandle {
  return runBrowser(smallFlameGame, mount, { shell: false });
}
