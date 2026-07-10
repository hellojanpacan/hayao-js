import { describe, it, expect } from 'vitest';
import { createWorld, defineGame } from '../app/game';
import { knob } from '../app/tuning';
import { Node } from '../scene/node';

import { registerNode } from '../scene/registry';
import type { World } from '../world';
import { SessionRecorder } from './record';
import { replaySession } from './session';

// A sim that consumes ALL replayed channels: discrete actions, analog axes
// (pointer), a tuning knob, and rng — if replay drifts on any of them, the
// hash comparison below catches it.
class Chaser extends Node {
  override readonly type = 'Chaser';
  protected override onProcess(dt: number): void {
    const w = this.world as World;
    const speed = w.tune<number>('speed');
    const targetX = w.input.axis('pointer.x');
    const dir = w.input.isDown('right') ? 1 : w.input.isDown('left') ? -1 : 0;
    w.state.x = (w.state.x as number) + dir * speed * dt + (targetX - (w.state.x as number)) * 0.1 * dt;
    w.state.jitter = (w.state.jitter as number) + w.rng.float();
    this.pos = { x: w.state.x as number, y: 100 };
  }
}
registerNode('Chaser', () => new Chaser());

const chaseGame = defineGame({
  title: 'Chase',
  seed: 7,
  tuning: { knobs: [knob.num('speed', { default: 120, min: 10, max: 400 })] },
  build: (world) => {
    const root = new Node({ name: 'root' });
    root.addChild(new Chaser({ name: 'chaser' }));
    world.state.x = 0;
    world.state.jitter = 0;
    return root;
  },
});

/** Simulate live play: drive the world AND the recorder exactly like runWorkshop does. */
function playLive(frames: Array<{ actions: string[]; pointerX?: number }>, knobAt?: { frame: number; value: number }) {
  const recorder = new SessionRecorder({ game: 'Chase', seed: 7, tuningValues: { speed: 120 }, startedAt: '2026-07-05T00:00:00.000Z' });
  let world = createWorld(chaseGame, { seed: 7, tuning: {} });
  for (let i = 0; i < frames.length; i++) {
    if (knobAt && knobAt.frame === i) {
      // The setKnob carryover flow.
      const snap = world.snapshot();
      snap.tuning = { ...snap.tuning, speed: knobAt.value };
      world.restore(snap);
      recorder.knob('speed', knobAt.value);
    }
    const f = frames[i];
    if (f.pointerX !== undefined) world.input.axes.set('pointer.x', f.pointerX);
    recorder.step(f.actions, world.input.axes);
    world.step(f.actions);
  }
  return { world, recorder };
}

const script: Array<{ actions: string[]; pointerX?: number }> = [
  ...Array.from({ length: 10 }, () => ({ actions: ['right'], pointerX: 50 })),
  ...Array.from({ length: 5 }, () => ({ actions: [] as string[], pointerX: 212.5 })),
  ...Array.from({ length: 10 }, () => ({ actions: ['left'], pointerX: 212.5 })),
  ...Array.from({ length: 8 }, () => ({ actions: ['left', 'right'] })),
];

describe('session record → replay', () => {
  it('replaySession reproduces the final hash bit-exactly (actions + axes + rng)', () => {
    const { world, recorder } = playLive(script);
    const session = recorder.toSession('quit');
    const replayed = replaySession(chaseGame, session);
    expect(replayed.hash()).toBe(world.hash());
    expect(replayed.frame).toBe(world.frame);
  });

  it('delta-encodes axes: unchanged values produce no log entries', () => {
    const { recorder } = playLive(script);
    const session = recorder.toSession('quit');
    // pointer.x changes twice (50, then 212.5) → exactly 2 entries for it.
    expect(session.axesLog.filter(([, name]) => name === 'pointer.x')).toHaveLength(2);
  });

  it('replays a mid-play knob change at its exact frame', () => {
    const { world, recorder } = playLive(script, { frame: 12, value: 300 });
    const session = recorder.toSession('quit');
    expect(session.knobEvents).toEqual([{ frame: 12, key: 'speed', value: 300 }]);
    const replayed = replaySession(chaseGame, session);
    expect(replayed.tune('speed')).toBe(300);
    expect(replayed.hash()).toBe(world.hash());
  });

  it('replays to an intermediate tick for moment inspection', () => {
    const { recorder } = playLive(script);
    const session = recorder.toSession('quit');
    const at15 = replaySession(chaseGame, session, 15);
    expect(at15.frame).toBe(15);
    // Same prefix → same state: re-replaying yields an identical hash.
    expect(replaySession(chaseGame, session, 15).hash()).toBe(at15.hash());
  });

  it('replays a post-hot-swap segment from its startSnapshot bit-exactly', () => {
    // Live play: 20 frames, then a "hot swap" — snapshot, restore into a fresh
    // world (as runWorkshop does), and keep playing 15 frames into a new
    // segment recorder that carries the snapshot as its origin.
    const { world } = playLive(script.slice(0, 20));
    const snap = world.snapshot();
    const w2 = createWorld(chaseGame, { seed: 7 });
    w2.restore(structuredClone(snap));
    const segment = new SessionRecorder({
      game: 'Chase',
      seed: 7,
      tuningValues: { speed: 120 },
      startedAt: '2026-07-05T00:01:00.000Z',
      startSnapshot: snap,
    });
    segment.screen('hot-swap');
    for (const f of script.slice(20, 35)) {
      if (f.pointerX !== undefined) w2.input.axes.set('pointer.x', f.pointerX);
      segment.step(f.actions, w2.input.axes);
      w2.step(f.actions);
    }
    const replayed = replaySession(chaseGame, JSON.parse(JSON.stringify(segment.toSession('quit'))));
    expect(replayed.frame).toBe(w2.frame);
    expect(replayed.hash()).toBe(w2.hash());
  });

  it('stamps events with the current frame and round-trips the artifact through JSON', () => {
    const { recorder } = playLive(script);
    recorder.annotate('felt-bad', 'jump too floaty');
    recorder.screen('pause');
    recorder.mark('blur', 1234);
    const session = JSON.parse(JSON.stringify(recorder.toSession('quit')));
    expect(session.annotations[0]).toEqual({ frame: 33, tag: 'felt-bad', note: 'jump too floaty' });
    expect(session.endReason).toBe('quit');
    const replayed = replaySession(chaseGame, session);
    expect(replayed.frame).toBe(33);
  });
});
