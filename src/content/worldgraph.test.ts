import { describe, it, expect } from 'vitest';
import {
  abilitiesOf,
  findSoftlocks,
  progressionPuzzle,
  proveCompletable,
  proveFullCompletion,
  reachableRegions,
  validateWorld,
  type WorldGraphDef,
} from './worldgraph';

// A small but real metroidvania shape: open start → dash gate → double-jump gate.
const linear: WorldGraphDef = {
  regions: [{ id: 'r0' }, { id: 'r1' }, { id: 'r2' }, { id: 'r3' }],
  edges: [
    { from: 'r0', to: 'r1' },
    { from: 'r1', to: 'r2', requires: ['dash'] },
    { from: 'r2', to: 'r3', requires: ['dj'] },
  ],
  pickups: [
    { id: 'p_dash', region: 'r1', grants: 'dash' },
    { id: 'p_dj', region: 'r2', grants: 'dj' },
  ],
  start: 'r0',
  goal: 'r3',
};

describe('progression solving', () => {
  it('proves a gated world completable and 100%-completable', () => {
    const c = proveCompletable(linear);
    expect(c.solvable).toBe(true);
    const f = proveFullCompletion(linear);
    expect(f.solvable).toBe(true);
    // Full completion is never shorter than minimal completion.
    expect((f.depth ?? 0)).toBeGreaterThanOrEqual(c.depth ?? 0);
  });

  it('the solution collects each ability before its gate', () => {
    const path = proveCompletable(linear).path!;
    const order = path.map((m) => (m.kind === 'take' ? `take:${m.pickup}` : `move:${m.to}`));
    // must take dash before entering r2, and dj before entering r3
    expect(order.indexOf('take:p_dash')).toBeLessThan(order.indexOf('move:r2'));
    expect(order.indexOf('take:p_dj')).toBeLessThan(order.indexOf('move:r3'));
  });

  it('catches CIRCULAR gating (an ability locked behind itself) as unsolvable', () => {
    const circular: WorldGraphDef = {
      regions: [{ id: 'a' }, { id: 'b' }],
      edges: [{ from: 'a', to: 'b', requires: ['dash'] }],
      pickups: [{ id: 'p', region: 'b', grants: 'dash' }], // dash is behind a dash gate
      start: 'a',
      goal: 'b',
    };
    expect(proveCompletable(circular).solvable).toBe(false);
  });
});

describe('softlock analysis', () => {
  it('a fully bidirectional completable world is softlock-free', () => {
    expect(findSoftlocks(linear).ok).toBe(true);
  });

  it('detects a ONE-WAY drop that can strand the player', () => {
    // Drop from r0 into r1; r1→r2 needs dj; dj is back in r0. Drop without dj = stuck.
    const trap: WorldGraphDef = {
      regions: [{ id: 'r0' }, { id: 'r1' }, { id: 'r2' }],
      edges: [
        { from: 'r0', to: 'r1', oneWay: true },
        { from: 'r1', to: 'r2', requires: ['dj'] },
      ],
      pickups: [{ id: 'p_dj', region: 'r0', grants: 'dj' }],
      start: 'r0',
      goal: 'r2',
    };
    // It's still *completable* (grab dj first, then drop).
    expect(proveCompletable(trap).solvable).toBe(true);
    // ...but a dead-end state exists (in r1 with nothing taken).
    const report = findSoftlocks(trap);
    expect(report.ok).toBe(false);
    expect(report.deadEnds).toContain('r1|');
  });
});

describe('reachability + hygiene', () => {
  it('reachableRegions respects the ability gates', () => {
    expect(reachableRegions(linear, []).sort()).toEqual(['r0', 'r1']);
    expect(reachableRegions(linear, ['dash']).sort()).toEqual(['r0', 'r1', 'r2']);
    expect(reachableRegions(linear, ['dash', 'dj']).sort()).toEqual(['r0', 'r1', 'r2', 'r3']);
  });

  it('abilitiesOf maps taken pickups to abilities', () => {
    expect([...abilitiesOf(linear, ['p_dash'])]).toEqual(['dash']);
    expect([...abilitiesOf(linear, ['p_dash', 'p_dj'])].sort()).toEqual(['dash', 'dj']);
  });

  it('validateWorld flags dangling references and isolation', () => {
    expect(validateWorld(linear)).toEqual([]);
    const broken: WorldGraphDef = {
      regions: [{ id: 'a' }],
      edges: [{ from: 'a', to: 'ghost' }],
      pickups: [{ id: 'p', region: 'nowhere', grants: 'x' }],
      start: 'a',
      goal: 'missing',
    };
    const issues = validateWorld(broken);
    expect(issues.some((i) => i.includes('ghost'))).toBe(true);
    expect(issues.some((i) => i.includes('missing'))).toBe(true);
    expect(issues.some((i) => i.includes('nowhere'))).toBe(true);
  });

  it('progressionPuzzle is deterministic (stable move order)', () => {
    const p = progressionPuzzle(linear);
    const s = p.initial();
    expect(p.moves(s)).toEqual(p.moves(s));
  });
});
