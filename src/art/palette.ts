// Curated palettes — code-as-art means no arbitrary RGB; pick from a named,
// on-model set. The one canonical system is "Regalia": Hayao's clean, friendly
// "Bold Duotone" brand hues (the crown palette that dresses hayao.dev), expressed
// for gameplay as a paper→ink light ramp plus a navy night ramp. It reads cleanly
// in BOTH light and dark games. Every pairing here is WCAG-AA verified (see
// scripts/palette-audit.ts); the engine stays fully palette-agnostic — Regalia is
// the default look, expandable by need ("grow by the job"), never a restriction.

import type { Rng } from '../core/rng';
import { dpow } from '../core/dmath';

/**
 * The Regalia swatch set — Hayao's clean, friendly "Bold Duotone" brand hues (the
 * crown palette that dresses hayao.dev), expressed for gameplay as
 * two mirrored neutral ramps — a paper→ink day side and a navy night side — plus
 * the five brand hues at their true, single tone — the "duotone" is the two
 * OPACITIES of a hue in use (see duotone.ts), never a second hex. Every hue clears
 * the house mark floor (2.4) on both the white and the night ground, and carries a
 * dark ink outline that lifts the composite to AA — verified in palette-audit.ts.
 * `rose` and `bark` are purpose-scoped (vitality / material) but live here so games
 * that need health or wood tones stay on-model. This is the one canonical look;
 * grow it by need, never by mood — derive any new series hue with `mix()` when a
 * real job appears, never a hand-typed hex.
 */
export const REGALIA = {
  // neutrals: the SAME seven roles on each ground, mirrored day ↔ night, so a
  // light/dark toggle swaps sides role-for-role with nothing missing:
  //   canvas · raised · sunken · hairline · muted label · secondary text · primary ink

  // day side: white ground → navy ink
  paper: '#ffffff', //     canvas / lightest ground, light games
  mist: '#f4f6fb', //      raised card
  cloud: '#eef1f6', //     sunken panel
  line: '#e7e8ee', //      hairline / grid
  muted: '#8b90a6', //     muted labels (not body text)
  soft: '#5a6072', //      secondary text (AA)
  ink: '#29335c', //  冠   primary ink / navy — text + structure

  // night side: navy ground → paper ink
  ground: '#141a30', //    canvas / deepest ground, dark games
  night: '#1d2542', //     raised panel
  shade: '#273053', //     sunken panel — mix(night, darkLine, 0.5)
  darkLine: '#303a63', //  hairline / grid
  mutedInk: '#727b9c', //  muted labels (not body text) — mix(darkLine, softInk, 0.5)
  softInk: '#b3bbd4', //   secondary text (AA)
  paperInk: '#eef1f9', //  primary ink on the night ground

  // the five brand hues — one true tone each, dressed as two-opacity duotones in use
  gold: '#e59500', //  the Regalia crown — primary / joy
  green: '#337357', // growth / success
  blue: '#669bbc', //  calm / sky / tech
  rose: '#c65b5b', //  VITALITY: health / damage
  bark: '#7a4f34', //  MATERIAL: wood / earth
} as const;

export interface Palette {
  name: string;
  bg: string;
  ink: string;
  inkSoft: string;
  line: string;
  accent: string;
  accent2: string;
  good: string;
  warn: string;
  /** A small ordered ramp for categorical fills. */
  ramp: string[];
  /** The full on-brand swatch set, for games that pick hues by name. */
  swatches?: typeof REGALIA;
}

/**
 * Default clean/friendly palette — white ground, navy ink, gold accent. The Bold
 * Duotone brand look; `new-game` scaffolds with this. Marks are the plain brand
 * hues; each clears the 2.4 mark floor on white and its dark ink outline lifts the
 * composite to AA.
 */
export const REGALIA_DAY: Palette = {
  name: 'regalia',
  bg: REGALIA.paper,
  ink: REGALIA.ink,
  inkSoft: REGALIA.soft,
  line: REGALIA.line,
  accent: REGALIA.gold,
  accent2: REGALIA.blue,
  good: REGALIA.green,
  warn: REGALIA.rose, // rose owns vitality/danger — reads truer than gold as a warning
  ramp: [REGALIA.gold, REGALIA.blue, REGALIA.green, REGALIA.rose, REGALIA.bark, REGALIA.ink],
  swatches: REGALIA,
};

/** Night counterpart — deep navy ground, paper ink, the same brand hues on the dark ground. */
export const REGALIA_NIGHT: Palette = {
  name: 'regalia-night',
  bg: REGALIA.ground,
  ink: REGALIA.paperInk,
  inkSoft: REGALIA.softInk,
  line: REGALIA.darkLine,
  accent: REGALIA.gold,
  accent2: REGALIA.blue,
  good: REGALIA.green,
  warn: REGALIA.rose,
  ramp: [REGALIA.gold, REGALIA.blue, REGALIA.green, REGALIA.rose, REGALIA.bark, REGALIA.paperInk],
  swatches: REGALIA,
};

// Regalia is the one canonical system — a day and a night dressing of the same hues.
export const PALETTES: Record<string, Palette> = {
  regalia: REGALIA_DAY,
  'regalia-night': REGALIA_NIGHT,
};

/** The default palette for new games — the clean Bold Duotone look. */
export const DEFAULT_PALETTE: Palette = REGALIA_DAY;

/** Blend two hex colors (t in [0,1]). Deterministic, no allocations of note. */
export function mix(a: string, b: string, t: number): string {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return rgbToHex(r, g, bl);
}

export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

// ── HSL / HSV constructors + drift ──────────────────────────────
// Procedural theming and palette drift (space-huggers `setHSLA`+`mutate`,
// dr1v3n-wild/dodo `.hsl`). Pure arithmetic — no trig — so it's netplay-safe.
// Colors are cosmetic; when drift reads `world.rng` it advances deterministically.

export interface HSL {
  /** Hue in degrees [0,360). */
  h: number;
  /** Saturation [0,1]. */
  s: number;
  /** Lightness [0,1]. */
  l: number;
}

const mod360 = (h: number): number => ((h % 360) + 360) % 360;
const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** HSL → hex. h in degrees (wraps), s/l in [0,1]. */
export function hsl(h: number, s: number, l: number): string {
  h = mod360(h) / 360;
  s = clamp01(s);
  l = clamp01(l);
  if (s === 0) {
    const v = l * 255;
    return rgbToHex(v, v, v);
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t: number): number => {
    t = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return rgbToHex(hue(h + 1 / 3) * 255, hue(h) * 255, hue(h - 1 / 3) * 255);
}

/** HSV/HSB → hex. h in degrees (wraps), s/v in [0,1]. */
export function hsv(h: number, s: number, v: number): string {
  h = mod360(h) / 60;
  s = clamp01(s);
  v = clamp01(v);
  const c = v * s;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 1) [r, g, b] = [c, x, 0];
  else if (h < 2) [r, g, b] = [x, c, 0];
  else if (h < 3) [r, g, b] = [0, c, x];
  else if (h < 4) [r, g, b] = [0, x, c];
  else if (h < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

/** Decompose a hex color into HSL. Inverse of `hsl()`. */
export function hexToHsl(hex: string): HSL {
  const [r255, g255, b255] = hexToRgb(hex);
  const r = r255 / 255;
  const g = g255 / 255;
  const b = b255 / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: h * 60, s, l };
}

export interface DriftAmounts {
  /** Max hue drift ± degrees. */
  hue?: number;
  /** Max saturation drift ± (absolute, [0,1]). */
  sat?: number;
  /** Max lightness drift ± (absolute, [0,1]). */
  light?: number;
}

/**
 * Drift a color in HSL space by random amounts from `world.rng` (space-huggers'
 * `mutate`). Deterministic given rng state; hue wraps, s/l clamp. Cosmetic, but
 * because it consumes rng draws, call it in a stable order.
 */
export function mutateColor(rng: Rng, hex: string, amounts: DriftAmounts = {}): string {
  const c = hexToHsl(hex);
  const dh = amounts.hue ?? 0;
  const ds = amounts.sat ?? 0;
  const dl = amounts.light ?? 0;
  return hsl(
    c.h + rng.range(-dh, dh),
    c.s + rng.range(-ds, ds),
    c.l + rng.range(-dl, dl),
  );
}

// ── gamma-correct (linear-space) interpolation + gradients ──────
// super-castle blends in linear light, not sRGB — perceptually correct, no muddy
// mid-tones. sRGB↔linear uses the exact IEC transfer curve; the 2.4 exponent
// routes through dmath's dpow so it's bit-identical across engines and never
// trips the "no Math.pow" invariant.

const srgbToLinear = (c: number): number => (c <= 0.04045 ? c / 12.92 : dpow((c + 0.055) / 1.055, 2.4));
const linearToSrgb = (c: number): number => (c <= 0.0031308 ? c * 12.92 : 1.055 * dpow(c, 1 / 2.4) - 0.055);

/** Blend two hex colors in linear light (gamma-correct). t in [0,1]. */
export function mixLinear(a: string, b: string, t: number): string {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  const chan = (i: number): number => {
    const la = srgbToLinear(pa[i] / 255);
    const lb = srgbToLinear(pb[i] / 255);
    return linearToSrgb(la + (lb - la) * t) * 255;
  };
  return rgbToHex(chan(0), chan(1), chan(2));
}

/**
 * Sample a multi-stop gradient at t in [0,1], blending in linear light. Stops
 * are evenly spaced hex colors (≥ 1). Great for procedural sky/heat/health ramps.
 */
export function sampleGradient(stops: readonly string[], t: number): string {
  if (stops.length === 0) return '#000000';
  if (stops.length === 1) return stops[0];
  const clamped = clamp01(t);
  const scaled = clamped * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(scaled));
  return mixLinear(stops[i], stops[i + 1], scaled - i);
}

/** Materialize an n-color ramp from gradient stops (linear-light interpolation). */
export function gradient(stops: readonly string[], n: number): string[] {
  if (n <= 0) return [];
  if (n === 1) return [sampleGradient(stops, 0)];
  return Array.from({ length: n }, (_, i) => sampleGradient(stops, i / (n - 1)));
}
