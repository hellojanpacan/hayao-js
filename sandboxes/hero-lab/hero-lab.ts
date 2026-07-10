// hero-lab — one asset in isolation: the duotone platformer hero. This is a
// catalog sheet, not a game: all seven authored states play side by side so you
// can read the whole animation set at a glance. The one-shots (jump · spawn ·
// death) auto-replay on a beat so they don't freeze on their last pose.
//
// THE SEAM: every DuotoneHero is `cosmetic`, so the rig, the ClipPlayer, and all
// the tweening stay out of world.hash(). The only canonical (hashed) state is the
// two knobs — the scheme and the facing. Strip every hero and the sandbox hashes
// the same; that's the discipline a real game rigs its character with.

import {
  Node,
  Sprite,
  Text,
  DuotoneHero,
  REGALIA_SCHEMES,
  REGALIA_SCHEME_NAMES,
  HERO_CLIPS,
  HERO_STATES,
  HERO_FOOT_OFFSET,
  REGALIA,
  REGALIA_DAY,
  registerNode,
  defineGame,
  knob,
  type DuotoneScheme,
  type RegaliaSchemeName,
  type HeroState,
  type InputMap,
  type World,
} from '@hayao';

const HL_INPUT_MAP: InputMap = { flip: ['KeyF', 'Space'] };

const COLS = 4;
const HERO_SCALE = 0.82;
const ONE_SHOTS: ReadonlySet<HeroState> = new Set<HeroState>(['jump', 'spawn', 'death']);
const REPLAY_GAP = 0.7; // seconds a one-shot holds its end pose before replaying

// Cell layout: 4 across, 2 down; the feet rest on `floorY`.
function cell(i: number): { cx: number; floorY: number } {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  return { cx: 160 + col * 320, floorY: row === 0 ? 300 : 620 };
}

class HeroLab extends Node {
  override readonly type = 'HeroLab';

  // ── Canonical (hashed) knob state ────────────────────────────────────────
  palette: RegaliaSchemeName = 'dusk';
  facing: 1 | -1 = 1;

  // ── Cosmetic view ────────────────────────────────────────────────────────
  private heroes: DuotoneHero[] = [];
  private hud!: Text;

  protected override onReady(): void {
    const w = this.world as World;
    this.palette = w.tune<RegaliaSchemeName>('palette');
    this.facing = w.tune<string>('facing') === 'left' ? -1 : 1;
    const scheme: DuotoneScheme = REGALIA_SCHEMES[this.palette] ?? REGALIA_SCHEMES.dusk;

    HERO_STATES.forEach((state, i) => {
      const { cx, floorY } = cell(i);
      this.buildCard(cx, floorY, state);

      // A short wall stub so the wall-slide pose reads in context.
      if (state === 'wallSlide') {
        this.addCosmetic(new Sprite({ z: 1, pos: { x: cx + 34, y: floorY - 78 }, shape: { kind: 'rect', w: 16, h: 150, r: 4 }, fill: REGALIA.softInk }));
      }

      const hero = new DuotoneHero({
        name: `hero-${state}`,
        scheme,
        state,
        facing: this.facing,
        pos: { x: cx, y: floorY - HERO_FOOT_OFFSET * HERO_SCALE },
        scale: { x: HERO_SCALE, y: HERO_SCALE },
      });
      this.addChild(hero);
      this.heroes.push(hero);
    });

    this.hud = new Text({ name: 'hud', pos: { x: 640, y: 40 }, size: 20, align: 'center', fill: REGALIA_DAY.inkSoft, text: '' });
    this.hud.cosmetic = true;
    this.addChild(this.hud);
    this.refreshHud();
  }

  /** A catalog card + its state label, both cosmetic. */
  private buildCard(cx: number, floorY: number, state: HeroState): void {
    this.addCosmetic(new Sprite({ z: -5, pos: { x: cx, y: floorY - 96 }, shape: { kind: 'rect', w: 286, h: 268, r: 20 }, fill: REGALIA.cloud }));
    // Floor line inside the card.
    this.addCosmetic(new Sprite({ z: -4, pos: { x: cx, y: floorY }, shape: { kind: 'rect', w: 220, h: 4, r: 2 }, fill: REGALIA.line }));
    const label = new Text({ pos: { x: cx, y: floorY + 40 }, size: 22, align: 'center', fill: REGALIA_DAY.ink, text: state });
    label.cosmetic = true;
    this.addChild(label);
  }

  private addCosmetic(sprite: Sprite): void {
    sprite.cosmetic = true;
    this.addChild(sprite);
  }

  private refreshHud(): void {
    this.hud.text = `DuotoneHero · seven authored states · scheme "${this.palette}" · facing ${this.facing === 1 ? 'right ▶' : '◀ left'}   ·   F/Space flip`;
  }

  protected override onProcess(): void {
    if (!this.world) return;
    const input = (this.world as World).input;

    if (input.justPressed('flip')) {
      this.facing = this.facing === 1 ? -1 : 1;
      for (const hero of this.heroes) hero.setFacing(this.facing);
      this.refreshHud();
    }

    // Replay the one-shots after they hold their end pose for a beat.
    for (const hero of this.heroes) {
      const state = hero.currentState;
      if (ONE_SHOTS.has(state) && hero.animTime > HERO_CLIPS[state].duration + REPLAY_GAP) {
        hero.setState(state, true);
      }
    }
  }

  protected override serializeProps(): Record<string, unknown> {
    return { palette: this.palette, facing: this.facing };
  }
  override applyProps(props: Record<string, unknown>): void {
    if (typeof props.palette === 'string') this.palette = props.palette as RegaliaSchemeName;
    if (props.facing === 1 || props.facing === -1) this.facing = props.facing;
  }
}

registerNode('HeroLab', () => new HeroLab());

export const heroLabGame = defineGame({
  title: 'Hero Lab',
  width: 1280,
  height: 720,
  background: REGALIA_DAY.bg,
  inputMap: HL_INPUT_MAP,
  tuning: {
    knobs: [
      knob.enumOf('palette', { default: 'dusk', options: REGALIA_SCHEME_NAMES as unknown as string[], group: 'style', label: 'duotone scheme' }),
      knob.enumOf('facing', { default: 'right', options: ['right', 'left'], group: 'style' }),
    ],
  },
  build: () => new HeroLab({ name: 'hero-lab' }),
  probe: (world) => {
    const lab = world.root.find('hero-lab') as HeroLab | null;
    return {
      frame: world.frame,
      hash: world.hash(),
      palette: lab?.palette ?? 'dusk',
      facing: lab?.facing ?? 1,
      states: HERO_STATES.length,
    };
  },
});
