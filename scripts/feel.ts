// Portfolio feel audit — `npm run feel`. The feel gates raise the FLOOR of game
// feel from a vibe to a contract; this runs that contract across every game so the
// floor is one command, portfolio-wide. A game opts in by exporting a spec:
//   export const feel: FeelSpec = { avatarFill, forgiveness, feedback, scrolls };
// Games without a spec are reported as `todo` (the coverage that should rise);
// games that declare one must PASS every gate it enables, or the audit exits non-zero.
//
// Run:  npm run feel            (all games)
//       npm run feel sokoban    (one or more)

import { readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createWorld, runFeelGates, recordTimeline, series, type FeelSpec, type GameDefinition, type Vec2 } from '../src/index';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const examplesDir = join(root, 'examples');

function findGame(mod: Record<string, unknown>): GameDefinition | null {
  for (const v of Object.values(mod)) if (v && typeof v === 'object' && 'build' in v && 'title' in v) return v as GameDefinition;
  return null;
}

// Liveliness drive for camera sampling — enough motion for a scrolling follow to move.
const DRIVE: string[][] = [];
{
  const beats = [['right'], ['right', 'jump'], ['down'], ['left'], ['up'], ['action'], []];
  for (let i = 0; i < 150; i++) DRIVE.push(beats[Math.floor(i / 10) % beats.length]);
}

const numbers = (xs: unknown[]): xs is number[] => xs.every((x) => typeof x === 'number');

async function auditGame(slug: string): Promise<{ slug: string; spec: boolean; ok: boolean; line: string }> {
  const gamePath = join(examplesDir, slug, 'game.ts');
  if (!existsSync(gamePath)) return { slug, spec: false, ok: true, line: 'no game.ts' };
  const mod = await import(gamePath);
  const spec = (mod as { feel?: FeelSpec }).feel;
  const game = findGame(mod);
  if (!spec || !game) return { slug, spec: false, ok: true, line: '— (no feel spec — todo)' };

  // Rendered frame for salience.
  const world = createWorld(game);
  for (let i = 0; i < 20; i++) world.step([]);
  const commands = world.render();

  // Camera samples, if the game scrolls and its probe exposes camX/camY.
  let camSamples: Vec2[] | undefined;
  let targetSamples: Vec2[] | undefined;
  if (spec.scrolls) {
    const tl = recordTimeline(createWorld(game), DRIVE);
    const camX = series(tl, 'camX');
    const camY = series(tl, 'camY');
    if (numbers(camX) && numbers(camY)) {
      camSamples = camX.map((x, i) => ({ x, y: camY[i] })).slice(1);
      const px = series(tl, 'px');
      const py = series(tl, 'py');
      if (numbers(px) && numbers(py)) targetSamples = px.map((x, i) => ({ x, y: py[i] })).slice(1);
    }
  }

  const report = runFeelGates(spec, { commands, camSamples, targetSamples, background: game.background });
  const parts = report.sections.map((s) => `${s.gate} ${s.issues.length ? '✗' : '✓'}`);
  const skip = report.skipped.length ? `  (skipped: ${report.skipped.join(', ')})` : '';
  const detail = report.sections.filter((s) => s.issues.length).map((s) => `\n      ${s.gate}: ${s.issues[0]}`).join('');
  return { slug, spec: true, ok: report.ok, line: `${parts.join('  ')}${skip}${detail}` };
}

async function main(): Promise<void> {
  const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  const slugs = readdirSync(examplesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((n) => only.length === 0 || only.includes(n))
    .sort();

  let declared = 0;
  let passed = 0;
  let failures = 0;
  console.log('hayao feel — portfolio floor audit\n');
  for (const slug of slugs) {
    const r = await auditGame(slug);
    const mark = !r.spec ? ' ' : r.ok ? '✓' : '✗';
    console.log(`  ${mark} ${slug.padEnd(14)} ${r.line}`);
    if (r.spec) {
      declared++;
      if (r.ok) passed++;
      else failures++;
    }
  }
  console.log(`\n${declared}/${slugs.length} games declare a feel spec · ${passed} pass · ${slugs.length - declared} todo`);
  if (failures) {
    console.error(`\n${failures} game(s) FAILED their declared feel gates.`);
    process.exit(1);
  }
  console.log('\nAll declared feel gates pass.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
