// The Workshop dev-server plugin. Filesystem is the bus: the browser posts
// session artifacts / knob values here, the MCP sidecar and the agent read the
// same `.workshop/` files — the dev server and the agent never talk directly.
// Node-only module: exported via the `hayao/workshop` subpath, NEVER the barrel
// (games must stay browser-clean).

import type { Plugin, ViteDevServer } from 'vite';
import { execSync } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, statSync, watch, writeFileSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * The prebuilt Workshop UI shipped with the package (dist-workshop/). Projects
 * with their own workshop/index.html (this repo) serve the live page instead.
 * Checked relative to this module: works from dist/workshop-plugin.js (package)
 * and from src/workshop/vitePlugin.ts (repo, where ../../dist-workshop also holds
 * the build:workshop output).
 */
function findPrebuiltWorkshop(): string | null {
  for (const rel of ['../dist-workshop', '../../dist-workshop']) {
    try {
      const dir = fileURLToPath(new URL(rel, import.meta.url));
      if (existsSync(join(dir, 'index.html'))) return dir;
    } catch {
      /* non-file URL context */
    }
  }
  return null;
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
};

export interface WorkshopPluginOptions {
  /** Where session/knob/variant files live. Default: `.workshop` under the project root. */
  dir?: string;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolvePromise(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

const SAFE_ID = /^[a-z0-9][a-z0-9._-]*$/i;

export function hayaoWorkshop(opts: WorkshopPluginOptions = {}): Plugin {
  let workshopDir = '';
  let projectRoot = '';
  let buildRef = 'unknown';

  return {
    name: 'hayao-workshop',
    configResolved(config) {
      projectRoot = config.root;
      workshopDir = resolve(projectRoot, opts.dir ?? '.workshop');
      mkdirSync(join(workshopDir, 'sessions'), { recursive: true });
      mkdirSync(join(workshopDir, 'shots'), { recursive: true });
      try {
        buildRef = execSync('git rev-parse --short HEAD', { cwd: projectRoot, stdio: ['ignore', 'pipe', 'ignore'] })
          .toString()
          .trim();
      } catch {
        /* not a git repo — buildRef stays 'unknown' */
      }
    },
    configureServer(server: ViteDevServer) {
      /**
       * Resolve a session's game TITLE to its live module via vite's SSR
       * loader — the same module graph the browser uses, so the analyzer and
       * the game share ONE engine instance (one node registry). Cached per
       * title until the server restarts.
       */
      const titleToModule = new Map<string, string>();
      async function loadGameByTitle(title: string): Promise<{ def: unknown; engine: Record<string, (...a: never[]) => unknown> }> {
        const engine = (await server.ssrLoadModule('@hayao')) as Record<string, (...a: never[]) => unknown>;
        const candidates: string[] = [];
        const cached = titleToModule.get(title);
        if (cached) candidates.push(cached);
        for (const [parent] of [['examples'], ['sandboxes']] as const) {
          const dir = resolve(projectRoot, parent);
          if (!existsSync(dir)) continue;
          for (const slug of readdirSync(dir)) {
            for (const file of [`${parent}/${slug}/game.ts`, `${parent}/${slug}/${slug}.ts`]) {
              if (existsSync(resolve(projectRoot, file))) candidates.push(`/${file}`);
            }
          }
        }
        if (existsSync(resolve(projectRoot, 'game.ts'))) candidates.push('/game.ts');
        for (const path of candidates) {
          try {
            const mod = (await server.ssrLoadModule(path)) as Record<string, unknown>;
            for (const v of Object.values(mod)) {
              if (v && typeof v === 'object' && 'build' in v && 'title' in v && (v as { title: string }).title === title) {
                titleToModule.set(title, path);
                return { def: v, engine };
              }
            }
          } catch {
            /* a broken module must not take down the lookup */
          }
        }
        throw new Error(`no game titled "${title}" found`);
      }

      server.middlewares.use((req, res, next) => {
        void (async () => {
          const url = (req.url ?? '').split('?')[0];

          // The ethnographer, for humans: analyze a recorded session and hand
          // the report to the Workshop UI. Cached per buildRef (same cache the
          // MCP sidecar uses).
          if (req.method === 'GET' && url.startsWith('/__workshop/report/')) {
            const id = decodeURIComponent(url.slice('/__workshop/report/'.length));
            if (!SAFE_ID.test(id)) return json(res, 400, { error: 'bad session id' });
            const sessionPath = join(workshopDir, 'sessions', `${id}.json`);
            if (!existsSync(sessionPath)) return json(res, 404, { error: 'no such session' });
            const session = JSON.parse(readFileSync(sessionPath, 'utf8')) as { game: string; buildRef?: string };
            const reportsDir = join(workshopDir, 'reports');
            const cachePath = join(reportsDir, `${id}.json`);
            if (existsSync(cachePath)) {
              const cachedReport = JSON.parse(readFileSync(cachePath, 'utf8')) as { buildRef?: string };
              if (cachedReport.buildRef === session.buildRef) return json(res, 200, cachedReport);
            }
            const { def, engine } = await loadGameByTitle(session.game);
            const report = (engine.analyzePlaytest as (d: unknown, s: unknown) => unknown)(def, session);
            mkdirSync(reportsDir, { recursive: true });
            writeFileSync(cachePath, JSON.stringify(report, null, 1));
            return json(res, 200, report);
          }

          if (req.method === 'POST' && url === '/__workshop/session') {
            const session = JSON.parse(await readBody(req)) as { id?: string };
            if (typeof session.id !== 'string' || !SAFE_ID.test(session.id)) {
              return json(res, 400, { error: 'bad session id' });
            }
            writeFileSync(join(workshopDir, 'sessions', `${session.id}.json`), JSON.stringify(session, null, 1));
            return json(res, 200, { ok: true });
          }

          if (req.method === 'POST' && url === '/__shot') {
            // The handler capture.ts's save() has POSTed to since day one.
            const { path, svg } = JSON.parse(await readBody(req)) as { path?: string; svg?: string };
            if (typeof svg !== 'string') return json(res, 400, { error: 'missing svg' });
            const rel = normalize(path ?? `shot-${buildRef}.svg`).replace(/^([/\\])+/, '');
            if (rel.split(/[/\\]/).includes('..')) return json(res, 400, { error: 'bad path' });
            const target = rel.startsWith('shots/') || rel.startsWith('.workshop/') ? resolve(projectRoot, rel) : join(workshopDir, 'shots', rel);
            mkdirSync(dirname(target), { recursive: true });
            writeFileSync(target, svg);
            return json(res, 200, { ok: true, path: target });
          }

          if (req.method === 'POST' && url === '/__workshop/knobs') {
            const body = await readBody(req);
            JSON.parse(body); // validate before persisting
            writeFileSync(join(workshopDir, 'knobs.json'), body);
            return json(res, 200, { ok: true });
          }

          if (req.method === 'GET' && url === '/__workshop/games') {
            // Playable pages for the Workshop picker. Titles/knobs come from the
            // iframe's window.__workshop once a game loads — this only lists URLs.
            const games: Array<{ slug: string; kind: string; url: string }> = [];
            for (const [parent, kind, prefix] of [
              ['examples', 'example', '/examples/'],
              ['sandboxes', 'gym', '/sandboxes/'],
            ] as const) {
              const dir = resolve(projectRoot, parent);
              if (!existsSync(dir)) continue;
              for (const slug of readdirSync(dir)) {
                if (existsSync(join(dir, slug, 'index.html'))) games.push({ slug, kind, url: `${prefix}${slug}/` });
              }
            }
            // create-hayao flat layout: the game IS the project root page.
            if (games.length === 0 && existsSync(join(projectRoot, 'index.html')) && existsSync(join(projectRoot, 'game.ts'))) {
              games.push({ slug: projectRoot.split('/').pop() ?? 'game', kind: 'project', url: '/' });
            }
            return json(res, 200, games);
          }

          // The Workshop UI for projects without their own workshop/ page: serve
          // the prebuilt app shipped in the hayao package.
          if (req.method === 'GET' && (url === '/workshop' || url.startsWith('/workshop/')) && !existsSync(join(projectRoot, 'workshop', 'index.html'))) {
            const prebuilt = findPrebuiltWorkshop();
            if (!prebuilt) return json(res, 404, { error: 'no prebuilt Workshop UI in this hayao build' });
            const rel = normalize(decodeURIComponent(url.replace(/^\/workshop\/?/, '')));
            if (rel.split(/[/\\]/).includes('..')) return json(res, 400, { error: 'bad path' });
            let file = join(prebuilt, rel);
            if (!existsSync(file) || statSync(file).isDirectory()) file = join(prebuilt, 'index.html');
            res.statusCode = 200;
            res.setHeader('content-type', MIME[extname(file)] ?? 'text/html; charset=utf-8');
            createReadStream(file).pipe(res);
            return;
          }

          // Immutable worktree-variant builds: /__workshop/variants/<name>/… → static files.
          if (req.method === 'GET' && url.startsWith('/__workshop/variants/')) {
            const rel = normalize(decodeURIComponent(url.slice('/__workshop/variants/'.length)));
            if (rel.split(/[/\\]/).includes('..')) return json(res, 400, { error: 'bad path' });
            let file = join(workshopDir, 'variants', rel);
            if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
            if (!existsSync(file)) return json(res, 404, { error: 'no such variant file' });
            res.statusCode = 200;
            res.setHeader('content-type', MIME[extname(file)] ?? 'application/octet-stream');
            createReadStream(file).pipe(res);
            return;
          }

          // Full session artifact — the play pane's replay mode loads this.
          if (req.method === 'GET' && url.startsWith('/__workshop/session/')) {
            const id = decodeURIComponent(url.slice('/__workshop/session/'.length));
            if (!SAFE_ID.test(id)) return json(res, 400, { error: 'bad session id' });
            const file = join(workshopDir, 'sessions', `${id}.json`);
            if (!existsSync(file)) return json(res, 404, { error: 'no such session' });
            res.statusCode = 200;
            res.setHeader('content-type', 'application/json');
            createReadStream(file).pipe(res);
            return;
          }

          if (req.method === 'GET' && url === '/__workshop/state') {
            const knobsPath = join(workshopDir, 'knobs.json');
            const knobs = existsSync(knobsPath) ? (JSON.parse(readFileSync(knobsPath, 'utf8')) as unknown) : null;
            const variantsPath = join(workshopDir, 'variants.json');
            const variants = existsSync(variantsPath) ? (JSON.parse(readFileSync(variantsPath, 'utf8')) as unknown) : {};
            const sessions = readdirSync(join(workshopDir, 'sessions'))
              .filter((f) => f.endsWith('.json'))
              .map((f) => {
                try {
                  const s = JSON.parse(readFileSync(join(workshopDir, 'sessions', f), 'utf8')) as Record<string, unknown>;
                  return {
                    id: s.id,
                    game: s.game,
                    startedAt: s.startedAt,
                    endReason: s.endReason,
                    frames: (s.inputLog as { frames?: unknown[] })?.frames?.length ?? 0,
                    annotations: Array.isArray(s.annotations) ? s.annotations.length : 0,
                    variant: (s.variant as { name?: string })?.name ?? 'dev',
                  };
                } catch {
                  return null;
                }
              })
              .filter(Boolean);
            // LAN addresses for the phone-play QR (vite binds host:true).
            const urls = server.resolvedUrls?.network ?? [];
            return json(res, 200, { buildRef, knobs, variants, sessions, urls });
          }

          if (req.method === 'GET' && url === '/__workshop/events') {
            // SSE: the browser UI reacts when the AGENT writes .workshop/ files.
            res.statusCode = 200;
            res.setHeader('content-type', 'text/event-stream');
            res.setHeader('cache-control', 'no-cache');
            res.write('retry: 2000\n\n');
            const watcher = watch(workshopDir, { recursive: true }, (_event, filename) => {
              res.write(`data: ${JSON.stringify({ file: filename ?? '' })}\n\n`);
            });
            req.on('close', () => watcher.close());
            return; // stream stays open
          }

          next();
        })().catch((err: unknown) => json(res, 500, { error: String(err) }));
      });
    },
  };
}
