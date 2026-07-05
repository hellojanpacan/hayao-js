// DOM overlay screens — titles, menus, game-over, HUD. Crisp DOM type instead of
// canvas text (narrow-js lesson: humans compare canvas text to DOM and canvas
// loses). Keyboard-navigable by construction. Browser-only; no-op guards for SSR.

export interface MenuAction {
  label: string;
  onSelect: () => void;
  primary?: boolean;
}

export interface ScreenSpec {
  title?: string;
  /** Subtitle / body text (plain text or HTML string). */
  body?: string;
  /** Menu actions, navigable with up/down + Enter. */
  actions?: MenuAction[];
  /** Dim the game behind the screen. */
  dim?: boolean;
  /** Extra class for theming. */
  className?: string;
}

export interface ScreenHandle {
  close(): void;
  readonly element: HTMLElement;
}

let active: ScreenHandle | null = null;

const STYLE_ID = 'hayao-overlay-style';
const CSS = `
.hy-scrim{position:absolute;inset:0;display:grid;place-items:center;z-index:50;font-family:var(--hy-serif,Georgia,serif)}
.hy-scrim.dim{background:rgba(30,24,14,.5);backdrop-filter:blur(2px)}
.hy-card{background:var(--hy-paper,#fbf6ea);color:var(--hy-ink,#3d3323);border:1px solid var(--hy-line,#d9ccae);border-radius:14px;box-shadow:0 14px 44px rgba(40,30,15,.3);padding:26px 30px;max-width:440px;text-align:center}
.hy-card h1{margin:0 0 6px;font-size:30px}
.hy-card .hy-body{color:var(--hy-ink-soft,#6f6047);font-size:15px;line-height:1.5;margin-bottom:18px}
.hy-menu{display:flex;flex-direction:column;gap:8px;align-items:stretch}
.hy-item{font:inherit;font-size:16px;padding:9px 16px;border-radius:9px;border:1px solid var(--hy-line,#d9ccae);background:transparent;color:inherit;cursor:pointer;transition:transform .1s,background .1s}
.hy-item:hover,.hy-item.sel{background:var(--hy-accent,#a11d3a);color:#fdf3ee;border-color:transparent;transform:translateY(-1px)}
.hy-item.primary{background:var(--hy-accent,#a11d3a);color:#fdf3ee;border-color:transparent}
`;

function ensureStyle(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = CSS;
  document.head.appendChild(s);
}

let host: HTMLElement | null = null;
/** Set the element overlays mount into (defaults to document.body). */
export function setOverlayHost(el: HTMLElement): void {
  host = el;
}

let screenObserver: ((kind: 'show' | 'hide', title?: string) => void) | null = null;
/**
 * Observe DOM screen chrome (menus/title/game-over) opening and closing —
 * Studio's session recorder uses this to time menu dwell, which the sim can't
 * see. Observer only; it must never mutate.
 */
export function setScreenObserver(cb: ((kind: 'show' | 'hide', title?: string) => void) | null): void {
  screenObserver = cb;
}

/** Show a screen (replaces any current one). Returns a handle. */
export function showScreen(spec: ScreenSpec): ScreenHandle {
  if (typeof document === 'undefined') {
    return { close() {}, element: null as unknown as HTMLElement };
  }
  ensureStyle();
  hideScreen();
  screenObserver?.('show', spec.title);

  const scrim = document.createElement('div');
  scrim.className = `hy-scrim${spec.dim === false ? '' : ' dim'}${spec.className ? ' ' + spec.className : ''}`;
  const card = document.createElement('div');
  card.className = 'hy-card';

  if (spec.title) {
    const h = document.createElement('h1');
    h.textContent = spec.title;
    card.appendChild(h);
  }
  if (spec.body) {
    const b = document.createElement('div');
    b.className = 'hy-body';
    b.innerHTML = spec.body;
    card.appendChild(b);
  }

  const actions = spec.actions ?? [];
  let sel = Math.max(0, actions.findIndex((a) => a.primary));
  if (sel < 0) sel = 0;
  const items: HTMLButtonElement[] = [];
  if (actions.length) {
    const menu = document.createElement('div');
    menu.className = 'hy-menu';
    actions.forEach((a, i) => {
      const btn = document.createElement('button');
      btn.className = `hy-item${a.primary ? ' primary' : ''}`;
      btn.textContent = a.label;
      btn.addEventListener('click', () => a.onSelect());
      btn.addEventListener('mouseenter', () => setSel(i));
      menu.appendChild(btn);
      items.push(btn);
    });
    card.appendChild(menu);
  }

  function setSel(i: number): void {
    sel = (i + items.length) % items.length;
    items.forEach((el, k) => el.classList.toggle('sel', k === sel));
  }
  if (items.length) setSel(sel);

  const onKey = (e: KeyboardEvent) => {
    if (!items.length) return;
    if (e.code === 'ArrowDown') { setSel(sel + 1); e.preventDefault(); }
    else if (e.code === 'ArrowUp') { setSel(sel - 1); e.preventDefault(); }
    else if (e.code === 'Enter' || e.code === 'Space') { actions[sel]?.onSelect(); e.preventDefault(); }
  };
  document.addEventListener('keydown', onKey);

  scrim.appendChild(card);
  (host ?? document.body).appendChild(scrim);

  const handle: ScreenHandle = {
    element: scrim,
    close() {
      document.removeEventListener('keydown', onKey);
      scrim.remove();
      if (active === handle) {
        active = null;
        screenObserver?.('hide', spec.title);
      }
    },
  };
  active = handle;
  return handle;
}

export function hideScreen(): void {
  active?.close();
}
