#!/usr/bin/env node
// Build design/INDEX.md + design/index.json from module frontmatter.
// Also validates: required fields present, ids unique & namespaced, and every
// [[link]] / composes-with / anchors id resolves. Run: node scripts/build-design-index.mjs
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DESIGN = join(ROOT, 'design');
// Top-level prose that lives in design/ but is NOT an indexed Codex module:
// the two READMEs, the template, the generated index, and the craft playbooks.
const SKIP = new Set(['README.md', '_TEMPLATE.md', 'CONTRIBUTING.md', 'INDEX.md', 'FUN.md', 'JUICE.md', 'JUDGE.md']);
const KIND_ORDER = ['process', 'anchor', 'genre', 'system', 'worldbuilding', 'pattern', 'mechanic', 'antipattern', 'recipe'];
const KIND_PREFIX = { process: 'process-', anchor: 'anchor-', genre: 'genre-', system: 'system-', worldbuilding: 'world-', pattern: 'pattern-', mechanic: 'mechanic-', antipattern: 'antipattern-', recipe: 'recipe-' };
const SECTION = { process: '00-process', anchor: '10-anchors', genre: '20-genres', system: '30-systems', worldbuilding: '40-worldbuilding', pattern: '50-patterns', mechanic: '60-mechanics', antipattern: '70-antipatterns', recipe: '80-recipes' };

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith('.md') && !SKIP.has(name)) out.push(p);
  }
  return out;
}

// Minimal frontmatter parser: scalar strings + inline [a, b] arrays. Enough for
// this schema; avoids a YAML dependency.
function parseFrontmatter(text, file) {
  if (!text.startsWith('---')) return { error: 'no frontmatter' };
  const end = text.indexOf('\n---', 3);
  if (end === -1) return { error: 'unterminated frontmatter' };
  const fm = text.slice(3, end).trim();
  const body = text.slice(end + 4);
  const obj = {};
  for (const line of fm.split('\n')) {
    const m = line.match(/^([a-zA-Z-]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (val.startsWith('[')) {
      val = val.replace(/^\[|\]$/g, '').split(',').map(s => s.trim()).filter(Boolean);
    } else if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1); // strip only fully-wrapped quotes; keep quotes inside a scalar
    }
    obj[key] = val;
  }
  return { obj, body };
}

const files = walk(DESIGN).sort();
const modules = [];
const errors = [];
const warnings = [];
const ids = new Map(); // id -> file

for (const file of files) {
  const rel = relative(ROOT, file);
  const { obj, body, error } = parseFrontmatter(readFileSync(file, 'utf8'), file);
  if (error) { errors.push(`${rel}: ${error}`); continue; }
  for (const req of ['id', 'title', 'kind', 'tags', 'summary', 'use-when']) {
    if (!obj[req] || (Array.isArray(obj[req]) && obj[req].length === 0))
      errors.push(`${rel}: missing required frontmatter '${req}'`);
  }
  if (obj.id) {
    if (ids.has(obj.id)) errors.push(`${rel}: duplicate id '${obj.id}' (also ${relative(ROOT, ids.get(obj.id))})`);
    ids.set(obj.id, file);
    const pref = KIND_PREFIX[obj.kind];
    if (pref && !obj.id.startsWith(pref)) errors.push(`${rel}: id '${obj.id}' should start with '${pref}' for kind '${obj.kind}'`);
  }
  modules.push({ ...obj, file: rel, body });
}

// Cross-link validation: every referenced id must be defined.
const defined = new Set(modules.map(m => m.id));
for (const m of modules) {
  const refs = new Set();
  for (const id of m['composes-with'] || []) refs.add(id);
  for (const id of m['anchors'] || []) refs.add(id);
  // match bare [[id]] AND aliased [[id|text]] — validate the id in both forms.
  for (const mm of (m.body || '').matchAll(/\[\[([a-z0-9-]+)(?:\|[^\]]*)?\]\]/g)) refs.add(mm[1]);
  for (const id of refs) if (!defined.has(id)) errors.push(`${m.file}: dangling link -> [[${id}]]`);
}

// Coherence gate (structural half): a spine-first recipe must carry a Resonance
// table, and a Resonance table must declare a spine — a half-migrated design can't
// ship pretending to be coupled. The *quality* half (arrows real, no dissonance)
// is a judgment call for the agent + workshop; see design/00-process/the-spine.md.
const hasResonance = body => /^#{2,}\s+Resonance\b/m.test(body || '');
for (const m of modules) {
  if (m.kind !== 'recipe') continue;
  const spine = typeof m.spine === 'string' && m.spine.trim().length > 0;
  const table = hasResonance(m.body);
  if (spine && !table) errors.push(`${m.file}: declares 'spine' but has no '## Resonance' table (coherence gate — see process-the-spine)`);
  else if (table && !spine) errors.push(`${m.file}: has a '## Resonance' table but declares no 'spine' frontmatter (coherence gate)`);
  else if (!spine && !table) warnings.push(`${m.file}: legacy recipe — no spine/Resonance table; consider migrating via process-the-spine`);
}

modules.sort((a, b) => (KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind)) || String(a.id).localeCompare(String(b.id)));

// index.json — the machine-readable index.
const json = modules.map(({ body, ...m }) => m);
writeFileSync(join(DESIGN, 'index.json'), JSON.stringify(json, null, 2) + '\n');

// INDEX.md — the human/greppable index.
let md = `# Codex Index\n\n`;
md += `Generated by \`scripts/build-design-index.mjs\` from module frontmatter — do not hand-edit.\n`;
md += `${modules.length} modules. Search by keyword here, or \`grep -ri <term> design/\`.\n\n`;
for (const kind of KIND_ORDER) {
  const inKind = modules.filter(m => m.kind === kind);
  if (!inKind.length) continue;
  md += `## ${kind} — \`${SECTION[kind]}/\` (${inKind.length})\n\n`;
  md += `| id | title | tags | summary |\n|---|---|---|---|\n`;
  for (const m of inKind) {
    const link = `[${m.id}](${m.file.replace('design/', '')})`;
    const tags = (Array.isArray(m.tags) ? m.tags : [m.tags]).join(', ');
    md += `| ${link} | ${m.title} | ${tags} | ${m.summary} |\n`;
  }
  md += `\n`;
}
writeFileSync(join(DESIGN, 'INDEX.md'), md);

console.log(`Indexed ${modules.length} modules across ${new Set(modules.map(m => m.kind)).size} kinds.`);
if (warnings.length) {
  console.warn(`\n${warnings.length} warning(s) (non-blocking):`);
  for (const w of warnings) console.warn('  - ' + w);
}
if (errors.length) {
  console.error(`\n${errors.length} issue(s):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log('No frontmatter/link issues. Wrote design/index.json + design/INDEX.md.');
