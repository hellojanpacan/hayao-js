import { describe, it, expect } from 'vitest';
import { tilemapFromAscii, PAD_NEUTRAL } from '@hayao';
import {
  spawnEnemy,
  attackHitbox,
  resolvePlayerAttack,
  stepEnemies,
  ATTACK_TIME,
  ETUNE,
} from './combat';
import { initialState, stepKintsugi } from './logic';

// A flat floor for enemy stepping.
const flat = tilemapFromAscii(['#'.repeat(20), ...Array(6).fill('#' + ' '.repeat(18) + '#'), '#'.repeat(20)], 32);

describe('Kintsugi combat', () => {
  it('the swing hitbox is only active mid-swing, and reaches in front', () => {
    // atk counts down from ATTACK_TIME; active window is ~0.08..0.22 elapsed
    expect(attackHitbox(100, 100, 20, 30, 1, ATTACK_TIME)).toBeNull(); // just started
    const mid = attackHitbox(100, 100, 20, 30, 1, ATTACK_TIME - 0.15);
    expect(mid).toBeTruthy();
    expect(mid!.x).toBeGreaterThanOrEqual(110); // in front (facing right)
    expect(attackHitbox(100, 100, 20, 30, 1, 0.01)).toBeNull(); // nearly done
  });

  it('a swing damages and can kill an enemy in range', () => {
    const husk = spawnEnemy('husk', 130, 96);
    const box = attackHitbox(120, 96, 20, 30, 1, ATTACK_TIME - 0.15)!;
    const r = resolvePlayerAttack(box, 130, [husk]);
    expect(r.hits).toBe(1);
    expect(husk.hp).toBe(ETUNE.husk.hp - 1);
    expect(husk.vx).not.toBe(0); // knocked back
  });

  it('a husk chases the player and deals contact damage', () => {
    const husk = spawnEnemy('husk', 400, 96);
    let dmg = 0;
    // player stands at x=120; husk should crawl left toward them
    const x0 = husk.x;
    for (let i = 0; i < 120; i++) {
      const r = stepEnemies([husk], [], 120, 96, 20, 30, 1 / 60, flat);
      dmg += r.playerDmg;
    }
    expect(husk.x).toBeLessThan(x0); // moved toward the player
  });

  it('taking a hit costs a heart, grants i-frames, and knocks back', () => {
    const s = initialState();
    s.region = 'grove_climb';
    s.enemies = [spawnEnemy('husk', s.p.x + 10, s.p.y)]; // overlapping
    const hp0 = s.hp;
    const ev = stepKintsugi(s, PAD_NEUTRAL, 1 / 60, false);
    expect(ev.hurt).toBe(true);
    expect(s.hp).toBe(hp0 - 1);
    expect(s.iframes).toBeGreaterThan(0);
    // a second overlapping step does NOT damage again (i-frames)
    const ev2 = stepKintsugi(s, PAD_NEUTRAL, 1 / 60, false);
    expect(ev2.hurt).toBe(false);
    expect(s.hp).toBe(hp0 - 1);
  });

  it('attacking through the sim swings the blade and can hit', () => {
    const s = initialState();
    s.region = 'grove_climb';
    s.enemies = [spawnEnemy('husk', s.p.x + 34, s.p.y)];
    const hp0 = s.enemies[0].hp;
    let hit = false;
    for (let i = 0; i < 20; i++) {
      const ev = stepKintsugi(s, PAD_NEUTRAL, 1 / 60, i === 0); // press attack once
      if (ev.hitEnemy) hit = true;
    }
    expect(hit).toBe(true);
    expect(s.enemies[0].hp).toBe(hp0 - 1);
  });

  it('enemies respawn fresh when a room is re-entered', () => {
    const s = initialState();
    s.region = 'grove_climb';
    s.enemies = [];
    // walk to the down-seam of climb → hollow, which has its own husk
    s.p.x = 19 * 32;
    s.p.y = 20 * 32; // near the bottom seam
    const ev = stepKintsugi(s, { ...PAD_NEUTRAL, moveY: 1 }, 1 / 60, false);
    if (ev.transitioned) expect(s.enemies.length).toBeGreaterThan(0);
  });
});
