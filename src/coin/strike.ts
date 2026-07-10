// `hayao strike` — save a game to one self-contained Coin (.coin.html).
//
//   hayao strike <entry> [--maker @handle] [-o out.coin.html]
//                        [--seed N] [--steps N] [--label-frame N] [--date YYYY-MM-DD]
//
// <entry> is a module that exports a GameDefinition (default, `game`, or the first
// `defineGame()` export). The Coin carries, sealed together: the engine (inlined,
// frozen), the game, a re-executable proof (the assay bundle), and its faces —
// Heads (title · maker's arms · label) and Tails (the Seal).
//
// A Coin carries TWO copies of the game logic on purpose:
//   • a browser payload (IIFE) that auto-boots into #app — how it PLAYS;
//   • a node "assay bundle" (gzipped, tree-shaken, no DOM) — how `hayao open
//     --assay` RE-PROVES the Seal with nothing but the file itself.
//
// Node-only (esbuild + fs), so it is built to dist/strike.js and never enters a
// browser or the sim. It runs in two contexts, detected at start:
//   • in-repo   → `hayao`/`@hayao` alias to src/index.ts (dev, via tsx);
//   • installed → `hayao` resolves to the published package (dist) as usual.

import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { resolve, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { readCrest } from '../art/crest';

/** Walk up from `dir` to the nearest package.json — the package/repo root. */
function findRoot(dir: string): string {
  let d = dir;
  for (;;) {
    if (existsSync(join(d, 'package.json'))) return d;
    const up = dirname(d);
    if (up === d) return dir;
    d = up;
  }
}

const ROOT = findRoot(dirname(fileURLToPath(import.meta.url)));
const SRC_INDEX = join(ROOT, 'src/index.ts');
const REPO = existsSync(SRC_INDEX);
/** In-repo, point the `hayao` specifier at the live source; installed, let it resolve normally. */
const ALIAS = REPO ? { hayao: SRC_INDEX, '@hayao': SRC_INDEX } : undefined;
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { version: string };

// esbuild is a runtime need only for strike (an optional peer dep), so load it lazily.
type BuildFn = (typeof import('esbuild'))['build'];
let _build: BuildFn | undefined;
async function esbuild(): Promise<BuildFn> {
  if (_build) return _build;
  try {
    _build = (await import('esbuild')).build;
  } catch {
    console.error('hayao strike needs esbuild to bundle the coin. Install it:\n  npm i -D esbuild');
    process.exit(3);
  }
  return _build;
}

interface Args {
  entry: string;
  maker: string;
  out?: string;
  seed?: number;
  steps: number;
  labelFrame: number;
  date?: string;
  source?: string;
}

function parseArgs(argv: string[]): Args {
  const a: Args = { entry: '', maker: '@anon', steps: 120, labelFrame: 1 };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    if (v === '--maker') a.maker = argv[++i];
    else if (v === '-o' || v === '--out') a.out = argv[++i];
    else if (v === '--seed') a.seed = Number(argv[++i]);
    else if (v === '--steps') a.steps = Number(argv[++i]);
    else if (v === '--label-frame') a.labelFrame = Number(argv[++i]);
    else if (v === '--date') a.date = argv[++i];
    else if (v === '--source') a.source = argv[++i];
    else if (!v.startsWith('-') && !a.entry) a.entry = v;
    else throw new Error(`unknown argument: ${v}`);
  }
  if (!a.entry) throw new Error('usage: strike <entry> [--maker @handle] [-o out.coin.html]');
  return a;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'coin';
}

/** Pick the game def out of a module's exports. */
const PICK = `(m => m.default ?? m.game ?? Object.values(m).find(v => v && typeof v.build === 'function' && typeof v.title === 'string'))`;

/** `</script` inside inlined JS/JSON would prematurely close the tag. */
const guard = (s: string): string => s.replace(/<\/script/gi, '<\\/script');

interface Forged {
  title: string;
  seed: number;
  steps: number;
  width: number;
  height: number;
  background: string;
  hash: string;
  label: string;
}

/**
 * The node "assay bundle" — a self-contained ESM that re-derives the Seal (and, at
 * strike time, forges it + the label). Pure: createWorld + the headless SVG string
 * + the game def; no DOM, so it runs in Node from the coin alone. Two modes:
 *   node bundle.mjs assay <seed> <steps>            → prints world.hash()
 *   node bundle.mjs forge <seed|-> <steps> <frame>  → prints {seed,hash,label,…} JSON
 */
async function buildAssayBundle(a: Args): Promise<string> {
  const src = `
    import { createWorld, renderToSVGString } from 'hayao';
    import * as _mod from ${JSON.stringify(resolve(a.entry))};
    const def = ${PICK}(_mod);
    if (!def) { console.error('coin: no GameDefinition export found'); process.exit(2); }
    const argv = process.argv.slice(2);
    if (argv[0] === 'assay') {
      const w = createWorld(def, { seed: Number(argv[1]) });
      w.runSteps(Number(argv[2]));
      process.stdout.write(w.hash());
    } else {
      const seed = argv[1] === '-' ? def.seed : Number(argv[1]);
      const steps = Number(argv[2]); const frame = Number(argv[3]);
      const s = createWorld(def, { seed }); s.runSteps(steps); const hash = s.hash();
      const l = createWorld(def, { seed }); if (frame > 0) l.runSteps(frame);
      const label = renderToSVGString(l.render(), def.width, def.height, def.background);
      process.stdout.write(JSON.stringify({ title: def.title, seed, steps, width: def.width, height: def.height, background: def.background, hash, label }));
    }
  `;
  const bundle = await (await esbuild())({
    stdin: { contents: src, resolveDir: REPO ? ROOT : dirname(resolve(a.entry)), loader: 'ts', sourcefile: 'assay.ts' },
    bundle: true, format: 'esm', platform: 'node', target: 'es2022', write: false,
    ...(ALIAS ? { alias: ALIAS } : {}),
  });
  return bundle.outputFiles[0].text;
}

/** Run the assay bundle in `forge` mode → the Seal + label. */
function forge(a: Args, bundleText: string): Forged {
  const tmp = join(tmpdir(), `hayao-forge-${slug(a.entry)}-${process.pid}.mjs`);
  writeFileSync(tmp, bundleText);
  try {
    const out = execFileSync(process.execPath, [tmp, 'forge', a.seed === undefined ? '-' : String(a.seed), String(a.steps), String(a.labelFrame)], {
      encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
    });
    return JSON.parse(out) as Forged;
  } finally {
    unlinkSync(tmp);
  }
}

/** Bundle the browser payload: inline the engine + game, boot into #app. */
async function mintPayload(a: Args): Promise<string> {
  const src = `
    import { runBrowser } from 'hayao';
    import * as _mod from ${JSON.stringify(resolve(a.entry))};
    const def = ${PICK}(_mod);
    runBrowser(def, document.getElementById('app'));
  `;
  const bundle = await (await esbuild())({
    stdin: { contents: src, resolveDir: REPO ? ROOT : dirname(resolve(a.entry)), loader: 'ts', sourcefile: 'payload.ts' },
    bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, write: false,
    ...(ALIAS ? { alias: ALIAS } : {}),
  });
  return bundle.outputFiles[0].text;
}

function assemble(a: Args, forged: Forged, payload: string, assayBundle: string): string {
  const arms = readCrest(a.maker);
  const manifest = {
    coin: 1,
    hayao: pkg.version,
    heads: {
      title: forged.title,
      maker: a.maker,
      arms: { field: arms.field, accent: arms.accent, charge: arms.charge, arrangement: arms.arrangement, division: arms.division },
      label: 'data:image/svg+xml,' + encodeURIComponent(forged.label),
      ...(a.date ? { struck: a.date } : {}),
    },
    tails: {
      seal: { seed: forged.seed, steps: forged.steps, hash: forged.hash },
      ...(a.source ? { source: a.source } : {}),
    },
  };
  const manifestJson = guard(JSON.stringify(manifest)).replace(/</g, '\\u003c');
  const assayB64 = gzipSync(Buffer.from(assayBundle)).toString('base64');
  return `<!doctype html><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${forged.title} — a Hayao coin</title>
<style>html,body{margin:0;height:100%;background:${forged.background};overflow:hidden}#app{position:relative;width:100vw;height:100vh}</style>
<script type="application/hayao-coin+json" id="coin">${manifestJson}</script>
<script type="application/hayao-assay+gzip" id="assay" data-encoding="gzip+base64">${assayB64}</script>
<div id="app"></div>
<script>${guard(payload)}</script>
`;
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  const assayBundle = await buildAssayBundle(a);
  const forged = forge(a, assayBundle);
  const payload = await mintPayload(a);
  const html = assemble(a, forged, payload, assayBundle);
  const out = a.out ?? resolve(process.cwd(), `${slug(forged.title)}.coin.html`);
  writeFileSync(out, html);
  const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
  console.log(`struck ${out}`);
  console.log(`  ${forged.title} · ${a.maker} · ${kb} KB · seal ${forged.hash} (seed ${forged.seed}, ${a.steps} steps)`);
}

main().catch((e) => {
  console.error('strike failed:', e instanceof Error ? e.message : e);
  process.exit(1);
});
