import { describe, expect, it } from 'vitest';
import { Particles, type ParticleStyle } from './particles';
import type { DrawCommand } from '../render/commands';
import { IDENTITY } from '../core/math';

// Continuous emission: emit(rate) drips particles through the same private-Rng
// burst path — deterministic per seed, fractional rates accumulate, stopEmit halts.

// Long lives so nothing expires while we count spawns.
const style = (over: Partial<ParticleStyle> = {}): ParticleStyle => ({
  colors: ['#fff', '#ccc'],
  sizeMin: 1,
  sizeMax: 2,
  speedMin: 10,
  speedMax: 20,
  lifeMin: 100,
  lifeMax: 100,
  ...over,
});

function step(p: Particles, dt: number, n = 1): void {
  for (let i = 0; i < n; i++) (p as unknown as { onProcess(dt: number): void }).onProcess(dt);
}
function drawOut(p: Particles): DrawCommand[] {
  const out: DrawCommand[] = [];
  (p as unknown as { draw(o: DrawCommand[], t: typeof IDENTITY): void }).draw(out, IDENTITY);
  return out;
}

describe('Particles.emit', () => {
  it('spawns rate × time particles over N steps', () => {
    const p = new Particles({ seed: 5 });
    p.emit(50, style());
    step(p, 0.1, 10); // 1 second at 50/s
    expect(p.liveCount).toBe(50);
  });

  it('accumulates fractional spawns (rate below one per step)', () => {
    const p = new Particles({ seed: 5 });
    p.emit(5, style()); // 0.5 per 0.1s step
    step(p, 0.1, 1);
    expect(p.liveCount).toBe(0); // accumulator at 0.5 — nothing whole yet
    step(p, 0.1, 1);
    expect(p.liveCount).toBe(1);
    step(p, 0.1, 18); // 2 seconds total → 10 particles
    expect(p.liveCount).toBe(10);
  });

  it('is deterministic across two identically-seeded runs', () => {
    const make = (): Particles => {
      const p = new Particles({ seed: 42 });
      p.emit(30, style({ gravity: 200, drag: 1 }));
      step(p, 1 / 60, 90);
      return p;
    };
    const a = drawOut(make());
    const b = drawOut(make());
    expect(a.length).toBeGreaterThan(0);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('emits from the node-local `at` origin (default 0,0)', () => {
    const still = style({ speedMin: 0, speedMax: 0, gravity: 0 });
    const at = new Particles({ seed: 1 });
    at.emit(10, { ...still, at: { x: 5, y: -3 } });
    step(at, 0.1, 4);
    for (const c of drawOut(at)) {
      expect(c.kind).toBe('circle');
      if (c.kind === 'circle') {
        expect(c.cx).toBe(5);
        expect(c.cy).toBe(-3);
      }
    }
    const origin = new Particles({ seed: 1 });
    origin.emit(10, still);
    step(origin, 0.1, 4);
    for (const c of drawOut(origin)) {
      if (c.kind === 'circle') {
        expect(c.cx).toBe(0);
        expect(c.cy).toBe(0);
      }
    }
  });

  it('stopEmit halts spawning (live particles keep their lives)', () => {
    const p = new Particles({ seed: 7 });
    p.emit(50, style());
    step(p, 0.1, 10);
    expect(p.liveCount).toBe(50);
    p.stopEmit();
    step(p, 0.1, 20);
    expect(p.liveCount).toBe(50); // long lives: nothing expired, nothing added
  });

  it('stays cosmetic and coexists with burst()', () => {
    const p = new Particles({ seed: 3 });
    expect(p.cosmetic).toBe(true);
    p.emit(10, style());
    p.burst(4, { x: 0, y: 0 }, style());
    step(p, 0.1, 10);
    expect(p.liveCount).toBe(14);
  });
});
