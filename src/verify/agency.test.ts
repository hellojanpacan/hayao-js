import { describe, expect, it } from 'vitest';
import type { Puzzle } from './solver';
import { assertSolvable } from './solver';
import { agencyIssues, agencyStats, assertAgency } from './agency';

// ── Fixtures ──────────────────────────────────────────────────────────────────

// CORRIDOR: a line 0..N with four legal moves at every step, but only 'R' keeps you
// alive — 'L'/'U'/'D' are dead. Provably winnable, zero agency: it LOOKS branchy (4
// legal moves) and is a single forced path. The gate must see through legal→viable.
type Dir4 = 'R' | 'L' | 'U' | 'D';
function corridor(n = 5): Puzzle<{ pos: number }, Dir4> {
  return {
    initial: () => ({ pos: 0 }),
    moves: () => ['R', 'L', 'U', 'D'],
    apply: (s, m) => ({ pos: m === 'R' ? s.pos + 1 : s.pos - 100 }), // anything but R plunges into death territory
    isWin: (s) => s.pos === n,
    isDead: (s) => s.pos < 0,
    key: (s) => `${s.pos}`,
  };
}

// OPEN GRID: reach (N,N) from (0,0) moving only right/up, offered only where legal
// (no self-loops). Many shortest paths (C(2N,N)), genuine 2-way choices in the
// interior — a rich, agentful decision space.
interface Cell {
  x: number;
  y: number;
}
function openGrid(n = 3): Puzzle<Cell, 'R' | 'U'> {
  return {
    initial: () => ({ x: 0, y: 0 }),
    moves: (s) => [...(s.x < n ? (['R'] as const) : []), ...(s.y < n ? (['U'] as const) : [])],
    apply: (s, m) => (m === 'R' ? { x: s.x + 1, y: s.y } : { x: s.x, y: s.y + 1 }),
    isWin: (s) => s.x === n && s.y === n,
    key: (s) => `${s.x},${s.y}`,
  };
}

describe('agencyStats — reachability of the decision space', () => {
  it('a corridor: four legal moves, one viable — forced everywhere, a single line', () => {
    const s = agencyStats(corridor(5));
    expect(s.solutionDepth).toBe(5);
    expect(s.legalFirstMoves).toBe(4);
    expect(s.viableFirstMoves).toBe(1); // viable ≠ legal — the point of the gate
    expect(s.forcedFraction).toBe(1);
    expect(s.viableLineCount).toBe(1);
    expect(s.meanViableBranching).toBe(1);
  });

  it('an open grid: real forks, many distinct optimal lines', () => {
    const s = agencyStats(openGrid(3));
    expect(s.solutionDepth).toBe(6);
    expect(s.viableLineCount).toBe(20); // C(6,3) shortest monotone paths
    expect(s.forcedFraction).toBeLessThan(0.6);
    expect(s.meanViableBranching).toBeGreaterThan(1.5);
    expect(s.openChoiceStates).toBeGreaterThan(0);
  });
});

describe('agencyIssues / assertAgency', () => {
  it('flags the corridor on every axis and throws', () => {
    const issues = agencyIssues(corridor(5));
    const joined = issues.join(' ');
    expect(joined).toMatch(/corridor/i);
    expect(joined).toMatch(/single-solution|distinct optimal/i);
    expect(() => assertAgency(corridor(5))).toThrow(/impoverished agency/i);
  });

  it('passes the open grid clean', () => {
    // Sanity: it really is winnable, and it really has agency.
    expect(assertSolvable(openGrid(3)).solvable).toBe(true);
    expect(agencyIssues(openGrid(3))).toEqual([]);
    expect(() => assertAgency(openGrid(3))).not.toThrow();
  });

  it('reports "no winning line" when the level is unwinnable within caps', () => {
    const unwinnable: Puzzle<{ pos: number }, 'R'> = {
      initial: () => ({ pos: 0 }),
      moves: () => ['R'],
      apply: (s) => ({ pos: s.pos }), // never advances
      isWin: (s) => s.pos === 5,
      key: (s) => `${s.pos}`,
    };
    expect(agencyIssues(unwinnable).join(' ')).toMatch(/no winning line/i);
  });

  it('is deterministic — identical stats across runs', () => {
    expect(agencyStats(openGrid(3))).toEqual(agencyStats(openGrid(3)));
  });
});

describe('dominant-line detection (opt-in via value)', () => {
  // Same open grid; two value functions. Balanced value ranks R and U equally at
  // every fork (no obvious move). Lopsided value makes R beat U by a mile at every
  // fork — one dominant line, choices are fake.
  const grid = openGrid(3);

  it('a balanced value leaves choices genuinely open', () => {
    const s = agencyStats(grid, { value: (c) => c.x + c.y, dominanceMargin: 10 });
    expect(s.dominanceFraction).toBe(0); // R and U tie → nothing obvious
    expect(agencyIssues(grid, { value: (c) => c.x + c.y, dominanceMargin: 10 })).toEqual([]);
  });

  it('a lopsided value exposes a dominant line', () => {
    const value = (c: Cell): number => c.x * 100 + c.y; // R (+100) crushes U (+1)
    const s = agencyStats(grid, { value, dominanceMargin: 10 });
    expect(s.dominanceFraction).toBe(1); // every open choice has one obvious best
    expect(agencyIssues(grid, { value, dominanceMargin: 10 }).join(' ')).toMatch(/dominant line/i);
    expect(() => assertAgency(grid, { value, dominanceMargin: 10 })).toThrow(/dominant line/i);
  });

  it('dominanceFraction is undefined when no value function is supplied', () => {
    expect(agencyStats(grid).dominanceFraction).toBeUndefined();
  });
});

describe('thresholds are honored', () => {
  it('a stricter viable-line floor can fail a level a looser one passes', () => {
    const s = agencyStats(openGrid(2)); // C(4,2) = 6 lines
    expect(s.viableLineCount).toBe(6);
    expect(agencyIssues(openGrid(2), { minViableLines: 6 })).toEqual([]);
    expect(agencyIssues(openGrid(2), { minViableLines: 7 }).join(' ')).toMatch(/single-solution|distinct optimal/i);
  });
});
