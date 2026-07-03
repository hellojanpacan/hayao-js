// Palette a11y gate — proves the Kentō palette's contrast claims with numbers,
// not eyes. Run: `npm run palette`. Exits non-zero if any required pairing drops
// below its WCAG 2.1 threshold, so "AA verified" stays true as the palette evolves.
//
// Thresholds: body text needs >= 4.5 (AA); a large gameplay MARK needs >= 3.0
// (AA for large text / non-text UI). Per house style, marks also carry a dark ink
// outline, so 3.0 is a floor the FILL clears on its own before the edge helps.

import { KENTO, MEADOW, DUSK } from '../src/art/palette';

const TEXT_AA = 4.5;
const MARK_AA = 3.0;

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

interface Check {
  label: string;
  fg: string;
  bg: string;
  min: number;
}

const checks: Check[] = [];
const text = (label: string, fg: string, bg: string) => checks.push({ label, fg, bg, min: TEXT_AA });
const mark = (label: string, fg: string, bg: string) => checks.push({ label, fg, bg, min: MARK_AA });

// Light woodblock: ink roles as body text on washi.
text('sumi text / washi', KENTO.sumi, KENTO.washi);
text('sumiSoft text / washi', KENTO.sumiSoft, KENTO.washi);
text('stone text / washi', KENTO.stone, KENTO.washi);
// Dark nightblock: paper inks as body text on kuro.
text('gofun text / kuro', KENTO.gofun, KENTO.kuro);
text('kinako text / kuro', KENTO.kinako, KENTO.kuro);

// Every hue as a gameplay mark: deep tone on light, bright tone on dark.
const hues = ['shu', 'kaki', 'ko', 'matsu', 'asagi', 'ai', 'fuji', 'saku'] as const;
for (const h of hues) {
  mark(`${h}Deep mark / washi`, KENTO[`${h}Deep`], KENTO.washi);
  mark(`${h} mark / sumi`, KENTO[h], KENTO.sumi);
  mark(`${h} mark / kuro`, KENTO[h], KENTO.kuro);
}

// The role slots each default palette actually exposes must clear their bar.
for (const p of [MEADOW, DUSK]) {
  text(`${p.name} ink / bg`, p.ink, p.bg);
  text(`${p.name} inkSoft / bg`, p.inkSoft, p.bg);
  for (const role of ['accent', 'accent2', 'good', 'warn'] as const) {
    mark(`${p.name} ${role} / bg`, p[role], p.bg);
  }
  p.ramp.forEach((c, i) => mark(`${p.name} ramp[${i}] / bg`, c, p.bg));
}

let failures = 0;
for (const c of checks) {
  const r = contrast(c.fg, c.bg);
  const ok = r >= c.min;
  if (!ok) failures++;
  const tag = ok ? 'ok  ' : 'FAIL';
  console.log(`  ${tag}  ${r.toFixed(2).padStart(5)}  (>= ${c.min})  ${c.label}`);
}

console.log(`\n${checks.length - failures}/${checks.length} pairings pass.`);
if (failures > 0) {
  console.error(`\n✗ ${failures} contrast failure(s) — palette not AA-clean.`);
  process.exit(1);
}
console.log('✓ Kentō palette is WCAG-AA clean.');
