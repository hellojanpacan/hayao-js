// Toast notifications — small self-dismissing DOM chrome (achievement pops,
// "game saved", connection notices). DOM per the house doctrine: chrome is
// never canvas text. Browser-only with SSR no-op guards; pure view, so it can
// never touch world.hash().

import type { Achievements } from '../persist/achievements';

export interface ToastOptions {
  /** Small line above the title (e.g. "Achievement unlocked"). */
  kicker?: string;
  /** Secondary line under the title. */
  body?: string;
  /** Leading glyph/emoji (kept textual so no assets are required). */
  icon?: string;
  /** Auto-dismiss after this many ms. Default 3500. */
  durationMs?: number;
}

const STYLE_ID = 'hayao-toast-style';
const CSS = `
.hy-toasts{position:absolute;right:16px;bottom:16px;display:flex;flex-direction:column;gap:8px;z-index:60;pointer-events:none;font-family:var(--hy-serif,Georgia,serif)}
.hy-toast{display:flex;gap:12px;align-items:center;background:var(--hy-paper,#fbf6ea);color:var(--hy-ink,#3d3323);border:1px solid var(--hy-line,#d9ccae);border-radius:12px;box-shadow:0 10px 30px rgba(40,30,15,.28);padding:10px 16px;max-width:340px;opacity:0;transform:translateY(8px);transition:opacity .25s,transform .25s}
.hy-toast.in{opacity:1;transform:none}
.hy-toast .hy-toast-icon{font-size:22px;line-height:1}
.hy-toast .hy-toast-kicker{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--hy-accent,#a11d3a)}
.hy-toast .hy-toast-title{font-size:15px;font-weight:700}
.hy-toast .hy-toast-body{font-size:13px;color:var(--hy-ink-soft,#6f6047)}
`;

let host: HTMLElement | null = null;
let stack: HTMLElement | null = null;

/** Where toasts mount (defaults to document.body; runBrowser hosts can share the overlay mount). */
export function setToastHost(el: HTMLElement): void {
  host = el;
  if (stack) {
    stack.remove();
    stack = null;
  }
}

function ensureStack(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  if (stack && stack.isConnected) return stack;
  if (!document.getElementById(STYLE_ID)) {
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }
  stack = document.createElement('div');
  stack.className = 'hy-toasts';
  (host ?? document.body).appendChild(stack);
  return stack;
}

/**
 * Show a toast. Returns a dismiss function (auto-dismisses after
 * `durationMs`). Stacks bottom-right, newest at the bottom.
 */
export function toast(title: string, opts: ToastOptions = {}): () => void {
  const parent = ensureStack();
  if (!parent) return () => {};

  const el = document.createElement('div');
  el.className = 'hy-toast';
  if (opts.icon) {
    const icon = document.createElement('div');
    icon.className = 'hy-toast-icon';
    icon.textContent = opts.icon;
    el.appendChild(icon);
  }
  const text = document.createElement('div');
  if (opts.kicker) {
    const k = document.createElement('div');
    k.className = 'hy-toast-kicker';
    k.textContent = opts.kicker;
    text.appendChild(k);
  }
  const t = document.createElement('div');
  t.className = 'hy-toast-title';
  t.textContent = title;
  text.appendChild(t);
  if (opts.body) {
    const b = document.createElement('div');
    b.className = 'hy-toast-body';
    b.textContent = opts.body;
    text.appendChild(b);
  }
  el.appendChild(text);
  parent.appendChild(el);

  // Two-frame class add so the entrance transition actually plays.
  requestAnimationFrame?.(() => requestAnimationFrame?.(() => el.classList.add('in')));

  let gone = false;
  const dismiss = () => {
    if (gone) return;
    gone = true;
    el.classList.remove('in');
    setTimeout(() => el.remove(), 300);
  };
  setTimeout(dismiss, opts.durationMs ?? 3500);
  return dismiss;
}

/**
 * Wire an Achievements store to toast presentation: every fresh unlock pops
 * "Achievement unlocked — <title>". Returns the disconnect function.
 */
export function attachAchievementToasts(ach: Achievements, icon = '🏆'): () => void {
  return ach.unlocked.connect((def) => {
    toast(def.title, { kicker: 'Achievement unlocked', body: def.description, icon });
  });
}
