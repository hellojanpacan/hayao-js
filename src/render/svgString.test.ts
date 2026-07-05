import { describe, expect, it } from 'vitest';
import type { TextCommand } from './commands';
import { commandsToSVGInner } from './svgString';

// Text carries Paint (stroke/strokeWidth), so an outlined label must actually
// emit a stroke — the gap a consumer worked around with 8 stacked halo glyphs
// (docs/FRICTION.md, Pocket Gambit / KOAN external logs).
const IDENTITY = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
const text = (over: Partial<TextCommand> = {}): TextCommand => ({
  kind: 'text',
  x: 10,
  y: 20,
  text: 'K',
  size: 32,
  z: 0,
  transform: IDENTITY,
  ...over,
});

describe('svgString text stroke', () => {
  it('emits no stroke when the command carries none', () => {
    const svg = commandsToSVGInner([text()]);
    expect(svg).toContain('<text');
    expect(svg).not.toContain('stroke=');
  });

  it('emits stroke + width + paint-order under the fill when stroke is set', () => {
    const svg = commandsToSVGInner([text({ fill: '#fff', stroke: '#000', strokeWidth: 3 })]);
    expect(svg).toContain('fill="#fff"');
    expect(svg).toContain('stroke="#000"');
    expect(svg).toContain('stroke-width="3"');
    // paint-order="stroke" lays the outline UNDER the fill (frames, not eats).
    expect(svg).toContain('paint-order="stroke"');
  });

  it('adds round joins only when round is set', () => {
    expect(commandsToSVGInner([text({ stroke: '#000', round: true })])).toContain(
      'stroke-linejoin="round"',
    );
    expect(commandsToSVGInner([text({ stroke: '#000' })])).not.toContain('stroke-linejoin');
  });
});
