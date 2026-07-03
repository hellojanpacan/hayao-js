// Curated palettes — code-as-art means no arbitrary RGB; pick from a named,
// on-model set. The default is "Kentō" (見当): the woodblock-registration palette
// that also dresses hayao.dev. It fuses the site's washi/sumi/ai/shu ink tokens
// with landscape hues loosely drawn from Lospec's "Miyazaki 16", giving a warm,
// low-key set that reads cleanly in BOTH light and dark games. Every pairing here
// is WCAG-AA verified (see scripts/palette-audit.ts); the engine stays fully
// palette-agnostic — this is a nice starting point, never a restriction.

import type { Rng } from '../core/rng';
import { dexp2, dlog2 } from '../core/dmath';

/**
 * The Kentō swatch set — the single source of truth every named palette derives
 * from. Neutrals form one continuous ground→ink ramp; each of the eight hues has
 * a `Deep` tone (holds AA as a large mark on light washi) and a bright tone (pops
 * on dark sumi/kuro). Traditional Japanese color names keep it on-brand. Pick a
 * hue by name the way the site does, or use a ready-made `Palette` below.
 */
export const KENTO = {
  // neutrals: light ground → dark ink, one continuous ramp
  gofun: '#f7f1e2', // 胡粉  shell-white, lightest paper
  washi: '#efe7d3', // 和紙  default light ground
  kinu: '#e4d8bd', //  絹    warm raised panel / card
  line: '#d8cbac', //  ─     hairline / grid on light
  kinako: '#b9a882', // 黄粉  tan mid-neutral / muted ink on dark
  stone: '#6c6252', // 石    secondary text on light (AA at body size)
  sumiSoft: '#494133', // 墨薄  body ink
  sumi: '#23201a', // 墨    primary ink / default dark-ish ground
  kuro: '#181820', // 玄    cool near-black ground for dark games
  yohaku: '#12121a', // 余白  deepest dark ground
  darkLine: '#2c2c36', //     hairline / grid on dark

  // eight hues: `Deep` for light-mode fills, bright for dark-mode / emphasis
  shuDeep: '#b23a24', shu: '#d9583c', //   朱  vermilion
  kakiDeep: '#bf6a1c', kaki: '#e79a49', //  柿  persimmon / orange
  koDeep: '#94741d', ko: '#e3c054', //     黄土 ochre-gold
  matsuDeep: '#4a7a3a', matsu: '#8bad52', // 松葉 pine green
  asagiDeep: '#2c7a90', asagi: '#57bad2', // 浅葱 teal-cyan
  aiDeep: '#2b4257', ai: '#5a86ad', //     藍  indigo
  fujiDeep: '#63548c', fuji: '#a091cf', //  藤  wisteria violet
  sakuDeep: '#b0506e', saku: '#e097ac', //  桜  dusty rose
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
  swatches?: typeof KENTO;
}

/** Default light woodblock palette — washi ground, sumi ink, deep accents. */
export const MEADOW: Palette = {
  name: 'meadow',
  bg: KENTO.washi,
  ink: KENTO.sumi,
  inkSoft: KENTO.sumiSoft,
  line: KENTO.line,
  accent: KENTO.shuDeep,
  accent2: KENTO.aiDeep,
  good: KENTO.matsuDeep,
  warn: KENTO.kakiDeep,
  // deep tones so categorical fills hold contrast on the light ground
  ramp: [KENTO.shuDeep, KENTO.kakiDeep, KENTO.koDeep, KENTO.matsuDeep, KENTO.asagiDeep, KENTO.aiDeep, KENTO.fujiDeep, KENTO.sakuDeep],
  swatches: KENTO,
};

/** Dark counterpart — kuro ground, gofun ink, the same hues in their bright tone. */
export const DUSK: Palette = {
  name: 'dusk',
  bg: KENTO.kuro,
  ink: KENTO.gofun,
  inkSoft: KENTO.kinako,
  line: KENTO.darkLine,
  accent: KENTO.shu,
  accent2: KENTO.asagi,
  good: KENTO.matsu,
  warn: KENTO.ko,
  // bright tones so categorical fills pop on the dark ground
  ramp: [KENTO.shu, KENTO.kaki, KENTO.ko, KENTO.matsu, KENTO.asagi, KENTO.ai, KENTO.fuji, KENTO.saku],
  swatches: KENTO,
};

/** Higher-key paper variant — brightest ground, same hue family. */
export const PAPER: Palette = {
  name: 'paper',
  bg: KENTO.gofun,
  ink: KENTO.sumi,
  inkSoft: KENTO.stone,
  line: KENTO.kinu,
  accent: KENTO.sakuDeep,
  accent2: KENTO.asagiDeep,
  good: KENTO.matsuDeep,
  warn: KENTO.kakiDeep,
  ramp: [KENTO.sakuDeep, KENTO.kakiDeep, KENTO.koDeep, KENTO.matsuDeep, KENTO.asagiDeep, KENTO.aiDeep, KENTO.fujiDeep, KENTO.shuDeep],
  swatches: KENTO,
};

export const PALETTES: Record<string, Palette> = { meadow: MEADOW, dusk: DUSK, paper: PAPER };

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
// routes through dmath (dexp2/dlog2) so it's bit-identical across engines and
// never trips the "no Math.pow" invariant.

function dpow(base: number, exp: number): number {
  if (base <= 0) return 0;
  return dexp2(exp * dlog2(base));
}
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
