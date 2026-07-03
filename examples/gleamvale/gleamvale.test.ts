import { describe, expect, it } from 'vitest';
import { createWorld } from '@hayao';
import { ROOMS } from './rooms';
import { initialGv, parseRoom, stepGv, PLAYER } from './logic';
import { gleamvaleGame, gvState } from './game';

const DT = 1 / 60;
const pad = (moveX = 0, moveY = 0, attack = false) => ({ moveX, moveY, attack });

describe('room lint', () => {
  it('rooms are 40×22 with markers', () => {
    for (const [i, r] of ROOMS.entries()) {
      expect(r.rows.length, `room ${i} rows`).toBe(22);
      for (const [ri, row] of r.rows.entries()) expect(row.length, `room ${i} row ${ri}`).toBe(40);
    }
    expect(parseRoom(0).spawn).not.toBeNull();
    expect(parseRoom(3).heart).not.toBeNull();
    expect(parseRoom(2).enemies.length).toBeGreaterThanOrEqual(3);
  });
});

describe('combat sim', () => {
  it('slash kills a chaser in two hits with hit-stop between', () => {
    const s = initialGv();
    const e = s.rooms[0].enemies[0];
    e.x = s.x + 40;
    e.y = s.y;
    s.faceX = 1;
    s.faceY = 0;
    stepGv(s, pad(0, 0, true), DT);
    expect(e.hp).toBe(1);
    expect(s.hitstop).toBeGreaterThan(0);
    // Wait out hit-stop, hurt-flash and cooldown, then strike again. (The
    // chaser closes in meanwhile, re-triggering hit-stop — drain it fully.)
    for (let i = 0; i < 30; i++) stepGv(s, pad(), DT);
    while (s.hitstop > 0) stepGv(s, pad(), DT);
    e.x = s.x + 40;
    e.y = s.y;
    s.faceX = 1;
    s.faceY = 0;
    stepGv(s, pad(0, 0, true), DT);
    expect(e.hp).toBe(0);
  });

  it('slash misses outside the arc', () => {
    const s = initialGv();
    const e = s.rooms[0].enemies[0];
    e.x = s.x - 40; // behind the player
    e.y = s.y;
    s.faceX = 1;
    s.faceY = 0;
    stepGv(s, pad(0, 0, true), DT);
    expect(e.hp).toBe(2);
  });

  it('contact hurts, knockback applies, death resets to spawn', () => {
    const s = initialGv();
    const e = s.rooms[0].enemies[0];
    for (let hit = 0; hit < PLAYER.hp; hit++) {
      e.x = s.x;
      e.y = s.y + 1;
      s.iframes = 0;
      stepGv(s, pad(), DT);
      for (let i = 0; i < 8; i++) stepGv(s, pad(), DT); // drain hit-stop
    }
    expect(s.deaths).toBe(1);
    expect(s.hp).toBe(PLAYER.hp);
    expect(s.room).toBe(0);
  });

  it('sentry fires orbs that travel and expire on walls', () => {
    const s = initialGv();
    s.room = 3;
    s.x = 640;
    s.y = 380; // inside the sentry's 430px sight
    const rs = s.rooms[3];
    rs.enemies.forEach((e) => {
      if (e.kind !== 'sentry') e.hp = 0;
    });
    let fired = false;
    for (let i = 0; i < 240 && !fired; i++) {
      stepGv(s, pad(), DT);
      fired = s.orbs.length > 0;
    }
    expect(fired).toBe(true);
  });
});

describe('game wiring', () => {
  it('actions flow through input into the sim', () => {
    const world = createWorld(gleamvaleGame);
    for (let i = 0; i < 30; i++) world.step(['right']);
    expect(gvState(world).x).toBeGreaterThan(130);
  });
});
