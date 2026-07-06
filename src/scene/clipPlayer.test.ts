import { describe, it, expect } from 'vitest';
import { ClipPlayer } from './clipPlayer';
import { IkTarget } from './ikTarget';
import { SkeletonDebug } from './skeletonDebug';
import { Bone2D } from '../anim/skeleton';
import { Node } from './node';
import { Sprite } from './nodes';
import type { ClipDef } from '../anim/clip';
import type { DrawCommand } from '../render/commands';
import { defineGame, createWorld } from '../app/game';
import { assertDeterministic, assertSnapshotStable } from '../verify/determinism';
import { deserializeNode } from './registry';
import type { InputLog } from '../input/actions';

const DT = 1 / 60;

const walk: ClipDef = {
  duration: 0.8,
  loop: 'loop',
  tracks: [
    { target: 'thigh', channel: 'rotation', keys: [{ t: 0, v: 0 }, { t: 0.4, v: 0.6, ease: 'sineInOut' }, { t: 0.8, v: 0 }] },
    { target: 'shin', channel: 'rotation', keys: [{ t: 0, v: 0.2 }, { t: 0.4, v: -0.3 }, { t: 0.8, v: 0.2 }] },
  ],
  events: [{ t: 0.4, name: 'step' }],
};

const idle: ClipDef = {
  duration: 1.2,
  loop: 'loop',
  tracks: [{ target: 'thigh', channel: 'rotation', keys: [{ t: 0, v: 0 }, { t: 0.6, v: 0.05 }, { t: 1.2, v: 0 }] }],
};

/** Build a rig: root → thigh(Bone2D) → shin(Bone2D) → foot(Sprite). */
function buildRig(): { rig: Node; thigh: Bone2D; shin: Bone2D } {
  const rig = new Node({ name: 'rig' });
  const thigh = new Bone2D({ name: 'thigh', length: 40 });
  const shin = new Bone2D({ name: 'shin', length: 40, pos: { x: 40, y: 0 } });
  const foot = new Sprite({ name: 'foot', shape: { kind: 'circle', radius: 4 }, fill: '#333', pos: { x: 40, y: 0 } });
  shin.addChild(foot);
  thigh.addChild(shin);
  rig.addChild(thigh);
  return { rig, thigh, shin };
}

/**
 * A tiny game whose LOGIC state advances every frame (so world.hash() moves), with
 * an optional cosmetic animation rig. `withRig` toggles the whole ClipPlayer +
 * IkTarget apparatus so we can prove the hash is identical with or without it.
 */
function makeGame(withRig: boolean) {
  return defineGame({
    title: 'anim-seam',
    seed: 7,
    build() {
      const root = new Node({ name: 'root' });
      if (withRig) {
        const { rig, thigh, shin } = buildRig();
        // The whole animated rig is cosmetic VIEW here: the ClipPlayer/IkTarget
        // write bone transforms, and a cosmetic subtree keeps those writes out of
        // serialize()/hash()/snapshot(). (Bone2D isn't FORCE-cosmetic — a game may
        // instead pose bones logically and hash them — but an animated show rig is
        // presentation, so we opt the subtree out. This is the seam.) Because the
        // subtree is cosmetic, its closures live only in the running tree; a
        // restored world simply re-lacks the rig — and the hash is identical
        // either way, which is exactly what the seam guarantees.
        rig.cosmetic = true;
        root.addChild(rig);
        // ORDERING: ClipPlayer is child 0 of the rig; IkTarget a later sibling.
        const player = new ClipPlayer({ name: 'player', rig });
        player.add('walk', walk).add('idle', idle);
        rig.addChild(player); // enterTree → onReady binds
        player.play('walk');
        // Drive the crossfade from the cosmetic side (no logical state touched):
        // a self-timing closure on the cosmetic rig. ~0.33s → tick into idle/fade.
        let elapsed = 0;
        let switched = false;
        rig.onUpdate = (_n, dt) => {
          elapsed += dt;
          if (!switched && elapsed >= 0.33) {
            switched = true;
            player.play('idle', { fade: 0.3 });
          }
        };
        const ik = new IkTarget({ name: 'ik', bones: [thigh, shin], pos: { x: 30, y: 50 } });
        rig.addChild(ik); // later sibling → runs after the ClipPlayer
      }
      return root;
    },
    probe: () => ({}),
  });
}

function logOf(frames: number): InputLog {
  return { frames: Array.from({ length: frames }, () => []) };
}

describe('ClipPlayer — cosmetic sampling', () => {
  it('is cosmetic, and so are IkTarget and SkeletonDebug', () => {
    expect(new ClipPlayer().cosmetic).toBe(true);
    expect(new IkTarget().cosmetic).toBe(true);
    expect(new SkeletonDebug().cosmetic).toBe(true);
  });

  it('poses the rig from the clip and advances on the fixed clock', () => {
    const { rig, thigh } = buildRig();
    const player = rig.addChild(new ClipPlayer({ name: 'p', rig }));
    player.add('walk', walk);
    // No world: bind explicitly against the rig (onReady does this in-tree).
    player.rebind(rig);
    player.play('walk');
    const before = thigh.rotation;
    for (let i = 0; i < 24; i++) rig.updateTree(DT); // ~0.4s → peak of the thigh curve
    expect(thigh.rotation).not.toBe(before);
    expect(player.current).toBe('walk');
    expect(player.time).toBeGreaterThan(0);
  });

  it('emits clip events (incoming clip) and finished for once clips', () => {
    const { rig } = buildRig();
    const player = rig.addChild(new ClipPlayer({ name: 'p', rig }));
    const onceClip: ClipDef = { duration: 0.2, loop: 'once', tracks: walk.tracks, events: [{ t: 0.1, name: 'mid' }] };
    player.add('once', onceClip);
    player.rebind(rig);
    const events: string[] = [];
    let finished = false;
    player.event.connect((n) => events.push(n));
    player.finished.connect(() => (finished = true));
    player.play('once');
    for (let i = 0; i < 20; i++) rig.updateTree(DT);
    expect(events).toContain('mid');
    expect(finished).toBe(true);
  });
});

describe('ClipPlayer — seam proofs', () => {
  it('(a) per-frame world.hash() is identical with and without the cosmetic rig', () => {
    const withRig = createWorld(makeGame(true));
    const without = createWorld(makeGame(false));
    for (let i = 0; i < 60; i++) {
      withRig.step([]);
      without.step([]);
      expect(withRig.hash()).toBe(without.hash());
    }
  });

  it('(b) assertSnapshotStable with warmup landing mid-clip', () => {
    // warmup 15 frames = 0.25s: mid-walk-clip (before the tick-20 crossfade).
    const res = assertSnapshotStable(() => createWorld(makeGame(true)), logOf(60), 15);
    expect(res.ok).toBe(true);
  });

  it('(b) assertSnapshotStable with warmup landing mid-crossfade', () => {
    // The crossfade starts at tick 20 over 0.3s (~18 frames). Warmup 25 lands inside it.
    const res = assertSnapshotStable(() => createWorld(makeGame(true)), logOf(60), 25);
    expect(res.ok).toBe(true);
  });

  it('(c) the rigged world is deterministic', () => {
    const res = assertDeterministic(() => createWorld(makeGame(true)), logOf(60));
    expect(res.ok).toBe(true);
  });
});

describe('ClipPlayer — serialization', () => {
  it('serialize() of a tree containing a ClipPlayer omits it (cosmetic filter)', () => {
    const { rig } = buildRig();
    rig.addChild(new ClipPlayer({ name: 'p', rig }));
    rig.addChild(new IkTarget({ name: 'ik' }));
    rig.addChild(new SkeletonDebug({ name: 'dbg' }));
    const data = rig.serialize();
    const names = data.children.map((c) => c.name);
    expect(names).not.toContain('p');
    expect(names).not.toContain('ik');
    expect(names).not.toContain('dbg');
    expect(names).toContain('thigh'); // bones survive (structure, not cosmetic)
  });
});

describe('SkeletonDebug', () => {
  it('emits only transient commands (poly bones + circle pivots)', () => {
    const { rig } = buildRig();
    const dbg = rig.addChild(new SkeletonDebug({ name: 'dbg', rig }));
    const out: DrawCommand[] = [];
    dbg.collectDraw(out, rig.worldTransform());
    expect(out.length).toBeGreaterThan(0);
    for (const cmd of out) expect(cmd.transient).toBe(true);
    expect(out.some((c) => c.kind === 'poly')).toBe(true);
    expect(out.some((c) => c.kind === 'circle')).toBe(true);
  });
});

describe('Bone2D registry round-trip', () => {
  // Bone2D is registered in registry.ts (integration); a rig with bone lengths
  // must survive serialize → deserialize.
  it('serializes bone length through deserializeNode', () => {
    const { rig } = buildRig();
    const restored = deserializeNode(rig.serialize());
    const thigh = restored.find('thigh') as Bone2D;
    expect(thigh).toBeInstanceOf(Bone2D);
    expect(thigh.length).toBe(40);
  });
});
