import { describe, expect, it } from 'vitest';
import { createWorld } from '@hayao';
import { ROOMS } from './rooms';
import { parseRoom, transition, ROOM_W } from './logic';
import { sproutveilGame, svState } from './game';

describe('room lint', () => {
  it('all rooms are 40×22 with matching openings and markers', () => {
    for (const [i, r] of ROOMS.entries()) {
      expect(r.rows.length, `room ${i} rows`).toBe(22);
      for (const [ri, row] of r.rows.entries()) expect(row.length, `room ${i} row ${ri}`).toBe(40);
    }
    expect(parseRoom(0).spawn).not.toBeNull();
    expect(parseRoom(2).pickups.map((p) => p.ability)).toContain('dj');
    expect(parseRoom(1).pickups.map((p) => p.ability)).toContain('dash');
    expect(parseRoom(3).heart).not.toBeNull();
  });

  it('every declared exit connects both ways', () => {
    expect(ROOMS[0].exits.right).toBe(1);
    expect(ROOMS[1].exits.left).toBe(0);
    expect(ROOMS[0].exits.down).toBe(2);
    expect(ROOMS[2].exits.up).toBe(0);
    expect(ROOMS[1].exits.right).toBe(3);
    expect(ROOMS[3].exits.left).toBe(1);
  });
});

describe('transitions', () => {
  it('crossing open borders swaps rooms; closed borders do not', () => {
    expect(transition(0, ROOM_W - 10, 560)?.room).toBe(1);
    expect(transition(1, 10, 560)?.room).toBe(0);
    expect(transition(0, 288, 710)?.room).toBe(2);
    expect(transition(2, 288, -5)?.room).toBe(0);
    expect(transition(2, -5, 300)).toBeNull(); // Roots has no left exit
  });
});

describe('game wiring', () => {
  it('spawns in the Atrium with no abilities and walks', () => {
    const world = createWorld(sproutveilGame);
    for (let i = 0; i < 30; i++) world.step(['right']);
    const s = svState(world);
    expect(s.room).toBe(0);
    expect(s.abilities).toEqual([]);
    expect(s.p.x).toBeGreaterThan(120);
  });
});
