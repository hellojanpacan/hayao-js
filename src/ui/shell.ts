// The game shell: a pause menu (Esc) with volume, mute, fullscreen, restart, and
// back-to-hub — every game gets it for free (narrow-js lesson: the shell owns Esc,
// kills debug-key landmines, and standardizes chrome). Browser-only.

import { audio } from '../audio/audio';
import { settings, toggleFullscreen } from './settings';
import { showScreen, hideScreen } from './overlay';

export interface ShellOptions {
  onRestart?: () => void;
  onQuit?: () => void;
  /** Called with true when paused, false when resumed. */
  onPause?: (paused: boolean) => void;
  title?: string;
}

export class Shell {
  private paused = false;
  private opts: ShellOptions;
  private keyHandler: (e: KeyboardEvent) => void;

  constructor(opts: ShellOptions = {}) {
    this.opts = opts;
    this.keyHandler = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        this.toggle();
      }
    };
    if (typeof document !== 'undefined') document.addEventListener('keydown', this.keyHandler);
  }

  get isPaused(): boolean {
    return this.paused;
  }

  toggle(): void {
    this.paused ? this.resume() : this.pause();
  }

  pause(): void {
    if (this.paused) return;
    this.paused = true;
    audio.blip(440);
    this.opts.onPause?.(true);
    this.render();
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    hideScreen();
    this.opts.onPause?.(false);
  }

  private render(): void {
    const s = settings.get();
    const vol = (label: string, v: number) => `${label}: ${Math.round(v * 100)}`;
    showScreen({
      title: this.opts.title ?? 'Paused',
      body:
        `<div style="font-size:13px;text-align:left;line-height:1.9">` +
        `${vol('Master', s.master)} · ${vol('Music', s.music)} · ${vol('Sfx', s.sfx)}` +
        `<br/><span style="opacity:.7">Use the menu, or keys: M mute · F fullscreen</span></div>`,
      actions: [
        { label: 'Resume', primary: true, onSelect: () => this.resume() },
        { label: s.muted ? 'Unmute (M)' : 'Mute (M)', onSelect: () => { settings.set({ muted: !settings.get().muted }); this.render(); } },
        { label: 'Music −/+', onSelect: () => { const m = Math.min(1, settings.get().music + 0.1) % 1.05; settings.set({ music: m > 1 ? 0 : m }); this.render(); } },
        { label: 'Fullscreen (F)', onSelect: () => toggleFullscreen() },
        ...(this.opts.onRestart ? [{ label: 'Restart', onSelect: () => { this.resume(); this.opts.onRestart!(); } }] : []),
        ...(this.opts.onQuit ? [{ label: 'Quit', onSelect: () => { this.resume(); this.opts.onQuit!(); } }] : []),
      ],
    });
  }

  dispose(): void {
    if (typeof document !== 'undefined') document.removeEventListener('keydown', this.keyHandler);
    hideScreen();
  }
}
