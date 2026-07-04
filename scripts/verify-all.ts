// Single verify entry point. `npm run verify` chains three stages —
// invariants → verify suites → feel audit — and this orchestrator forwards the
// slug filter to ALL of them. Before, `npm run verify -- sokoban` only reached
// the last stage (feel), so a "just this game" run actually re-ran every game's
// verify suite and surfaced unrelated failures as if they were yours (#28).
//
//   npm run verify              → whole portfolio
//   npm run verify -- sokoban   → just sokoban, across every stage
//
// invariants.ts scans the whole tree regardless (it takes no slug); verify.ts and
// feel.ts both already honour a trailing slug list — they just weren't receiving it.

import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const slugs = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const stages = ['invariants.ts', 'verify.ts', 'feel.ts'];

for (const stage of stages) {
  try {
    execFileSync('tsx', [join(here, stage), ...slugs], { stdio: 'inherit' });
  } catch {
    process.exit(1); // the stage already printed its failures
  }
}
