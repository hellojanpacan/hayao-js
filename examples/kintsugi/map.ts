// The Mended Map — a node-link overview of the world, drawn from the same graph
// the solver proves. Biomes are columns; rooms are nodes; visited rooms glow in
// their biome colour, their unentered neighbours show as faint ghosts (classic
// metroidvania fog). The current room pulses gold; uncollected shrines/shards and
// living guardians are marked. Pure cosmetic overlay, rebuilt when opened.

import { Node, Sprite, Text, KENTO, withAlpha, glow } from '@hayao';
import { KINTSUGI_WORLD, BIOMES } from './world';
import { GUARDIAN_OF } from './boss';
import { biomeArt } from './biome';
import type { KgState } from './logic';

const VIEW_W = 1280;
const VIEW_H = 720;

export function buildMapNode(kg: KgState): Node {
  const root = new Node({ name: 'map' });
  root.cosmetic = true;
  root.addChild(new Sprite({ pos: { x: VIEW_W / 2, y: VIEW_H / 2 }, z: 200, shape: { kind: 'rect', w: VIEW_W, h: VIEW_H }, fill: withAlpha(KENTO.yohaku, 0.9) }));
  root.addChild(new Text({ text: 'The Mended Map', pos: { x: VIEW_W / 2, y: 64 }, z: 202, size: 34, align: 'center', fill: KENTO.gofun, font: 'Georgia, serif' }));

  // layout: biome columns, rooms stacked
  const perBiome: Record<string, string[]> = {};
  for (const r of KINTSUGI_WORLD.regions) (perBiome[r.biome ?? 'grove'] ??= []).push(r.id);
  const pos = new Map<string, { x: number; y: number }>();
  BIOMES.forEach((b, bi) => {
    const col = perBiome[b.id] ?? [];
    const x = 170 + bi * 235;
    col.forEach((rid, ri) => pos.set(rid, { x, y: 190 + ri * 74 }));
    root.addChild(new Text({ text: b.name, pos: { x, y: 140 }, z: 202, size: 15, align: 'center', fill: KENTO.kinako, font: 'Georgia, serif' }));
  });

  const visited = new Set(kg.visited);
  const adj = new Set<string>();
  for (const e of KINTSUGI_WORLD.edges) {
    if (visited.has(e.from)) adj.add(e.to);
    if (visited.has(e.to)) adj.add(e.from);
  }
  const known = (id: string): boolean => visited.has(id) || adj.has(id);

  // edges among known rooms
  for (const e of KINTSUGI_WORLD.edges) {
    if (!known(e.from) || !known(e.to)) continue;
    const a = pos.get(e.from)!;
    const b = pos.get(e.to)!;
    const bright = visited.has(e.from) && visited.has(e.to);
    root.addChild(new Sprite({ z: 201, shape: { kind: 'poly', points: [a.x, a.y, b.x, b.y], closed: false }, stroke: withAlpha(KENTO.kinako, bright ? 0.6 : 0.2), strokeWidth: bright ? 2 : 1.5, fill: 'none' }));
  }

  // nodes
  for (const r of KINTSUGI_WORLD.regions) {
    if (!known(r.id)) continue;
    const p = pos.get(r.id)!;
    const vis = visited.has(r.id);
    const art = biomeArt(r.biome ?? 'grove');
    root.addChild(new Sprite({ pos: p, z: 203, shape: { kind: 'rect', w: 26, h: 18, r: 5 }, fill: vis ? art.accent : withAlpha(art.accent, 0.16), stroke: withAlpha(KENTO.gofun, vis ? 0.8 : 0.3), strokeWidth: 1.5 }));
    if (r.id === kg.region) root.addChild(new Sprite({ pos: p, z: 205, shape: { kind: 'circle', radius: 16 }, fill: 'none', stroke: KENTO.ko, strokeWidth: 2.5, shadow: glow(KENTO.ko, 8) }));
    // uncollected pickup marker
    const pk = KINTSUGI_WORLD.pickups.find((pp) => pp.region === r.id && !kg.taken.includes(pp.id));
    if (pk && vis) root.addChild(new Sprite({ pos: { x: p.x + 10, y: p.y - 9 }, z: 204, shape: { kind: 'circle', radius: 4 }, fill: KENTO.ko, shadow: glow(KENTO.ko, 5) }));
    // living guardian marker
    const g = GUARDIAN_OF[r.id];
    if (g && !kg.bossesDefeated.includes(g) && vis) root.addChild(new Sprite({ pos: { x: p.x - 10, y: p.y - 9 }, z: 204, shape: { kind: 'circle', radius: 4 }, fill: KENTO.shu, shadow: glow(KENTO.shu, 5) }));
  }

  // stats + close hint
  const shards = kg.taken.filter((t) => KINTSUGI_WORLD.pickups.find((p) => p.id === t)?.grants.startsWith('shard:')).length;
  root.addChild(new Text({ text: `Seams ${kg.abilities.length}/5   ·   Shards ${shards}   ·   Rooms ${visited.size}/${KINTSUGI_WORLD.regions.length}`, pos: { x: VIEW_W / 2, y: VIEW_H - 70 }, z: 202, size: 18, align: 'center', fill: KENTO.gofun }));
  root.addChild(new Text({ text: 'Tab / M to close', pos: { x: VIEW_W / 2, y: VIEW_H - 40 }, z: 202, size: 15, align: 'center', fill: KENTO.kinako }));
  return root;
}
