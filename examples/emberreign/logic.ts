// Emberreign narrative sim — pure module. Reigns' engine: four meters that
// must stay between the ditches, a deck of double-edged decisions, and flags
// that chain cards into arcs. Every card is data; the balance of the whole
// reign is therefore a simulation you can run ten thousand times.

import type { Rng } from '@hayao';

export const METERS = ['grove', 'folk', 'wardens', 'coffers'] as const;
export type Meter = (typeof METERS)[number];
export const YEARS_TO_WIN = 12;
export const SEASONS_PER_YEAR = 4;

export interface Effects {
  grove?: number;
  folk?: number;
  wardens?: number;
  coffers?: number;
  /** Story flags set/cleared. */
  set?: string[];
  clear?: string[];
}

export interface Choice {
  label: string;
  fx: Effects;
}

export interface Card {
  id: string;
  who: string;
  text: string;
  left: Choice;
  right: Choice;
  /** Only drawn while this flag predicate holds. */
  needs?: string;
  needsNot?: string;
  once?: boolean;
}

export const DECK: Card[] = [
  { id: 'tithe', who: 'Grove-Mother', text: 'The old trees ask their tithe of silver.', left: { label: 'Pay it', fx: { coffers: -12, grove: 10 } }, right: { label: 'The trees can wait', fx: { grove: -12, coffers: 4 } } },
  { id: 'harvest', who: 'Reeve of the Fields', text: 'A fat harvest — but the wardens want their share first.', left: { label: 'Feed the folk', fx: { folk: 12, wardens: -8 } }, right: { label: 'Provision the wardens', fx: { wardens: 10, folk: -8 } } },
  { id: 'bandits', who: 'Warden-Captain', text: 'Bandits on the ember road. Give me coin or give me leave to conscript.', left: { label: 'Fund a patrol', fx: { coffers: -10, wardens: 8, folk: 2 } }, right: { label: 'Conscript the young', fx: { wardens: 10, folk: -10 } } },
  { id: 'festival', who: 'The Folk', text: 'The Emberfest approaches. The people hunger for splendour.', left: { label: 'Fund the fires', fx: { coffers: -12, folk: 12, grove: 2 } }, right: { label: 'A quiet year', fx: { folk: -9, coffers: 3 } } },
  { id: 'relic', who: 'Peddler', text: 'A relic of the First Flame — yours for a princely sum.', left: { label: 'Buy it', fx: { coffers: -14, grove: 8, set: ['relic'] } }, right: { label: 'Send him off', fx: { grove: -3 } } },
  { id: 'drought', who: 'Reeve of the Fields', text: 'The wells run low. The grove could share its springs… for a price.', left: { label: 'Bargain with the grove', fx: { grove: -8, folk: 10 } }, right: { label: 'Ration the water', fx: { folk: -10, wardens: -3, coffers: 2 } } },
  { id: 'taxes', who: 'Coin-Reeve', text: 'The coffers thin. Raise the hearth-tax?', left: { label: 'Raise it', fx: { coffers: 14, folk: -10 } }, right: { label: 'Hold steady', fx: { coffers: -6, folk: 3 } } },
  { id: 'grovewalk', who: 'Grove-Mother', text: 'Walk the grove with me. The trees remember their friends.', left: { label: 'Walk', fx: { grove: 8, wardens: -3 } }, right: { label: 'Affairs of state', fx: { grove: -6, coffers: 3 } } },
  { id: 'duel', who: 'Warden-Captain', text: 'A warden insulted the Grove-Mother. She demands his blade.', left: { label: 'Give her the blade', fx: { grove: 8, wardens: -9 } }, right: { label: 'Stand by your warden', fx: { wardens: 8, grove: -9 } } },
  { id: 'road', who: 'Coin-Reeve', text: 'A trade road through the grove would fill the coffers for years.', left: { label: 'Cut the road', fx: { coffers: 14, grove: -12 } }, right: { label: 'The grove stands', fx: { grove: 6, coffers: -4 } } },
  { id: 'plague', who: 'Herb-Wife', text: 'Fever in the low streets. My cures cost dear.', left: { label: 'Buy every cure', fx: { coffers: -12, folk: 11 } }, right: { label: 'Close the quarter', fx: { folk: -12, wardens: 3 } } },
  { id: 'embassy', who: 'Envoy of the Salt King', text: 'My king offers alliance — sealed with a heavy dowry.', left: { label: 'Accept', fx: { coffers: 12, wardens: 5, grove: -5, set: ['salt-pact'] } }, right: { label: 'Refuse', fx: { wardens: -4, folk: 3 } } },
  // The plot arc: three chained cards via flags.
  { id: 'whisper', who: 'Masked Whisper', text: 'Coin buys word of a plot against your throne.', left: { label: 'Pay for names', fx: { coffers: -8, set: ['plot-known'] }, }, right: { label: 'Rumours are wind', fx: { folk: -2, set: ['plot-ignored'] } }, once: true },
  { id: 'plot-close', who: 'Warden-Captain', text: 'The names were true. We can strike the plotters tonight.', needs: 'plot-known', left: { label: 'Strike', fx: { wardens: 6, folk: -6, clear: ['plot-known'], set: ['plot-broken'] } }, right: { label: 'Watch them longer', fx: { coffers: -4 } }, once: true },
  { id: 'plot-springs', who: 'The Plotters', text: 'Steel in the dark — the plot you ignored springs.', needs: 'plot-ignored', left: { label: 'Fight!', fx: { wardens: -14, folk: -6, clear: ['plot-ignored'] } }, right: { label: 'Flee to the grove', fx: { grove: 6, wardens: -18, coffers: -10, clear: ['plot-ignored'] } }, once: true },
];

export interface ErState {
  meters: Record<Meter, number>;
  season: number; // total decisions made
  flags: string[];
  used: string[]; // once-cards consumed
  cardId: string | null;
  ending: string | null; // doom or victory text key
  won: boolean;
  dead: boolean;
  [key: string]: unknown;
}

export function initialEr(): ErState {
  return { meters: { grove: 50, folk: 50, wardens: 50, coffers: 50 }, season: 0, flags: [], used: [], cardId: null, ending: null, won: false, dead: false };
}

export function eligible(s: ErState): Card[] {
  return DECK.filter((c) => {
    if (c.once && s.used.includes(c.id)) return false;
    if (c.needs && !s.flags.includes(c.needs)) return false;
    if (c.needsNot && s.flags.includes(c.needsNot)) return false;
    return true;
  });
}

export function drawCard(s: ErState, rng: Rng): void {
  const pool = eligible(s);
  // Arc cards (needs-flag) jump the queue — stories resolve promptly.
  const urgent = pool.filter((c) => c.needs);
  const pick = (urgent.length ? urgent : pool)[rng.int(urgent.length ? urgent.length : pool.length)];
  s.cardId = pick.id;
}

export const DOOMS: Record<string, string> = {
  'grove-0': 'The grove withers — and the land with it.',
  'grove-100': 'The trees take the throne; you kneel among roots.',
  'folk-0': 'The folk march on the keep with torches.',
  'folk-100': 'Beloved beyond reason, you are carried off to be a god.',
  'wardens-0': 'With no blades left, the Salt King walks in.',
  'wardens-100': 'The wardens decide they need no ruler at all.',
  'coffers-0': 'An empty vault; the keep is sold from under you.',
  'coffers-100': 'Gold beyond counting — and every knife in the realm turns your way.',
};

export interface ErEvents {
  chose: 'left' | 'right' | null;
  ended: boolean;
  won: boolean;
}

export function choose(s: ErState, side: 'left' | 'right', rng: Rng): ErEvents {
  const ev: ErEvents = { chose: null, ended: false, won: false };
  if (s.won || s.dead || !s.cardId) return ev;
  const card = DECK.find((c) => c.id === s.cardId)!;
  const fx = card[side].fx;
  for (const m of METERS) s.meters[m] = Math.max(0, Math.min(100, s.meters[m] + (fx[m] ?? 0)));
  for (const f of fx.set ?? []) if (!s.flags.includes(f)) s.flags.push(f);
  for (const f of fx.clear ?? []) s.flags = s.flags.filter((g) => g !== f);
  if (card.once) s.used.push(card.id);
  s.season++;
  ev.chose = side;
  // Doom check.
  for (const m of METERS) {
    if (s.meters[m] <= 0) {
      s.dead = true;
      s.ending = `${m}-0`;
      ev.ended = true;
      return ev;
    }
    if (s.meters[m] >= 100) {
      s.dead = true;
      s.ending = `${m}-100`;
      ev.ended = true;
      return ev;
    }
  }
  // Victory: survive the years.
  if (s.season >= YEARS_TO_WIN * SEASONS_PER_YEAR) {
    s.won = true;
    s.ending = 'victory';
    ev.won = true;
    ev.ended = true;
    return ev;
  }
  drawCard(s, rng);
  return ev;
}
