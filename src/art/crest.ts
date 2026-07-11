// Deterministic heraldry — a builder's *arms*, a pure function of their handle.
//
// The engine's soul is "a game is a pure, deterministic function of its inputs";
// this makes a builder's identity the same kind of function. `@aldric` always
// yields the same arms — nobody picks a crest, the handle draws it. Every coin a
// builder strikes bears these arms, so provenance is visible on the coin's face.
//
// The handle is canonical with a single leading `@`: `@wren`, `wren`, and `@Wren`
// all blazon the SAME arms and title as `@wren`. Case and spacing never matter.
//
// Variety comes from a set of orthogonal, *nameable* slots — escutcheon shape,
// field tincture, an optional field division or diaper, an optional ordinary or
// bordure, and a focal charge (with parametric families like mullets and suns)
// in an arrangement. A composition grammar keeps any one
// shield clean (one field complication, ordinary XOR bordure, one focal point),
// so the *catalog* stays huge while every draw still reads as intentional. That
// lifts the space past ~10^7 distinct blazons — collisions become negligible.
//
// Style is strict Regalia: soft, rounded, Bold-Duotone. Charges route through
// `smoothClosedPath` so even a "star" is a soft mullet, every charge carries a
// dark-ink outline (the house mark-floor rule), and every hue is a named Regalia
// swatch — never a hand-typed RGB. Pure: same handle, same SVG, forever.

import { REGALIA } from './palette';
import { duotone, type DuotoneScheme } from './duotone';
import { Rng } from '../core/rng';
import { hashValue } from '../core/hash';
import { smoothClosedPath } from './shapes';
import { dcos, dsin } from '../core/dmath';
import { TAU, type Vec2 } from '../core/math';

// ── the slot vocabulary ─────────────────────────────────────────

/** The five Regalia field hues an arms can wear. Neutrals stay for ink/paper. */
const HUES = ['gold', 'green', 'blue', 'rose', 'bark'] as const;
export type CrestHue = (typeof HUES)[number];

/** The escutcheon silhouette — all soft-cornered. */
const SHAPES = ['heater', 'kite', 'roundel', 'lozenge', 'oval', 'swiss', 'banner'] as const;
export type CrestShape = (typeof SHAPES)[number];

/** How the field is partitioned. `plain` is the un-divided field. */
const DIVISIONS = ['plain', 'pale', 'fess', 'bend', 'quarterly', 'chevron'] as const;
export type CrestDivision = (typeof DIVISIONS)[number];

/** The field treatment layered on a plain field. */
export type CrestTreatment = 'plain' | 'diaper';

/** A bold structural band over the field. `none` leaves the field open. */
const ORDINARIES = ['none', 'chief', 'fess', 'pale', 'bend', 'chevron', 'cross', 'saltire'] as const;
export type CrestOrdinary = (typeof ORDINARIES)[number];

/** A border around the field's edge. */
const BORDURES = ['none', 'plain', 'engrailed'] as const;
export type CrestBordure = (typeof BORDURES)[number];

/**
 * The focal charge. Two families:
 *  - geometric (`roundel`…`pile`): abstract; `mullet`/`sun`/`gear` are parametric
 *    (see `points`), and these may repeat in a pair/triad arrangement.
 *  - representational (`tower`…`crown`): a small bestiary of soft Bold-Duotone
 *    objects and creatures; these are always drawn single (a fox ×3 is mush) and
 *    give arms *character*, not just difference.
 */
const CHARGES = [
  'roundel', 'ring', 'pellets', 'rosette', 'crescent', 'leaf',
  'mullet', 'sun', 'gear', 'lozenge', 'pile',
  'tower', 'key', 'oak', 'acorn', 'bell', 'anchor', 'fish', 'owl', 'mountain', 'crown',
] as const;
export type CrestCharge = (typeof CHARGES)[number];

/** Representational charges — always single, never parametric. */
const REPRESENTATIONAL: readonly CrestCharge[] = [
  'tower', 'key', 'oak', 'acorn', 'bell', 'anchor', 'fish', 'owl', 'mountain', 'crown',
];

/** How the charge is laid on the field. */
export type CrestArrangement = 'single' | 'pair' | 'triad';


/** The deterministic description of a builder's arms — the "blazon". */
export interface Crest {
  /** The canonical `@handle` these arms belong to. */
  handle: string;
  shape: CrestShape;
  field: CrestHue;
  /** The charge tincture — always a different hue than `field`. */
  accent: CrestHue;
  division: CrestDivision;
  /** The second tincture of a divided field (only meaningful when divided). */
  divisionHue: CrestHue;
  treatment: CrestTreatment;
  ordinary: CrestOrdinary;
  ordinaryHue: CrestHue;
  bordure: CrestBordure;
  bordureHue: CrestHue;
  charge: CrestCharge;
  /** Point/ray/tooth count for parametric charges (mullet/sun/gear); else 0. */
  points: number;
  arrangement: CrestArrangement;
}

// ── canonicalization + seed ─────────────────────────────────────

/** The one true form of a handle: trimmed, lower-cased, exactly one leading `@`. */
export function canonicalHandle(handle: string): string {
  return '@' + handle.trim().toLowerCase().replace(/^@+/, '');
}

/** Fold the canonical handle into a stable 32-bit seed. */
function seedFor(handle: string): number {
  const hex = hashValue(canonicalHandle(handle));
  let n = 0;
  for (let i = 0; i < hex.length; i++) n = (Math.imul(n, 31) + hex.charCodeAt(i)) >>> 0;
  return n || 1;
}

/** Pick a hue not already spoken for, so adjacent masses never wash together. */
function pickHue(rng: Rng, ...taken: CrestHue[]): CrestHue {
  const pool = HUES.filter((h) => !taken.includes(h));
  return rng.pick(pool.length ? pool : HUES);
}

/**
 * Read a builder's arms from their handle. Pure and deterministic — the same
 * handle always blazons the same crest. This is the spec; `crestSvg` paints it.
 *
 * Draw order runs high-salience slots first (shape → field → focal charge) so two
 * different handles diverge at a glance.
 */
export function readCrest(handle: string): Crest {
  const rng = new Rng(seedFor(handle));

  const shape = rng.pick(SHAPES);
  const field = rng.pick(HUES);

  // One field complication at most: plain, a division, or a diaper. Weighted
  // toward calmer fields — most arms want an open ground for the charge.
  let division: CrestDivision = 'plain';
  let divisionHue: CrestHue = field;
  let treatment: CrestTreatment = 'plain';
  const fieldRoll = rng.float();
  if (fieldRoll < 0.32) {
    division = rng.pick(DIVISIONS.filter((d) => d !== 'plain'));
    divisionHue = pickHue(rng, field);
  } else if (fieldRoll < 0.5) {
    treatment = 'diaper';
  }
  const divided = division !== 'plain';

  // Structure: ordinary XOR bordure XOR none. Ordinaries only on undivided fields
  // (a band over a partition reads as mud); bordures are welcome anywhere.
  let ordinary: CrestOrdinary = 'none';
  let ordinaryHue: CrestHue = field;
  let bordure: CrestBordure = 'none';
  let bordureHue: CrestHue = field;
  const structRoll = rng.float();
  if (!divided && structRoll < 0.3) {
    ordinary = rng.pick(ORDINARIES.filter((o) => o !== 'none'));
    ordinaryHue = pickHue(rng, field);
    treatment = 'plain'; // a diaper *under* a bold band is noise — drop it
  } else if (structRoll < 0.6) {
    bordure = rng.pick(BORDURES.filter((b) => b !== 'none'));
    bordureHue = pickHue(rng, field);
  }

  // The focal charge — always present, the thing the eye lands on.
  const charge = rng.pick(CHARGES);
  let points = 0;
  if (charge === 'mullet') points = rng.intRange(5, 8);
  else if (charge === 'sun') points = rng.intRange(10, 14);
  else if (charge === 'gear') points = rng.intRange(6, 9);
  const accent = pickHue(rng, field, divided ? divisionHue : field);

  // Busy fields keep the charge single; open fields may repeat a *geometric*
  // charge. Representational charges are always single — the eye reads one.
  const busy = divided || ordinary !== 'none';
  const representational = REPRESENTATIONAL.includes(charge);
  let arrangement: CrestArrangement = 'single';
  if (!busy && !representational) {
    const a = rng.float();
    arrangement = a < 0.55 ? 'single' : a < 0.82 ? 'pair' : 'triad';
  }

  return {
    handle: canonicalHandle(handle),
    shape, field, accent, division, divisionHue, treatment,
    ordinary, ordinaryHue, bordure, bordureHue,
    charge, points, arrangement,
  };
}

// ── geometry ────────────────────────────────────────────────────
// A 120×132 viewBox. Every escutcheon is built from a handful of points and
// smoothed so its corners and point are soft.

const VB_W = 120;
const VB_H = 132;
const CX = 60;
/** Where the focal charge sits, for every shape. */
const FOCUS_Y = 72;

const r2 = (v: number): number => Math.round(v * 100) / 100;
const softPath = (pts: Vec2[], tension = 1): string => smoothClosedPath(pts, tension);

/** The escutcheon outline points for a given shape. */
function shapePoints(shape: CrestShape): Vec2[] {
  switch (shape) {
    case 'heater':
      return [
        { x: 20, y: 30 }, { x: 60, y: 26 }, { x: 100, y: 30 },
        { x: 103, y: 74 }, { x: 60, y: 122 }, { x: 17, y: 74 },
      ];
    case 'kite':
      return [
        { x: 30, y: 28 }, { x: 60, y: 24 }, { x: 90, y: 28 },
        { x: 98, y: 60 }, { x: 78, y: 104 }, { x: 60, y: 124 },
        { x: 42, y: 104 }, { x: 22, y: 60 },
      ];
    case 'roundel': {
      const pts: Vec2[] = [];
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * TAU;
        pts.push({ x: CX + dcos(a) * 46, y: 72 + dsin(a) * 46 });
      }
      return pts;
    }
    case 'lozenge':
      return [{ x: 60, y: 24 }, { x: 102, y: 72 }, { x: 60, y: 122 }, { x: 18, y: 72 }];
    case 'oval': {
      const pts: Vec2[] = [];
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * TAU;
        pts.push({ x: CX + dcos(a) * 40, y: 73 + dsin(a) * 50 });
      }
      return pts;
    }
    case 'swiss':
      return [
        { x: 24, y: 26 }, { x: 60, y: 24 }, { x: 96, y: 26 },
        { x: 98, y: 100 }, { x: 84, y: 118 }, { x: 60, y: 122 },
        { x: 36, y: 118 }, { x: 22, y: 100 },
      ];
    case 'banner':
      return [
        { x: 26, y: 26 }, { x: 94, y: 26 }, { x: 96, y: 118 },
        { x: 60, y: 110 }, { x: 24, y: 118 },
      ];
  }
}

function disc(cx: number, cy: number, r: number, fill: string, stroke: string, sw: number): string {
  return `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r)}" fill="${fill}" stroke="${stroke}" stroke-width="${r2(sw)}"/>`;
}

function poly(pts: Vec2[], fill: string): string {
  const d = pts.map((p) => `${r2(p.x)},${r2(p.y)}`).join(' ');
  return `<polygon points="${d}" fill="${fill}"/>`;
}

/** A rounded rect with an ink outline (or none, when `sw` is 0). */
function rrect(x: number, y: number, w: number, h: number, fill: string, rx: number, sw: number): string {
  const stroke = sw > 0 ? ` stroke="${REGALIA.ink}" stroke-width="${r2(sw)}"` : '';
  return `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" rx="${r2(rx)}" fill="${fill}"${stroke}/>`;
}

/** An ink-outlined path (rounded joins/caps) — the workhorse for soft charges. */
function ipath(d: string, fill: string, sw: number): string {
  return `<path d="${d}" fill="${fill}" stroke="${REGALIA.ink}" stroke-width="${r2(sw)}" stroke-linejoin="round" stroke-linecap="round"/>`;
}

/** A soft star/cog outline centered at (cx,cy), points alternating outer/inner r. */
function softStar(cx: number, cy: number, n: number, outer: number, inner: number): Vec2[] {
  const pts: Vec2[] = [];
  const rot = -TAU / 4;
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rot + (i / (n * 2)) * TAU;
    pts.push({ x: cx + dcos(a) * r, y: cy + dsin(a) * r });
  }
  return pts;
}

// ── field, divisions, diaper ────────────────────────────────────

function paintDivision(c: Crest, other: string): string {
  switch (c.division) {
    case 'pale':
      return `<rect x="${CX}" y="0" width="${VB_W}" height="${VB_H}" fill="${other}"/>`;
    case 'fess':
      return `<rect x="0" y="66" width="${VB_W}" height="${VB_H}" fill="${other}"/>`;
    case 'bend':
      return poly([{ x: 0, y: 0 }, { x: VB_W, y: 0 }, { x: VB_W, y: VB_H }], other);
    case 'quarterly':
      return (
        `<rect x="${CX}" y="0" width="${VB_W}" height="66" fill="${other}"/>` +
        `<rect x="0" y="66" width="${CX}" height="66" fill="${other}"/>`
      );
    case 'chevron':
      return poly([{ x: 0, y: VB_H }, { x: CX, y: 58 }, { x: VB_W, y: VB_H }], other);
    default:
      return '';
  }
}

/** A subtle same-hue diaper (damask dot lattice) over a plain field. Bounded to
 * the escutcheon box — the clip trims the rest, so no stray off-canvas dots. */
function paintDiaper(light: string): string {
  let s = '';
  const step = 17;
  for (let row = 0; row * step + 24 < VB_H; row++) {
    const y = 24 + row * step;
    const off = row % 2 === 0 ? 0 : step / 2;
    for (let x = 12 + off; x < VB_W - 8; x += step) {
      s += disc(x, y, 2.1, light, 'none', 0);
    }
  }
  return s;
}

// ── ordinaries ──────────────────────────────────────────────────

function paintOrdinary(c: Crest, fill: string): string {
  switch (c.ordinary) {
    case 'chief':
      return `<rect x="0" y="0" width="${VB_W}" height="46" fill="${fill}"/>`;
    case 'fess':
      return `<rect x="0" y="60" width="${VB_W}" height="26" fill="${fill}"/>`;
    case 'pale':
      return `<rect x="46" y="0" width="28" height="${VB_H}" fill="${fill}"/>`;
    case 'bend':
      return poly([{ x: 8, y: 20 }, { x: 30, y: 20 }, { x: 112, y: 118 }, { x: 90, y: 118 }], fill);
    case 'chevron':
      return poly(
        [{ x: 60, y: 50 }, { x: 106, y: 100 }, { x: 106, y: 116 }, { x: 60, y: 66 }, { x: 14, y: 116 }, { x: 14, y: 100 }],
        fill,
      );
    case 'cross':
      return (
        `<rect x="46" y="0" width="28" height="${VB_H}" fill="${fill}"/>` +
        `<rect x="0" y="58" width="${VB_W}" height="28" fill="${fill}"/>`
      );
    case 'saltire':
      return (
        poly([{ x: 8, y: 18 }, { x: 26, y: 18 }, { x: 112, y: 114 }, { x: 94, y: 114 }], fill) +
        poly([{ x: 94, y: 18 }, { x: 112, y: 18 }, { x: 26, y: 114 }, { x: 8, y: 114 }], fill)
      );
    default:
      return '';
  }
}

// ── charges ─────────────────────────────────────────────────────

function paintCharge(
  charge: CrestCharge, points: number,
  cx: number, cy: number, r: number,
  a: DuotoneScheme, fieldBase: string, sw: number,
): string {
  const ink = REGALIA.ink;
  if (REPRESENTATIONAL.includes(charge)) return paintCreature(charge, cx, cy, r, a, fieldBase, sw);
  switch (charge) {
    case 'roundel':
      return disc(cx, cy, r, a.base, ink, sw) + disc(cx, cy, r * 0.46, a.light, ink, sw * 0.8);
    case 'ring':
      return (
        disc(cx, cy, r, a.base, ink, sw) +
        disc(cx, cy, r * 0.64, fieldBase, 'none', 0) +
        disc(cx, cy, r * 0.3, a.base, 'none', 0)
      );
    case 'pellets': {
      const p = r * 0.5;
      return (
        disc(cx, cy - p, r * 0.36, a.base, ink, sw) +
        disc(cx - p, cy + p * 0.8, r * 0.36, a.base, ink, sw) +
        disc(cx + p, cy + p * 0.8, r * 0.36, a.base, ink, sw)
      );
    }
    case 'rosette': {
      let s = '';
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * TAU - TAU / 4;
        s += disc(cx + dcos(ang) * r * 0.56, cy + dsin(ang) * r * 0.56, r * 0.36, a.light, ink, sw);
      }
      return s + disc(cx, cy, r * 0.44, a.base, ink, sw);
    }
    case 'crescent':
      return disc(cx, cy, r, a.base, ink, sw) + disc(cx + r * 0.42, cy - r * 0.14, r * 0.86, fieldBase, 'none', 0);
    case 'leaf': {
      const pts: Vec2[] = [
        { x: cx, y: cy - r }, { x: cx + r * 0.62, y: cy - r * 0.1 },
        { x: cx + r * 0.2, y: cy + r }, { x: cx - r * 0.2, y: cy + r },
        { x: cx - r * 0.62, y: cy - r * 0.1 },
      ];
      return `<path d="${softPath(pts)}" fill="${a.base}" stroke="${ink}" stroke-width="${r2(sw)}"/>`;
    }
    case 'mullet':
      return (
        `<path d="${softPath(softStar(cx, cy, points || 5, r, r * 0.46))}" fill="${a.base}" stroke="${ink}" stroke-width="${r2(sw)}"/>` +
        disc(cx, cy, r * 0.24, a.light, 'none', 0)
      );
    case 'sun':
      return (
        `<path d="${softPath(softStar(cx, cy, points || 12, r, r * 0.74), 0.7)}" fill="${a.base}" stroke="${ink}" stroke-width="${r2(sw)}"/>` +
        disc(cx, cy, r * 0.5, a.light, ink, sw * 0.8)
      );
    case 'gear':
      return (
        `<path d="${softPath(softStar(cx, cy, points || 8, r, r * 0.78), 0.5)}" fill="${a.base}" stroke="${ink}" stroke-width="${r2(sw)}"/>` +
        disc(cx, cy, r * 0.42, fieldBase, 'none', 0) +
        disc(cx, cy, r * 0.2, a.base, ink, sw * 0.7)
      );
    case 'lozenge': {
      const pts: Vec2[] = [
        { x: cx, y: cy - r }, { x: cx + r * 0.72, y: cy },
        { x: cx, y: cy + r }, { x: cx - r * 0.72, y: cy },
      ];
      return `<path d="${softPath(pts)}" fill="${a.base}" stroke="${ink}" stroke-width="${r2(sw)}"/>`;
    }
    case 'pile': {
      const pts: Vec2[] = [
        { x: cx - r * 0.82, y: cy - r * 0.9 }, { x: cx + r * 0.82, y: cy - r * 0.9 },
        { x: cx, y: cy + r },
      ];
      return `<path d="${softPath(pts)}" fill="${a.base}" stroke="${ink}" stroke-width="${r2(sw)}"/>`;
    }
    default:
      return ''; // representational charges are handled by paintCreature above
  }
}

// ── the bestiary: representational charges ──────────────────────
// A small set of soft Bold-Duotone objects and creatures. Each fits a box of
// radius `r` centred on (cx,cy), dresses from the accent scheme (bold `base`,
// lighter `light`, recessed `shade`) with ink for the few hard details, and
// keeps every corner soft. These give arms character, not just difference.

function paintCreature(
  charge: CrestCharge,
  cx: number, cy: number, r: number,
  a: DuotoneScheme, fieldBase: string, sw: number,
): string {
  const ink = REGALIA.ink;
  switch (charge) {
    case 'tower': {
      // A keep: crenellated body, a dark arched door, a lit window.
      const w = r * 1.02;
      const x = cx - w / 2;
      const top = cy - r * 0.5;
      const bh = r * 1.4;
      const mw = w / 5;
      const merlons =
        rrect(x, top - r * 0.3, mw, r * 0.36, a.base, 1.5, sw) +
        rrect(cx - mw / 2, top - r * 0.3, mw, r * 0.36, a.base, 1.5, sw) +
        rrect(x + w - mw, top - r * 0.3, mw, r * 0.36, a.base, 1.5, sw);
      const body = rrect(x, top, w, bh, a.base, 3, sw);
      const window = rrect(cx - r * 0.14, top + r * 0.28, r * 0.28, r * 0.34, a.light, 2, 0);
      const door = ipath(
        `M ${r2(cx - r * 0.26)} ${r2(top + bh)} L ${r2(cx - r * 0.26)} ${r2(top + bh - r * 0.42)} ` +
        `Q ${r2(cx)} ${r2(top + bh - r * 0.72)} ${r2(cx + r * 0.26)} ${r2(top + bh - r * 0.42)} L ${r2(cx + r * 0.26)} ${r2(top + bh)} Z`,
        a.shade, sw * 0.7);
      return merlons + body + window + door;
    }
    case 'key': {
      // Bow (ring) up top, a shank, two teeth at the foot.
      const bowY = cy - r * 0.5;
      const bow = disc(cx, bowY, r * 0.4, a.base, ink, sw) + disc(cx, bowY, r * 0.17, fieldBase, 'none', 0);
      const shank = rrect(cx - r * 0.11, bowY, r * 0.22, r * 1.35, a.base, r * 0.11, sw);
      const teeth =
        rrect(cx + r * 0.08, cy + r * 0.55, r * 0.34, r * 0.16, a.base, 1.5, sw) +
        rrect(cx + r * 0.08, cy + r * 0.86, r * 0.24, r * 0.16, a.base, 1.5, sw);
      return shank + teeth + bow;
    }
    case 'oak': {
      // A bushy three-lobed canopy on a short, thick trunk.
      const trunk = rrect(cx - r * 0.16, cy + r * 0.15, r * 0.32, r * 0.82, a.shade, r * 0.1, sw);
      const canopyPts: Vec2[] = [];
      for (let i = 0; i < 18; i++) {
        const ang = (i / 18) * TAU;
        const rad = r * 0.78 * (1 + 0.14 * dcos(3 * ang - 0.5));
        canopyPts.push({ x: cx + dcos(ang) * rad, y: cy - r * 0.24 + dsin(ang) * rad });
      }
      const canopy = ipath(softPath(canopyPts, 1), a.base, sw);
      const shine = disc(cx - r * 0.28, cy - r * 0.4, r * 0.22, a.light, 'none', 0);
      return trunk + canopy + shine;
    }
    case 'acorn': {
      // A plump nut tapering to a soft point, under a broad scalloped cap.
      const nut = ipath(
        `M ${r2(cx - r * 0.46)} ${r2(cy - r * 0.12)} Q ${r2(cx - r * 0.5)} ${r2(cy + r * 0.52)} ${r2(cx)} ${r2(cy + r * 0.92)} ` +
        `Q ${r2(cx + r * 0.5)} ${r2(cy + r * 0.52)} ${r2(cx + r * 0.46)} ${r2(cy - r * 0.12)} Z`,
        a.light, sw);
      const cap = ipath(
        `M ${r2(cx - r * 0.56)} ${r2(cy - r * 0.14)} Q ${r2(cx - r * 0.58)} ${r2(cy - r * 0.74)} ${r2(cx)} ${r2(cy - r * 0.74)} ` +
        `Q ${r2(cx + r * 0.58)} ${r2(cy - r * 0.74)} ${r2(cx + r * 0.56)} ${r2(cy - r * 0.14)} ` +
        `Q ${r2(cx + r * 0.28)} ${r2(cy + r * 0.04)} ${r2(cx)} ${r2(cy - r * 0.06)} ` +
        `Q ${r2(cx - r * 0.28)} ${r2(cy + r * 0.04)} ${r2(cx - r * 0.56)} ${r2(cy - r * 0.14)} Z`,
        a.base, sw);
      const stem = rrect(cx - r * 0.08, cy - r * 0.96, r * 0.16, r * 0.26, a.base, r * 0.08, sw * 0.8);
      return nut + cap + stem;
    }
    case 'bell': {
      // A shouldered bell with a clapper.
      const body = ipath(
        `M ${r2(cx)} ${r2(cy - r * 0.7)} Q ${r2(cx + r * 0.28)} ${r2(cy - r * 0.68)} ${r2(cx + r * 0.34)} ${r2(cy + r * 0.2)} ` +
        `Q ${r2(cx + r * 0.38)} ${r2(cy + r * 0.5)} ${r2(cx + r * 0.6)} ${r2(cy + r * 0.6)} ` +
        `L ${r2(cx - r * 0.6)} ${r2(cy + r * 0.6)} ` +
        `Q ${r2(cx - r * 0.38)} ${r2(cy + r * 0.5)} ${r2(cx - r * 0.34)} ${r2(cy + r * 0.2)} ` +
        `Q ${r2(cx - r * 0.28)} ${r2(cy - r * 0.68)} ${r2(cx)} ${r2(cy - r * 0.7)} Z`,
        a.base, sw);
      const crown = rrect(cx - r * 0.1, cy - r * 0.88, r * 0.2, r * 0.22, a.base, r * 0.09, sw * 0.8);
      const clapper = disc(cx, cy + r * 0.78, r * 0.16, a.shade, ink, sw * 0.7);
      const shine = ipath(
        `M ${r2(cx - r * 0.05)} ${r2(cy - r * 0.5)} Q ${r2(cx - r * 0.2)} ${r2(cy - r * 0.4)} ${r2(cx - r * 0.16)} ${r2(cy + r * 0.35)} ` +
        `L ${r2(cx - r * 0.02)} ${r2(cy + r * 0.35)} Z`,
        a.light, 0);
      return crown + body + shine + clapper;
    }
    case 'anchor': {
      // Ring, stock, shank, and a curved fluke arm.
      const ringY = cy - r * 0.78;
      const arm = ipath(
        `M ${r2(cx)} ${r2(cy - r * 0.5)} L ${r2(cx)} ${r2(cy + r * 0.5)} ` +
        `M ${r2(cx - r * 0.6)} ${r2(cy + r * 0.1)} Q ${r2(cx - r * 0.62)} ${r2(cy + r * 0.78)} ${r2(cx)} ${r2(cy + r * 0.82)} ` +
        `Q ${r2(cx + r * 0.62)} ${r2(cy + r * 0.78)} ${r2(cx + r * 0.6)} ${r2(cy + r * 0.1)}`,
        'none', sw * 1.5);
      const stock = rrect(cx - r * 0.42, cy - r * 0.34, r * 0.84, r * 0.16, a.base, r * 0.08, sw * 0.8);
      const ring = disc(cx, ringY, r * 0.26, a.base, ink, sw) + disc(cx, ringY, r * 0.11, fieldBase, 'none', 0);
      const tips =
        disc(cx - r * 0.6, cy + r * 0.1, r * 0.11, a.base, ink, sw * 0.7) +
        disc(cx + r * 0.6, cy + r * 0.1, r * 0.11, a.base, ink, sw * 0.7);
      return arm + stock + ring + tips;
    }
    case 'fish': {
      // An almond body, a tail fin, an eye.
      const body = ipath(
        `M ${r2(cx - r * 0.3)} ${r2(cy)} Q ${r2(cx + r * 0.1)} ${r2(cy - r * 0.55)} ${r2(cx + r * 0.7)} ${r2(cy)} ` +
        `Q ${r2(cx + r * 0.1)} ${r2(cy + r * 0.55)} ${r2(cx - r * 0.3)} ${r2(cy)} Z`,
        a.base, sw);
      const tail = ipath(
        `M ${r2(cx - r * 0.3)} ${r2(cy)} L ${r2(cx - r * 0.7)} ${r2(cy - r * 0.34)} ` +
        `Q ${r2(cx - r * 0.44)} ${r2(cy)} ${r2(cx - r * 0.7)} ${r2(cy + r * 0.34)} Z`,
        a.base, sw);
      const belly = ipath(
        `M ${r2(cx - r * 0.12)} ${r2(cy + r * 0.06)} Q ${r2(cx + r * 0.16)} ${r2(cy + r * 0.34)} ${r2(cx + r * 0.5)} ${r2(cy + r * 0.06)} Z`,
        a.light, 0);
      const eye = disc(cx + r * 0.42, cy - r * 0.06, r * 0.09, ink, 'none', 0);
      return tail + body + belly + eye;
    }
    case 'owl': {
      // Round body, two big eyes, ear tufts, a beak.
      const body = ipath(
        `M ${r2(cx)} ${r2(cy - r * 0.72)} Q ${r2(cx + r * 0.7)} ${r2(cy - r * 0.6)} ${r2(cx + r * 0.7)} ${r2(cy + r * 0.1)} ` +
        `Q ${r2(cx + r * 0.7)} ${r2(cy + r * 0.85)} ${r2(cx)} ${r2(cy + r * 0.85)} ` +
        `Q ${r2(cx - r * 0.7)} ${r2(cy + r * 0.85)} ${r2(cx - r * 0.7)} ${r2(cy + r * 0.1)} ` +
        `Q ${r2(cx - r * 0.7)} ${r2(cy - r * 0.6)} ${r2(cx)} ${r2(cy - r * 0.72)} Z`,
        a.base, sw);
      const tufts =
        ipath(`M ${r2(cx - r * 0.5)} ${r2(cy - r * 0.55)} L ${r2(cx - r * 0.62)} ${r2(cy - r * 0.92)} L ${r2(cx - r * 0.24)} ${r2(cy - r * 0.66)} Z`, a.base, sw * 0.8) +
        ipath(`M ${r2(cx + r * 0.5)} ${r2(cy - r * 0.55)} L ${r2(cx + r * 0.62)} ${r2(cy - r * 0.92)} L ${r2(cx + r * 0.24)} ${r2(cy - r * 0.66)} Z`, a.base, sw * 0.8);
      const eyes =
        disc(cx - r * 0.28, cy - r * 0.12, r * 0.26, a.light, ink, sw * 0.8) + disc(cx - r * 0.28, cy - r * 0.12, r * 0.1, ink, 'none', 0) +
        disc(cx + r * 0.28, cy - r * 0.12, r * 0.26, a.light, ink, sw * 0.8) + disc(cx + r * 0.28, cy - r * 0.12, r * 0.1, ink, 'none', 0);
      const beak = ipath(`M ${r2(cx)} ${r2(cy + r * 0.02)} L ${r2(cx - r * 0.12)} ${r2(cy + r * 0.16)} L ${r2(cx + r * 0.12)} ${r2(cy + r * 0.16)} Z`, a.shade, sw * 0.6);
      return body + tufts + eyes + beak;
    }
    case 'mountain': {
      // Two peaks with snow caps.
      const back = ipath(`M ${r2(cx - r * 0.2)} ${r2(cy + r * 0.7)} L ${r2(cx + r * 0.4)} ${r2(cy - r * 0.5)} L ${r2(cx + r * 0.85)} ${r2(cy + r * 0.7)} Z`, a.shade, sw);
      const front = ipath(`M ${r2(cx - r * 0.85)} ${r2(cy + r * 0.7)} L ${r2(cx - r * 0.15)} ${r2(cy - r * 0.7)} L ${r2(cx + r * 0.5)} ${r2(cy + r * 0.7)} Z`, a.base, sw);
      const snow = ipath(`M ${r2(cx - r * 0.34)} ${r2(cy - r * 0.34)} L ${r2(cx - r * 0.15)} ${r2(cy - r * 0.7)} L ${r2(cx + r * 0.04)} ${r2(cy - r * 0.34)} Q ${r2(cx - r * 0.15)} ${r2(cy - r * 0.18)} ${r2(cx - r * 0.34)} ${r2(cy - r * 0.34)} Z`, a.light, 0);
      return back + front + snow;
    }
    case 'crown': {
      // The Regalia crown: a band with three soft points and finials.
      const bandTop = cy + r * 0.2;
      const band = rrect(cx - r * 0.7, bandTop, r * 1.4, r * 0.5, a.base, r * 0.12, sw);
      const peaks = ipath(
        `M ${r2(cx - r * 0.7)} ${r2(bandTop + r * 0.1)} L ${r2(cx - r * 0.62)} ${r2(cy - r * 0.55)} L ${r2(cx - r * 0.3)} ${r2(cy - r * 0.05)} ` +
        `L ${r2(cx)} ${r2(cy - r * 0.7)} L ${r2(cx + r * 0.3)} ${r2(cy - r * 0.05)} L ${r2(cx + r * 0.62)} ${r2(cy - r * 0.55)} ` +
        `L ${r2(cx + r * 0.7)} ${r2(bandTop + r * 0.1)} Z`,
        a.base, sw);
      const gems =
        disc(cx - r * 0.62, cy - r * 0.62, r * 0.12, a.light, ink, sw * 0.6) +
        disc(cx, cy - r * 0.78, r * 0.13, a.light, ink, sw * 0.6) +
        disc(cx + r * 0.62, cy - r * 0.62, r * 0.12, a.light, ink, sw * 0.6);
      const jewel = disc(cx, bandTop + r * 0.25, r * 0.13, a.light, ink, sw * 0.7);
      return peaks + band + gems + jewel;
    }
    default:
      return '';
  }
}

/** Lay the charge(s) out per arrangement and paint them. `compact` shrinks the
 * focal charge to leave room for an ordinary or a division seam. */
function paintArrangement(c: Crest, a: DuotoneScheme, fieldBase: string, sw: number, compact: boolean): string {
  const R = compact ? 21 : 25;
  const cy = FOCUS_Y;
  switch (c.arrangement) {
    case 'single':
      return paintCharge(c.charge, c.points, CX, cy, R, a, fieldBase, sw);
    case 'pair':
      return (
        paintCharge(c.charge, c.points, CX - 17, cy, R * 0.62, a, fieldBase, sw) +
        paintCharge(c.charge, c.points, CX + 17, cy, R * 0.62, a, fieldBase, sw)
      );
    case 'triad':
      return (
        paintCharge(c.charge, c.points, CX, cy - 16, R * 0.52, a, fieldBase, sw) +
        paintCharge(c.charge, c.points, CX - 17, cy + 13, R * 0.52, a, fieldBase, sw) +
        paintCharge(c.charge, c.points, CX + 17, cy + 13, R * 0.52, a, fieldBase, sw)
      );
  }
}

// ── bordure ─────────────────────────────────────────────────────

/** The bordure as a thick inner stroke that follows the escutcheon outline. */
function paintBordure(c: Crest, shieldPath: string, fill: string): string {
  if (c.bordure === 'none') return '';
  const dash = c.bordure === 'engrailed' ? ` stroke-dasharray="7 3.4" stroke-linecap="round"` : '';
  // A fat stroke, clipped to the shield, reads as a border band inside the edge.
  return `<path d="${shieldPath}" fill="none" stroke="${fill}" stroke-width="13"${dash} stroke-linejoin="round"/>`;
}

// ── assembly ────────────────────────────────────────────────────

export interface CrestSvgOptions {
  /** Rendered edge length in px (viewBox aspect is preserved). Default 120. */
  size?: number;
  /** Override the accessible title. Default `Arms of <@handle>`. */
  title?: string;
}

/** A one-line blazon string, handy for captions and tests. */
export function blazon(c: Crest): string {
  const parts = [c.shape, `${c.field} field`];
  if (c.division !== 'plain') parts.push(`per ${c.division} ${c.divisionHue}`);
  else if (c.treatment === 'diaper') parts.push('diapered');
  if (c.ordinary !== 'none') parts.push(`${c.ordinaryHue} ${c.ordinary}`);
  if (c.bordure !== 'none') parts.push(`${c.bordure} ${c.bordureHue} bordure`);
  const chargeName = c.points ? `${c.points}-${c.charge}` : c.charge;
  parts.push(`${c.accent} ${chargeName}${c.arrangement === 'single' ? '' : ` (${c.arrangement})`}`);
  return parts.join(' · ');
}

/**
 * Paint a builder's arms as a self-contained SVG string — drop it into a page, a
 * coin's face, or the Treasury. Deterministic: same handle, byte-identical SVG.
 */
export function crestSvg(handle: string, opts: CrestSvgOptions = {}): string {
  const c = readCrest(handle);
  const size = opts.size ?? 120;
  const field = duotone(REGALIA[c.field]);
  const divisionHue = duotone(REGALIA[c.divisionHue]);
  const ordinaryHue = duotone(REGALIA[c.ordinaryHue]);
  const bordureHue = duotone(REGALIA[c.bordureHue]);
  const chargeHue = duotone(REGALIA[c.accent]);
  const ink = REGALIA.ink;
  const sw = 3.2;

  const shield = softPath(shapePoints(c.shape), 1);
  const id = seedFor(handle).toString(36);
  const clipId = `crest-${id}`;
  const title = opts.title ?? `Arms of ${c.handle}`;

  // Shrink the focal charge only when a band or seam shares its space.
  const compact = c.division !== 'plain' || c.ordinary !== 'none';
  // The charge carves against whatever it sits on; on a divided field the safe
  // background is the field (charges are placed on the field side of centre).
  const carve = field.base;

  const interior =
    `<path d="${shield}" fill="${field.base}"/>` +
    (c.division !== 'plain' ? paintDivision(c, divisionHue.base) : '') +
    (c.treatment === 'diaper' ? paintDiaper(field.light) : '') +
    (c.ordinary !== 'none' ? paintOrdinary(c, ordinaryHue.base) : '') +
    paintBordure(c, shield, bordureHue.base) +
    paintArrangement(c, chargeHue, carve, sw, compact);

  return (
    `<svg viewBox="0 0 ${VB_W} ${VB_H}" width="${size}" height="${r2((size * VB_H) / VB_W)}" ` +
    `xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title}">` +
    `<title>${title}</title>` +
    `<defs><clipPath id="${clipId}"><path d="${shield}"/></clipPath></defs>` +
    `<g clip-path="url(#${clipId})">${interior}</g>` +
    `<path d="${shield}" fill="none" stroke="${ink}" stroke-width="${sw + 0.6}" stroke-linejoin="round"/>` +
    `</svg>`
  );
}
