// Lumen Forge economy — a pure module. The whole genre is numbers: exponential
// cost ladders, tier production ratios, and unlock pacing. All of it lives here
// so the balance is simulated and asserted headlessly (see verify.ts).

export interface Tier {
  id: string;
  name: string;
  desc: string;
  baseCost: number;
  /** Cost multiplier per owned unit (the genre's 1.12–1.18 sweet spot). */
  costRate: number;
  /** Motes/sec produced per unit. */
  prod: number;
}

export const TIERS: Tier[] = [
  { id: 'lantern', name: 'Lantern', desc: 'A caught mote, kept burning', baseCost: 15, costRate: 1.15, prod: 0.6 },
  { id: 'firefly', name: 'Firefly swarm', desc: 'They forge while you rest', baseCost: 100, costRate: 1.15, prod: 7 },
  { id: 'glowwheel', name: 'Glow-wheel', desc: 'Light, spun into more light', baseCost: 1_000, costRate: 1.14, prod: 70 },
  { id: 'starkiln', name: 'Star-kiln', desc: 'Fires a captive star', baseCost: 6_500, costRate: 1.13, prod: 420 },
  { id: 'dawnengine', name: 'Dawn engine', desc: 'Manufactures sunrise', baseCost: 42_000, costRate: 1.12, prod: 3_600 },
];

/** A tier becomes visible once lifetime motes reach this share of its base cost. */
export const UNLOCK_AT = 0.4;
/** Motes granted per forge tap. */
export const CLICK_POWER = 1;

export interface EconomyState {
  motes: number;
  /** Lifetime motes earned (drives unlocks; never decreases). */
  total: number;
  owned: number[];
  clicks: number;
  [key: string]: unknown;
}

export const initialEconomy = (): EconomyState => ({ motes: 0, total: 0, owned: TIERS.map(() => 0), clicks: 0 });

export const cost = (s: EconomyState, i: number): number => Math.ceil(TIERS[i].baseCost * Math.pow(TIERS[i].costRate, s.owned[i]));

export const production = (s: EconomyState): number => TIERS.reduce((sum, t, i) => sum + t.prod * s.owned[i], 0);

export const canBuy = (s: EconomyState, i: number): boolean => s.motes >= cost(s, i);

export function buy(s: EconomyState, i: number): boolean {
  const c = cost(s, i);
  if (s.motes < c) return false;
  s.motes -= c;
  s.owned[i]++;
  return true;
}

export function forge(s: EconomyState): void {
  s.motes += CLICK_POWER;
  s.total += CLICK_POWER;
  s.clicks++;
}

export function tick(s: EconomyState, dt: number): void {
  const p = production(s) * dt;
  s.motes += p;
  s.total += p;
}

/** How many tiers are visible (unlocked-for-display) at this lifetime total. */
export function unlockedCount(s: EconomyState): number {
  let n = 1; // the lantern is always visible
  for (let i = 1; i < TIERS.length; i++) if (s.total >= TIERS[i].baseCost * UNLOCK_AT) n = i + 1;
  return n;
}
