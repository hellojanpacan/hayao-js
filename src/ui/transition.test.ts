import { describe, it, expect } from 'vitest';
import { World, ScreenTransition, CinematicPlayer, wipeStep, type RectCommand, type CircleCommand } from '@hayao';

describe('ScreenTransition — full-screen wipes', () => {
  it('covers, fires the midpoint once, then reveals', () => {
    const world = new World({ width: 320, height: 200 });
    const tr = world.root.addChild(new ScreenTransition({ width: 320, height: 200 }));
    let mid = 0;
    let done = 0;
    tr.wipe({ cover: 0.2, reveal: 0.2, onMidpoint: () => mid++, onDone: () => done++ });
    world.step([]);
    expect(tr.busy).toBe(true);
    // 0.2s cover + 0.2s reveal = 0.4s ≈ 24 frames; run past it.
    for (let i = 0; i < 40; i++) world.step([]);
    expect(mid).toBe(1);
    expect(done).toBe(1);
    expect(tr.busy).toBe(false);
    expect(tr.coverage).toBeCloseTo(0, 3);
  });

  it('reaches full coverage at the midpoint', () => {
    const world = new World({ width: 320, height: 200 });
    const tr = world.root.addChild(new ScreenTransition({ width: 320, height: 200 }));
    let coverAtMid = -1;
    tr.wipe({ cover: 0.2, reveal: 0.2, onMidpoint: () => (coverAtMid = tr.coverage) });
    for (let i = 0; i < 15; i++) world.step([]);
    expect(coverAtMid).toBeCloseTo(1, 3);
  });

  it('fade paints one screen-space rect with rising opacity', () => {
    const world = new World({ width: 320, height: 200 });
    const tr = world.root.addChild(new ScreenTransition({ kind: 'fade', width: 320, height: 200 }));
    tr.cover(0.3);
    world.step([]);
    world.step([]);
    const rect = world.render().find((c): c is RectCommand => c.kind === 'rect' && c.w === 320 && c.h === 200);
    expect(rect).toBeTruthy();
    expect(rect!.opacity).toBeGreaterThan(0);
    expect(rect!.opacity).toBeLessThan(1);
  });

  it('circle wipe grows a centered disc', () => {
    const world = new World({ width: 320, height: 200 });
    const tr = world.root.addChild(new ScreenTransition({ kind: 'circle', width: 320, height: 200 }));
    tr.cover(0.2);
    for (let i = 0; i < 6; i++) world.step([]);
    const disc = world.render().find((c): c is CircleCommand => c.kind === 'circle');
    expect(disc).toBeTruthy();
    expect(disc!.cx).toBe(160);
    expect(disc!.cy).toBe(100);
    expect(disc!.radius).toBeGreaterThan(0);
  });

  it('dither dissolve emits more opaque cells as coverage rises', () => {
    const world = new World({ width: 320, height: 200 });
    const tr = world.root.addChild(new ScreenTransition({ kind: 'dither', width: 320, height: 200, cell: 20 }));
    tr.cover(0.5);
    for (let i = 0; i < 6; i++) world.step([]);
    const early = world.render().filter((c) => c.kind === 'rect').length;
    for (let i = 0; i < 12; i++) world.step([]);
    const later = world.render().filter((c) => c.kind === 'rect').length;
    expect(later).toBeGreaterThan(early);
  });

  it('is cosmetic — excluded from serialize()', () => {
    const world = new World();
    world.root.addChild(new ScreenTransition());
    world.step([]);
    expect(world.root.serialize().children.length).toBe(0);
  });

  it('is deterministic across identical runs', () => {
    const run = () => {
      const world = new World({ width: 320, height: 200 });
      const tr = world.root.addChild(new ScreenTransition({ kind: 'circle', width: 320, height: 200 }));
      tr.wipe({ cover: 0.25, reveal: 0.25 });
      const out: number[] = [];
      for (let i = 0; i < 30; i++) { world.step([]); out.push(tr.coverage); }
      return out;
    };
    expect(run()).toEqual(run());
  });
});

describe('CinematicPlayer — scripted step sequencer', () => {
  it('runs steps in order, holding for each duration', () => {
    const world = new World();
    const cine = world.root.addChild(new CinematicPlayer());
    const log: string[] = [];
    cine.play([
      { name: 'a', enter: () => log.push('a'), duration: 0.1 },
      { name: 'b', enter: () => log.push('b'), duration: 0.1 },
      { name: 'c', enter: () => log.push('c') },
    ]);
    expect(log).toEqual(['a']); // first enter fires on play
    for (let i = 0; i < 20; i++) world.step([]);
    expect(log).toEqual(['a', 'b', 'c']);
    expect(cine.active).toBe(false);
  });

  it('fade-gates advancement on a transition finishing', () => {
    const world = new World({ width: 320, height: 200 });
    const tr = world.root.addChild(new ScreenTransition({ width: 320, height: 200 }));
    const cine = world.root.addChild(new CinematicPlayer());
    let swapped = 0;
    cine.play([
      wipeStep(tr, { cover: 0.15, reveal: 0.15, onMidpoint: () => swapped++ }),
      { name: 'after', enter: () => swapped++ },
    ]);
    // While the wipe is busy the cinematic stays on step 0.
    world.step([]);
    expect(cine.step).toBe(0);
    for (let i = 0; i < 30; i++) world.step([]);
    // The wipe swapped at its midpoint, then the gate opened and the last step ran.
    expect(swapped).toBe(2);
    expect(cine.active).toBe(false);
  });

  it('fires the finished callback exactly once', () => {
    const world = new World();
    const cine = world.root.addChild(new CinematicPlayer());
    let finished = 0;
    cine.play([{ duration: 0.05 }], () => finished++);
    for (let i = 0; i < 10; i++) world.step([]);
    expect(finished).toBe(1);
  });
});
