import { describe, it, expect } from 'vitest';
import { IDENTITY } from '../core/math';
import type { CircleCommand, PathCommand, RectCommand } from './commands';
import { commandsToSVGInner } from './svgString';
import {
  canvasGradient,
  dropShadow,
  glow,
  gradientDef,
  linearGradient,
  radialGradient,
  shadowDef,
  shapeBBox,
} from './paint';

const circle = (extra: Partial<CircleCommand> = {}): CircleCommand => ({
  kind: 'circle',
  cx: 0,
  cy: 0,
  radius: 10,
  transform: IDENTITY,
  z: 0,
  ...extra,
});

describe('gradient builders', () => {
  it('linearGradient at 90° runs top→bottom in bbox space', () => {
    const g = linearGradient(['#000', '#fff'], 90);
    expect(g.type).toBe('linear');
    expect(g.x1).toBeCloseTo(0.5);
    expect(g.y1).toBeCloseTo(0);
    expect(g.x2).toBeCloseTo(0.5);
    expect(g.y2).toBeCloseTo(1);
    // colors auto-space to 0 and 1
    expect(g.stops).toEqual([
      { offset: 0, color: '#000' },
      { offset: 1, color: '#fff' },
    ]);
  });

  it('linearGradient at 0° runs left→right', () => {
    const g = linearGradient(['#a', '#b'], 0);
    expect(g.x1).toBeCloseTo(0);
    expect(g.x2).toBeCloseTo(1);
    expect(g.y1).toBeCloseTo(0.5);
  });

  it('radialGradient defaults to a centered full-bbox circle', () => {
    const g = radialGradient(['#fff', '#000']);
    expect(g).toMatchObject({ type: 'radial', cx: 0.5, cy: 0.5, r: 0.5 });
  });

  it('is deterministic — same inputs, identical output', () => {
    expect(linearGradient(['#1', '#2', '#3'], 45)).toEqual(linearGradient(['#1', '#2', '#3'], 45));
  });
});

describe('SVG def emission', () => {
  it('gradientDef emits a linearGradient with stops', () => {
    const svg = gradientDef(linearGradient(['#000', '#fff'], 90), 'g1');
    expect(svg).toContain('<linearGradient id="g1"');
    expect(svg).toContain('stop-color="#000"');
    expect(svg).toContain('stop-color="#fff"');
  });

  it('shadowDef emits a feDropShadow filter', () => {
    const svg = shadowDef(dropShadow('#ff0', 8, 2, 3), 's1');
    expect(svg).toContain('<filter id="s1"');
    expect(svg).toContain('feDropShadow');
    expect(svg).toContain('flood-color="#ff0"');
  });

  it('a gradient command references its def via url(#…) and emits <defs>', () => {
    const inner = commandsToSVGInner([circle({ gradient: radialGradient(['#fff', '#000']) })]);
    expect(inner).toContain('<defs>');
    expect(inner).toContain('<radialGradient');
    expect(inner).toMatch(/fill="url\(#h0g\)"/);
  });

  it('a shadow command references a filter', () => {
    const inner = commandsToSVGInner([circle({ shadow: glow('#fff', 6) })]);
    expect(inner).toContain('<filter');
    expect(inner).toMatch(/filter="url\(#h0s\)"/);
  });

  it('salts def ids by prefix so composited panels never collide', () => {
    const cmd = circle({ gradient: linearGradient(['#000', '#fff']) });
    const a = commandsToSVGInner([cmd], 'p0');
    const b = commandsToSVGInner([cmd], 'p1');
    expect(a).toContain('id="p00g"');
    expect(a).toContain('url(#p00g)');
    expect(b).toContain('id="p10g"');
    // the two documents share no gradient id
    expect(a).not.toContain('p10g');
    expect(b).not.toContain('p00g');
  });

  it('shapes without paint effects emit no <defs>', () => {
    expect(commandsToSVGInner([circle({ fill: '#123' })])).not.toContain('<defs>');
  });
});

describe('shapeBBox', () => {
  it('rect + circle bounds', () => {
    expect(shapeBBox({ kind: 'rect', x: -5, y: -3, w: 10, h: 6, transform: IDENTITY, z: 0 } as RectCommand)).toEqual({ x: -5, y: -3, w: 10, h: 6 });
    expect(shapeBBox(circle({ radius: 4 }))).toEqual({ x: -4, y: -4, w: 8, h: 8 });
  });

  it('paths have no computable bbox (null)', () => {
    expect(shapeBBox({ kind: 'path', d: 'M0 0 L1 1', transform: IDENTITY, z: 0 } as PathCommand)).toBeNull();
  });
});

describe('canvasGradient', () => {
  // A minimal fake context recording the geometry it was handed.
  function fakeCtx() {
    const calls: Record<string, unknown[]> = {};
    const grad = { stops: [] as [number, string][], addColorStop(o: number, c: string) { this.stops.push([o, c]); } };
    return {
      grad,
      createLinearGradient(...a: number[]) { calls.linear = a; return grad as unknown as CanvasGradient; },
      createRadialGradient(...a: number[]) { calls.radial = a; return grad as unknown as CanvasGradient; },
      calls,
    };
  }

  it('maps a linear gradient into the shape bbox px space', () => {
    const ctx = fakeCtx();
    canvasGradient(ctx as never, linearGradient(['#000', '#fff'], 90), { x: 0, y: 0, w: 100, h: 200 });
    // 90° → x 0.5→0.5 (px 50), y 0→1 (px 0→200)
    const [ax, ay, bx, by] = ctx.calls.linear as number[];
    expect(ax).toBeCloseTo(50);
    expect(ay).toBeCloseTo(0);
    expect(bx).toBeCloseTo(50);
    expect(by).toBeCloseTo(200);
    expect(ctx.grad.stops).toEqual([[0, '#000'], [1, '#fff']]);
  });
});
