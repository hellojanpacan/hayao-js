// Browser capture seam. Because the sim is headless-native — hayao owns the
// clock and never touches document.hasFocus — this is ~30 lines, not the ~100 a
// canvas engine needs. Exposes window.__hayao for scripted browser sessions and
// aesthetic screenshots. Enable with ?capture=1.

import type { World } from '../world';

export interface CaptureTarget {
  readonly world: World;
  /** Advance one fixed step with the given actions and render. */
  stepOnce(actions?: string[]): void;
  /** Current frame as an SVG string (a vector screenshot). */
  renderSVG(): string;
  setPaused(paused: boolean): void;
}

export interface HayaoCapture {
  pump(frames: number, actions?: string[]): Record<string, unknown>;
  probe(): Record<string, unknown>;
  hash(): string;
  shot(): string;
  save(path: string): Promise<boolean>;
  key(type: 'keydown' | 'keyup', code: string): void;
  readonly world: World;
}

export function isCaptureMode(): boolean {
  return typeof location !== 'undefined' && new URLSearchParams(location.search).has('capture');
}

/** Install window.__hayao for scripted browser verification. */
export function installCapture(target: CaptureTarget): HayaoCapture {
  const api: HayaoCapture = {
    pump(frames, actions = []) {
      target.setPaused(true);
      for (let i = 0; i < frames; i++) target.stepOnce(actions);
      return target.world.probe();
    },
    probe: () => target.world.probe(),
    hash: () => target.world.hash(),
    shot: () => target.renderSVG(),
    async save(path) {
      const svg = target.renderSVG();
      try {
        const res = await fetch('/__shot', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ path, svg }),
        });
        return res.ok;
      } catch {
        return false;
      }
    },
    key(type, code) {
      document.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
    },
    get world() {
      return target.world;
    },
  };
  (globalThis as unknown as { __hayao: HayaoCapture }).__hayao = api;
  return api;
}
