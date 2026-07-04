// Emberfold — the campaign, composed entirely by the solver-backed generator.
// Four acts of rising heat: bigger boards, more stones, hotter targets. NOTHING
// here is a hand-dealt board — each act declares a factory (a deal recipe) + a
// difficulty band (solver-proven minimum slides), and `composeCampaign` fills it
// with proven, in-band boards. The whole game ships as a list of seeds
// (`LevelRecord[]`) — content as DATA, every level machine-winnable.
//
// Stones are the "new mechanic over time": act 1 has none (learn the fuse), then
// they arrive and multiply, partitioning the board into runs you must feed in the
// right order. A bigger board + more stones is a deeper solver search, so the band
// (min slides) climbs act over act and the concatenated curve escalates smoothly.

import { composeCampaign, type ActSpec } from '@hayao';
import { makePuzzle, type BoardParams, type Grid, type LevelRecord, type Move } from './logic';

/** Base seed for the whole campaign — the entire game is a pure function of it. */
export const CAMPAIGN_SEED = 20260704;

interface EmberAct extends ActSpec<Grid, Move>, BoardParams {}

/**
 * Acts sit in monotonically rising bands (depth = solver-proven minimum slides),
 * so the concatenated campaign escalates. Material (embers·2 + fours·4) always
 * exceeds the target with slack, so a solution exists; the stones + board size are
 * what make it take more slides to find.
 */
const ACTS: EmberAct[] = [
  { name: 'Kindling', cols: 4, rows: 4, stones: 0, embers: 5, fours: 0, target: 8, count: 8, minDepth: 2, maxDepth: 3 },
  { name: 'Bellows', cols: 4, rows: 4, stones: 2, embers: 7, fours: 1, target: 16, count: 12, minDepth: 4, maxDepth: 5 },
  { name: 'Forge', cols: 5, rows: 5, stones: 3, embers: 13, fours: 2, target: 32, count: 12, minDepth: 6, maxDepth: 7, maxAttempts: 4000 },
  { name: 'Crucible', cols: 5, rows: 5, stones: 5, embers: 15, fours: 2, target: 32, count: 8, minDepth: 8, maxDepth: 11, maxAttempts: 12000 },
];

const SOLVE = { maxDepth: 30, nodeCap: 300_000 };

/** Compose the campaign fresh (runs the solver). Returns pure, shippable records. */
export function buildEmberCampaign(): LevelRecord[] {
  const campaign = composeCampaign<Grid, Move>({
    seed: CAMPAIGN_SEED,
    solve: SOLVE,
    minutesPerLevel: 1.4,
    acts: ACTS.map((a) => ({
      name: a.name,
      count: a.count,
      minDepth: a.minDepth,
      maxDepth: a.maxDepth,
      solve: SOLVE,
      maxAttempts: a.maxAttempts,
      factory: (rng) => makePuzzle(rng, a),
    })),
  });
  return campaign.levels.map((l) => {
    const act = ACTS[l.act];
    return {
      seed: l.seed,
      cols: act.cols,
      rows: act.rows,
      stones: act.stones,
      embers: act.embers,
      fours: act.fours,
      target: act.target,
      depth: l.depth,
      act: l.act,
      actName: l.actName,
    };
  });
}

/** Act names for HUD/labels, derived from the acts spec. */
export const ACT_NAMES: string[] = ACTS.map((a) => a.name);
