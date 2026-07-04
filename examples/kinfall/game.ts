// Kinfall: the co-op world/view layer. Canonical state is world.state.kin
// (hashed + snapshotted); KinView is a REGISTERED node whose logic lives in
// onProcess, so it survives World.restore(). Both players read from the same
// pre-namespaced input map ('p1:*' / 'p2:*'), so two people share one keyboard
// and one shared-survival world with no branches in game code.

import {
  KENTO,
  Node,
  NodePool,
  Sprite,
  Text,
  TILE,
  audio,
  defineGame,
  glow,
  hideScreen,
  mix,
  registerNode,
  showScreen,
  tileAt,
  withAlpha,
  type FeelSpec,
  type InputMap,
  type World,
} from '@hayao';
import {
  arenaMap,
  initialKin,
  stepKin,
  stormRadius,
  ARENA_W,
  ARENA_H,
  CENTER,
  E_TUNE,
  P_TUNE,
  PIDS,
  TILE_SIZE,
  WEAPONS,
  WIN_AT,
  type KinState,
  type PInput,
  type Pid,
} from './logic';

// Hot-seat: two players on one keyboard, actions pre-namespaced. Exactly the
// bindings the brief asked for — P1 on WASD with «,»/«y», P2 on the arrows
// with «.»/«-».
export const KIN_INPUT_MAP: InputMap = {
  'p1:up': ['KeyW'],
  'p1:down': ['KeyS'],
  'p1:left': ['KeyA'],
  'p1:right': ['KeyD'],
  'p1:fire': ['Comma'],
  'p1:interact': ['KeyY'],
  'p2:up': ['ArrowUp'],
  'p2:down': ['ArrowDown'],
  'p2:left': ['ArrowLeft'],
  'p2:right': ['ArrowRight'],
  'p2:fire': ['Period'],
  'p2:interact': ['Minus'],
  restart: ['KeyR'],
};

// Dark-ground co-op survival on the Kentō palette. Four actor families are
// forced into different hues so a crowded screen never blurs: P1 → shu
// (vermilion), P2 → asagi (teal), swarmer → kaki (orange), brute → fuji
// (violet). Bullets stay gold (ko) energy for both. The storm boundary is
// saku (rose) — the one danger colour, used nowhere else.
const PAL = {
  bg: KENTO.yohaku,
  rock: KENTO.darkLine,
  rockLine: KENTO.sumiSoft,
  safe: KENTO.washi,
  storm: KENTO.saku,
  p1: KENTO.shu,
  p2: KENTO.asagi,
  down: KENTO.kinako,
  bullet: KENTO.ko,
  swarmer: KENTO.kaki,
  brute: KENTO.fuji,
  crate: KENTO.kinu,
  crateLine: KENTO.gofun,
  glow: KENTO.ko,
  text: KENTO.kinako,
  bright: KENTO.gofun,
  scrim: KENTO.kuro,
} as const;

const PID_FILL: Record<Pid, string> = { p1: PAL.p1, p2: PAL.p2 };
const ARENA_HUD_Y = 700;

export function kinState(world: World): KinState {
  return world.state.kin as KinState;
}

function readInput(world: World, pid: Pid): PInput {
  const i = world.input;
  return {
    moveX: (i.isDown(`${pid}:right`) ? 1 : 0) - (i.isDown(`${pid}:left`) ? 1 : 0),
    moveY: (i.isDown(`${pid}:down`) ? 1 : 0) - (i.isDown(`${pid}:up`) ? 1 : 0),
    fire: i.isDown(`${pid}:fire`),
    interact: i.isDown(`${pid}:interact`),
  };
}

class KinView extends Node {
  override readonly type = 'KinView';
  private layer = new Node({ name: 'layer' });
  private enemyPool!: NodePool<Sprite>;
  private bulletPool!: NodePool<Sprite>;
  private safeDisc!: Sprite;
  private stormRing!: Sprite;
  private avatars!: Record<Pid, Sprite>;
  private nubs!: Record<Pid, Sprite>;
  private downLabels!: Record<Pid, Text>;
  private crateSprites: { box: Sprite; glyph: Text }[] = [];
  private hud!: Text;
  private hpP1!: Text;
  private hpP2!: Text;
  private banner!: Text;
  private overShown = false;

  protected override onReady(): void {
    this.layer.cosmetic = true;
    this.addChild(this.layer);
    const map = arenaMap();

    // Storm: a rose "danger" backdrop fills the whole field; a calm disc on top
    // is the safe zone, so the ground outside the ring reads rose the instant
    // the ring pulls in past the corners (surviv's gas). A bright rose ring is
    // the boundary; both the disc and ring resize each frame.
    this.layer.addChild(new Sprite({ pos: { ...CENTER }, z: 0, shape: { kind: 'rect', w: ARENA_W, h: ARENA_H }, fill: mix(PAL.bg, KENTO.sakuDeep, 0.22) }));
    this.safeDisc = this.layer.addChild(new Sprite({ pos: { ...CENTER }, z: 1, shape: { kind: 'circle', radius: 700 }, fill: PAL.bg }));
    // Faint telegraphs of where the ring settles + a mid guide (background lattice).
    for (const r of [320, 190, 130]) this.layer.addChild(new Sprite({ pos: { ...CENTER }, z: 1, shape: { kind: 'circle', radius: r }, fill: 'none', stroke: withAlpha(PAL.text, r === 130 ? 0.16 : 0.08), strokeWidth: r === 130 ? 2 : 1 }));
    // Extraction pad at the eye of the storm — the goal the ring closes onto.
    this.layer.addChild(new Sprite({ pos: { ...CENTER }, z: 1, shape: { kind: 'circle', radius: 30 }, fill: 'none', stroke: withAlpha(PAL.glow, 0.5), strokeWidth: 2, shadow: glow(withAlpha(PAL.glow, 0.5), 12) }));
    this.layer.addChild(new Sprite({ pos: { ...CENTER }, z: 1, shape: { kind: 'circle', radius: 4 }, fill: withAlpha(PAL.glow, 0.6) }));
    this.stormRing = this.layer.addChild(new Sprite({ pos: { ...CENTER }, z: 2, shape: { kind: 'circle', radius: 700 }, fill: 'none', stroke: PAL.storm, strokeWidth: 6, shadow: glow(withAlpha(PAL.storm, 0.7), 10) }));

    // Walls / cover.
    for (let ty = 0; ty < map.rows; ty++)
      for (let tx = 0; tx < map.cols; tx++)
        if (tileAt(map, tx, ty) === TILE.SOLID)
          this.layer.addChild(new Sprite({ pos: { x: (tx + 0.5) * TILE_SIZE, y: (ty + 0.5) * TILE_SIZE }, z: 2, shape: { kind: 'rect', w: TILE_SIZE, h: TILE_SIZE }, fill: PAL.rock, stroke: PAL.rockLine, strokeWidth: 1 }));

    // Crates (static positions; a tier glyph names the loot). Dark ink outline
    // + gold glow marks them as pickups.
    const s0 = kinState(this.world as World);
    for (const c of s0.crates) {
      const box = this.layer.addChild(new Sprite({ pos: { x: c.x, y: c.y }, z: 3, shape: { kind: 'rect', w: 26, h: 26 }, fill: PAL.crate, stroke: PAL.crateLine, strokeWidth: 2, shadow: glow(PAL.glow, 9) }));
      const glyph = this.layer.addChild(new Text({ pos: { x: c.x, y: c.y + 6 }, z: 4, size: 17, align: 'center', fill: KENTO.sumi, text: WEAPONS[c.tier].glyph }));
      this.crateSprites.push({ box, glyph });
    }

    // Pools for the horde and their bullets.
    this.enemyPool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 5, shape: { kind: 'circle', radius: 13 }, fill: PAL.swarmer, stroke: KENTO.sumi, strokeWidth: 1 }));
    this.bulletPool = new NodePool<Sprite>(this.layer, () => new Sprite({ z: 6, shape: { kind: 'circle', radius: 4 }, fill: PAL.bullet }));

    // Avatars + facing nubs + down labels.
    this.avatars = {} as Record<Pid, Sprite>;
    this.nubs = {} as Record<Pid, Sprite>;
    this.downLabels = {} as Record<Pid, Text>;
    for (const pid of PIDS) {
      this.nubs[pid] = this.layer.addChild(new Sprite({ z: 7, shape: { kind: 'circle', radius: 5 }, fill: PAL.bright }));
      this.avatars[pid] = this.layer.addChild(new Sprite({ z: 8, shape: { kind: 'circle', radius: P_TUNE.radius }, fill: PID_FILL[pid], stroke: KENTO.sumi, strokeWidth: 3 }));
      this.downLabels[pid] = this.layer.addChild(new Text({ pos: { x: 0, y: 0 }, z: 9, size: 14, align: 'center', fill: PAL.storm, text: '' }));
    }

    // HUD status band — one full-width scrim (below the top wall row) that
    // fully contains three well-separated texts, plus a big centred banner.
    this.layer.addChild(new Sprite({ pos: { x: CENTER.x, y: 62 }, z: 11, shape: { kind: 'rect', w: 1160, h: 30 }, fill: withAlpha(PAL.scrim, 0.85) }));
    this.hpP1 = this.layer.addChild(new Text({ pos: { x: 200, y: 68 }, z: 12, size: 16, align: 'center', fill: PAL.p1, text: '' }));
    this.hud = this.layer.addChild(new Text({ pos: { x: CENTER.x, y: 68 }, z: 12, size: 16, align: 'center', fill: PAL.text, text: '' }));
    this.hpP2 = this.layer.addChild(new Text({ pos: { x: 1080, y: 68 }, z: 12, size: 16, align: 'center', fill: PAL.p2, text: '' }));
    this.banner = this.layer.addChild(new Text({ pos: { x: CENTER.x, y: 300 }, z: 13, size: 40, align: 'center', fill: PAL.bright, text: '' }));

    // Onboarding legend (frame-1 control hints; every mapped action is named).
    this.layer.addChild(new Sprite({ pos: { x: CENTER.x, y: ARENA_HUD_Y, }, z: 11, shape: { kind: 'rect', w: 1180, h: 30 }, fill: withAlpha(PAL.scrim, 0.85) }));
    this.layer.addChild(new Text({ pos: { x: CENTER.x, y: ARENA_HUD_Y + 5 }, z: 12, size: 14, align: 'center', fill: PAL.text, text: 'P1 red  W A S D move · comma «,» fire · Y revive & loot        P2 blue  arrows move · «.» fire · minus «-» revive & loot        R restart' }));

    // Place avatars before the first step so frame 0 already reads.
    this.syncActors(s0);
  }

  protected override onProcess(dt: number): void {
    const world = this.world as World;
    const s = kinState(world);

    if (world.input.justPressed('restart')) {
      world.state.kin = initialKin();
      this.overShown = false;
      hideScreen();
      this.syncActors(kinState(world));
      return;
    }

    if (s.phase === 'play') {
      const ev = stepKin(s, { p1: readInput(world, 'p1'), p2: readInput(world, 'p2') }, dt, world.rng);
      if (ev.fired) audio.blip(430);
      if (ev.kill) audio.blip(560 + (s.kills % 6) * 28);
      if (ev.hurt) audio.blip(150);
      if (ev.loot) audio.success();
      if (ev.down) audio.blip(90);
      if (ev.revive) audio.success();
      if (ev.won || ev.lost) audio.success();
    }

    if ((s.phase === 'won' || s.phase === 'lost') && !this.overShown) {
      this.overShown = true;
      const survivors = PIDS.filter((p) => !s.players[p].dead).length;
      showScreen(
        s.phase === 'won'
          ? { title: 'EXTRACTION', body: `You held the ring for ${WIN_AT}s. ${s.kills} culled · ${survivors}/2 walked out.`, actions: [{ label: 'Run it back', primary: true, onSelect: () => this.restart() }] }
          : { title: 'BOTH DOWN', body: `The storm closed over you at ${s.time.toFixed(0)}s. ${s.kills} culled. Cover each other next time.`, actions: [{ label: 'Try again', primary: true, onSelect: () => this.restart() }] },
      );
    }

    this.syncActors(s);
  }

  private restart(): void {
    const world = this.world as World;
    world.state.kin = initialKin();
    this.overShown = false;
    hideScreen();
    this.syncActors(kinState(world));
  }

  private syncActors(s: KinState): void {
    const radius = stormRadius(s.time);
    this.safeDisc.shape = { kind: 'circle', radius };
    this.stormRing.shape = { kind: 'circle', radius };

    // Crate open/close state.
    for (let i = 0; i < this.crateSprites.length; i++) {
      const opened = s.crates[i]?.opened;
      this.crateSprites[i].box.paint.opacity = opened ? 0.28 : 1;
      this.crateSprites[i].glyph.paint.opacity = opened ? 0.28 : 1;
    }

    // Players.
    for (const pid of PIDS) {
      const p = s.players[pid];
      const av = this.avatars[pid];
      const nub = this.nubs[pid];
      const label = this.downLabels[pid];
      av.pos = { x: p.x, y: p.y };
      nub.pos = { x: p.x + p.dirX * (P_TUNE.radius + 3), y: p.y + p.dirY * (P_TUNE.radius + 3) };
      if (p.dead) {
        av.paint.opacity = 0.15;
        nub.paint.opacity = 0;
        label.text = '✕';
        label.pos = { x: p.x, y: p.y + 5 };
        av.paint.fill = PID_FILL[pid];
      } else if (p.downed) {
        // Dim + rose ink, a HELP call, and the revive fill as a fraction.
        av.paint.opacity = 0.5;
        av.paint.fill = PAL.down;
        nub.paint.opacity = 0;
        const pct = Math.round((p.reviveProg / P_TUNE.reviveTime) * 100);
        label.text = pct > 0 ? `▲ ${pct}%` : '▼ HELP';
        label.pos = { x: p.x, y: p.y - P_TUNE.radius - 8 };
      } else {
        av.paint.fill = PID_FILL[pid];
        av.paint.opacity = p.iframes > 0 && Math.floor(p.iframes * 16) % 2 === 0 ? 0.4 : 1;
        nub.paint.opacity = 1;
        label.text = p.interactProg > 0 ? '◇' : '';
        label.pos = { x: p.x, y: p.y - P_TUNE.radius - 8 };
      }
    }

    // Enemies (pooled).
    this.enemyPool.begin();
    for (const e of s.enemies) {
      const sp = this.enemyPool.get();
      sp.pos = { x: e.x, y: e.y };
      const T = E_TUNE[e.kind];
      sp.shape = { kind: 'circle', radius: T.radius };
      sp.paint.fill = e.kind === 'brute' ? PAL.brute : PAL.swarmer;
    }
    this.enemyPool.end();

    // Bullets (pooled).
    this.bulletPool.begin();
    for (const b of s.bullets) {
      const sp = this.bulletPool.get();
      sp.pos = { x: b.x, y: b.y };
    }
    this.bulletPool.end();

    // HUD.
    const hpStr = (pid: Pid): string => {
      const p = s.players[pid];
      if (p.dead) return '✕ OUT';
      if (p.downed) return `▼ ${Math.ceil(p.bleed)}s`;
      return `♥ ${Math.max(0, Math.ceil(p.hp))}/${P_TUNE.maxHp} · ${WEAPONS[p.weapon].label}`;
    };
    this.hpP1.text = `P1 ${hpStr('p1')}`;
    this.hpP2.text = `${hpStr('p2')} P2`;
    const secs = Math.max(0, WIN_AT - s.time);
    this.hud.text = `◷ ${secs.toFixed(0)}s to extraction · horde ${s.enemies.length} · culled ${s.kills}`;
    this.banner.text =
      s.phase === 'won' ? 'EXTRACTION' : s.phase === 'lost' ? 'BOTH DOWN' : PIDS.some((p) => s.players[p].downed) ? 'REVIVE YOUR PARTNER' : '';
  }
}

registerNode('KinView', () => new KinView({ name: 'kin-view' }));

export const kinfallGame = defineGame({
  title: 'Kinfall',
  seed: 7,
  background: PAL.bg,
  inputMap: KIN_INPUT_MAP,
  build(world) {
    world.state.kin = initialKin();
    return new KinView({ name: 'kin-view' });
  },
  probe(world) {
    const s = kinState(world);
    const pp = (pid: Pid) => {
      const p = s.players[pid];
      return { x: Math.round(p.x), y: Math.round(p.y), hp: Math.round(p.hp * 10) / 10, downed: p.downed, dead: p.dead, weapon: p.weapon, revives: p.revives };
    };
    return {
      frame: world.frame,
      time: s.time,
      phase: s.phase,
      kills: s.kills,
      horde: s.enemies.length,
      bullets: s.bullets.length,
      storm: Math.round(stormRadius(s.time)),
      crates: s.crates.filter((c) => c.opened).length,
      p1: pp('p1'),
      p2: pp('p2'),
      hash: world.hash(),
    };
  },
});

/** Declared feel contract — audited by `npm run feel`. */
export const feel: FeelSpec = { avatarFill: PAL.p1 };
