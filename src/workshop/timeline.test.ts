import { describe, it, expect } from 'vitest';
import { createWorld, defineGame } from '../app/game';
import { knob } from '../app/tuning';
import { Node } from '../scene/node';
import { registerNode } from '../scene/registry';
import type { World } from '../world';
import { SessionRecorder } from './record';
import { SnapshotRing, scrubTo } from './timeline';

// Same all-channels consumer as session.test: actions, pointer axis, knob, rng.
class Walker extends Node {
  override readonly type = 'TimelineWalker';
  protected override onProcess(dt: number): void {
    const w = this.world as World;
    const dir = w.input.isDown('right') ? 1 : 0;
    w.state.x = (w.state.x as number) + dir * w.tune<number>('speed') * dt + w.input.axis('pointer.x') * 0.01 * dt;
    w.state.noise = (w.state.noise as number) + w.rng.float();
    this.pos = { x: w.state.x as number, y: 0 };
  }
}
registerNode('TimelineWalker', () => new Walker());

const game = defineGame({
  title: 'TimelineWalk',
  seed: 5,
  tuning: { knobs: [knob.num('speed', { default: 100, min: 10, max: 500 })] },
  build: (world) => {
    const root = new Node({ name: 'root' });
    root.addChild(new Walker({ name: 'walker' }));
    world.state.x = 0;
    world.state.noise = 0;
    return root;
  },
});

/** Live play driving world + recorder + ring exactly like runWorkshop does. */
function play(frames: number, opts: { knobAt?: { frame: number; value: number }; pointerAt?: { frame: number; x: number } } = {}) {
  const recorder = new SessionRecorder({ game: 'TimelineWalk', seed: 5, tuningValues: { speed: 100 }, startedAt: '2026-07-05T02:00:00.000Z' });
  const world = createWorld(game, { seed: 5 });
  const ring = new SnapshotRing(10, 100); // small stride so tests cross entries
  ring.push(0, world);
  for (let i = 0; i < frames; i++) {
    if (opts.knobAt?.frame === i) {
      const snap = world.snapshot();
      snap.tuning = { ...snap.tuning, speed: opts.knobAt.value };
      world.restore(snap);
      recorder.knob('speed', opts.knobAt.value);
    }
    if (opts.pointerAt?.frame === i) world.input.axes.set('pointer.x', opts.pointerAt.x);
    recorder.step(['right'], world.input.axes);
    world.step(['right']);
    ring.push(recorder.frame, world);
  }
  return { world, recorder, ring };
}

const scrub = (ctx: ReturnType<typeof play>, target: number) =>
  scrubTo(ctx.world, game, ctx.ring, ctx.recorder.liveInputFrames, ctx.recorder.liveAxesLog, ctx.recorder.liveKnobEvents, target);

describe('SnapshotRing', () => {
  it('keeps frame 0 and every stride-th frame, evicting oldest past cap', () => {
    const ring = new SnapshotRing(10, 3);
    const world = createWorld(game);
    ring.push(0, world);
    for (const f of [10, 20, 30]) ring.push(f, world);
    expect(ring.minFrame).toBe(10); // 0 evicted by cap 3
    expect(ring.nearest(25)?.frame).toBe(20);
    expect(ring.nearest(5)).toBeNull();
  });
});

describe('scrubTo', () => {
  it('rewinds to an exact frame: scrubbed state ≡ a fresh run stopped there', () => {
    const ctx = play(55, { pointerAt: { frame: 17, x: 320 } });
    const reached = scrub(ctx, 23);
    expect(reached).toBe(23);
    const fresh = play(23, { pointerAt: { frame: 17, x: 320 } });
    expect(ctx.world.hash()).toBe(fresh.world.hash());
  });

  it('scrubs forward again after a rewind (still frozen, no fork)', () => {
    const ctx = play(60);
    scrub(ctx, 20);
    const reached = scrub(ctx, 45);
    expect(reached).toBe(45);
    expect(ctx.world.hash()).toBe(play(45).world.hash());
  });

  it('reapplies mid-play knob changes at their exact frame while re-stepping', () => {
    const ctx = play(50, { knobAt: { frame: 25, value: 300 } });
    scrub(ctx, 40); // crosses the knob event during re-step
    expect(ctx.world.tune('speed')).toBe(300);
    const fresh = play(40, { knobAt: { frame: 25, value: 300 } });
    expect(ctx.world.hash()).toBe(fresh.world.hash());
    scrub(ctx, 20); // before the knob — the old value again
    expect(ctx.world.tune('speed')).toBe(100);
  });

  it('clamps below the ring floor and above the recorded tip', () => {
    const ctx = play(50);
    // Evict early entries: stride 10 cap 100 keeps all here, so use a tiny ring.
    const tiny = new SnapshotRing(10, 2);
    const w2 = createWorld(game, { seed: 5 });
    tiny.push(0, w2);
    const rec = new SessionRecorder({ game: 'TimelineWalk', seed: 5, tuningValues: { speed: 100 }, startedAt: '2026-07-05T02:01:00.000Z' });
    for (let i = 0; i < 50; i++) {
      rec.step(['right'], w2.input.axes);
      w2.step(['right']);
      tiny.push(rec.frame, w2);
    }
    expect(tiny.minFrame).toBe(40);
    expect(scrubTo(w2, game, tiny, rec.liveInputFrames, rec.liveAxesLog, [], 5)).toBe(40); // clamped up
    expect(scrub(ctx, 999)).toBe(50); // clamped to the tip
  });
});

describe('SessionRecorder.truncate (the resume fork)', () => {
  it('drops frames and events past the fork point; the artifact replays as kept', () => {
    const ctx = play(60, { knobAt: { frame: 40, value: 250 }, pointerAt: { frame: 45, x: 100 } });
    ctx.recorder.annotate('late-note');
    ctx.recorder.truncate(30);
    ctx.ring.truncate(30);
    expect(ctx.recorder.frame).toBe(30);
    const s = ctx.recorder.toSession('quit');
    expect(s.knobEvents).toHaveLength(0); // knob was at 40 — never happened
    expect(s.axesLog.every(([f]) => f < 30)).toBe(true);
    expect(s.annotations).toHaveLength(0);
    // Continue playing from the fork: the ring + log stay consistent.
    scrub(ctx, 30);
    for (let i = 0; i < 10; i++) {
      ctx.recorder.step([], ctx.world.input.axes);
      ctx.world.step([]);
      ctx.ring.push(ctx.recorder.frame, ctx.world);
    }
    expect(scrub(ctx, 35)).toBe(35);
    const fresh = play(30);
    for (let i = 0; i < 5; i++) fresh.world.step([]);
    expect(ctx.world.hash()).toBe(fresh.world.hash());
  });
});
