import { describe, it, expect } from 'vitest';
import { proveCompletable, proveFullCompletion, findSoftlocks, validateWorld, reachableRegions } from '@hayao';
import { KINTSUGI_WORLD, ABIL, ABILITY_ORDER, BIOMES, SHARD_COUNT } from './world';

describe('Kintsugi world graph — the provable contract', () => {
  it('is structurally sound (no dangling ids, no isolation)', () => {
    expect(validateWorld(KINTSUGI_WORLD)).toEqual([]);
  });

  it('is completable — a valid ability order reaches the heart-kiln', () => {
    const r = proveCompletable(KINTSUGI_WORLD);
    expect(r.solvable).toBe(true);
    expect(r.exhausted).toBe(false);
  });

  it('is 100%-completable — every ability AND every ember shard is obtainable', () => {
    const r = proveFullCompletion(KINTSUGI_WORLD);
    expect(r.solvable).toBe(true);
    expect(r.exhausted).toBe(false);
  });

  it('is softlock-free even with its one-way drops', () => {
    const full = findSoftlocks(KINTSUGI_WORLD, 'full');
    expect(full.ok).toBe(true);
    // the enumeration actually explored a non-trivial state space
    expect(full.statesExplored).toBeGreaterThan(30);
  });

  it('gates progression — the kiln is NOT reachable with no abilities', () => {
    const reach = reachableRegions(KINTSUGI_WORLD, []);
    expect(reach).not.toContain('heart_kiln');
    expect(reach).toContain('grove_shrine'); // ...but the first shrine (Goldstep) is
  });

  it('each ability meaningfully expands the reachable world', () => {
    const order = ['', ABIL.step, ABIL.rush, ABIL.mend, ABIL.wing, ABIL.burst];
    let prev = -1;
    for (let i = 1; i < order.length; i++) {
      const abilities = order.slice(1, i + 1);
      const count = reachableRegions(KINTSUGI_WORLD, abilities).length;
      expect(count).toBeGreaterThan(prev);
      prev = count;
    }
    // with the full kit, the whole world is open
    expect(reachableRegions(KINTSUGI_WORLD, ABILITY_ORDER).length).toBe(KINTSUGI_WORLD.regions.length);
  });

  it('matches the designed shape (5 biomes, 5 abilities, shards)', () => {
    expect(BIOMES).toHaveLength(5);
    expect(ABILITY_ORDER).toHaveLength(5);
    expect(SHARD_COUNT).toBeGreaterThanOrEqual(4);
    // every region belongs to a known biome
    const biomeIds = new Set(BIOMES.map((b) => b.id));
    for (const r of KINTSUGI_WORLD.regions) expect(biomeIds.has(r.biome!)).toBe(true);
  });
});
