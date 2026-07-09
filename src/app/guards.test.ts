// Issue #66: the common newcomer mistakes must throw an actionable `[hayao]`
// message that names the field + expected value + a doc link — not a cryptic
// engine-internal stack trace surfacing far from the cause.

import { describe, it, expect } from 'vitest';
import { defineGame, createWorld } from './game';
import { Node } from '../scene/node';
import { Sprite } from '../scene/nodes';
import { ERRORS_DOC } from '../core/errors';

/** Every guard message shares the house shape. */
function expectActionable(fn: () => unknown, opts: { field: string; anchor: string }): Error {
  let err: Error | undefined;
  try {
    fn();
  } catch (e) {
    err = e as Error;
  }
  expect(err, 'expected the call to throw').toBeDefined();
  const msg = err!.message;
  expect(msg).toContain('[hayao]');
  expect(msg).toContain(`field:`);
  expect(msg).toContain(opts.field);
  expect(msg).toContain('expected:');
  expect(msg).toContain(`${ERRORS_DOC}#${opts.anchor}`);
  return err!;
}

describe('newcomer guards (issue #66)', () => {
  it('Sprite without a shape names the `shape` field', () => {
    // The classic "passed size/color at the top level" mistake.
    const err = expectActionable(() => new Sprite({ size: 20, fill: 'red' } as never), {
      field: 'shape',
      anchor: 'sprite-shape',
    });
    // Shows the keys they actually passed, so the mismatch is obvious.
    expect(err.message).toContain('size');
  });

  it('Sprite with an unknown shape kind lists the valid kinds', () => {
    const err = expectActionable(() => new Sprite({ shape: { kind: 'square', w: 4, h: 4 } } as never), {
      field: 'shape.kind',
      anchor: 'sprite-shape',
    });
    expect(err.message).toContain('rect');
    expect(err.message).toContain('circle');
  });

  it('rect with a bad anchor names the two valid values', () => {
    const err = expectActionable(() => new Sprite({ shape: { kind: 'rect', w: 4, h: 4, anchor: 'top-left' } } as never), {
      field: 'shape.anchor',
      anchor: 'sprite-shape',
    });
    expect(err.message).toContain('topLeft');
  });

  it('a non-finite coordinate is caught at construction', () => {
    expectActionable(() => new Node({ pos: { x: NaN, y: 0 } }), { field: 'pos.x', anchor: 'coordinates' });
    expectActionable(() => new Node({ pos: { x: 0, y: Infinity } }), { field: 'pos.y', anchor: 'coordinates' });
    expectActionable(() => new Node({ rotation: NaN }), { field: 'rotation', anchor: 'coordinates' });
    // The subclass name (not "Node") appears in the message.
    const err = expectActionable(() => new Sprite({ shape: { kind: 'circle', radius: 2 }, pos: { x: NaN, y: 0 } }), {
      field: 'pos.x',
      anchor: 'coordinates',
    });
    expect(err.message).toContain('Sprite');
  });

  it('build() that forgets to return a Node names `build`', () => {
    const noReturn = defineGame({
      title: 'oops',
      // built but never returned — the classic missing `return`.
      build: (() => {
        new Node();
      }) as unknown as (world: never) => Node,
    });
    expectActionable(() => createWorld(noReturn), { field: 'build', anchor: 'build-return' });
  });

  it('valid usage still constructs cleanly', () => {
    expect(() => new Sprite({ shape: { kind: 'rect', w: 4, h: 4, anchor: 'topLeft' }, fill: '#000' })).not.toThrow();
    expect(() => new Node({ pos: { x: 1, y: 2 }, rotation: 0.5, scale: { x: 2, y: 2 }, z: 3 })).not.toThrow();
    const ok = defineGame({ title: 'ok', build: () => new Node() });
    expect(() => createWorld(ok)).not.toThrow();
  });
});
