import { describe, it, expect } from 'vitest';
import { makeSplash, MARK_CROWN, MARK_RULE, WORD_HAYAO, WORD_JS, mixHex } from './splash';
import type { GameDefinition } from './game';

// The boot cover must show the exact canonical logo — the crown mark plus the
// OUTLINED "Hayao.js" wordmark (no font, no DOM) — and animate: staggered
// entrance, hold, then dissolve to the game ground. These lock the commands so
// a refactor can't quietly drop the logo, the outlines, or the fade.
const def = { title: 'demo', background: '#102030' } as unknown as GameDefinition;
const TOTAL = 900;

type Cmd = { kind: string; d?: string; fill?: string; opacity?: number; transform: { a: number; e: number; f: number } };

describe('boot splash', () => {
  const frame = makeSplash({}, def, 1280, 720);

  it('draws the Hayao logo: crown + rule mark and the outlined two-tone wordmark', () => {
    const cmds = frame(TOTAL / 2, TOTAL) as unknown as Cmd[]; // mid-hold: fully visible
    expect(cmds.map((c) => c.kind)).toEqual(['rect', 'path', 'path', 'path', 'path']);

    const [, crown, rule, hayao, js] = cmds;
    // the exact canonical paths (web/src/components/logo.ts + logo-wordmark.ts)
    expect(crown.d).toBe(MARK_CROWN);
    expect(crown.fill).toBe('#e59500'); // amber crown
    expect(rule.d).toBe(MARK_RULE);
    expect(rule.fill).toBe('#29335c'); // navy rule
    expect(hayao.d).toBe(WORD_HAYAO);
    expect(hayao.fill).toBe('#29335c'); // ink "Hayao"
    expect(js.d).toBe(WORD_JS);
    expect(js.fill).toBe('#8b90a6'); // muted ".js", just like the site
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

  it('centres the lockup horizontally', () => {
    const cmds = frame(TOTAL / 2, TOTAL) as unknown as Cmd[];
    const crownT = cmds[1].transform;
    const wordT = cmds[3].transform;
    expect(crownT.a).toBeGreaterThan(0); // positive scale
    const lockupLeft = crownT.e + 2 * crownT.a; //         lockup x=2 is the left edge
    const lockupRight = wordT.e + 143.53 * wordT.a; //     lockup x=143.53 is the right
    expect(lockupLeft).toBeLessThan(640); //   crown starts left of pane centre
    expect(lockupRight).toBeGreaterThan(640); // wordmark ends right of it
    expect(640 - lockupLeft).toBeCloseTo(lockupRight - 640, 5); // dead centre
  });

  it('locks the whole lockup into ONE coordinate space at rest', () => {
    const cmds = frame(TOTAL / 2, TOTAL) as unknown as Cmd[];
    const [, crown, rule, hayao, js] = cmds;
    // at rest, crown, rule and both wordmark paths share the exact same transform —
    // the canonical geometry (cap band y 2..22, baseline y 22) is baked into the
    // path data, so alignment cannot drift
    expect(crown.transform).toEqual(hayao.transform);
    expect(rule.transform).toEqual(hayao.transform);
    expect(js.transform).toEqual(hayao.transform);
  });

  it('staggers the entrance: crown pops in before the wordmark', () => {
    const early = frame(60, TOTAL) as unknown as Cmd[];
    const crown = early[1];
    const word = early[3];
    expect(crown.opacity ?? 1).toBeGreaterThan(0); // crown already arriving
    expect(word.opacity ?? 1).toBe(0); //             wordmark not yet
    // and the crown settles to exactly lockup scale by mid-hold (the pop resolves)
    const rest = frame(TOTAL / 2, TOTAL)[1] as Cmd;
    expect(crown.transform.a).toBeLessThan(rest.transform.a); // still growing early
  });
});

describe('mixHex', () => {
  it('interpolates endpoints exactly', () => {
    expect(mixHex('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mixHex('#000000', '#ffffff', 1)).toBe('#ffffff');
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080');
  });
});
