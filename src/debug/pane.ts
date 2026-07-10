// The runtime debug pane — Backspace opens it over any running game. Freeze +
// frame-step, live probe/hash readout, a clickable node-tree inspector, slow-mo,
// screenshot, and (canvas backends) video capture. Pure host chrome: it reads
// the world and drives the SAME deterministic seams tools use (freeze gate +
// single fixed steps), so stepping through a bug is bit-identical to letting
// it run — the determinism dividend LittleJS's debug mode can't offer.
//
// DOM by doctrine, cosmetic by construction; disable with
// `runBrowser(def, mount, { debugPane: false })`.

import type { World } from '../world';
import type { Node } from '../scene/node';
import { saveCanvas } from '../app/share';
import { debugDrawEnabled, debugRect, setDebugDraw } from './draw';

/** What the pane needs from its host (runBrowser wires this up). */
export interface DebugHost {
  readonly world: World;
  /** Run EXACTLY one fixed step with live-held inputs, then render. */
  stepOnce(): void;
  /** The mounted canvas/svg (screenshot + video capture). */
  canvas?: HTMLElement | SVGElement;
  /** Where the pane mounts. */
  mount: HTMLElement;
}

export interface DebugPaneOptions {
  /** Toggle key (KeyboardEvent.code). Default 'Backspace'. */
  key?: string;
}

const STYLE_ID = 'hayao-debug-style';
const CSS = `
.hy-debug{position:absolute;top:8px;right:8px;bottom:8px;width:320px;z-index:70;display:flex;flex-direction:column;gap:6px;
  font:11px/1.5 ui-monospace,Menlo,monospace;color:#d9e0ea;background:rgba(16,20,31,.92);border:1px solid #2c3446;
  border-radius:10px;padding:10px;overflow:hidden;text-align:left}
.hy-debug b{color:#8fb8ff;font-weight:600}
.hy-debug .hy-dbg-row{display:flex;gap:4px;flex-wrap:wrap}
.hy-debug button{font:inherit;color:inherit;background:#222a3d;border:1px solid #384462;border-radius:6px;padding:3px 8px;cursor:pointer}
.hy-debug button:hover{background:#2e3a55}
.hy-debug .hy-dbg-tree{flex:1;overflow:auto;border-top:1px solid #2c3446;padding-top:6px;white-space:pre}
.hy-debug .hy-dbg-tree div{cursor:pointer;border-radius:4px;padding:0 4px}
.hy-debug .hy-dbg-tree div:hover{background:#222a3d}
.hy-debug .hy-dbg-tree div.sel{background:#2b4a7a}
.hy-debug .hy-dbg-detail{max-height:130px;overflow:auto;border-top:1px solid #2c3446;padding-top:6px;white-space:pre-wrap;word-break:break-all;color:#aeb8c8}
`;

export class DebugPane {
  /** True while the pane holds the sim frozen (the driver's freeze gate reads this). */
  held = false;

  private host: DebugHost;
  private key: string;
  private panel: HTMLElement | null = null;
  private onKey: (e: KeyboardEvent) => void;
  private refreshTimer: ReturnType<typeof setInterval> | undefined;
  private markerRaf = 0;
  private selectedId: string | null = null;
  private recorder: MediaRecorder | null = null;

  constructor(host: DebugHost, opts: DebugPaneOptions = {}) {
    this.host = host;
    this.key = opts.key ?? 'Backspace';
    this.onKey = (e) => {
      // Never steal Backspace from a focused form field.
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.code === this.key) {
        e.preventDefault();
        this.toggle();
      }
    };
    if (typeof document !== 'undefined') document.addEventListener('keydown', this.onKey);
  }

  get isOpen(): boolean {
    return this.panel !== null;
  }

  toggle(): void {
    this.isOpen ? this.close() : this.open();
  }

  open(): void {
    if (this.isOpen || typeof document === 'undefined') return;
    if (!document.getElementById(STYLE_ID)) {
      const s = document.createElement('style');
      s.id = STYLE_ID;
      s.textContent = CSS;
      document.head.appendChild(s);
    }
    const p = document.createElement('div');
    p.className = 'hy-debug';
    this.panel = p;
    this.build();
    this.host.mount.appendChild(p);
    this.refreshTimer = setInterval(() => this.refresh(), 250);
    // Selected-node marker rides the immediate-mode debug queue every frame.
    const mark = () => {
      if (!this.isOpen) return;
      this.drawMarker();
      this.markerRaf = requestAnimationFrame(mark);
    };
    if (typeof requestAnimationFrame !== 'undefined') this.markerRaf = requestAnimationFrame(mark);
    this.refresh();
  }

  close(): void {
    if (!this.panel) return;
    this.panel.remove();
    this.panel = null;
    this.held = false;
    if (this.refreshTimer !== undefined) clearInterval(this.refreshTimer);
    if (this.markerRaf && typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(this.markerRaf);
    this.stopRecording();
  }

  // ── panel construction ────────────────────────────────────────
  private stats!: HTMLElement;
  private tree!: HTMLElement;
  private detail!: HTMLElement;
  private pauseBtn!: HTMLButtonElement;
  private recBtn: HTMLButtonElement | null = null;

  private button(label: string, onClick: () => void): HTMLButtonElement {
    const b = document.createElement('button');
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  }

  private build(): void {
    const p = this.panel!;
    this.stats = document.createElement('div');
    p.appendChild(this.stats);

    const row = document.createElement('div');
    row.className = 'hy-dbg-row';
    this.pauseBtn = this.button('freeze', () => {
      this.held = !this.held;
      this.refresh();
    });
    row.appendChild(this.pauseBtn);
    row.appendChild(this.button('step', () => {
      this.held = true;
      this.host.stepOnce();
      this.refresh();
    }));
    row.appendChild(this.button('slow ½', () => this.scale(0.5)));
    row.appendChild(this.button('¼', () => this.scale(0.25)));
    row.appendChild(this.button('1×', () => this.scale(1)));
    row.appendChild(this.button('shot', () => saveCanvas(this.host.canvas, `debug-f${this.host.world.frame}`)));
    if (this.host.canvas instanceof HTMLCanvasElement && typeof MediaRecorder !== 'undefined') {
      this.recBtn = this.button('rec', () => this.toggleRecording());
      row.appendChild(this.recBtn);
    }
    row.appendChild(this.button('draw', () => {
      setDebugDraw(!debugDrawEnabled());
      this.refresh();
    }));
    row.appendChild(this.button('probe→console', () => console.log(this.host.world.probe())));
    p.appendChild(row);

    this.tree = document.createElement('div');
    this.tree.className = 'hy-dbg-tree';
    p.appendChild(this.tree);

    this.detail = document.createElement('div');
    this.detail.className = 'hy-dbg-detail';
    p.appendChild(this.detail);
  }

  private scale(s: number): void {
    // timeScale is real sim state (hashed when ≠1) — that's the point: slow-mo
    // through the same field games use, not a side channel.
    this.host.world.timeScale = s;
    this.refresh();
  }

  // ── live readouts ─────────────────────────────────────────────
  private refresh(): void {
    if (!this.panel) return;
    const w = this.host.world;
    const probe = w.probe();
    const hash = String(probe.hash ?? w.hash());
    this.stats.innerHTML =
      `<b>f</b> ${w.frame}  <b>t</b> ${w.time.toFixed(2)}s  <b>nodes</b> ${w.nodeCount}` +
      `  <b>ts</b> ${w.timeScale}×${this.held ? '  <b>[frozen]</b>' : ''}${w.paused ? '  <b>[paused]</b>' : ''}` +
      `<br/><b>hash</b> ${hash.slice(0, 24)}…` +
      `<br/><b>draw</b> ${debugDrawEnabled() ? 'on' : 'off'}${this.recorder ? '  <b>[recording]</b>' : ''}`;
    this.pauseBtn.textContent = this.held ? 'run' : 'freeze';
    this.renderTree();
  }

  private renderTree(): void {
    this.tree.textContent = '';
    const visit = (n: Node, depth: number): void => {
      const line = document.createElement('div');
      const flags: string[] = [];
      if (n.cosmetic) flags.push('cos');
      if (n.screenSpace) flags.push('scr');
      if (!n.visible) flags.push('hid');
      line.textContent = `${'  '.repeat(depth)}${n.name} (${n.type})${flags.length ? ` [${flags.join(',')}]` : ''}`;
      if (n.id === this.selectedId) line.className = 'sel';
      line.addEventListener('click', () => this.select(n));
      this.tree.appendChild(line);
      for (const c of n.children) visit(c, depth + 1);
    };
    visit(this.host.world.root, 0);
  }

  private select(n: Node): void {
    this.selectedId = n.id === this.selectedId ? null : n.id;
    if (this.selectedId) {
      const wt = n.worldTransform();
      const info = {
        id: n.id, type: n.type, pos: n.pos, rotation: n.rotation, scale: n.scale, z: n.z,
        world: { x: Math.round(wt.e * 10) / 10, y: Math.round(wt.f * 10) / 10 },
        cosmetic: n.cosmetic, pauseMode: n.pauseMode, screenSpace: n.screenSpace,
        props: n.cosmetic ? '(cosmetic — not serialized)' : n.serialize().props,
      };
      this.detail.textContent = JSON.stringify(info, null, 1);
    } else this.detail.textContent = '';
    this.renderTree();
  }

  /** Box marker on the selected node, pushed through the debug-draw queue. */
  private drawMarker(): void {
    if (!this.selectedId || !debugDrawEnabled()) return;
    let found: Node | null = null;
    this.host.world.walk((n) => {
      if (n.id === this.selectedId) found = n;
    });
    if (!found) return;
    const wt = (found as Node).worldTransform();
    debugRect(wt.e - 12, wt.f - 12, 24, 24, { color: '#8fb8ff', screen: false });
  }

  // ── video capture (canvas backends) ───────────────────────────
  private toggleRecording(): void {
    this.recorder ? this.stopRecording() : this.startRecording();
  }

  private startRecording(): void {
    const canvas = this.host.canvas;
    if (!(canvas instanceof HTMLCanvasElement) || typeof MediaRecorder === 'undefined') return;
    const stream = canvas.captureStream?.(60);
    if (!stream) return;
    const chunks: Blob[] = [];
    const rec = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported?.('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm' });
    rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    rec.onstop = () => {
      const url = URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `hayao-capture-f${this.host.world.frame}.webm`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    };
    rec.start();
    this.recorder = rec;
    if (this.recBtn) this.recBtn.textContent = 'stop';
    this.refresh();
  }

  private stopRecording(): void {
    if (!this.recorder) return;
    this.recorder.stop();
    this.recorder = null;
    if (this.recBtn) this.recBtn.textContent = 'rec';
  }

  dispose(): void {
    this.close();
    if (typeof document !== 'undefined') document.removeEventListener('keydown', this.onKey);
  }
}
