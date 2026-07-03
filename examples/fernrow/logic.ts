// Fernrow farming sim — pure module. A 16-day year across four seasons,
// energy-budgeted days, till/plant/water/harvest, season-checked crops that
// wither when their time passes, and a coin goal by year's end. Turn-based:
// every action is a deterministic transition; sleeping resolves growth.

export const FARM_W = 10;
export const FARM_H = 6;
export const DAYS_PER_SEASON = 4;
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
export type Season = (typeof SEASONS)[number];
export const YEAR_DAYS = DAYS_PER_SEASON * SEASONS.length;
export const ENERGY_PER_DAY = 24;
export const GOAL_COINS = 700;
export const START_COINS = 60;

export interface CropDef {
  id: string;
  name: string;
  seedCost: number;
  sellPrice: number;
  /** Watered days to mature. */
  growDays: number;
  season: Season;
}

export const CROPS: Record<string, CropDef> = {
  turnip: { id: 'turnip', name: 'Turnip', seedCost: 10, sellPrice: 22, growDays: 2, season: 'spring' },
  bean: { id: 'bean', name: 'Moonbean', seedCost: 16, sellPrice: 38, growDays: 3, season: 'summer' },
  pumpkin: { id: 'pumpkin', name: 'Pumpkin', seedCost: 28, sellPrice: 70, growDays: 3, season: 'autumn' },
};
export const SEASON_CROP: Record<Season, string | null> = { spring: 'turnip', summer: 'bean', autumn: 'pumpkin', winter: null };

export interface Plot {
  tilled: boolean;
  crop: string | null;
  /** Watered growth-days accumulated. */
  grown: number;
  watered: boolean;
}

export interface FrState {
  day: number; // 1..YEAR_DAYS
  energy: number;
  coins: number;
  x: number; // player tile on the farm grid
  y: number;
  plots: Plot[]; // FARM_W × FARM_H
  harvested: number;
  won: boolean;
  yearOver: boolean;
  msg: string;
  [key: string]: unknown;
}

export const pidx = (x: number, y: number): number => y * FARM_W + x;
export const seasonOf = (day: number): Season => SEASONS[Math.min(3, Math.floor((day - 1) / DAYS_PER_SEASON))];

export function initialFr(): FrState {
  return {
    day: 1,
    energy: ENERGY_PER_DAY,
    coins: START_COINS,
    x: 4,
    y: 3,
    plots: Array.from({ length: FARM_W * FARM_H }, () => ({ tilled: false, crop: null, grown: 0, watered: false })),
    harvested: 0,
    won: false,
    yearOver: false,
    msg: 'Spring, day 1. The fern rows wait.',
  };
}

export type FrAction = 'left' | 'right' | 'up' | 'down' | 'till' | 'plant' | 'water' | 'harvest' | 'sleep';

export interface FrEvents {
  acted: boolean;
  harvested: boolean;
  slept: boolean;
  withered: number;
  won: boolean;
  yearOver: boolean;
}

export function stepFr(s: FrState, action: FrAction): FrEvents {
  const ev: FrEvents = { acted: false, harvested: false, slept: false, withered: 0, won: false, yearOver: false };
  if (s.won || s.yearOver) return ev;
  const season = seasonOf(s.day);
  const plot = s.plots[pidx(s.x, s.y)];

  switch (action) {
    case 'left':
      s.x = Math.max(0, s.x - 1);
      return ev;
    case 'right':
      s.x = Math.min(FARM_W - 1, s.x + 1);
      return ev;
    case 'up':
      s.y = Math.max(0, s.y - 1);
      return ev;
    case 'down':
      s.y = Math.min(FARM_H - 1, s.y + 1);
      return ev;
    case 'till':
      if (s.energy > 0 && !plot.tilled) {
        plot.tilled = true;
        s.energy--;
        ev.acted = true;
      }
      return ev;
    case 'plant': {
      const cropId = SEASON_CROP[season];
      if (!cropId) {
        s.msg = 'Nothing grows in winter.';
        return ev;
      }
      const def = CROPS[cropId];
      if (s.energy > 0 && plot.tilled && !plot.crop && s.coins >= def.seedCost) {
        s.coins -= def.seedCost;
        plot.crop = cropId;
        plot.grown = 0;
        plot.watered = false;
        s.energy--;
        ev.acted = true;
      }
      return ev;
    }
    case 'water':
      if (s.energy > 0 && plot.crop && !plot.watered) {
        plot.watered = true;
        s.energy--;
        ev.acted = true;
      }
      return ev;
    case 'harvest': {
      if (!plot.crop) return ev;
      const def = CROPS[plot.crop];
      if (s.energy > 0 && plot.grown >= def.growDays) {
        s.coins += def.sellPrice;
        s.harvested++;
        plot.crop = null;
        plot.grown = 0;
        plot.watered = false;
        s.energy--;
        ev.acted = true;
        ev.harvested = true;
        if (s.coins >= GOAL_COINS) {
          s.won = true;
          ev.won = true;
          s.msg = 'The festival prize is yours!';
        }
      }
      return ev;
    }
    case 'sleep': {
      // Growth resolves overnight: watered crops advance; water dries.
      s.day++;
      const after = s.day <= YEAR_DAYS ? seasonOf(s.day) : 'winter';
      for (const p of s.plots) {
        if (p.crop && p.watered) p.grown++;
        p.watered = false;
        // Season change withers out-of-season UNRIPE crops (ripe ones keep).
        if (p.crop && after !== CROPS[p.crop].season && p.grown < CROPS[p.crop].growDays) {
          p.crop = null;
          p.grown = 0;
          ev.withered++;
        }
      }
      s.energy = ENERGY_PER_DAY;
      ev.slept = true;
      if (s.day > YEAR_DAYS) {
        s.yearOver = true;
        ev.yearOver = true;
        s.msg = s.coins >= GOAL_COINS ? 'The festival prize is yours!' : `The year ends: ${s.coins} coins.`;
        if (s.coins >= GOAL_COINS) {
          s.won = true;
          ev.won = true;
        }
      } else {
        s.msg = `${seasonOf(s.day)[0].toUpperCase() + seasonOf(s.day).slice(1)}, day ${((s.day - 1) % DAYS_PER_SEASON) + 1}.${ev.withered ? ` ${ev.withered} crops withered.` : ''}`;
      }
      return ev;
    }
  }
}
