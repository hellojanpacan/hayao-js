// CI verifier: auto-discovers every example's verify suite and runs it.
// An example opts in by shipping examples/<slug>/verify.ts with:
//   export default async function verify(t: VerifyContext): Promise<void>
// Inside, call t.check(label, boolean) / t.ok(label) / t.fail(label).
// t.golden(label, hash) pins a replay hash against examples/<slug>/golden.json
// (re-record intentional behavior changes with UPDATE_GOLDEN=1 npm run verify).
// t.artifact(name, content) drops a reviewable file under shots/<slug>/.
// Exits non-zero on any failure (or any example missing a verify suite),
// so it gates a pipeline. Run: npm run verify

import { readdirSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface VerifyContext {
  ok(label: string): void;
  fail(label: string): void;
  check(label: string, pass: boolean): void;
  /**
   * Pin a deterministic replay hash. Compares against the committed
   * examples/<slug>/golden.json; any engine or game change that alters
   * behavior fails here, portfolio-wide. Intentional changes:
   * UPDATE_GOLDEN=1 npm run verify, then commit golden.json with a note.
   */
  golden(label: string, hash: string): void;
  /** Write a reviewable artifact (e.g. a filmstrip SVG) to shots/<slug>/<name>. */
  artifact(name: string, content: string): void;
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const examplesDir = join(root, 'examples');
const slugs = readdirSync(examplesDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

let failures = 0;

for (const slug of slugs) {
  const suite = join(examplesDir, slug, 'verify.ts');
  console.log(`\nhayao verify — ${slug}`);
  if (!existsSync(suite)) {
    console.error(`  ✗ no verify.ts — every example must prove its content`);
    failures++;
    continue;
  }
  const goldenPath = join(examplesDir, slug, 'golden.json');
  const goldens: Record<string, string> = existsSync(goldenPath)
    ? JSON.parse(readFileSync(goldenPath, 'utf8'))
    : {};
  let goldensDirty = false;
  const t: VerifyContext = {
    ok: (label) => console.log(`  ✓ ${label}`),
    fail: (label) => {
      console.error(`  ✗ ${label}`);
      failures++;
    },
    check: (label, pass) => (pass ? t.ok(label) : t.fail(label)),
    golden: (label, hash) => {
      if (process.env.UPDATE_GOLDEN) {
        const changed = goldens[label] !== hash;
        goldens[label] = hash;
        goldensDirty ||= changed;
        t.ok(`golden "${label}" ${changed ? 'recorded' : 'unchanged'} (${hash})`);
      } else if (!(label in goldens)) {
        t.fail(`golden "${label}" has no recorded hash — run UPDATE_GOLDEN=1 npm run verify and commit golden.json`);
      } else {
        t.check(
          goldens[label] === hash
            ? `golden "${label}" replay hash unchanged`
            : `golden "${label}" DIVERGED (was ${goldens[label]}, now ${hash}) — behavior changed; if intentional, re-record with UPDATE_GOLDEN=1`,
          goldens[label] === hash,
        );
      }
    },
    artifact: (name, content) => {
      const dir = join(root, 'shots', slug);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, name), content);
      console.log(`  ▸ artifact shots/${slug}/${name}`);
    },
  };
  try {
    const mod = await import(suite);
    await mod.default(t);
  } catch (err) {
    console.error(`  ✗ suite threw: ${err instanceof Error ? err.message : err}`);
    failures++;
  }
}

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
