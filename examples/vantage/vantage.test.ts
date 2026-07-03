import { describe, expect, it } from 'vitest';
import { createWorld } from '@hayao';
import { canMoveTo, initialVt, occupant, push, stepVt } from './logic';
import { vantageGame, vtState } from './game';

describe('grid & movement', () => {
  it('movement range is BFS-limited and blocked by occupants', () => {
    const s = initialVt();
    const bruiser = s.mechs[0]; // move 3 at (2,4)
    expect(canMoveTo(s, bruiser, 2, 1)).toBe(true); // 3 tiles up
    expect(canMoveTo(s, bruiser, 2, 0)).toBe(false); // 4 tiles
    expect(canMoveTo(s, bruiser, 4, 5)).toBe(false); // artillery stands there
  });
});

describe('push mechanics', () => {
  it('open push displaces one tile', () => {
    const s = initialVt();
    s.bugs = [{ x: 3, y: 3, hp: 3, dir: null }];
    push(s, 3, 3, 0, 1);
    expect(s.bugs[0].y).toBe(4);
    expect(s.bugs[0].hp).toBe(3);
  });

  it('attacks damage then push (bruiser melee)', () => {
    const s = initialVt();
    s.bugs = [{ x: 3, y: 4, hp: 3, dir: null }]; // adjacent to bruiser (2,4)
    stepVt(s, { kind: 'select', mech: 0 });
    stepVt(s, { kind: 'cursor', x: 3, y: 4 });
    const ev = stepVt(s, { kind: 'attack' });
    expect(ev.attacked).toBe(true);
    expect(s.bugs[0].hp).toBe(1); // 2 dmg
    expect(s.bugs[0].x).toBe(4); // pushed east
  });

  it('artillery lobs across the field and pushes on impact', () => {
    const s = initialVt();
    s.bugs = [{ x: 4, y: 2, hp: 3, dir: null }]; // same column as artillery (4,5)
    stepVt(s, { kind: 'select', mech: 1 });
    stepVt(s, { kind: 'cursor', x: 4, y: 2 });
    const ev = stepVt(s, { kind: 'attack' });
    expect(ev.attacked).toBe(true);
    expect(s.bugs[0].hp).toBe(2); // 1 dmg
    expect(s.bugs[0].y).toBe(1); // pushed away from the shot origin
  });
});

describe('turn resolution', () => {
  it('telegraphs resolve at the bug-relative tile and clear afterwards', () => {
    const s = initialVt();
    s.bugs = [{ x: 4, y: 1, hp: 3, dir: { x: 0, y: -1 } }];
    stepVt(s, { kind: 'endTurn' });
    // Bug dmg 2 kills the 2hp greenhouse — it's culled from the list.
    expect(s.buildings.find((g) => g.x === 4 && g.y === 0)).toBeUndefined();
  });

  it('mechs refresh moved/acted flags each turn', () => {
    const s = initialVt();
    stepVt(s, { kind: 'select', mech: 0 });
    stepVt(s, { kind: 'cursor', x: 2, y: 3 });
    stepVt(s, { kind: 'move' });
    expect(s.mechs[0].moved).toBe(true);
    stepVt(s, { kind: 'endTurn' });
    expect(s.mechs[0].moved).toBe(false);
  });
});

describe('game wiring', () => {
  it('select + cursor + move flow through input actions', () => {
    const world = createWorld(vantageGame);
    world.step(['sel-2']);
    expect(vtState(world).selected).toBe(2);
    world.step([]);
    world.step(['up']);
    world.step([]);
    world.step(['move']);
    expect(vtState(world).mechs[2].y).toBe(3);
    void occupant;
  });
});
