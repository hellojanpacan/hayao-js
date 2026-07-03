// Gleamvale combat bot: top-down steering — walk, fight (hunt & slash with
// kiting), collect, goRoom. Third distinct bot in the campaign; the shared
// shape (plan interpreter over probe → actions) is now proven and should be
// promoted to the engine after this game's lessons are folded in.

import { dhypot } from '@hayao';
export type BotStep =
  | { kind: 'walk'; x: number; y: number }
  | { kind: 'fight' } // until the current room is clear
  | { kind: 'goRoom'; x: number; y: number; room: number };

export interface EnemyView {
  kind: string;
  x: number;
  y: number;
  state: string;
}

export interface BotProbe {
  x: number;
  y: number;
  room: number;
  hp: number;
  enemiesAlive: number;
  enemies: EnemyView[];
  won: boolean;
}

export interface Bot {
  (p: BotProbe): string[];
  stepIndex(): number;
}

export function createBot(plan: BotStep[]): Bot {
  let i = 0;
  let mode = 'hunt'; // fight submode: hunt | strike | kite
  let t = 0;

  const steerTo = (p: BotProbe, tx: number, ty: number, out: string[], dead = 8) => {
    if (p.x < tx - dead) out.push('right');
    else if (p.x > tx + dead) out.push('left');
    if (p.y < ty - dead) out.push('down');
    else if (p.y > ty + dead) out.push('up');
  };

  const fn = (p: BotProbe): string[] => {
    const out: string[] = [];
    const step = plan[i];
    if (!step) return out;
    t++;
    const next = () => {
      i++;
      mode = 'hunt';
      t = 0;
    };

    switch (step.kind) {
      case 'walk': {
        steerTo(p, step.x, step.y, out);
        if (Math.abs(p.x - step.x) <= 12 && Math.abs(p.y - step.y) <= 12) next();
        break;
      }
      case 'goRoom': {
        if (p.room === step.room) {
          next();
          break;
        }
        steerTo(p, step.x, step.y, out, 2);
        break;
      }
      case 'fight': {
        if (p.enemiesAlive === 0) {
          next();
          break;
        }
        // Nearest enemy; dodge a dashing darter by fighting someone else.
        const sorted = [...p.enemies].sort((a, b) => dhypot(a.x - p.x, a.y - p.y) - dhypot(b.x - p.x, b.y - p.y));
        const target = sorted.find((e) => !(e.kind === 'darter' && e.state === 'dash')) ?? sorted[0];
        const d = dhypot(target.x - p.x, target.y - p.y);
        if (mode === 'hunt') {
          steerTo(p, target.x, target.y, out, 4);
          if (d < 46) {
            mode = 'strike';
            t = 0;
          }
        } else if (mode === 'strike') {
          // Face the target while pressing attack once.
          steerTo(p, target.x, target.y, out, 4);
          if (t === 1) out.push('attack');
          if (t > 2) {
            mode = 'kite';
            t = 0;
          }
        } else {
          // Back off during our own cooldown / their retaliation window.
          steerTo(p, p.x + (p.x - target.x), p.y + (p.y - target.y), out, 4);
          if (t > 14) {
            mode = 'hunt';
            t = 0;
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

/** Critical path: clear Meadow Gate → Barrow Pit (key) → Shrine Court → door → Heart Vault. */
export const FULL_RUN: BotStep[] = [
  { kind: 'fight' }, // room 0 chaser
  { kind: 'goRoom', x: 640, y: 700, room: 2 }, // south hole to Barrow Pit
  { kind: 'fight' },
  { kind: 'walk', x: 640, y: 352 }, // the key
  { kind: 'goRoom', x: 640, y: 6, room: 0 }, // back up
  { kind: 'goRoom', x: 1274, y: 336, room: 1 }, // east to Shrine Court
  { kind: 'fight' },
  { kind: 'walk', x: 640, y: 620 }, // approach the door (opens on touch radius)
  { kind: 'goRoom', x: 640, y: 700, room: 3 }, // through the opened door
  { kind: 'fight' },
  { kind: 'walk', x: 656, y: 448 }, // the Heart
];
