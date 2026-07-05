#!/usr/bin/env node
// Preflight guard for `npm publish` — closes the trap logged in
// docs/FRICTION.md (2026-07-05): a files/exports/bin change is a *publishable*
// change, but if the version isn't bumped, `npm publish` silently no-ops and
// npm keeps serving the OLD tarball. Nothing in-repo fails; consumers get a
// stale package. This guard makes that failure loud and proximate.
//
// Two checks, both fatal:
//   1. If a release tag is present (RELEASE_TAG=vX.Y.Z), it must equal
//      `v${package.json version}` — a mismatched tag means the wrong commit or
//      an un-bumped version is being released.
//   2. The version must not already exist on npm — a re-publish at an existing
//      version is the exact silent no-op that shipped a partial 0.2.0.
//
// Runs in CI (publish.yml, before `npm publish`) and locally before cutting a
// release: `RELEASE_TAG=v0.4.0 node scripts/preflight-publish.mjs`.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const { name, version } = pkg;

const fail = (msg) => {
  // GitHub Actions surfaces ::error:: as an annotation; harmless locally.
  console.error(`::error::${msg}`);
  process.exit(1);
};

// Check 1 — release tag must match the version being published.
const tag = process.env.RELEASE_TAG?.trim();
if (tag && tag !== `v${version}`) {
  fail(
    `Release tag ${tag} != package.json v${version}. Bump the version in ` +
      `package.json (a files/exports/bin change counts), or fix the tag.`,
  );
}

// Check 2 — the version must be new on npm. `npm view pkg@ver version` prints
// the version if it exists and prints nothing (exit 0) if it doesn't.
let published = '';
try {
  published = execFileSync('npm', ['view', `${name}@${version}`, 'version'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
} catch {
  // Network error / unpublished name → treat as "not on npm"; publish proceeds
  // and npm itself is the final arbiter. We only hard-fail on a positive match.
  published = '';
}
if (published === version) {
  fail(
    `${name}@${version} is already on npm — publishing would silently no-op ` +
      `and keep serving the old tarball. Bump the version (FRICTION 2026-07-05).`,
  );
}

console.log(
  `OK: ${name}@${version} is new on npm${tag ? `, tag ${tag} matches` : ''}.`,
);
