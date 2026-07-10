import { describe, it, expect } from 'vitest';
import { makeSplash, MARK_CROWN, MARK_RULE, mixHex } from './splash';
import type { GameDefinition } from './game';

// The boot cover must show the exact site-nav logo (crown mark + "Hayao.js"
// wordmark) and animate: fade/rise in, hold, then dissolve to the game ground.
// These lock the commands so a refactor can't quietly drop the logo or the fade.
const def = { title: 'demo', background: '#102030' } as unknown as GameDefinition;
const TOTAL = 900;

describe('boot splash', () => {
  const frame = makeSplash({}, def, 1280, 720);

  it('draws the Hayao logo: crown + rule mark and a two-tone wordmark', () => {
    const cmds = frame(TOTAL / 2, TOTAL); // mid-hold: everything fully visible
    const kinds = cmds.map((c) => c.kind);
    expect(kinds).toEqual(['rect', 'path', 'path', 'text', 'text']);

    const [, crown, rule, hayao, js] = cmds as [unknown, { d: string; fill: string }, { d: string; fill: string }, { text: string; fill: string }, { text: string; fill: string }];
    // the exact mark paths from web/src/components/Logo.astro, in brand colours
    expect(crown.d).toBe(MARK_CROWN);
    expect(crown.fill).toBe('#e59500'); // amber crown
    expect(rule.d).toBe(MARK_RULE);
    expect(rule.fill).toBe('#29335c'); // navy rule
    // wordmark, ".js" muted just like the nav
    expect(hayao.text).toBe('Hayao');
    expect(hayao.fill).toBe('#29335c');
    expect(js.text).toBe('.js');
    expect(js.fill).toBe('#8b90a6');
  });

  it('fades the logo in, holds, then out', () => {
    const op = (cmds: ReturnType<typeof frame>) => (cmds[1] as { opacity?: number }).opacity ?? 1;
    expect(op(frame(0, TOTAL))).toBe(0); //     start: invisible
    expect(op(frame(TOTAL / 2, TOTAL))).toBe(1); // hold: full
    expect(op(frame(TOTAL, TOTAL))).toBe(0); //   end: faded out
  });

  it('dissolves the ground toward the game background', () => {
    const bg = (cmds: ReturnType<typeof frame>) => (cmds[0] as { fill: string }).fill;
    expect(bg(frame(0, TOTAL))).toBe('#f4f6fb'); //      the light Regalia ground
    expect(bg(frame(TOTAL, TOTAL))).toBe('#102030'); //  fully dissolved to the game bg
  });

  it('centres the mark+wordmark lockup horizontally', () => {
    const cmds = frame(TOTAL / 2, TOTAL);
    const crownT = (cmds[1] as { transform: { a: number; e: number } }).transform;
    const js = cmds[4] as { x: number };
    // the mark sits left of centre, the wordmark's tail right of it — a real lockup
    expect(crownT.a).toBeGreaterThan(0); // positive scale
    const markLeft = crownT.e + 2 * crownT.a; // local (2,2) is the box origin
    expect(markLeft).toBeLessThan(640); // mark starts left of pane centre
    expect(js.x).toBeGreaterThan(640); // ".js" ends right of pane centre
  });
});

describe('mixHex', () => {
  it('interpolates endpoints exactly', () => {
    expect(mixHex('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mixHex('#000000', '#ffffff', 1)).toBe('#ffffff');
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080');
  });
});
