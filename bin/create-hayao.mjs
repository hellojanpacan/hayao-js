#!/usr/bin/env node
// create-hayao — scaffold a fresh, runnable hayao project in one command.
//
//   npm create hayao@latest my-game
//   # or: npx create-hayao my-game
//
// The point is AI-first distribution: the generated project is shaped so a coding
// agent lands in a repo that already knows the invariants (AGENTS.md), already has
// the verify gate wired (`npm run verify`), and ships a STARTER that demonstrates
// the headline capability — a solver-backed generator composing a proven, ramped
// campaign. An agent opening this folder can author a game and prove it correct
// without ever opening a browser. Zero network beyond `npm install`.

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
// --seed: scaffold a SEED-STAGE project — a Timeline and a first atom, NO game
// yet. The Workshop shows it from day zero; the game grows out of the atoms
// (design/00-process/the-seed.md). The default stays the full proven game.
const seedMode = args.includes('--seed');
const name = args.filter((a) => !a.startsWith('-'))[0] || (seedMode ? 'my-hayao-project' : 'my-hayao-game');
const dir = resolve(process.cwd(), name);
const slug = name.replace(/[^a-z0-9-]/gi, '-').toLowerCase();

if (existsSync(dir)) {
  console.error(`✗ ${dir} already exists — pick a new directory name.`);
  process.exit(1);
}

/** Files to write, relative to the new project root. */
const files = {
  'package.json': JSON.stringify(
    {
      name: slug,
      private: true,
      type: 'module',
      scripts: {
        dev: 'vite',
        check: 'tsc --noEmit',
        test: 'vitest run',
        verify: 'tsx verify.ts',
        build: 'vite build',
      },
      dependencies: { hayao: '^0.5' },
      devDependencies: {
        '@types/node': '^22.10.0',
        tsx: '^4.19.0',
        typescript: '^5.7.0',
        vite: '^6.0.0',
        vitest: '^2.1.0',
      },
    },
    null,
    2,
  ) + '\n',

  'tsconfig.json': JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'bundler',
        strict: true,
        noUnusedLocals: true,
        skipLibCheck: true,
        types: ['vite/client', 'node'],
        // Runtime resolution for tsx (verify.ts, the MCP sidecar loading game
        // modules); TYPES come from hayao-env.d.ts's ambient declaration.
        paths: { '@hayao': ['./node_modules/hayao/dist/index.js'] },
      },
      include: ['*.ts', '*.d.ts'],
    },
    null,
    2,
  ) + '\n',

  'vite.config.ts': `import { defineConfig } from 'vite';
import { hayaoWorkshop } from 'hayao/workshop';
// Mirror the hayao convention: games import from the single '@hayao' seam.
// hayaoWorkshop() is the Workshop dev harness: playtest sessions record to
// .workshop/, live tuning knobs, A/B variants, and the /workshop/ page — see
// docs/WORKSHOP.md in the hayao repo. Dev-only; production builds are untouched.
export default defineConfig({
  resolve: { alias: { '@hayao': 'hayao' } },
  plugins: [hayaoWorkshop()],
});
`,

  'hayao-env.d.ts': `// Types for the '@hayao' seam: runtime resolution is the tsconfig paths entry
// (tsx) and the vite alias; this ambient declaration gives TS the package's
// real types for both.
declare module '@hayao' {
  export * from 'hayao';
}
`,

  '.mcp.json': JSON.stringify(
    { mcpServers: { 'hayao-workshop': { command: 'npx', args: ['hayao-mcp'] } } },
    null,
    2,
  ) + '\n',

  'index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${slug} · hayao</title>
    <style>html,body{margin:0;height:100%;background:#12121a;font-family:Georgia,serif}#app{position:absolute;inset:0}</style>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./main.ts"></script>
  </body>
</html>
`,

  'logic.ts': `// Pure puzzle logic — no engine imports beyond the Puzzle type. This is the truth
// the solver proves and the scene tree merely views. A tiny "toggle" puzzle: tap a
// cell to flip it and its plus-neighbours; win when the whole grid is lit. Every
// tap is self-inverse, so any board reached by scrambling from solved is winnable —
// which makes it the perfect target for the solver-backed generator.
import type { Puzzle } from '@hayao';
import { Rng } from '@hayao';

export interface ToggleState { lit: number[]; cols: number; rows: number; }

export function flip(lit: readonly number[], i: number, cols: number, rows: number): number[] {
  const out = lit.slice();
  const x = i % cols, y = Math.floor(i / cols);
  const set = (xx: number, yy: number) => { if (xx>=0&&yy>=0&&xx<cols&&yy<rows){ const j=yy*cols+xx; out[j]=out[j]?0:1; } };
  set(x,y); set(x-1,y); set(x+1,y); set(x,y-1); set(x,y+1);
  return out;
}

export function makeToggle(rng: Rng, cols = 4, rows = 4, scramble = 8): Puzzle<ToggleState, number> {
  let lit = new Array<number>(cols*rows).fill(1);
  for (let k=0;k<scramble;k++) lit = flip(lit, rng.int(cols*rows), cols, rows);
  const start = lit.slice();
  const all = Array.from({length: cols*rows}, (_,i)=>i);
  return {
    initial: () => ({ lit: start.slice(), cols, rows }),
    moves: () => all,
    apply: (s, i) => ({ lit: flip(s.lit, i, cols, rows), cols, rows }),
    isWin: (s) => s.lit.every(v=>v===1),
    key: (s) => s.lit.join(''),
  };
}
`,

  'game.ts': `// The game: pure logic (logic.ts) → a scene-tree view. Content is generated and
// PROVEN by the solver-backed generator, then composed into a ramped campaign.
import { Node, Sprite, Text, REGALIA, REGALIA_EXT, withAlpha, linearGradient, glow, registerNode, audio,
         defineGame, composeCampaign, knob, type World } from '@hayao';
import { makeToggle, flip, type ToggleState } from './logic';

// Generate a small, proven, ramped campaign at load — every level solver-winnable.
const CAMPAIGN = composeCampaign<ToggleState, number>({
  seed: 7,
  acts: [
    { name: 'Warmup', count: 6, minDepth: 2, maxDepth: 3, factory: (r) => makeToggle(r, 3, 3, 5) },
    { name: 'Deeper', count: 8, minDepth: 4, maxDepth: 6, factory: (r) => makeToggle(r, 4, 4, 12) },
  ],
});
export const LEVELS = CAMPAIGN.levels;

const W = 1280, H = 720;

class GameView extends Node {
  override readonly type = 'GameView';
  idx = 0;
  lit: number[] = LEVELS[0].puzzle.initial().lit;
  cursor = 0;
  private layer = new Node({ name: 'layer' });

  protected override onReady(): void { this.layer.cosmetic = true; this.addChild(this.layer); this.paint(); }
  private dims() { const s = LEVELS[this.idx].puzzle.initial(); return { cols: s.cols, rows: s.rows }; }

  private paint(): void {
    for (const c of this.layer.children.slice()) this.layer.removeChild(c);
    const { cols, rows } = this.dims();
    // Workshop knob: adjust live on /workshop/ while playing, accept, then ask the
    // agent to write the accepted value back into the tuning default below.
    const round = (this.world as World).tune<number>('cellRound');
    const cell = 120, ox = W/2 - (cols*cell)/2 + cell/2, oy = H/2 - (rows*cell)/2 + cell/2;
    for (let i=0;i<cols*rows;i++){
      const x = ox + (i%cols)*cell, y = oy + Math.floor(i/cols)*cell, on = this.lit[i]===1;
      this.layer.addChild(new Sprite({ name:\`c\${i}\`, pos:{x,y}, z:1,
        shape:{kind:'rect', w:cell*0.7, h:cell*0.7, r:round},
        fill: on ? REGALIA.gold : withAlpha(REGALIA.softInk, 0.15),
        gradient: on ? linearGradient([REGALIA.gold, REGALIA.rose], 90) : undefined,
        stroke: withAlpha(REGALIA.paper, on?0.5:0.2), strokeWidth: 2,
        shadow: on ? glow(withAlpha(REGALIA.gold,0.8), 40) : undefined }));
    }
    const cp = { x: ox + (this.cursor%cols)*cell, y: oy + Math.floor(this.cursor/cols)*cell };
    this.layer.addChild(new Sprite({ name:'cursor', pos:cp, z:5, shape:{kind:'rect', w:cell*0.82, h:cell*0.82, r:22}, fill:'none', stroke:REGALIA_EXT.teal, strokeWidth:3 }));
    this.layer.addChild(new Text({ name:'hud', text:\`\${LEVELS[this.idx].actName} — level \${this.idx+1}/\${LEVELS.length} · arrows move · space tap\`, pos:{x:W/2,y:60}, size:24, align:'center', fill:REGALIA.paper }));
  }

  private tap(): void {
    const { cols, rows } = this.dims();
    this.lit = flip(this.lit, this.cursor, cols, rows); audio.blip(360);
    if (this.lit.every(v=>v===1)) { this.idx = (this.idx+1) % LEVELS.length; this.lit = LEVELS[this.idx].puzzle.initial().lit; this.cursor = 0; audio.success(); }
    this.paint();
  }
  private move(dx:number,dy:number): void {
    const { cols, rows } = this.dims();
    const x = Math.max(0,Math.min(cols-1,(this.cursor%cols)+dx));
    const y = Math.max(0,Math.min(rows-1,Math.floor(this.cursor/cols)+dy));
    this.cursor = y*cols+x; this.paint();
  }
  protected override onProcess(): void {
    if (!this.world) return; const inp = (this.world as World).input;
    if (inp.justPressed('up')) this.move(0,-1);
    if (inp.justPressed('down')) this.move(0,1);
    if (inp.justPressed('left')) this.move(-1,0);
    if (inp.justPressed('right')) this.move(1,0);
    if (inp.justPressed('confirm')) this.tap();
  }
  protected override serializeProps() { return { idx: this.idx, lit: this.lit, cursor: this.cursor }; }
  override applyProps(p: Record<string, unknown>) { if (p.lit){ this.idx=p.idx as number; this.lit=p.lit as number[]; this.cursor=p.cursor as number; this.paint(); } }
}
registerNode('GameView', () => new GameView());

export const game = defineGame({
  title: '${slug}', width: W, height: H, background: REGALIA.ground,
  // Live-tunable knobs: the /workshop/ page builds sliders from this spec, values
  // are hashed sim state read via world.tune(). Defaults ARE the config.
  tuning: { knobs: [knob.num('cellRound', { default: 18, min: 0, max: 40, step: 1, group: 'look' })] },
  build: () => new GameView({ name: 'game' }),
  probe: (w) => { const v = w.root.find('game') as GameView | null; return { level: v?.idx ?? 0, lit: v ? v.lit.reduce((a,b)=>a+b,0) : 0 }; },
});
`,

  'main.ts': `import { runWorkshop } from '@hayao';
import { game } from './game';
import { variants } from './variants';

// Workshop-instrumented dev driver: playtests record to the dev server,
// ?seed=/?tuning=/?variant= override, the /workshop/ page drives the knobs, and
// \`hot\` carries the live world across code edits. Production builds behave
// like plain runBrowser (the Workshop endpoints simply aren't there).
runWorkshop(game, document.getElementById('app')!, { variants, hot: import.meta.hot });
// Literal self-accept — Vite marks HMR boundaries by static source scan, so
// this line (not a call inside the engine) is what prevents full reloads.
import.meta.hot?.accept();
`,

  'variants.ts': `// A/B variants for Workshop playtests: pick with ?variant=<name> or compare two
// side by side on the /workshop/ page. Tuning-only variants hot-toggle mid-play.
import type { Variant } from '@hayao';

export const variants: Record<string, Variant> = {
  chunky: { label: 'Chunky — big rounded cells', tuning: { cellRound: 34 } },
  sharp: { label: 'Sharp — square cells', tuning: { cellRound: 2 } },
};
`,

  'verify.ts': `// Prove the game correct — no browser. Run: npm run verify
import { solve, rampIssues } from '@hayao';
import { LEVELS } from './game';

let failures = 0;
const ok = (label: string, pass: boolean) => { console.log(\`  \${pass?'✓':'✗'} \${label}\`); if (!pass) failures++; };

// Every generated level is solver-proven winnable.
let allWin = true;
for (const l of LEVELS) { const r = solve(l.puzzle); if (!r.solvable) allWin = false; }
ok(\`all \${LEVELS.length} levels solver-proven winnable\`, allWin);

// The difficulty curve is well-shaped.
const problems = rampIssues(LEVELS.map(l => l.depth));
ok(problems.length === 0 ? 'difficulty ramps cleanly' : \`ramp: \${problems[0]}\`, problems.length === 0);

console.log(failures === 0 ? '\\nAll checks passed.' : \`\\n\${failures} failed.\`);
process.exit(failures === 0 ? 0 : 1);
`,

  'game.test.ts': `import { describe, expect, it } from 'vitest';
import { Rng, solve } from '@hayao';
import { makeToggle, flip } from './logic';
import { LEVELS } from './game';

describe('toggle puzzle', () => {
  it('flip is self-inverse', () => {
    const a = new Array(9).fill(0);
    expect(flip(flip(a, 4, 3, 3), 4, 3, 3)).toEqual(a);
  });
  it('generated boards are always winnable', () => {
    for (let s=0;s<20;s++) expect(solve(makeToggle(new Rng(s), 4, 4, 10)).solvable).toBe(true);
  });
  it('the shipped campaign is winnable end to end', () => {
    for (const l of LEVELS) expect(solve(l.puzzle).solvable).toBe(true);
  });
});
`,

  'AGENTS.md': `# AGENTS.md — working in this hayao project

You are the game developer. The engine (npm package \`hayao\`) pre-solves the traps:
headless verification, determinism, crisp rendering, DOM menus. Hold the invariants.

## Commands
- \`npm run dev\` — vite dev server (play in a browser)
- \`npm run check\` — typecheck (must pass before handoff)
- \`npm test\` — vitest (headless, runs in Node)
- \`npm run verify\` — prove every level winnable + the ramp well-shaped, no browser

## Invariants (determinism is sacred)
- **Import only from \`@hayao\`.** The whole public surface is one seam.
- **All randomness flows through a seeded \`Rng\`** — never \`Math.random\`, \`Date.now\`,
  or argless \`new Date\` in game logic.
- **Turn-based/puzzle rules live in a pure \`Puzzle<State, Move>\` module** (logic.ts);
  the scene tree is a *view*. Every level is machine-proven winnable via \`solve()\`.
- **Menus are DOM overlays; mark pure-view nodes \`cosmetic = true\`** so they stay out
  of \`world.hash()\`.
- **Generate content, don't hand-author volume.** \`generateLevels\` / \`composeCampaign\`
  emit solver-verified levels inside a difficulty band; \`rampIssues\`/\`assertRamp\`
  prove the curve. See game.ts for the pattern.

## Where things are
- \`logic.ts\` — pure puzzle rules (the truth)
- \`game.ts\`  — scene-tree view + the generated campaign + tuning knobs
- \`variants.ts\` — named A/B alternatives for Workshop playtests
- \`verify.ts\` — the proof harness (winnable + ramp)

## The Workshop (human playtests → your context)
\`npm run dev\` then open \`/workshop/\` — the human plays there; every session
records to \`.workshop/\` as a bit-exactly replayable artifact. The
\`hayao-workshop\` MCP server (.mcp.json) is YOUR window into them:
\`list_sessions\`, \`get_playtest_report\` (hesitations, deaths, futile verbs,
quit context), \`inspect_moment\` (replay any tick → probe + screenshot),
\`get_knob_state\` (values the human accepted — write them back into the
\`tuning:\` defaults in game.ts, then \`npm run verify\`). Telemetry describes,
the human directs: propose fixes from the data, never auto-apply.
Install \`@resvg/resvg-js\` as a devDependency to enable inspect_moment PNGs.

## Claude Code plugin (optional, recommended)
The engine ships a plugin that packages these conventions as skills and
commands (\`/hayao:new-game\`, \`/hayao:verify\`, \`/hayao:inspect-api\`) plus a
hook-enforced determinism gate — \`npm run verify\` must pass before the agent
can finish a turn that changed source:
\`/plugin marketplace add hellojanpacan/hayao-js\` then \`/plugin install hayao@hayao\`.

Full docs & the greppable API digest: https://github.com/hellojanpacan/hayao-js
`,

  'llms.txt': `# ${slug} (built with hayao)

> A hayao game. hayao is an AI-first, deterministic, headless-verifiable game engine.
> Author in logic.ts (pure Puzzle) + game.ts (scene view); prove with \`npm run verify\`.

- Import only from \`@hayao\`. All randomness through a seeded \`Rng\`.
- Content is generated and solver-proven: see \`composeCampaign\` in game.ts.
- Engine docs: https://raw.githubusercontent.com/hellojanpacan/hayao-js/main/AGENTS.md
- API digest: https://raw.githubusercontent.com/hellojanpacan/hayao-js/main/docs/API.md
`,

  'README.md': `# ${slug}

A game built with [hayao](https://github.com/hellojanpacan/hayao-js) — an AI-first,
deterministic, headless-verifiable game engine.

\`\`\`sh
npm install
npm run dev      # play in a browser
npm test         # headless tests
npm run verify   # prove every level winnable + the ramp well-shaped
\`\`\`

Every level in this game is **machine-generated and solver-proven winnable** — the
content is composed by \`composeCampaign\` (see \`game.ts\`), not hand-authored. Read
\`AGENTS.md\` for the conventions an AI author should hold.
`,

  '.gitignore': `node_modules\ndist\n*.log\n.workshop/\n`,
};

/**
 * --seed: the atom-first anatomy. Shares the toolchain files with the full
 * scaffold; swaps the game for a TIMELINE.md + one starter atom. game.ts (and
 * the whole proof contract) arrives later, when the atoms find their spine.
 */
const today = new Date().toISOString().slice(0, 10);
const seedFiles = {
  'package.json': files['package.json'].replace('"verify": "tsx verify.ts",\n    ', ''),
  'tsconfig.json': files['tsconfig.json'],
  'vite.config.ts': files['vite.config.ts'],
  'hayao-env.d.ts': files['hayao-env.d.ts'],
  '.mcp.json': files['.mcp.json'],
  'index.html': files['index.html'],
  '.gitignore': files['.gitignore'],

  'TIMELINE.md': `# ${slug} — Timeline

## Future

- What might this become? Loosely held bullets only.

## Present

- Day zero: iterating the first atom. Awaiting: nothing yet.

## Past

### ${today} · Project opened

No concept yet — on purpose. This project starts from an ATOM (something you
can see, hear, or feel), not a pitch. When an atom starts radiating a game,
write the Original Concept here as a new dated entry. Old entries are never
edited; pivots are appended. Staleness is a feature.
`,

  'atoms/first-light.ts': `// The first atom — replace me. Iteration log:
//   v1: a placeholder mark, so the Workshop has something to behold on day zero.
// Radiates: nothing yet — that's the work. Iterate until it does, or archive.
import { defineAtom, Node, Sprite, REGALIA, duotone } from '@hayao';

export const firstLight = defineAtom({
  kind: 'visual',
  title: 'First Light',
  build: () => {
    const s = duotone(REGALIA.gold);
    const g = new Node({ name: 'first-light' });
    g.cosmetic = true;
    g.addChild(new Sprite({ pos: { x: 640, y: 340 }, shape: { kind: 'circle', radius: 60 }, fill: s.base, stroke: s.ink, strokeWidth: 3 }));
    g.addChild(new Sprite({ pos: { x: 640, y: 340 }, shape: { kind: 'circle', radius: 26 }, fill: s.light }));
    return g;
  },
});
`,

  'main.ts': `import { runProject } from '@hayao';
import { firstLight } from './atoms/first-light';

// A seed-stage project: no game yet, lawfully. The Workshop shows the Timeline
// and the atoms; add \`game\` to runProject when loop assembly begins.
runProject({ title: '${slug}', atoms: [firstLight] }, document.getElementById('app')!, { hot: import.meta.hot });
import.meta.hot?.accept();
`,

  'AGENTS.md': `# AGENTS.md — working in this seed-stage hayao project

This project has NO GAME YET, by design. It is a Timeline + atoms, visible in
the Workshop (\`npm run dev\` → /workshop/) from day zero.

- **Atoms** live in \`atoms/\`, one \`defineAtom\` per file — visual | scene |
  audio. The file's header comment is its iteration log. Everything an atom
  renders is cosmetic; knobs use the same \`tuning\` system as games.
- **TIMELINE.md** is a dated log, not a contract. Keep \`## Present\` honest
  (what you're doing, what feedback you await); APPEND to Past, never rewrite.
- **The method** is the seed: iterate an atom until it's good ALONE, name what
  it \`radiates:\`, then audition tensions until the atom is load-bearing —
  then write the Original Concept into the Timeline and start \`game.ts\`.
  Before loop assembly, atoms outrank concepts; a pivot costs a paragraph.
- When \`game.ts\` lands, the full hayao proof contract activates (solver or
  scripted playthrough, determinism, verify) — scaffold it from the docs:
  https://raw.githubusercontent.com/hellojanpacan/hayao-js/main/AGENTS.md
`,

  'README.md': `# ${slug}

A seed-stage [hayao](https://hayao.dev) project: a Timeline and atoms, no game
yet — the game grows out of whichever atom starts radiating one.

\`npm install\`, \`npm run dev\`, open \`/workshop/\`.
`,
};

mkdirSync(dir, { recursive: true });
for (const [rel, content] of Object.entries(seedMode ? seedFiles : files)) {
  const p = join(dir, rel);
  mkdirSync(join(p, '..'), { recursive: true });
  writeFileSync(p, content);
}

if (seedMode) {
  console.log(`\n✨ Scaffolded a seed-stage hayao project in ${name}/\n`);
  console.log(`  cd ${name}`);
  console.log('  npm install');
  console.log('  npm run dev      # open /workshop/ — Timeline + your first atom\n');
  console.log('Iterate atoms until one radiates a game; AGENTS.md has the method.\n');
} else {
  console.log(`\n✨ Scaffolded a hayao game in ${name}/\n`);
  console.log(`  cd ${name}`);
  console.log('  npm install');
  console.log('  npm run verify   # prove it correct — no browser');
  console.log('  npm run dev      # play it\n');
  console.log('An agent working here should read AGENTS.md first.\n');
}
