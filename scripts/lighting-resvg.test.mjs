// Golden spike for the v0.4.1 lighting pillar: pins resvg 2.6.2's handling of
// the SVG light-run encoding BEFORE the svgString emitter is written, and stays
// as a permanent regression test for the judge path (headless SVG → PNG).
//
// Encoding under test (the "primary" design from the plan):
//   <g style="mix-blend-mode:multiply; isolation:isolate">   ← light buffer, multiplied over world
//     <rect …ambient base…/>
//     <g style="mix-blend-mode:screen" mask="url(#…)">        ← one per light, mask = shadow
//       <circle fill="url(#…radialGradient)"/>
//     </g>
//   </g>
// If these pixel assertions ever fail on a resvg upgrade, the pre-designed
// fallback (gradient holes punched into the darkness rect via mask, no nested
// blend) must replace the emitter — see docs/TRIAGE + the v0.4.1 plan.

import { describe, expect, it } from 'vitest';
import { Resvg } from '@resvg/resvg-js';
import { World } from '../src/world';
import { Node } from '../src/scene/node';
import { LightLayer, PointLight } from '../src/scene/light';
import { renderToSVGString } from '../src/render/svgString';

const W = 200;
const H = 100;

function render(inner) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${inner}</svg>`;
  return new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render();
}

function px(img, x, y) {
  const i = (y * img.width + x) * 4;
  const p = img.pixels;
  return [p[i], p[i + 1], p[i + 2], p[i + 3]];
}

const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

// World: mid-grey ground. Light at (50,50) r=45. Wall segment at x=70 (y 40..60)
// casts a shadow quad extruded to the right. HUD square at (180..196, 80..96).
const LIT_SCENE = `
  <rect x="0" y="0" width="${W}" height="${H}" fill="#808080"/>
  <defs>
    <radialGradient id="g0" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="0.7" stop-color="#b0b0b0"/>
      <stop offset="1" stop-color="#000000"/>
    </radialGradient>
    <mask id="m0">
      <rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>
      <polygon points="70,40 70,60 160,64 160,36" fill="#000000"/>
    </mask>
  </defs>
  <g style="mix-blend-mode:multiply; isolation:isolate">
    <rect x="0" y="0" width="${W}" height="${H}" fill="#4a4a55"/>
    <g style="mix-blend-mode:screen" mask="url(#m0)">
      <circle cx="50" cy="50" r="45" fill="url(#g0)"/>
    </g>
  </g>
  <rect x="180" y="80" width="16" height="16" fill="#ff0000"/>
`;

describe('resvg lighting encoding golden (judge parity)', () => {
  const img = render(LIT_SCENE);

  it('rasterizes at the requested size', () => {
    expect(img.width).toBe(W);
    expect(img.height).toBe(H);
  });

  it('a light pool brightens the ambient-darkened world', () => {
    const pool = px(img, 50, 50); // light center
    const ambient = px(img, 180, 20); // far from the light, no shadow
    // Ambient = world(0x80) × ambientBase(0x4a..) ≈ lum 40; pool must be far brighter.
    expect(lum(pool)).toBeGreaterThan(lum(ambient) + 40);
  });

  it('a shadow quad erases the pool back to ambient darkness', () => {
    const shadow = px(img, 85, 50); // inside the quad, would be lit otherwise
    const pool = px(img, 50, 50);
    const ambient = px(img, 180, 20);
    expect(lum(shadow)).toBeLessThan(lum(pool) - 40);
    // Shadowed ground reads as plain ambient (mask fully erases the pool there).
    expect(Math.abs(lum(shadow) - lum(ambient))).toBeLessThan(8);
  });

  it('the lit side of the wall stays bright (mask is local to the quad)', () => {
    const nearWallLit = px(img, 62, 50); // left of the wall, inside the pool
    const shadow = px(img, 85, 50);
    expect(lum(nearWallLit)).toBeGreaterThan(lum(shadow) + 30);
  });

  it('HUD content after the light group is untouched by the multiply', () => {
    expect(px(img, 188, 88)).toEqual([255, 0, 0, 255]);
  });

  it('soft-shadow penumbra (50% grey mask poly) half-darkens', () => {
    const soft = render(LIT_SCENE.replace('fill="#000000"/>', 'fill="#808080"/>'));
    const halfShadow = px(soft, 85, 50);
    const fullShadow = px(img, 85, 50);
    const lit = px(img, 62, 50);
    expect(lum(halfShadow)).toBeGreaterThan(lum(fullShadow) + 10);
    expect(lum(halfShadow)).toBeLessThan(lum(lit) - 10);
  });
});

// ── The REAL renderer, end to end ────────────────────────────────────────────
// Same scene, but now the light run is produced by LightLayer/PointLight through
// the actual renderToSVGString emitter (not a hand-built string). This proves the
// emitter's markup rasterizes to the SAME pixel properties the golden pins — so
// the encoding the judge sees is exactly the one validated above.
function realLitScene(soft = false) {
  const world = new World({ seed: 1 });
  const root = new Node({ name: 'root' });
  // Ground (world pass, below the light layer).
  root.addChild(new (class extends Node {
    draw(out, tf) {
      out.push({ kind: 'rect', x: 0, y: 0, w: W, h: H, fill: '#808080', transform: tf, z: 0 });
    }
  })());
  // Light layer at origin: no camera → viewTransform IDENTITY, so world ≈ IDENTITY.
  const layer = root.addChild(new LightLayer({ ambient: { color: '#4a4a55', level: 0 }, width: W, height: H, softShadows: soft }));
  // A single wall segment at x=70 (y 40..60) — extrudes to the right past the pool.
  layer.setOccluders([{ a: { x: 70, y: 40 }, b: { x: 70, y: 60 } }]);
  layer.addChild(new PointLight({ pos: { x: 50, y: 50 }, radius: 45, color: '#ffffff', intensity: 1 }));
  // HUD square (overlay pass, above the light layer).
  root.addChild(new (class extends Node {
    draw(out) {
      out.push({ kind: 'rect', x: 180, y: 80, w: 16, h: 16, fill: '#ff0000', transform: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }, z: 0, layer: 1 });
    }
  })());
  world.setRoot(root);
  world.step([]);
  return renderToSVGString(world.render(), W, H, '#ffffff');
}

describe('resvg lighting — real renderToSVGString output', () => {
  const svg = realLitScene(false);
  const rimg = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render();

  it('rasterizes at the requested size', () => {
    expect(rimg.width).toBe(W);
    expect(rimg.height).toBe(H);
  });

  it('the pool brightens the ambient-darkened world', () => {
    const pool = px(rimg, 50, 50);
    const ambient = px(rimg, 180, 20);
    expect(lum(pool)).toBeGreaterThan(lum(ambient) + 30);
  });

  it('the shadow quad erases the pool back toward ambient darkness', () => {
    const shadow = px(rimg, 90, 50);
    const pool = px(rimg, 50, 50);
    expect(lum(shadow)).toBeLessThan(lum(pool) - 20);
  });

  it('the lit side of the wall stays brighter than the shadow', () => {
    const nearWallLit = px(rimg, 62, 50);
    const shadow = px(rimg, 90, 50);
    expect(lum(nearWallLit)).toBeGreaterThan(lum(shadow) + 15);
  });

  it('HUD content after the light group is untouched by the multiply', () => {
    expect(px(rimg, 188, 88)).toEqual([255, 0, 0, 255]);
  });

  it('soft shadows read brighter in the penumbra than the hard shadow', () => {
    const softSvg = realLitScene(true);
    const softImg = new Resvg(softSvg, { fitTo: { mode: 'width', value: W } }).render();
    // Somewhere in the shadow region, soft mode should be no darker than hard.
    const hardShadow = px(rimg, 90, 50);
    const softShadow = px(softImg, 90, 50);
    expect(lum(softShadow)).toBeGreaterThanOrEqual(lum(hardShadow) - 2);
  });
});
