// Fernclash: the world/view layer. Canonical state is world.state.fc (hashed,
// snapshotted); FcView is a REGISTERED node whose logic lives in onProcess —
// so it survives World.restore() with no re-attach hook, which is exactly
// what rollback and late-join netplay need. Inputs are read through
// PlayerInput ('p1:up' / 'p2:up'), so the same game runs hot-seat (both
// players on one keyboard) and networked (a session merges remote inputs)
// without a single branch in game code.

import {
  KENTO,
  Node,
  Sprite,
  Text,
  audio,
  defineGame,
  hideScreen,
  playerInput,
  registerNode,
  showScreen,
  type InputMap,
  type World,
} from '@hayao';
import { ARENA, FIGHTER, WIN_SCORE, initialFc, stepFc, type FcInput, type FcState, type Side, SIDES } from './logic';

/** Net play: plain actions — the session namespaces them per player. */
export const FC_NET_INPUT_MAP: InputMap = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  dash: ['Space', 'KeyJ'],
  again: ['KeyR'],
};

/** Hot-seat: both players on one keyboard, actions pre-namespaced. */
export const FC_LOCAL_INPUT_MAP: InputMap = {
  'p1:up': ['KeyW'],
  'p1:down': ['KeyS'],
  'p1:left': ['KeyA'],
  'p1:right': ['KeyD'],
  'p1:dash': ['KeyF'],
  'p1:again': ['KeyR'],
  'p2:up': ['ArrowUp'],
  'p2:down': ['ArrowDown'],
  'p2:left': ['ArrowLeft'],
  'p2:right': ['ArrowRight'],
  'p2:dash': ['Slash', 'ShiftRight'],
  'p2:again': ['KeyR'],
};

const PAL = {
  fern: KENTO.matsuDeep, // dark pine ring around the arena (nature backdrop)
  ring: KENTO.matsu, // bright pine rim on the arena disc
  arena: KENTO.washi, // light arena disc lifts off the dark ground
  grain: KENTO.kinu, // warm wood-grain rings
  p1: KENTO.shu, // fighter 1 — vermilion (fire / primary actor)
  p2: KENTO.asagi, // fighter 2 — teal-cyan (water / cool), distinct hue from p1
  ink: KENTO.gofun, // score/big text reads on the dark ground
  soft: KENTO.kinako, // muted hint text
};

export function fcState(world: World): FcState {
  return world.state.fc as FcState;
}

function readInput(world: World, side: Side): FcInput {
  const input = playerInput(world, side);
  return {
    x: (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0),
    y: (input.isDown('down') ? 1 : 0) - (input.isDown('up') ? 1 : 0),
    dash: input.justPressed('dash'),
  };
}

class FcView extends Node {
  override readonly type = 'FcView';
  private layer = new Node({ name: 'layer' });
  private fighters!: Record<Side, Sprite>;
  private score!: Text;
  private big!: Text;
  private overShown = false;

  protected override onReady(): void {
    this.layer.cosmetic = true;
    this.addChild(this.layer);
    // Fern ring, arena disc, wood-grain rings.
    this.layer.addChild(new Sprite({ pos: { x: ARENA.cx, y: ARENA.cy }, z: 0, shape: { kind: 'circle', radius: ARENA.r + 26 }, fill: PAL.fern }));
    this.layer.addChild(new Sprite({ pos: { x: ARENA.cx, y: ARENA.cy }, z: 1, shape: { kind: 'circle', radius: ARENA.r }, fill: PAL.arena, stroke: PAL.ring, strokeWidth: 6 }));
    for (const r of [180, 110, 50]) {
      this.layer.addChild(new Sprite({ pos: { x: ARENA.cx, y: ARENA.cy }, z: 2, shape: { kind: 'circle', radius: r }, fill: 'none', stroke: PAL.grain, strokeWidth: 2 }));
    }
    this.fighters = {
      p1: this.layer.addChild(new Sprite({ z: 5, shape: { kind: 'circle', radius: FIGHTER.radius }, fill: PAL.p1, stroke: KENTO.sumi, strokeWidth: 3 })),
      p2: this.layer.addChild(new Sprite({ z: 5, shape: { kind: 'circle', radius: FIGHTER.radius }, fill: PAL.p2, stroke: KENTO.sumi, strokeWidth: 3 })),
    };
    // Place fighters before the first step so frame 0 already reads well.
    const s0 = fcState(this.world as World);
    for (const side of SIDES) this.fighters[side].pos = { x: s0.bodies[side].x, y: s0.bodies[side].y };
    this.score = this.layer.addChild(new Text({ pos: { x: 640, y: 40 }, z: 8, size: 30, align: 'center', fill: PAL.ink, text: '' }));
    this.big = this.layer.addChild(new Text({ pos: { x: 640, y: 330 }, z: 9, size: 68, align: 'center', fill: PAL.ink, text: '' }));
    this.layer.addChild(
      new Text({ pos: { x: 640, y: 690 }, z: 8, size: 15, align: 'center', fill: PAL.soft, text: 'red: WASD + F dash · blue: arrows + / dash · push the rival off the ring · first to 3' }),
    );
  }

  protected override onProcess(dt: number): void {
    const world = this.world as World;
    const s = fcState(world);

    // Rematch flows through the INPUT stream (any player holds 'again'), so
    // networked peers reset on the same frame. Never mutate sim state from a
    // DOM callback in a netplay game.
    if (s.phase === 'over' && SIDES.some((p) => playerInput(world, p).justPressed('again'))) {
      world.state.fc = initialFc();
      this.overShown = false;
      hideScreen();
      return;
    }

    const ev = stepFc(s, { p1: readInput(world, 'p1'), p2: readInput(world, 'p2') }, dt);
    if (ev.go) audio.blip(520);
    if (ev.hit) audio.blip(200);
    if (ev.dash) audio.blip(760);
    if (ev.roundEnd) audio.success();
    if (ev.over) audio.success();

    if (s.phase === 'over' && !this.overShown) {
      this.overShown = true;
      showScreen({
        title: s.lastWinner === 'p1' ? 'Red takes the glade!' : 'Blue takes the glade!',
        body: `${s.score.p1} – ${s.score.p2} after ${s.round} rounds. Press R for a rematch.`,
        actions: [],
      });
    }

    // View sync.
    for (const side of SIDES) {
      const b = s.bodies[side];
      this.fighters[side].pos = { x: b.x, y: b.y };
      this.fighters[side].paint.opacity = s.phase === 'roundEnd' && s.lastWinner !== side ? 0.35 : 1;
    }
    this.score.text = `${s.score.p1}  ·  round ${Math.min(s.round, WIN_SCORE * 2 - 1)}  ·  ${s.score.p2}`;
    this.big.text =
      s.phase === 'countdown' ? `${Math.ceil(s.timer)}` : s.phase === 'play' && s.time % 60 < 0.6 && s.round === 1 ? 'CLASH!' : s.phase === 'roundEnd' ? (s.lastWinner === 'p1' ? 'red round' : 'blue round') : '';
  }
}

registerNode('FcView', () => new FcView());

export const fernclashGame = defineGame({
  title: 'Fernclash',
  seed: 5,
  background: KENTO.kuro,
  inputMap: FC_NET_INPUT_MAP,
  build(world) {
    world.state.fc = initialFc();
    const root = new Node({ name: 'fernclash' });
    root.addChild(new FcView());
    return root;
  },
  probe(world) {
    const s = fcState(world);
    return {
      phase: s.phase,
      round: s.round,
      score: { ...s.score },
      p1: { x: Math.round(s.bodies.p1.x), y: Math.round(s.bodies.p1.y) },
      p2: { x: Math.round(s.bodies.p2.x), y: Math.round(s.bodies.p2.y) },
      hash: world.hash(),
    };
  },
});
