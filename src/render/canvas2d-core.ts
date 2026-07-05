// Shared Canvas2D drawing logic — consumed by Canvas2DRenderer and WebGL2Renderer.
// Extracted so the rasterization path is the SAME for both backends: WebGL2 uses
// Canvas2D as an offscreen rasterizer and uploads the result as a texture.

import { sortCommands, type DrawCommand, type Paint } from './commands';
import { canvasGradient, shapeBBox } from './paint';

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
 * Paint a sorted display list onto an existing Canvas2D context at `scale`
 * (device pixel ratio). The caller is responsible for sizing the canvas to
 * `width * scale` × `height * scale` before calling.
 */
export function drawToCanvas2D(
  ctx: Ctx2D,
  commands: DrawCommand[],
  width: number,
  height: number,
  background: string,
  scale: number,
): void {
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  for (const c of sortCommands(commands)) {
    ctx.save();
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
    paintCommand(ctx, c);
    ctx.restore();
  }
}
