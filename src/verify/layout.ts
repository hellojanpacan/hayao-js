// Layout lints — verification for the HUMAN-contact layer. The first real
// playtest of the 20-genre campaign found that every reported defect lived in
// the one layer the sim proofs cannot see: text buried under sprites, labels
// kissing shapes, controls nobody explains. But the display list is pure
// data, so the basics of readability are assertable like everything else.
//
// Rules enforced here (see CONVENTIONS "The human-contact layer"):
//  1. TEXT IS SACRED. A shape may fully contain a text's box (it's a panel)
//     or be fully disjoint from it. Partial overlap = collision. Shapes at
//     z ≤ 1 are exempt — that's the background lattice (tile grids, felt).
//  2. FIRST CONTACT. Every action in the input map must be mentioned by some
//     on-screen text on the first frame (its key or its name) — a player who
//     reads the screen must be able to discover the controls.

import type { DrawCommand, TextCommand } from '../render/commands';
import type { InputMap } from '../input/actions';
import type { World } from '../world';
import { contrastRatio } from './gates';

export interface TextBox {
  cmd: TextCommand;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Approximate a text command's on-screen box (serif ≈ 0.56em per char). */
export function textBox(cmd: TextCommand): TextBox {
  const w = cmd.text.length * cmd.size * 0.56;
  const h = cmd.size * 1.25;
  const cx = cmd.transform.e + cmd.x;
  const by = cmd.transform.f + cmd.y; // baseline
  const left = cmd.align === 'center' ? cx - w / 2 : cmd.align === 'right' ? cx - w : cx;
  return { cmd, x: left, y: by - cmd.size, w, h };
}

/** Conservative bounds of a non-text command (local shape + translation). */
export function shapeBox(cmd: DrawCommand): { x: number; y: number; w: number; h: number } | null {
  const ex = cmd.transform.e;
  const ey = cmd.transform.f;
  switch (cmd.kind) {
    case 'rect':
      return { x: ex + cmd.x, y: ey + cmd.y, w: cmd.w, h: cmd.h };
    case 'circle':
      return { x: ex + cmd.cx - cmd.radius, y: ey + cmd.cy - cmd.radius, w: cmd.radius * 2, h: cmd.radius * 2 };
    case 'poly': {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (let i = 0; i < cmd.points.length; i += 2) {
        minX = Math.min(minX, cmd.points[i]);
        maxX = Math.max(maxX, cmd.points[i]);
        minY = Math.min(minY, cmd.points[i + 1]);
        maxY = Math.max(maxY, cmd.points[i + 1]);
      }
      return { x: ex + minX, y: ey + minY, w: maxX - minX, h: maxY - minY };
    }
    default:
      return null; // paths are decorative fans/arcs — skip (conservative)
  }
}

const overlaps = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const contains = (outer: { x: number; y: number; w: number; h: number }, inner: { x: number; y: number; w: number; h: number }, pad = 2): boolean =>
  outer.x - pad <= inner.x && outer.y - pad <= inner.y && outer.x + outer.w + pad >= inner.x + inner.w && outer.y + outer.h + pad >= inner.y + inner.h;

export interface LayoutOptions {
  /** Shapes at or below this z are background lattice (tiles/felt) and may sit under text. */
  backgroundZ?: number;
  /** Extra pixels of breathing room demanded around text (default 0 = touch is allowed, overlap is not). */
  margin?: number;
  /**
   * Lint transient view chrome too (floating popups, particles). Off by default:
   * a "+10" drifting across a HUD label is motion, not a layout bug (see #26).
   */
  includeTransient?: boolean;
  /**
   * The page background these commands paint on. When given, contrast lints run
   * (see `minContrast` / `minTextContrast`): a shape or label that barely differs
   * from what sits under it is invisible even though the sim hashes fine (#30).
   */
  background?: string;
  /**
   * Minimum contrast ratio a solid foreground shape must hold against the
   * background to count as visible at all (default 1.5). Only checked when
   * `background` is set.
   */
  minContrast?: number;
  /**
   * Minimum contrast ratio text must hold against its backing (panel fill, or the
   * background) — the WCAG AA readability bar (default 4.5). Only when `background`
   * is set. Pass 0 to skip the text-contrast check while keeping shape contrast.
   */
  minTextContrast?: number;
}

const isTransient = (c: DrawCommand): boolean => (c as { transient?: boolean }).transient === true;
const solidFill = (c: DrawCommand): string | undefined => {
  const f = (c as { fill?: string }).fill;
  if (!f || f === 'none') return undefined;
  if ((c as { gradient?: unknown }).gradient) return undefined; // gradient bounds vary — skip
  return f;
};

/**
 * Lint a display list for text readability and visibility. Returns human-readable
 * issues (empty = clean). Checks:
 *  1. text-vs-shape partial overlaps (a label half-under a shape),
 *  2. text fully hidden behind an opaque higher-z shape (silent invisible labels, #31),
 *  3. text-vs-text overlaps,
 *  4. (opt-in via `background`) low-contrast shapes and text (#30).
 * Transient commands (popups/particles) are skipped unless `includeTransient`.
 */
export function layoutIssues(commands: DrawCommand[], opts: LayoutOptions = {}): string[] {
  const backgroundZ = opts.backgroundZ ?? 1;
  const margin = opts.margin ?? 0;
  const bg = opts.background;
  const minContrast = opts.minContrast ?? 1.5;
  const minTextContrast = opts.minTextContrast ?? 4.5;
  const issues: string[] = [];
  const lintable = opts.includeTransient ? commands : commands.filter((c) => !isTransient(c));
  const texts: TextBox[] = [];
  for (const c of lintable) if (c.kind === 'text' && (c as TextCommand).text.trim().length) texts.push(textBox(c as TextCommand));

  for (const t of texts) {
    const tz = t.cmd.z ?? 0;
    const r = { x: t.x - margin, y: t.y - margin, w: t.w + margin * 2, h: t.h + margin * 2 };
    // A backing panel fully contains the text and sits BELOW it in paint order
    // (z ≤ text z). It absolves collisions with shapes it covers — HUD scrims.
    // A containing shape ABOVE the text is not a panel; it buries the label.
    let panelZ = -Infinity;
    let panelFill: string | undefined = bg;
    for (const c of lintable) {
      if (c.kind === 'text') continue;
      const b = shapeBox(c);
      if (!b || !contains(b, t)) continue;
      const opaque = c.opacity === undefined || c.opacity >= 0.6;
      const cz = c.z ?? 0;
      if (opaque && cz <= tz && cz >= panelZ) {
        panelZ = cz;
        panelFill = solidFill(c) ?? panelFill; // the nearest opaque backing under the text
      }
      // Occlusion (#31): an opaque shape that contains the text but paints ABOVE
      // it hides the label entirely — no gate caught this before.
      if (cz > tz && (c.opacity === undefined || c.opacity >= 0.9)) {
        issues.push(`text "${clip(t.cmd.text)}" is hidden behind a ${c.kind} (z${cz} > text z${tz}) that fully covers it — give the text a higher z, or the shape a lower one`);
      }
    }
    for (const c of lintable) {
      if (c.kind === 'text') continue;
      if ((c.z ?? 0) <= backgroundZ) continue; // background lattice
      if ((c.z ?? 0) <= panelZ) continue; // hidden behind the text's panel
      if (c.opacity !== undefined && c.opacity < 0.25) continue; // ghosts
      const b = shapeBox(c);
      if (!b) continue;
      if (overlaps(r, b) && !contains(b, t)) {
        issues.push(`text "${clip(t.cmd.text)}" collides with a ${c.kind} (z${c.z}) at ~(${Math.round(b.x)},${Math.round(b.y)}) — back it with a panel, or stay clear`);
      }
    }
    // Contrast (#30): text must read against whatever it sits on.
    if (bg && minTextContrast > 0) {
      const fg = t.cmd.fill;
      if (fg && fg !== 'none' && (t.cmd.opacity === undefined || t.cmd.opacity >= 0.6)) {
        const ratio = contrastRatio(fg, panelFill ?? bg);
        if (ratio < minTextContrast) issues.push(`text "${clip(t.cmd.text)}" (${fg}) contrast is ${ratio.toFixed(2)}:1 on its backing (needs ≥ ${minTextContrast}:1) — barely readable`);
      }
    }
  }

  // Contrast (#30): a solid foreground shape must differ from the background.
  if (bg) {
    for (const c of lintable) {
      if (c.kind === 'text') continue;
      if ((c.z ?? 0) <= backgroundZ) continue;
      if (c.opacity !== undefined && c.opacity < 0.6) continue;
      const fill = solidFill(c);
      if (!fill) continue;
      const ratio = contrastRatio(fill, bg);
      if (ratio < minContrast) issues.push(`${c.kind} (${fill}, z${c.z}) contrast is ${ratio.toFixed(2)}:1 vs background ${bg} (needs ≥ ${minContrast}:1) — it vanishes into the ground`);
    }
  }

  for (let i = 0; i < texts.length; i++)
    for (let j = i + 1; j < texts.length; j++)
      if (overlaps(texts[i], texts[j])) issues.push(`texts "${clip(texts[i].cmd.text)}" and "${clip(texts[j].cmd.text)}" overlap`);
  return dedupe(issues);
}

const clip = (s: string): string => (s.length > 28 ? s.slice(0, 25) + '…' : s);
const dedupe = (a: string[]): string[] => [...new Set(a)];

/** Friendly names a hint text may use to reference a key code. */
export function keyMentions(code: string): string[] {
  if (code.startsWith('Digit')) return [code.slice(5)];
  if (code.startsWith('Key')) return [code.slice(3).toLowerCase()];
  if (code.startsWith('Arrow')) return ['arrow', '←', '→', '↑', '↓', code.slice(5).toLowerCase()];
  if (code.startsWith('Shift')) return ['shift'];
  if (code === 'Space') return ['space'];
  if (code === 'Enter') return ['enter'];
  if (code === 'Period') return ['.'];
  return [code.toLowerCase()];
}

/**
 * First-contact check: which actions does no on-screen text explain? An
 * action passes if any text mentions its name or one of its keys' friendly
 * names. 'restart' is exempt (universal convention).
 */
export function missingControlHints(world: World, inputMap: InputMap): string[] {
  const textBlob = world
    .render()
    .filter((c): c is TextCommand => c.kind === 'text')
    .map((c) => c.text.toLowerCase())
    .join(' · ');
  const missing: string[] = [];
  const mentions = (n: string): boolean => {
    if (!n.length) return false;
    // Short tokens (single letters, digits) must appear as standalone words,
    // or "f" would be satisfied by the word "fire" losing the actual key.
    if (n.length <= 2 && /^[a-z0-9.]+$/.test(n)) return new RegExp(`(^|[^a-z0-9])${n.replace('.', '\\.')}($|[^a-z0-9])`).test(textBlob);
    return textBlob.includes(n);
  };
  for (const [action, keys] of Object.entries(inputMap)) {
    if (action === 'restart') continue;
    const names = [action.toLowerCase().replace(/-\d+$/, ''), ...keys.flatMap(keyMentions)];
    if (!names.some(mentions)) missing.push(action);
  }
  return dedupe(missing);
}
