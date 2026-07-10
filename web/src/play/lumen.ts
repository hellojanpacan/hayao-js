// The "Mobile Puzzle" the site plays: Lumen, imported straight from the monorepo
// example (single source of truth — the site never drifts from the real game).
// Mounted with the pause shell off, since the page frames it itself.

import { runBrowser, type GameHandle } from "@hayao";
import { lumenGame } from "../../../examples/lumen/game";

export function createLumen(mount: HTMLElement): GameHandle {
  return runBrowser(lumenGame, mount, { shell: false });
}
