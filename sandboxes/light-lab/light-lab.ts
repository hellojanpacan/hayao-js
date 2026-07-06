// light-lab — one primitive: the 2D lighting stack (LightLayer + PointLight +
// occludersFromTilemap). A dark room of solid blocks; two point lights carve
// pools of light out of the ambient darkness and cast hard/soft shadows off the
// blocks. Drive the first light with arrows/WASD; the second orbits on its own.
// Everything here is COSMETIC — lights render state, they never drive it — so
// this lab is a pure view showcase with no win/lose, no genre. Knobs (Studio
// tuning panel): ambient level/color, light radius/intensity/falloff/flicker,
// and the soft-shadow toggle. See sandboxes/README.md.

import {
  Node,
  Sprite,
  Text,
  LightLayer,
  PointLight,
  occludersFromTilemap,
  tilemapFromAscii,
  mapWidth,
  mapHeight,
  TILE,
  tileAt,
  dcos,
  dsin,
  DUSK,
  KENTO,
  registerNode,
  defineGame,
  knob,
  type TilemapData,
  type World,
} from '@hayao';

// A small walled room with a few free-standing blocks. `#` = solid (occluder),
// everything else is floor. 40px tiles → 800×480 room, centred in the 1280×720
// viewport by the layer transform below.
const ROWS = [
  '####################',
  '#..................#',
  '#..####....##......#',
  '#..................#',
  '#......##....####..#',
  '#..................#',
  '#..##......##......#',
  '#..........##......#',
  '#..####............#',
  '#..................#',
  '#........####......#',
  '####################',
];
const TILE_SIZE = 40;
const MAP: TilemapData = tilemapFromAscii(ROWS, TILE_SIZE);
// Centre the room in the 1280×720 viewport.
const OX = Math.round((1280 - mapWidth(MAP)) / 2);
const OY = Math.round((720 - mapHeight(MAP)) / 2);

class LightLab extends Node {
  override readonly type = 'LightLab';
  // Player-driven light position (design-space, room-local). Canonical knob-ish
  // state so the moment survives a snapshot/rebuild in Studio.
  lx = mapWidth(MAP) * 0.32;
  ly = mapHeight(MAP) * 0.55;
  private t = 0;
  private layer!: LightLayer;
  private lightA!: PointLight;
  private lightB!: PointLight;
  private markerA!: Sprite;
  private markerB!: Sprite;
  private hud!: Text;

  protected override onReady(): void {
    const world = this.world as World;

    // ── Scene (cosmetic view): the room, offset into view. Both the block
    //    sprites and the lights share this origin so shadows line up.
    const scene = new Node({ name: 'scene', pos: { x: OX, y: OY } });
    scene.cosmetic = true;
    this.addChild(scene);

    // Floor slab so the lit area reads as a surface, not the void.
    scene.addChild(new Sprite({ z: 0, pos: { x: mapWidth(MAP) / 2, y: mapHeight(MAP) / 2 }, shape: { kind: 'rect', w: mapWidth(MAP), h: mapHeight(MAP) }, fill: KENTO.yohaku }));
    // Solid blocks (the occluders), drawn so you can see what casts the shadows.
    for (let ty = 0; ty < MAP.rows; ty++) {
      for (let tx = 0; tx < MAP.cols; tx++) {
        if (tileAt(MAP, tx, ty) !== TILE.SOLID) continue;
        scene.addChild(new Sprite({ z: 1, pos: { x: (tx + 0.5) * TILE_SIZE, y: (ty + 0.5) * TILE_SIZE }, shape: { kind: 'rect', w: TILE_SIZE, h: TILE_SIZE }, fill: KENTO.sumi, stroke: KENTO.darkLine, strokeWidth: 1 }));
      }
    }
    // Little markers at the light centres so the pool source is legible.
    this.markerA = scene.addChild(new Sprite({ z: 3, shape: { kind: 'circle', radius: 5 }, fill: KENTO.gofun }));
    this.markerB = scene.addChild(new Sprite({ z: 3, shape: { kind: 'circle', radius: 5 }, fill: KENTO.kaki }));

    // ── LightLayer: MUST sit at the tree origin in world space (never under a
    //    screenSpace subtree). We place the lights at the same OX/OY offset as
    //    the scene so pools land on the blocks; occluders are shifted to match.
    this.layer = new LightLayer({
      name: 'lights',
      ambient: { color: world.tune('ambientColor') as string, level: world.tune('ambientLevel') as number },
      softShadows: (world.tune('softShadows') as string) === 'on',
      width: 1280,
      height: 720,
    });
    // Occluder segments are room-local; offset them into view so the shadow
    // geometry matches the drawn blocks.
    this.layer.setOccluders(occludersFromTilemap(MAP).map((s) => ({ a: { x: s.a.x + OX, y: s.a.y + OY }, b: { x: s.b.x + OX, y: s.b.y + OY } })));

    const radius = world.tune('radius') as number;
    const intensity = world.tune('intensity') as number;
    const falloff = world.tune('falloff') as number;
    const flickerAmt = world.tune('flicker') as number;
    this.lightA = new PointLight({ name: 'lightA', pos: { x: OX + this.lx, y: OY + this.ly }, radius, intensity, falloff, color: KENTO.gofun, flicker: { amount: flickerAmt, speed: 9 }, seed: 11 });
    this.lightB = new PointLight({ name: 'lightB', radius: radius * 0.8, intensity: intensity * 0.85, falloff, color: KENTO.kaki, flicker: { amount: flickerAmt, speed: 6 }, seed: 29 });
    this.layer.addChild(this.lightA);
    this.layer.addChild(this.lightB);
    this.addChild(this.layer);

    this.hud = new Text({ name: 'hud', pos: { x: 640, y: 690 }, z: 9, size: 20, align: 'center', fill: DUSK.inkSoft, text: 'LIGHTLAYER + POINTLIGHT + occludersFromTilemap · arrows/WASD move the white light · Studio knobs: ambient, radius, intensity, falloff, flicker, soft shadows' });
    this.hud.cosmetic = true;
    this.addChild(this.hud);
  }

  protected override onProcess(dt: number): void {
    if (!this.world) return;
    const world = this.world as World;
    const input = world.input;

    // Drive light A with the pad. Clamp inside the room walls.
    const sp = 320 * dt;
    if (input.isDown('left')) this.lx -= sp;
    if (input.isDown('right')) this.lx += sp;
    if (input.isDown('up')) this.ly -= sp;
    if (input.isDown('down')) this.ly += sp;
    this.lx = Math.max(TILE_SIZE, Math.min(mapWidth(MAP) - TILE_SIZE, this.lx));
    this.ly = Math.max(TILE_SIZE, Math.min(mapHeight(MAP) - TILE_SIZE, this.ly));
    this.lightA.pos = { x: OX + this.lx, y: OY + this.ly };
    this.markerA.pos = { x: this.lx, y: this.ly };

    // Light B orbits the room centre so shadows sweep with no input.
    this.t += dt;
    const bx = mapWidth(MAP) / 2 + dcos(this.t * 0.6) * mapWidth(MAP) * 0.28;
    const by = mapHeight(MAP) / 2 + dsin(this.t * 0.6) * mapHeight(MAP) * 0.28;
    this.lightB.pos = { x: OX + bx, y: OY + by };
    this.markerB.pos = { x: bx, y: by };

    // Live-apply the tuning knobs every frame (cheap; lights are pure view).
    this.layer.ambient.color = world.tune('ambientColor') as string;
    this.layer.ambient.level = world.tune('ambientLevel') as number;
    this.layer.softShadows = (world.tune('softShadows') as string) === 'on';
    const radius = world.tune('radius') as number;
    const intensity = world.tune('intensity') as number;
    const falloff = world.tune('falloff') as number;
    const flickerAmt = world.tune('flicker') as number;
    this.lightA.radius = radius;
    this.lightA.intensity = intensity;
    this.lightA.falloff = falloff;
    this.lightA.flicker.amount = flickerAmt;
    this.lightB.radius = radius * 0.8;
    this.lightB.intensity = intensity * 0.85;
    this.lightB.falloff = falloff;
    this.lightB.flicker.amount = flickerAmt;
  }

  protected override serializeProps(): Record<string, unknown> {
    return { lx: this.lx, ly: this.ly };
  }
  override applyProps(props: Record<string, unknown>): void {
    if (typeof props.lx === 'number') this.lx = props.lx;
    if (typeof props.ly === 'number') this.ly = props.ly;
  }
}

registerNode('LightLab', () => new LightLab());

export const lightLabGame = defineGame({
  title: 'Light Lab',
  width: 1280,
  height: 720,
  background: KENTO.kuro,
  tuning: {
    knobs: [
      knob.num('ambientLevel', { default: 0.12, min: 0, max: 1, step: 0.02, label: 'ambient level', group: 'ambient', cosmetic: true }),
      knob.color('ambientColor', { default: DUSK.bg, label: 'ambient color', group: 'ambient' }),
      knob.num('radius', { default: 260, min: 80, max: 520, step: 10, label: 'light radius', group: 'light', cosmetic: true }),
      knob.num('intensity', { default: 1, min: 0.1, max: 1, step: 0.05, label: 'intensity', group: 'light', cosmetic: true }),
      knob.num('falloff', { default: 1, min: 0.4, max: 3, step: 0.1, label: 'falloff', group: 'light', cosmetic: true }),
      knob.num('flicker', { default: 0.12, min: 0, max: 0.6, step: 0.02, label: 'flicker amount', group: 'light', cosmetic: true }),
      knob.enumOf('softShadows', { default: 'off', options: ['off', 'on'], label: 'soft shadows', group: 'shadows', cosmetic: true }),
    ],
  },
  build: () => new LightLab({ name: 'light-lab' }),
  probe: (world) => {
    const lab = world.root.find('light-lab') as LightLab | null;
    return {
      frame: world.frame,
      hash: world.hash(),
      lightX: lab ? Math.round(lab.lx) : 0,
      lightY: lab ? Math.round(lab.ly) : 0,
      ambient: world.tune('ambientLevel'),
    };
  },
});
