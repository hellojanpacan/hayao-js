import { describe, expect, it } from 'vitest';
import { Rng } from '../core/rng';
import { Fsm, PhaseClock, type Transition } from './fsm';
import { LootTable, weightedIndex, weightedPick, pickEntry } from './random';
import {
  bfs,
  reconstructPath,
  astar,
  astarGrid,
  floodFill,
  connectedComponents,
  passableFromTilemap,
  NEIGHBORS_4,
  type Cell,
  type WeightedNeighbours,
} from './graph';
import { tilemapFromAscii } from '../physics/tilemap';

// ── FSM ─────────────────────────────────────────────────────────

describe('Fsm', () => {
  interface Guard {
    hp: number;
    saw: string[];
  }
  const states = {
    idle: { onEnter: (c: Guard) => c.saw.push('enter:idle'), onUpdate: (c: Guard) => c.saw.push('upd:idle') },
    chase: { onEnter: (c: Guard) => c.saw.push('enter:chase'), onUpdate: (c: Guard) => c.saw.push('upd:chase') },
    dead: { onEnter: (c: Guard) => c.saw.push('enter:dead') },
  } as const;

  it('fires onEnter on construction and onUpdate each tick', () => {
    const ctx: Guard = { hp: 3, saw: [] };
    const fsm = new Fsm(states, [], 'idle', ctx);
    expect(ctx.saw).toEqual(['enter:idle']);
    fsm.update(1 / 60);
    expect(ctx.saw).toEqual(['enter:idle', 'upd:idle']);
    expect(fsm.current).toBe('idle');
  });

  it('takes the FIRST satisfied transition in table order', () => {
    const ctx: Guard = { hp: 0, saw: [] };
    const transitions: Transition<'idle' | 'chase' | 'dead', Guard>[] = [
      { from: '*', to: 'dead', when: (c) => c.hp <= 0 },
      { from: 'idle', to: 'chase', when: () => true },
    ];
    const fsm = new Fsm(states, transitions, 'idle', ctx);
    fsm.update(1 / 60);
    // hp<=0 edge is listed first → dead wins over the always-true chase edge.
    expect(fsm.current).toBe('dead');
    expect(ctx.saw).toEqual(['enter:idle', 'enter:dead']);
  });

  it('go() runs onLeave then onEnter; is() and serialization round-trip', () => {
    const ctx: Guard = { hp: 3, saw: [] };
    const withLeave = {
      idle: { ...states.idle, onLeave: (c: Guard) => c.saw.push('leave:idle') },
      chase: states.chase,
      dead: states.dead,
    };
    const fsm = new Fsm<'idle' | 'chase' | 'dead', Guard>(withLeave, [], 'idle', ctx);
    fsm.go('chase');
    expect(ctx.saw).toEqual(['enter:idle', 'leave:idle', 'enter:chase']);
    expect(fsm.is('chase')).toBe(true);
    expect(fsm.is('idle', 'dead')).toBe(false);
    expect(fsm.getState()).toBe('chase');
    fsm.setState('idle');
    expect(fsm.current).toBe('idle');
    fsm.go('idle'); // no-op, already there
    expect(ctx.saw).toEqual(['enter:idle', 'leave:idle', 'enter:chase']);
  });
});

describe('PhaseClock', () => {
  const defs = {
    windup: { duration: 0.2, next: 'strike' },
    strike: { duration: 0.1, next: 'recover' },
    recover: { duration: 0.3 }, // terminal
  };

  it('reports eased progress and auto-advances via next', () => {
    const pc = new PhaseClock(defs, 'windup');
    expect(pc.progress()).toBe(0);
    expect(pc.update(0.1)).toBe(false);
    expect(pc.phase).toBe('windup');
    expect(pc.progress()).toBeCloseTo(0.5);
    // Cross the 0.2s boundary: rolls into strike, carrying overshoot.
    expect(pc.update(0.15)).toBe(true);
    expect(pc.phase).toBe('strike');
    expect(pc.elapsed).toBeCloseTo(0.05);
  });

  it('respects a custom easing and clamps progress to [0,1]', () => {
    const pc = new PhaseClock(defs, 'recover');
    pc.update(0.15);
    const square = (t: number) => t * t;
    expect(pc.progress(square)).toBeCloseTo(0.25);
    pc.update(10); // terminal phase, no next → stays put, progress clamps
    expect(pc.phase).toBe('recover');
    expect(pc.progress()).toBe(1);
  });

  it('steps across multiple short phases in one big dt', () => {
    const pc = new PhaseClock(defs, 'windup');
    expect(pc.update(0.35)).toBe(true); // past windup(0.2)+strike(0.1)
    expect(pc.phase).toBe('recover');
  });

  it('to() jumps and resets; state round-trips', () => {
    const pc = new PhaseClock(defs, 'windup');
    pc.update(0.1);
    pc.to('strike');
    expect(pc.phase).toBe('strike');
    expect(pc.elapsed).toBe(0);
    const snap = pc.getState();
    const pc2 = new PhaseClock(defs, 'windup');
    pc2.setState(snap);
    expect(pc2.getState()).toEqual(snap);
  });
});

// ── weighted random ─────────────────────────────────────────────

describe('weighted random', () => {
  it('weightedIndex honours the distribution and draws once per pick', () => {
    const rng = new Rng(7);
    const weights = [1, 0, 3]; // index 1 must never come up
    const counts = [0, 0, 0];
    for (let i = 0; i < 4000; i++) counts[weightedIndex(rng, weights)]++;
    expect(counts[1]).toBe(0);
    // ~3:1 ratio between index 2 and index 0.
    expect(counts[2] / counts[0]).toBeGreaterThan(2.4);
    expect(counts[2] / counts[0]).toBeLessThan(3.6);
  });

  it('is deterministic: same seed → same sequence', () => {
    const items = ['a', 'b', 'c'];
    const w = [2, 5, 1];
    const draw = () => {
      const rng = new Rng(99);
      return Array.from({ length: 20 }, () => weightedPick(rng, items, w));
    };
    expect(draw()).toEqual(draw());
  });

  it('pickEntry and LootTable agree with weightedIndex on the same stream', () => {
    const entries = [
      { value: 'common', weight: 6 },
      { value: 'rare', weight: 1 },
    ];
    const a = new Rng(3);
    const b = new Rng(3);
    const viaEntry = Array.from({ length: 10 }, () => pickEntry(a, entries));
    const table = new LootTable(entries);
    const viaTable = Array.from({ length: 10 }, () => table.roll(b));
    expect(viaTable).toEqual(viaEntry);
    expect(table.total).toBe(7);
  });

  it('rollMany returns n draws; rejects empty / all-zero tables', () => {
    const rng = new Rng(1);
    const table = new LootTable([{ value: 1, weight: 1 }]);
    expect(table.rollMany(rng, 5)).toHaveLength(5);
    expect(() => new LootTable([])).toThrow();
    expect(() => new LootTable([{ value: 1, weight: 0 }])).toThrow();
    expect(() => weightedIndex(rng, [0, 0])).toThrow();
  });
});

// ── graph search ────────────────────────────────────────────────

describe('graph search — generic', () => {
  // A tiny DAG-ish graph: 0→1,2 ; 1→3 ; 2→3 ; 3→4
  const adj: Record<number, number[]> = { 0: [1, 2], 1: [3], 2: [3], 3: [4], 4: [] };
  const nb = (n: number) => adj[n];
  const key = (n: number) => String(n);

  it('bfs visits in breadth-first order and records distances', () => {
    const r = bfs(0, nb, key);
    expect(r.order).toEqual([0, 1, 2, 3, 4]);
    expect(r.dist.get('4')).toBe(3);
    const path = reconstructPath(r.cameFrom, key, 0, 4);
    // 0→1→3→4 (index 1 reached before 2, and it's the first to open 3).
    expect(path).toEqual([0, 1, 3, 4]);
  });

  it('bfs goal short-circuits and reconstructPath returns [] when disconnected', () => {
    const r = bfs(0, nb, key, { goal: (n) => n === 3 });
    expect(r.order[r.order.length - 1]).toBe(3);
    expect(reconstructPath(r.cameFrom, key, 0, 99)).toEqual([]);
  });

  it('astar finds the least-cost path over weighted edges', () => {
    // Two routes 0→3: cheap 0-1-3 (1+1) vs direct 0-3 (5).
    const wadj: Record<number, { node: number; cost: number }[]> = {
      0: [
        { node: 1, cost: 1 },
        { node: 3, cost: 5 },
      ],
      1: [{ node: 3, cost: 1 }],
      3: [],
    };
    const wn: WeightedNeighbours<number> = (n) => wadj[n];
    const res = astar(0, (n) => n === 3, wn, key);
    expect(res).not.toBeNull();
    expect(res!.path).toEqual([0, 1, 3]);
    expect(res!.cost).toBe(2);
  });
});

describe('graph search — grid', () => {
  //  #####
  //  #...#
  //  #.#.#
  //  #...#
  //  #####
  const map = tilemapFromAscii(['#####', '#...#', '#.#.#', '#...#', '#####']);
  const passable = passableFromTilemap(map);

  it('astarGrid routes around a solid tile', () => {
    const path = astarGrid({ x: 1, y: 1 }, { x: 3, y: 3 }, passable, { cols: map.cols, rows: map.rows });
    expect(path).not.toBeNull();
    // Manhattan distance is 4 → path length 5 (inclusive of both ends).
    expect(path!.length).toBe(5);
    expect(path![0]).toEqual({ x: 1, y: 1 });
    expect(path![path!.length - 1]).toEqual({ x: 3, y: 3 });
    // never steps on the wall at (2,2)
    expect(path!.some((c) => c.x === 2 && c.y === 2)).toBe(false);
  });

  it('astarGrid returns null when the goal is walled off', () => {
    const walled = tilemapFromAscii(['###', '#.#', '###']);
    const p = astarGrid({ x: 1, y: 1 }, { x: 2, y: 0 }, passableFromTilemap(walled), { cols: 3, rows: 3 });
    expect(p).toBeNull();
  });

  it('diagonal search is shorter than orthogonal and is deterministic', () => {
    const open = tilemapFromAscii(['.....', '.....', '.....', '.....', '.....']);
    const pass = passableFromTilemap(open);
    const ortho = astarGrid({ x: 0, y: 0 }, { x: 4, y: 4 }, pass, { cols: 5, rows: 5 });
    const diag = astarGrid({ x: 0, y: 0 }, { x: 4, y: 4 }, pass, { cols: 5, rows: 5, diagonal: true });
    expect(ortho!.length).toBe(9); // 8 orthogonal steps
    expect(diag!.length).toBe(5); // 4 diagonal steps
    const again = astarGrid({ x: 0, y: 0 }, { x: 4, y: 4 }, pass, { cols: 5, rows: 5, diagonal: true });
    expect(again).toEqual(diag);
  });

  it('floodFill grabs one region; connectedComponents labels all of them', () => {
    // Two rooms split by a solid column.
    const rooms = tilemapFromAscii(['.....', '..#..', '..#..', '..#..', '.....']);
    const pass = passableFromTilemap(rooms);
    // The top and bottom rows connect the two sides, so a fill from (0,0)
    // reaches everything — confirm it grabs all passable cells.
    const region = floodFill({ x: 0, y: 0 }, pass, { cols: 5, rows: 5 });
    const passableCount = rooms.tiles.filter((t) => t === 0).length;
    expect(region.length).toBe(passableCount);

    // A grid with two genuinely separate pockets.
    const split = tilemapFromAscii(['#.#', '#.#', '###', '#.#']);
    const cc = connectedComponents(3, 4, passableFromTilemap(split));
    expect(cc.cells.length).toBe(2);
    // Row-major scan → the top pocket is component 0.
    expect(cc.cells[0]).toEqual([
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ]);
    expect(cc.cells[1]).toEqual([{ x: 1, y: 3 }]);
    expect(cc.labels[0]).toBe(-1); // (0,0) is solid
  });

  it('NEIGHBORS_4 is the expected fixed order', () => {
    expect(NEIGHBORS_4).toEqual([
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
    ] as Cell[]);
  });
});
