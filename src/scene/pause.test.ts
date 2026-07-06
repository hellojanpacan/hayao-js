import { describe, it, expect } from 'vitest';
import { Node } from './node';
import { deserializeNode } from './registry';
import { World } from '../world';

/** A counting node: records how many updates it saw and the last dt it got. */
function counter(name: string, pauseMode?: Node['pauseMode']): Node & { ticks: number; lastDt: number } {
  const n = new Node({ name }) as Node & { ticks: number; lastDt: number };
  n.ticks = 0;
  n.lastDt = 0;
  if (pauseMode) n.pauseMode = pauseMode;
  n.onUpdate = (self, dt) => {
    (self as typeof n).ticks++;
    (self as typeof n).lastDt = dt;
  };
  return n;
}

describe('pause', () => {
  it('paused world skips pausable nodes but keeps rendering', () => {
    const world = new World({ seed: 1 });
    const root = new Node({ name: 'root' });
    const a = counter('a');
    root.addChild(a);
    world.setRoot(root);
    world.step();
    expect(a.ticks).toBe(1);
    world.paused = true;
    world.step();
    world.step();
    expect(a.ticks).toBe(1); // frozen
    expect(world.frame).toBe(3); // clock still ticks
    expect(() => world.render()).not.toThrow(); // rendering unaffected
  });

  it("an 'always' node updates through a pause and unpauses its subtree", () => {
    const world = new World({ seed: 1 });
    const root = new Node({ name: 'root' });
    const menu = counter('menu', 'always');
    const menuChild = counter('menuChild'); // inherit → effective 'always'
    menu.addChild(menuChild);
    const gameplay = counter('gameplay');
    root.addChild(menu);
    root.addChild(gameplay);
    world.setRoot(root);
    world.paused = true;
    world.step();
    expect(menu.ticks).toBe(1);
    expect(menuChild.ticks).toBe(1);
    expect(gameplay.ticks).toBe(0);
  });

  it("a 'stopped' node never runs, even unpaused; a deeper 'always' overrides it", () => {
    const world = new World({ seed: 1 });
    const root = new Node({ name: 'root' });
    const stopped = counter('stopped', 'stopped');
    const stoppedChild = counter('stoppedChild'); // inherit → effective 'stopped'
    const rebel = counter('rebel', 'always'); // explicit override below a 'stopped'
    stopped.addChild(stoppedChild);
    stopped.addChild(rebel);
    root.addChild(stopped);
    world.setRoot(root);
    world.step();
    expect(stopped.ticks).toBe(0);
    expect(stoppedChild.ticks).toBe(0);
    expect(rebel.ticks).toBe(1);
  });

  it("timeScale scales dt for pausable nodes; 'always' nodes get unscaled dt", () => {
    const world = new World({ seed: 1 });
    const root = new Node({ name: 'root' });
    const slow = counter('slow');
    const ui = counter('ui', 'always');
    root.addChild(slow);
    root.addChild(ui);
    world.setRoot(root);
    world.timeScale = 0.5;
    world.step();
    expect(slow.lastDt).toBeCloseTo(world.clock.dt * 0.5);
    expect(ui.lastDt).toBeCloseTo(world.clock.dt);
    // During pause, 'always' subtrees still animate at unscaled dt.
    world.paused = true;
    world.step();
    expect(ui.lastDt).toBeCloseTo(world.clock.dt);
    expect(ui.ticks).toBe(2);
    expect(slow.ticks).toBe(1);
  });

  it('hash format is unchanged at defaults (set-and-unset equals never-touched)', () => {
    const build = () => {
      const world = new World({ seed: 7 });
      world.setRoot(new Node({ name: 'root' }));
      return world;
    };
    const pristine = build();
    const touched = build();
    touched.paused = true;
    touched.timeScale = 0.25;
    touched.paused = false;
    touched.timeScale = 1;
    // Non-default values ARE hashed; defaults leave the pre-change format intact.
    expect(touched.hash()).toBe(pristine.hash());
    touched.paused = true;
    expect(touched.hash()).not.toBe(pristine.hash());
  });

  it('paused/timeScale round-trip through snapshot/restore (and default when absent)', () => {
    const world = new World({ seed: 1 });
    world.setRoot(new Node({ name: 'root' }));
    world.step();
    const plain = world.snapshot();
    expect('paused' in plain).toBe(false); // defaults stay out of the snapshot
    expect('timeScale' in plain).toBe(false);
    world.paused = true;
    world.timeScale = 2;
    const snap = world.snapshot();
    const fresh = new World({ seed: 1 });
    fresh.restore(snap);
    expect(fresh.paused).toBe(true);
    expect(fresh.timeScale).toBe(2);
    fresh.restore(plain); // pre-pause snapshot restores the defaults
    expect(fresh.paused).toBe(false);
    expect(fresh.timeScale).toBe(1);
  });

  it("pauseMode serializes only when non-default and round-trips", () => {
    const root = new Node({ name: 'root' });
    const menu = root.addChild(new Node({ name: 'menu' }));
    menu.pauseMode = 'always';
    const data = root.serialize();
    expect('pauseMode' in data.props).toBe(false); // default 'inherit' stays out
    expect(data.children[0].props.pauseMode).toBe('always');
    const clone = deserializeNode(data);
    expect(clone.find('menu')!.pauseMode).toBe('always');
    expect(clone.pauseMode).toBe('inherit');
  });
});
