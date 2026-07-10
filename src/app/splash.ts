// The boot cover: an animated reveal of the Hayao logo, drawn as a pure
// DrawCommand[] so it renders on any backend and can be verified headlessly.
// Kept out of browser.ts so the lockup math + transition is unit-testable
// without a DOM (the one DOM touch — measuring the wordmark — is guarded).

import type { DrawCommand } from '../render/commands';
import type { SplashConfig, GameDefinition } from './game';

// The Hayao mark — copied verbatim from web/src/components/Logo.astro (the "Regalia"
// crown crossed by a navy rule) so the boot cover shows the SAME logo as the site nav.
// Authored in a "2 2 20 20" viewBox; keep in sync if the brand mark ever changes.
export const MARK_CROWN =
  'm21.8382 11.1263 -0.2292 2.4353c-0.3777 4.0126 -0.5665 6.0189 -1.7491 7.2286C18.6773 22 16.9048 22 13.3599 22h-2.7198c-3.54493 0 -5.31739 0 -6.50001 -1.2098 -1.18261 -1.2097 -1.37144 -3.216 -1.74909 -7.2286l-0.22919 -2.4353c-0.18001 -1.9126 -0.27001 -2.86891 0.05718 -3.26423 0.17699 -0.21384 0.41767 -0.34487 0.675 -0.36747 0.47569 -0.04178 1.07309 0.6383 2.26788 1.99847 0.6179 0.70343 0.92685 1.05513 1.2715 1.10963 0.19097 0.0301 0.38555 -0.0009 0.56189 -0.0896 0.31825 -0.1602 0.53044 -0.59498 0.95481 -1.46458l2.23683 -4.58366C10.9888 2.82162 11.3898 2 12 2c0.6102 0 1.0112 0.82162 1.8131 2.46485l2.2368 4.58366c0.4244 0.86961 0.6366 1.30439 0.9548 1.46459 0.1764 0.0887 0.371 0.1197 0.5619 0.0896 0.3447 -0.0545 0.6536 -0.4062 1.2715 -1.10963 1.1948 -1.36017 1.7922 -2.04025 2.2679 -1.99847 0.2573 0.0226 0.498 0.15363 0.675 0.36747 0.3272 0.39532 0.2372 1.35163 0.0572 3.26423Z';
export const MARK_RULE =
  'M8.25 18c0 -0.4142 0.33579 -0.75 0.75 -0.75h6c0.4142 0 0.75 0.3358 0.75 0.75s-0.3358 0.75 -0.75 0.75H9c-0.41421 0 -0.75 -0.3358 -0.75 -0.75Z';
const MARK_GOLD = '#e59500'; //  crown
const MARK_INK = '#29335c'; //   rule + "Hayao"
const MARK_MUTED = '#8b90a6'; // ".js"
const SPLASH_GROUND = '#f4f6fb'; // Regalia mist — a light ground the brand mark reads true on
// single-quote the family so it nests safely inside a double-quoted SVG font-family attribute
const SPLASH_FONT = "'Overpass', system-ui, sans-serif"; // the site's display face, then a system fallback

const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);
const easeOut = (t: number): number => 1 - (1 - t) * (1 - t) * (1 - t);
const easeIn = (t: number): number => t * t * t;

/** Blend two #rrggbb colors (t in 0..1). Cosmetic only — Math.round is IEEE-exact. */
export function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (sh: number): number => {
    const x = (pa >> sh) & 255;
    const y = (pb >> sh) & 255;
    return Math.round(x + (y - x) * t);
  };
  return '#' + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);
}

/**
 * Build the animated boot cover: the Hayao logo (crown mark + "Hayao.js" wordmark,
 * exactly the site-nav lockup) fades and rises into the centre of the pane, holds,
 * then lifts and dissolves toward the game's background as the cold-open ends — so
 * the reveal, the chime, and the hand-off to the game are one motion. The wordmark
 * is measured once (via a canvas) so the mark+text lockup centres like the nav;
 * where there is no canvas (headless) it falls back to an estimate.
 *
 * Returns a per-frame function `(elapsed, total) => DrawCommand[]`, both in ms.
 */
export function makeSplash(cfg: SplashConfig, def: GameDefinition, width: number, height: number): (elapsed: number, total: number) => DrawCommand[] {
  const gameBg = def.background ?? '#f3ecdb';
  const ground = cfg.palette?.bg ?? SPLASH_GROUND;

  const markSize = Math.round(height * 0.13);
  const wordSize = Math.round(markSize * 0.92);
  const gap = Math.round(markSize * 0.34);

  // Measure the wordmark so the horizontal lockup centres exactly (no font metrics
  // in the pure command layer). Falls back to an estimate where canvas is absent.
  let wHayao = wordSize * 2.6;
  let wJs = wordSize * 1.05;
  try {
    const mc = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
    if (mc) {
      mc.font = `600 ${wordSize}px ${SPLASH_FONT}`;
      wHayao = mc.measureText('Hayao').width;
      wJs = mc.measureText('.js').width;
    }
  } catch {
    /* jsdom / no 2d context — keep the estimate */
  }

  const cx = width / 2;
  const cy = height / 2;
  const totalW = markSize + gap + wHayao + wJs;
  const originX = cx - totalW / 2;
  const markX = originX;
  const markY = cy - markSize / 2;
  const wordX = originX + markSize + gap;
  const s = markSize / 20; // the mark viewBox is 20 units wide
  const id = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

  return (elapsed: number, total: number): DrawCommand[] => {
    const fadeIn = Math.min(360, total * 0.42);
    const fadeOut = Math.min(280, total * 0.32);
    const holdEnd = Math.max(fadeIn, total - fadeOut);

    let op: number;
    let rise: number;
    let bg = ground;
    if (elapsed < fadeIn) {
      const t = easeOut(clamp01(elapsed / fadeIn));
      op = t;
      rise = (1 - t) * height * 0.028; // slide up into place
    } else if (elapsed < holdEnd) {
      op = 1;
      rise = 0;
    } else {
      const t = easeIn(clamp01((elapsed - holdEnd) / Math.max(1, fadeOut)));
      op = 1 - t;
      rise = -t * height * 0.02; // lift away
      bg = mixHex(ground, gameBg, t); // dissolve toward the game ground
    }

    const my = markY + rise;
    const baseline = cy + wordSize * 0.34 + rise; // vertical-centre the wordmark on cy
    const markT = { a: s, b: 0, c: 0, d: s, e: markX - 2 * s, f: my - 2 * s };

    return [
      { kind: 'rect', x: 0, y: 0, w: width, h: height, fill: bg, transform: id, z: 0 },
      { kind: 'path', d: MARK_CROWN, fill: MARK_GOLD, transform: markT, opacity: op, z: 1 },
      { kind: 'path', d: MARK_RULE, fill: MARK_INK, transform: markT, opacity: op, z: 2 },
      { kind: 'text', text: 'Hayao', x: wordX, y: baseline, size: wordSize, font: SPLASH_FONT, align: 'left', weight: 600, fill: MARK_INK, opacity: op, transform: id, z: 3 },
      { kind: 'text', text: '.js', x: wordX + wHayao, y: baseline, size: wordSize, font: SPLASH_FONT, align: 'left', weight: 600, fill: MARK_MUTED, opacity: op, transform: id, z: 3 },
    ];
  };
}
