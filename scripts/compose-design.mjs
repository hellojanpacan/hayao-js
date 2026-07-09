#!/usr/bin/env node
// compose-design — the generative layer over the Design Codex.
// Reads design/index.json (built by scripts/build-design-index.mjs) and turns the
// prose library into a composer: search it, walk its links, or SPARK a fresh
// "X but Y" brief by sampling an anchor + genre + verb + systems + a twist vector.
//
//   node scripts/compose-design.mjs list [kind] [--tag t]
//   node scripts/compose-design.mjs show  <id>
//   node scripts/compose-design.mjs graph <id>
//   node scripts/compose-design.mjs spark [--seed N] [--anchor id] [--genre id] [--n 3]
//
// The Codex is the generative front half; it hands off to docs/FUN|JUICE|JUDGE.
// This tool never designs FOR you — it hands you a starting composition to bend.
import { readFileSync } from 'node:fs';
import { randomInt } from 'node:crypto';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const INDEX = join(ROOT, 'design', 'index.json');

let modules;
try {
  modules = JSON.parse(readFileSync(INDEX, 'utf8'));
} catch {
  console.error('Cannot read design/index.json — run `node scripts/build-design-index.mjs` first.');
  process.exit(1);
}
const byId = new Map(modules.map(m => [m.id, m]));
const byKind = k => modules.filter(m => m.kind === k);
const TWISTS = ['theme', 'mechanic-swap', 'structure', 'perspective', 'constraint', 'tonal'];
const TWIST_PROMPT = {
  theme: 'reskin the fantasy onto a setting that recontextualizes every system',
  'mechanic-swap': 'replace its central verb with a different one and re-derive the loop',
  structure: 'change the session/run/campaign shape that holds it together',
  perspective: 'flip who the player is — invert the point of view on the loop',
  constraint: 'impose a hard limit (one button, one screen, one life, no UI) and design into it',
  tonal: 'hold a tone that clashes with the content, sincerely, and mine the friction',
};

// mulberry32 — a tiny seeded PRNG so a printed seed reproduces a spark.
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const flag = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
};

function list(kind, tag) {
  const rows = modules
    .filter(m => !kind || m.kind === kind)
    .filter(m => !tag || (Array.isArray(m.tags) ? m.tags : [m.tags]).includes(tag));
  for (const m of rows) console.log(`${m.id.padEnd(34)} ${m.title}`);
  console.log(`\n${rows.length} module(s)${kind ? ` of kind '${kind}'` : ''}${tag ? ` tagged '${tag}'` : ''}.`);
}

function show(id) {
  const m = byId.get(id);
  if (!m) return notFound(id);
  console.log(`# ${m.title}  (${m.id})`);
  console.log(`kind      : ${m.kind}`);
  console.log(`tags      : ${(m.tags || []).join(', ')}`);
  console.log(`summary   : ${m.summary}`);
  console.log(`use-when  : ${m['use-when']}`);
  console.log(`verify    : ${m['verify-with'] || 'none'}`);
  console.log(`file      : ${m.file}`);
  const cw = (m['composes-with'] || []).map(x => `  - ${x}${byId.has(x) ? '  ' + byId.get(x).title : '  (?)'}`);
  if (cw.length) console.log(`composes-with:\n${cw.join('\n')}`);
}

function graph(id) {
  const m = byId.get(id);
  if (!m) return notFound(id);
  const out = m['composes-with'] || [];
  const inbound = modules.filter(x => (x['composes-with'] || []).includes(id)).map(x => x.id);
  console.log(`# ${m.title}  (${m.id})\n`);
  console.log(`composes-with → ${out.length ? out.join(', ') : '(none)'}`);
  console.log(`← referenced by ${inbound.length ? inbound.join(', ') : '(none)'}`);
}

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
function sample(rng, arr, n) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, n);
}

function spark() {
  const seed = Number(flag('seed', randomInt(1, 1e9)));
  const rng = mulberry32(seed);
  const n = Math.max(2, Math.min(5, Number(flag('n', 3))));
  const anchors = byKind('anchor'), genres = byKind('genre'), systems = byKind('system'), mechanics = byKind('mechanic');
  const anchor = byId.get(flag('anchor')) || pick(rng, anchors);
  const genre = byId.get(flag('genre')) || pick(rng, genres);
  const verb = mechanics.length ? pick(rng, mechanics) : null;
  const twist = pick(rng, TWISTS);
  // prefer systems the genre already composes with; top up with random ones.
  const preferred = (genre['composes-with'] || []).filter(id => byId.get(id)?.kind === 'system');
  const chosen = [...new Set([...preferred, ...sample(rng, systems.map(s => s.id), systems.length)])].slice(0, n);

  const line = s => console.log(s);
  line(`# Spark  (seed ${seed} — pass --seed ${seed} to reproduce)\n`);
  line(`  Anchor   : ${anchor.title.padEnd(22)} ${anchor.summary}`);
  line(`  Genre    : ${genre.title.padEnd(22)} ${genre.summary}`);
  if (verb) line(`  Verb     : ${verb.title.padEnd(22)} ${verb.summary}`);
  line(`  Twist    : ${twist} — ${TWIST_PROMPT[twist]}`);
  line(`  Systems  : ${chosen.join(', ')}`);
  line(`\n  → "${genre.title} but ${twist}" — anchored on ${anchor.title}${verb ? `, built around ${verb.title.toLowerCase()}` : ''}.\n`);
  line(`  Design brief:`);
  line(`  Take ${anchor.title}'s load-bearing loop, shape it as a ${genre.title.toLowerCase()},`);
  line(`  and bend it along the ${twist.toUpperCase()} vector: ${TWIST_PROMPT[twist]}.`);
  if (verb) line(`  Let ${verb.title.toLowerCase()} be the signature verb.`);
  line(`  Pull: ${chosen.map(id => `[[${id}]]`).join(', ')}.`);
  line(`\n  Now run the pipeline:`);
  line(`  process-intent-to-brief → process-pillars → process-core-loop → process-the-twist → process-refine-and-handoff.`);
  line(`  Then check it against 70-antipatterns/ before you hand off to design/FUN.md.`);
}

function notFound(id) {
  console.error(`No module '${id}'. Try: node scripts/compose-design.mjs list`);
  process.exit(1);
}

const [cmd, arg] = process.argv.slice(2);
switch (cmd) {
  case 'list': list(arg && !arg.startsWith('--') ? arg : undefined, flag('tag')); break;
  case 'show': show(arg); break;
  case 'graph': graph(arg); break;
  case 'spark': spark(); break;
  default:
    console.log(`compose-design — the generative layer over the Design Codex (${modules.length} modules).\n`);
    console.log('  list [kind] [--tag t]      list modules (optionally by kind/tag)');
    console.log('  show  <id>                 show a module and what it composes with');
    console.log('  graph <id>                 show inbound + outbound links for a module');
    console.log('  spark [--seed N] [--anchor id] [--genre id] [--n 3]');
    console.log('                             sample a fresh "X but Y" brief to design from');
}
