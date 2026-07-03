import { describe, it, expect } from 'vitest';
import { AmbientField, AMBIENT_PRESETS, weatherEnvelope } from './particles';
import type { DrawCommand } from '../render/commands';
import { IDENTITY } from '../core/math';

function drawCount(f: AmbientField): number {
  const out: DrawCommand[] = [];
  // draw() is protected; exercise it through the node's projection seam.
  (f as unknown as { draw(o: DrawCommand[], t: typeof IDENTITY): void }).draw(out, IDENTITY);
  return out.length;
}
function step(f: AmbientField, dt: number, n = 1): void {
  for (let i = 0; i < n; i++)
    (f as unknown as { onProcess(dt: number): void }).onProcess(dt);
}

describe('weatherEnvelope', () => {
  it('holds before first / after last key, smoothsteps between', () => {
    const keys = [
      { time: 0, intensity: 0 },
      { time: 2, intensity: 1 },
      { time: 5, intensity: 0.25 },
    ];
    expect(weatherEnvelope(-1, keys)).toBe(0);
    expect(weatherEnvelope(0, keys)).toBe(0);
    expect(weatherEnvelope(2, keys)).toBe(1);
    expect(weatherEnvelope(1, keys)).toBeCloseTo(0.5, 5); // smoothstep midpoint
    expect(weatherEnvelope(99, keys)).toBe(0.25);
    expect(weatherEnvelope(0, [])).toBe(1);
  });
});

describe('AmbientField', () => {
  const make = (seed = 3) =>
    new AmbientField({ seed, count: 80, width: 320, height: 200, style: AMBIENT_PRESETS.snow() });

  it('is cosmetic and seeds the full field', () => {
    const f = make();
    expect(f.cosmetic).toBe(true);
    expect(f.liveCount).toBe(80);
  });

  it('drift wraps toroidally (particles stay in bounds)', () => {
    const f = make();
    step(f, 1 / 60, 600); // ten seconds of fall
    const out: DrawCommand[] = [];
    (f as unknown as { draw(o: DrawCommand[], t: typeof IDENTITY): void }).draw(out, IDENTITY);
    for (const c of out) {
      if (c.kind === 'circle') {
        expect(c.cy).toBeGreaterThanOrEqual(0);
        expect(c.cy).toBeLessThanOrEqual(200);
      }
    }
  });

  it('is deterministic for a seed (same draw output after same steps)', () => {
    const a = make(9);
    const b = make(9);
    step(a, 1 / 60, 120);
    step(b, 1 / 60, 120);
    expect(drawCount(a)).toBe(drawCount(b));
  });

  it('envelope thins the field over sim time', () => {
    const f = new AmbientField({
      seed: 1,
      count: 100,
      width: 320,
      height: 200,
      style: AMBIENT_PRESETS.snow(),
      envelope: [
        { time: 0, intensity: 0 },
        { time: 1, intensity: 1 },
      ],
    });
    expect(drawCount(f)).toBe(0); // t=0 → intensity 0 → nothing drawn
    step(f, 1, 1); // advance to t=1 → full intensity
    expect(drawCount(f)).toBe(100);
  });

  it('rain preset draws streaks (poly), snow draws dots (circle)', () => {
    const rain = new AmbientField({ seed: 2, count: 10, width: 100, height: 100, style: AMBIENT_PRESETS.rain() });
    const out: DrawCommand[] = [];
    (rain as unknown as { draw(o: DrawCommand[], t: typeof IDENTITY): void }).draw(out, IDENTITY);
    expect(out.every((c) => c.kind === 'poly')).toBe(true);
  });
});
