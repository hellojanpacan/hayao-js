// CI verifier: auto-discovers every example's verify suite and runs it.
// An example opts in by shipping examples/<slug>/verify.ts with:
//   export default async function verify(t: VerifyContext): Promise<void>
// Inside, call t.check(label, boolean) / t.ok(label) / t.fail(label).
// Exits non-zero on any failure (or any example missing a verify suite),
// so it gates a pipeline. Run: npm run verify

import { readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface VerifyContext {
  ok(label: string): void;
  fail(label: string): void;
  check(label: string, pass: boolean): void;
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
  const t: VerifyContext = {
    ok: (label) => console.log(`  ✓ ${label}`),
    fail: (label) => {
      console.error(`  ✗ ${label}`);
      failures++;
    },
    check: (label, pass) => (pass ? t.ok(label) : t.fail(label)),
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
