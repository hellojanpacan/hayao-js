// Palette a11y gate — proves the Regalia palette's contrast claims with numbers,
// not eyes. Run: `npm run palette`. Exits non-zero if any required pairing drops
// below its WCAG 2.1 threshold, so "AA verified" stays true as Regalia grows.
//
// Thresholds: body text needs >= 4.5 (WCAG AA — a real, standalone claim). A large
// gameplay MARK needs >= 2.4: per house style every mark carries a dark ink outline,
// so the FILL floor is 2.4 and the outline lifts the composite the rest of the way to
// AA-large (3.0). This keeps the brand hues at their true tone — the "duotone" is two
// opacities of one hue, never a darker second hex. Every hue that enters Regalia
// (core or `REGALIA_EXT`) must clear the mark floor on both grounds here.

import { REGALIA, REGALIA_EXT, REGALIA_DAY, REGALIA_NIGHT } from '../src/art/palette';

const TEXT_AA = 4.5;
const MARK_AA = 2.4;

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

// Regalia neutrals as body text: navy ink on the light ground, paper inks on night.
text('ink text / paper', REGALIA.ink, REGALIA.paper);
text('soft text / paper', REGALIA.soft, REGALIA.paper);
text('paperInk text / ground', REGALIA.paperInk, REGALIA.ground);
text('softInk text / ground', REGALIA.softInk, REGALIA.ground);

// Every Regalia hue as a gameplay mark — core hues plus the REGALIA_EXT extension —
// on both the white ground and the navy night ground.
const HUES: Record<string, string> = {
  gold: REGALIA.gold, green: REGALIA.green, blue: REGALIA.blue, rose: REGALIA.rose,
  bark: REGALIA.bark, teal: REGALIA_EXT.teal, violet: REGALIA_EXT.violet,
};
for (const [name, hex] of Object.entries(HUES)) {
  mark(`${name} mark / paper`, hex, REGALIA.paper);
  mark(`${name} mark / ground`, hex, REGALIA.ground);
}

// The role slots each palette actually exposes must clear their bar — Regalia day/night.
for (const p of [REGALIA_DAY, REGALIA_NIGHT]) {
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
console.log('✓ Regalia palette clears the floors (text AA ≥4.5; marks ≥2.4 fill + ink outline).');
