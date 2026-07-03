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
}

/**
 * Lint a display list for text readability. Returns human-readable issues
 * (empty = clean). Checks: text-vs-shape partial overlaps (rule 1) and
 * text-vs-text overlaps.
 */
export function layoutIssues(commands: DrawCommand[], opts: LayoutOptions = {}): string[] {
  const backgroundZ = opts.backgroundZ ?? 1;
  const margin = opts.margin ?? 0;
  const issues: string[] = [];
  const texts: TextBox[] = [];
  for (const c of commands) if (c.kind === 'text' && (c as TextCommand).text.trim().length) texts.push(textBox(c as TextCommand));

  for (const t of texts) {
    const r = { x: t.x - margin, y: t.y - margin, w: t.w + margin * 2, h: t.h + margin * 2 };
    // A backing panel (any shape that fully contains the text, below it in
    // paint order) occludes whatever sits underneath IT — collisions with
    // shapes the panel covers are forgiven. This is how HUD scrims work.
    let panelZ = -Infinity;
    for (const c of commands) {
      if (c.kind === 'text') continue;
      const b = shapeBox(c);
      if (b && contains(b, t) && (c.opacity === undefined || c.opacity >= 0.6)) panelZ = Math.max(panelZ, c.z ?? 0);
    }
    for (const c of commands) {
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
