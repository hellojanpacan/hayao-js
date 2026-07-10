/**
 * The hayao.dev live demo — a 3-screen Celeste-like micro-platformer.
 *
 * Everything imports from @hayao (aliased to the monorepo engine source), and
 * the three "prompt edits" are feature flags in world.state that the chat pane
 * toggles at runtime:
 *
 *   mods.jumps — 3 jumps per screen + refresh crystals (avatar tint & jump
 *                pitch track the budget)
 *   mods.timer — a per-screen time limit (draining top bar + seconds readout)
 *   mods.cave  — dark-cave theme (palette swap + ambient darkness + glow
 *                lights on avatar, crystals and the goal)
 *
 * All eight combinations compose; the view rebuilds itself whenever a flag
 * (or the current screen) changes.
 */
import {
  defineGame,
  runBrowser,
  Node,
  Sprite,
  Text,
  Particles,
  PARTICLE_PRESETS,
  LightLayer,
  PointLight,
  tilemapFromAscii,
  tileAtPoint,
  createPlatformerState,
  stepPlatformer,
  DEFAULT_PLATFORMER,
  audio,
  showScreen,
  hideScreen,
  type GameHandle,
  type InputMap,
  type PadInput,
  type PlatformerConfig,
  type PlatformerState,
  type TilemapData,
  type World,
} from '@hayao';

// ── Feature flags (the "prompt edits") ──────────────────────────────────────
export interface DemoMods {
  jumps: boolean;
  timer: boolean;
  cave: boolean;
}

// ── Dimensions & movement ───────────────────────────────────────────────────
const TILE = 32;
const COLS = 20;
const ROWS = 12;
const W = COLS * TILE; // 640
const H = ROWS * TILE; // 384

const CFG: PlatformerConfig = {
  ...DEFAULT_PLATFORMER,
  width: 20,
  height: 26,
  runSpeed: 260,
  jumpVelocity: 620,
  gravity: 2000,
  coyoteTime: 0.11,
  jumpBuffer: 0.12,
  airJumps: 0,
  dashCharges: 0,
};

const INPUT: InputMap = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  jump: ['ArrowUp', 'Space', 'KeyW'],
};

// Tile ids match the engine's TILE constants: 0 empty, 1 solid, 2 one-way, 3 hazard.
const CHARS = { '.': 0, '#': 1, '-': 2, '^': 3 } as const;

// ── The three screens (20×12 ascii) ────────────────────────────────────────
interface ScreenDef {
  rows: string[];
  spawn: { x: number; y: number }; // px, feet on the floor
  crystals: { x: number; y: number }[]; // px centers (active only with mods.jumps)
  exit: 'right' | 'goal';
}

const feetY = (row: number): number => row * TILE - CFG.height;

const SCREENS: ScreenDef[] = [
  {
    rows: [
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '..........----......',
      '....................',
      '.....----...........',
      '..............^^^...',
      '####################',
    ],
    spawn: { x: 64, y: feetY(11) },
    crystals: [{ x: 12.5 * TILE, y: 5.5 * TILE }],
    exit: 'right',
  },
  {
    rows: [
      '....................',
      '....................',
      '....................',
      '....................',
      '..........----......',
      '....................',
      '......----.......---',
      '....................',
      '..----..............',
      '....................',
      '....^^^^^^^^^^^^^^^^',
      '####################',
    ],
    spawn: { x: 40, y: feetY(11) },
    crystals: [
      { x: 3.5 * TILE, y: 6.5 * TILE },
      { x: 11.5 * TILE, y: 2.5 * TILE },
    ],
    exit: 'right',
  },
  {
    rows: [
      '....................',
      '....................',
      '..............----..',
      '....................',
      '..........----......',
      '....................',
      '......----..........',
      '....................',
      '..----..............',
      '....................',
      '...^^^^^^^^^^^^^^^..',
      '####################',
    ],
    spawn: { x: 24, y: feetY(11) },
    crystals: [
      { x: 7.5 * TILE, y: 4.5 * TILE },
      { x: 12.5 * TILE, y: 2.5 * TILE },
    ],
    exit: 'goal',
  },
];

const MAPS: TilemapData[] = SCREENS.map((s) => tilemapFromAscii(s.rows, TILE, CHARS));
const GOAL = { x: 15.5 * TILE, y: 1.5 * TILE }; // pennant on screen 3's top ledge

const JUMP_BUDGET = 3;
const TIME_LIMIT = 12;
const CRYSTAL_RESPAWN = 4;

// ── Canonical state ─────────────────────────────────────────────────────────
interface DemoState {
  screen: number;
  p: PlatformerState;
  mods: DemoMods;
  rev: number; // bump → the view rebuilds next step
  jumpsLeft: number;
  crystals: number[]; // per-crystal respawn countdown (0 = active)
  timeLeft: number;
  deaths: number;
  won: boolean;
}

function spawnState(screen: number): PlatformerState {
  const s = SCREENS[screen].spawn;
  return createPlatformerState(s.x, s.y);
}

function initialState(): DemoState {
  return {
    screen: 0,
    p: spawnState(0),
    mods: { jumps: false, timer: false, cave: false },
    rev: 0,
    jumpsLeft: JUMP_BUDGET,
    crystals: SCREENS[0].crystals.map(() => 0),
    timeLeft: TIME_LIMIT,
    deaths: 0,
    won: false,
  };
}

// ── Themes ──────────────────────────────────────────────────────────────────
const THEME = {
  day: {
    bg: '#eef2f7',
    solid: '#337357',
    solidLine: '#2c6349',
    oneway: '#669bbc',
    hazard: '#e59500',
    dust: ['#c9d4e4', '#aebdd4'],
  },
  cave: {
    bg: '#0b0f1e',
    solid: '#252d4d',
    solidLine: '#1b2340',
    oneway: '#31406b',
    hazard: '#e59500',
    dust: ['#3a466e', '#2c3557'],
  },
};

const avatarFill = (st: DemoState): string => {
  if (!st.mods.jumps) return '#e59500';
  return ['#8b90a6', '#e59500', '#669bbc', '#337357'][Math.max(0, Math.min(3, st.jumpsLeft))];
};

// ── The game node (view + driver; all children are cosmetic) ────────────────
class DemoRoot extends Node {
  private builtKey = '';
  private avatar!: Sprite;
  private fx!: Particles;
  private crystalSprites: Sprite[] = [];
  private crystalLights: PointLight[] = [];
  private playerLight: PointLight | null = null;
  private timerBar: Sprite | null = null;
  private timerText: Text | null = null;
  private pips: Sprite[] = [];

  constructor() {
    super({ name: 'demo' });
    this.cosmetic = true; // the whole tree is a view; truth lives in world.state
  }

  private st(): DemoState {
    return (this.world as World).state as DemoState;
  }

  protected override onReady(): void {
    this.rebuild();
  }

  // ── view construction ──
  private rebuild(): void {
    const st = this.st();
    const scr = SCREENS[st.screen];
    const th = st.mods.cave ? THEME.cave : THEME.day;
    this.builtKey = `${st.screen}|${st.rev}`;
    for (const c of this.children.slice()) this.removeChild(c);
    this.crystalSprites = [];
    this.crystalLights = [];
    this.playerLight = null;
    this.timerBar = null;
    this.timerText = null;
    this.pips = [];

    // backdrop
    this.addChild(new Sprite({ name: 'bg', pos: { x: 0, y: 0 }, z: -100, shape: { kind: 'rect', w: W, h: H, anchor: 'topLeft' }, fill: th.bg }));

    // tiles (horizontal runs merged into single sprites)
    scr.rows.forEach((row, ty) => {
      let x = 0;
      while (x < COLS) {
        const ch = row[x];
        if (ch === '.') { x++; continue; }
        let end = x;
        while (end + 1 < COLS && row[end + 1] === ch) end++;
        const len = end - x + 1;
        if (ch === '#') {
          this.addChild(new Sprite({ pos: { x: x * TILE, y: ty * TILE }, z: 0, shape: { kind: 'rect', w: len * TILE, h: TILE, anchor: 'topLeft' }, fill: th.solid, stroke: th.solidLine, strokeWidth: 2 }));
        } else if (ch === '-') {
          this.addChild(new Sprite({ pos: { x: x * TILE, y: ty * TILE }, z: 0, shape: { kind: 'rect', w: len * TILE, h: 9, r: 4, anchor: 'topLeft' }, fill: th.oneway }));
        } else if (ch === '^') {
          for (let i = 0; i < len; i++) {
            const bx = (x + i) * TILE;
            const by = (ty + 1) * TILE;
            this.addChild(new Sprite({ pos: { x: bx + TILE / 2, y: by - 9 }, z: 1, shape: { kind: 'poly', points: [-13, 9, 0, -9, 13, 9], closed: true }, fill: th.hazard, opacity: 0.95 }));
          }
        }
        x = end + 1;
      }
    });

    // goal pennant (screen 3)
    if (scr.exit === 'goal') {
      this.addChild(new Sprite({ pos: { x: GOAL.x, y: GOAL.y - 4 }, z: 2, shape: { kind: 'rect', w: 4, h: 44, r: 2 }, fill: st.mods.cave ? '#8ea1c7' : '#29335c' }));
      this.addChild(new Sprite({ name: 'flag', pos: { x: GOAL.x + 15, y: GOAL.y - 18 }, z: 2, shape: { kind: 'poly', points: [-13, -8, 13, 0, -13, 8], closed: true }, fill: '#e59500' }));
    }

    // crystals (jump-budget mod)
    if (st.mods.jumps) {
      scr.crystals.forEach((c, i) => {
        const spr = new Sprite({ pos: { x: c.x, y: c.y }, z: 3, shape: { kind: 'diamond', w: 16, h: 24 }, fill: '#669bbc', stroke: '#ffffff', strokeWidth: 2 });
        spr.visible = (st.crystals[i] ?? 0) <= 0;
        this.crystalSprites.push(spr);
        this.addChild(spr);
      });
    }

    // avatar + particles
    this.avatar = new Sprite({ name: 'avatar', pos: { x: st.p.x, y: st.p.y }, z: 10, shape: { kind: 'rect', w: CFG.width, h: CFG.height, r: 6, anchor: 'topLeft' }, fill: avatarFill(st), stroke: st.mods.cave ? '#0b0f1e' : '#29335c', strokeWidth: 2 });
    this.addChild(this.avatar);
    this.fx = new Particles({ name: 'fx', z: 11, seed: 7 });
    this.addChild(this.fx);

    // dark-cave lighting
    if (st.mods.cave) {
      const lights = new LightLayer({ ambient: { color: '#05070f', level: 0.3 } });
      this.playerLight = new PointLight({ pos: { x: st.p.x, y: st.p.y }, radius: 180, color: '#ffd9a0', intensity: 1 });
      lights.addChild(this.playerLight);
      if (scr.exit === 'goal') lights.addChild(new PointLight({ pos: { x: GOAL.x, y: GOAL.y }, radius: 110, color: '#ffd9a0', intensity: 0.9 }));
      if (st.mods.jumps) {
        scr.crystals.forEach((c, i) => {
          const l = new PointLight({ pos: { x: c.x, y: c.y }, radius: 90, color: '#9cc4ff', intensity: 0.9 });
          l.visible = (st.crystals[i] ?? 0) <= 0;
          this.crystalLights.push(l);
          lights.addChild(l);
        });
      }
      this.addChild(lights);
    }

    // HUD (screen-space overlay)
    const hud = new Node({ name: 'hud' });
    hud.screenSpace = true;
    if (st.mods.timer) {
      this.timerBar = new Sprite({ pos: { x: 0, y: 0 }, z: 100, shape: { kind: 'rect', w: W, h: 7, anchor: 'topLeft' }, fill: '#337357' });
      this.timerText = new Text({ pos: { x: W - 12, y: 28 }, z: 100, text: `${TIME_LIMIT}`, size: 18, align: 'right', weight: 700, fill: st.mods.cave ? '#f4efe3' : '#29335c' });
      hud.addChild(this.timerBar);
      hud.addChild(this.timerText);
    }
    if (st.mods.jumps) {
      for (let i = 0; i < JUMP_BUDGET; i++) {
        const pip = new Sprite({ pos: { x: 20 + i * 22, y: 22 }, z: 100, shape: { kind: 'diamond', w: 13, h: 18 }, fill: '#669bbc' });
        this.pips.push(pip);
        hud.addChild(pip);
      }
    }
    if (hud.children.length > 0) this.addChild(hud);
  }

  // ── per-step logic + view sync ──
  protected override onProcess(dt: number): void {
    const w = this.world as World;
    const st = w.state as DemoState;
    if (this.builtKey !== `${st.screen}|${st.rev}`) this.rebuild();
    if (st.won) return;

    const scr = SCREENS[st.screen];
    const input = w.input;
    const canJump = !st.mods.jumps || st.jumpsLeft > 0;
    const pad: PadInput = {
      moveX: (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0),
      moveY: 0,
      jumpHeld: canJump && input.isDown('jump'),
      jumpPressed: canJump && input.justPressed('jump'),
      dashPressed: false,
    };

    const ev = stepPlatformer(st.p, pad, dt, MAPS[st.screen], CFG);

    // jump budget: spend + tone (pitch tracks what's left)
    if (ev.jumped || ev.airJumped || ev.wallJumped) {
      if (st.mods.jumps) {
        st.jumpsLeft = Math.max(0, st.jumpsLeft - 1);
        audio.tone({ freq: 400 + 90 * st.jumpsLeft, duration: 0.07, type: 'triangle', gain: 0.14 });
      } else {
        audio.tone({ freq: 620, duration: 0.07, type: 'triangle', gain: 0.14 });
      }
    }
    if (ev.landed) {
      const th = st.mods.cave ? THEME.cave : THEME.day;
      this.fx.burst(6, { x: st.p.x + CFG.width / 2, y: st.p.y + CFG.height }, PARTICLE_PRESETS.dust(th.dust));
    }

    // crystals: collect (refill) + respawn countdown
    if (st.mods.jumps) {
      scr.crystals.forEach((c, i) => {
        if (st.crystals[i] > 0) {
          st.crystals[i] = Math.max(0, st.crystals[i] - dt);
          if (st.crystals[i] <= 0) {
            if (this.crystalSprites[i]) this.crystalSprites[i].visible = true;
            if (this.crystalLights[i]) this.crystalLights[i].visible = true;
          }
          return;
        }
        const px = st.p.x + CFG.width / 2;
        const py = st.p.y + CFG.height / 2;
        if (Math.abs(c.x - px) < 20 && Math.abs(c.y - py) < 26) {
          st.crystals[i] = CRYSTAL_RESPAWN;
          st.jumpsLeft = JUMP_BUDGET;
          audio.blip(920);
          this.fx.burst(10, c, PARTICLE_PRESETS.sparkle(['#669bbc', '#9cc4ff', '#ffffff']));
          if (this.crystalSprites[i]) this.crystalSprites[i].visible = false;
          if (this.crystalLights[i]) this.crystalLights[i].visible = false;
        }
      });
    }

    // timer
    if (st.mods.timer) {
      st.timeLeft = Math.max(0, st.timeLeft - dt);
      if (st.timeLeft <= 0) return this.die(st);
    }

    // hazards + falling out
    const hz = (x: number, y: number): boolean => tileAtPoint(MAPS[st.screen], x, y) === 3;
    const { x, y } = st.p;
    if (ev.died || st.p.y > H + 60 || hz(x + 3, y + 3) || hz(x + CFG.width - 3, y + 3) || hz(x + 3, y + CFG.height - 1) || hz(x + CFG.width - 3, y + CFG.height - 1)) {
      return this.die(st);
    }

    // exits
    if (scr.exit === 'right' && st.p.x > W - CFG.width - 6) {
      st.screen += 1;
      st.p.x = 6;
      this.enterScreen(st, false);
      return;
    }
    if (scr.exit === 'goal') {
      const px = st.p.x + CFG.width / 2;
      const py = st.p.y + CFG.height / 2;
      if (px > 14 * TILE && px < 18 * TILE && py < 3 * TILE) return this.win(st);
    }

    // ── view sync ──
    this.avatar.pos = { x: st.p.x, y: st.p.y };
    this.avatar.paint.fill = avatarFill(st);
    if (this.playerLight) this.playerLight.pos = { x: st.p.x + CFG.width / 2, y: st.p.y + CFG.height / 2 };
    if (this.timerBar && this.timerText) {
      const frac = st.timeLeft / TIME_LIMIT;
      this.timerBar.shape = { kind: 'rect', w: Math.max(0, W * frac), h: 7, anchor: 'topLeft' };
      this.timerBar.paint.fill = frac > 0.5 ? '#337357' : frac > 0.25 ? '#e59500' : '#c0392b';
      this.timerText.text = `${Math.ceil(st.timeLeft)}`;
      this.timerText.paint.fill = frac > 0.25 ? (st.mods.cave ? '#f4efe3' : '#29335c') : '#c0392b';
    }
    this.pips.forEach((pip, i) => { pip.paint.opacity = i < st.jumpsLeft ? 1 : 0.18; });
  }

  private enterScreen(st: DemoState, respawn: boolean): void {
    if (respawn) st.p = spawnState(st.screen);
    st.jumpsLeft = JUMP_BUDGET;
    st.crystals = SCREENS[st.screen].crystals.map(() => 0);
    st.timeLeft = TIME_LIMIT;
    st.rev += 1; // force a rebuild for the new screen
  }

  private die(st: DemoState): void {
    st.deaths += 1;
    audio.tone({ freq: 150, duration: 0.18, type: 'sawtooth', gain: 0.12 });
    this.fx.burst(14, { x: st.p.x + CFG.width / 2, y: st.p.y + CFG.height / 2 }, PARTICLE_PRESETS.hit(['#e59500', '#c0392b']));
    this.enterScreen(st, true);
  }

  private win(st: DemoState): void {
    st.won = true;
    audio.success();
    showScreen({
      title: 'You made it!',
      body: 'Three screens, prompt-edited live. Imagine what a whole agent session builds.',
      actions: [
        {
          label: 'Play again',
          primary: true,
          onSelect: () => {
            const fresh = initialState();
            fresh.mods = st.mods;
            fresh.deaths = st.deaths;
            Object.assign(st, fresh, { rev: st.rev + 1 });
            hideScreen();
          },
        },
      ],
    });
  }
}

// ── Game definition ─────────────────────────────────────────────────────────
export const game = defineGame({
  title: 'Hayao demo',
  width: W,
  height: H,
  background: THEME.day.bg,
  inputMap: INPUT,
  splash: { minDurationMs: 5000 }, // TEMP: long hold to inspect the logo splash
  build(world) {
    Object.assign(world.state as DemoState, initialState());
    return new DemoRoot();
  },
  probe(world) {
    const st = world.state as DemoState;
    return { screen: st.screen, deaths: st.deaths, won: st.won, mods: st.mods };
  },
});

// ── Embedding controller (what the React island talks to) ───────────────────
export interface DemoController {
  handle: GameHandle;
  setMods(mods: Partial<DemoMods>): void;
  getMods(): DemoMods;
  setPaused(paused: boolean): void;
  stop(): void;
}

export function createDemo(mount: HTMLElement, keyboardTarget: HTMLElement): DemoController {
  // Unlock audio here (still inside the click's sticky activation) so the boot
  // chime the cold-open fires ~400ms later plays on a live bus.
  audio.start();
  const handle = runBrowser(game, mount, { shell: false, keyboardTarget });
  const st = (): DemoState => handle.world.state as DemoState;
  return {
    handle,
    setMods(mods) {
      Object.assign(st().mods, mods);
      st().jumpsLeft = JUMP_BUDGET;
      st().timeLeft = TIME_LIMIT;
      st().rev += 1; // view rebuilds on the next step
    },
    getMods: () => ({ ...st().mods }),
    setPaused(paused) {
      handle.world.paused = paused;
      if (paused) handle.input.clear(); // element-bound source never hears offsite keyups
    },
    stop: () => handle.stop(),
  };
}
