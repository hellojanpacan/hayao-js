// bench/collect.ts — score a finished bench worktree, independent of how the
// agent session ran. Run: npx tsx bench/collect.ts --worktree <wt> --slug <slug>
//   [--spec <spec.md>] [--log <stream.jsonl>] [--wall <sec>] [--agent-exit <n>]
//   [--out <run.json>]
//
// Never trusts the agent's claims: re-runs check/test/invariants/verify fresh.
// Trusts the transcript (if given) for iteration/token counts, and SESSION.md
// only as a fallback + for the doc-bug narrative.

import { execSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const wt = arg('worktree') ?? repo;
const slug = arg('slug');
if (!slug) {
  console.error('usage: npx tsx bench/collect.ts --worktree <wt> --slug <slug> [--log <jsonl>] [--out <json>]');
  process.exit(2);
}
const logPath = arg('log');
const outPath = arg('out');

function run(cmd: string, args: string[], timeoutMin = 15) {
  const r = spawnSync(cmd, args, {
    cwd: wt,
    encoding: 'utf8',
    timeout: timeoutMin * 60_000,
    maxBuffer: 64 * 1024 * 1024,
  });
  return { ok: r.status === 0, out: `${r.stdout ?? ''}\n${r.stderr ?? ''}` };
}

// ---- gates, run fresh -------------------------------------------------------
console.log(`scoring ${slug} in ${wt}`);
const gameDir = join(wt, 'examples', slug);
const shipped = existsSync(gameDir);
console.log(`  examples/${slug}/ exists: ${shipped}`);

const check = shipped ? run('npm', ['run', 'check']) : { ok: false, out: 'not shipped' };
console.log(`  npm run check: ${check.ok ? 'PASS' : 'FAIL'}`);
const test = shipped ? run('npm', ['test']) : { ok: false, out: 'not shipped' };
console.log(`  npm test: ${test.ok ? 'PASS' : 'FAIL'}`);
const invariants = shipped ? run('npx', ['tsx', 'scripts/invariants.ts']) : { ok: false, out: 'not shipped' };
console.log(`  invariants: ${invariants.ok ? 'PASS' : 'FAIL'}`);
const verify = shipped ? run('npx', ['tsx', 'scripts/verify.ts'], 30) : { ok: false, out: 'not shipped' };

// Split verify output into per-slug sections; our slug's failures vs others'.
const sections = verify.out.split(/^hayao verify — /m).slice(1);
const mySection = sections.find((s) => s.startsWith(slug)) ?? '';
const myFails = (mySection.match(/✗/g) ?? []).length;
const otherFails = sections
  .filter((s) => !s.startsWith(slug) && s.includes('✗'))
  .map((s) => s.split('\n')[0]);
console.log(`  verify: ${verify.ok ? 'PASS' : 'FAIL'} (own section: ${myFails} failures; other examples failing: ${otherFails.length ? otherFails.join(', ') : 'none'})`);

// ---- file contract ----------------------------------------------------------
const files = shipped ? readdirSync(gameDir) : [];
const contract = {
  required: ['index.html', 'main.ts', 'game.ts', 'verify.ts'].filter((f) => !files.includes(f)),
  hasTest: files.some((f) => f.endsWith('.test.ts')),
  hasGolden: files.includes('golden.json'),
  hasPureLogic: files.includes('logic.ts') || files.some((f) => /^(logic|rules|sim)\.ts$/.test(f)),
  hubRegistered: existsSync(join(wt, 'index.html')) && readFileSync(join(wt, 'index.html'), 'utf8').includes(slug),
};

// ---- hallucinated @hayao names ---------------------------------------------
// Real surface = every backticked name in docs/API.md of the WORKTREE (what
// the agent could have grepped), plus `Node2D` style bare exports.
const apiMd = readFileSync(join(wt, 'docs', 'API.md'), 'utf8');
const realNames = new Set([...apiMd.matchAll(/^- `(\w+)`/gm)].map((m) => m[1]));

const importedNames = new Set<string>();
for (const f of files.filter((f) => f.endsWith('.ts'))) {
  const src = readFileSync(join(gameDir, f), 'utf8');
  for (const m of src.matchAll(/import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]@hayao['"]/g)) {
    for (const raw of m[1].split(',')) {
      const name = raw.replace(/\btype\b/, '').trim().split(/\s+as\s+/)[0].trim();
      if (name) importedNames.add(name);
    }
  }
}
const hallucinatedShipped = [...importedNames].filter((n) => !realNames.has(n));

// Transient hallucinations: names the agent guessed mid-session and fixed —
// visible as TS "has no exported member" errors in the transcript.
const hallucinatedTransient = new Set<string>();
let verifyRuns: number | null = null;
let checkRuns: number | null = null;
let tokens: Record<string, unknown> | null = null;
let costUsd: number | null = null;
let numTurns: number | null = null;
let cliDurationMs: number | null = null;

if (logPath && existsSync(logPath)) {
  verifyRuns = 0;
  checkRuns = 0;
  for (const line of readFileSync(logPath, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    let ev: any;
    try { ev = JSON.parse(line); } catch { continue; }
    const blocks = ev?.message?.content;
    if (Array.isArray(blocks)) {
      for (const b of blocks) {
        if (b.type === 'tool_use' && b.name === 'Bash' && typeof b.input?.command === 'string') {
          if (/scripts\/verify\.ts|npm run verify/.test(b.input.command)) verifyRuns++;
          if (/npm run check|tsc --noEmit/.test(b.input.command)) checkRuns++;
        }
        const text = typeof b.text === 'string' ? b.text : typeof b.content === 'string' ? b.content : '';
        for (const m of text.matchAll(/has no exported member (?:named )?'(\w+)'/g)) hallucinatedTransient.add(m[1]);
        for (const m of text.matchAll(/'"@hayao"' has no exported member '(\w+)'/g)) hallucinatedTransient.add(m[1]);
      }
    }
    if (ev?.type === 'result') {
      tokens = ev.usage ?? null;
      costUsd = ev.total_cost_usd ?? null;
      numTurns = ev.num_turns ?? null;
      cliDurationMs = ev.duration_ms ?? null;
    }
  }
}

// ---- scope / contamination ---------------------------------------------------
let outOfScope: string[] = [];
try {
  const status = execSync('git status --porcelain', { cwd: wt, encoding: 'utf8' });
  outOfScope = status
    .split('\n')
    .filter(Boolean)
    .map((l) => l.slice(3).trim())
    .filter((p) => !p.startsWith(`examples/${slug}/`) && p !== 'index.html' && p !== 'node_modules');
} catch { /* not a git worktree — skip */ }

// ---- agent self-report --------------------------------------------------------
const sessionMdPath = join(gameDir, 'SESSION.md');
const sessionMd = existsSync(sessionMdPath) ? readFileSync(sessionMdPath, 'utf8') : null;

// ---- report -------------------------------------------------------------------
const done =
  check.ok && test.ok && invariants.ok && verify.ok &&
  contract.required.length === 0 && contract.hasTest && contract.hasGolden &&
  outOfScope.length === 0;

const result = {
  slug,
  spec: arg('spec') ?? null,
  worktree: wt,
  head: (() => { try { return execSync('git rev-parse --short HEAD', { cwd: wt, encoding: 'utf8' }).trim(); } catch { return null; } })(),
  scoredAt: new Date().toISOString(),
  agentExit: arg('agent-exit') ? Number(arg('agent-exit')) : null,
  wallSeconds: arg('wall') ? Number(arg('wall')) : null,
  gates: { check: check.ok, test: test.ok, invariants: invariants.ok, verify: verify.ok, ownVerifyFailures: myFails, otherExamplesFailing: otherFails },
  contract,
  done,
  iterations: { verifyRuns, checkRuns, source: logPath ? 'transcript' : 'none (see SESSION.md self-report)' },
  usage: { tokens, costUsd, numTurns, cliDurationMs },
  hallucinated: { shipped: hallucinatedShipped, transient: [...hallucinatedTransient] },
  outOfScopeChanges: outOfScope,
  sessionMd,
  gateOutputTails: done ? undefined : {
    check: check.ok ? undefined : check.out.slice(-3000),
    test: test.ok ? undefined : test.out.slice(-3000),
    invariants: invariants.ok ? undefined : invariants.out.slice(-2000),
    verify: verify.ok ? undefined : mySection.slice(-3000),
  },
};

if (outPath) {
  writeFileSync(outPath, JSON.stringify(result, null, 2) + '\n');
  console.log(`  wrote ${outPath}`);
}

const halluc = [...new Set([...hallucinatedShipped, ...hallucinatedTransient])];
console.log('\nRESULTS.md row:');
console.log(
  `| ${new Date().toISOString().slice(0, 10)} | ${slug} | ${done ? '✅' : '❌'} | ` +
  `${check.ok ? '✓' : '✗'} | ${test.ok ? '✓' : '✗'} | ${verify.ok ? '✓' : '✗'} | ` +
  `${verifyRuns ?? '?'} | ${result.wallSeconds ? Math.round(result.wallSeconds / 60) + 'm' : '?'} | ` +
  `${costUsd != null ? '$' + costUsd.toFixed(2) : '?'} | ${halluc.length ? halluc.join(', ') : 'none'} |`,
);
process.exit(done ? 0 : 1);
