import { describe, it, expect } from 'vitest';
import { readCrest, crestSvg, canonicalHandle, blazon } from './crest';

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

  it('locks the handle to a single leading @', () => {
    expect(canonicalHandle('wren')).toBe('@wren');
    expect(canonicalHandle('@Wren')).toBe('@wren');
    expect(canonicalHandle('  @@wren ')).toBe('@wren');
    // the bare and @-prefixed forms now blazon identical arms and title
    expect(crestSvg('wren')).toBe(crestSvg('@wren'));
    expect(readCrest('hellojanpacan').handle).toBe('@hellojanpacan');
  });

  it('keeps collisions negligible across a corpus (grammar validation)', () => {
    const seen = new Set<string>();
    let n = 0;
    for (const stem of ['wren', 'aldric', 'juniper', 'bram', 'sable', 'cael', 'rowan', 'thorn', 'quill', 'fen', 'morrow', 'ash', 'vesper', 'larch', 'corvid', 'marlowe', 'onyx', 'perch', 'ember', 'flint', 'harlow', 'iris', 'jetty', 'kestrel', 'lumen', 'mica', 'nyx', 'opal', 'pike', 'quince', 'rook', 'slate', 'tansy', 'umber', 'vale', 'wisp', 'yarrow', 'zephyr', 'bracken', 'cinder']) {
      seen.add(blazon(readCrest('@' + stem)));
      n++;
    }
    expect(seen.size).toBe(n); // zero collisions across 40 distinct handles
  });

  it("draws representational charges single (a fox ×3 is mush)", () => {
    const beasts = new Set(["tower", "key", "oak", "acorn", "bell", "anchor", "fish", "owl", "mountain", "crown"]);
    let sawOne = false;
    for (let i = 0; i < 400; i++) {
      const c = readCrest("@t" + i);
      if (beasts.has(c.charge)) {
        sawOne = true;
        expect(c.arrangement).toBe("single");
        expect(c.points).toBe(0);
      }
    }
    expect(sawOne).toBe(true); // the corpus actually exercises the bestiary
  });
});
