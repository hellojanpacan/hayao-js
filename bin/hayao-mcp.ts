// The Studio MCP sidecar — the agent's window into human playtests. Stateless
// stdio server: reads/writes the `.studio/` filesystem bus and REPLAYS sessions
// headlessly through the deterministic engine, so it needs no browser and no
// live dev server. Registered in .mcp.json (spawned via tsx so tsconfig paths
// resolve @hayao and game modules).
//
// Determinism is what makes this possible: `inspect_moment` re-simulates
// (seed, tuning, inputLog, axesLog) to any tick and hands the agent the probe
// AND a rendered PNG of the exact frame the human saw.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { execFile, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { analyzePlaytest, renderToSVGString, replaySession, type GameDefinition, type PlaytestSession } from '../src/index';

const execFileAsync = promisify(execFile);
const root = process.cwd();
const studioDir = join(root, '.studio');
const sessionsDir = join(studioDir, 'sessions');
const shotsDir = join(studioDir, 'shots');
const rasterizeWorker = join(root, 'scripts', 'rasterize-worker.mjs');

// ── game discovery ───────────────────────────────────────────────────────────

interface GameEntry {
  slug: string;
  kind: 'example' | 'sandbox';
  dir: string;
  module: string;
}

/** examples/<slug>/game.ts and sandboxes/<slug>/<slug>.ts (the two house layouts). */
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

const server = new McpServer({ name: 'hayao-studio', version: '0.1.0' });

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
      'A game\'s declared tuning spec plus the values the human accepted in the Studio panel (.studio/knobs.json). To make accepted values permanent, edit the DECLARED DEFAULTS in the game source, then run_verify.',
    inputSchema: { game: z.string().describe('game slug, e.g. "updrift"') },
  },
  async ({ game }) => {
    const def = await loadGame(game);
    const knobsPath = join(studioDir, 'knobs.json');
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
    try {
      execFileSync('node', [rasterizeWorker, tmpSvg, '640', pngPath], { stdio: 'pipe' });
      png = readFileSync(pngPath);
    } catch {
      /* rasterizer panic — probe + hash still answer */
    } finally {
      rmSync(tmpSvg, { force: true });
    }
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
  'get_playtest_report',
  {
    description:
      'The ethnographer: replay a session headlessly and return a compact factual report — hesitation spans (with the on-screen probe), death clusters, futile verbs, unused verbs, quit context, annotations. Telemetry DESCRIBES; propose fixes to the human, never auto-apply from metrics.',
    inputSchema: { sessionId: z.string() },
  },
  async ({ sessionId }) => {
    const session = readSession(sessionId);
    const reportsDir = join(studioDir, 'reports');
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

await server.connect(new StdioServerTransport());
