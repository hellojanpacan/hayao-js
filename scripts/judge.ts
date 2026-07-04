// The vision judge — capture stage. Renders each game HEADLESSLY to PNG so a
// multimodal model (the agent, in the loop) can SEE it and critique it against the
// rubric in docs/JUDGE.md. This closes the last mile the feel gates cannot: the
// gates prove the floor mechanically; the judge asks "does it actually look good?"
//
// The engine renders to SVG; @resvg/resvg-js rasterizes that to PNG with zero
// browser and zero GPU — so the whole loop is deterministic and CI-friendly. This
// file is DEV TOOLING: it lives in scripts/, never in the shipped @hayao barrel,
// so no game ever pays for the rasterizer. Rasterization runs in an isolated child
// process (rasterize-worker.mjs) because the native rasterizer can panic on a few
// pathological SVGs — a panic then skips one image, never the whole run.
//
// Run:  npm run judge            (all games)
//       npm run judge updrift    (one or more)

import { readdirSync, existsSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createWorld, renderToSVGString, renderFilmstrip, type GameDefinition } from '../src/index';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const examplesDir = join(root, 'examples');
const worker = join(root, 'scripts', 'rasterize-worker.mjs');
const rel = (p: string): string => p.replace(root + '/', '');

/** Rasterize an SVG to a PNG in an isolated process. Returns true on success. */
function rasterizeTo(svg: string, width: number, outPath: string): boolean {
  const tmp = outPath + '.svg';
  writeFileSync(tmp, svg);
  try {
    execFileSync('node', [worker, tmp, String(width), outPath], { stdio: 'pipe' });
    return true;
  } catch {
    return false; // native rasterizer panic (SIGABRT) — isolated to this child
  } finally {
    rmSync(tmp, { force: true });
  }
}

/** Find the GameDefinition a game module exports, whatever it's named. */
function findGame(mod: Record<string, unknown>): GameDefinition | null {
  for (const v of Object.values(mod)) {
    if (v && typeof v === 'object' && 'build' in v && 'title' in v) return v as GameDefinition;
  }
  return null;
}

// A genre-agnostic "wiggle" so the motion strip shows life across any control
// scheme — most games react to some of these; unknown actions are simply ignored.
// LOOKS only: this is not a winning run, it's a liveliness probe.
const WIGGLE: string[][] = [];
{
  const beats: string[][] = [['right'], ['right', 'jump'], ['right', 'action'], ['down'], ['left'], ['left', 'confirm'], ['action2'], [], ['dash'], ['up']];
  for (let i = 0; i < 160; i++) WIGGLE.push(beats[Math.floor(i / 8) % beats.length]);
}

interface Capture {
  slug: string;
  pngs: string[];
  failed: string[];
}

async function captureAsync(slug: string): Promise<Capture> {
  const out: Capture = { slug, pngs: [], failed: [] };
  const mod = await import(join(examplesDir, slug, 'game.ts'));
  const game = findGame(mod);
  if (!game) {
    out.failed.push('no GameDefinition export');
    return out;
  }
  const w = game.width ?? 1280;
  const h = game.height ?? 720;
  const bg = game.background ?? '#ffffff';
  const outDir = join(root, 'shots', slug, 'judge');
  mkdirSync(outDir, { recursive: true });

  const emit = (svg: string, name: string, width: number): void => {
    const png = join(outDir, name);
    if (rasterizeTo(svg, width, png)) out.pngs.push(png);
    else out.failed.push(name);
  };

  // Hero: the opening composition (let ambient fields / particles settle a beat).
  const heroWorld = createWorld(game);
  for (let i = 0; i < 24; i++) heroWorld.step([]);
  emit(renderToSVGString(heroWorld.render(), w, h, bg), 'hero.png', Math.min(1280, w));

  // Motion strip: a liveliness probe sampled into one contact sheet.
  emit(renderFilmstrip(createWorld(game), WIGGLE, { width: w, height: h, background: bg, panels: 8, cols: 4, panelWidth: 340 }), 'motion.png', 1440);

  // Real gameplay: rasterize any filmstrip a verify suite already produced.
  const shotsDir = join(root, 'shots', slug);
  if (existsSync(shotsDir)) {
    for (const f of readdirSync(shotsDir)) {
      if (f.endsWith('.svg')) emit(readFileSync(join(shotsDir, f), 'utf8'), f.replace(/\.svg$/, '.png'), 1440);
    }
  }
  return out;
}

async function main(): Promise<void> {
  const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  const slugs = readdirSync(examplesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((n) => only.length === 0 || only.includes(n))
    .sort();

  const all: Capture[] = [];
  for (const slug of slugs) {
    console.log(`\nhayao judge — ${slug}`);
    const cap = await captureAsync(slug);
    for (const p of cap.pngs) console.log(`  ▸ ${rel(p)}`);
    for (const f of cap.failed) console.log(`  ⚠ ${f}: rasterizer could not render (review live in-browser)`);
    all.push(cap);
  }

  const totalPngs = all.reduce((n, c) => n + c.pngs.length, 0);
  const skipped = all.filter((c) => c.failed.length);
  const brief = [
    '# Judge brief',
    '',
    'Rendered PNGs are ready. Now VIEW each one and score it against the rubric in',
    '`docs/JUDGE.md`. For every game, write findings as `{ file, severity, fix }`,',
    'apply the high-severity fixes, then re-run `npm run judge <slug>` to converge.',
    '',
    ...all.filter((c) => c.pngs.length).flatMap((c) => [`## ${c.slug}`, ...c.pngs.map((p) => `- ${rel(p)}`), '']),
    ...(skipped.length ? ['## Rasterizer could not render (review live in-browser)', ...skipped.map((c) => `- ${c.slug}: ${c.failed.join(', ')}`), ''] : []),
  ].join('\n');
  const briefPath = join(root, 'shots', 'JUDGE_BRIEF.md');
  mkdirSync(dirname(briefPath), { recursive: true });
  writeFileSync(briefPath, brief);
  console.log(`\n${totalPngs} PNG(s) across ${all.length} game(s); ${skipped.length} skipped. Wrote ${rel(briefPath)}.`);
  console.log('Next: view the PNGs and score against docs/JUDGE.md.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
