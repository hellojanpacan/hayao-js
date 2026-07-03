// Curated palettes — code-as-art means no arbitrary RGB; pick from a named,
// on-model set. Default is a warm, high-legibility "Meadow" palette (a nod to
// the Ghibli/Miyazaki-ish direction the engine is named for).

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
}

export const MEADOW: Palette = {
  name: 'meadow',
  bg: '#f3ecdb',
  ink: '#3d3323',
  inkSoft: '#6f6047',
  line: '#d9ccae',
  accent: '#a11d3a',
  accent2: '#5a7d4e',
  good: '#4d6b3c',
  warn: '#c8791f',
  ramp: ['#a11d3a', '#c8791f', '#c9a22f', '#5a7d4e', '#3f7d8c', '#6a4c93'],
};

export const DUSK: Palette = {
  name: 'dusk',
  bg: '#1c1a24',
  ink: '#efe9f2',
  inkSoft: '#a89fb5',
  line: '#3a3546',
  accent: '#e26d8a',
  accent2: '#6cc4a1',
  good: '#6cc4a1',
  warn: '#e8b64a',
  ramp: ['#e26d8a', '#e8b64a', '#f2e07a', '#6cc4a1', '#5aa9d6', '#b493e6'],
};

export const PAPER: Palette = {
  name: 'paper',
  bg: '#faf7f0',
  ink: '#2b2b2b',
  inkSoft: '#666',
  line: '#e2ddd2',
  accent: '#d1495b',
  accent2: '#2e86ab',
  good: '#3c896d',
  warn: '#e0902f',
  ramp: ['#d1495b', '#e0902f', '#edc531', '#3c896d', '#2e86ab', '#8a5a9e'],
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
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}
