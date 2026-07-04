// Lanternfold — the campaign, composed entirely by the solver-backed generator.
// Four acts of escalating difficulty (and growing boards) are generated inside
// monotonic difficulty bands, so the whole ~40-level curve rises act over act.
// NOTHING here is a hand-drawn level: each act declares a factory + a band, and
// `composeCampaign` fills it with proven, in-band boards. The result ships as a
// list of seeds (`LevelRecord[]`) — content as DATA, every level machine-winnable.

import { composeCampaign, type ActSpec } from '@hayao';
import { makeLanternPuzzle, type LanternState, type LevelRecord, type Tap } from './logic';

/** Base seed for the whole campaign — the entire game is a pure function of it. */
export const CAMPAIGN_SEED = 20260704;

interface LanternAct extends ActSpec<LanternState, Tap> {
  cols: number;
  rows: number;
  scrambleLo: number;
  scrambleHi: number;
}

/**
 * Acts sit in monotonically rising bands (depth = solver-proven minimum taps), so
 * the concatenated campaign escalates smoothly. Boards grow 3×3 → 4×4 as the
 * mechanic deepens; a bigger board is a "new mechanic introduced over time",
 * expressed purely as data (each act brings its own factory).
 */
const ACTS: LanternAct[] = [
  { name: 'Dusk Lane', cols: 3, rows: 3, scrambleLo: 2, scrambleHi: 5, count: 8, minDepth: 2, maxDepth: 3 },
  { name: 'Paper Row', cols: 4, rows: 4, scrambleLo: 3, scrambleHi: 10, count: 10, minDepth: 4, maxDepth: 5 },
  { name: 'Lantern Court', cols: 5, rows: 3, scrambleLo: 6, scrambleHi: 16, count: 12, minDepth: 6, maxDepth: 6, maxAttempts: 3000 },
  { name: 'Festival Night', cols: 5, rows: 3, scrambleLo: 10, scrambleHi: 26, count: 12, minDepth: 7, maxDepth: 9, maxAttempts: 12000 },
];

const SOLVE = { maxDepth: 22, nodeCap: 300_000 };

/** Compose the campaign fresh (runs the solver). Returns pure, shippable records. */
export function buildLanternCampaign(): LevelRecord[] {
  const campaign = composeCampaign<LanternState, Tap>({
    seed: CAMPAIGN_SEED,
    solve: SOLVE,
    minutesPerLevel: 1.4,
    acts: ACTS.map((a) => ({
      name: a.name,
      count: a.count,
      minDepth: a.minDepth,
      maxDepth: a.maxDepth,
      solve: SOLVE,
      factory: (rng) => makeLanternPuzzle(rng, a),
    })),
  });
  return campaign.levels.map((l) => {
    const act = ACTS[l.act];
    return {
      seed: l.seed,
      cols: act.cols,
      rows: act.rows,
      scrambleLo: act.scrambleLo,
      scrambleHi: act.scrambleHi,
      depth: l.depth,
      act: l.act,
      actName: l.actName,
    };
  });
}

/** Act boundaries for HUD/labels, derived from the acts spec. */
export const ACT_NAMES: string[] = ACTS.map((a) => a.name);
