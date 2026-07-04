// Campaign composition — the layer that turns a solver-backed GENERATOR into an
// hour of shaped content. `generate.ts` yields a pile of proven, in-band levels;
// this stitches them into an ordered, multi-act progression whose difficulty
// escalates act over act, with an honest length estimate. The whole campaign is
// DATA — a list of reproducible sub-seeds and act boundaries — so it hashes,
// diffs, and ships without ever hand-authoring a map.
//
// Each act declares its own difficulty band; because later acts sit in higher
// bands, the concatenated curve rises across the whole game. Feed the resulting
// `.difficulty` series straight to `rampIssues`/`assertRamp` (verify/ramp) to
// PROVE the hour is well-shaped, the same way `assertSolvable` proves one level.

import type { Rng } from '../core/rng';
import type { Puzzle } from '../verify/solver';
import type { SolveOptions } from '../verify/solver';
import {
  generateLevels,
  type DifficultyBand,
  type GeneratedLevel,
} from './generate';

/** One named stretch of the campaign, generated inside its own difficulty band. */
export interface ActSpec<State = unknown, Move = unknown> extends DifficultyBand {
  /** Display name ("The Shallows", "Deep Roots", …). */
  name: string;
  /** How many verified levels this act contributes. */
  count: number;
  /**
   * Optional per-act candidate factory — overrides the campaign default. This is
   * how an act introduces a NEW mechanic or board size (a bigger grid, a new tile
   * kind) while the earlier acts keep the simpler one: mechanic-gating as data.
   */
  factory?: (rng: Rng) => Puzzle<State, Move>;
  /** Optional per-act solver budget override. */
  solve?: SolveOptions;
  /** Optional per-act attempt cap override. */
  maxAttempts?: number;
}

export interface CampaignSpec<State, Move> {
  /** Default candidate factory — used by any act that doesn't bring its own. */
  factory?: (rng: Rng) => Puzzle<State, Move>;
  /** Ordered acts; earlier acts should sit in lower difficulty bands. */
  acts: ActSpec<State, Move>[];
  /** Base seed for the whole campaign (default 1). */
  seed?: number;
  /** Default solver budget for acts that don't override it. */
  solve?: SolveOptions;
  /** Rough authoring estimate: minutes a median player spends per level (default 1.5). */
  minutesPerLevel?: number;
}

/** A generated level tagged with the act it belongs to and its campaign index. */
export interface CampaignLevel<State, Move> extends GeneratedLevel<State, Move> {
  /** Zero-based act index. */
  act: number;
  /** The act's display name. */
  actName: string;
  /** Position within its act. */
  actIndex: number;
}

export interface ActBounds {
  name: string;
  /** First campaign index (inclusive). */
  from: number;
  /** Last campaign index (inclusive). */
  to: number;
}

export interface Campaign<State, Move> {
  levels: CampaignLevel<State, Move>[];
  acts: ActBounds[];
  /** Per-level difficulty (solver depth), campaign order — feed to `rampIssues`. */
  difficulty: number[];
  /** Reproduce the campaign: every level's sub-seed, in order. */
  seeds: number[];
  /** Honest length estimate in minutes (levels × minutesPerLevel). */
  estMinutes: number;
}

/**
 * Compose a full campaign by generating each act inside its band and concatenating
 * them in order. Deterministic: same spec → same campaign everywhere. Acts are
 * seeded independently (base seed mixed with the act index) so re-tuning one act's
 * band or count never reshuffles the others.
 *
 * Throws (via `generateLevels`) if any act's band is too tight to fill — a loud,
 * early failure beats silently shipping a short act.
 */
export function composeCampaign<State, Move>(spec: CampaignSpec<State, Move>): Campaign<State, Move> {
  const baseSeed = spec.seed ?? 1;
  const minutesPerLevel = spec.minutesPerLevel ?? 1.5;
  const levels: CampaignLevel<State, Move>[] = [];
  const acts: ActBounds[] = [];

  spec.acts.forEach((act, a) => {
    const factory = act.factory ?? spec.factory;
    if (!factory) throw new Error(`hayao: act "${act.name}" has no factory and the campaign has no default`);
    // Mix the act index into the seed so acts draw from disjoint candidate streams.
    const actSeed = (baseSeed ^ ((a + 1) * 0x9e3779b9)) >>> 0;
    const generated = generateLevels(factory, {
      count: act.count,
      seed: actSeed,
      minDepth: act.minDepth,
      maxDepth: act.maxDepth,
      minNodes: act.minNodes,
      maxNodes: act.maxNodes,
      solve: act.solve ?? spec.solve,
      maxAttempts: act.maxAttempts,
    });
    const from = levels.length;
    generated.forEach((lvl, actIndex) => {
      levels.push({ ...lvl, index: levels.length, act: a, actName: act.name, actIndex });
    });
    acts.push({ name: act.name, from, to: levels.length - 1 });
  });

  return {
    levels,
    acts,
    difficulty: levels.map((l) => l.depth),
    seeds: levels.map((l) => l.seed),
    estMinutes: levels.length * minutesPerLevel,
  };
}
