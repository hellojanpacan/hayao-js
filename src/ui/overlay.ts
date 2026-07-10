// DOM overlay screens — titles, menus, game-over, HUD. Crisp DOM type instead of
// canvas text (narrow-js lesson: humans compare canvas text to DOM and canvas
// loses). Navigable by construction: keyboard (arrows/enter) here, gamepad via
// ui/menuNav.ts driving the same `screenNav()` seam. Browser-only; no-op guards
// for SSR.
//
// Default look = the Regalia design system (paper white, navy ink, green
// accent); every color/font routes through a --hy-* CSS variable so a game can
// retheme the chrome without touching engine code.

export interface SliderSpec {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  /** Render the value (default: percent when 0..1, else the raw number). */
  format?: (v: number) => string;
  onChange: (v: number) => void;
}

export interface ToggleSpec {
  value: boolean;
  onChange: (v: boolean) => void;
}

export interface MenuAction {
  label: string;
  /** Activate (Enter / Ⓐ / click). Toggles flip without one. */
  onSelect?: () => void;
  primary?: boolean;
  /** A value row adjusted with ◂ ▸ (ArrowLeft/Right, d-pad) instead of activated. */
  slider?: SliderSpec;
  /** An on/off row; Enter (or ◂ ▸) flips it. */
  toggle?: ToggleSpec;
}

export interface ScreenSpec {
  title?: string;
  /** Subtitle / body text (plain text or HTML string). */
  body?: string;
  /** Menu rows, navigable with up/down + Enter, adjustable with left/right. */
  actions?: MenuAction[];
  /** Cancel handler (gamepad Ⓑ). Esc stays with the Shell. */
  onCancel?: () => void;
  /** Dim the game behind the screen. */
  dim?: boolean;
  /** Extra class for theming. */
  className?: string;
}

export interface ScreenHandle {
  close(): void;
  readonly element: HTMLElement;
}

/** The live navigation seam for the active screen — what gamepad nav drives. */
export interface ScreenNav {
  /** Move the focus ring (−1 up, +1 down). */
  move(delta: number): void;
  /** Adjust the focused slider/toggle (−1 left, +1 right). */
  adjust(delta: number): void;
  /** Activate the focused row (Enter / Ⓐ). */
  select(): void;
  /** The screen's cancel action (Ⓑ), when it has one. */
  cancel(): void;
}

let active: ScreenHandle | null = null;
let activeNav: ScreenNav | null = null;

/** The active screen's navigation seam, or null when no screen is up. */
export function screenNav(): ScreenNav | null {
  return activeNav;
}

const STYLE_ID = 'hayao-overlay-style';
const CSS = `
.hy-scrim{position:absolute;inset:0;display:grid;place-items:center;z-index:50;font-family:var(--hy-font,'Poppins','Overpass',system-ui,sans-serif)}
.hy-scrim.dim{background:rgba(41,51,92,.45);backdrop-filter:blur(2px)}
.hy-card{background:var(--hy-paper,#ffffff);color:var(--hy-ink,#29335c);border:1px solid var(--hy-line,#e7e8ee);border-radius:14px;box-shadow:0 14px 44px rgba(41,51,92,.25);padding:26px 30px;min-width:300px;max-width:440px;text-align:center}
.hy-card h1{margin:0 0 6px;font-size:28px;font-family:var(--hy-font-display,'Overpass',system-ui,sans-serif);font-weight:800;letter-spacing:-.01em}
.hy-card .hy-body{color:var(--hy-ink-soft,#5a6072);font-size:14px;line-height:1.55;margin-bottom:18px}
.hy-menu{display:flex;flex-direction:column;gap:8px;align-items:stretch}
.hy-item{display:flex;align-items:center;justify-content:center;gap:10px;font:inherit;font-size:15px;padding:9px 16px;border-radius:9px;border:1px solid var(--hy-line,#e7e8ee);background:transparent;color:inherit;cursor:pointer;transition:transform .1s,background .1s,border-color .1s;outline:none}
.hy-item:hover,.hy-item.sel{background:var(--hy-accent,#337357);color:var(--hy-accent-ink,#fff);border-color:transparent;transform:translateY(-1px)}
.hy-item.primary{background:var(--hy-accent,#337357);color:var(--hy-accent-ink,#fff);border-color:transparent}
.hy-item .hy-val{font-variant-numeric:tabular-nums;font-weight:700;min-width:3.5em}
.hy-item .hy-arrow{opacity:.45;font-weight:700;user-select:none}
.hy-item.sel .hy-arrow,.hy-item:hover .hy-arrow{opacity:.9}
.hy-item .hy-meter{flex:1;max-width:110px;height:6px;border-radius:3px;background:var(--hy-line,#e7e8ee);overflow:hidden}
.hy-item .hy-meter>i{display:block;height:100%;background:var(--hy-accent-soft,#669bbc);border-radius:3px}
.hy-item.sel .hy-meter,.hy-item:hover .hy-meter{background:rgba(255,255,255,.3)}
.hy-item.sel .hy-meter>i,.hy-item:hover .hy-meter>i{background:var(--hy-accent-ink,#fff)}
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
 * Workshop's session recorder uses this to time menu dwell, which the sim can't
 * see. Observer only; it must never mutate.
 */
export function setScreenObserver(cb: ((kind: 'show' | 'hide', title?: string) => void) | null): void {
  screenObserver = cb;
}

const defaultFormat = (spec: SliderSpec) => (v: number) => {
  const max = spec.max ?? 1;
  return max <= 1 ? `${Math.round(v * 100)}` : `${Math.round(v)}`;
};

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

  // Per-row render of the value part (sliders/toggles re-render in place).
  const renderRow = (btn: HTMLButtonElement, a: MenuAction): void => {
    btn.textContent = '';
    if (a.slider) {
      const s = a.slider;
      const min = s.min ?? 0;
      const max = s.max ?? 1;
      const fmt = s.format ?? defaultFormat(s);
      const label = document.createElement('span');
      label.textContent = a.label;
      const left = document.createElement('span');
      left.className = 'hy-arrow';
      left.textContent = '◂';
      const meter = document.createElement('span');
      meter.className = 'hy-meter';
      const fillBar = document.createElement('i');
      fillBar.style.width = `${Math.round(((s.value - min) / (max - min || 1)) * 100)}%`;
      meter.appendChild(fillBar);
      const val = document.createElement('span');
      val.className = 'hy-val';
      val.textContent = fmt(s.value);
      const right = document.createElement('span');
      right.className = 'hy-arrow';
      right.textContent = '▸';
      btn.append(label, left, meter, val, right);
    } else if (a.toggle) {
      const label = document.createElement('span');
      label.textContent = a.label;
      const val = document.createElement('span');
      val.className = 'hy-val';
      val.textContent = a.toggle.value ? 'On' : 'Off';
      btn.append(label, val);
    } else {
      btn.textContent = a.label;
    }
  };

  function setSel(i: number): void {
    if (!items.length) return;
    sel = ((i % items.length) + items.length) % items.length;
    items.forEach((el, k) => el.classList.toggle('sel', k === sel));
  }

  const adjustRow = (a: MenuAction, dir: number): void => {
    const btn = items[actions.indexOf(a)];
    if (a.slider) {
      const s = a.slider;
      const min = s.min ?? 0;
      const max = s.max ?? 1;
      const step = s.step ?? (max - min) / 10;
      const next = Math.min(max, Math.max(min, Math.round((s.value + dir * step) / step) * step));
      // Snap to the step grid to dodge float drift (0.7000000000000001).
      s.value = Math.round(next * 1e6) / 1e6;
      s.onChange(s.value);
      if (btn) renderRow(btn, a);
    } else if (a.toggle) {
      a.toggle.value = !a.toggle.value;
      a.toggle.onChange(a.toggle.value);
      if (btn) renderRow(btn, a);
    }
  };

  const selectRow = (a: MenuAction): void => {
    if (a.toggle && !a.onSelect) adjustRow(a, 1);
    else a.onSelect?.();
  };

  if (actions.length) {
    const menu = document.createElement('div');
    menu.className = 'hy-menu';
    actions.forEach((a, i) => {
      const btn = document.createElement('button');
      btn.className = `hy-item${a.primary ? ' primary' : ''}`;
      renderRow(btn, a);
      btn.addEventListener('click', (e) => {
        // A click on a slider row adjusts toward the clicked half.
        if (a.slider) {
          const rect = btn.getBoundingClientRect();
          adjustRow(a, e.clientX < rect.left + rect.width / 2 ? -1 : 1);
        } else selectRow(a);
      });
      btn.addEventListener('mouseenter', () => setSel(i));
      menu.appendChild(btn);
      items.push(btn);
    });
    card.appendChild(menu);
  }
  if (items.length) setSel(sel);

  const nav: ScreenNav = {
    move: (d) => setSel(sel + d),
    adjust: (d) => actions[sel] && adjustRow(actions[sel], d),
    select: () => actions[sel] && selectRow(actions[sel]),
    cancel: () => spec.onCancel?.(),
  };

  const onKey = (e: KeyboardEvent) => {
    if (!items.length) return;
    if (e.code === 'ArrowDown') { nav.move(1); e.preventDefault(); }
    else if (e.code === 'ArrowUp') { nav.move(-1); e.preventDefault(); }
    else if (e.code === 'ArrowLeft') { nav.adjust(-1); e.preventDefault(); }
    else if (e.code === 'ArrowRight') { nav.adjust(1); e.preventDefault(); }
    else if (e.code === 'Enter' || e.code === 'Space') { nav.select(); e.preventDefault(); }
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
        activeNav = null;
        screenObserver?.('hide', spec.title);
      }
    },
  };
  active = handle;
  activeNav = nav;
  return handle;
}

export function hideScreen(): void {
  active?.close();
}
