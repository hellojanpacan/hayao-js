import { describe, it, expect } from 'vitest';
import { Node } from './node';
import { VerletChain } from './verletChain';
import type { DrawCommand, PolyCommand } from '../render/commands';

const DT = 1 / 60;

function makeChain(extra: Partial<ConstructorParameters<typeof VerletChain>[0]> = {}): VerletChain {
  return new VerletChain({ segments: 8, length: 80, ...extra });
}

function stepN(node: Node, n: number): void {
  for (let i = 0; i < n; i++) node.updateTree(DT);
}

describe('VerletChain', () => {
  it('is cosmetic by default', () => {
    expect(makeChain().cosmetic).toBe(true);
  });

  it('settles under gravity deterministically — same config/steps → bit-identical points', () => {
    const a = makeChain();
    const b = makeChain();
    stepN(a, 240);
    stepN(b, 240);
    const pa = a.points;
    const pb = b.points;
    expect(pa.length).toBe(9);
    for (let i = 0; i < pa.length; i++) {
      expect(pa[i].x).toBe(pb[i].x); // bit-equal, not approximate
      expect(pa[i].y).toBe(pb[i].y);
    }
  });

  it('hangs straight down at rest (head at local origin, tail below it)', () => {
    const chain = makeChain();
    stepN(chain, 600);
    const pts = chain.points;
    expect(pts[0].x).toBeCloseTo(0, 6);
    expect(pts[0].y).toBeCloseTo(0, 6);
    const tail = pts[pts.length - 1];
    expect(Math.abs(tail.x)).toBeLessThan(0.5);
    // Verlet constraints are soft: a rope under gravity stretches a little
    // (a few % at the default 3 iterations) — that sag IS the look.
    expect(tail.y).toBeGreaterThan(78);
    expect(tail.y).toBeLessThan(85);
  });

  it('constraint relaxation keeps segment lengths within tolerance', () => {
    const chain = makeChain();
    // Flick it so the constraint solver has to work, then let it swing a bit.
    stepN(chain, 30);
    chain.impulse({ x: 400, y: -200 });
    stepN(chain, 20);
    const pts = chain.points;
    const rest = chain.segmentLength;
    for (let i = 0; i < pts.length - 1; i++) {
      const dx = pts[i + 1].x - pts[i].x;
      const dy = pts[i + 1].y - pts[i].y;
      const len = Math.hypot(dx, dy);
      expect(Math.abs(len - rest) / rest).toBeLessThan(0.1); // within 10% mid-flick
    }
  });

  it('segmentAngle points down (+π/2, y-down) for a chain at rest', () => {
    const chain = makeChain();
    stepN(chain, 600);
    for (let i = 0; i < chain.segments; i++) {
      expect(chain.segmentAngle(i)).toBeCloseTo(Math.PI / 2, 1);
    }
  });

  it('impulse() flicks the free points', () => {
    const flicked = makeChain();
    const still = makeChain();
    stepN(flicked, 60);
    stepN(still, 60);
    flicked.impulse({ x: 600, y: 0 });
    flicked.updateTree(DT);
    still.updateTree(DT);
    const tf = flicked.points[flicked.points.length - 1];
    const ts = still.points[still.points.length - 1];
    expect(tf.x).toBeGreaterThan(ts.x);
    expect(flicked.points[0].x).toBeCloseTo(0, 6); // head stays pinned
  });

  it('the head follows the node position in world space (points stay node-local)', () => {
    const parent = new Node();
    const chain = parent.addChild(makeChain({ pos: { x: 100, y: 50 } }));
    stepN(parent, 120);
    parent.pos.x += 40; // character moves
    stepN(parent, 2);
    // Local head is still the local origin; the trailing points lag behind (-x).
    expect(chain.points[0].x).toBeCloseTo(0, 6);
    expect(chain.points[2].x).toBeLessThan(0);
  });

  it('pinTail holds the tail at tailTarget (node-local)', () => {
    const chain = makeChain({ pinTail: true });
    chain.tailTarget = { x: 60, y: 20 };
    stepN(chain, 240);
    const tail = chain.points[chain.points.length - 1];
    expect(tail.x).toBeCloseTo(60, 4);
    expect(tail.y).toBeCloseTo(20, 4);
  });

  it('draw() emits one open stroked poly (or per-segment polys when tapered)', () => {
    const chain = makeChain({ stroke: '#a33', strokeWidth: 4 });
    stepN(chain, 10);
    const out: DrawCommand[] = [];
    chain.collectDraw(out);
    expect(out).toHaveLength(1);
    const poly = out[0] as PolyCommand;
    expect(poly.kind).toBe('poly');
    expect(poly.closed).toBe(false);
    expect(poly.stroke).toBe('#a33');
    expect(poly.strokeWidth).toBe(4);
    expect(poly.points).toHaveLength(2 * 9);

    const tapered = makeChain({ taper: true, strokeWidth: 6 });
    stepN(tapered, 10);
    const tout: DrawCommand[] = [];
    tapered.collectDraw(tout);
    expect(tout).toHaveLength(8); // one poly per segment
    const first = tout[0] as PolyCommand;
    const last = tout[tout.length - 1] as PolyCommand;
    expect(first.strokeWidth as number).toBeGreaterThan(last.strokeWidth as number);
  });
});
