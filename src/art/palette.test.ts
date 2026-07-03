import { describe, it, expect } from 'vitest';
import { Rng } from '../core/rng';
import { hsl, hsv, hexToHsl, mutateColor, mix, mixLinear, sampleGradient, gradient } from './palette';

describe('HSL / HSV constructors', () => {
  it('hits known primaries', () => {
    expect(hsl(0, 1, 0.5)).toBe('#ff0000');
    expect(hsl(120, 1, 0.5)).toBe('#00ff00');
    expect(hsl(240, 1, 0.5)).toBe('#0000ff');
    expect(hsl(0, 0, 0.5)).toBe('#808080'); // desaturated → gray
    expect(hsv(0, 0, 1)).toBe('#ffffff');
    expect(hsv(0, 1, 1)).toBe('#ff0000');
    expect(hsv(120, 1, 1)).toBe('#00ff00');
  });

  it('hue wraps and s/l clamp', () => {
    expect(hsl(360, 1, 0.5)).toBe(hsl(0, 1, 0.5));
    expect(hsl(-120, 1, 0.5)).toBe(hsl(240, 1, 0.5));
    expect(hsl(0, 5, 0.5)).toBe(hsl(0, 1, 0.5));
  });

  it('hexToHsl round-trips through hsl()', () => {
    for (const hex of ['#a11d3a', '#5a7d4e', '#3f7d8c', '#e8b64a']) {
      const c = hexToHsl(hex);
      expect(hsl(c.h, c.s, c.l)).toBe(hex);
    }
  });
});

describe('mutateColor (drift via world.rng)', () => {
  it('is deterministic for a given rng stream', () => {
    const a = mutateColor(new Rng(4), '#a11d3a', { hue: 20, light: 0.1 });
    const b = mutateColor(new Rng(4), '#a11d3a', { hue: 20, light: 0.1 });
    expect(a).toBe(b);
  });

  it('zero drift returns the same color', () => {
    expect(mutateColor(new Rng(1), '#5a7d4e', {})).toBe('#5a7d4e');
  });

  it('nonzero drift usually changes the color', () => {
    const drifted = mutateColor(new Rng(7), '#5a7d4e', { hue: 40, sat: 0.2, light: 0.2 });
    expect(drifted).not.toBe('#5a7d4e');
  });
});

describe('gamma-correct interpolation + gradients', () => {
  it('mixLinear endpoints are exact', () => {
    expect(mixLinear('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mixLinear('#000000', '#ffffff', 1)).toBe('#ffffff');
  });

  it('linear midpoint is lighter than naive sRGB midpoint', () => {
    // The classic gamma demo: 50% black↔white in linear light ≈ #bbbbbb,
    // well above the naive sRGB #808080.
    const lin = parseInt(mixLinear('#000000', '#ffffff', 0.5).slice(1, 3), 16);
    const srgb = parseInt(mix('#000000', '#ffffff', 0.5).slice(1, 3), 16);
    expect(lin).toBeGreaterThan(srgb);
    expect(lin).toBeGreaterThan(180);
  });

  it('sampleGradient clamps and hits stops', () => {
    const stops = ['#000000', '#ff0000', '#ffffff'];
    expect(sampleGradient(stops, 0)).toBe('#000000');
    expect(sampleGradient(stops, 1)).toBe('#ffffff');
    expect(sampleGradient(stops, -1)).toBe('#000000');
    expect(sampleGradient(stops, 0.5)).toBe('#ff0000'); // exact middle stop
    expect(sampleGradient(['#123456'], 0.7)).toBe('#123456'); // single stop
  });

  it('gradient materializes an n-color ramp with correct endpoints', () => {
    const ramp = gradient(['#000000', '#ffffff'], 5);
    expect(ramp.length).toBe(5);
    expect(ramp[0]).toBe('#000000');
    expect(ramp[4]).toBe('#ffffff');
  });
});
