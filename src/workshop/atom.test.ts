// Atoms ride the whole game stack — so the tests prove exactly that: an atom
// compiles to a world that runs, hashes deterministically, honors knobs, and
// keeps its scene out of the canonical hash (everything cosmetic).

import { describe, it, expect } from 'vitest';
import { createWorld } from '../app/game';
import { knob } from '../app/tuning';
import { Node } from '../scene/node';
import { Sprite } from '../scene/nodes';
import { defineAtom, atomToGame, atomManifest, atomId } from './atom';

const sheet = defineAtom({
  kind: 'visual',
  title: 'The Lamplighter',
  radiates: 'a fragile flame you carry and spend',
  tuning: { knobs: [knob.enumOf('pose', { default: 'idle', options: ['idle', 'run'] })] },
  build: (world) => {
    const g = new Node({ name: 'sheet' });
    g.cosmetic = true;
    const pose = world.tune('pose') as string;
    g.addChild(new Sprite({ pos: { x: pose === 'run' ? 40 : 0, y: 0 }, shape: { kind: 'circle', radius: 12 }, fill: '#345' }));
    return g;
  },
});

describe('defineAtom / atomToGame', () => {
  it('compiles to a runnable, deterministic world', () => {
    const game = atomToGame(sheet);
    const a = createWorld(game);
    const b = createWorld(game);
    a.step([]);
    b.step([]);
    expect(a.hash()).toBe(b.hash());
    expect(a.probe().atom).toBe('the-lamplighter');
  });

  it('keeps the whole atom scene cosmetic — hash is scene-independent', () => {
    const game = atomToGame(sheet);
    const w = createWorld(game);
    // Same root, no catalog: only the cosmetic subtree differs — hash must not.
    const stripped = createWorld({
      ...game,
      build: () => {
        const n = new Node({ name: 'atom-the-lamplighter' });
        n.cosmetic = true;
        return n;
      },
    });
    expect(w.hash()).toBe(stripped.hash());
  });

  it('honors knobs through the standard tuning system', () => {
    const game = atomToGame(sheet);
    const w = createWorld(game, { tuning: { pose: 'run' } });
    expect(w.tune('pose')).toBe('run');
  });

  it('audio atoms need no build — the title card stands in', () => {
    const chime = defineAtom({
      kind: 'audio',
      title: 'Palace Chimes',
      cues: [{ name: 'coin', play: () => {} }],
    });
    const w = createWorld(atomToGame(chime));
    expect(w.probe().kind).toBe('audio');
    expect(atomManifest(chime).cues).toEqual([{ name: 'coin' }]);
  });

  it('validates its shape loudly', () => {
    expect(() => defineAtom({ kind: 'visual', title: 'x' } as never)).toThrow(/build/);
    expect(() => defineAtom({ kind: 'audio', title: 'x', cues: [] } as never)).toThrow(/cue/);
    expect(() => defineAtom({ kind: 'nope', title: 'x' } as never)).toThrow(/kind/);
  });

  it('derives stable ids and manifests with the radiates hook', () => {
    expect(atomId('The Lamplighter')).toBe('the-lamplighter');
    const m = atomManifest(sheet);
    expect(m).toMatchObject({ id: 'the-lamplighter', kind: 'visual', radiates: 'a fragile flame you carry and spend' });
  });
});
