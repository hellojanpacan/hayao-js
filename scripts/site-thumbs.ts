// Site thumbnails: render one representative, still frame of each art-complete
// Featured game to a standalone SVG under public/shots/, so the store and the
// landing hero can show real, deterministic art (not a screenshot of a screenshot).
// Regenerate with: npm run thumbs

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createWorld, renderToSVGString, type World } from '@hayao';
import { lanternwayGame } from '../examples/lanternway/game';
import { bearerBot, type LwProbe } from '../examples/lanternway/bot';
import { rootwardGame, rwState } from '../examples/rootward/game';
import { tarnholmGame, thState } from '../examples/tarnholm/game';
import { bestPlacement, currentBuilding, place } from '../examples/tarnholm/logic';
import { driftlightGame } from '../examples/driftlight/game';
import { fernrowGame } from '../examples/fernrow/game';
import { driftBot, type DlProbe } from '../examples/driftlight/bot';

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

// Lanternway — the bearer partway across the field, mid-scroll.
{
  const w = createWorld(lanternwayGame);
  for (let f = 0; f < 210; f++) {
    const p = w.probe() as unknown as LwProbe;
    if (p.won) break;
    w.step(bearerBot(p));
  }
  save('lanternway', lanternwayGame.background as string, w);
}

// Rootward — a few towers planted, a wave marching the lane, shots in flight.
{
  const w = createWorld(rootwardGame);
  const s = rwState(w);
  s.gold = 900;
  s.towers.push({ pad: 4, kind: 'arrow', cd: 0 }, { pad: 9, kind: 'cannon', cd: 0 }, { pad: 5, kind: 'frost', cd: 0 }, { pad: 8, kind: 'arrow', cd: 0 }, { pad: 10, kind: 'cannon', cd: 0 });
  s.cursor = 5;
  for (let f = 0; f < 300; f++) w.step([]); // betweenT elapses → wave 1 spawns and marches
  save('rootward', rootwardGame.background as string, w);
}

// Tarnholm — a well-built island: greedy placement of most of the queue.
{
  const w = createWorld(tarnholmGame, 6);
  const s = thState(w);
  for (let n = 0; n < 15; n++) {
    if (s.won || s.done) break;
    const b = bestPlacement(s);
    if (!b) break;
    place(s, b.x, b.y);
    void currentBuilding;
  }
  w.step([]); // let the view paint the placements
  save('tarnholm', tarnholmGame.background as string, w);
}

// Driftlight — the lantern mid-river, sky gradient + glow + parallax banks.
{
  const w = createWorld(driftlightGame);
  for (let f = 0; f < 260; f++) {
    const p = w.probe() as unknown as DlProbe;
    if (p.won || p.lost) break;
    w.step(driftBot(p));
  }
  save('driftlight', driftlightGame.background as string, w);
}

// Fernrow — a worked patch: a few rows tilled, planted, and watered in spring.
{
  const w = createWorld(fernrowGame);
  const press = (a: string) => { w.step([a]); w.step([]); };
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) { press('till'); press('plant'); press('water'); if (col < 4) press('right'); }
    for (let col = 0; col < 4; col++) press('left');
    if (row < 2) press('down');
  }
  for (let i = 0; i < 10; i++) w.step([]);
  save('fernrow', fernrowGame.background as string, w);
}

console.log('thumbnails written.');
