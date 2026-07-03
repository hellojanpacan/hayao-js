// A reactive playthrough bot: executes a semantic plan (walk / jump / dashJump /
// drop / waitPlat / ride) by reading the probe each frame and emitting actions.
// Far more robust than open-loop frame scripts for real-time movement — this is
// how a platformer's critical path becomes a headless proof.

import { moverX } from './logic';
import { LEVELS } from './levels';

export type BotStep =
  | { kind: 'walk'; x: number }
  | { kind: 'jump'; x: number; hold?: number }
  | { kind: 'dashJump'; x: number; hold?: number }
  | { kind: 'drop' }
  | { kind: 'waitPlat'; mover: number; xMax: number }
  | { kind: 'ride'; mover: number; until: number };

export interface BotProbe {
  x: number;
  y: number;
  vx: number;
  vy: number;
  onGround: boolean;
  time: number;
  level: number;
}

export interface Bot {
  (p: BotProbe): string[];
  /** Current plan step index (for tracing/diagnostics). */
  stepIndex(): number;
}

/** Stateful step function: call once per frame with the probe; returns actions. */
export function createBot(plan: BotStep[]): Bot {
  let i = 0;
  let phase = 0; // per-step progress marker
  let frames = 0; // frames spent in current step (for holds/timeouts)
  let dropY = 0; // y at the start of a drop step

  const steer = (px: number, tx: number, out: string[], dead = 6) => {
    if (px < tx - dead) out.push('right');
    else if (px > tx + dead) out.push('left');
  };

  const fn = (p: BotProbe): string[] => {
    const out: string[] = [];
    const step = plan[i];
    if (!step) return out;
    frames++;
    const next = () => {
      i++;
      phase = 0;
      frames = 0;
    };

    switch (step.kind) {
      case 'walk': {
        steer(p.x, step.x, out);
        if (Math.abs(p.x - step.x) <= 8 && p.onGround) next();
        break;
      }
      case 'jump': {
        const hold = step.hold ?? 14;
        if (phase === 0) {
          // Press on the ground once moving — jumping the same frame you land
          // (vx ≈ 0 after a walk-back) launches with no horizontal speed. If
          // already at run speed (arrived via walk), jump immediately: waiting
          // here would carry the player past the takeoff point.
          steer(p.x, step.x, out);
          const toward = Math.sign(step.x - p.x);
          if (p.onGround && (frames >= 8 || p.vx * toward > 200)) {
            out.push('jump');
            phase = 1;
            frames = 0;
          }
        } else {
          if (frames <= hold) out.push('jump');
          steer(p.x, step.x, out);
          if (frames > 4 && p.onGround && Math.abs(p.x - step.x) <= 24) next();
        }
        break;
      }
      case 'dashJump': {
        const hold = step.hold ?? 10;
        if (phase === 0) {
          if (p.onGround) {
            out.push('jump');
            phase = 1;
            frames = 0;
          }
          steer(p.x, step.x, out, 2);
        } else if (phase === 1) {
          if (frames <= hold) out.push('jump');
          steer(p.x, step.x, out, 2);
          if (p.vy > -160) {
            out.push('dash'); // near apex: dash toward the target
            phase = 2;
          }
        } else {
          steer(p.x, step.x, out, 2);
          if (frames > 10 && p.onGround && Math.abs(p.x - step.x) <= 20) next();
        }
        break;
      }
      case 'drop': {
        if (phase === 0) {
          phase = 1;
          frames = 0;
          dropY = p.y;
        }
        if (frames <= 8) out.push('down');
        // Only complete when we verifiably fell through (not silently failed).
        else if (p.onGround && p.y > dropY + 24) next();
        break;
      }
      case 'waitPlat': {
        const m = LEVELS[p.level].movers[step.mover];
        const x = moverX(m, p.time);
        const xPrev = moverX(m, Math.max(0, p.time - 1 / 60));
        if (x <= step.xMax && x >= xPrev) next(); // near left end AND heading right
        break;
      }
      case 'ride': {
        const m = LEVELS[p.level].movers[step.mover];
        const cx = moverX(m, p.time) + m.w / 2;
        steer(p.x, cx, out, 10);
        if (p.x >= step.until) next();
        break;
      }
    }
    return out;
  };
  const bot = fn as Bot;
  bot.stepIndex = () => i;
  return bot;
}

/** Per-level critical-path plans. Levels are proven by running these headlessly. */
export const PLANS: BotStep[][] = [
  // 1 · First Steps — two spike pits.
  [{ kind: 'walk', x: 340 }, { kind: 'jump', x: 530 }, { kind: 'walk', x: 700 }, { kind: 'jump', x: 910 }, { kind: 'walk', x: 1180 }],
  // 2 · Leap of Faith — wider pits.
  [{ kind: 'walk', x: 230 }, { kind: 'jump', x: 450 }, { kind: 'walk', x: 620 }, { kind: 'jump', x: 860 }, { kind: 'walk', x: 1180 }],
  // 3 · The Shard — drop through, fetch, leap the spike stretch, climb, gate.
  [
    { kind: 'walk', x: 656 },
    { kind: 'drop' },
    // Air drift carries the fall ~70px right of the drop point (low airFriction
    // preserves momentum by design) — walk back through the shard, then line up.
    { kind: 'walk', x: 640 },
    { kind: 'walk', x: 725 },
    { kind: 'jump', x: 928, hold: 16 },
    { kind: 'jump', x: 992, hold: 12 },
    { kind: 'jump', x: 1088, hold: 12 },
    { kind: 'jump', x: 1108, hold: 16 },
    { kind: 'walk', x: 1170 },
  ],
  // 4 · Bolt — jump + apex dash across the chasm.
  [{ kind: 'walk', x: 430 }, { kind: 'dashJump', x: 730 }, { kind: 'walk', x: 1140 }],
  // 5 · Spike Garden — rhythm hops.
  [
    { kind: 'walk', x: 180 },
    { kind: 'jump', x: 360 },
    { kind: 'jump', x: 555 },
    { kind: 'jump', x: 745 },
    { kind: 'jump', x: 935 },
    { kind: 'walk', x: 1180 },
  ],
  // 6 · Summit — board the lift, ride through the shard, hop off, gate.
  [
    { kind: 'walk', x: 250 },
    { kind: 'waitPlat', mover: 0, xMax: 310 },
    { kind: 'walk', x: 350 },
    { kind: 'ride', mover: 0, until: 700 },
    { kind: 'jump', x: 980, hold: 14 },
    { kind: 'walk', x: 1140 },
  ],
];
