// Build a WORKTREE variant for Workshop A/B: a git ref built to static files the
// dev server serves under /__workshop/variants/<name>/. Unlike module variants
// (tuning presets, instant), a worktree variant is a full build of different
// CODE — two jump implementations, yesterday's build vs today's. The build is
// immutable, which is what makes it an honest comparison artifact.
//
// Run:  node scripts/workshop-variant.mjs <name> <git-ref>
//   e.g. node scripts/workshop-variant.mjs before-jump-fix HEAD~1
//
// The worktree is temporary (removed after the build); .workshop/variants.json
// records name → {commit, ref, builtAt} for the Workshop UI and the MCP sidecar.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const [name, ref] = process.argv.slice(2);
if (!name || !ref || !/^[a-z0-9][a-z0-9._-]*$/i.test(name)) {
  console.error('usage: node scripts/workshop-variant.mjs <name> <git-ref>   (name: [a-z0-9._-])');
  process.exit(1);
}

const root = process.cwd();
const worktree = join(root, '.workshop', 'worktrees', name);
const outDir = join(root, '.workshop', 'variants', name);
const git = (...args) => execFileSync('git', args, { cwd: root, stdio: ['ignore', 'pipe', 'inherit'] }).toString().trim();

// Fresh worktree at the ref (replace any stale one).
if (existsSync(worktree)) {
  try {
    git('worktree', 'remove', '--force', worktree);
  } catch {
    rmSync(worktree, { recursive: true, force: true });
  }
}
mkdirSync(join(root, '.workshop', 'worktrees'), { recursive: true });
git('worktree', 'add', '--detach', worktree, ref);
const commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: worktree }).toString().trim();
console.log(`worktree ${name} @ ${commit} (${ref})`);

try {
  // The worktree shares the main checkout's dependencies — a variant build is
  // a code comparison, not a dependency-set comparison.
  if (!existsSync(join(worktree, 'node_modules'))) {
    symlinkSync(join(root, 'node_modules'), join(worktree, 'node_modules'), 'dir');
  }
  // vite.config.ts already honors BASE_PATH (the GitHub Pages hook) — reuse it
  // so every asset URL points under the variant's mount.
  execFileSync('npx', ['vite', 'build', '--outDir', outDir, '--emptyOutDir'], {
    cwd: worktree,
    stdio: 'inherit',
    env: { ...process.env, BASE_PATH: `/__workshop/variants/${name}/` },
  });

  const registryPath = join(root, '.workshop', 'variants.json');
  const registry = existsSync(registryPath) ? JSON.parse(readFileSync(registryPath, 'utf8')) : {};
  registry[name] = { kind: 'worktree', ref, commit, builtAt: new Date().toISOString(), path: resolve(outDir) };
  writeFileSync(registryPath, JSON.stringify(registry, null, 1));
  console.log(`✓ built .workshop/variants/${name} and registered in variants.json`);
} finally {
  try {
    git('worktree', 'remove', '--force', worktree);
  } catch {
    rmSync(worktree, { recursive: true, force: true });
  }
  git('worktree', 'prune');
}
