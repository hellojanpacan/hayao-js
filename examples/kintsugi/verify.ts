// Kintsugi verify suite. The metroidvania's WINNABILITY is proven structurally by
// the world-graph solver (a valid 100% seam order exists, softlock-free) — a
// stronger guarantee than any single scripted run. On top of that: a deterministic
// tutorial romp proves the controls/combat sim runs and reproduces, the first
// screen teaches its controls and reads cleanly, and a filmstrip shows the looks.

import {
  createWorld,
  checkDeterministic,
  renderFilmstrip,
  layoutIssues,
  missingControlHints,
  proveFullCompletion,
  proveCompletable,
  findSoftlocks,
  validateWorld,
  reachableRegions,
  type World,
} from '@hayao';
import { kintsugiGame, KG_INPUT_MAP } from './game';
import { KINTSUGI_WORLD, ABILITY_ORDER } from './world';
import type { VerifyContext } from '../../scripts/verify';

/** A deterministic tutorial romp: run right, hop the ledges, strike. */
function romp(world: World): string[][] {
  const log: string[][] = [];
  for (let i = 0; i < 300; i++) {
    const a: string[] = ['right'];
    if (i % 26 < 2) a.push('jump');
    if (i % 40 === 0) a.push('attack');
    log.push(a);
    world.step(a);
  }
  return log;
}

export default async function verify(t: VerifyContext) {
  // 1. Winnability — the whole world is machine-proven completable + 100% + safe.
  const comp = proveCompletable(KINTSUGI_WORLD);
  t.check(comp.solvable && !comp.exhausted ? 'the world is completable (a valid seam order reaches the kiln)' : 'the world is NOT completable', comp.solvable && !comp.exhausted);
  const full = proveFullCompletion(KINTSUGI_WORLD);
  t.check(full.solvable && !full.exhausted ? 'the world is 100%-completable (every seam AND shard obtainable)' : 'not 100%-completable', full.solvable && !full.exhausted);
  const soft = findSoftlocks(KINTSUGI_WORLD, 'full');
  t.check(soft.ok ? `no softlock across ${soft.statesExplored} reachable states (incl. the cistern drop)` : `softlock at ${soft.deadEnds[0]}`, soft.ok);
  const issues = validateWorld(KINTSUGI_WORLD);
  t.check(issues.length === 0 ? 'world graph is structurally sound' : `graph issue: ${issues[0]}`, issues.length === 0);

  // 2. It is a real metroidvania: a large, gated, growing world.
  const biomes = new Set(KINTSUGI_WORLD.regions.map((r) => r.biome)).size;
  t.check(KINTSUGI_WORLD.regions.length >= 24 && biomes === 5 ? `${KINTSUGI_WORLD.regions.length} rooms across ${biomes} biomes` : 'world too small', KINTSUGI_WORLD.regions.length >= 24 && biomes === 5);
  const noKit = reachableRegions(KINTSUGI_WORLD, []).length;
  const fullKit = reachableRegions(KINTSUGI_WORLD, ABILITY_ORDER).length;
  t.check(noKit < fullKit && fullKit === KINTSUGI_WORLD.regions.length ? `abilities gate the world (${noKit} rooms open bare → ${fullKit} with the full kit)` : 'gating is broken', noKit < fullKit && fullKit === KINTSUGI_WORLD.regions.length);

  // 3. Deterministic tutorial romp — controls + combat sim run and reproduce.
  const world = createWorld(kintsugiGame);
  const log = romp(world);
  const end = world.probe() as { hp: number; won: boolean; x: number };
  t.check(end.hp > 0 ? `the Mender survives the opening romp (${end.hp} hearts)` : 'died in the tutorial grove', end.hp > 0);
  t.golden('opening romp', world.hash());
  const rep = checkDeterministic(() => createWorld(kintsugiGame), { frames: log });
  t.check(rep.ok ? 'sim is deterministic across runs' : `sim diverged at frame ${rep.divergedAt}`, rep.ok);

  // 4. First-screen human-contact layer.
  const w0 = createWorld(kintsugiGame);
  w0.step([]);
  const lint = layoutIssues(w0.render());
  t.check(lint.length === 0 ? 'layout lint: first screen reads cleanly' : `layout lint: ${lint[0]}`, lint.length === 0);
  const unhinted = missingControlHints(w0, KG_INPUT_MAP);
  t.check(unhinted.length === 0 ? 'every control is explained on screen' : `unhinted actions: ${unhinted.join(', ')}`, unhinted.length === 0);

  // 5. Filmstrip of the opening, for the looks judgement.
  t.artifact(
    'opening-filmstrip.svg',
    renderFilmstrip(createWorld(kintsugiGame), log, { width: kintsugiGame.width, height: kintsugiGame.height, background: kintsugiGame.background, panels: 8 }),
  );
}
