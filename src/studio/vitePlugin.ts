// The Studio dev-server plugin. Filesystem is the bus: the browser posts
// session artifacts / knob values here, the MCP sidecar and the agent read the
// same `.studio/` files — the dev server and the agent never talk directly.
// Node-only module: exported via the `hayao/studio` subpath, NEVER the barrel
// (games must stay browser-clean).

import type { Plugin, ViteDevServer } from 'vite';
import { execSync } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, statSync, watch, writeFileSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * The prebuilt Studio UI shipped with the package (dist-studio/). Projects
 * with their own studio/index.html (this repo) serve the live page instead.
 * Checked relative to this module: works from dist/studio-plugin.js (package)
 * and from src/studio/vitePlugin.ts (repo, where ../../dist-studio also holds
 * the build:studio output).
 */
function findPrebuiltStudio(): string | null {
  for (const rel of ['../dist-studio', '../../dist-studio']) {
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

export interface StudioPluginOptions {
  /** Where session/knob/variant files live. Default: `.studio` under the project root. */
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

export function hayaoStudio(opts: StudioPluginOptions = {}): Plugin {
  let studioDir = '';
  let projectRoot = '';
  let buildRef = 'unknown';

  return {
    name: 'hayao-studio',
    configResolved(config) {
      projectRoot = config.root;
      studioDir = resolve(projectRoot, opts.dir ?? '.studio');
      mkdirSync(join(studioDir, 'sessions'), { recursive: true });
      mkdirSync(join(studioDir, 'shots'), { recursive: true });
      try {
        buildRef = execSync('git rev-parse --short HEAD', { cwd: projectRoot, stdio: ['ignore', 'pipe', 'ignore'] })
          .toString()
          .trim();
      } catch {
        /* not a git repo — buildRef stays 'unknown' */
      }
    },
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        void (async () => {
          const url = (req.url ?? '').split('?')[0];

          if (req.method === 'POST' && url === '/__studio/session') {
            const session = JSON.parse(await readBody(req)) as { id?: string };
            if (typeof session.id !== 'string' || !SAFE_ID.test(session.id)) {
              return json(res, 400, { error: 'bad session id' });
            }
            writeFileSync(join(studioDir, 'sessions', `${session.id}.json`), JSON.stringify(session, null, 1));
            return json(res, 200, { ok: true });
          }

          if (req.method === 'POST' && url === '/__shot') {
            // The handler capture.ts's save() has POSTed to since day one.
            const { path, svg } = JSON.parse(await readBody(req)) as { path?: string; svg?: string };
            if (typeof svg !== 'string') return json(res, 400, { error: 'missing svg' });
            const rel = normalize(path ?? `shot-${buildRef}.svg`).replace(/^([/\\])+/, '');
            if (rel.split(/[/\\]/).includes('..')) return json(res, 400, { error: 'bad path' });
            const target = rel.startsWith('shots/') || rel.startsWith('.studio/') ? resolve(projectRoot, rel) : join(studioDir, 'shots', rel);
            mkdirSync(dirname(target), { recursive: true });
            writeFileSync(target, svg);
            return json(res, 200, { ok: true, path: target });
          }

          if (req.method === 'POST' && url === '/__studio/knobs') {
            const body = await readBody(req);
            JSON.parse(body); // validate before persisting
            writeFileSync(join(studioDir, 'knobs.json'), body);
            return json(res, 200, { ok: true });
          }

          if (req.method === 'GET' && url === '/__studio/games') {
            // Playable pages for the Studio picker. Titles/knobs come from the
            // iframe's window.__studio once a game loads — this only lists URLs.
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

          // The Studio UI for projects without their own studio/ page: serve
          // the prebuilt app shipped in the hayao package.
          if (req.method === 'GET' && (url === '/studio' || url.startsWith('/studio/')) && !existsSync(join(projectRoot, 'studio', 'index.html'))) {
            const prebuilt = findPrebuiltStudio();
            if (!prebuilt) return json(res, 404, { error: 'no prebuilt Studio UI in this hayao build' });
            const rel = normalize(decodeURIComponent(url.replace(/^\/studio\/?/, '')));
            if (rel.split(/[/\\]/).includes('..')) return json(res, 400, { error: 'bad path' });
            let file = join(prebuilt, rel);
            if (!existsSync(file) || statSync(file).isDirectory()) file = join(prebuilt, 'index.html');
            res.statusCode = 200;
            res.setHeader('content-type', MIME[extname(file)] ?? 'text/html; charset=utf-8');
            createReadStream(file).pipe(res);
            return;
          }

          // Immutable worktree-variant builds: /__studio/variants/<name>/… → static files.
          if (req.method === 'GET' && url.startsWith('/__studio/variants/')) {
            const rel = normalize(decodeURIComponent(url.slice('/__studio/variants/'.length)));
            if (rel.split(/[/\\]/).includes('..')) return json(res, 400, { error: 'bad path' });
            let file = join(studioDir, 'variants', rel);
            if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
            if (!existsSync(file)) return json(res, 404, { error: 'no such variant file' });
            res.statusCode = 200;
            res.setHeader('content-type', MIME[extname(file)] ?? 'application/octet-stream');
            createReadStream(file).pipe(res);
            return;
          }

          if (req.method === 'GET' && url === '/__studio/state') {
            const knobsPath = join(studioDir, 'knobs.json');
            const knobs = existsSync(knobsPath) ? (JSON.parse(readFileSync(knobsPath, 'utf8')) as unknown) : null;
            const variantsPath = join(studioDir, 'variants.json');
            const variants = existsSync(variantsPath) ? (JSON.parse(readFileSync(variantsPath, 'utf8')) as unknown) : {};
            const sessions = readdirSync(join(studioDir, 'sessions'))
              .filter((f) => f.endsWith('.json'))
              .map((f) => {
                try {
                  const s = JSON.parse(readFileSync(join(studioDir, 'sessions', f), 'utf8')) as Record<string, unknown>;
                  return { id: s.id, game: s.game, startedAt: s.startedAt, endReason: s.endReason, frames: (s.inputLog as { frames?: unknown[] })?.frames?.length ?? 0 };
                } catch {
                  return null;
                }
              })
              .filter(Boolean);
            return json(res, 200, { buildRef, knobs, variants, sessions });
          }

          if (req.method === 'GET' && url === '/__studio/events') {
            // SSE: the browser UI reacts when the AGENT writes .studio/ files.
            res.statusCode = 200;
            res.setHeader('content-type', 'text/event-stream');
            res.setHeader('cache-control', 'no-cache');
            res.write('retry: 2000\n\n');
            const watcher = watch(studioDir, { recursive: true }, (_event, filename) => {
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
