import { describe, it, expect } from 'vitest';
import { solve, assertSolvable, type Puzzle } from './solver';
import { checkDeterministic } from './determinism';
import { HeadlessRenderer } from '../render/headless';
import { renderToSVGString, commandsToSVGInner } from '../render/svgString';
import { sortCommands, type DrawCommand } from '../render/commands';
import { IDENTITY } from '../core/math';
import { World } from '../world';
import { Node } from '../scene/node';
import { Sprite } from '../scene/nodes';

// A trivial reach-the-target number puzzle: from n, +1/×2, reach target.
function numberPuzzle(target: number): Puzzle<number, '+1' | 'x2'> {
  return {
    initial: () => 1,
    moves: () => ['+1', 'x2'],
    apply: (n, m) => (m === '+1' ? n + 1 : n * 2),
    isWin: (n) => n === target,
    isDead: (n) => n > target,
    key: (n) => String(n),
  };
}

describe('solver', () => {
  it('finds a shortest solution', () => {
    const r = solve(numberPuzzle(10));
    expect(r.solvable).toBe(true);
    // 1 →(x2)2 →(+1)3 →(x2)6 ... shortest to 10: 1→2→4→5→10 (x2,x2,+1,x2) = 4 moves
    expect(r.depth).toBe(4);
  });

  it('reports unwinnable targets', () => {
    // Target 0 is unreachable from 1 with +1/×2 (all moves increase).
    const r = solve(numberPuzzle(0), { maxDepth: 10 });
    expect(r.solvable).toBe(false);
  });

  it('assertSolvable throws on an impossible level', () => {
    expect(() => assertSolvable(numberPuzzle(0), { maxDepth: 5 })).toThrow();
  });
});

describe('determinism harness', () => {
  it('a well-behaved world hashes identically across runs', () => {
    const makeWorld = () => {
      const w = new World({ seed: 3 });
      const root = new Node({ name: 'root' });
      const mover = new Sprite({ name: 'm', shape: { kind: 'circle', radius: 4 }, fill: '#000' });
      // Deterministic drift using the world rng.
      mover.onUpdate = (n) => {
        n.pos.x += (w.rng.float() - 0.5) * 2;
      };
      root.addChild(mover);
      w.setRoot(root);
      return w;
    };
    const log = { frames: Array.from({ length: 30 }, () => [] as string[]) };
    const report = checkDeterministic(makeWorld, log);
    expect(report.ok).toBe(true);
  });
});

describe('headless rendering', () => {
  it('HeadlessRenderer records the display list and emits SVG', () => {
    const r = new HeadlessRenderer({ width: 100, height: 100 });
    const cmds: DrawCommand[] = [
      { kind: 'rect', x: 0, y: 0, w: 10, h: 10, transform: IDENTITY, z: 0, fill: '#f00' },
    ];
    r.draw(cmds);
    expect(r.count('rect')).toBe(1);
    const svg = r.toSVGString();
    expect(svg).toContain('<svg');
    expect(svg).toContain('<rect');
    expect(svg).toContain('#f00');
  });

  it('sortCommands orders by z then tree order', () => {
    const cmds: DrawCommand[] = [
      { kind: 'circle', cx: 0, cy: 0, radius: 1, transform: IDENTITY, z: 5, fill: 'a' },
      { kind: 'circle', cx: 0, cy: 0, radius: 1, transform: IDENTITY, z: 1, fill: 'b' },
      { kind: 'circle', cx: 0, cy: 0, radius: 1, transform: IDENTITY, z: 1, fill: 'c' },
    ];
    const sorted = sortCommands(cmds);
    expect(sorted.map((c) => (c as { fill: string }).fill)).toEqual(['b', 'c', 'a']);
  });

  it('commandsToSVGInner escapes text', () => {
    const svg = commandsToSVGInner([
      { kind: 'text', text: 'a < b & c', x: 0, y: 0, size: 10, transform: IDENTITY, z: 0, fill: '#000' },
    ]);
    expect(svg).toContain('a &lt; b &amp; c');
  });

  it('renderToSVGString wraps a full document with background', () => {
    const svg = renderToSVGString([], 320, 240, '#abc');
    expect(svg).toContain('viewBox="0 0 320 240"');
    expect(svg).toContain('#abc');
  });
});
