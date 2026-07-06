import { describe, it, expect, vi, beforeEach } from 'vitest';
import { specFromZzfx, resetZzfxWarnings } from './zzfx';
import { renderSound, type SoundSpec } from './synth';
import { signalHash } from './pcm';

// Real presets from the ZzFX sound designer (holes take ZzFX defaults).
const PICKUP: (number | undefined)[] = [, , 1675, , 0.06, 0.24, 1, 1.82, , , 837, 0.06];
const EXPLOSION: (number | undefined)[] = [, , 333, 0.01, 0, 0.9, 4, 1.9, , , , , , 0.5, , 0.6];

describe('specFromZzfx', () => {
  beforeEach(() => resetZzfxWarnings());

  it('converts the classic pickup: wave, freq, envelope, Hz pitchJump → semitones', () => {
    const spec = specFromZzfx(PICKUP);
    expect(spec.wave).toBe('triangle'); // shape 1
    expect(spec.freq).toBe(1675);
    expect(spec.attack).toBe(0);
    expect(spec.sustain).toBe(0.06);
    expect(spec.release).toBe(0.24);
    expect(spec.shapeCurve).toBe(1.82);
    // pitchJump is an absolute Hz addend in ZzFX: 1675 → 2512 Hz.
    expect(spec.pitchJump).toBeCloseTo(12 * Math.log2((1675 + 837) / 1675), 3);
    expect(spec.pitchJumpTime).toBe(0.06);
    expect(spec.slide).toBeUndefined();
  });

  it('converts the classic explosion: noise wave, noise blend, bitCrush ×100', () => {
    const spec = specFromZzfx(EXPLOSION);
    expect(spec.wave).toBe('noise'); // shape 4
    expect(spec.freq).toBe(333);
    expect(spec.attack).toBe(0.01);
    expect(spec.release).toBe(0.9);
    expect(spec.noise).toBe(0.5);
    expect(spec.bitCrush).toBe(60); // ZzFX holds every bitCrush×100 samples
  });

  it('scales slide by body duration and deltaSlide by body²/2', () => {
    // body = attack + decay + sustain + release = 0.1 + 0 + 0.2 + 0.3 = 0.6
    const spec = specFromZzfx([1, 0, 440, 0.1, 0.2, 0.3, 0, 1, 5, 10]);
    expect(spec.slide).toBeCloseTo(5 * 0.6, 9);
    expect(spec.slideAccel).toBeCloseTo((10 * 0.6 * 0.6) / 2, 9);
  });

  it('maps the signed filter knob: positive → lowpass Hz, negative → highpass Hz', () => {
    const lp = specFromZzfx([1, 0, 220, , , , , , , , , , , , , , , , , , 800]);
    expect(lp.lowpass).toBe(800);
    expect(lp.highpass).toBeUndefined();
    const hp = specFromZzfx([1, 0, 220, , , , , , , , , , , , , , , , , , -300]);
    expect(hp.highpass).toBe(300);
    expect(hp.lowpass).toBeUndefined();
  });

  it('maps sustainVolume, decay, tremolo, delay and repeatTime', () => {
    const spec = specFromZzfx([0.8, 0, 220, 0.01, 0.1, 0.2, 2, 1, , , , , 0.05, , , , 0.15, 0.6, 0.07, 0.3]);
    expect(spec.wave).toBe('saw');
    expect(spec.volume).toBe(0.8);
    expect(spec.decay).toBe(0.07);
    expect(spec.sustainLevel).toBe(0.6);
    expect(spec.tremolo).toBe(0.3);
    expect(spec.delay).toBe(0.15);
    expect(spec.repeat).toBe(0.05);
  });

  it('drops randomness (deterministic specs) with a once-per-parameter warn', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      specFromZzfx([1, 0.3, 220]);
      specFromZzfx([1, 0.3, 440]); // second call: no second warn
      const randomnessWarns = warn.mock.calls.filter((c) => String(c[0]).includes('randomness'));
      expect(randomnessWarns).toHaveLength(1);
    } finally {
      warn.mockRestore();
    }
  });

  it('approximates modulation as vibrato at |modulation| Hz, with a warn', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const spec = specFromZzfx([1, 0, 220, , 0.1, , , , , , , , , , -12]);
      expect(spec.vibratoFreq).toBe(12);
      expect(spec.vibrato).toBeGreaterThan(0);
      expect(warn.mock.calls.some((c) => String(c[0]).includes('modulation'))).toBe(true);
    } finally {
      warn.mockRestore();
    }
  });

  it('converted specs render to finite PCM', () => {
    for (const preset of [PICKUP, EXPLOSION]) {
      const sig = renderSound(specFromZzfx(preset));
      expect(sig.length).toBeGreaterThan(0);
      for (let i = 0; i < sig.length; i++) {
        expect(Number.isFinite(sig[i])).toBe(true);
      }
    }
  });
});

describe('SoundSpec repeat (ZzFX repeatTime)', () => {
  const base: SoundSpec = { freq: 880, wave: 'square', slide: -24, attack: 0.01, sustain: 0.2, release: 0.05 };

  it('changes the output when set', () => {
    const plain = signalHash(renderSound(base));
    const repeated = signalHash(renderSound({ ...base, repeat: 0.05 }));
    expect(repeated).not.toBe(plain);
  });

  it('is bit-identical when absent or 0 (golden-adjacent: the flag-off path is unchanged)', () => {
    const plain = signalHash(renderSound(base));
    expect(signalHash(renderSound({ ...base, repeat: undefined }))).toBe(plain);
    expect(signalHash(renderSound({ ...base, repeat: 0 }))).toBe(plain);
  });

  it('also re-fires pitchJump each period', () => {
    const jump: SoundSpec = { freq: 440, sustain: 0.3, release: 0.05, pitchJump: 7, pitchJumpTime: 0.04 };
    const once = signalHash(renderSound(jump));
    const trill = signalHash(renderSound({ ...jump, repeat: 0.08 }));
    expect(trill).not.toBe(once);
  });
});
