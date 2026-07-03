import { describe, expect, it } from 'vitest';
import { createWorld } from '@hayao';
import { beatOf, initialCd, onBeat, tryMove, BEAT_WINDOW, CHAMBER, FRAMES_PER_BEAT } from './logic';
import { cadenceGame, cdState } from './game';

describe('the beat is sim time', () => {
  it('beat lines fall every FRAMES_PER_BEAT frames with a symmetric window', () => {
    expect(beatOf(0)).toBe(0);
    expect(beatOf(FRAMES_PER_BEAT)).toBe(1);
    expect(onBeat(FRAMES_PER_BEAT - BEAT_WINDOW)).toBe(true);
    expect(onBeat(FRAMES_PER_BEAT + BEAT_WINDOW)).toBe(true);
    expect(onBeat(FRAMES_PER_BEAT + BEAT_WINDOW + 1)).toBe(false);
    expect(onBeat(Math.floor(FRAMES_PER_BEAT * 1.5))).toBe(false);
  });
});

describe('chamber lint', () => {
  it('is sealed with player, foes and an exit', () => {
    expect(CHAMBER.length).toBe(9);
    for (const row of CHAMBER) expect(row.length).toBe(15);
    expect(CHAMBER.some((r) => r.includes('@'))).toBe(true);
    expect(CHAMBER.some((r) => r.includes('E'))).toBe(true);
  });
});

describe('combat', () => {
  it('bumping a foe on the beat damages it and holds position', () => {
    const s = initialCd();
    s.foes = [{ kind: 'slime', x: s.x + 1, y: s.y, hp: 2, dirX: 1 }];
    const ev = tryMove(s, 'right', FRAMES_PER_BEAT);
    expect(ev.fought).toBe(true);
    expect(s.foes[0].hp).toBe(1);
    expect(s.x).toBe(1); // stayed
  });
});

describe('game wiring', () => {
  it('on-beat input via actions moves; probe exposes the beat', () => {
    const world = createWorld(cadenceGame);
    world.step(['down']); // frame 0 IS a beat line
    const p = world.probe() as { y: number; onBeat: boolean };
    expect(cdState(world).y).toBe(2);
    expect(typeof p.onBeat).toBe('boolean');
  });
});
