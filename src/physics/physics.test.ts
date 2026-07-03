// The platforming canon, proven by pumping fixed steps in Node — exactly the
// engine's pitch: game feel as unit-testable state transitions.

import { describe, expect, it } from 'vitest';
import { TILE, tilemapFromAscii, asciiEntities, tileAt } from './tilemap';
import { moveRect, rectBlocked } from './aabb';
import { DEFAULT_PLATFORMER, PAD_NEUTRAL, createPlatformerState, jumpDistance, jumpHeight, stepPlatformer, type PadInput, type Platform } from './platformer';

const DT = 1 / 60;
const cfg = DEFAULT_PLATFORMER;

// A 12×40-tile room, sealed, floor at row 10 (y=320).
const room = (extra: string[] = []) =>
  tilemapFromAscii([
    '########################################',
    '#                                      #',
    '#                                      #',
    '#                                      #',
    '#                                      #',
    '#                                      #',
    '#                                      #',
    '#                                      #',
    '#                                      #',
    '#                                      #',
    '########################################',
    ...extra,
  ]);

const spawn = (x = 100) => {
  const s = createPlatformerState(x, 320 - cfg.height);
  s.onGround = true;
  return s;
};

const pad = (p: Partial<PadInput>): PadInput => ({ ...PAD_NEUTRAL, ...p });
const pump = (s: ReturnType<typeof spawn>, map: ReturnType<typeof room>, input: PadInput, frames: number, platforms: Platform[] = []) => {
  const evs = [];
  for (let i = 0; i < frames; i++) {
    evs.push(stepPlatformer(s, i === 0 ? input : { ...input, jumpPressed: false, dashPressed: false }, DT, map, cfg, platforms));
  }
  return evs;
};

describe('tilemap', () => {
  it('parses ascii, OOB is solid, entities extracted', () => {
    const map = tilemapFromAscii(['#-^', ' @ ']);
    expect(tileAt(map, 0, 0)).toBe(TILE.SOLID);
    expect(tileAt(map, 1, 0)).toBe(TILE.ONEWAY);
    expect(tileAt(map, 2, 0)).toBe(TILE.HAZARD);
    expect(tileAt(map, -1, 0)).toBe(TILE.SOLID);
    expect(tileAt(map, 0, 9)).toBe(TILE.SOLID);
    const ents = asciiEntities(['#-^', ' @ ']);
    expect(ents).toEqual([{ char: '@', tx: 1, ty: 1, x: 48, y: 48 }]);
  });
});

describe('aabb moveRect', () => {
  it('clamps to walls and floors exactly', () => {
    const map = room();
    // Fall onto the floor from above.
    const down = moveRect(map, { x: 100, y: 250, w: 20, h: 28 }, 0, 100);
    expect(down.y).toBe(320 - 28);
    expect(down.onFloor).toBe(true);
    // Run into the left wall.
    const left = moveRect(map, { x: 100, y: 292, w: 20, h: 28 }, -200, 0);
    expect(left.x).toBe(32);
    expect(left.onWallLeft).toBe(true);
  });

  it('one-way platforms block only from above; drop-through works', () => {
    const map = tilemapFromAscii(['          ', '          ', '   ----   ', '          ', '##########']);
    // Landing from above stops on the platform (row 2, top y=64).
    const land = moveRect(map, { x: 100, y: 20, w: 20, h: 28 }, 0, 100);
    expect(land.y).toBe(64 - 28);
    expect(land.onFloor).toBe(true);
    // Jumping up through it passes.
    const up = moveRect(map, { x: 100, y: 80, w: 20, h: 28 }, 0, -60);
    expect(up.hitY).toBe(false);
    // Drop-through falls past it.
    const drop = moveRect(map, { x: 100, y: 64 - 28, w: 20, h: 28 }, 0, 40, { dropThrough: true });
    expect(drop.y).toBe(64 - 28 + 40);
  });

  it('no tunneling at high speed', () => {
    const map = room();
    const res = moveRect(map, { x: 60, y: 292, w: 20, h: 28 }, 5000, 0);
    expect(res.x).toBe(40 * 32 - 32 - 20); // clamped at right wall
  });
});

describe('platformer canon', () => {
  it('runs, jumps, and lands with variable height (early release = lower apex)', () => {
    const map = room();
    // Full hold.
    const sFull = spawn();
    pump(sFull, map, pad({ jumpPressed: true, jumpHeld: true }), 1);
    let minYFull = sFull.y;
    for (let i = 0; i < 90; i++) {
      stepPlatformer(sFull, pad({ jumpHeld: true }), DT, map, cfg);
      minYFull = Math.min(minYFull, sFull.y);
    }
    // Tap (release after 4 frames).
    const sTap = spawn();
    pump(sTap, map, pad({ jumpPressed: true, jumpHeld: true }), 4);
    let minYTap = sTap.y;
    for (let i = 0; i < 90; i++) {
      stepPlatformer(sTap, PAD_NEUTRAL, DT, map, cfg);
      minYTap = Math.min(minYTap, sTap.y);
    }
    expect(sFull.onGround).toBe(true); // both land again
    expect(sTap.onGround).toBe(true);
    // Full jump rises well over a tile higher than the tap.
    expect(minYTap - minYFull).toBeGreaterThan(40);
  });

  it('coyote time: jump still works within the grace window after leaving a ledge', () => {
    // Ledge: floor only under x<192 (6 tiles), then a DEEP pit (the 20-frame
    // case must still be airborne, not standing at the bottom).
    const map = tilemapFromAscii([
      '####################',
      '#                  #',
      '#                  #',
      '######             #',
      '#    #             #',
      '#    #             #',
      '#    #             #',
      '#    #             #',
      '#    #             #',
      '#    #             #',
      '####################',
    ]);
    const run = (graceFrames: number) => {
      const s = createPlatformerState(160, 96 - cfg.height);
      s.onGround = true;
      // Run right off the ledge…
      while (s.onGround) stepPlatformer(s, pad({ moveX: 1 }), DT, map, cfg);
      // …airborne now; wait, then try to jump.
      for (let i = 0; i < graceFrames; i++) stepPlatformer(s, PAD_NEUTRAL, DT, map, cfg);
      const ev = stepPlatformer(s, pad({ jumpPressed: true, jumpHeld: true }), DT, map, cfg);
      return ev.jumped;
    };
    expect(run(2)).toBe(true); // inside coyote window
    expect(run(20)).toBe(false); // way past it
  });

  it('jump buffering: press shortly before landing → jump fires on touchdown', () => {
    const map = room();
    const s = spawn();
    // Fall from height.
    s.y = 100;
    s.onGround = false;
    // Wait until close to the floor, then press jump early.
    while (s.y < 250) stepPlatformer(s, PAD_NEUTRAL, DT, map, cfg);
    stepPlatformer(s, pad({ jumpPressed: true, jumpHeld: true }), DT, map, cfg);
    let jumped = false;
    for (let i = 0; i < 6 && !jumped; i++) jumped = stepPlatformer(s, pad({ jumpHeld: true }), DT, map, cfg).jumped;
    expect(jumped).toBe(true);
  });

  it('halved-gravity apex: gravity is reduced near the peak while jump held', () => {
    const map = room();
    const s = spawn();
    stepPlatformer(s, pad({ jumpPressed: true, jumpHeld: true }), DT, map, cfg);
    let apexFrames = 0;
    for (let i = 0; i < 120 && !s.onGround; i++) {
      stepPlatformer(s, pad({ jumpHeld: true }), DT, map, cfg);
      if (Math.abs(s.vy) < cfg.apexThreshold) apexFrames++;
    }
    // With halved gravity the apex band lasts ≥ the un-halved analytic time.
    const unhalved = ((2 * cfg.apexThreshold) / cfg.gravity) * 60;
    expect(apexFrames).toBeGreaterThan(unhalved);
  });

  it('jump corner correction: bonking a ceiling edge slips sideways instead of killing the jump', () => {
    // Ceiling block overhead with its edge just past the player's left side.
    const map = tilemapFromAscii([
      '####################',
      '#                  #',
      '#      ####        #',
      '#                  #',
      '#                  #',
      '####################',
    ]);
    // Player under the right edge of the block (block spans x 224..352).
    const x = 352 - 6; // 6px of the 22px body under the ceiling — corner case
    const s = createPlatformerState(x, 160 - cfg.height);
    s.onGround = true;
    stepPlatformer(s, pad({ jumpPressed: true, jumpHeld: true }), DT, map, cfg);
    let minY = s.y;
    for (let i = 0; i < 40; i++) {
      stepPlatformer(s, pad({ jumpHeld: true }), DT, map, cfg);
      minY = Math.min(minY, s.y);
    }
    // Without correction the jump dies at the block bottom (y=96-h+…): apex ≈ 96.
    // With correction the body slips right and rises past the block's underside.
    expect(minY).toBeLessThan(96 - cfg.height - 4);
  });

  it('dash: bursts in the held direction (airborne), refills on landing', () => {
    const map = room();
    const s = createPlatformerState(200, 150);
    s.onGround = false;
    const ev = stepPlatformer(s, pad({ moveX: 1, dashPressed: true }), DT, map, cfg);
    expect(ev.dashed).toBe(true);
    expect(s.vx).toBeCloseTo(cfg.dashSpeed);
    expect(s.dashesLeft).toBe(0); // spent while airborne
    for (let i = 0; i < 60; i++) stepPlatformer(s, PAD_NEUTRAL, DT, map, cfg);
    expect(s.onGround).toBe(true);
    expect(s.dashesLeft).toBe(cfg.dashCharges); // refilled on touchdown
  });

  it('dash corner correction: a horizontal dash clipping a block edge slips past it', () => {
    // Free-standing block; dash comes in barely clipping its bottom edge.
    const map = tilemapFromAscii([
      '####################',
      '#                  #',
      '#         ##       #',
      '#                  #',
      '#                  #',
      '####################',
    ]);
    // Block row 2: y 64..96. Body top at 96 - 8 → 8px of body clips the block.
    // Start close enough that the block is reached while the dash is live.
    const s = createPlatformerState(260, 96 - 8);
    s.onGround = false;
    stepPlatformer(s, pad({ moveX: 1, dashPressed: true }), DT, map, cfg);
    for (let i = 0; i < 7; i++) stepPlatformer(s, pad({ moveX: 1 }), DT, map, cfg);
    // Without correction it would stop at the block's left face (x=320-22=298).
    expect(s.x).toBeGreaterThan(320);
  });

  it('wall slide caps fall speed and wall jump kicks away from the wall', () => {
    const map = room();
    const s = createPlatformerState(33, 150); // hugging the left wall, airborne
    s.onGround = false;
    for (let i = 0; i < 40; i++) stepPlatformer(s, pad({ moveX: -1 }), DT, map, cfg);
    expect(s.vy).toBeLessThanOrEqual(cfg.wallSlideMaxFall + 1e-6); // sliding, not plummeting
    const ev = stepPlatformer(s, pad({ moveX: -1, jumpPressed: true, jumpHeld: true }), DT, map, cfg);
    expect(ev.wallJumped).toBe(true);
    expect(s.vx).toBeGreaterThan(0); // kicked rightward, away from wall
    expect(s.vy).toBeLessThan(0);
  });

  it('lift momentum storage: jumping off a moving platform keeps its velocity', () => {
    const map = room();
    // Platform moving right at 120 px/s, high above the floor.
    const plat: Platform = { x: 200, y: 200, w: 96, h: 12, vx: 120, vy: 0 };
    const s = createPlatformerState(220, 200 - cfg.height);
    // Settle onto the platform.
    for (let i = 0; i < 5; i++) {
      plat.x += plat.vx * DT;
      stepPlatformer(s, PAD_NEUTRAL, DT, map, cfg, [plat]);
    }
    expect(s.onGround).toBe(true);
    const carried = s.x;
    // One more settle frame proves the ride (body moves with the platform).
    plat.x += plat.vx * DT;
    stepPlatformer(s, PAD_NEUTRAL, DT, map, cfg, [plat]);
    expect(s.x).toBeGreaterThan(carried);
    // Jump straight up with no directional input…
    plat.x += plat.vx * DT;
    stepPlatformer(s, pad({ jumpPressed: true, jumpHeld: true }), DT, map, cfg, [plat]);
    // …and inherited horizontal momentum persists in the air.
    const x0 = s.x;
    for (let i = 0; i < 10; i++) stepPlatformer(s, pad({ jumpHeld: true }), DT, map, cfg);
    expect(s.x - x0).toBeGreaterThan(10);
  });

  it('air jumps: double jump extends height, refills on landing', () => {
    const map = room();
    const dj = { ...cfg, airJumps: 1 };
    const s = spawn();
    s.airJumpsLeft = 1;
    stepPlatformer(s, pad({ jumpPressed: true, jumpHeld: true }), DT, map, dj);
    let minY = s.y;
    let airJumped = false;
    for (let i = 0; i < 120 && !s.onGround; i++) {
      // Tap jump again near the first apex.
      const again = !airJumped && s.vy > -80;
      const ev = stepPlatformer(s, pad({ jumpHeld: true, jumpPressed: again }), DT, map, dj);
      if (ev.airJumped) airJumped = true;
      minY = Math.min(minY, s.y);
    }
    expect(airJumped).toBe(true);
    const singleApex = 320 - cfg.height - (cfg.jumpVelocity * cfg.jumpVelocity) / (2 * cfg.gravity);
    expect(minY).toBeLessThan(singleApex - 40); // well above a single jump
    expect(s.airJumpsLeft).toBe(1); // refilled on landing
  });

  it('hazards kill', () => {
    const map = tilemapFromAscii(['          ', '          ', '^^^^^^^^^^', '##########']);
    const s = createPlatformerState(100, 10);
    s.onGround = false;
    let died = false;
    for (let i = 0; i < 60 && !died; i++) died = stepPlatformer(s, PAD_NEUTRAL, DT, map, cfg).died;
    expect(died).toBe(true);
  });

  it('movement envelope is a true lower bound on the simulated controller', () => {
    const map = room();
    // Simulated max jump height.
    const s = spawn();
    stepPlatformer(s, pad({ jumpPressed: true, jumpHeld: true }), DT, map, cfg);
    let minY = s.y;
    for (let i = 0; i < 90 && !s.onGround; i++) {
      stepPlatformer(s, pad({ jumpHeld: true }), DT, map, cfg);
      minY = Math.min(minY, s.y);
    }
    const simHeight = 320 - cfg.height - minY;
    expect(simHeight).toBeGreaterThanOrEqual(jumpHeight(cfg));
    expect(simHeight).toBeLessThan(jumpHeight(cfg) * 1.5);
    // Simulated running-jump distance (run-up first, then jump at speed).
    const s2 = spawn(100);
    for (let i = 0; i < 30; i++) stepPlatformer(s2, pad({ moveX: 1 }), DT, map, cfg);
    const x0 = s2.x;
    stepPlatformer(s2, pad({ moveX: 1, jumpPressed: true, jumpHeld: true }), DT, map, cfg);
    for (let i = 0; i < 120 && !s2.onGround; i++) stepPlatformer(s2, pad({ moveX: 1, jumpHeld: true }), DT, map, cfg);
    expect(s2.x - x0).toBeGreaterThanOrEqual(jumpDistance(cfg));
  });

  it('rectBlocked probes match moveRect geometry', () => {
    const map = room();
    expect(rectBlocked(map, 100, 292, 20, 28)).toBe(false);
    expect(rectBlocked(map, 10, 292, 20, 28)).toBe(true); // inside left wall
  });
});
