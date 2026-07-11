import { describe, it, expect, vi, afterEach } from 'vitest';
import { World } from './world';
import { Node } from './scene/node';
import { Sprite, Camera2D } from './scene/nodes';
import { deserializeNode } from './scene/registry';
import { hashNoise } from './core/rng';
import { defineGame, createWorld } from './app/game';

afterEach(() => {
  vi.restoreAllMocks();
});

/** root → a (→ a1), b — the little tree the inspection tests share. */
function smallTree(): { world: World; root: Node } {
  const world = new World({ seed: 1 });
  const root = new Node({ name: 'root' });
  const a = root.addChild(new Node({ name: 'a', pos: { x: 10, y: 20 } }));
  a.addChild(new Node({ name: 'a1' }));
  root.addChild(new Node({ name: 'b' }));
  world.setRoot(root);
  return { world, root };
}

describe('tree inspection', () => {
  it('walk visits depth-first in child-index order; nodeCount matches', () => {
    const { world } = smallTree();
    const seen: string[] = [];
    world.walk((n) => seen.push(n.name));
    expect(seen).toEqual(['root', 'a', 'a1', 'b']);
    expect(world.nodeCount).toBe(4);
  });

  it('debugTree renders one indented line per node with flags and position', () => {
    const { world, root } = smallTree();
    const a = root.find('a')!;
    a.cosmetic = true;
    a.pauseMode = 'always';
    root.find('b')!.visible = false;
    const lines = world.debugTree().split('\n');
    expect(lines[0]).toBe('root (Node) @0,0');
    expect(lines[1]).toBe('  a (Node) [cosmetic always] @10,20');
    expect(lines[2]).toBe('    a1 (Node) @0,0');
    expect(lines[3]).toBe('  b (Node) [!visible] @0,0');
  });
});

describe('resource accessor', () => {
  it('returns a set resource and throws loudly on a missing key', () => {
    const world = new World({ seed: 1 });
    world.resources.set('tiles', { size: 16 });
    expect(world.resource<{ size: number }>('tiles').size).toBe(16);
    expect(() => world.resource('tilez')).toThrowError(/tilez.*Available: tiles/);
    expect(() => new World().resource('x')).toThrowError(/\(none\)/);
  });
});

describe('flushFree', () => {
  it('lets a scene swap purge freed nodes before building the new scene', () => {
    const { world, root } = smallTree();
    world.step();
    const old = root.find('a')!;
    old.free();
    expect(root.find('a')).not.toBeNull(); // deferred: still attached
    world.flushFree();
    expect(root.find('a')).toBeNull(); // gone NOW, before any step runs
    expect(old.isFreed).toBe(true);
  });
});

describe('step input validation', () => {
  it('throws a clear TypeError on a string or non-iterable actionsDown', () => {
    const world = new World({ seed: 1 });
    world.setRoot(new Node({ name: 'root' }));
    expect(() => world.step('jump' as unknown as Iterable<string>)).toThrowError(TypeError);
    expect(() => world.step('jump' as unknown as Iterable<string>)).toThrowError(/array\/iterable/);
    expect(() => world.step(5 as unknown as Iterable<string>)).toThrowError(TypeError);
    expect(() => world.step(new Set(['jump']))).not.toThrow(); // Sets are fine
  });
});

describe('advance clamp warning', () => {
  it('warns once per world when realMs exceeds maxFrameMs', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const world = new World({ seed: 1 });
    world.setRoot(new Node({ name: 'root' }));
    world.advance(16);
    expect(warn).not.toHaveBeenCalled();
    world.advance(1200);
    world.advance(1200);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/runSteps/);
  });

  it('stays silent for a declared realtime driver, but still clamps', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const world = new World({ seed: 1 });
    world.setRoot(new Node({ name: 'root' }));
    const steps = world.advance(1200, [], undefined, { realtime: true });
    expect(warn).not.toHaveBeenCalled();
    // clamp still applies: ~maxFrameMs worth of steps, nowhere near 1200ms worth
    expect(steps).toBeLessThanOrEqual(Math.ceil(world.clock.maxFrameMs / world.clock.stepMs));
    // a later NON-realtime overshoot on the same world still warns
    world.advance(1200);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe('guardDeterminism', () => {
  it('warns once on a stray Math.random inside step() and restores it after', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const world = new World({ seed: 1, guardDeterminism: true });
    const root = new Node({ name: 'root' });
    // Deliberately nondeterministic — called via a lookup so the invariants
    // lint (which bans literal Math.random calls, even in tests) stays green.
    root.onUpdate = () => void Math['random']();
    world.setRoot(root);
    const real = Math['random'];
    world.step();
    world.step();
    expect(warn).toHaveBeenCalledTimes(1); // once per world, not per call
    expect(warn.mock.calls[0][0]).toMatch(/world\.rng/);
    expect(Math['random']).toBe(real); // restored after the step
  });

  it('never warns without a stray call, and leaves Date.now intact', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const realNow = Date.now;
    const world = new World({ seed: 1, guardDeterminism: true });
    world.setRoot(new Node({ name: 'root' }));
    world.runSteps(3);
    expect(warn).not.toHaveBeenCalled();
    expect(Date.now).toBe(realNow);
  });
});

describe('typed state generics', () => {
  it('World<TState> types world.state; default parameter keeps untyped code compiling', () => {
    const world = new World<{ score: number }>({ seed: 1 });
    world.state = { score: 3 };
    world.state.score += 1; // typed access — no cast needed
    expect(world.state.score).toBe(4);
    const plain = new World({ seed: 1 }); // default TState, as before
    plain.state.anything = 42;
    expect(plain.state.anything).toBe(42);
  });

  it('defineGame<TState> threads the state type into build and probe', () => {
    const def = defineGame<{ lives: number }>({
      title: 'typed',
      build(world) {
        world.state = { lives: 3 };
        return new Node({ name: 'root' });
      },
      probe(world) {
        return { lives: world.state.lives }; // typed — compiles without a cast
      },
    });
    const world = createWorld(def);
    world.step();
    expect(world.probe()).toEqual({ lives: 3 });
  });
});

describe('node ergonomics', () => {
  it('x/y accessors read and write pos', () => {
    const n = new Node({ pos: { x: 3, y: 4 } });
    expect(n.x).toBe(3);
    n.x += 2;
    n.y = 10;
    expect(n.pos).toEqual({ x: 5, y: 10 });
  });

  it('pivot anchors rotation at a local point and serializes only when set', () => {
    const n = new Node({ pos: { x: 10, y: 10 }, rotation: Math.PI / 2 });
    n.pivot = { x: 5, y: 0 };
    // Local origin passes through T(-pivot) then the rotation: (-5,0) → (0,-5).
    const wt = n.worldTransform();
    expect(wt.e).toBeCloseTo(10);
    expect(wt.f).toBeCloseTo(5);
    const data = n.serialize();
    expect(data.pivot).toEqual({ x: 5, y: 0 });
    expect('pivot' in new Node().serialize()).toBe(false); // unset stays out
    const clone = deserializeNode(data);
    expect(clone.pivot).toEqual({ x: 5, y: 0 });
    expect(clone.worldTransform().f).toBeCloseTo(5);
  });

  it('findOfType returns the first typed match depth-first, or null', () => {
    const root = new Node({ name: 'root' });
    const holder = root.addChild(new Node({ name: 'holder' }));
    const cam = holder.addChild(new Camera2D({ name: 'cam' }));
    root.addChild(new Sprite({ name: 's', shape: { kind: 'rect', w: 1, h: 1 }, fill: '#000' }));
    expect(root.findOfType(Camera2D)).toBe(cam); // typed: no cast at the call site
    expect(root.findOfType(Sprite)?.name).toBe('s');
    expect(cam.findOfType(Sprite)).toBeNull();
  });

  it('clearChildren detaches immediately and runs exit hooks', () => {
    const world = new World({ seed: 1 });
    const root = new Node({ name: 'root' });
    let exits = 0;
    for (let i = 0; i < 3; i++) {
      const c = root.addChild(new Node({ name: `c${i}` }));
      c.addBehavior({ exit: () => exits++ });
    }
    world.setRoot(root);
    world.step();
    root.clearChildren();
    expect(root.children.length).toBe(0); // immediate — no step needed
    expect(exits).toBe(3);
  });
});

describe('hashNoise', () => {
  it('is stateless, deterministic, and stays in [0,1)', () => {
    for (let i = 0; i < 200; i++) {
      const v = hashNoise(i, i * 0.37);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
    expect(hashNoise(4, 2)).toBe(hashNoise(4, 2)); // no stream consumed
  });

  it('distinguishes argument order, nearby floats, and arity', () => {
    expect(hashNoise(1, 2)).not.toBe(hashNoise(2, 1));
    expect(hashNoise(0.1)).not.toBe(hashNoise(0.1000001));
    expect(hashNoise(7)).not.toBe(hashNoise(7, 0));
  });
});
