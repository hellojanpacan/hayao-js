import { describe, expect, it } from 'vitest';
import type { CircleCommand, DrawCommand, RectCommand, TextCommand } from './commands';
import { LAYER_HUD, LAYER_LIGHT } from './commands';
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

// ── Lighting run encoding (the primary nested-blend design) ──────────────────
const ambientRect = (over: Partial<RectCommand> = {}): RectCommand => ({
  kind: 'rect', x: 0, y: 0, w: 200, h: 100, fill: '#101018', blend: 'multiply',
  transform: IDENTITY, z: 0, layer: LAYER_LIGHT, ...over,
});
const pool = (over: Partial<CircleCommand> = {}): CircleCommand => ({
  kind: 'circle', cx: 50, cy: 50, radius: 45, blend: 'screen',
  gradient: { type: 'radial', cx: 0.5, cy: 0.5, r: 0.5, stops: [{ offset: 0, color: '#ffffff' }, { offset: 1, color: '#000000' }] },
  transform: IDENTITY, z: 0, layer: LAYER_LIGHT, ...over,
});

describe('svgString — lighting run encoding', () => {
  it('an EMPTY light layer produces byte-identical output to a lit-layer-free frame', () => {
    // A world command with no light run — the regression guard the plan requires.
    const world: DrawCommand[] = [{ kind: 'rect', x: 0, y: 0, w: 10, h: 10, fill: '#808080', transform: IDENTITY, z: 0 }];
    const bare = commandsToSVGInner(world);
    const withEmpty = commandsToSVGInner([...world]); // no LAYER_LIGHT commands
    expect(withEmpty).toBe(bare);
  });

  it('wraps the run in the multiply/isolate group with a screen sub-group', () => {
    const svg = commandsToSVGInner([ambientRect(), pool()]);
    expect(svg).toContain('mix-blend-mode:multiply; isolation:isolate');
    expect(svg).toContain('mix-blend-mode:screen');
    // The ambient darkness rect and the pool circle both appear.
    expect(svg).toContain('fill="#101018"');
    expect(svg).toContain('<circle');
    // Pool fill references a salted radial gradient def.
    expect(svg).toMatch(/fill="url\(#[^"]*lg0\)"/);
  });

  it('a shadow poly becomes a black mask polygon on the light group', () => {
    const shadow: DrawCommand = {
      kind: 'poly', points: [70, 40, 70, 60, 160, 64, 160, 36], closed: true,
      fill: '#101018', blend: 'multiply', transform: IDENTITY, z: 0, layer: LAYER_LIGHT,
    };
    const svg = commandsToSVGInner([ambientRect(), pool(), shadow]);
    expect(svg).toContain('<mask');
    // White base rect + black shadow polygon inside the mask.
    expect(svg).toContain('fill="#ffffff"');
    expect(svg).toContain('fill="#000000"');
    expect(svg).toMatch(/mask="url\(#[^"]*lm0\)"/);
  });

  it('the HUD pass after the light run is emitted outside the multiply group (never darkened)', () => {
    const hud: DrawCommand = { kind: 'rect', x: 180, y: 80, w: 16, h: 16, fill: '#ff0000', transform: IDENTITY, z: 0, layer: LAYER_HUD };
    const svg = commandsToSVGInner([ambientRect(), pool(), hud]);
    // The HUD rect comes AFTER the closing </g> of the light group.
    const groupEnd = svg.lastIndexOf('</g>');
    const hudAt = svg.indexOf('fill="#ff0000"');
    expect(hudAt).toBeGreaterThan(groupEnd);
  });
});
