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
    const slider = (label: string, key: 'master' | 'music' | 'sfx') => ({
      label,
      slider: { value: s[key], step: 0.1, onChange: (v: number) => settings.set({ [key]: v }) },
    });
    showScreen({
      title: this.opts.title ?? 'Paused',
      onCancel: () => this.resume(),
      actions: [
        { label: 'Resume', primary: true, onSelect: () => this.resume() },
        slider('Master', 'master'),
        slider('Music', 'music'),
        slider('Sfx', 'sfx'),
        { label: 'Mute', toggle: { value: s.muted, onChange: (v) => settings.set({ muted: v }) } },
        { label: 'Rumble', toggle: { value: s.haptics, onChange: (v) => settings.set({ haptics: v }) } },
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
