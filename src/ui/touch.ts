// TouchControls — an opt-in virtual gamepad for touch play, sibling to Shell.
// runBrowser games take keyboard + single pointer; on a phone a keyboard game is
// unplayable until ~120 lines of host glue exist. This renders floating sticks /
// buttons over the letterbox and drives the SAME deterministic action set as
// keys, via `KeyboardSource.setHeld` — so it needs NO per-frame pump: a control
// sets held-state on touch and clears it on release, and the engine samples it
// each fixed step. Each stick/button owns its own pointerId, so two thumbs work
// at once (dual-stick). Host UI, matching "menus/HUD are DOM overlays".

import type { GameHandle } from '../app/browser';
import { snapAxis, quantizeAngle } from '../input/actions';
import { datan2, dhypot } from '../core/dmath';

/** A virtual stick. Give it 4 directional actions, and/or an analog axis prefix. */
export interface TouchStick {
  /** Directional actions held while tilted past the deadzone. Array = [up,down,left,right]. */
  dirs?: [string, string, string, string] | { up: string; down: string; left: string; right: string };
  /**
   * Emit live analog axes `${prefix}x`, `${prefix}y` (−1..1) and `${prefix}angle`
   * (radians), quantized to `buckets`. NOTE: these are LIVE axes (feel), not part
   * of the input log — for replay-exact analog aim, thread them through
   * `world.step(actions, axes)` (see docs/CONVENTIONS.md §Pointer).
   */
  prefix?: string;
  /** Axis quantization levels (default 32). */
  buckets?: number;
  /** Dead-zone as a fraction of the stick radius, 0..1 (default 0.28). */
  deadzone?: number;
}

export interface TouchButton {
  action: string;
  /** Glyph/label drawn on the button (default the action name). */
  label?: string;
  /** Hold the action while pressed (default true); false = one-shot tap via press(). */
  hold?: boolean;
}

export interface TouchControlsLayout {
  /** Left-corner stick (movement). Array shorthand → [up,down,left,right]. */
  left?: TouchStick | [string, string, string, string];
  /** Right-corner stick (aim). */
  right?: TouchStick | [string, string, string, string];
  /** Action buttons, stacked at the lower-right. */
  buttons?: TouchButton[];
  /** Only mount when the device has a coarse (touch) pointer (default true). */
  touchOnly?: boolean;
}

const STYLE_ID = 'hayao-touch-style';
const CSS = `
.hy-touch{position:absolute;inset:0;z-index:40;pointer-events:none;touch-action:none;-webkit-user-select:none;user-select:none}
.hy-stick{position:absolute;bottom:6%;width:120px;height:120px;border-radius:50%;pointer-events:auto;background:rgba(20,16,10,.16);border:2px solid rgba(250,244,230,.35);box-shadow:inset 0 0 20px rgba(0,0,0,.12)}
.hy-stick.left{left:5%}
.hy-stick.right{right:5%}
.hy-knob{position:absolute;left:50%;top:50%;width:52px;height:52px;margin:-26px 0 0 -26px;border-radius:50%;background:rgba(250,244,230,.6);border:2px solid rgba(20,16,10,.25);transition:transform .04s linear}
.hy-btns{position:absolute;right:5%;bottom:26%;display:flex;flex-direction:column-reverse;gap:12px;pointer-events:none}
.hy-btn{pointer-events:auto;width:66px;height:66px;border-radius:50%;font:600 15px/1 var(--hy-serif,Georgia,serif);color:#fbf6ea;background:var(--hy-accent,#a11d3a);border:2px solid rgba(250,244,230,.4);box-shadow:0 4px 12px rgba(30,20,10,.3);display:grid;place-items:center;text-transform:capitalize}
.hy-btn:active,.hy-btn.on{transform:translateY(2px);filter:brightness(1.15)}
`;

function ensureStyle(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = CSS;
  document.head.appendChild(s);
}

function normDirs(s: TouchStick): { up: string; down: string; left: string; right: string } | undefined {
  if (!s.dirs) return undefined;
  return Array.isArray(s.dirs) ? { up: s.dirs[0], down: s.dirs[1], left: s.dirs[2], right: s.dirs[3] } : s.dirs;
}

export class TouchControls {
  private handle: GameHandle;
  private root: HTMLElement;
  private disposers: Array<() => void> = [];
  /** Every action this control set can hold — released together on dispose/reset. */
  private owned = new Set<string>();

  constructor(handle: GameHandle, layout: TouchControlsLayout) {
    this.handle = handle;
    ensureStyle();
    const coarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
    const mount = (handle.canvas?.parentElement as HTMLElement | null) ?? undefined;
    this.root = document.createElement('div');
    this.root.className = 'hy-touch';
    // Mount but stay invisible on non-touch devices unless explicitly forced.
    if (mount && (layout.touchOnly === false || coarse)) mount.appendChild(this.root);

    const left = normStick(layout.left);
    const right = normStick(layout.right);
    if (left) this.addStick('left', left);
    if (right) this.addStick('right', right);
    if (layout.buttons?.length) this.addButtons(layout.buttons);
  }

  private addStick(side: 'left' | 'right', spec: TouchStick): void {
    const base = document.createElement('div');
    base.className = `hy-stick ${side}`;
    const knob = document.createElement('div');
    knob.className = 'hy-knob';
    base.appendChild(knob);
    this.root.appendChild(base);

    const dirs = normDirs(spec);
    const prefix = spec.prefix;
    const buckets = spec.buckets ?? 32;
    const dead = spec.deadzone ?? 0.28;
    let activeId: number | null = null;

    const setAxes = (nx: number, ny: number) => {
      if (!prefix) return;
      const axes = this.handle.world.input.axes;
      axes.set(`${prefix}x`, snapAxis(nx, buckets));
      axes.set(`${prefix}y`, snapAxis(ny, buckets));
      axes.set(`${prefix}angle`, nx === 0 && ny === 0 ? 0 : quantizeAngle(datan2(ny, nx), buckets));
    };
    const release = () => {
      if (dirs) for (const a of [dirs.up, dirs.down, dirs.left, dirs.right]) this.hold(a, false);
      setAxes(0, 0);
      knob.style.transform = 'translate(0,0)';
      activeId = null;
    };
    const apply = (clientX: number, clientY: number) => {
      const r = base.getBoundingClientRect();
      const rad = r.width / 2;
      let dx = (clientX - (r.left + rad)) / rad;
      let dy = (clientY - (r.top + rad)) / rad;
      const m = dhypot(dx, dy);
      if (m > 1) { dx /= m; dy /= m; }
      knob.style.transform = `translate(${dx * rad * 0.6}px,${dy * rad * 0.6}px)`;
      const mag = dhypot(dx, dy);
      if (dirs) {
        this.hold(dirs.left, dx < -dead);
        this.hold(dirs.right, dx > dead);
        this.hold(dirs.up, dy < -dead);
        this.hold(dirs.down, dy > dead);
      }
      setAxes(mag < dead ? 0 : dx, mag < dead ? 0 : dy);
    };

    const onDown = (e: PointerEvent) => {
      if (activeId !== null) return;
      activeId = e.pointerId;
      base.setPointerCapture?.(e.pointerId);
      apply(e.clientX, e.clientY);
      e.preventDefault();
    };
    const onMove = (e: PointerEvent) => { if (e.pointerId === activeId) apply(e.clientX, e.clientY); };
    const onUp = (e: PointerEvent) => { if (e.pointerId === activeId) release(); };
    base.addEventListener('pointerdown', onDown as EventListener);
    base.addEventListener('pointermove', onMove as EventListener);
    base.addEventListener('pointerup', onUp as EventListener);
    base.addEventListener('pointercancel', onUp as EventListener);
    this.disposers.push(() => {
      release();
      base.remove();
    });
  }

  private addButtons(buttons: TouchButton[]): void {
    const wrap = document.createElement('div');
    wrap.className = 'hy-btns';
    this.root.appendChild(wrap);
    for (const b of buttons) {
      const el = document.createElement('button');
      el.className = 'hy-btn';
      el.textContent = b.label ?? b.action;
      wrap.appendChild(el);
      const hold = b.hold ?? true;
      const down = (e: PointerEvent) => {
        el.classList.add('on');
        if (hold) this.hold(b.action, true);
        else this.handle.input.press(b.action);
        el.setPointerCapture?.(e.pointerId);
        e.preventDefault();
      };
      const up = () => {
        el.classList.remove('on');
        if (hold) this.hold(b.action, false);
      };
      el.addEventListener('pointerdown', down as EventListener);
      el.addEventListener('pointerup', up as EventListener);
      el.addEventListener('pointercancel', up as EventListener);
      this.disposers.push(() => {
        up();
        el.remove();
      });
    }
    this.disposers.push(() => wrap.remove());
  }

  private hold(action: string, on: boolean): void {
    this.handle.input.setHeld(action, on);
    if (on) this.owned.add(action);
  }

  dispose(): void {
    for (const d of this.disposers.splice(0)) d();
    for (const a of this.owned) this.handle.input.setHeld(a, false);
    this.owned.clear();
    this.root.remove();
  }
}

function normStick(s: TouchStick | [string, string, string, string] | undefined): TouchStick | undefined {
  if (!s) return undefined;
  return Array.isArray(s) ? { dirs: s } : s;
}
