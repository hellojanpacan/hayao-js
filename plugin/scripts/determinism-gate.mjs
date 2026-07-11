#!/usr/bin/env node
// The determinism gate — a Stop hook that turns "no obvious bugs" from a model
// hope into a gate it cannot ship past. When a session touched source in a
// hayao project, the project's verify harness must pass before the agent may
// stop; a failure blocks the stop (exit 2) and feeds the harness output back.
//
// Enforcement lives HERE, not in model discretion — and nothing here knows an
// API shape, only how to run the project's own proof. Design constraints:
//   - No-op fast everywhere that isn't a hayao project with changed source.
//   - Never loop: a stop already blocked by this hook (stop_hook_active) exits 0.
//   - Escape hatch for humans: HAYAO_SKIP_GATE=1.

import { execFileSync, execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const exit = (code, msg) => {
  if (msg) process.stderr.write(msg + '\n');
  process.exit(code);
};

if (process.env.HAYAO_SKIP_GATE === '1') exit(0);

// Read the hook payload from stdin (best-effort; an empty/absent payload is fine).
let payload = {};
try {
  const raw = readFileSync(0, 'utf8');
  if (raw.trim()) payload = JSON.parse(raw);
} catch {
  /* stdin unavailable — treat as empty payload */
}
if (payload.stop_hook_active) exit(0); // already gated this stop; never loop

// Locate the nearest package.json at or above cwd.
let dir = process.cwd();
let pkgPath = null;
for (;;) {
  const candidate = join(dir, 'package.json');
  if (existsSync(candidate)) {
    pkgPath = candidate;
    break;
  }
  const parent = dirname(dir);
  if (parent === dir) break;
  dir = parent;
}
if (!pkgPath) exit(0);

let pkg;
try {
  pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
} catch {
  exit(0);
}

// A hayao project is the engine repo itself, or anything depending on it.
const isHayao =
  pkg.name === 'hayao' ||
  Boolean(pkg.dependencies?.hayao ?? pkg.devDependencies?.hayao ?? pkg.peerDependencies?.hayao);
if (!isHayao || !pkg.scripts?.verify) exit(0);

const root = dirname(pkgPath);

// Only gate when source actually changed — a Q&A session must not pay for a
// portfolio verify. Untracked + modified, source extensions only.
let changed = [];
try {
  const out = execSync('git status --porcelain', { cwd: root, encoding: 'utf8' });
  changed = out
    .split('\n')
    .map((l) => l.slice(3).trim())
    .filter((f) => /\.(ts|tsx|mts|cts|js|mjs|cjs)$/.test(f) && !f.includes('node_modules'));
} catch {
  // Not a git repo — no cheap change signal, so gate unconditionally.
  changed = ['(no git — gating unconditionally)'];
}
if (changed.length === 0) exit(0);

const run = (cmd, args) => {
  try {
    execFileSync(cmd, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return null;
  } catch (err) {
    const out = `${err.stdout ?? ''}${err.stderr ?? ''}`;
    const lines = out.trim().split('\n');
    return lines.slice(-40).join('\n'); // the tail is where harnesses print failures
  }
};

// Fail-fast order: types are cheaper than the proof suites.
if (pkg.scripts?.check) {
  const fail = run('npm', ['run', '-s', 'check']);
  if (fail) exit(2, `hayao gate: \`npm run check\` failed — fix before stopping.\n${fail}`);
}
const fail = run('npm', ['run', '-s', 'verify']);
if (fail) {
  exit(
    2,
    `hayao gate: \`npm run verify\` failed — the session changed source (${changed
      .slice(0, 5)
      .join(', ')}${changed.length > 5 ? ', …' : ''}) and the proof harness rejects it. ` +
      `Fix the root cause (see the verify-determinism skill); never weaken a check or delete a proof.\n${fail}`,
  );
}
exit(0);
