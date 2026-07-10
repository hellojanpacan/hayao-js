import { describe, it, expect } from 'vitest';
import { readCrest, crestSvg } from './crest';

describe('crest', () => {
  it('is a pure function of the handle', () => {
    expect(crestSvg('@aldric')).toBe(crestSvg('@aldric'));
    expect(readCrest('@aldric')).toEqual(readCrest('@aldric'));
  });

  it('draws the same arms regardless of case/spacing (only the label differs)', () => {
    const { handle: _a, ...armsA } = readCrest('@Aldric');
    const { handle: _b, ...armsB } = readCrest('  @aldric ');
    expect(armsA).toEqual(armsB);
  });

  it('gives different handles different arms', () => {
    const handles = ['@aldric', '@wren', '@juniper', '@bram', '@sable', '@cael'];
    const svgs = new Set(handles.map((h) => crestSvg(h)));
    expect(svgs.size).toBe(handles.length);
  });

  it('never picks the same hue for field and accent', () => {
    for (const h of ['@a', '@bb', '@ccc', '@dddd', '@rowan', '@thorn', '@quill', '@fen']) {
      const c = readCrest(h);
      expect(c.field).not.toBe(c.accent);
    }
  });

  it('emits a self-contained, titled SVG', () => {
    const svg = crestSvg('@wren');
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('<title>Arms of @wren</title>');
    expect(svg).toContain('role="img"');
  });
});
