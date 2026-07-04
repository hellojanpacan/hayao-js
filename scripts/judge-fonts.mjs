// Fonts for the vision judge's rasterizer. Two problems this solves:
//
//  1. With `defaultFontFamily=""`, resvg renders no-family text in whatever system
//     font sorts first — often a symbol/CJK font with no Latin glyphs → tofu (□□□).
//  2. Worse, with `loadSystemFonts:true` a text run containing ONE exotic glyph
//     (e.g. ⛩) makes resvg reassign the WHOLE run to some CJK font that happens to
//     cover it — so even the Latin turns to boxes.
//
// The fix that renders text TRUE: turn system fonts OFF and load a MINIMAL,
// controlled set — one serif (the default family) plus a symbol font. resvg then
// keeps Latin in the serif and falls back PER GLYPH for the few symbols the serif
// lacks (⛩/arrows/♥), so at worst a single decorative glyph shows as □, never a
// whole line. Candidate paths cover macOS and common Linux locations; if none are
// found we fall back to system fonts (last resort).

import { existsSync } from 'node:fs';

// Ordered by preference — the first existing serif becomes the default family.
const SERIFS = [
  { path: '/System/Library/Fonts/Supplemental/Georgia.ttf', family: 'Georgia' },
  { path: '/System/Library/Fonts/Supplemental/Times New Roman.ttf', family: 'Times New Roman' },
  { path: '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf', family: 'DejaVu Serif' },
  { path: '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf', family: 'Liberation Serif' },
  { path: '/usr/share/fonts/truetype/noto/NotoSerif-Regular.ttf', family: 'Noto Serif' },
  { path: '/usr/share/fonts/TTF/DejaVuSerif.ttf', family: 'DejaVu Serif' },
];

// Symbol fonts — cover the glyphs a text serif lacks (arrows, ·, ♥, ⛩) so they
// fall back per-glyph instead of poisoning the run.
const SYMBOLS = [
  '/System/Library/Fonts/Apple Symbols.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/truetype/noto/NotoSansSymbols2-Regular.ttf',
  '/usr/share/fonts/TTF/DejaVuSans.ttf',
];

/** Pure core (injectable `exists` for tests): pick the first serif + all symbols. */
export function pickFonts(serifs, symbols, exists) {
  const serif = serifs.find((s) => exists(s.path));
  if (!serif) return null;
  return { fontFiles: [serif.path, ...symbols.filter(exists)], family: serif.family };
}

/** Resolve real font files on this machine, or null if no controlled serif exists. */
export function resolveJudgeFonts() {
  return pickFonts(SERIFS, SYMBOLS, existsSync);
}

/** The resvg `font` option: a controlled set if we found one, else system fonts. */
export function judgeFontOption() {
  const r = resolveJudgeFonts();
  return r
    ? { loadSystemFonts: false, fontFiles: r.fontFiles, defaultFontFamily: r.family, serifFamily: r.family }
    : { loadSystemFonts: true };
}
