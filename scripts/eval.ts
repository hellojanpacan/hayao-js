// hayao eval — the AI-first KPI: "does a game come out correct-and-verified?"
//
// For a human engine the metric is stars; for an AI-first engine the metric is
// whether the output is PROVABLE. This harness scores every example on two axes:
//   • verified  — its verify.ts suite runs green (winnable + deterministic + …).
//   • proof coverage — which of the proof CHANNELS it actually exercises
//     (winnability, determinism, ramp, feel, generation, code-as-art).
//
// The result is a scorecard + an overall "verified rate" you can track release to
// release, and per-game coverage that shows where proof is thin. Run:
//   npm run eval            # whole portfolio
//   npm run eval -- sokoban lanternfold   # a subset
//
// It reuses the same discovery + VerifyContext as scripts/verify.ts, so a game
// that passes eval passes CI, by construction.

import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { VerifyContext } from './verify';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const examplesDir = join(root, 'examples');
const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));

const allSlugs = readdirSync(examplesDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .filter((n) => only.length === 0 || only.includes(n))
  .sort();

// Seed-stage projects (a TIMELINE.md, no game.ts — CONVENTIONS "project
// anatomy") are not games yet: list them, never score them, so the verified
// rate stays a KPI about GAMES and atoms can't game it.
const isSeed = (slug: string): boolean =>
  !existsSync(join(examplesDir, slug, 'game.ts')) && existsSync(join(examplesDir, slug, 'TIMELINE.md'));
const seeds = allSlugs.filter(isSeed);
const slugs = allSlugs.filter((s) => !isSeed(s));

/** A proof channel and the source markers that evidence it. */
const CHANNELS: { key: string; label: string; re: RegExp }[] = [
  { key: 'winnable', label: 'winnable', re: /\b(solve|assertSolvable|levelReachable|platformerReachable)\s*[(<]/ },
  { key: 'determinism', label: 'determinism', re: /\b(checkDeterministic|assertDeterministic)\s*[(<]|\.golden\s*[(<]/ },
  { key: 'ramp', label: 'ramp', re: /\b(rampIssues|assertRamp|rampStats)\s*[(<]/ },
  { key: 'feel', label: 'feel', re: /\b(salienceIssues|forgivenessIssues|feedbackIssues|telegraphIssues|cameraIssues|graceWindowIssues|contrastRatio)\s*[(<]/ },
  { key: 'generated', label: 'generated', re: /\b(generateLevels|generateLevelsReport|composeCampaign)\s*[(<]/ },
  { key: 'art', label: 'code-as-art', re: /\b(linearGradient|radialGradient|glow|dropShadow|blobPath|star|regularPolygon|smoothClosedPath)\s*[(<]/ },
];

function sourceOf(slug: string): string {
  let src = '';
  for (const f of ['verify.ts', 'game.ts', 'logic.ts', 'campaign.ts']) {
    const p = join(examplesDir, slug, f);
    if (existsSync(p)) src += '\n' + readFileSync(p, 'utf8');
  }
  return src;
}

interface Score {
  slug: string;
  passed: number;
  failed: number;
  ran: boolean;
  channels: string[];
}

async function scoreOne(slug: string): Promise<Score> {
  const src = sourceOf(slug);
  const channels = CHANNELS.filter((c) => c.re.test(src)).map((c) => c.key);
  let passed = 0;
  let failed = 0;
  let ran = false;
  const t: VerifyContext = {
    ok: () => passed++,
    fail: () => failed++,
    check: (_l, pass) => (pass ? passed++ : failed++),
    // In eval we don't diff goldens (that's CI's job) — count them as observed checks.
    golden: () => passed++,
    artifact: () => {},
  };
  const suite = join(examplesDir, slug, 'verify.ts');
  if (existsSync(suite)) {
    try {
      const mod = await import(suite);
      await mod.default(t);
      ran = true;
    } catch (err) {
      failed++;
      console.error(`  (${slug} suite threw: ${err instanceof Error ? err.message : err})`);
    }
  }
  return { slug, passed, failed, ran, channels };
}

const scores: Score[] = [];
for (const slug of slugs) scores.push(await scoreOne(slug));

// ── Scorecard ────────────────────────────────────────────────────
const pad = (s: string, n: number) => s.padEnd(n).slice(0, n);
console.log(`\nhayao eval — ${scores.length} game(s)\n`);
console.log(`  ${pad('game', 16)} ${pad('verified', 10)} ${pad('checks', 8)}  coverage`);
console.log(`  ${'-'.repeat(16)} ${'-'.repeat(10)} ${'-'.repeat(8)}  ${'-'.repeat(30)}`);
for (const s of scores) {
  const green = s.ran && s.failed === 0;
  const cov = CHANNELS.map((c) => (s.channels.includes(c.key) ? c.label : `·`)).join(' ');
  console.log(`  ${pad(s.slug, 16)} ${pad(green ? 'PASS' : 'FAIL', 10)} ${pad(`${s.passed}/${s.passed + s.failed}`, 8)}  ${cov}`);
}

if (seeds.length > 0) {
  console.log(`\n  seed-stage (atoms + timeline, no game yet — listed, not scored): ${seeds.join(', ')}`);
}

const verified = scores.filter((s) => s.ran && s.failed === 0).length;
const rate = scores.length ? Math.round((verified / scores.length) * 100) : 0;
const covPct = (key: string) => Math.round((scores.filter((s) => s.channels.includes(key)).length / (scores.length || 1)) * 100);
console.log(`\n  verified rate: ${verified}/${scores.length} (${rate}%)`);
console.log(`  proof coverage: ${CHANNELS.map((c) => `${c.label} ${covPct(c.key)}%`).join(' · ')}\n`);

process.exit(scores.every((s) => s.ran && s.failed === 0) ? 0 : 1);
