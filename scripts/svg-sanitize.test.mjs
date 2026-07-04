import { describe, expect, it } from 'vitest';
import { cullOffCanvasLayers } from './svg-sanitize.mjs';

const wrap = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720"><rect width="1280" height="720" fill="#eee"/>${inner}</svg>`;

describe('cullOffCanvasLayers — resvg off-canvas-layer panic guard', () => {
  it('culls a translucent circle fully off-canvas (the lanternway trigger)', () => {
    const r = cullOffCanvasLayers(wrap('<circle cx="0" cy="0" r="80" transform="matrix(1 0 0 1 2980 1600)" fill="none" stroke="#d9583c" stroke-width="4" opacity="0.7"/>'));
    expect(r.culled).toBe(1);
    expect(r.svg).not.toContain('r="80"');
  });

  it('culls a filtered element fully off-canvas (the driftlight trigger)', () => {
    const r = cullOffCanvasLayers(wrap('<circle cx="0" cy="0" r="7" transform="matrix(1 0 0 1 5220 410)" fill="url(#g)" filter="url(#s)"/>'));
    expect(r.culled).toBe(1);
  });

  it('culls a translucent PATH off-canvas vertically (needs a real bbox, not a square hull)', () => {
    // x≈418 (on-canvas), y≈1520 (off the bottom) — a square hull would wrongly keep it.
    const r = cullOffCanvasLayers(wrap('<path d="M 418 1534 C 417 1528, 416 1520, 415 1513" transform="matrix(1 0 0 1 0 0)" fill="none" stroke="#4b7c3b" stroke-width="2.5" opacity="0.9"/>'));
    expect(r.culled).toBe(1);
  });

  it('KEEPS an on-canvas translucent element', () => {
    const r = cullOffCanvasLayers(wrap('<circle cx="640" cy="360" r="80" fill="none" stroke="#d9583c" stroke-width="4" opacity="0.7"/>'));
    expect(r.culled).toBe(0);
    expect(r.svg).toContain('cx="640"');
  });

  it('KEEPS a partially-on-canvas translucent element', () => {
    const r = cullOffCanvasLayers(wrap('<circle cx="1270" cy="710" r="80" fill="none" stroke="#d9583c" stroke-width="4" opacity="0.7"/>'));
    expect(r.culled).toBe(0);
  });

  it('KEEPS an OPAQUE off-canvas element (no isolation layer → no panic → lossless to keep)', () => {
    const r = cullOffCanvasLayers(wrap('<circle cx="0" cy="0" r="80" transform="matrix(1 0 0 1 2980 1600)" fill="#111"/>'));
    expect(r.culled).toBe(0);
  });

  it('KEEPS a filtered element only just off-canvas (its blur may still reach the frame)', () => {
    const r = cullOffCanvasLayers(wrap('<circle cx="1340" cy="360" r="7" fill="#111" filter="url(#s)"/>')); // 60px off, < FILTER_PAD
    expect(r.culled).toBe(0);
  });
});
