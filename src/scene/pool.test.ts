import { describe, it, expect } from 'vitest';
import { NodePool } from './pool';
import { Node } from './node';
import { Sprite } from './nodes';

describe('NodePool', () => {
  it('creates on demand, reuses in stable order, hides the surplus', () => {
    const layer = new Node({ name: 'layer' });
    const pool = new NodePool(layer, () => new Sprite({ shape: { kind: 'circle', radius: 4 }, fill: '#000' }));

    pool.begin();
    const a = pool.get();
    const b = pool.get();
    pool.end();
    expect(layer.children).toHaveLength(2);
    expect(pool.liveCount).toBe(2);

    // Next frame claims fewer: same nodes come back in the same order, extra hidden.
    pool.begin();
    const a2 = pool.get();
    pool.end();
    expect(a2).toBe(a);
    expect(a.visible).toBe(true);
    expect(b.visible).toBe(false);
    expect(layer.children).toHaveLength(2); // never destroys

    // Growing again reuses b before making new nodes.
    pool.begin();
    pool.get();
    const b2 = pool.get();
    const c = pool.get();
    pool.end();
    expect(b2).toBe(b);
    expect(b.visible).toBe(true);
    expect(layer.children).toHaveLength(3);
    expect(c.visible).toBe(true);
  });
});
