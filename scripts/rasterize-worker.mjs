// Isolated rasterize worker: SVG file → PNG file, in its OWN process.
// @resvg/resvg-js is a native addon that can *panic* (SIGABRT, uncatchable from
// JS) on a handful of pathological SVGs. Running it here means such a panic kills
// only this child — the judge harness sees a non-zero exit and moves on. Usage:
//   node scripts/rasterize-worker.mjs <in.svg> <width> <out.png>
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';

const [, , svgPath, width, outPath] = process.argv;
const svg = readFileSync(svgPath, 'utf8');
const png = new Resvg(svg, { fitTo: { mode: 'width', value: Number(width) }, font: { loadSystemFonts: true } }).render().asPng();
writeFileSync(outPath, png);
