import { describe, expect, it } from 'vitest';
import { clientToDesign, bleedViewBox, viewBoxToDesign, safeViewport, BLEED_MAX } from './renderer';
import { drawToCanvas2D } from './canvas2d-core';
import { LAYER_HUD, LAYER_LIGHT, type CircleCommand, type DrawCommand, type RectCommand } from './commands';

// A recording Canvas2D stub. `getContext` on any offscreen canvas returns null,
// so `drawToCanvas2D` cannot allocate a light buffer and takes the FLAT FALLBACK
// (paint the run in place honouring each command's blend). We log the ops that
// matter for asserting order + blend.
function stubCtx(): { ctx: CanvasRenderingContext2D; ops: string[] } {
  const ops: string[] = [];
  const noop = (): void => {};
  const ctx = {
    canvas: { ownerDocument: undefined, width: 200, height: 100 },
    setTransform: noop,
    transform: noop,
    save: noop,
    restore: noop,
    beginPath: noop,
    rect: (x: number, y: number, w: number, h: number) => ops.push(`rect ${x},${y},${w},${h} blend=${current.gco} fill=${current.fillStyle}`),
    arc: (cx: number, cy: number, r: number) => ops.push(`arc ${cx},${cy},${r} blend=${current.gco} fill=${current.fillStyle}`),
    ellipse: noop,
    moveTo: noop,
    lineTo: noop,
    arcTo: noop,
    closePath: noop,
    fill: noop,
    stroke: noop,
    fillRect: (x: number, y: number, w: number, h: number) => ops.push(`fillRect ${x},${y},${w},${h} fill=${current.fillStyle}`),
    setLineDash: noop,
    fillText: noop,
    strokeText: noop,
    drawImage: () => ops.push('drawImage'),
    clearRect: noop,
    createRadialGradient: () => ({ addColorStop: noop }),
    createLinearGradient: () => ({ addColorStop: noop }),
  } as unknown as CanvasRenderingContext2D & { gco: string; fillStyle: string };

  const current = { gco: 'source-over', fillStyle: '' };
  Object.defineProperty(ctx, 'globalCompositeOperation', {
    get: () => current.gco,
    set: (v: string) => { current.gco = v; },
  });
  Object.defineProperty(ctx, 'fillStyle', {
    get: () => current.fillStyle,
    set: (v: string) => { current.fillStyle = v; },
  });
  Object.defineProperty(ctx, 'globalAlpha', { get: () => 1, set: noop });
  Object.defineProperty(ctx, 'shadowColor', { set: noop, get: () => '' });
  Object.defineProperty(ctx, 'shadowBlur', { set: noop, get: () => 0 });
  Object.defineProperty(ctx, 'shadowOffsetX', { set: noop, get: () => 0 });
  Object.defineProperty(ctx, 'shadowOffsetY', { set: noop, get: () => 0 });
  Object.defineProperty(ctx, 'strokeStyle', { set: noop, get: () => '' });
  Object.defineProperty(ctx, 'lineWidth', { set: noop, get: () => 1 });
  return { ctx, ops };
}

const ID = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

describe('drawToCanvas2D — light-run split order + flat fallback', () => {
  it('paints below → light → above (world, then light run, then HUD)', () => {
    const world: RectCommand = { kind: 'rect', x: 1, y: 1, w: 2, h: 2, fill: '#111', transform: ID, z: 0 };
    const ambient: RectCommand = { kind: 'rect', x: 0, y: 0, w: 200, h: 100, fill: '#222', blend: 'multiply', transform: ID, z: 0, layer: LAYER_LIGHT };
    const hud: RectCommand = { kind: 'rect', x: 5, y: 5, w: 3, h: 3, fill: '#f00', transform: ID, z: 0, layer: LAYER_HUD };
    const { ctx, ops } = stubCtx();
    // Unordered input — sortCommands + split must still paint in band order.
    drawToCanvas2D(ctx, [hud, ambient, world], 200, 100, '#000', 1);
    const rects = ops.filter((o) => o.startsWith('rect ')).map((o) => o.split(' ')[1]);
    expect(rects).toEqual(['1,1,2,2', '0,0,200,100', '5,5,3,3']);
  });

  it('flat fallback honours each command blend (multiply ambient, screen pool)', () => {
    const ambient: RectCommand = { kind: 'rect', x: 0, y: 0, w: 200, h: 100, fill: '#222', blend: 'multiply', transform: ID, z: 0, layer: LAYER_LIGHT };
    const poolCmd: CircleCommand = { kind: 'circle', cx: 50, cy: 50, radius: 40, fill: '#fff', blend: 'screen', transform: ID, z: 0, layer: LAYER_LIGHT };
    const { ctx, ops } = stubCtx();
    drawToCanvas2D(ctx, [ambient, poolCmd] as DrawCommand[], 200, 100, '#000', 1);
    const ambientOp = ops.find((o) => o.startsWith('rect 0,0,200,100'));
    const poolOp = ops.find((o) => o.startsWith('arc '));
    expect(ambientOp).toContain('blend=multiply');
    expect(poolOp).toContain('blend=screen');
  });
});

describe('clientToDesign (letterbox inverse)', () => {
  it('is identity when the element exactly fits the design box', () => {
    const rect = { left: 0, top: 0, width: 1280, height: 720 };
    expect(clientToDesign(rect, 1280, 720, 640, 360)).toEqual({ x: 640, y: 360 });
    expect(clientToDesign(rect, 1280, 720, 0, 0)).toEqual({ x: 0, y: 0 });
  });

  it('undoes horizontal pillarboxing (element wider than design ratio)', () => {
    // 1440×720 element, 1280×720 design → scale 1, 80px bars left/right.
    const rect = { left: 0, top: 0, width: 1440, height: 720 };
    expect(clientToDesign(rect, 1280, 720, 80, 0)).toEqual({ x: 0, y: 0 });
    expect(clientToDesign(rect, 1280, 720, 720, 360)).toEqual({ x: 640, y: 360 });
  });

  it('undoes uniform scale and honours the element origin', () => {
    // Half-size element, offset 100,50 on screen.
    const rect = { left: 100, top: 50, width: 640, height: 360 };
    expect(clientToDesign(rect, 1280, 720, 100, 50)).toEqual({ x: 0, y: 0 });
    expect(clientToDesign(rect, 1280, 720, 420, 230)).toEqual({ x: 640, y: 360 });
  });
});

describe('bleedViewBox (fit: bleed view region)', () => {
  it('is the plain safe box when the container already matches the design ratio', () => {
    // 1800×1040 == 900×520 aspect → no growth, no offset.
    expect(bleedViewBox(1800, 1040, 900, 520)).toEqual({ minX: 0, minY: 0, width: 900, height: 520 });
  });

  it('grows width (and centers the safe box) for a wider container', () => {
    // 2.5 aspect: view width = 520×2.5 = 1300, safe box centered → minX −200.
    expect(bleedViewBox(1000, 400, 900, 520)).toEqual({ minX: -200, minY: 0, width: 1300, height: 520 });
  });

  it('grows height for a taller (portrait) container', () => {
    // Portrait, but past the cap → height stops at 520×BLEED_MAX, centered vertically.
    const vb = bleedViewBox(400, 800, 900, 520);
    expect(vb.width).toBe(900);
    expect(vb.height).toBeCloseTo(520 * BLEED_MAX, 6);
    expect(vb.minY).toBeCloseTo(-(520 * BLEED_MAX - 520) / 2, 6);
    expect(vb.minX).toBe(0);
  });

  it('caps growth at BLEED_MAX rather than stretch to a scenery desert', () => {
    const vb = bleedViewBox(3000, 400, 900, 520); // absurdly wide
    expect(vb.width).toBeCloseTo(900 * BLEED_MAX, 6);
  });
});

describe('viewBoxToDesign / safeViewport (offset view)', () => {
  const view = { minX: -200, minY: 0, width: 1300, height: 520 };
  const rect = { left: 0, top: 0, width: 1300, height: 520 };

  it('maps client px back through an offset bleed view', () => {
    expect(viewBoxToDesign(rect, view, 200, 0)).toEqual({ x: 0, y: 0 }); // safe-box top-left
    expect(viewBoxToDesign(rect, view, 1100, 520)).toEqual({ x: 900, y: 520 }); // safe-box bottom-right
    expect(viewBoxToDesign(rect, view, 0, 0)).toEqual({ x: -200, y: 0 }); // out in the scenery margin
  });

  it('reports the centered safe-box rect for overlay anchoring under bleed', () => {
    expect(safeViewport(rect, view, 900, 520)).toEqual({ x: 200, y: 0, width: 900, height: 520, scale: 1 });
  });

  it('reduces to the letterbox rect under contain (view == safe box)', () => {
    const contain = { minX: 0, minY: 0, width: 1280, height: 720 };
    expect(safeViewport({ width: 1440, height: 720 }, contain, 1280, 720)).toEqual({ x: 80, y: 0, width: 1280, height: 720, scale: 1 });
  });
});
