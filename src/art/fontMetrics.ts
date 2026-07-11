// Exact width measurement for crisp VECTOR text — the thing the card kit needs
// that the engine's `Text` node can't do headlessly on its own.
//
// The corpus renders `Text` as real `<text>` and never measures it (it lays out
// by `align` + fixed coordinates). The card kit wants tighter layout — a pill
// sized to its label, a title that shrinks to fit, wrapped flavor — so it carries
// a `FontMetric`: an advance-width table read from the real font (see
// `overpassMetrics.ts`, generated from the bundled Overpass 600 by
// web/scripts/gen-card-metrics.mjs). Summing advances gives the exact rendered
// width, deterministically, with no canvas and no font loaded — the same reason
// the logo is outlined from its true metrics rather than trusting a live font.
//
// A game measures its OWN face by generating a table for it and passing that
// metric to the card template — the layout guarantees travel with any font.

/** Per-glyph advance widths (font units) plus the vertical metrics of one face. */
export interface FontMetric {
  /** CSS font-family the `Text` node renders with — must match the tabled font. */
  family: string;
  weight: number;
  unitsPerEm: number;
  capHeight: number;
  ascent: number;
  descent: number;
  /** Advance for any glyph absent from `advance`. */
  defaultAdvance: number;
  advance: Record<string, number>;
}

/** Exact rendered width of `text` at `size` px, in design units. */
export function measureVectorText(m: FontMetric, text: string, size: number): number {
  let units = 0;
  for (const ch of text) units += m.advance[ch] ?? m.defaultAdvance;
  return (units / m.unitsPerEm) * size;
}

/**
 * The largest font size ≤ `maxSize` at which `text` fits within `maxWidth`
 * (a title that auto-shrinks instead of overflowing). Pure.
 */
export function fitFontSize(m: FontMetric, text: string, maxWidth: number, maxSize: number): number {
  const full = measureVectorText(m, text, maxSize);
  if (full <= maxWidth || full === 0) return maxSize;
  return maxSize * (maxWidth / full);
}

/**
 * Greedy word-wrap `text` to lines that each fit `maxWidth` at `size`, breaking
 * on spaces (and honoring existing `\n`). A single word longer than the width is
 * kept whole on its own line rather than split mid-glyph. Pure and deterministic.
 */
export function wrapVectorText(m: FontMetric, text: string, maxWidth: number, size: number): string[] {
  const out: string[] = [];
  for (const hard of text.split('\n')) {
    let line = '';
    for (const word of hard.split(' ')) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && measureVectorText(m, candidate, size) > maxWidth) {
        out.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    out.push(line);
  }
  return out;
}

export { OVERPASS_600 } from './overpassMetrics';
