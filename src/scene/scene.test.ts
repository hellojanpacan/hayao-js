import { describe, it, expect } from 'vitest';
import { Node } from './node';
import { Sprite, Text, Timer } from './nodes';
import { AnimationPlayer, EASINGS } from './tween';
import { deserializeNode } from './registry';
import { World } from '../world';

describe('scene tree', () => {
  it('hands onUpdate a self-contained world context (input/rng/time), no closure needed', () => {
    const world = new World({ seed: 1 });
    const root = new Node({ name: 'root' });
    // Behaviour reaches input straight off ctx — never closes over `world`.
    root.onUpdate = (n, _dt, ctx) => {
      if (ctx.input.isDown('right')) n.pos.x += 1;
      (n as unknown as { sawRng: boolean }).sawRng = typeof ctx.rng.float === 'function';
    };
    world.setRoot(root);
    world.runSteps(3, () => ['right']); // fast-forward exactly 3 steps, right held
    expect(root.pos.x).toBe(3);
    expect((root as unknown as { sawRng: boolean }).sawRng).toBe(true);
  });

  it('runSteps advances an exact count (no realtime clamp)', () => {
    const world = new World({ seed: 1 });
    world.setRoot(new Node({ name: 'root' }));
    world.runSteps(72);
    expect(world.frame).toBe(72); // advance(1200) would clamp to ~15
  });

  it('rect Sprite is center-anchored by default, top-left on request (#22)', () => {
    const world = new World({ seed: 1 });
    const root = new Node({ name: 'root' });
    root.addChild(new Sprite({ name: 'c', pos: { x: 100, y: 100 }, shape: { kind: 'rect', w: 40, h: 20 }, fill: '#000' }));
    root.addChild(new Sprite({ name: 'tl', pos: { x: 100, y: 100 }, shape: { kind: 'rect', w: 40, h: 20, anchor: 'topLeft' }, fill: '#000' }));
    world.setRoot(root);
    const rects = world.render().filter((c) => c.kind === 'rect') as Array<{ x: number; y: number; transform: { e: number; f: number } }>;
    // center-anchored: local origin at (-w/2,-h/2) → drawn at pos + (-20,-10)
    expect({ x: rects[0].transform.e + rects[0].x, y: rects[0].transform.f + rects[0].y }).toEqual({ x: 80, y: 90 });
    // top-left: local origin at (0,0) → drawn at pos exactly
    expect({ x: rects[1].transform.e + rects[1].x, y: rects[1].transform.f + rects[1].y }).toEqual({ x: 100, y: 100 });
  });

  it('updates in fixed depth-first order', () => {
    const order: string[] = [];
    const world = new World({ seed: 1 });
    const root = new Node({ name: 'root' });
    const a = new Node({ name: 'a' });
    const b = new Node({ name: 'b' });
    a.onUpdate = () => order.push('a');
    b.onUpdate = () => order.push('b');
    root.onUpdate = () => order.push('root');
    root.addChild(a);
    root.addChild(b);
    world.setRoot(root);
    world.step();
    expect(order).toEqual(['root', 'a', 'b']);
  });

  it('calls onReady exactly once', () => {
    let readies = 0;
    class R extends Node {
      protected override onReady() {
        readies++;
      }
    }
    const world = new World({ seed: 1 });
    world.setRoot(new R());
    world.step();
    world.step();
    expect(readies).toBe(1);
  });

  it('world transform composes through parents', () => {
    const parent = new Node({ pos: { x: 100, y: 0 } });
    const child = new Node({ pos: { x: 10, y: 5 } });
    parent.addChild(child);
    const wt = child.worldTransform();
    expect(wt.e).toBeCloseTo(110);
    expect(wt.f).toBeCloseTo(5);
  });

  it('deferred free removes a node at end of step', () => {
    const world = new World({ seed: 1 });
    const root = new Node({ name: 'root' });
    const doomed = new Node({ name: 'doomed' });
    root.addChild(doomed);
    world.setRoot(root);
    world.step();
    doomed.free();
    world.step();
    expect(root.find('doomed')).toBeNull();
  });

  it('serialize → deserialize round-trips a subtree', () => {
    const root = new Node({ name: 'root' });
    root.addChild(new Sprite({ name: 's', shape: { kind: 'circle', radius: 12 }, fill: '#f00', pos: { x: 5, y: 6 } }));
    root.addChild(new Text({ name: 't', text: 'hi', size: 18 }));
    const data = root.serialize();
    const clone = deserializeNode(data);
    expect(clone.serialize()).toEqual(data);
    const sprite = clone.find('s') as Sprite;
    expect(sprite.shape).toEqual({ kind: 'circle', radius: 12 });
    expect(sprite.pos).toEqual({ x: 5, y: 6 });
  });
});

describe('rendering projection', () => {
  it('a sprite emits one draw command with world transform', () => {
    const world = new World({ seed: 1, width: 100, height: 100 });
    const root = new Node({ name: 'root' });
    root.addChild(new Sprite({ shape: { kind: 'rect', w: 10, h: 10 }, fill: '#000', pos: { x: 20, y: 30 } }));
    world.setRoot(root);
    const cmds = world.render();
    expect(cmds.length).toBe(1);
    expect(cmds[0].kind).toBe('rect');
    expect(cmds[0].transform.e).toBeCloseTo(20);
    expect(cmds[0].transform.f).toBeCloseTo(30);
  });

  it('invisible nodes are skipped', () => {
    const world = new World({ seed: 1 });
    const root = new Node({ name: 'root' });
    const s = new Sprite({ shape: { kind: 'circle', radius: 5 }, fill: '#000' });
    s.visible = false;
    root.addChild(s);
    world.setRoot(root);
    expect(world.render().length).toBe(0);
  });
});

describe('tween', () => {
  it('easings map 0→0 and 1→1', () => {
    for (const name of Object.keys(EASINGS)) {
      expect(EASINGS[name](0)).toBeCloseTo(0, 5);
      expect(EASINGS[name](1)).toBeCloseTo(1, 5);
    }
  });

  it('AnimationPlayer reaches its target and fires finished', () => {
    const world = new World({ seed: 1, clock: { hz: 10 } });
    const root = new Node({ name: 'root' });
    const anim = new AnimationPlayer();
    root.addChild(anim);
    world.setRoot(root);
    let value = 0;
    let done = false;
    anim.finished.connect(() => (done = true));
    anim.to((v) => (value = v), 0, 100, 1, 'linear');
    for (let i = 0; i < 12; i++) world.step();
    expect(value).toBeCloseTo(100);
    expect(done).toBe(true);
  });
});

describe('timer', () => {
  it('fires timeout after its duration', () => {
    const world = new World({ seed: 1, clock: { hz: 10 } });
    const root = new Node({ name: 'root' });
    const timer = new Timer({ duration: 0.5, autostart: true });
    root.addChild(timer);
    world.setRoot(root);
    let fired = 0;
    timer.timeout.connect(() => fired++);
    for (let i = 0; i < 10; i++) world.step();
    expect(fired).toBe(1);
  });
});
