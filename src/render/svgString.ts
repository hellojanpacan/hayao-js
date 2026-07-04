// Pure display-list → SVG markup. No DOM required, so it runs in Node — which
// means the engine can produce a *vector screenshot* of any frame headlessly
// (an AI-first win: judge layout from a file, no browser, no GPU, no fuzz).
// The DOM SvgRenderer reuses this; tests assert on it directly.

import { sortCommands, type DrawCommand, type Paint } from './commands';
import { gradientDef, shadowDef } from './paint';
import type { Transform } from '../core/math';

const n = (v: number): string => (Number.isInteger(v) ? String(v) : (Math.round(v * 1000) / 1000).toString());

function matrix(t: Transform): string {
  return `matrix(${n(t.a)} ${n(t.b)} ${n(t.c)} ${n(t.d)} ${n(t.e)} ${n(t.f)})`;
}

function paintAttrs(p: Paint, fillOverride?: string, filterId?: string): string {
  const parts: string[] = [];
  parts.push(`fill="${fillOverride ?? p.fill ?? 'none'}"`);
  if (p.stroke) {
    parts.push(`stroke="${p.stroke}"`);
    parts.push(`stroke-width="${n(p.strokeWidth ?? 1)}"`);
    if (p.round) parts.push('stroke-linejoin="round" stroke-linecap="round"');
  }
  if (p.opacity !== undefined && p.opacity !== 1) parts.push(`opacity="${n(p.opacity)}"`);
  if (filterId) parts.push(`filter="url(#${filterId})"`);
  return parts.join(' ');
}

function escapeText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// A command may carry a gradient fill and/or a soft shadow. Both become entries
// in <defs> with ids salted by `idBase` (unique per command, per render) so
// multiple panels composited into one document never cross-reference.
function commandToSVG(c: DrawCommand, defs: string[], idBase: string): string {
  const tf = `transform="${matrix(c.transform)}"`;
  let fillOverride: string | undefined;
  let filterId: string | undefined;
  if (c.gradient) {
    const id = `${idBase}g`;
    defs.push(gradientDef(c.gradient, id));
    fillOverride = `url(#${id})`;
  }
  if (c.shadow) {
    filterId = `${idBase}s`;
    defs.push(shadowDef(c.shadow, filterId));
  }
  const paint = paintAttrs(c, fillOverride, filterId);
  switch (c.kind) {
    case 'rect':
      return `<rect x="${n(c.x)}" y="${n(c.y)}" width="${n(c.w)}" height="${n(c.h)}"${c.r ? ` rx="${n(c.r)}"` : ''} ${tf} ${paint}/>`;
    case 'circle':
      return `<circle cx="${n(c.cx)}" cy="${n(c.cy)}" r="${n(c.radius)}" ${tf} ${paint}/>`;
    case 'poly': {
      const pts = [];
      for (let i = 0; i < c.points.length; i += 2) pts.push(`${n(c.points[i])},${n(c.points[i + 1])}`);
      const tag = c.closed ? 'polygon' : 'polyline';
      return `<${tag} points="${pts.join(' ')}" ${tf} ${paint}/>`;
    }
    case 'path':
      return `<path d="${c.d}" ${tf} ${paint}/>`;
    case 'text': {
      const anchor = c.align === 'center' ? 'middle' : c.align === 'right' ? 'end' : 'start';
      const font = c.font ? ` font-family="${c.font}"` : '';
      const weight = c.weight ? ` font-weight="${c.weight}"` : '';
      const fill = fillOverride ?? c.fill ?? '#000';
      const filter = filterId ? ` filter="url(#${filterId})"` : '';
      return `<text x="${n(c.x)}" y="${n(c.y)}" font-size="${n(c.size)}" text-anchor="${anchor}" dominant-baseline="middle"${font}${weight} fill="${fill}"${c.opacity !== undefined && c.opacity !== 1 ? ` opacity="${n(c.opacity)}"` : ''}${filter} ${tf}>${escapeText(c.text)}</text>`;
    }
    case 'image': {
      const filter = filterId ? ` filter="url(#${filterId})"` : '';
      return `<image href="${c.href}" x="${n(c.x)}" y="${n(c.y)}" width="${n(c.w)}" height="${n(c.h)}" ${tf}${c.opacity !== undefined && c.opacity !== 1 ? ` opacity="${n(c.opacity)}"` : ''}${filter}/>`;
    }
  }
}

/**
 * Inner SVG markup for a display list (no wrapping <svg>). `idPrefix` salts the
 * ids of any gradient/shadow <defs> so several inner markups can share one SVG
 * document (e.g. a filmstrip) without their `url(#…)` references colliding.
 */
export function commandsToSVGInner(commands: DrawCommand[], idPrefix = 'h'): string {
  const defs: string[] = [];
  const body = sortCommands(commands)
    .map((c, i) => commandToSVG(c, defs, `${idPrefix}${i}`))
    .join('');
  return (defs.length ? `<defs>${defs.join('')}</defs>` : '') + body;
}

/** A complete, standalone SVG document string for a frame — a headless screenshot. */
export function renderToSVGString(
  commands: DrawCommand[],
  width: number,
  height: number,
  background = '#ffffff',
): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">` +
    `<rect x="0" y="0" width="${width}" height="${height}" fill="${background}"/>` +
    commandsToSVGInner(commands) +
    `</svg>`
  );
}
