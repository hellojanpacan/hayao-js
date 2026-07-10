// Last-input-device tracking — the "press Ⓐ" vs "press Space" problem. A tiny
// host-side observer that watches keyboard/pointer DOM events plus gamepad
// activity and reports which device the player is CURRENTLY using, so prompts
// and menu glyphs can follow them across a mid-game switch.
//
// View-layer only: the sim must never read this (it is wall-clock-adjacent
// host state). Drive DOM prompt text or cosmetic HUD glyphs with it.

import { Signal } from '../core/events';
import type { InputState } from './actions';

export type InputDeviceKind = 'keyboard' | 'mouse' | 'touch' | 'gamepad';

export interface DeviceTrackerOptions {
  /** Starting device before any input is seen. Default 'keyboard'. */
  initial?: InputDeviceKind;
  /** Stick magnitude that counts as gamepad activity. Default 0.3. */
  stickThreshold?: number;
}

/**
 * Tracks the device the player last touched. Register it like any input source
 * (`handle.addSource(tracker)`) so gamepad polling rides the existing per-step
 * sample; keyboard/mouse/touch arrive via window listeners.
 *
 *   const tracker = new InputDeviceTracker();
 *   handle.addSource(tracker);
 *   tracker.changed.connect((d) => updatePromptGlyphs(d));
 *   promptEl.textContent = tracker.current === 'gamepad' ? 'Press Ⓐ' : 'Press Space';
 */
export class InputDeviceTracker {
  /** The device the player last produced input on. */
  current: InputDeviceKind;
  /** Fires on every device SWITCH (not on every input). */
  readonly changed = new Signal<InputDeviceKind>();

  private stickThreshold: number;
  private onKey: () => void;
  private onPointer: (e: PointerEvent) => void;

  constructor(opts: DeviceTrackerOptions = {}) {
    this.current = opts.initial ?? 'keyboard';
    this.stickThreshold = opts.stickThreshold ?? 0.3;
    this.onKey = () => this.note('keyboard');
    this.onPointer = (e) => this.note(e.pointerType === 'touch' ? 'touch' : 'mouse');
    globalThis.addEventListener?.('keydown', this.onKey);
    globalThis.addEventListener?.('pointerdown', this.onPointer as EventListener);
  }

  /** Record activity on a device; emits `changed` when it differs from current. */
  note(device: InputDeviceKind): void {
    if (device === this.current) return;
    this.current = device;
    this.changed.emit(device);
  }

  /** InputSource contract: polls gamepads for activity. Writes no axes. */
  sample(_input: InputState): void {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    for (const pad of navigator.getGamepads()) {
      if (!pad) continue;
      for (const b of pad.buttons) {
        if (b.pressed) {
          this.note('gamepad');
          return;
        }
      }
      for (const a of pad.axes) {
        if (Math.abs(a) > this.stickThreshold) {
          this.note('gamepad');
          return;
        }
      }
    }
  }

  dispose(): void {
    globalThis.removeEventListener?.('keydown', this.onKey);
    globalThis.removeEventListener?.('pointerdown', this.onPointer as EventListener);
    this.changed.clear();
  }
}
