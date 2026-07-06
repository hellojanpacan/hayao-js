// Pure display-list → SVG markup. No DOM required, so it runs in Node — which
// means the engine can produce a *vector screenshot* of any frame headlessly
// (an AI-first win: judge layout from a file, no browser, no GPU, no fuzz).
// The DOM SvgRenderer reuses this; tests assert on it directly.

import { sortCommands, type ArcCommand, type DrawCommand, type Paint, type PolyCommand } from './commands';
import { gradientDef, invalidCommandReason, shadowDef, warnCommandOnce } from './paint';
import { parseLightRun, splitByLightLayer, type ParsedLightRun } from './lightRun';
import { TAU, type Transform } from '../core/math';
import { dcos, dsin } from '../core/dmath';

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
    if (p.lineDash && p.lineDash.length) parts.push(`stroke-dasharray="${p.lineDash.map(n).join(' ')}"`);
  }
  if (p.opacity !== undefined && p.opacity !== 1) parts.push(`opacity="${n(p.opacity)}"`);
  if (filterId) parts.push(`filter="url(#${filterId})"`);
  // Blend mode (lighting run / any multiply|screen command) → CSS mix-blend-mode.
  if (p.blend) parts.push(`style="mix-blend-mode:${p.blend}"`);
  return parts.join(' ');
}

function escapeText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Path data for an arc/sector. Angles are radians, clockwise from +x in the
 * y-down screen convention — which is SVG sweep-flag 1. Sweeps over half a
 * turn set large-arc-flag; a full turn splits into two half-turn A commands
 * (a single A whose endpoints coincide renders nothing).
 */
function arcPathData(c: ArcCommand): string {
  const r = c.radius;
  const x0 = c.cx + dcos(c.start) * r;
  const y0 = c.cy + dsin(c.start) * r;
  const raw = c.end - c.start;
  let sweep = ((raw % TAU) + TAU) % TAU;
  if (sweep === 0 && raw !== 0) sweep = TAU;
  if (sweep >= TAU - 1e-9) {
    const xh = c.cx + dcos(c.start + Math.PI) * r;
    const yh = c.cy + dsin(c.start + Math.PI) * r;
    return `M ${n(x0)} ${n(y0)} A ${n(r)} ${n(r)} 0 1 1 ${n(xh)} ${n(yh)} A ${n(r)} ${n(r)} 0 1 1 ${n(x0)} ${n(y0)} Z`;
  }
  const x1 = c.cx + dcos(c.start + sweep) * r;
  const y1 = c.cy + dsin(c.start + sweep) * r;
  const large = sweep > Math.PI ? 1 : 0;
  const a = `A ${n(r)} ${n(r)} 0 ${large} 1 ${n(x1)} ${n(y1)}`;
  return c.sector
    ? `M ${n(c.cx)} ${n(c.cy)} L ${n(x0)} ${n(y0)} ${a} Z`
    : `M ${n(x0)} ${n(y0)} ${a}`;
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
    case 'ellipse':
      return `<ellipse cx="${n(c.cx)}" cy="${n(c.cy)}" rx="${n(c.rx)}" ry="${n(c.ry)}" ${tf} ${paint}/>`;
    case 'arc':
      return `<path d="${arcPathData(c)}" ${tf} ${paint}/>`;
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
      // Text carries Paint, so an explicit `stroke` outlines the glyph.
      // paint-order="stroke" lays the outline UNDER the fill so a thick stroke
      // frames the letter instead of eating into it — the crisp readable-on-any-
      // background look consumers otherwise faked with stacked halo copies.
      const stroke = c.stroke
        ? ` stroke="${c.stroke}" stroke-width="${n(c.strokeWidth ?? 1)}" paint-order="stroke"${c.round ? ' stroke-linejoin="round"' : ''}`
        : '';
      const opacity = c.opacity !== undefined && c.opacity !== 1 ? ` opacity="${n(c.opacity)}"` : '';
      return `<text x="${n(c.x)}" y="${n(c.y)}" font-size="${n(c.size)}" text-anchor="${anchor}" dominant-baseline="middle"${font}${weight} fill="${fill}"${stroke}${opacity}${filter} ${tf}>${escapeText(c.text)}</text>`;
    }
    case 'image': {
      const filter = filterId ? ` filter="url(#${filterId})"` : '';
      return `<image href="${c.href}" x="${n(c.x)}" y="${n(c.y)}" width="${n(c.w)}" height="${n(c.h)}" ${tf}${c.opacity !== undefined && c.opacity !== 1 ? ` opacity="${n(c.opacity)}"` : ''}${filter}/>`;
    }
  }
}

// Emit a poly's `points` attribute value (flat [x,y,…] → "x,y x,y …").
function polyPoints(p: PolyCommand): string {
  const pts: string[] = [];
  for (let i = 0; i < p.points.length; i += 2) pts.push(`${n(p.points[i])},${n(p.points[i + 1])}`);
  return pts.join(' ');
}

/**
 * The PRIMARY light-run encoding (validated by scripts/lighting-resvg.test.mjs):
 *   <g style="mix-blend-mode:multiply; isolation:isolate">   ← the light buffer
 *     <rect …ambient darkness…/>
 *     <g style="mix-blend-mode:screen" mask="url(#…)">        ← one per light
 *       <circle fill="url(#…radial…)"/>
 *     </g>
 *   </g>
 * The per-light mask is a white rect (fully lit) with the shadow polys painted
 * black (fully occluded); a soft penumbra poly is 50% grey (half-darkened). All
 * def ids are salted by `idPrefix` so several panels share one document safely.
 */
function lightRunToSVG(parsed: ParsedLightRun, defs: string[], idPrefix: string, viewW: number, viewH: number): string {
  const a = parsed.ambient;
  const ambientRect = `<rect x="${n(a.x)}" y="${n(a.y)}" width="${n(a.w)}" height="${n(a.h)}" transform="${matrix(a.transform)}" fill="${a.fill ?? '#000'}"/>`;
  const groups: string[] = [];
  parsed.lights.forEach((light, li) => {
    const c = light.circle;
    const gid = `${idPrefix}lg${li}`;
    if (c.gradient) defs.push(gradientDef(c.gradient, gid));
    const fill = c.gradient ? `url(#${gid})` : (c.fill ?? '#fff');
    const circle = `<circle cx="${n(c.cx)}" cy="${n(c.cy)}" r="${n(c.radius)}" transform="${matrix(c.transform)}" fill="${fill}"/>`;
    // Mask: white = lit everywhere, shadow polys black (or grey for penumbra).
    const mid = `${idPrefix}lm${li}`;
    const shadowPolys = light.shadows
      .map((s) => {
        const grey = s.opacity !== undefined && s.opacity !== 1 ? Math.round((1 - s.opacity) * 255) : 0;
        const shade = `#${grey.toString(16).padStart(2, '0').repeat(3)}`;
        return `<polygon points="${polyPoints(s)}" transform="${matrix(s.transform)}" fill="${shade}"/>`;
      })
      .join('');
    if (light.shadows.length) {
      defs.push(
        `<mask id="${mid}"><rect x="0" y="0" width="${n(viewW)}" height="${n(viewH)}" fill="#ffffff"/>${shadowPolys}</mask>`,
      );
      groups.push(`<g style="mix-blend-mode:screen" mask="url(#${mid})">${circle}</g>`);
    } else {
      groups.push(`<g style="mix-blend-mode:screen">${circle}</g>`);
    }
  });
  return `<g style="mix-blend-mode:multiply; isolation:isolate">${ambientRect}${groups.join('')}</g>`;
}

/**
 * Inner SVG markup for a display list (no wrapping <svg>). `idPrefix` salts the
 * ids of any gradient/shadow/mask <defs> so several inner markups can share one
 * SVG document (e.g. a filmstrip) without their `url(#…)` references colliding.
 *
 * A lighting run (commands at `LAYER_LIGHT`) is emitted as the nested-blend group
 * between the world and HUD passes. An EMPTY or unparseable run falls through the
 * normal per-command path (honouring each command's `blend` via mix-blend-mode),
 * so a lit-layer-free frame is byte-identical to before this feature.
 */
export function commandsToSVGInner(commands: DrawCommand[], idPrefix = 'h', viewW = 1280, viewH = 720): string {
  const defs: string[] = [];
  const sorted = sortCommands(commands);
  const { below, light, above } = splitByLightLayer(sorted);
  const parsed = light.length ? parseLightRun(light) : null;

  // When the run parses, emit below + light-group + above; otherwise fall back to
  // the flat per-command path over the whole (sorted) list — never drop a command.
  const flatList = parsed ? [...below, ...above] : sorted;

  const render = (list: DrawCommand[], offset: number): string =>
    list
      .map((c, i) => {
        const bad = invalidCommandReason(c);
        if (bad) {
          warnCommandOnce(c.kind, bad, c);
          return '';
        }
        return commandToSVG(c, defs, `${idPrefix}${offset + i}`);
      })
      .join('');

  let body: string;
  if (parsed) {
    body =
      render(below, 0) +
      lightRunToSVG(parsed, defs, idPrefix, viewW, viewH) +
      render(above, below.length);
  } else {
    body = render(flatList, 0);
  }
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
    commandsToSVGInner(commands, 'h', width, height) +
    `</svg>`
  );
}
