// Shard Ascent levels — 40×22 ASCII rooms (32px tiles → 1280×704 design space).
// Vocabulary: '#' solid · '-' one-way · '^' spikes · '@' spawn · '*' shard · 'E' exit.
// A lint test asserts every row is 40 chars, borders are sealed, markers exist.

export interface MoverDef {
  x0: number;
  x1: number;
  y: number;
  w: number;
  h: number;
  /** px/s, ping-pong between x0 and x1. */
  speed: number;
}

export interface LevelDef {
  name: string;
  hint: string;
  needsShard: boolean;
  rows: string[];
  movers: MoverDef[];
}

const B = '#'.repeat(40);
const E = '#' + ' '.repeat(38) + '#';

export const LEVELS: LevelDef[] = [
  {
    name: 'First Steps',
    hint: 'Arrows/WASD run · Space jumps (hold = higher)',
    needsShard: false,
    movers: [],
    rows: [
      B, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,
      '#  @                                E  #',
      '############   #########   #############',
      '############^^^#########^^^#############',
      B,
    ],
  },
  {
    name: 'Leap of Faith',
    hint: 'Trust the edge — a late jump still works',
    needsShard: false,
    movers: [],
    rows: [
      B, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,
      '#                     ----             #',
      '#  @                                E  #',
      '########    #########    ###############',
      '########^^^^#########^^^^###############',
      B,
    ],
  },
  {
    name: 'The Shard',
    hint: 'Hold Down to drop through — the gate needs the shard',
    needsShard: true,
    movers: [],
    rows: [
      B, E, E, E, E, E, E, E, E, E, E, E,
      '#  @                                E  #',
      '#######----------------------------####' + '#',
      E,
      '#                                ##    #',
      '#                                ##    #',
      '#                             ##       #',
      '#                   *         ##       #',
      '#^^^^^^^^^^^^^^^#######^^^^^############',
      B, B,
    ],
  },
  {
    name: 'Bolt',
    hint: 'X or Shift dashes — jump, then dash at the peak',
    needsShard: false,
    movers: [],
    rows: [
      B, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,
      '#  @                               E   #',
      '###############      ###################',
      '###############^^^^^^###################',
      B,
    ],
  },
  {
    name: 'Spike Garden',
    hint: 'Small hops, steady rhythm',
    needsShard: false,
    movers: [],
    rows: [
      B, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,
      '#  @                                E  #',
      '#######^^^###^^^###^^^###^^^############',
      B, B,
    ],
  },
  {
    name: 'Summit',
    hint: 'Ride the light — everything you know, at once',
    needsShard: true,
    movers: [{ x0: 288, x1: 736, y: 448, w: 96, h: 14, speed: 90 }],
    rows: [
      B, E, E, E, E, E, E, E, E, E, E, E,
      '#  @                                   #',
      '#########           *                  #',
      '#########                          E   #',
      '#########                    ###########',
      '#########                    ###########',
      '#########                    ###########',
      '#########                    ###########',
      '#########^^^^^^^^^^^^^^^^^^^^###########',
      B, B,
    ],
  },
];
