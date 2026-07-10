/**
 * The live "What's in the box" cells for /create/quickstart. Everything here
 * imports the real engine through @hayao (aliased to monorepo source), so the
 * grid renders the actual shipped assets — the rigged hero playing its authored
 * clips, the real particle presets, the real synth bus — not illustrations.
 *
 * Loaded lazily by BoxLive.tsx when the grid scrolls into view.
 */
import {
  defineGame,
  runBrowser,
  registerNode,
  Node,
  Sprite,
  Text,
  Particles,
  PARTICLE_PRESETS,
  Shaker,
  FloatingText,
  DuotoneHero,
  REGALIA_SCHEMES,
  REGALIA_SCHEME_NAMES,
  HERO_STATES,
  HERO_CLIPS,
  HERO_FOOT_OFFSET,
  REGALIA,
  REGALIA_DAY,
  DEFAULT_PLATFORMER,
  audio,
  type RegaliaSchemeName,
} from "@hayao";

export type SchemeName = RegaliaSchemeName;

/* ── Hero cell — the seven authored clips on a loop, five schemes ─────────── */

const HERO_W = 320;
const HERO_H = 300;
const FLOOR_Y = 244;
const HOLD_EXTRA = 0.6; // seconds a clip holds past its duration before the next

class HeroCellNode extends Node {
  override readonly type = "HeroCell";
  private heroes = new Map<RegaliaSchemeName, DuotoneHero>();
  private active: RegaliaSchemeName = "gold";
  private stateIdx = 0;
  private t = 0;
  private label!: Text;
  private wall!: Sprite;

  protected override onReady(): void {
    const floor = new Sprite({
      z: -4,
      pos: { x: HERO_W / 2, y: FLOOR_Y },
      shape: { kind: "rect", w: 250, h: 4, r: 2 },
      fill: REGALIA.line,
    });
    floor.cosmetic = true;
    this.addChild(floor);

    // A wall stub so the wall-slide pose reads in context (hero-lab's trick).
    this.wall = new Sprite({
      z: 1,
      pos: { x: HERO_W / 2 + 36, y: FLOOR_Y - 80 },
      shape: { kind: "rect", w: 14, h: 148, r: 4 },
      fill: REGALIA.softInk,
    });
    this.wall.cosmetic = true;
    this.wall.visible = false;
    this.addChild(this.wall);

    for (const name of REGALIA_SCHEME_NAMES) {
      const hero = new DuotoneHero({
        name: `hero-${name}`,
        scheme: REGALIA_SCHEMES[name],
        state: HERO_STATES[0],
        facing: 1,
        pos: { x: HERO_W / 2, y: FLOOR_Y - HERO_FOOT_OFFSET },
      });
      hero.visible = name === this.active;
      this.addChild(hero);
      this.heroes.set(name, hero);
    }

    this.label = new Text({
      pos: { x: HERO_W / 2, y: FLOOR_Y + 36 },
      size: 18,
      align: "center",
      fill: REGALIA_DAY.inkSoft,
      text: HERO_STATES[0],
    });
    this.label.cosmetic = true;
    this.addChild(this.label);
  }

  protected override onProcess(dt: number): void {
    this.t += dt;
    const state = HERO_STATES[this.stateIdx];
    const hold = Math.max(1.6, HERO_CLIPS[state].duration + HOLD_EXTRA);
    if (this.t < hold) return;
    this.t = 0;
    this.stateIdx = (this.stateIdx + 1) % HERO_STATES.length;
    const next = HERO_STATES[this.stateIdx];
    for (const hero of this.heroes.values()) hero.setState(next, true);
    this.label.text = next;
    this.wall.visible = next === "wallSlide";
  }

  setScheme(name: RegaliaSchemeName): void {
    this.active = name;
    for (const [n, hero] of this.heroes) hero.visible = n === name;
  }
}
registerNode("HeroCell", () => new HeroCellNode());

const heroGame = defineGame({
  title: "box-hero",
  width: HERO_W,
  height: HERO_H,
  background: REGALIA_DAY.bg,
  splash: false,
  build: () => new HeroCellNode({ name: "cell" }),
  probe: (world) => ({ frame: world.frame, hash: world.hash() }),
});

export interface HeroCellCtrl {
  setScheme(name: RegaliaSchemeName): void;
  setPaused(paused: boolean): void;
  stop(): void;
}

export function createHeroCell(mount: HTMLElement): HeroCellCtrl {
  const handle = runBrowser(heroGame, mount, { shell: false, keyboardTarget: mount });
  const cell = handle.world.root.find("cell") as HeroCellNode;
  return {
    setScheme: (name) => cell.setScheme(name),
    setPaused: (paused) => {
      handle.world.paused = paused;
    },
    stop: () => handle.stop(),
  };
}

/* ── Juice cell — burst + shake + popup on demand ─────────────────────────── */

const JUICE_W = 320;
const JUICE_H = 220;
const J_FLOOR = 176;

class JuiceCellNode extends Node {
  override readonly type = "JuiceCell";
  private shaker!: Shaker;
  private parts!: Particles;
  private floats!: FloatingText;
  private block!: Sprite;
  private squash = 0;
  private hits = 0;

  protected override onReady(): void {
    this.shaker = new Shaker({ seed: 7, amplitude: 10 });
    this.addChild(this.shaker);

    const floor = new Sprite({
      z: -4,
      pos: { x: JUICE_W / 2, y: J_FLOOR },
      shape: { kind: "rect", w: 250, h: 4, r: 2 },
      fill: REGALIA.line,
    });
    floor.cosmetic = true;
    this.shaker.addChild(floor);

    this.block = new Sprite({
      pos: { x: JUICE_W / 2, y: J_FLOOR - 26 },
      shape: { kind: "rect", w: 48, h: 48, r: 10 },
      fill: REGALIA_SCHEMES.gold.base,
    });
    this.block.cosmetic = true;
    this.shaker.addChild(this.block);

    this.parts = new Particles({ seed: 11 });
    this.shaker.addChild(this.parts);
    this.floats = new FloatingText({ seed: 3 });
    this.shaker.addChild(this.floats);
  }

  protected override onProcess(dt: number): void {
    this.squash = Math.max(0, this.squash - dt * 4);
    this.block.scale = { x: 1 + this.squash * 0.22, y: 1 - this.squash * 0.28 };
  }

  poke(): void {
    this.hits += 1;
    const at = { x: this.block.pos.x, y: this.block.pos.y };
    this.parts.burst(24, at, PARTICLE_PRESETS.burst());
    this.shaker.addTrauma(0.45);
    this.floats.pop(`+${this.hits * 100}`, { x: at.x, y: at.y - 44 }, { color: REGALIA_SCHEMES.gold.base, rise: 72, life: 0.8, jitter: 50 });
    this.squash = 1;
  }
}
registerNode("JuiceCell", () => new JuiceCellNode());

const juiceGame = defineGame({
  title: "box-juice",
  width: JUICE_W,
  height: JUICE_H,
  background: REGALIA_DAY.bg,
  splash: false,
  build: () => new JuiceCellNode({ name: "cell" }),
  probe: (world) => ({ frame: world.frame, hash: world.hash() }),
});

export interface JuiceCellCtrl {
  poke(): void;
  setPaused(paused: boolean): void;
  stop(): void;
}

export function createJuiceCell(mount: HTMLElement): JuiceCellCtrl {
  const handle = runBrowser(juiceGame, mount, { shell: false, keyboardTarget: mount });
  const cell = handle.world.root.find("cell") as JuiceCellNode;
  return {
    poke: () => cell.poke(),
    setPaused: (paused) => {
      handle.world.paused = paused;
    },
    stop: () => handle.stop(),
  };
}

/* ── Sounds — the real bus, the real presets ──────────────────────────────── */

export const sfx = {
  /** Unlock the bus inside a user gesture; safe to call repeatedly. */
  ensure(): void {
    audio.start();
  },
  blip(freq?: number): void {
    audio.blip(freq);
  },
  chime(): void {
    audio.chime();
  },
  success(): void {
    audio.success();
  },
  thud(): void {
    audio.thud();
  },
};

/* ── Data pulled straight from the shipped constants ──────────────────────── */

export const schemes = REGALIA_SCHEME_NAMES.map((name) => ({
  name,
  base: REGALIA_SCHEMES[name].base,
  light: REGALIA_SCHEMES[name].light,
  shade: REGALIA_SCHEMES[name].shade,
}));

export const controllerFacts = [
  { label: "coyote time", value: `${Math.round(DEFAULT_PLATFORMER.coyoteTime * 1000)}ms` },
  { label: "jump buffer", value: `${Math.round(DEFAULT_PLATFORMER.jumpBuffer * 1000)}ms` },
  { label: "run speed", value: `${DEFAULT_PLATFORMER.runSpeed}px/s` },
  { label: "dash charges", value: `${DEFAULT_PLATFORMER.dashCharges}` },
];
