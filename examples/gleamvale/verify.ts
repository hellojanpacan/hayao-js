// Gleamvale verify suite: the full combat run is winnable without dying, the
// key/door gate is real, enemies stay contained, and it all replays.

import { checkDeterministic, createWorld } from '@hayao';
import { initialGv, stepGv, ROOM_H, ROOM_W } from './logic';
import { createBot, FULL_RUN, type BotProbe } from './bot';
import { gleamvaleGame } from './game';
import type { VerifyContext } from '../../scripts/verify';

export default async function verify(t: VerifyContext) {
  // 1. Full combat run — bot survives to the Heart with 0 deaths.
  const world = createWorld(gleamvaleGame);
  const bot = createBot(FULL_RUN);
  const log: string[][] = [];
  let frames = -1;
  let minHp = 99;
  let contained = true;
  for (let f = 0; f < 10800; f++) {
    const p = world.probe() as unknown as BotProbe & { deaths: number };
    minHp = Math.min(minHp, p.hp);
    for (const e of p.enemies) if (e.x < 0 || e.x > ROOM_W || e.y < 0 || e.y > ROOM_H) contained = false;
    if (p.won) {
      frames = f;
      break;
    }
    const a = bot(p);
    log.push(a);
    world.step(a);
  }
  const deaths = (world.probe() as { deaths: number }).deaths;
  t.check(
    frames >= 0 && deaths === 0 ? `full combat run wins in ${(frames / 60).toFixed(1)}s, 0 deaths (lowest hp: ${minHp})` : `run ${frames < 0 ? 'DID NOT finish' : `won with ${deaths} death(s)`}`,
    frames >= 0 && deaths === 0,
  );
  t.check('enemies never escape their room bounds', contained);

  // 2. Negative gate proof — without the key, the door bars room 3.
  {
    const s = initialGv();
    s.room = 1;
    s.x = 640;
    s.y = 560;
    s.rooms[1].enemies.forEach((e) => (e.hp = 0)); // empty the room; test ONLY the door
    for (let f = 0; f < 600; f++) stepGv(s, { moveX: 0, moveY: 1, attack: false }, 1 / 60);
    t.check(`keyless push against the door stays in Shrine Court (room=${s.room})`, s.room === 1);
    // …and with a key it opens.
    s.keys = 1;
    for (let f = 0; f < 600 && s.room === 1; f++) stepGv(s, { moveX: 0, moveY: 1, attack: false }, 1 / 60);
    t.check(`with the key the same push reaches the Heart Vault (room=${s.room})`, s.room === 3);
  }

  // 3. i-frames: a second hit inside the grace window does no damage.
  {
    const s = initialGv();
    s.hp = 3;
    s.iframes = 0;
    const before = s.hp;
    // Teleport a chaser onto the player twice in rapid succession.
    s.rooms[0].enemies[0].x = s.x;
    s.rooms[0].enemies[0].y = s.y;
    stepGv(s, { moveX: 0, moveY: 0, attack: false }, 1 / 60);
    for (let i = 0; i < 6; i++) stepGv(s, { moveX: 0, moveY: 0, attack: false }, 1 / 60); // hit-stop drains
    s.rooms[0].enemies[0].x = s.x;
    s.rooms[0].enemies[0].y = s.y;
    stepGv(s, { moveX: 0, moveY: 0, attack: false }, 1 / 60);
    t.check(`i-frames absorb the follow-up hit (hp ${before}→${s.hp})`, s.hp === before - 1);
  }

  // 4. Determinism over the winning input log.
  const rep = checkDeterministic(() => createWorld(gleamvaleGame), { frames: log });
  t.check(rep.ok ? 'combat sim is deterministic across runs' : `diverged at frame ${rep.divergedAt}`, rep.ok);
}
