// The boot cover: an animated reveal of the Hayao logo, drawn as a pure
// DrawCommand[] so it renders on any backend and can be verified headlessly.
// The whole lockup — crown mark AND the "Hayao.js" wordmark — is outlined
// vector (no font, no DOM, no measuring), so it is deterministic and renders
// identically everywhere, from a bare embed to the site.

import type { DrawCommand } from '../render/commands';
import type { SplashConfig, GameDefinition } from './game';

// The Hayao logo — copied verbatim from web/src/components/logo.ts + the
// generated logo-wordmark.ts (the canonical definition: "Regalia" crown +
// "Hayao.js" outlined from Overpass 600) so the boot cover shows the SAME logo
// as the site, glyph for glyph. The engine package cannot depend on web/, so
// these are listed verbatim copies; regenerate with web/scripts/outline-logo.mjs
// and re-copy if the brand ever changes.
export const MARK_CROWN =
  'm21.8382 11.1263 -0.2292 2.4353c-0.3777 4.0126 -0.5665 6.0189 -1.7491 7.2286C18.6773 22 16.9048 22 13.3599 22h-2.7198c-3.54493 0 -5.31739 0 -6.50001 -1.2098 -1.18261 -1.2097 -1.37144 -3.216 -1.74909 -7.2286l-0.22919 -2.4353c-0.18001 -1.9126 -0.27001 -2.86891 0.05718 -3.26423 0.17699 -0.21384 0.41767 -0.34487 0.675 -0.36747 0.47569 -0.04178 1.07309 0.6383 2.26788 1.99847 0.6179 0.70343 0.92685 1.05513 1.2715 1.10963 0.19097 0.0301 0.38555 -0.0009 0.56189 -0.0896 0.31825 -0.1602 0.53044 -0.59498 0.95481 -1.46458l2.23683 -4.58366C10.9888 2.82162 11.3898 2 12 2c0.6102 0 1.0112 0.82162 1.8131 2.46485l2.2368 4.58366c0.4244 0.86961 0.6366 1.30439 0.9548 1.46459 0.1764 0.0887 0.371 0.1197 0.5619 0.0896 0.3447 -0.0545 0.6536 -0.4062 1.2715 -1.10963 1.1948 -1.36017 1.7922 -2.04025 2.2679 -1.99847 0.2573 0.0226 0.498 0.15363 0.675 0.36747 0.3272 0.39532 0.2372 1.35163 0.0572 3.26423Z';
export const MARK_RULE =
  'M8.25 18c0 -0.4142 0.33579 -0.75 0.75 -0.75h6c0.4142 0 0.75 0.3358 0.75 0.75s-0.3358 0.75 -0.75 0.75H9c-0.41421 0 -0.75 -0.3358 -0.75 -0.75Z';
// The outlined wordmark, in lockup units: crown spans x 2..22 with its cap
// band at y 2..22 (baseline y = 22); "Hayao.js" continues from x 32.39; the
// full ink box is x 2..143.53, y 1.46..28.11 (j/y descend below the baseline).
export const WORD_HAYAO =
  'M34.9 22L34.9 2L38.2 2L38.2 10.1L46.98 10.1L46.98 2L50.28 2L50.28 22L46.98 22L46.98 13.23L38.2 13.23L38.2 22ZM59.1 22.34Q56.7 22.34 55.33 21.04Q53.96 19.74 53.96 17.51Q53.96 16.06 54.66 14.98Q55.36 13.9 56.63 13.31Q57.9 12.71 59.6 12.71Q60.6 12.71 61.51 12.91Q62.42 13.1 63.13 13.49L63.13 12.54Q63.13 11.14 62.42 10.46Q61.7 9.79 60.26 9.79Q59.2 9.79 58.08 10.17Q56.95 10.56 55.86 11.29L54.9 8.73Q56.1 7.93 57.6 7.49Q59.1 7.06 60.62 7.06Q63.43 7.06 64.84 8.42Q66.25 9.79 66.25 12.51L66.25 22L63.13 22L63.13 20.77Q62.36 21.53 61.32 21.94Q60.28 22.34 59.1 22.34ZM59.76 19.61Q60.69 19.61 61.57 19.21Q62.45 18.81 63.13 18.07L63.13 16.09Q62.49 15.73 61.68 15.54Q60.88 15.34 60.1 15.34Q58.68 15.34 57.86 15.92Q57.05 16.5 57.05 17.51Q57.05 18.49 57.76 19.05Q58.48 19.61 59.76 19.61ZM72.08 27.54L74.29 21.71L68.85 7.4L72.12 7.4L75.45 16.4Q75.59 16.74 75.7 17.09Q75.82 17.43 75.9 17.8Q76.02 17.43 76.13 17.09Q76.25 16.74 76.36 16.4L79.72 7.4L83.02 7.4L75.36 27.54ZM89.79 22.34Q87.39 22.34 86.02 21.04Q84.65 19.74 84.65 17.51Q84.65 16.06 85.35 14.98Q86.05 13.9 87.32 13.31Q88.59 12.71 90.29 12.71Q91.29 12.71 92.2 12.91Q93.1 13.1 93.82 13.49L93.82 12.54Q93.82 11.14 93.1 10.46Q92.39 9.79 90.95 9.79Q89.89 9.79 88.76 10.17Q87.63 10.56 86.55 11.29L85.59 8.73Q86.79 7.93 88.29 7.49Q89.79 7.06 91.3 7.06Q94.12 7.06 95.53 8.42Q96.93 9.79 96.93 12.51L96.93 22L93.82 22L93.82 20.77Q93.05 21.53 92 21.94Q90.96 22.34 89.79 22.34ZM90.45 19.61Q91.38 19.61 92.25 19.21Q93.13 18.81 93.82 18.07L93.82 16.09Q93.18 15.73 92.37 15.54Q91.56 15.34 90.79 15.34Q89.36 15.34 88.55 15.92Q87.73 16.5 87.73 17.51Q87.73 18.49 88.45 19.05Q89.16 19.61 90.45 19.61ZM107.13 22.34Q104.08 22.34 102.32 20.3Q100.56 18.26 100.56 14.71Q100.56 12.36 101.36 10.64Q102.16 8.93 103.64 7.99Q105.12 7.06 107.13 7.06Q109.16 7.06 110.63 7.99Q112.1 8.91 112.9 10.63Q113.7 12.34 113.7 14.7Q113.7 17.06 112.9 18.77Q112.1 20.49 110.63 21.41Q109.16 22.34 107.13 22.34ZM107.13 19.3Q108.72 19.3 109.6 18.09Q110.49 16.87 110.49 14.7Q110.49 12.51 109.6 11.3Q108.7 10.09 107.13 10.09Q105.56 10.09 104.67 11.31Q103.78 12.53 103.78 14.71Q103.78 16.87 104.67 18.09Q105.56 19.3 107.13 19.3Z';
export const WORD_JS =
  'M118.4 22.36Q117.46 22.36 116.82 21.72Q116.18 21.09 116.18 20.17Q116.18 19.29 116.82 18.63Q117.46 17.97 118.4 17.97Q119.36 17.97 120.01 18.63Q120.66 19.29 120.66 20.17Q120.66 21.09 120.01 21.72Q119.36 22.36 118.4 22.36ZM121.88 28.11L120.29 25.59Q122.48 25.17 123.34 24.51Q124.2 23.84 124.2 22.6L124.2 7.4L127.4 7.4L127.4 21.71Q127.4 24.53 126.07 26.06Q124.73 27.6 121.88 28.11ZM125.8 5.29Q125.02 5.29 124.45 4.73Q123.89 4.17 123.89 3.39Q123.89 2.59 124.45 2.02Q125 1.46 125.8 1.46Q126.62 1.46 127.17 2.01Q127.72 2.57 127.72 3.39Q127.72 4.19 127.17 4.74Q126.62 5.29 125.8 5.29ZM136.58 22.34Q134.93 22.34 133.42 21.64Q131.9 20.93 130.99 19.74L133.13 17.91Q133.89 18.7 134.83 19.16Q135.78 19.61 136.68 19.61Q137.82 19.61 138.45 19.21Q139.08 18.8 139.08 18.06Q139.08 17.6 138.79 17.22Q138.5 16.84 137.79 16.47Q137.08 16.1 135.82 15.63Q133.36 14.73 132.33 13.68Q131.3 12.63 131.3 11.04Q131.3 9.26 132.73 8.16Q134.16 7.06 136.45 7.06Q138 7.06 139.33 7.65Q140.65 8.24 141.6 9.36L139.48 11.11Q138.18 9.79 136.39 9.79Q135.43 9.79 134.86 10.15Q134.29 10.51 134.29 11.11Q134.29 11.71 134.95 12.18Q135.62 12.64 137.4 13.26Q139.03 13.8 140.07 14.47Q141.1 15.14 141.58 16.01Q142.06 16.89 142.06 18.03Q142.06 20.04 140.6 21.19Q139.13 22.34 136.58 22.34Z';
const LOCKUP_RIGHT = 143.53; // lockup-unit right edge (see LOCKUP_METRICS)

const MARK_GOLD = '#e59500'; //  crown
const MARK_INK = '#29335c'; //   rule + "Hayao"
const MARK_MUTED = '#8b90a6'; // ".js"
const SPLASH_GROUND = '#f4f6fb'; // Regalia mist — a light ground the brand mark reads true on

const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);
const easeOut = (t: number): number => 1 - (1 - t) * (1 - t) * (1 - t);
const easeIn = (t: number): number => t * t * t;
// easeOutBack — overshoots to ~1.1 then settles at 1; the crown's landing "pop".
const easeOutBack = (t: number): number => {
  const c1 = 1.70158;
  const u = t - 1;
  return 1 + (c1 + 1) * u * u * u + c1 * u * u;
};

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
 * Build the animated boot cover: the Hayao logo in its canonical lockup (see
 * web/src/components/logo.ts — the mark is exactly cap-height, bottom on the
 * wordmark baseline, gap 0.36em), staged like a title card:
 *
 *   1. the crown pops in — scales up with a small overshoot and settles;
 *   2. the rule slides in beneath it, an underline being drawn;
 *   3. the wordmark rises in beside it;
 *   4. hold — the full lockup, still;
 *   5. the whole lockup lifts and dissolves toward the game's background, so the
 *      reveal, the chime, and the hand-off to the game are one motion.
 *
 * Returns a per-frame function `(elapsed, total) => DrawCommand[]`, both in ms.
 */
export function makeSplash(cfg: SplashConfig, def: GameDefinition, width: number, height: number): (elapsed: number, total: number) => DrawCommand[] {
  const gameBg = def.background ?? '#f3ecdb';
  const ground = cfg.palette?.bg ?? SPLASH_GROUND;

  // The canonical lockup, scaled to the pane. Everything is one coordinate
  // space (lockup units: crown x 2..22, cap band y 2..22, wordmark to x
  // 143.53), so a single scale + origin places the whole logo, and the crown,
  // rule and wordmark are geometrically locked to each other by construction.
  const cap = Math.round(height * 0.091); // cap height in px (≈ the old 0.13em wordmark)
  const s = cap / 20; //                     lockup units → px (cap band is 20 units)
  const cx = width / 2;
  const cy = height / 2;
  const originX = cx - ((LOCKUP_RIGHT - 2) * s) / 2; // maps lockup x=2 (crown's left)
  const capTop = cy - cap / 2; //                       maps lockup y=2 (cap band centred)
  const id = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  // The at-rest lockup transform: lockup (2,2) → (originX, capTop + dy).
  const lockT = (dy: number) => ({ a: s, b: 0, c: 0, d: s, e: originX - 2 * s, f: capTop + dy - 2 * s });
  // The crown alone, scaled by k about its own centre (lockup (12,12)):
  // x' = s·(k·(x−12) + 10) + originX — at k=1 this equals lockT.
  const markT = (k: number, dy: number) => ({ a: s * k, b: 0, c: 0, d: s * k, e: originX + s * (10 - 12 * k), f: capTop + dy + s * (10 - 12 * k) });

  return (elapsed: number, total: number): DrawCommand[] => {
    const fadeIn = Math.min(420, total * 0.42);
    const fadeOut = Math.min(280, total * 0.32);
    const holdEnd = Math.max(fadeIn, total - fadeOut);

    // Staggered entrances inside the fade-in window (fractions of fadeIn).
    const stage = (from: number, to: number) => clamp01((elapsed / fadeIn - from) / (to - from));
    let crownOp: number;
    let crownK: number; //  crown pop scale
    let ruleOp: number;
    let ruleDx: number; //  rule slides in from the left
    let wordOp: number;
    let wordDy: number; //  wordmark rises a touch
    let rise: number; //    whole-lockup motion
    let bg = ground;

    if (elapsed < holdEnd) {
      const tCrown = stage(0, 0.55);
      const tRule = stage(0.3, 0.75);
      const tWord = stage(0.45, 1);
      crownOp = easeOut(tCrown);
      crownK = 0.6 + 0.4 * easeOutBack(tCrown);
      ruleOp = easeOut(tRule);
      ruleDx = (1 - easeOut(tRule)) * -cap * 0.35;
      wordOp = easeOut(tWord);
      wordDy = (1 - easeOut(tWord)) * cap * 0.26;
      rise = 0;
    } else {
      const t = easeIn(clamp01((elapsed - holdEnd) / Math.max(1, fadeOut)));
      crownOp = ruleOp = wordOp = 1 - t;
      crownK = 1;
      ruleDx = 0;
      wordDy = 0;
      rise = -t * height * 0.02; // lift away
      bg = mixHex(ground, gameBg, t); // dissolve toward the game ground
    }

    const crownT = markT(crownK, rise);
    const atRest = markT(1, rise);
    const ruleT = { ...atRest, e: atRest.e + ruleDx };
    const wordT = lockT(rise + wordDy);

    return [
      { kind: 'rect', x: 0, y: 0, w: width, h: height, fill: bg, transform: id, z: 0 },
      { kind: 'path', d: MARK_CROWN, fill: MARK_GOLD, transform: crownT, opacity: crownOp, z: 1 },
      { kind: 'path', d: MARK_RULE, fill: MARK_INK, transform: ruleT, opacity: ruleOp, z: 2 },
      { kind: 'path', d: WORD_HAYAO, fill: MARK_INK, transform: wordT, opacity: wordOp, z: 3 },
      { kind: 'path', d: WORD_JS, fill: MARK_MUTED, transform: wordT, opacity: wordOp, z: 3 },
    ];
  };
}
