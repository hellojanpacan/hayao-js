// Filmstrip: sampled frames of a run composed into ONE SVG contact sheet, so
// the "judge looks from a headless screenshot" step can see MOTION — pacing,
// readability during play, layering under load — not a single posed frame.
// Looks only, never correctness: state was already proven numerically.

import type { World } from '../world';
import { commandsToSVGInner } from '../render/svgString';

export interface FilmstripOptions {
  /** The game's view size (defineGame width/height). */
  width: number;
  height: number;
  background?: string;
  /** How many panels to sample across the run (default 12, min 2). */
  panels?: number;
  /** Panels per row (default 4). */
  cols?: number;
  /** Rendered width of one panel in px (default 320). */
  panelWidth?: number;
}

/**
 * Step `world` through per-frame actions, sampling evenly spaced panels
 * (always including the first and last frame), and return one standalone SVG.
 * Panel labels are frame numbers plus sim seconds at the 60Hz convention.
 */
export function renderFilmstrip(world: World, frames: string[][], opts: FilmstripOptions): string {
  const panels = Math.max(2, opts.panels ?? 12);
  const every = Math.max(1, Math.ceil(frames.length / (panels - 1)));
  const shots: { frame: number; inner: string }[] = [{ frame: 0, inner: commandsToSVGInner(world.render()) }];
  for (let i = 0; i < frames.length; i++) {
    world.step(frames[i]);
    if ((i + 1) % every === 0 || i === frames.length - 1) {
      shots.push({ frame: i + 1, inner: commandsToSVGInner(world.render()) });
    }
  }

  const cols = Math.max(1, opts.cols ?? 4);
  const pw = opts.panelWidth ?? 320;
  const ph = Math.round((pw * opts.height) / opts.width);
  const labelH = 18;
  const gap = 8;
  const cellW = pw + gap;
  const cellH = ph + labelH + gap;
  const rows = Math.ceil(shots.length / cols);
  const totalW = cols * cellW + gap;
  const totalH = rows * cellH + gap;
  const bg = opts.background ?? '#ffffff';

  const cells = shots
    .map((s, i) => {
      const x = gap + (i % cols) * cellW;
      const y = gap + Math.floor(i / cols) * cellH;
      return (
        `<g transform="translate(${x} ${y})">` +
        `<svg width="${pw}" height="${ph}" viewBox="0 0 ${opts.width} ${opts.height}">` +
        `<rect x="0" y="0" width="${opts.width}" height="${opts.height}" fill="${bg}"/>` +
        s.inner +
        `</svg>` +
        `<rect x="0" y="0" width="${pw}" height="${ph}" fill="none" stroke="#999" stroke-width="1"/>` +
        `<text x="${pw / 2}" y="${ph + 13}" font-size="11" font-family="monospace" text-anchor="middle" fill="#555">` +
        `f ${s.frame} · ${(s.frame / 60).toFixed(1)}s</text>` +
        `</g>`
      );
    })
    .join('');

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" width="${totalW}" height="${totalH}">` +
    `<rect x="0" y="0" width="${totalW}" height="${totalH}" fill="#f4f4f2"/>` +
    cells +
    `</svg>`
  );
}
