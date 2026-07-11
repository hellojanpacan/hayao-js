// Resource glyphs for the card kit — the small Bold-Duotone icons that sit in a
// card's effect rows (a coin for cash, a cube for product, a flame for burn…).
//
// Each glyph is a pure `(DuotoneScheme) => Node` drawn at a NATIVE 22px box,
// centered on the origin, from two/three tones of a single hue plus sparing ink
// — the same duotone discipline as the crest and the hero. Colour is never
// hand-typed: the caller passes a Regalia hue, `resourceGlyph` derives the tones.
//
// A game supplies its own icons by passing a `GlyphSet` (a plain name→draw map)
// into the card template — there is no global registry, so two games in one
// process never collide. `DEFAULT_GLYPHS` is a starter set, nothing more.
//
// COSMETIC: every returned node is pure view (`cosmetic = true`) — a glyph never
// enters `world.hash()`.

import { Node } from '../scene/node';
import { Sprite } from '../scene/nodes';
import { duotone, type DuotoneScheme } from './duotone';
import { star } from './shapes';

/** The side length a glyph is authored at; `resourceGlyph` scales to any size. */
export const GLYPH_NATIVE = 22;

/** Paint one resource glyph from a duotone scheme, centered on the origin. */
export type GlyphDraw = (scheme: DuotoneScheme) => Node;

/** A named set of glyphs a game hands the card kit. Bring your own to reskin. */
export type GlyphSet = Record<string, GlyphDraw>;

function group(): Node {
  const n = new Node({ name: 'glyph' });
  n.cosmetic = true;
  return n;
}

/** A coin — cash / money. Bright face on a bold rim. */
const coin: GlyphDraw = (s) => {
  const g = group();
  g.addChild(new Sprite({ shape: { kind: 'circle', radius: 10 }, fill: s.base, stroke: s.ink, strokeWidth: 2 }));
  g.addChild(new Sprite({ shape: { kind: 'circle', radius: 4.6 }, fill: s.light }));
  return g;
};

/** An isometric cube — a shipped unit of product. Three faces, one hue. */
const cube: GlyphDraw = (s) => {
  const g = group();
  g.addChild(new Sprite({ shape: { kind: 'poly', points: [0, -11, 11, -5, 0, 1, -11, -5] }, fill: s.light })); // top
  g.addChild(new Sprite({ shape: { kind: 'poly', points: [-11, -5, 0, 1, 0, 11, -11, 5] }, fill: s.base })); //  left
  g.addChild(new Sprite({ shape: { kind: 'poly', points: [11, -5, 0, 1, 0, 11, 11, 5] }, fill: s.shade })); //   right
  return g;
};

/** A flame — burn. A teardrop mass with a lighter inner tongue. */
const flame: GlyphDraw = (s) => {
  const g = group();
  g.addChild(new Sprite({ shape: { kind: 'path', d: 'M0 -10 C-7 -5 -6 6 0 10 C6 6 7 -5 0 -10 Z' }, fill: s.base }));
  g.addChild(new Sprite({ shape: { kind: 'path', d: 'M0 -1 C-3 1 -3 5 0 7 C3 5 3 1 0 -1 Z' }, fill: s.light }));
  return g;
};

/** A four-point spark — energy / tech. */
const spark: GlyphDraw = (s) => {
  const g = group();
  g.addChild(new Sprite({ shape: { kind: 'poly', points: star(4, 11, 3.6) }, fill: s.base }));
  g.addChild(new Sprite({ shape: { kind: 'circle', radius: 2.6 }, fill: s.light }));
  return g;
};

/** Two figures — users / customers / community. */
const users: GlyphDraw = (s) => {
  const g = group();
  // back person (recessed tone), offset up-right
  g.addChild(new Sprite({ pos: { x: 4, y: -2 }, shape: { kind: 'circle', radius: 4 }, fill: s.shade }));
  g.addChild(new Sprite({ pos: { x: 4, y: 8 }, shape: { kind: 'path', d: 'M-6 2 C-6 -5 6 -5 6 2 Z' }, fill: s.shade }));
  // front person (bold tone)
  g.addChild(new Sprite({ pos: { x: -3, y: 0 }, shape: { kind: 'circle', radius: 4.6 }, fill: s.base }));
  g.addChild(new Sprite({ pos: { x: -3, y: 10 }, shape: { kind: 'path', d: 'M-7 3 C-7 -5 7 -5 7 3 Z' }, fill: s.base }));
  return g;
};

/** A ring / target — a generic neutral token. */
const ring: GlyphDraw = (s) => {
  const g = group();
  g.addChild(new Sprite({ shape: { kind: 'circle', radius: 10 }, fill: s.base }));
  g.addChild(new Sprite({ shape: { kind: 'circle', radius: 5.2 }, fill: s.light }));
  g.addChild(new Sprite({ shape: { kind: 'circle', radius: 1.8 }, fill: s.base }));
  return g;
};

/**
 * The starter glyph set — a name for each of the six shapes above. Pass your own
 * `GlyphSet` to the card template to reskin entirely; extend this with
 * `{ ...DEFAULT_GLYPHS, myIcon }`.
 */
export const DEFAULT_GLYPHS: GlyphSet = { coin, cube, flame, spark, users, ring };

/**
 * Build a resource glyph node coloured from a Regalia hue and scaled to `size`
 * (design units). `draw` is a `GlyphDraw` or a name resolved against `set`
 * (default `DEFAULT_GLYPHS`). Returns a cosmetic node centered on its origin.
 */
export function resourceGlyph(
  draw: GlyphDraw | string,
  hue: string,
  size = GLYPH_NATIVE,
  set: GlyphSet = DEFAULT_GLYPHS,
): Node {
  const fn = typeof draw === 'string' ? (set[draw] ?? ring) : draw;
  const node = fn(duotone(hue));
  const k = size / GLYPH_NATIVE;
  if (k !== 1) node.scale = { x: k, y: k };
  return node;
}
