import { afterEach, describe, expect, it, vi } from 'vitest';
import { drawToCanvas2D } from './canvas2d-core';
import { commandsToSVGInner } from './svgString';
import type { ArcCommand, CircleCommand, EllipseCommand, DrawCommand, RectCommand } from './commands';

// New shape vocabulary (ellipse / arc / lineDash) through the shared Canvas2D
// core against a recording mock ctx, plus the robustness contract: a malformed
// command is skipped with a single warn — never a dead render loop (ptg 34).

const IDENTITY = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
const TAU = Math.PI * 2;
const base = { transform: IDENTITY, z: 0 };

type Call = [name: string, args: unknown[]];

function mockCtx(overrides: Record<string, (...args: unknown[]) => unknown> = {}) {
  const calls: Call[] = [];
  const rec =
    (name: string) =>
    (...args: unknown[]) => {
      calls.push([name, args]);
      overrides[name]?.(...args);
    };
  const methods = [
    'setTransform', 'fillRect', 'save', 'restore', 'transform',
    'beginPath', 'closePath', 'moveTo', 'lineTo', 'arcTo', 'rect',
    'arc', 'ellipse', 'fill', 'stroke', 'setLineDash', 'fillText', 'strokeText',
  ];
  const ctx: Record<string, unknown> = {};
  for (const m of methods) ctx[m] = rec(m);
  const of = (name: string): unknown[][] => calls.filter(([n]) => n === name).map(([, a]) => a);
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls, of };
}

function draw(ctx: CanvasRenderingContext2D, commands: DrawCommand[]): void {
  drawToCanvas2D(ctx, commands, 100, 100, '#fff', 1);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Canvas2D ellipse/arc', () => {
  it('paints an ellipse via ctx.ellipse and fills it', () => {
    const m = mockCtx();
    const c: EllipseCommand = { kind: 'ellipse', cx: 10, cy: 20, rx: 8, ry: 5, fill: '#f00', ...base };
    draw(m.ctx, [c]);
    expect(m.of('ellipse')).toEqual([[10, 20, 8, 5, 0, 0, TAU]]);
    expect(m.of('fill')).toHaveLength(1);
  });

  it('paints an open arc via ctx.arc (stroke only, no center moveTo)', () => {
    const m = mockCtx();
    const c: ArcCommand = { kind: 'arc', cx: 5, cy: 5, radius: 4, start: 0, end: Math.PI / 2, stroke: '#000', ...base };
    draw(m.ctx, [c]);
    expect(m.of('arc')).toEqual([[5, 5, 4, 0, Math.PI / 2]]);
    expect(m.of('moveTo')).toHaveLength(0);
    expect(m.of('stroke')).toHaveLength(1);
    expect(m.of('fill')).toHaveLength(0); // no fill set → no fill call
  });

  it('paints a sector as moveTo(center) + arc + closePath, filled', () => {
    const m = mockCtx();
    const c: ArcCommand = { kind: 'arc', cx: 5, cy: 5, radius: 4, start: 0, end: 1, sector: true, fill: '#0f0', ...base };
    draw(m.ctx, [c]);
    expect(m.of('moveTo')).toEqual([[5, 5]]);
    expect(m.of('arc')).toEqual([[5, 5, 4, 0, 1]]);
    expect(m.of('closePath')).toHaveLength(1);
    expect(m.of('fill')).toHaveLength(1);
  });
});

describe('Canvas2D lineDash', () => {
  it('applies Paint.lineDash before the stroke and pops it with restore()', () => {
    const m = mockCtx();
    const c: RectCommand = { kind: 'rect', x: 0, y: 0, w: 10, h: 10, stroke: '#000', lineDash: [4, 2], ...base };
    draw(m.ctx, [c]);
    expect(m.of('setLineDash')).toEqual([[[4, 2]]]);
    const names = m.calls.map(([n]) => n);
    expect(names.indexOf('setLineDash')).toBeLessThan(names.indexOf('stroke'));
    expect(names.indexOf('stroke')).toBeLessThan(names.lastIndexOf('restore')); // restore resets the dash
  });

  it('never touches setLineDash for solid strokes', () => {
    const m = mockCtx();
    const c: RectCommand = { kind: 'rect', x: 0, y: 0, w: 10, h: 10, stroke: '#000', ...base };
    draw(m.ctx, [c]);
    expect(m.of('setLineDash')).toHaveLength(0);
  });
});

describe('Canvas2D robustness (skip + warn once, never throw)', () => {
  it('skips a negative-radius circle, warns once across frames, keeps painting the rest', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const m = mockCtx();
    const badCircle: CircleCommand = { kind: 'circle', cx: 5, cy: 5, radius: -3, fill: '#f00', ...base };
    const goodRect: RectCommand = { kind: 'rect', x: 0, y: 0, w: 10, h: 10, fill: '#00f', ...base };
    expect(() => {
      draw(m.ctx, [badCircle, goodRect]);
      draw(m.ctx, [badCircle, goodRect]); // second frame: same reason, no re-warn
    }).not.toThrow();
    expect(m.of('arc')).toHaveLength(0); // bad circle never painted
    expect(m.of('rect')).toHaveLength(2); // good rect painted both frames
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('circle');
  });

  it('skips a NaN rect without throwing and warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const m = mockCtx();
    const badRect: RectCommand = { kind: 'rect', x: NaN, y: 0, w: 10, h: 10, fill: '#f00', ...base };
    expect(() => draw(m.ctx, [badRect, badRect])).not.toThrow();
    expect(m.of('rect')).toHaveLength(0);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('rect');
  });

  it('isolates a command whose paint throws: warns once, later commands still paint', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const m = mockCtx({
      ellipse: () => {
        throw new Error('boom');
      },
    });
    const ellipse: EllipseCommand = { kind: 'ellipse', cx: 1, cy: 1, rx: 2, ry: 2, fill: '#f00', ...base };
    const rect: RectCommand = { kind: 'rect', x: 0, y: 0, w: 5, h: 5, fill: '#00f', ...base };
    expect(() => draw(m.ctx, [ellipse, rect])).not.toThrow();
    expect(m.of('rect')).toHaveLength(1);
    expect(m.of('restore')).toHaveLength(2); // ctx state popped for BOTH commands
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('ellipse');
  });
});

describe('SVG ellipse/arc/lineDash', () => {
  it('emits <ellipse> with center + semi-axes', () => {
    const c: EllipseCommand = { kind: 'ellipse', cx: 10, cy: 20, rx: 8, ry: 5, fill: '#f00', ...base };
    const svg = commandsToSVGInner([c]);
    expect(svg).toContain('<ellipse cx="10" cy="20" rx="8" ry="5"');
    expect(svg).toContain('fill="#f00"');
  });

  it('emits a quarter arc as a small-arc sweep-1 path', () => {
    const c: ArcCommand = { kind: 'arc', cx: 0, cy: 0, radius: 10, start: 0, end: Math.PI / 2, stroke: '#000', ...base };
    const svg = commandsToSVGInner([c]);
    // Start (10,0), clockwise (sweep 1) quarter turn (large-arc 0) to (0,10).
    expect(svg).toContain('d="M 10 0 A 10 10 0 0 1 0 10"');
    expect(svg).toContain('fill="none"');
  });

  it('sets large-arc-flag for sweeps over half a turn', () => {
    const c: ArcCommand = { kind: 'arc', cx: 0, cy: 0, radius: 10, start: 0, end: (3 * Math.PI) / 2, stroke: '#000', ...base };
    const svg = commandsToSVGInner([c]);
    expect(svg).toContain('d="M 10 0 A 10 10 0 1 1 0 -10"');
  });

  it('closes a sector through the center with L + Z', () => {
    const c: ArcCommand = { kind: 'arc', cx: 0, cy: 0, radius: 10, start: 0, end: Math.PI / 2, sector: true, fill: '#0f0', ...base };
    const svg = commandsToSVGInner([c]);
    expect(svg).toContain('d="M 0 0 L 10 0 A 10 10 0 0 1 0 10 Z"');
  });

  it('renders a full turn as two half-turn arcs (a lone A cannot close on itself)', () => {
    const c: ArcCommand = { kind: 'arc', cx: 0, cy: 0, radius: 10, start: 0, end: TAU, fill: '#f00', ...base };
    const svg = commandsToSVGInner([c]);
    expect(svg).toContain('M 10 0 A 10 10 0 1 1 -10 0 A 10 10 0 1 1 10 0 Z');
  });

  it('emits stroke-dasharray only when the stroke is dashed', () => {
    const dashed: RectCommand = { kind: 'rect', x: 0, y: 0, w: 10, h: 10, stroke: '#000', lineDash: [4, 2], ...base };
    const solid: RectCommand = { kind: 'rect', x: 0, y: 0, w: 10, h: 10, stroke: '#000', ...base };
    expect(commandsToSVGInner([dashed])).toContain('stroke-dasharray="4 2"');
    expect(commandsToSVGInner([solid])).not.toContain('stroke-dasharray');
  });

  it('skips malformed commands instead of emitting broken markup', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const bad: EllipseCommand = { kind: 'ellipse', cx: 0, cy: 0, rx: -1, ry: 5, fill: '#f00', ...base };
    const good: RectCommand = { kind: 'rect', x: 0, y: 0, w: 10, h: 10, fill: '#00f', ...base };
    const svg = commandsToSVGInner([bad, good]);
    expect(svg).not.toContain('<ellipse');
    expect(svg).toContain('<rect');
  });
});
