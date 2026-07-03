// Thornspire deckbuilder sim — pure module. A data-driven card DSL, energy
// turns, fully telegraphed enemy intents, card drafts between fights, and an
// eight-encounter climb to the Spire Heart. The genre's truths — that drafting
// matters and the climb is winnable-but-tense — are win-rate assertions.

import type { Rng } from '@hayao';

// ── Card DSL ──
export interface Card {
  id: string;
  name: string;
  cost: number;
  dmg?: number;
  hits?: number;
  block?: number;
  draw?: number;
  /** Turns of vulnerable (+50% damage taken) applied to the foe. */
  vuln?: number;
}

export const CARDS: Record<string, Card> = {
  strike: { id: 'strike', name: 'Strike', cost: 1, dmg: 6 },
  defend: { id: 'defend', name: 'Defend', cost: 1, block: 5 },
  bash: { id: 'bash', name: 'Bash', cost: 2, dmg: 8, vuln: 2 },
  pommel: { id: 'pommel', name: 'Pommel Blow', cost: 1, dmg: 4, draw: 1 },
  ironwave: { id: 'ironwave', name: 'Iron Wave', cost: 1, dmg: 5, block: 5 },
  whirl: { id: 'whirl', name: 'Whirl', cost: 2, dmg: 5, hits: 2 },
  brace: { id: 'brace', name: 'Brace', cost: 2, block: 11 },
  lunge: { id: 'lunge', name: 'Lunge', cost: 2, dmg: 12 },
};
export const DRAFT_POOL = ['bash', 'pommel', 'ironwave', 'whirl', 'brace', 'lunge'];
export const STARTER_DECK = ['strike', 'strike', 'strike', 'strike', 'strike', 'defend', 'defend', 'defend', 'defend', 'bash'];

// ── Foes with telegraphed intents ──
export type IntentKind = 'attack' | 'block' | 'charge';
export interface Intent {
  kind: IntentKind;
  value: number;
}

export interface FoeDef {
  id: string;
  name: string;
  hp: number;
  /** Deterministic intent script, looped (charge doubles the next attack). */
  script: Intent[];
}

export const FOES: Record<string, FoeDef> = {
  slime: { id: 'slime', name: 'Gutter Slime', hp: 28, script: [{ kind: 'attack', value: 7 }, { kind: 'attack', value: 7 }, { kind: 'block', value: 6 }] },
  thorn: { id: 'thorn', name: 'Thorn Beast', hp: 38, script: [{ kind: 'attack', value: 9 }, { kind: 'block', value: 8 }, { kind: 'attack', value: 11 }] },
  elite: { id: 'elite', name: 'Bramble Knight', hp: 58, script: [{ kind: 'charge', value: 0 }, { kind: 'attack', value: 14 }, { kind: 'block', value: 10 }, { kind: 'attack', value: 11 }] },
  boss: { id: 'boss', name: 'The Spire Heart', hp: 90, script: [{ kind: 'attack', value: 10 }, { kind: 'charge', value: 0 }, { kind: 'attack', value: 15 }, { kind: 'block', value: 12 }] },
};

/** The climb: fights, a rest, an elite, a draft-or-rest choice, the boss. */
export type NodeKind = 'fight' | 'elite' | 'rest' | 'boss';
export const CLIMB: { kind: NodeKind; foe?: string }[] = [
  { kind: 'fight', foe: 'slime' },
  { kind: 'fight', foe: 'thorn' },
  { kind: 'rest' },
  { kind: 'fight', foe: 'thorn' },
  { kind: 'elite', foe: 'elite' },
  { kind: 'rest' },
  { kind: 'fight', foe: 'thorn' },
  { kind: 'boss', foe: 'boss' },
];

export const P_TUNE = { hp: 58, energy: 3, draw: 5, restHeal: 18 };

export interface TsState {
  node: number; // index into CLIMB
  hp: number;
  maxHp: number;
  deck: string[]; // card ids (the run's deck)
  // Combat state (null between fights).
  fight: null | {
    foe: string;
    foeHp: number;
    foeBlock: number;
    foeVuln: number;
    charged: boolean;
    scriptIdx: number;
    turn: number;
    energy: number;
    drawPile: string[];
    hand: string[];
    discard: string[];
    block: number;
  };
  /** Pending draft (card ids) after a won fight, or null. */
  draft: string[] | null;
  won: boolean;
  dead: boolean;
  fightsWon: number;
  [key: string]: unknown;
}

const shuffle = (arr: string[], rng: Rng): string[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export function initialTs(): TsState {
  return { node: -1, hp: P_TUNE.hp, maxHp: P_TUNE.hp, deck: [...STARTER_DECK], fight: null, draft: null, won: false, dead: false, fightsWon: 0 };
}

function drawCards(f: NonNullable<TsState['fight']>, n: number, rng: Rng): void {
  for (let i = 0; i < n; i++) {
    if (f.drawPile.length === 0) {
      if (f.discard.length === 0) return;
      f.drawPile = shuffle(f.discard, rng);
      f.discard = [];
    }
    f.hand.push(f.drawPile.pop()!);
  }
}

function startFight(s: TsState, rng: Rng): void {
  const def = FOES[CLIMB[s.node].foe!];
  s.fight = { foe: def.id, foeHp: def.hp, foeBlock: 0, foeVuln: 0, charged: false, scriptIdx: 0, turn: 1, energy: P_TUNE.energy, drawPile: shuffle(s.deck, rng), hand: [], discard: [], block: 0 };
  drawCards(s.fight, P_TUNE.draw, rng);
}

/** Advance to the next climb node (auto-resolves rests). */
function advance(s: TsState, rng: Rng): void {
  s.node++;
  if (s.node >= CLIMB.length) {
    s.won = true;
    return;
  }
  const node = CLIMB[s.node];
  if (node.kind === 'rest') {
    s.hp = Math.min(s.maxHp, s.hp + P_TUNE.restHeal);
    advance(s, rng);
    return;
  }
  startFight(s, rng);
}

export const currentIntent = (s: TsState): Intent | null => {
  if (!s.fight) return null;
  const def = FOES[s.fight.foe];
  return def.script[s.fight.scriptIdx % def.script.length];
};

export interface TsInput {
  /** Play the card at this hand index (-1 = none). */
  play: number;
  endTurn: boolean;
  /** Pick from a pending draft (0-2 takes a card, 3 skips; -1 = none). */
  pick: number;
  /** Begin the climb / next fight from the idle state. */
  proceed: boolean;
}

export interface TsEvents {
  played: string | null;
  foeHurt: boolean;
  playerHurt: boolean;
  fightWon: boolean;
  drafted: string | null;
  won: boolean;
  died: boolean;
}

export function stepTs(s: TsState, input: TsInput, rng: Rng): TsEvents {
  const ev: TsEvents = { played: null, foeHurt: false, playerHurt: false, fightWon: false, drafted: null, won: false, died: false };
  if (s.won || s.dead) return ev;

  // ── Draft screen ──
  if (s.draft) {
    if (input.pick >= 0 && input.pick <= 3) {
      if (input.pick < 3 && s.draft[input.pick]) {
        s.deck.push(s.draft[input.pick]);
        ev.drafted = s.draft[input.pick];
      }
      s.draft = null;
      advance(s, rng);
      if (s.won) ev.won = true;
    }
    return ev;
  }

  // ── Between nodes ──
  if (!s.fight) {
    if (input.proceed) {
      advance(s, rng);
      if (s.won) ev.won = true;
    }
    return ev;
  }

  const f = s.fight;
  const foeDef = FOES[f.foe];

  // ── Play a card ──
  if (input.play >= 0 && input.play < f.hand.length) {
    const card = CARDS[f.hand[input.play]];
    if (card.cost <= f.energy) {
      f.energy -= card.cost;
      f.hand.splice(input.play, 1);
      f.discard.push(card.id);
      ev.played = card.id;
      const hits = card.hits ?? (card.dmg ? 1 : 0);
      for (let h = 0; h < hits; h++) {
        let dmg = card.dmg!;
        if (f.foeVuln > 0) dmg = Math.floor(dmg * 1.5);
        const absorbed = Math.min(f.foeBlock, dmg);
        f.foeBlock -= absorbed;
        f.foeHp -= dmg - absorbed;
        ev.foeHurt = true;
      }
      if (card.block) f.block += card.block;
      if (card.vuln) f.foeVuln = Math.max(f.foeVuln, card.vuln);
      if (card.draw) drawCards(f, card.draw, rng);
      // Victory?
      if (f.foeHp <= 0) {
        s.fightsWon++;
        ev.fightWon = true;
        s.fight = null;
        // Draft after every won fight except the boss.
        const offer = shuffle([...DRAFT_POOL], rng).slice(0, 3);
        s.draft = offer;
        return ev;
      }
    }
    return ev;
  }

  // ── End turn: the telegraphed intent RESOLVES exactly as shown ──
  if (input.endTurn) {
    const intent = foeDef.script[f.scriptIdx % foeDef.script.length];
    if (intent.kind === 'attack') {
      let dmg = intent.value * (f.charged ? 2 : 1);
      f.charged = false;
      const absorbed = Math.min(s.fight.block, dmg);
      dmg -= absorbed;
      if (dmg > 0) {
        s.hp -= dmg;
        ev.playerHurt = true;
      }
    } else if (intent.kind === 'block') {
      f.foeBlock += intent.value;
    } else {
      f.charged = true;
    }
    f.scriptIdx++;
    f.foeVuln = Math.max(0, f.foeVuln - 1);
    if (s.hp <= 0) {
      s.dead = true;
      ev.died = true;
      return ev;
    }
    // New player turn.
    f.turn++;
    f.energy = P_TUNE.energy;
    f.block = 0;
    f.discard.push(...f.hand);
    f.hand = [];
    drawCards(f, P_TUNE.draw, rng);
  }
  return ev;
}
