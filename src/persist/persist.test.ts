import { describe, expect, it } from 'vitest';
import { World } from '../world';
import { Sprite } from '../scene/nodes';
import { LocalStorageAdapter, MemoryStorage, NullStorage, defaultStorage } from './storage';
import { packVarints, rleDecode, rleEncode, unpackVarints } from './codec';
import { SaveManager, parseSnapshot, serializeSnapshot } from './save';

// ── storage adapters ────────────────────────────────────────────
describe('storage adapters', () => {
  it('MemoryStorage round-trips and lists keys', () => {
    const s = new MemoryStorage();
    expect(s.get('a')).toBeNull();
    s.set('a', '1');
    s.set('b', '2');
    expect(s.get('a')).toBe('1');
    expect(s.keys()).toEqual(['a', 'b']);
    s.remove('a');
    expect(s.get('a')).toBeNull();
    expect(s.keys()).toEqual(['b']);
  });

  it('NullStorage swallows everything', () => {
    const s = new NullStorage();
    s.set('a', '1');
    expect(s.get('a')).toBeNull();
    expect(s.keys()).toEqual([]);
  });

  it('defaultStorage returns a working adapter headless (falls back to memory)', () => {
    // Headless/CI has no functional localStorage, so the default is in-memory —
    // saves work in tests without touching disk or leaking global state.
    const s = defaultStorage();
    expect(s).toBeInstanceOf(MemoryStorage);
    s.set('x', '1');
    expect(s.get('x')).toBe('1'); // round-trips
  });

  it('LocalStorageAdapter never throws when localStorage is absent/broken', () => {
    const s = new LocalStorageAdapter();
    s.set('x', '1'); // guarded — no throw even if setItem is missing
    expect(s.get('x')).toBeNull();
    expect(s.keys()).toEqual([]);
    s.remove('x'); // no throw
  });
});

// ── compact codecs ──────────────────────────────────────────────
describe('RLE codec', () => {
  const cases = [
    '',
    'a',
    'abc',
    '#####',
    '#....#\n#....#',
    'aaaa~bbbb',
    '~~~~',
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab', // 38 a's then b — count via base36
  ];
  it('round-trips arbitrary strings', () => {
    for (const s of cases) expect(rleDecode(rleEncode(s))).toBe(s);
  });
  it('actually compacts a repetitive grid', () => {
    const grid = '#'.repeat(64);
    expect(rleEncode(grid).length).toBeLessThan(grid.length);
  });
  it('throws on a malformed stream', () => {
    expect(() => rleDecode('~a')).toThrow();
  });
});

describe('varint codec', () => {
  it('round-trips non-negative integer lists', () => {
    const lists = [[], [0], [1, 2, 3], [0, 31, 32, 33, 1023, 1024, 65535, 1_000_000]];
    for (const nums of lists) expect(unpackVarints(packVarints(nums))).toEqual(nums);
  });
  it('produces a URL/JSON-safe string', () => {
    expect(packVarints([1_000_000, 42, 0])).toMatch(/^[A-Za-z0-9_-]+$/);
  });
  it('rejects negative or non-integer inputs', () => {
    expect(() => packVarints([-1])).toThrow();
    expect(() => packVarints([1.5])).toThrow();
  });
  it('rejects invalid or truncated streams', () => {
    expect(() => unpackVarints('!')).toThrow();
    expect(() => unpackVarints('_')).toThrow(); // continuation bit set, no terminator
  });
});

// ── save manager over WorldSnapshot ─────────────────────────────
function makeWorld(seed = 3): World {
  const world = new World({ seed });
  world.state = { score: 0, level: 2, bag: ['sword'] };
  const s = new Sprite({ shape: { kind: 'rect', w: 4, h: 4 } });
  s.pos = { x: 10, y: 20 };
  world.root.addChild(s);
  // Advance a few steps so rng/clock state is non-trivial.
  for (let i = 0; i < 5; i++) {
    world.rng.int(100);
    world.step([]);
  }
  return world;
}

describe('SaveManager', () => {
  it('save → load reproduces hash() and probe() exactly', () => {
    const world = makeWorld();
    (world.state as { score: number }).score = 999;
    const before = world.hash();
    const probeBefore = world.probe();

    const store = new MemoryStorage();
    const saves = new SaveManager(world, store);
    saves.save('slot1');

    // Mutate the live world; the save must be unaffected.
    (world.state as { score: number }).score = -1;
    world.step([]);
    expect(world.hash()).not.toBe(before);

    expect(saves.load('slot1')).toBe(true);
    expect(world.hash()).toBe(before);
    expect(world.probe()).toEqual(probeBefore);
  });

  it('reports slots, has(), and delete()', () => {
    const world = makeWorld();
    const saves = new SaveManager(world, new MemoryStorage());
    expect(saves.has('a')).toBe(false);
    saves.save('a');
    saves.save('b');
    expect(saves.has('a')).toBe(true);
    expect(saves.slots().sort()).toEqual(['a', 'b']);
    saves.delete('a');
    expect(saves.has('a')).toBe(false);
    expect(saves.slots()).toEqual(['b']);
  });

  it('load of a missing or corrupt slot is a clean miss, world untouched', () => {
    const world = makeWorld();
    const before = world.hash();
    const store = new MemoryStorage();
    const saves = new SaveManager(world, store);

    expect(saves.load('nope')).toBe(false);
    expect(world.hash()).toBe(before);

    store.set('bad', '{not json');
    expect(saves.load('bad')).toBe(false);
    store.set('wrongver', JSON.stringify({ v: 999, snap: {} }));
    expect(saves.load('wrongver')).toBe(false);
    expect(world.hash()).toBe(before);
  });

  it('serializeSnapshot/parseSnapshot round-trip and guard bad input', () => {
    const world = makeWorld();
    const text = serializeSnapshot(world.snapshot());
    const snap = parseSnapshot(text);
    expect(snap).not.toBeNull();
    expect(parseSnapshot(null)).toBeNull();
    expect(parseSnapshot('garbage')).toBeNull();
    expect(parseSnapshot(JSON.stringify({ v: 1, snap: { seed: 'x' } }))).toBeNull();
  });
});
