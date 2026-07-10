// Deterministic heraldry — a builder's *arms*, a pure function of their handle.
//
// The engine's soul is "a game is a pure, deterministic function of its inputs";
// this makes a builder's identity the same kind of function. `@aldric` always
// yields the same arms — nobody picks a crest, the handle draws it. Every coin a
// builder strikes bears these arms, so provenance is visible on the coin's face.
//
// Style is strict Regalia: soft, rounded, Bold-Duotone. Every outline routes
// through `smoothClosedPath` so nothing carries a sharp corner, every mass takes
// a dark-ink outline (the house mark-floor rule), and every hue is a named
// Regalia swatch — never a hand-typed RGB. Pure: same handle, same SVG, forever.

import { REGALIA } from './palette';
import { duotone, type DuotoneScheme } from './duotone';
import { Rng } from '../core/rng';
import { hashValue } from '../core/hash';
import { smoothClosedPath } from './shapes';
import { dcos, dsin } from '../core/dmath';
import { TAU, type Vec2 } from '../core/math';

/** The five Regalia field hues an arms can wear. Neutrals stay for ink/paper. */
const HUES = ['gold', 'green', 'blue', 'rose', 'bark'] as const;
export type CrestHue = (typeof HUES)[number];

/** The soft charges — no sharp edges, all Bold-Duotone. */
const CHARGES = ['roundel', 'ring', 'pellets', 'rosette', 'crescent', 'leaf'] as const;
export type CrestCharge = (typeof CHARGES)[number];

/** How the charge is laid on the field. */
export type CrestArrangement = 'single' | 'pair' | 'triad';
/** An optional soft division of the field, in the accent hue. */
export type CrestDivision = 'plain' | 'chief' | 'base';

/** The deterministic description of a builder's arms — the "blazon". */
export interface Crest {
  handle: string;
  field: CrestHue;
  accent: CrestHue;
  charge: CrestCharge;
  arrangement: CrestArrangement;
  division: CrestDivision;
}

/** Fold a handle into a stable 32-bit seed — case/space-insensitive. */
function seedFor(handle: string): number {
  const hex = hashValue(handle.trim().toLowerCase());
  let n = 0;
  for (let i = 0; i < hex.length; i++) n = (Math.imul(n, 31) + hex.charCodeAt(i)) >>> 0;
  return n || 1;
}

/**
 * Read a builder's arms from their handle. Pure and deterministic — the same
 * handle always blazons the same crest. This is the spec; `crestSvg` paints it.
 */
export function readCrest(handle: string): Crest {
  const rng = new Rng(seedFor(handle));
  const field = rng.pick(HUES);
  // accent is always a different hue, so charge-on-field never washes out.
  const accent = rng.pick(HUES.filter((h) => h !== field));
  const charge = rng.pick(CHARGES);
  const arrangement = rng.pick(['single', 'pair', 'triad'] as const);
  const division = rng.pick(['plain', 'plain', 'chief', 'base'] as const); // plain weighted
  return { handle, field, accent, charge, arrangement, division };
}

// ── geometry ────────────────────────────────────────────────────
// A 120×132 viewBox. The shield is a rounded heater, built from points and
// smoothed so its corners and point are soft.

const VB_W = 120;
const VB_H = 132;
const CX = 60;

const r2 = (v: number): number => Math.round(v * 100) / 100;

/** The soft shield outline as an SVG path, centered in the viewBox. */
function shieldPath(): string {
  const pts: Vec2[] = [
    { x: 20, y: 30 },
    { x: 60, y: 26 },
    { x: 100, y: 30 },
    { x: 103, y: 74 },
    { x: 60, y: 122 },
    { x: 17, y: 74 },
  ];
  return smoothClosedPath(pts, 1);
}

function disc(cx: number, cy: number, r: number, fill: string, stroke: string, sw: number): string {
  return `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r)}" fill="${fill}" stroke="${stroke}" stroke-width="${r2(sw)}"/>`;
}

/** Paint one charge at (cx,cy) with radius r, in the accent duotone. */
function paintCharge(
  charge: CrestCharge,
  cx: number,
  cy: number,
  r: number,
  a: DuotoneScheme,
  fieldBase: string,
  sw: number,
): string {
  const ink = REGALIA.ink;
  switch (charge) {
    case 'roundel':
      return disc(cx, cy, r, a.base, ink, sw) + disc(cx, cy, r * 0.46, a.light, ink, sw * 0.8);
    case 'ring':
      // bullseye of soft concentric discs — reads as an annulet without stroking
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
      // a soft moon: an accent disc with a field-colored disc carved out of it
      return disc(cx, cy, r, a.base, ink, sw) + disc(cx + r * 0.42, cy - r * 0.14, r * 0.86, fieldBase, 'none', 0);
    case 'leaf': {
      const pts: Vec2[] = [
        { x: cx, y: cy - r },
        { x: cx + r * 0.62, y: cy - r * 0.1 },
        { x: cx + r * 0.2, y: cy + r },
        { x: cx - r * 0.2, y: cy + r },
        { x: cx - r * 0.62, y: cy - r * 0.1 },
      ];
      return `<path d="${smoothClosedPath(pts, 1)}" fill="${a.base}" stroke="${ink}" stroke-width="${r2(sw)}"/>`;
    }
  }
}

/** Lay the charge(s) out per arrangement and paint them. */
function paintArrangement(c: Crest, a: DuotoneScheme, fieldBase: string, sw: number): string {
  const cy = 64;
  switch (c.arrangement) {
    case 'single':
      return paintCharge(c.charge, CX, cy, 24, a, fieldBase, sw);
    case 'pair':
      return (
        paintCharge(c.charge, CX - 17, cy, 15, a, fieldBase, sw) +
        paintCharge(c.charge, CX + 17, cy, 15, a, fieldBase, sw)
      );
    case 'triad':
      return (
        paintCharge(c.charge, CX, cy - 15, 13, a, fieldBase, sw) +
        paintCharge(c.charge, CX - 16, cy + 13, 13, a, fieldBase, sw) +
        paintCharge(c.charge, CX + 16, cy + 13, 13, a, fieldBase, sw)
      );
  }
}

export interface CrestSvgOptions {
  /** Rendered edge length in px (square-ish viewBox is preserved). Default 120. */
  size?: number;
  /** Override the accessible title. Default `Arms of <handle>`. */
  title?: string;
}

/**
 * Paint a builder's arms as a self-contained SVG string — drop it into a page, a
 * coin's face, or the Treasury. Deterministic: same handle, byte-identical SVG.
 */
export function crestSvg(handle: string, opts: CrestSvgOptions = {}): string {
  const c = readCrest(handle);
  const size = opts.size ?? 120;
  const field = duotone(REGALIA[c.field]);
  const accent = duotone(REGALIA[c.accent]);
  const ink = REGALIA.ink;
  const sw = 3.2;
  const shield = shieldPath();
  const clipId = `crest-${seedFor(handle).toString(36)}`;
  const title = opts.title ?? `Arms of ${handle}`;

  // optional division band, clipped to the shield so it can't spill the edge
  let division = '';
  if (c.division === 'chief') division = `<rect x="0" y="0" width="${VB_W}" height="46" fill="${accent.base}"/>`;
  else if (c.division === 'base') division = `<rect x="0" y="84" width="${VB_W}" height="${VB_H}" fill="${accent.base}"/>`;
  // when a band uses the accent, the charge flips to the field hue for contrast
  const chargeScheme = c.division === 'plain' ? accent : field;
  const fieldForCarve = c.division === 'plain' ? field.base : accent.base;

  return (
    `<svg viewBox="0 0 ${VB_W} ${VB_H}" width="${size}" height="${r2((size * VB_H) / VB_W)}" ` +
    `xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title}">` +
    `<title>${title}</title>` +
    `<defs><clipPath id="${clipId}"><path d="${shield}"/></clipPath></defs>` +
    `<path d="${shield}" fill="${field.base}"/>` +
    (division ? `<g clip-path="url(#${clipId})">${division}</g>` : '') +
    paintArrangement(c, chargeScheme, fieldForCarve, sw) +
    `<path d="${shield}" fill="none" stroke="${ink}" stroke-width="${sw + 0.6}" stroke-linejoin="round"/>` +
    `</svg>`
  );
}
