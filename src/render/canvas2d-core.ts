// Shared Canvas2D drawing logic — consumed by Canvas2DRenderer and WebGL2Renderer.
// Extracted so the rasterization path is the SAME for both backends: WebGL2 uses
// Canvas2D as an offscreen rasterizer and uploads the result as a texture.

import { sortCommands, type DrawCommand, type Paint } from './commands';
import { canvasGradient, invalidCommandReason, shapeBBox, warnCommandOnce } from './paint';
import { parseLightRun, splitByLightLayer, type ParsedLightRun } from './lightRun';

type Ctx2D = CanvasRenderingContext2D;

function fillFor(ctx: Ctx2D, c: DrawCommand): string | CanvasGradient | undefined {
  const p = c as Paint;
  if (p.gradient) {
    const bbox = shapeBBox(c);
    if (bbox && bbox.w > 0 && bbox.h > 0) return canvasGradient(ctx, p.gradient, bbox);
    const stops = p.gradient.stops;
    return stops.length ? stops[stops.length - 1].color : p.fill;
  }
  return p.fill;
}

function applyStroke(ctx: Ctx2D, c: DrawCommand): void {
  const fill = fillFor(ctx, c);
  if (fill && fill !== 'none') {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (c.stroke) {
    ctx.strokeStyle = c.stroke;
    ctx.lineWidth = c.strokeWidth ?? 1;
    if (c.round) {
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
    }
    ctx.stroke();
  }
}

function roundRectPath(ctx: Ctx2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function paintCommand(ctx: Ctx2D, c: DrawCommand): void {
  switch (c.kind) {
    case 'rect':
      ctx.beginPath();
      if (c.r) roundRectPath(ctx, c.x, c.y, c.w, c.h, c.r);
      else ctx.rect(c.x, c.y, c.w, c.h);
      applyStroke(ctx, c);
      break;
    case 'circle':
      ctx.beginPath();
      ctx.arc(c.cx, c.cy, c.radius, 0, Math.PI * 2);
      applyStroke(ctx, c);
      break;
    case 'ellipse':
      ctx.beginPath();
      ctx.ellipse(c.cx, c.cy, c.rx, c.ry, 0, 0, Math.PI * 2);
      applyStroke(ctx, c);
      break;
    case 'arc':
      // Angles are radians, clockwise from +x (y-down screen convention) —
      // exactly ctx.arc's default direction. A sector closes through the center.
      ctx.beginPath();
      if (c.sector) ctx.moveTo(c.cx, c.cy);
      ctx.arc(c.cx, c.cy, c.radius, c.start, c.end);
      if (c.sector) ctx.closePath();
      applyStroke(ctx, c);
      break;
    case 'poly':
      ctx.beginPath();
      for (let i = 0; i < c.points.length; i += 2) {
        if (i === 0) ctx.moveTo(c.points[i], c.points[i + 1]);
        else ctx.lineTo(c.points[i], c.points[i + 1]);
      }
      if (c.closed) ctx.closePath();
      applyStroke(ctx, c);
      break;
    case 'path': {
      const p = new Path2D(c.d);
      const fill = fillFor(ctx, c);
      if (fill && fill !== 'none') {
        ctx.fillStyle = fill;
        ctx.fill(p);
      }
      if (c.stroke) {
        ctx.strokeStyle = c.stroke;
        ctx.lineWidth = c.strokeWidth ?? 1;
        if (c.round) {
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
        }
        ctx.stroke(p);
      }
      break;
    }
    case 'text':
      ctx.font = `${c.weight ?? 400} ${c.size}px ${c.font ?? 'sans-serif'}`;
      ctx.textAlign = c.align ?? 'left';
      ctx.textBaseline = 'middle';
      // Stroke first so the outline frames the glyph (matches SVG paint-order="stroke").
      if (c.stroke) {
        ctx.strokeStyle = c.stroke;
        ctx.lineWidth = c.strokeWidth ?? 1;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeText(c.text, c.x, c.y);
      }
      ctx.fillStyle = c.fill ?? '#000';
      ctx.fillText(c.text, c.x, c.y);
      break;
    case 'image':
      break; // async images omitted in this rasterizer version
  }
}

/**
 * Paint one command with its full Paint state (transform/alpha/shadow/dash/blend)
 * inside a save/restore, isolating it from siblings. Returns silently on
 * malformed geometry (warn-once) so a bad draw never poisons the path state.
 */
function paintOne(ctx: Ctx2D, c: DrawCommand): void {
  const bad = invalidCommandReason(c);
  if (bad) {
    warnCommandOnce(c.kind, bad, c);
    return;
  }
  ctx.save();
  try {
    const t = c.transform;
    ctx.transform(t.a, t.b, t.c, t.d, t.e, t.f);
    ctx.globalAlpha = (c as Paint).opacity ?? 1;
    const sh = (c as Paint).shadow;
    if (sh) {
      ctx.shadowColor = sh.color;
      ctx.shadowBlur = sh.blur;
      ctx.shadowOffsetX = sh.dx ?? 0;
      ctx.shadowOffsetY = sh.dy ?? 0;
    }
    const dash = (c as Paint).lineDash;
    // setLineDash is part of the saved drawing state — restore() resets it.
    if (dash && dash.length) ctx.setLineDash(dash);
    // Blend mode (lighting run / any multiply|screen command) — part of the
    // saved state, so restore() resets it to source-over for the next command.
    if (c.blend) ctx.globalCompositeOperation = c.blend;
    paintCommand(ctx, c);
  } catch (err) {
    // Per-command isolation: one bad draw must never kill the render loop.
    warnCommandOnce(c.kind, 'paint threw', err);
  }
  ctx.restore();
}

// ── Light-buffer scratch, cached per ctx ────────────────────────────
// A lit frame composites the light run through an OFFSCREEN buffer (so shadow
// quads can `destination-out` the pool without touching the world) then
// multiplies that buffer over the frame. The buffer + a per-light scratch are
// cached on a WeakMap keyed by ctx so they are not reallocated every frame.
interface LightBuffers {
  buffer: HTMLCanvasElement | OffscreenCanvas;
  scratch: HTMLCanvasElement | OffscreenCanvas;
  w: number;
  h: number;
}
const lightBufferCache = new WeakMap<Ctx2D, LightBuffers>();

function makeCanvas(ctx: Ctx2D, w: number, h: number): HTMLCanvasElement | OffscreenCanvas | null {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const doc = ctx.canvas.ownerDocument;
  if (doc && typeof doc.createElement === 'function') {
    const el = doc.createElement('canvas');
    el.width = w;
    el.height = h;
    return el;
  }
  return null;
}

function lightBuffers(ctx: Ctx2D, w: number, h: number): LightBuffers | null {
  const cached = lightBufferCache.get(ctx);
  if (cached && cached.w === w && cached.h === h) return cached;
  const buffer = makeCanvas(ctx, w, h);
  const scratch = makeCanvas(ctx, w, h);
  if (!buffer || !scratch) return null;
  buffer.width = w;
  buffer.height = h;
  scratch.width = w;
  scratch.height = h;
  const bufs: LightBuffers = { buffer, scratch, w, h };
  lightBufferCache.set(ctx, bufs);
  return bufs;
}

/**
 * Composite a parsed light run over the world already on `ctx`, using an
 * offscreen buffer at `scale`. Each pool is drawn into the scratch, its shadow
 * quads erase it with `destination-out`, and the scratch is added into the
 * buffer with `'lighter'`; the buffer (started from the ambient darkness) is
 * finally multiplied over the frame. Returns false when no buffer is available
 * (headless / no OffscreenCanvas + no document) so the caller flat-blends.
 */
function compositeLightRun(ctx: Ctx2D, parsed: ParsedLightRun, width: number, height: number, scale: number, originX: number, originY: number): boolean {
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const bufs = lightBuffers(ctx, w, h);
  if (!bufs) return false;
  const bctx = bufs.buffer.getContext('2d') as Ctx2D | null;
  const sctx = bufs.scratch.getContext('2d') as Ctx2D | null;
  if (!bctx || !sctx) return false;
  // Every buffer shares the design→device transform of the main frame (scale +
  // the view-box origin) so the multiply at the end lands pixel-aligned.
  const ox = -originX * scale;
  const oy = -originY * scale;

  // Buffer starts as the ambient darkness (the level the pools lift out of).
  bctx.setTransform(1, 0, 0, 1, 0, 0);
  bctx.globalCompositeOperation = 'source-over';
  bctx.clearRect(0, 0, w, h);
  bctx.setTransform(scale, 0, 0, scale, ox, oy);
  paintOne(bctx, { ...parsed.ambient, blend: undefined });

  for (const light of parsed.lights) {
    sctx.setTransform(1, 0, 0, 1, 0, 0);
    sctx.globalCompositeOperation = 'source-over';
    sctx.clearRect(0, 0, w, h);
    sctx.setTransform(scale, 0, 0, scale, ox, oy);
    // Pool without the screen blend — we accumulate into the buffer with 'lighter'.
    paintOne(sctx, { ...light.circle, blend: undefined });
    // Shadow quads erase the pool where the light is occluded.
    for (const q of light.shadows) {
      sctx.save();
      const t = q.transform;
      sctx.setTransform(scale, 0, 0, scale, ox, oy);
      sctx.transform(t.a, t.b, t.c, t.d, t.e, t.f);
      sctx.globalCompositeOperation = 'destination-out';
      sctx.globalAlpha = (q as Paint).opacity ?? 1;
      paintCommand(sctx, { ...q, blend: undefined, fill: '#000000' });
      sctx.restore();
    }
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.globalCompositeOperation = 'lighter';
    bctx.globalAlpha = 1;
    bctx.drawImage(bufs.scratch as CanvasImageSource, 0, 0);
  }

  // Multiply the accumulated light buffer over the world frame.
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 1;
  ctx.drawImage(bufs.buffer as CanvasImageSource, 0, 0);
  ctx.restore();
  ctx.setTransform(scale, 0, 0, scale, ox, oy);
  ctx.globalCompositeOperation = 'source-over';
  return true;
}

/**
 * Paint a sorted display list onto an existing Canvas2D context at `scale`
 * (device pixel ratio). The caller is responsible for sizing the canvas to
 * `width * scale` × `height * scale` before calling.
 *
 * A lighting run (commands at `LAYER_LIGHT`) is composited through an offscreen
 * buffer between the world and HUD passes: world → light buffer (multiply) →
 * HUD. When no light run is present this is exactly the old single-pass paint.
 */
export function drawToCanvas2D(
  ctx: Ctx2D,
  commands: DrawCommand[],
  width: number,
  height: number,
  background: string,
  scale: number,
  originX = 0,
  originY = 0,
): void {
  // `width×height` is the painted VIEW box; `origin` is its top-left in design
  // space (non-zero only under `fit: 'bleed'`, where the safe box is centered in
  // a larger view). The translate maps design coords → device pixels for all passes.
  const ox = -originX * scale;
  const oy = -originY * scale;
  ctx.setTransform(scale, 0, 0, scale, ox, oy);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = background;
  ctx.fillRect(originX, originY, width, height);

  const sorted = sortCommands(commands);
  const { below, light, above } = splitByLightLayer(sorted);

  // World pass (below the light layer) — unchanged.
  for (const c of below) paintOne(ctx, c);

  // Light pass: parse + composite through a buffer; on any failure (empty run,
  // unparseable run, no buffer available) paint the run flat honouring `blend`
  // so no command is ever dropped.
  if (light.length) {
    const parsed = parseLightRun(light);
    const composited = parsed ? compositeLightRun(ctx, parsed, width, height, scale, originX, originY) : false;
    if (!composited) {
      ctx.setTransform(scale, 0, 0, scale, ox, oy);
      for (const c of light) paintOne(ctx, c);
      ctx.setTransform(scale, 0, 0, scale, ox, oy);
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  // HUD pass (above the light layer) — never darkened.
  ctx.setTransform(scale, 0, 0, scale, ox, oy);
  for (const c of above) paintOne(ctx, c);
}
