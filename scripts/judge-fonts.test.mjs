import { describe, expect, it } from 'vitest';
import { pickFonts, judgeFontOption } from './judge-fonts.mjs';

const SERIFS = [
  { path: '/a/Georgia.ttf', family: 'Georgia' },
  { path: '/b/DejaVuSerif.ttf', family: 'DejaVu Serif' },
];
const SYMBOLS = ['/a/Symbols.ttf', '/b/DejaVuSans.ttf'];

describe('pickFonts', () => {
  it('picks the first available serif as the default family + all available symbols', () => {
    const exists = (p) => p !== '/a/Georgia.ttf'; // Georgia missing → falls to DejaVu
    const r = pickFonts(SERIFS, SYMBOLS, exists);
    expect(r.family).toBe('DejaVu Serif');
    expect(r.fontFiles[0]).toBe('/b/DejaVuSerif.ttf');
    expect(r.fontFiles).toContain('/b/DejaVuSans.ttf');
    expect(r.fontFiles).not.toContain('/a/Georgia.ttf');
  });

  it('prefers the earliest serif when several exist', () => {
    const r = pickFonts(SERIFS, SYMBOLS, () => true);
    expect(r.family).toBe('Georgia');
    expect(r.fontFiles).toEqual(['/a/Georgia.ttf', '/a/Symbols.ttf', '/b/DejaVuSans.ttf']);
  });

  it('returns null when no serif is available (→ system-font fallback)', () => {
    expect(pickFonts(SERIFS, SYMBOLS, () => false)).toBeNull();
  });
});

describe('judgeFontOption', () => {
  it('turns system fonts OFF and pins a default family when a serif is found', () => {
    // On the dev/CI machine a serif is expected; assert the shape, not a specific path.
    const opt = judgeFontOption();
    if (opt.fontFiles) {
      expect(opt.loadSystemFonts).toBe(false);
      expect(opt.defaultFontFamily).toBeTruthy();
      expect(opt.serifFamily).toBe(opt.defaultFontFamily);
      expect(opt.fontFiles.length).toBeGreaterThan(0);
    } else {
      expect(opt.loadSystemFonts).toBe(true); // graceful fallback
    }
  });
});
