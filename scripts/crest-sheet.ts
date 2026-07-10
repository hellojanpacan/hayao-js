// Render a sheet of sample arms to an HTML file for a visual eyeball.
//   npx tsx scripts/crest-sheet.ts [out.html]
import { writeFileSync } from 'node:fs';
import { crestSvg, readCrest } from '../src/art/crest';
import { REGALIA } from '../src/art/palette';

const HANDLES = [
  '@aldric', '@wren', '@juniper', '@bram', '@sable', '@cael',
  '@rowan', '@thorn', '@quill', '@fen', '@morrow', '@ash',
  '@vesper', '@larch', '@corvid', '@marlowe', '@onyx', '@perch',
];

const cards = HANDLES.map((h) => {
  const c = readCrest(h);
  return `<figure><div class="c">${crestSvg(h, { size: 132 })}</div>
    <figcaption>${h}<br><span>${c.field} · ${c.charge} · ${c.arrangement}</span></figcaption></figure>`;
}).join('\n');

const html = `<!doctype html><meta charset="utf-8"><title>Hayao — a roll of arms</title>
<style>
  body{margin:0;background:${REGALIA.paper};color:${REGALIA.ink};
    font:14px ui-sans-serif,system-ui,sans-serif;padding:40px}
  h1{font-weight:800;letter-spacing:.02em;margin:0 0 4px}
  p.sub{color:${REGALIA.soft};margin:0 0 32px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:28px}
  figure{margin:0;text-align:center}
  .c{background:${REGALIA.mist};border:1px solid ${REGALIA.line};border-radius:16px;
    padding:18px;display:flex;justify-content:center}
  figcaption{margin-top:10px;font-family:ui-monospace,monospace;color:${REGALIA.ink}}
  figcaption span{color:${REGALIA.muted};font-size:12px}
</style>
<h1>A roll of arms</h1>
<p class="sub">Each crest is a pure, deterministic function of the handle — Regalia hues, soft Bold-Duotone, no sharp edges.</p>
<div class="grid">${cards}</div>`;

const out = process.argv[2] ?? 'crest-sheet.html';
writeFileSync(out, html);
console.log(`wrote ${out} — ${HANDLES.length} arms`);
