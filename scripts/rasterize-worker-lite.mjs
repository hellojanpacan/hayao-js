// Lite rasterize worker shipped in the npm package (dist/): SVG file → PNG in
// an isolated process, no repo-only helpers (no sanitize pass, system fonts).
// @resvg/resvg-js resolves from the CONSUMER's node_modules — install it as a
// devDependency to enable inspect_moment PNGs; without it this exits non-zero
// and the MCP server degrades to probe + hash.
//   node rasterize-worker-lite.mjs <in.svg> <width> <out.png>
import { readFileSync, writeFileSync } from 'node:fs';

const [, , svgPath, width, outPath] = process.argv;
const { Resvg } = await import('@resvg/resvg-js');
const svg = readFileSync(svgPath, 'utf8');
const png = new Resvg(svg, { fitTo: { mode: 'width', value: Number(width) }, font: { loadSystemFonts: true } }).render().asPng();
writeFileSync(outPath, png);
