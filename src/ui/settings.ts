// Player settings, persisted to localStorage and pushed into the audio bus
// (and the haptics switch). Framework-agnostic (plain object + subscribe), so
// any game/UI can bind to it.

import { audio } from '../audio/audio';
import { setHapticsEnabled } from '../input/haptics';

export interface Settings {
  master: number;
  music: number;
  sfx: number;
  muted: boolean;
  /** Gamepad rumble / device vibration (input/haptics.ts honours this). */
  haptics: boolean;
  colorblind: boolean;
  reducedMotion: boolean;
}

const KEY = 'hayao.settings.v1';
const DEFAULTS: Settings = { master: 0.7, music: 0.6, sfx: 0.8, muted: false, haptics: true, colorblind: false, reducedMotion: false };

type Sub = (s: Settings) => void;

class SettingsStore {
  private state: Settings;
  private subs = new Set<Sub>();

  constructor() {
    this.state = this.load();
    this.pushToAudio();
  }

  get(): Settings {
    return { ...this.state };
  }

  set(patch: Partial<Settings>): void {
    this.state = { ...this.state, ...patch };
    this.save();
    this.pushToAudio();
    for (const fn of this.subs) fn(this.get());
  }

  subscribe(fn: Sub): () => void {
    this.subs.add(fn);
    return () => this.subs.delete(fn);
  }

  private pushToAudio(): void {
    audio.setVolumes({ master: this.state.master, music: this.state.music, sfx: this.state.sfx, muted: this.state.muted });
    setHapticsEnabled(this.state.haptics);
  }

  private load(): Settings {
    try {
      const raw = typeof localStorage !== 'undefined' && localStorage.getItem(KEY);
      if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {
      /* ignore */
    }
    return { ...DEFAULTS };
  }
  private save(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.state));
    } catch {
      /* ignore */
    }
  }
}

export const settings = new SettingsStore();

// ── Fullscreen helper ──────────────────────────────────────────
export function toggleFullscreen(): void {
  if (typeof document === 'undefined') return;
  const doc = document as Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => void };
  const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
  if (document.fullscreenElement || doc.webkitFullscreenElement) {
    (document.exitFullscreen ?? doc.webkitExitFullscreen)?.call(document);
  } else {
    (el.requestFullscreen ?? el.webkitRequestFullscreen)?.call(el);
  }
}
