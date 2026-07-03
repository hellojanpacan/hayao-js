// Sproutveil bot: the shard-ascent waypoint pattern extended for rooms —
// goRoom (steer until the room changes), exitUp (jump+DJ through a ceiling
// hole), dj-aware jumps with landing retry. Second use of the pattern; if a
// third genre needs it, promote to the engine (rule of three).

export type BotStep =
  | { kind: 'walk'; x: number }
  | { kind: 'jump'; x: number; y?: number; hold?: number; dj?: boolean }
  | { kind: 'dashJump'; x: number; hold?: number }
  | { kind: 'goRoom'; x: number; room: number }
  | { kind: 'exitUp'; x: number; room: number };

export interface BotProbe {
  x: number;
  y: number;
  vx: number;
  vy: number;
  onGround: boolean;
  room: number;
  won: boolean;
}

export interface Bot {
  (p: BotProbe): string[];
  stepIndex(): number;
}

export function createBot(plan: BotStep[]): Bot {
  let i = 0;
  let phase = 0;
  let frames = 0;
  let djUsed = false;
  let djFrame = 0;
  let traverse = false; // current jump style: gap-cross (steer hard) vs ledge-top (go vertical)

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
      djUsed = false;
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
          const toward = Math.sign(step.x - p.x);
          const dist = Math.abs(p.x - step.x);
          // Two jump styles: a distant raised target is a gap-cross (full
          // speed, steer all the way); a close one is a ledge-top mount, which
          // must take off near-vertical — residual momentum (low airFriction)
          // otherwise drifts the body under the ledge mid-rise.
          traverse = dist > 150;
          const speedCap = step.y !== undefined && !traverse ? 60 : 250;
          const fast = p.vx * toward > speedCap;
          if (p.onGround && fast && dist < 160) {
            // Too hot for a close target: brake, or the jump overshoots.
            out.push(toward > 0 ? 'left' : 'right');
            break;
          }
          steer(p.x, step.x, out);
          if (p.onGround && (frames >= 8 || (fast && dist >= 160) || toward === 0)) {
            out.push('jump');
            phase = 1;
            frames = 0;
          }
        } else {
          if (frames <= hold) out.push('jump');
          // Double jump after the apex — after ≥1 released frame (or
          // justPressed sees no edge), then HELD ~12 frames (or the
          // variable-height cut slashes the air jump to 40%).
          else if (step.dj && !djUsed && p.vy > -60 && frames > hold + 1) {
            out.push('jump');
            djUsed = true;
            djFrame = frames;
          } else if (djUsed && frames - djFrame <= 12) out.push('jump');
          // Ledge-top mounts rise vertically until clear of the target's top,
          // THEN steer in; gap-crosses steer the whole flight.
          if (traverse || step.y === undefined || p.y < step.y - 8 || p.onGround) steer(p.x, step.x, out);
          if (frames > 4 && p.onGround) {
            const atX = Math.abs(p.x - step.x) <= 24;
            const atY = step.y === undefined || p.y < step.y + 16;
            if (atX && atY) next();
            else {
              phase = 0; // landed wrong — retry from here
              frames = 0;
              djUsed = false;
            }
          }
        }
        break;
      }
      case 'dashJump': {
        const hold = step.hold ?? 10;
        if (phase === 0) {
          steer(p.x, step.x, out, 2);
          const toward = Math.sign(step.x - p.x);
          if (p.onGround && (frames >= 8 || p.vx * toward > 200)) {
            out.push('jump');
            phase = 1;
            frames = 0;
          }
        } else if (phase === 1) {
          if (frames <= hold) out.push('jump');
          steer(p.x, step.x, out, 2);
          if (p.vy > -160) {
            out.push('dash');
            phase = 2;
          }
        } else {
          steer(p.x, step.x, out, 2);
          if (frames > 10 && p.onGround && Math.abs(p.x - step.x) <= 30) next();
        }
        break;
      }
      case 'goRoom': {
        if (p.room === step.room) {
          next();
          break;
        }
        steer(p.x, step.x, out, 0);
        break;
      }
      case 'exitUp': {
        if (p.room === step.room) {
          next();
          break;
        }
        steer(p.x, step.x, out, 4);
        if (Math.abs(p.x - step.x) <= 10) {
          if (p.onGround && frames % 8 === 0) {
            out.push('jump');
            djUsed = false;
          } else if (!p.onGround) {
            if (frames % 8 < 5) out.push('jump'); // hold for height
            if (!djUsed && p.vy > -60) {
              out.push('jump');
              djUsed = true;
            }
          }
        }
        break;
      }
    }
    return out;
  };
  const bot = fn as Bot;
  bot.stepIndex = () => i;
  return bot;
}

/**
 * The full critical path: Atrium → Roots (seed) → back up → Shaft (boots,
 * ledge climb) → Crown (dash gap) → Heart. Coordinates are room-local.
 */
export const FULL_RUN: BotStep[] = [
  // Atrium: drop through the floor hole (cols 8-9 → x 256-320).
  { kind: 'goRoom', x: 288, room: 2 },
  // Roots: land on step5, walk off right, cross the second spike patch, grab J.
  { kind: 'walk', x: 380 },
  { kind: 'jump', x: 620, hold: 14 }, // over spikes at x 448-544
  { kind: 'walk', x: 912 }, // seed at x=912
  // Climb the staircase (3-tile rises; DJ in hand makes retries forgiving).
  { kind: 'walk', x: 600 },
  { kind: 'jump', x: 400, hold: 16, dj: true }, // back over the spikes (448-544) — land PAST them
  { kind: 'walk', x: 380 }, // stay clear of step1's overhang before jumping
  { kind: 'jump', x: 290, y: 512, dj: true }, // step1 (cols 6-9)
  { kind: 'jump', x: 130, y: 416, dj: true }, // step2 (cols 2-5)
  { kind: 'jump', x: 240, y: 320, dj: true }, // step3
  { kind: 'jump', x: 130, y: 224, dj: true }, // step4
  { kind: 'jump', x: 240, y: 128, dj: true }, // step5
  // Jump + DJ up through the ceiling hole (x 256-320).
  { kind: 'exitUp', x: 288, room: 0 },
  // Atrium: run right through the lower opening into the Shaft.
  { kind: 'goRoom', x: 1279, room: 1 },
  // Shaft: grab the boots, then the DJ ledge climb.
  { kind: 'walk', x: 944 },
  // Approach each ledge from BESIDE it (jumping from underneath bonks its lip).
  { kind: 'walk', x: 520 },
  { kind: 'jump', x: 390, y: 480, dj: true }, // ledge1 (cols 8-14)
  { kind: 'walk', x: 450 }, // to ledge1's edge — a full-width flight is needed
  { kind: 'jump', x: 700, y: 352, dj: true }, // ledge2 (cols 20-26)
  { kind: 'walk', x: 845 }, // to ledge2's edge
  { kind: 'jump', x: 1100, y: 224, dj: true }, // ledge3 (cols 32-38)
  // Walk right through the top opening into the Crown.
  { kind: 'goRoom', x: 1279, room: 3 },
  // Crown: off the entry ledge, into the corridor, dash the gap, take the Heart.
  { kind: 'walk', x: 340 },
  { kind: 'walk', x: 690 },
  { kind: 'dashJump', x: 950 },
  { kind: 'walk', x: 1040 }, // heart at x=1040
];
