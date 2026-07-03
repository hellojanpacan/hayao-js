// Shard Ascent verify suite: every level beaten by its bot plan with zero
// deaths, a full run is deterministic, and spikes actually kill.

import { checkDeterministic, createWorld, layoutIssues, missingControlHints, type World } from '@hayao';
import { LEVELS } from './levels';
import { createBot, PLANS, type BotProbe } from './bot';
import { gotoLevel, shardAscentGame, SA_INPUT_MAP } from './game';
import type { VerifyContext } from '../../scripts/verify';

const MAX_FRAMES = 3600; // 60 sim-seconds per level is generous

/** Run a level's plan; returns frames used (or -1 on failure) + the input log. */
function runLevel(world: World, level: number): { frames: number; log: string[][] } {
  gotoLevel(world, level);
  const bot = createBot(PLANS[level]);
  const log: string[][] = [];
  for (let f = 0; f < MAX_FRAMES; f++) {
    const p = world.probe() as unknown as BotProbe & { level: number; won: boolean; deaths: number };
    if (p.level !== level || p.won) return { frames: f, log };
    const actions = bot(p);
    log.push(actions);
    world.step(actions);
  }
  return { frames: -1, log };
}

export default async function verify(t: VerifyContext) {
  const world = createWorld(shardAscentGame);
  let fullLog: string[][] = [];

  for (let i = 0; i < LEVELS.length; i++) {
    const before = (world.probe() as { deaths: number }).deaths;
    const { frames, log } = runLevel(world, i);
    const after = (world.probe() as { deaths: number }).deaths;
    const clean = after === before;
    t.check(
      frames >= 0 && clean
        ? `level ${i + 1} "${LEVELS[i].name}" beaten in ${frames} frames (${(frames / 60).toFixed(1)}s), 0 deaths`
        : `level ${i + 1} "${LEVELS[i].name}" ${frames < 0 ? 'NOT beaten within budget' : `beaten with ${after - before} death(s)`}`,
      frames >= 0 && clean,
    );
    if (i === 0) fullLog = log;
  }

  t.golden('all-levels bot run', world.hash());


  // Readability: the human-contact layer is verified like everything else.
  {
    const w3 = createWorld(shardAscentGame);
    w3.step([]);
    const issues = layoutIssues(w3.render());
    t.check(issues.length === 0 ? 'layout lint: no text collisions on the first screen' : `layout lint: ${issues[0]}`, issues.length === 0);
    const unhinted = missingControlHints(w3, SA_INPUT_MAP);
    t.check(unhinted.length === 0 ? 'every control is explained on screen' : `unhinted actions: ${unhinted.join(', ')}`, unhinted.length === 0);
  }

  // Determinism over the level-1 playthrough.
  const rep = checkDeterministic(() => createWorld(shardAscentGame), { frames: fullLog });
  t.check(rep.ok ? 'sim is deterministic across runs' : `sim diverged at frame ${rep.divergedAt}`, rep.ok);

  // Spikes kill: walk straight into the first pit of level 1.
  const w2 = createWorld(shardAscentGame);
  for (let f = 0; f < 240; f++) w2.step(['right']);
  const dead = (w2.probe() as { deaths: number }).deaths;
  t.check(`spikes kill and reset (deaths=${dead} after blind walk)`, dead >= 1);

  // Difficulty telemetry (not a gate — logged for the design record).
  t.ok(`design note: per-level frame budgets used — see labels above`);
}
