#!/usr/bin/env node
// Regression guard for the packed npm tarball. The Workshop UI is a *prebuilt*
// artifact (`build:workshop` → dist-workshop/) that the plugin serves at
// /workshop/ in consumer projects. It shipped broken once: `prepublishOnly`
// built dist-workshop/, but the `files` allowlist in package.json didn't list
// it, so npm silently dropped the whole directory and installed packages served
// {"error":"no prebuilt Workshop UI in this hayao build"} (findPrebuiltWorkshop
// in src/workshop/vitePlugin.ts finds nothing). Nothing in-repo failed — only a
// consumer install did. This makes that class of omission loud and proximate:
// it asks npm itself what the tarball WOULD contain and fails if a required
// entry is missing.
//
// Runs in CI (ci.yml) after `npm run build:workshop`, and locally via
// `npm run pack:check`. `npm pack --dry-run` runs the prepack lifecycle but NOT
// prepublishOnly, so the caller must build dist-workshop/ first — the on-disk
// preflight below turns a forgotten build into a clear message instead of a
// confusing "missing from tarball".
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Entries that MUST be present in every published tarball. Extend as needed.
const REQUIRED = ['dist-workshop/index.html'];

const fail = (msg) => {
  // GitHub Actions surfaces ::error:: as an annotation; harmless locally.
  console.error(`::error::${msg}`);
  process.exit(1);
};

// Preflight: the artifact has to exist on disk for `npm pack` to include it.
// A missing file here means "you forgot to build", not "the allowlist is wrong".
const onDisk = REQUIRED.filter((p) => !existsSync(join(root, p)));
if (onDisk.length) {
  fail(
    `Not built on disk: ${onDisk.join(', ')}. Run \`npm run build:workshop\` ` +
      `before packing (npm pack does not run prepublishOnly).`,
  );
}

// Ask npm what it would pack. --json returns [{ files: [{ path }], ... }] with
// repo-relative paths (no leading "package/").
let manifest;
try {
  const out = execFileSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  manifest = JSON.parse(out);
} catch (err) {
  fail(`\`npm pack --dry-run --json\` failed: ${err.message}`);
}

const packed = new Set(
  (manifest?.[0]?.files ?? []).map((f) => f.path.replace(/^\.\//, '')),
);
const missing = REQUIRED.filter((p) => !packed.has(p));
if (missing.length) {
  fail(
    `Tarball is missing required entries: ${missing.join(', ')}. Add the ` +
      `directory to the "files" allowlist in package.json (this is the ` +
      `dist-workshop omission — installs serve "no prebuilt Workshop UI").`,
  );
}

console.log(`OK: tarball contains ${REQUIRED.join(', ')} (${packed.size} files total).`);
