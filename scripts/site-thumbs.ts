// Site thumbnails: render one representative, still frame of each art-complete
// Featured game to a standalone SVG under public/shots/, so the store and the
// landing hero can show real, deterministic art (not a screenshot of a screenshot).
// Regenerate with: npm run thumbs
//
// The prototype corpus is archived at tag `corpus-v0` (see docs/ARCHIVE.md); the
// three flagship games (platformer / RTS / puzzle) are being rebuilt on the
// Regalia game kit. Until they land, only the sokoban convention reference is
// rendered here — add the new games as they ship.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createWorld, renderToSVGString, type World } from '@hayao';
import { sokobanGame } from '../examples/sokoban/game';

const W = 1280;
const H = 720;
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'shots');
mkdirSync(outDir, { recursive: true });

function save(slug: string, background: string, world: World): void {
  const svg = renderToSVGString(world.render(), W, H, background);
  writeFileSync(join(outDir, `${slug}.svg`), svg);
  console.log(`  ▸ public/shots/${slug}.svg (${(svg.length / 1024).toFixed(1)} kB)`);
}

// Sokoban — the logic/view-split convention reference, first board.
{
  const w = createWorld(sokobanGame);
  w.step([]); // let the view paint the initial board
  save('sokoban', sokobanGame.background as string, w);
}

console.log('thumbnails written.');
