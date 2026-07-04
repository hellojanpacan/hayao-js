import { describe, it, expect } from 'vitest';
import { tilemapFromAscii, PAD_NEUTRAL } from '@hayao';
import { spawnBoss, stepBoss, resolveBossHit, BOSS_TUNE, GUARDIAN_OF } from './boss';
import { attackHitbox, ATTACK_TIME, type Orb } from './combat';
import { initialState, stepKintsugi, spawnBossFor } from './logic';

const flat = tilemapFromAscii(['#'.repeat(30), ...Array(10).fill('#' + ' '.repeat(28) + '#'), '#'.repeat(30)], 32);

describe('Kintsugi bosses', () => {
  it('each biome has a guardian with real HP', () => {
    expect(Object.keys(GUARDIAN_OF)).toHaveLength(4);
    for (const id of Object.values(GUARDIAN_OF)) expect(BOSS_TUNE[id].hp).toBeGreaterThan(8);
  });

  it('the blade wears a guardian down and kills it', () => {
    const b = spawnBoss('drowned_bell', 200, 200);
    const box = attackHitbox(b.x - 20, b.y, 20, 30, 1, ATTACK_TIME - 0.15)!;
    let hits = 0;
    for (let i = 0; i < 100 && !b.dead; i++) hits += resolveBossHit(box, b.x - 10, b);
    expect(b.dead).toBe(true);
    expect(hits).toBe(BOSS_TUNE.drowned_bell.hp);
  });

  it('escalates phases and fires volleys as it weakens', () => {
    const b = spawnBoss('drowned_bell', 300, 200);
    const orbs: Orb[] = [];
    for (let i = 0; i < 200; i++) stepBoss(b, orbs, 200, 220, 20, 30, 1 / 60, flat);
    expect(b.phase).toBe(0);
    expect(orbs.length).toBeGreaterThan(0); // it attacked (a ring toll)
    b.hp = 3; // drop it low → phase 2
    for (let i = 0; i < 60; i++) stepBoss(b, orbs, 200, 220, 20, 30, 1 / 60, flat);
    expect(b.phase).toBe(2);
  });

  it('a living guardian seals the arena; slaying it unseals + persists', () => {
    const s = initialState();
    s.region = 'cistern_bell';
    s.boss = spawnBossFor('cistern_bell', []);
    expect(s.boss).toBeTruthy();
    // stand at the right seam and try to leave — blocked while the Bell lives
    s.p.x = 40 * 32 - 22;
    s.p.y = 17 * 32;
    stepKintsugi(s, { ...PAD_NEUTRAL, moveX: 1 }, 1 / 60, false);
    expect(s.region).toBe('cistern_bell'); // sealed

    // slay it (from mid-room, so the slay step itself doesn't transition)
    s.p.x = 20 * 32;
    s.boss!.hp = 0;
    s.boss!.dead = true;
    stepKintsugi(s, PAD_NEUTRAL, 1 / 60, false);
    expect(s.boss).toBeNull();
    expect(s.bossesDefeated).toContain('drowned_bell');
    expect(s.region).toBe('cistern_bell');

    // now the seam opens
    s.p.x = 40 * 32 - 22;
    s.p.y = 17 * 32;
    stepKintsugi(s, { ...PAD_NEUTRAL, moveX: 1 }, 1 / 60, false);
    expect(s.region).toBe('cistern_shrine');
  });

  it('a slain guardian does not respawn on re-entry', () => {
    const s = initialState();
    s.bossesDefeated = ['drowned_bell'];
    expect(spawnBossFor('cistern_bell', s.bossesDefeated)).toBeNull();
  });
});
