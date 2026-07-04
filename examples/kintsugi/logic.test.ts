import { describe, it, expect } from 'vitest';
import { PAD_NEUTRAL } from '@hayao';
import { initialState, stepKintsugi, pickupsIn, mapFor, ABIL } from './logic';
import { configFor } from './abilities';
import { KINTSUGI_WORLD } from './world';
import { RW, TS } from './rooms';

describe('Kintsugi sim — core mechanics', () => {
  it('starts in the gate room, no seams mended', () => {
    const s = initialState();
    expect(s.region).toBe('grove_gate');
    expect(s.abilities).toEqual([]);
    expect(s.hp).toBe(s.maxHp);
    expect(s.save.region).toBe('grove_gate');
    // geometry loads
    expect(mapFor('grove_gate').cols).toBe(RW);
  });

  it('collecting the Shrine of the First Step grants Goldstep', () => {
    const s = initialState();
    s.region = 'grove_shrine';
    const pk = pickupsIn('grove_shrine', s.taken).find((p) => p.id === 'step')!;
    expect(pk).toBeTruthy();
    s.p.x = pk.x;
    s.p.y = pk.y;
    const ev = stepKintsugi(s, PAD_NEUTRAL, 1 / 60);
    expect(ev.picked).toBe('step');
    expect(s.taken).toContain('step');
    expect(s.abilities).toContain(ABIL.step);
  });

  it('Goldstep turns on the double jump in the movement config', () => {
    expect(configFor([]).airJumps).toBe(0);
    expect(configFor([ABIL.step]).airJumps).toBe(1);
    expect(configFor([ABIL.rush]).dashCharges).toBe(1);
    expect(configFor([ABIL.mend]).wallJumpVelY).toBeGreaterThan(0);
    expect(configFor([ABIL.wing]).maxFall).toBeLessThan(configFor([]).maxFall);
  });

  it('walking through a border seam moves to the graph neighbour', () => {
    const s = initialState();
    // stand at the right seam of the gate room, at floor height
    s.p.x = RW * TS - 22;
    s.p.y = 18 * TS;
    const ev = stepKintsugi(s, { ...PAD_NEUTRAL, moveX: 1 }, 1 / 60);
    expect(ev.transitioned).toBe(true);
    expect(s.region).toBe('grove_hollow');
    // and the neighbour really is a graph edge
    expect(KINTSUGI_WORLD.edges.some((e) => e.from === 'grove_gate' && e.to === 'grove_hollow')).toBe(true);
  });

  it('dying returns the Mender to the last save shrine at full hp', () => {
    const s = initialState();
    s.region = 'grove_climb';
    s.hp = 1;
    s.p.dead = true;
    const ev = stepKintsugi(s, PAD_NEUTRAL, 1 / 60);
    expect(ev.died).toBe(true);
    expect(s.region).toBe(s.save.region);
    expect(s.hp).toBe(s.maxHp);
    expect(s.deaths).toBe(1);
  });

  it('is deterministic — same state + input yields the same next state', () => {
    const a = initialState();
    const b = initialState();
    const pad = { ...PAD_NEUTRAL, moveX: 1, jumpPressed: true, jumpHeld: true };
    for (let i = 0; i < 30; i++) {
      stepKintsugi(a, pad, 1 / 60);
      stepKintsugi(b, pad, 1 / 60);
    }
    expect(a.p).toEqual(b.p);
    expect(a.region).toBe(b.region);
  });
});
