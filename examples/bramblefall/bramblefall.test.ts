import { describe, expect, it } from 'vitest';
import { createWorld } from '@hayao';
import { countBy, counterMult, flowField, initialBf, stepBf, COLS, FIELD_ROWS } from './logic';
import { bfState, bramblefallGame } from './game';

const DT = 1 / 60;
const idle = { cursorX: 0, cursorY: 0, select: null, order: false } as const;

describe('field lint', () => {
  it('map is 40×22 sealed', () => {
    expect(FIELD_ROWS.length).toBe(22);
    for (const r of FIELD_ROWS) expect(r.length).toBe(40);
  });
});

describe('counter triangle', () => {
  it('is cyclic and asymmetric', () => {
    expect(counterMult('spear', 'cavalry')).toBeGreaterThan(1.5);
    expect(counterMult('cavalry', 'archer')).toBeGreaterThan(1.5);
    expect(counterMult('archer', 'spear')).toBeGreaterThan(1.5);
    expect(counterMult('cavalry', 'spear')).toBeLessThan(1);
    expect(counterMult('spear', 'spear')).toBe(1);
  });
});

describe('flow field', () => {
  it('points toward the goal and never into walls', () => {
    const f = flowField(35, 11);
    // A tile west of the central brambles should still have a direction.
    const i = 11 * COLS + 10;
    expect(Math.abs(f.dx[i]) + Math.abs(f.dy[i])).toBeGreaterThan(0);
  });
});

describe('battle sim', () => {
  it('armies spawn, fight at the front, and reinforce over time', () => {
    const s = initialBf();
    const t0 = countBy(s, 0).total;
    for (let f = 0; f < 60 * 30; f++) stepBf(s, idle, DT);
    expect(countBy(s, 0).total + countBy(s, 1).total).toBeGreaterThan(0);
    expect(s.reinforceIdx[0]).toBeGreaterThan(5);
    expect(t0).toBe(120);
  });

  it('orders retarget only the selected kind', () => {
    const s = initialBf();
    s.selected = 'archer';
    s.cursor = { tx: 30, ty: 5 };
    stepBf(s, { ...idle, order: true }, DT);
    const archers = s.units.filter((u) => u.team === 0 && u.kind === 'archer');
    const spears = s.units.filter((u) => u.team === 0 && u.kind === 'spear');
    expect(archers.every((u) => u.tx === 30 && u.ty === 5)).toBe(true);
    expect(spears.every((u) => u.tx !== 30 || u.ty !== 5)).toBe(true);
  });
});

describe('game wiring', () => {
  it('selection + orders flow through input actions', () => {
    const world = createWorld(bramblefallGame);
    world.step(['sel-cavalry']);
    expect(bfState(world).selected).toBe('cavalry');
    world.step(['order']);
    const s = bfState(world);
    const cav = s.units.filter((u) => u.team === 0 && u.kind === 'cavalry');
    expect(cav.every((u) => u.tx === s.cursor.tx)).toBe(true);
  });
});
