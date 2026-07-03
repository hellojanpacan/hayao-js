// Static invariant checker: turns AGENTS.md's "hard invariants" from prose
// into a failing check. Runs before the verify suites (npm run verify) and
// standalone (npm run invariants). Exits non-zero on any violation.
//
// What it enforces (statically checkable subset):
//   1. No Math.random() anywhere in src/ or examples/ — randomness flows
//      through world.rng.
//   2. No wall-clock (Date.now / performance.now / argless new Date) in sim
//      code. Allowed only in the browser driver (src/app/browser.ts) and in
//      measurement code (*.test.ts, examples/*/verify.ts — perf budgets).
//   3. Examples import only from '@hayao' or relative paths ('vitest' allowed
//      in *.test.ts only).
//   4. Every examples/<slug>/ ships the full contract: index.html, main.ts,
//      game.ts, verify.ts, and at least one *.test.ts — no half-scaffolds.
//
// Not statically checkable (enforced by the runtime harness instead):
// ordered iteration, cosmetic flags, world.state discipline → determinism
// hash checks in verify suites catch those.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

interface Violation {
  file: string;
  line: number;
  rule: string;
  excerpt: string;
}
const violations: Violation[] = [];

function tsFilesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...tsFilesUnder(p));
    else if (entry.name.endsWith('.ts')) out.push(p);
  }
  return out;
}

// Strip // line comments and /* */ block comments so doc references to the
// banned names don't false-positive. Keeps line count intact for reporting.
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (_m, pre) => pre);
}

const files = [...tsFilesUnder(join(root, 'src')), ...tsFilesUnder(join(root, 'examples'))];

const WALL_CLOCK = [
  { rule: 'wall-clock: Date.now()', re: /\bDate\.now\s*\(/ },
  { rule: 'wall-clock: performance.now()', re: /\bperformance\.now\s*\(/ },
  { rule: 'wall-clock: argless new Date()', re: /\bnew Date\s*\(\s*\)/ },
];
const MATH_RANDOM = { rule: 'nondeterminism: Math.random()', re: /\bMath\.random\s*\(/ };

for (const file of files) {
  const rel = relative(root, file);
  const isBrowserDriver = rel === join('src', 'app', 'browser.ts');
  const isMeasurement =
    rel.endsWith('.test.ts') || /^examples\/[^/]+\/verify\.ts$/.test(rel.replaceAll('\\', '/'));
  const lines = stripComments(readFileSync(file, 'utf8')).split('\n');

  lines.forEach((text, i) => {
    // Math.random is banned everywhere — even tests must be deterministic.
    if (MATH_RANDOM.re.test(text)) {
      violations.push({ file: rel, line: i + 1, rule: MATH_RANDOM.rule, excerpt: text.trim() });
    }
    if (!isBrowserDriver && !isMeasurement) {
      for (const { rule, re } of WALL_CLOCK) {
        if (re.test(text)) violations.push({ file: rel, line: i + 1, rule, excerpt: text.trim() });
      }
    }
    // Examples: bare (non-relative) imports must be @hayao, or vitest in tests.
    if (rel.replaceAll('\\', '/').startsWith('examples/')) {
      const m = text.match(/from\s+['"]([^'"]+)['"]/);
      if (m && !m[1].startsWith('.') && m[1] !== '@hayao') {
        const ok = m[1] === 'vitest' && rel.endsWith('.test.ts');
        if (!ok) {
          violations.push({
            file: rel,
            line: i + 1,
            rule: `import: examples may only import '@hayao' (found '${m[1]}')`,
            excerpt: text.trim(),
          });
        }
      }
    }
  });
}

// Structure contract: no half-scaffolded examples.
const examplesDir = join(root, 'examples');
for (const entry of readdirSync(examplesDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const slug = entry.name;
  const dir = join(examplesDir, slug);
  for (const required of ['index.html', 'main.ts', 'game.ts', 'verify.ts']) {
    if (!existsSync(join(dir, required))) {
      violations.push({
        file: join('examples', slug),
        line: 0,
        rule: `structure: missing ${required}`,
        excerpt: 'copy examples/sokoban/ and adapt — no half-scaffolds',
      });
    }
  }
  if (!readdirSync(dir).some((f) => f.endsWith('.test.ts'))) {
    violations.push({
      file: join('examples', slug),
      line: 0,
      rule: 'structure: missing *.test.ts',
      excerpt: 'every example ships a vitest suite',
    });
  }
}

if (violations.length === 0) {
  console.log(`hayao invariants — ${files.length} files scanned, all clean.`);
  process.exit(0);
}
console.error(`hayao invariants — ${violations.length} violation(s):\n`);
for (const v of violations) {
  console.error(`  ✗ ${v.file}${v.line ? `:${v.line}` : ''} — ${v.rule}`);
  console.error(`      ${v.excerpt}`);
}
process.exit(1);
