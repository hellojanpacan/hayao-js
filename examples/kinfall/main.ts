// Kinfall entry: local co-op only — two players share one keyboard. Browser
// wiring lives here; the sim + view are host-agnostic.

import { hideScreen, runBrowser, showScreen } from '@hayao';
import { kinfallGame } from './game';

const mount = document.getElementById('app')!;

function start(): void {
  hideScreen();
  runBrowser(kinfallGame, mount);
}

showScreen({
  title: 'Kinfall',
  body: 'Two survivors, one keyboard, one closing storm. Loot crates for better guns, orbit the horde, and — when your partner drops — haul them up before they bleed out. Hold the ring for 100 seconds to make the extraction.\n\nP1 red: WASD + «,» fire + «Y» revive/loot.  P2 blue: arrows + «.» fire + «-» revive/loot.',
  actions: [{ label: 'Co-op survival (one keyboard)', primary: true, onSelect: start }],
});
