// Weighted random picking + loot/spawn tables. Built strictly ON `world.rng`
// (an `Rng`) — never `Math.random`. A single float draw per pick, scanned over
// cumulative weights in array order, so results are deterministic and
// reproducible from the RNG state alone. (js13k games fake this with
// filter+shuffle or reach for `Math.random`; this is the honest primitive.)

import type { Rng } from '../core/rng';

/** One weighted option: a value and its relative weight (≥ 0). */
export interface WeightedEntry<T> {
  value: T;
  weight: number;
}

/** Sum a weight list, clamping negatives to 0 (a negative weight is a bug, not a subtraction). */
function totalWeight(weights: readonly number[]): number {
  let sum = 0;
  for (const w of weights) sum += w > 0 ? w : 0;
  return sum;
}

/**
 * Pick an index in [0, weights.length) with probability ∝ weights[i]. Draws
 * exactly one `rng.float()` and walks the weights in order, so the choice is a
 * pure function of the RNG state. Throws if no weight is positive.
 */
export function weightedIndex(rng: Rng, weights: readonly number[]): number {
  const total = totalWeight(weights);
  if (total <= 0) throw new Error('hayao: weightedIndex needs at least one positive weight');
  let r = rng.float() * total;
  for (let i = 0; i < weights.length; i++) {
    const w = weights[i] > 0 ? weights[i] : 0;
    if (r < w) return i;
    r -= w;
  }
  // Float rounding can leave r ≥ every remaining bucket; hand it the last positive one.
  for (let i = weights.length - 1; i >= 0; i--) if (weights[i] > 0) return i;
  return weights.length - 1;
}

/** Pick `items[i]` with probability ∝ `weights[i]` (parallel arrays). */
export function weightedPick<T>(rng: Rng, items: readonly T[], weights: readonly number[]): T {
  if (items.length !== weights.length) throw new Error('hayao: weightedPick items/weights length mismatch');
  return items[weightedIndex(rng, weights)];
}

/** Pick the value of one weighted entry. */
export function pickEntry<T>(rng: Rng, entries: readonly WeightedEntry<T>[]): T {
  return entries[weightedIndex(rng, entries.map((e) => e.weight))].value;
}

/**
 * A reusable loot/spawn table. Precomputes cumulative weights once so repeated
 * rolls are cheap; every draw still comes from the passed `Rng`, keeping the
 * table itself stateless and the randomness owned by `world.rng`.
 */
export class LootTable<T> {
  private readonly values: readonly T[];
  /** Cumulative (prefix-sum) weights; last element is the total. */
  private readonly cumulative: readonly number[];
  readonly total: number;

  constructor(entries: readonly WeightedEntry<T>[]) {
    if (entries.length === 0) throw new Error('hayao: LootTable needs at least one entry');
    const values: T[] = [];
    const cumulative: number[] = [];
    let sum = 0;
    for (const e of entries) {
      sum += e.weight > 0 ? e.weight : 0;
      values.push(e.value);
      cumulative.push(sum);
    }
    if (sum <= 0) throw new Error('hayao: LootTable needs at least one positive weight');
    this.values = values;
    this.cumulative = cumulative;
    this.total = sum;
  }

  /** One draw with replacement. */
  roll(rng: Rng): T {
    const r = rng.float() * this.total;
    // Linear scan (tables are small); ordered → deterministic.
    for (let i = 0; i < this.cumulative.length; i++) if (r < this.cumulative[i]) return this.values[i];
    return this.values[this.values.length - 1];
  }

  /** `n` independent draws with replacement, in order. */
  rollMany(rng: Rng, n: number): T[] {
    const out: T[] = [];
    for (let i = 0; i < n; i++) out.push(this.roll(rng));
    return out;
  }
}
