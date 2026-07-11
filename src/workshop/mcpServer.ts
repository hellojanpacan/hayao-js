// The Workshop MCP sidecar — the agent's window into human playtests. Stateless
// stdio server: reads/writes the `.workshop/` filesystem bus and REPLAYS sessions
// headlessly through the deterministic engine, so it needs no browser and no
// live dev server. Run under tsx (which resolves @hayao + TS game modules):
// this repo starts it from bin/hayao-mcp.ts; npm consumers from dist/mcp.js
// (see .mcp.json in either project).
//
// Determinism is what makes this possible: `inspect_moment` re-simulates
// (seed, tuning, inputLog, axesLog) to any tick and hands the agent the probe
// AND a rendered PNG of the exact frame the human saw. Node-only module —
// never exported through the browser barrel.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { execFile, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
// Engine imports use the real package name ON PURPOSE: the shipped bundle
// (dist/mcp.js) marks 'hayao' external, and package self-reference resolves it
// to the SAME dist/index.js the project's game modules get via their '@hayao'
// tsconfig path — one engine instance, one node registry. In this repo, tsx
// maps 'hayao' → src/index.ts (tsconfig paths) so dev always runs fresh source.
import { analyzePlaytest, renderToSVGString, replaySession, type GameDefinition, type PlaytestSession } from 'hayao';

const execFileAsync = promisify(execFile);
const root = process.cwd();
const workshopDir = join(root, '.workshop');
const sessionsDir = join(workshopDir, 'sessions');
const shotsDir = join(workshopDir, 'shots');

/**
 * The rasterizer runs in a CHILD process because resvg can panic (SIGABRT —
 * uncatchable) on pathological SVGs; a panic must kill one shot, not the
 * server. Prefer the repo's full worker (sanitized SVG + judge fonts); fall
 * back to the lite worker shipped next to this module in the npm package.
 * Null → PNG rendering unavailable (probe + hash still answer).
 */
function findRasterizeWorker(): string | null {
  const repoWorker = join(root, 'scripts', 'rasterize-worker.mjs');
  if (existsSync(repoWorker)) return repoWorker;
  try {
    const lite = fileURLToPath(new URL('./rasterize-worker-lite.mjs', import.meta.url));
    if (existsSync(lite)) return lite;
  } catch {
    /* non-file URL context */
  }
  return null;
}

// ── game discovery ───────────────────────────────────────────────────────────

interface GameEntry {
  slug: string;
  kind: 'example' | 'sandbox' | 'project';
  dir: string;
  module: string;
}

/**
 * Three layouts: this repo's examples/<slug>/game.ts and
 * sandboxes/<slug>/<slug>.ts, plus the create-hayao FLAT layout (game.ts at
 * the project root, slug = folder name).
 */
function discoverGames(): GameEntry[] {
  const out: GameEntry[] = [];
  for (const [parent, kind] of [
    ['examples', 'example'],
    ['sandboxes', 'sandbox'],
  ] as const) {
    const dir = join(root, parent);
    if (!existsSync(dir)) continue;
    for (const slug of readdirSync(dir)) {
      const gameDir = join(dir, slug);
      for (const candidate of [join(gameDir, 'game.ts'), join(gameDir, `${slug}.ts`)]) {
        if (existsSync(candidate)) {
          out.push({ slug, kind, dir: gameDir, module: candidate });
          break;
        }
      }
    }
  }
  const flat = join(root, 'game.ts');
  if (existsSync(flat)) out.push({ slug: basename(root), kind: 'project', dir: root, module: flat });
  return out;
}

/** Find the GameDefinition a module exports, whatever it's named (judge.ts convention). */
function findGame(mod: Record<string, unknown>): GameDefinition | null {
  for (const v of Object.values(mod)) {
    if (v && typeof v === 'object' && 'build' in v && 'title' in v) return v as GameDefinition;
  }
  return null;
}

const defCache = new Map<string, GameDefinition>();
async function loadGame(slug: string): Promise<GameDefinition> {
  const cached = defCache.get(slug);
  if (cached) return cached;
  const entry = discoverGames().find((g) => g.slug === slug);
  if (!entry) throw new Error(`unknown game "${slug}" — try list_games`);
  const def = findGame((await import(entry.module)) as Record<string, unknown>);
  if (!def) throw new Error(`${entry.module} exports no GameDefinition`);
  defCache.set(slug, def);
  return def;
}

/** Sessions store the game TITLE; resolve it back to a slug's definition. */
async function loadGameByTitle(title: string): Promise<{ slug: string; def: GameDefinition }> {
  for (const entry of discoverGames()) {
    try {
      const def = await loadGame(entry.slug);
      if (def.title === title) return { slug: entry.slug, def };
    } catch {
      /* a broken module must not take down the lookup */
    }
  }
  throw new Error(`no game with title "${title}" found in examples/ or sandboxes/`);
}

// ── sessions ─────────────────────────────────────────────────────────────────

function readSession(id: string): PlaytestSession {
  const file = join(sessionsDir, `${id}.json`);
  if (!existsSync(file)) throw new Error(`no session "${id}" — try list_sessions`);
  return JSON.parse(readFileSync(file, 'utf8')) as PlaytestSession;
}

function sessionIndex(): Array<Record<string, unknown>> {
  if (!existsSync(sessionsDir)) return [];
  return readdirSync(sessionsDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        const s = JSON.parse(readFileSync(join(sessionsDir, f), 'utf8')) as PlaytestSession;
        return {
          id: s.id,
          game: s.game,
          startedAt: s.startedAt,
          endReason: s.endReason,
          frames: s.inputLog.frames.length,
          seed: s.seed,
          variant: s.variant,
          buildRef: s.buildRef,
          knobEvents: s.knobEvents.length,
          annotations: s.annotations.length,
        };
      } catch {
        return { id: f.replace(/\.json$/, ''), error: 'unreadable' };
      }
    });
}

const text = (v: unknown) => ({ content: [{ type: 'text' as const, text: typeof v === 'string' ? v : JSON.stringify(v, null, 1) }] });

// ── server ───────────────────────────────────────────────────────────────────

const server = new McpServer({ name: 'hayao-workshop', version: '0.1.0' });

server.registerTool(
  'list_games',
  { description: 'List playable games (examples) and gyms (sandboxes) in this project, with tuning-knob availability.' },
  async () => {
    const games = await Promise.all(
      discoverGames().map(async (g) => {
        try {
          const def = await loadGame(g.slug);
          return { slug: g.slug, kind: g.kind, title: def.title, knobs: def.tuning?.knobs.map((k) => k.key) ?? [] };
        } catch {
          return { slug: g.slug, kind: g.kind, title: null, knobs: [] };
        }
      }),
    );
    return text(games);
  },
);

/** Resolve a project directory: examples/<slug>, sandboxes/<slug>, or the root. */
function projectDir(slug?: string): string | null {
  if (!slug || slug === basename(root)) return root;
  for (const parent of ['examples', 'sandboxes']) {
    const dir = join(root, parent, slug);
    if (existsSync(dir)) return dir;
  }
  return null;
}

server.registerTool(
  'read_timeline',
  {
    description:
      "A project's TIMELINE.md — the dated log (Original Concept first, pivots appended, ## Present = what's being worked on and what feedback is awaited). Update Present when you start or park work; APPEND to Past, never rewrite it.",
    inputSchema: { project: z.string().optional().describe('project slug (examples/<slug>); omit for a flat create-hayao project') },
  },
  async ({ project }) => {
    const dir = projectDir(project);
    if (!dir) return text({ error: `no project '${project}'` });
    const p = join(dir, 'TIMELINE.md');
    if (!existsSync(p))
      return text({ error: 'no TIMELINE.md yet', hint: 'write one when the concept (or the first pivot) exists — see docs/CONVENTIONS.md project anatomy' });
    return text(readFileSync(p, 'utf8'));
  },
);

server.registerTool(
  'list_atoms',
  {
    description:
      "A project's atoms (atoms/*.ts defineAtom modules): kind, title, and the radiates line — the seed hook for design/00-process/the-seed.md. Static scan; open the file for the iteration log in its header comment.",
    inputSchema: { project: z.string().optional().describe('project slug; omit for a flat project') },
  },
  async ({ project }) => {
    const dir = projectDir(project);
    if (!dir) return text({ error: `no project '${project}'` });
    const atomsDir = join(dir, 'atoms');
    if (!existsSync(atomsDir)) return text([]);
    const atoms = readdirSync(atomsDir)
      .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
      .map((f) => {
        const src = readFileSync(join(atomsDir, f), 'utf8');
        const grab = (key: string) => new RegExp(`${key}:\\s*'([^']*)'`).exec(src)?.[1];
        return { file: `atoms/${f}`, kind: grab('kind') ?? null, title: grab('title') ?? null, radiates: grab('radiates') ?? null };
      });
    return text(atoms);
  },
);

server.registerTool(
  'list_sessions',
  {
    description: 'List recorded playtest sessions (newest last). Optionally filter by game title or slug.',
    inputSchema: { game: z.string().optional() },
  },
  async ({ game }) => {
    let index = sessionIndex();
    if (game) index = index.filter((s) => s.game === game || String(s.game ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-') === game);
    return text(index);
  },
);

server.registerTool(
  'get_knob_state',
  {
    description:
      'A game\'s declared tuning spec plus the values the human accepted in the Workshop panel (.workshop/knobs.json). To make accepted values permanent, edit the DECLARED DEFAULTS in the game source, then run_verify.',
    inputSchema: { game: z.string().describe('game slug, e.g. "sokoban"') },
  },
  async ({ game }) => {
    const def = await loadGame(game);
    const knobsPath = join(workshopDir, 'knobs.json');
    const accepted = existsSync(knobsPath) ? (JSON.parse(readFileSync(knobsPath, 'utf8')) as unknown) : null;
    return text({ slug: game, title: def.title, spec: def.tuning ?? { knobs: [] }, accepted });
  },
);

server.registerTool(
  'inspect_moment',
  {
    description:
      'Re-simulate a recorded session headlessly to a tick (default: its final frame) and return the probe, state hash, and a rendered PNG of exactly what the human saw. Use annotation/knob-event frames from list_sessions as interesting ticks.',
    inputSchema: {
      sessionId: z.string(),
      tick: z.number().int().nonnegative().optional(),
    },
  },
  async ({ sessionId, tick }) => {
    const session = readSession(sessionId);
    const { slug, def } = await loadGameByTitle(session.game);
    const world = replaySession(def, session, tick);
    const probe = world.probe();
    const width = def.width ?? 1280;
    const height = def.height ?? 720;
    const svg = renderToSVGString(world.render(), width, height, def.background ?? '#f3ecdb');
    mkdirSync(shotsDir, { recursive: true });
    const pngPath = join(shotsDir, `${sessionId}-t${world.frame}.png`);
    const tmpSvg = pngPath + '.svg';
    writeFileSync(tmpSvg, svg);
    let png: Buffer | null = null;
    const worker = findRasterizeWorker();
    if (worker) {
      try {
        execFileSync('node', [worker, tmpSvg, '640', pngPath], { stdio: 'pipe' });
        png = readFileSync(pngPath);
      } catch {
        /* rasterizer panic or missing @resvg — probe + hash still answer */
      }
    }
    rmSync(tmpSvg, { force: true });
    const summary = { game: slug, frame: world.frame, hash: world.hash(), probe, png: png ? pngPath : null };
    return {
      content: [
        { type: 'text' as const, text: JSON.stringify(summary, null, 1) },
        ...(png ? [{ type: 'image' as const, data: png.toString('base64'), mimeType: 'image/png' }] : []),
      ],
    };
  },
);

server.registerTool(
  'list_variants',
  { description: 'Worktree variant builds registered for A/B comparison (.workshop/variants.json). Module variants live in each game\'s variants.ts.' },
  async () => {
    const p = join(workshopDir, 'variants.json');
    return text(existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {});
  },
);

server.registerTool(
  'build_variant',
  {
    description:
      'Build a git ref as an immutable worktree variant for side-by-side A/B in the Workshop (e.g. name="before-fix", ref="HEAD~1"). Takes ~a minute; the human then picks it in a Workshop pane.',
    inputSchema: {
      name: z.string().regex(/^[a-z0-9][a-z0-9._-]*$/i),
      ref: z.string(),
    },
  },
  async ({ name, ref }) => {
    try {
      const { stdout, stderr } = await execFileAsync('node', ['scripts/workshop-variant.mjs', name, ref], {
        cwd: root,
        maxBuffer: 16 * 1024 * 1024,
        timeout: 600_000,
      });
      return text({ ok: true, tail: `${stdout}\n${stderr}`.trim().split('\n').slice(-12).join('\n') });
    } catch (err) {
      const e = err as { stdout?: string; stderr?: string; message: string };
      return text({ ok: false, tail: `${e.stdout ?? ''}\n${e.stderr ?? e.message}`.trim().split('\n').slice(-20).join('\n') });
    }
  },
);

server.registerTool(
  'get_playtest_report',
  {
    description:
      'The ethnographer: replay a session headlessly and return a compact factual report — hesitation spans (with the on-screen probe), death clusters, futile verbs, unused verbs, quit context, annotations. Telemetry DESCRIBES; propose fixes to the human, never auto-apply from metrics.',
    inputSchema: { sessionId: z.string() },
  },
  async ({ sessionId }) => {
    const session = readSession(sessionId);
    const reportsDir = join(workshopDir, 'reports');
    const cachePath = join(reportsDir, `${sessionId}.json`);
    // Cache key: same session + same code. buildRef changes bust it.
    if (existsSync(cachePath)) {
      const cached = JSON.parse(readFileSync(cachePath, 'utf8')) as { buildRef?: string };
      if (cached.buildRef === session.buildRef) return text(cached);
    }
    const { def } = await loadGameByTitle(session.game);
    const report = analyzePlaytest(def, session);
    mkdirSync(reportsDir, { recursive: true });
    writeFileSync(cachePath, JSON.stringify(report, null, 1));
    return text(report);
  },
);

server.registerTool(
  'get_annotations',
  {
    description: 'The human\'s in-play annotations ("felt-bad @ frame N") for a session — each frame is a candidate for inspect_moment.',
    inputSchema: { sessionId: z.string() },
  },
  async ({ sessionId }) => text(readSession(sessionId).annotations),
);

server.registerTool(
  'run_verify',
  {
    description: 'Run the machine-proof gate (npm run verify — solver/determinism/feel across examples; pass a game slug to scope). Returns the tail of the output.',
    inputSchema: { game: z.string().optional() },
  },
  async ({ game }) => {
    try {
      const { stdout } = await execFileAsync('npm', ['run', 'verify', ...(game ? ['--', game] : [])], {
        cwd: root,
        maxBuffer: 16 * 1024 * 1024,
        timeout: 600_000,
      });
      const lines = stdout.trim().split('\n');
      return text({ ok: true, tail: lines.slice(-40).join('\n') });
    } catch (err) {
      const e = err as { stdout?: string; stderr?: string; message: string };
      return text({ ok: false, tail: `${e.stdout ?? ''}\n${e.stderr ?? e.message}`.trim().split('\n').slice(-40).join('\n') });
    }
  },
);

/** Start serving over stdio (the entry points call this — never on import). */
export async function startWorkshopMcp(): Promise<void> {
  await server.connect(new StdioServerTransport());
}
