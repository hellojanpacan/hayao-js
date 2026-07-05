// The Studio dev-server plugin. Filesystem is the bus: the browser posts
// session artifacts / knob values here, the MCP sidecar and the agent read the
// same `.studio/` files — the dev server and the agent never talk directly.
// Node-only module: exported via the `hayao/studio` subpath, NEVER the barrel
// (games must stay browser-clean).

import type { Plugin, ViteDevServer } from 'vite';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, watch, writeFileSync } from 'node:fs';
import { dirname, join, normalize, resolve } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

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

          if (req.method === 'GET' && url === '/__studio/state') {
            const knobsPath = join(studioDir, 'knobs.json');
            const knobs = existsSync(knobsPath) ? (JSON.parse(readFileSync(knobsPath, 'utf8')) as unknown) : null;
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
            return json(res, 200, { buildRef, knobs, sessions });
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
