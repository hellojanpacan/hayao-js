// Haptic feedback — gamepad rumble + device vibration. COSMETIC OUTPUT ONLY,
// exactly like audio: triggered by game events, never read back by the sim, so
// it can't touch determinism. Browser-only with no-op guards; every call is
// fire-and-forget (haptics failing must never break a game).

let enabled = true;

/** Master haptics switch (a settings-menu toggle). Default on. */
export function setHapticsEnabled(on: boolean): void {
  enabled = on;
}

export function hapticsEnabled(): boolean {
  return enabled;
}

export interface RumbleOptions {
  /** Effect length in ms. Default 100. */
  durationMs?: number;
  /** Low-frequency (heavy) motor, 0..1. Default 1. */
  strong?: number;
  /** High-frequency (buzzy) motor, 0..1. Default 1. */
  weak?: number;
  /** Delay before the effect starts, ms. Default 0. */
  delayMs?: number;
  /** Gamepad index (0–3). Default: every connected pad. */
  gamepad?: number;
}

type RumbleActuator = { playEffect?: (kind: string, params: Record<string, number>) => Promise<unknown>; reset?: () => Promise<unknown> };
type PadWithRumble = Gamepad & { vibrationActuator?: RumbleActuator };

function pads(index?: number): PadWithRumble[] {
  if (typeof navigator === 'undefined' || !navigator.getGamepads) return [];
  const all = navigator.getGamepads();
  const live: PadWithRumble[] = [];
  for (let i = 0; i < all.length; i++) {
    const p = all[i] as PadWithRumble | null;
    if (p && (index === undefined || p.index === index)) live.push(p);
  }
  return live;
}

/**
 * Rumble connected gamepad(s) via the dual-rumble actuator; when no pad (or no
 * actuator) is available, fall back to device vibration (mobile) for the same
 * duration. Typical grammar: light tap `rumble({ durationMs: 60, strong: 0,
 * weak: 0.4 })`, heavy hit `rumble({ durationMs: 180, strong: 1, weak: 0.6 })`.
 */
export function rumble(opts: RumbleOptions = {}): void {
  if (!enabled) return;
  const durationMs = opts.durationMs ?? 100;
  const params = {
    duration: durationMs,
    startDelay: opts.delayMs ?? 0,
    strongMagnitude: Math.min(1, Math.max(0, opts.strong ?? 1)),
    weakMagnitude: Math.min(1, Math.max(0, opts.weak ?? 1)),
  };
  let played = false;
  for (const p of pads(opts.gamepad)) {
    const act = p.vibrationActuator;
    if (act?.playEffect) {
      act.playEffect('dual-rumble', params).catch(() => {});
      played = true;
    }
  }
  if (!played) vibrate(durationMs);
}

/**
 * Device vibration (mobile/tablet), Navigator.vibrate semantics: a duration in
 * ms or an on/off pattern like `[80, 40, 80]`. Silently a no-op on hardware
 * without a motor (all desktops).
 */
export function vibrate(pattern: number | number[]): void {
  if (!enabled) return;
  if (typeof navigator === 'undefined') return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Some browsers throw on vibrate without a user gesture — never our problem.
  }
}

/** Cut all haptics now (gamepad actuators reset + device vibration cancelled). */
export function stopHaptics(): void {
  for (const p of pads()) p.vibrationActuator?.reset?.()?.catch?.(() => {});
  if (typeof navigator !== 'undefined') {
    try {
      navigator.vibrate?.(0);
    } catch {
      /* see vibrate() */
    }
  }
}
