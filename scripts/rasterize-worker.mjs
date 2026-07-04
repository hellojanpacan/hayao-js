// Isolated rasterize worker: SVG file → PNG file, in its OWN process.
// It SANITIZES the SVG (svg-sanitize.mjs) to dodge a known resvg 2.6.2 panic on
// off-canvas layered elements — lossless, since those draw nothing — and feeds a
// controlled font set (judge-fonts.mjs) so text renders TRUE instead of tofu. The
// isolation remains as the backstop: any OTHER pathological SVG that panics
// (SIGABRT, uncatchable from JS) kills only this child, and the judge harness sees
// a non-zero exit and moves on. Usage:
//   node scripts/rasterize-worker.mjs <in.svg> <width> <out.png>
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { cullOffCanvasLayers } from './svg-sanitize.mjs';
import { judgeFontOption } from './judge-fonts.mjs';

const [, , svgPath, width, outPath] = process.argv;
const { svg } = cullOffCanvasLayers(readFileSync(svgPath, 'utf8'));
const png = new Resvg(svg, { fitTo: { mode: 'width', value: Number(width) }, font: judgeFontOption() }).render().asPng();
writeFileSync(outPath, png);
