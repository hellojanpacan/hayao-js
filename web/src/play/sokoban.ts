// The classic the repo is structured around: Sokoban, imported straight from the
// monorepo example (single source of truth — the site never drifts from the real
// game). Mounted with the pause shell off, since the page frames it itself.

import { runBrowser, type GameHandle } from "@hayao";
import { sokobanGame } from "../../../examples/sokoban/game";

export function createSokoban(mount: HTMLElement): GameHandle {
  return runBrowser(sokobanGame, mount, { shell: false });
}
