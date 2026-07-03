// Sproutveil world — four 40×22 rooms connected by border openings.
// Markers: '@' spawn · 'J' double-jump seed · 'D' dash boots · 'H' the Heart.
// Gates (proven real in verify.ts): the Shaft's 4-tile ledge rises need the
// double jump; the Crown's low-ceiling corridor gap needs the dash.

export interface RoomExits {
  left?: number;
  right?: number;
  up?: number;
  down?: number;
}

export interface RoomDef {
  name: string;
  rows: string[];
  exits: RoomExits;
}

const B = '#'.repeat(40);
const E = '#' + ' '.repeat(38) + '#';
const ER = '#' + ' '.repeat(39); // right border open
const EL = ' '.repeat(39) + '#'; // left border open
const HOLE = '########' + '  ' + '#'.repeat(30); // floor/ceiling with cols 8-9 open

export const ROOMS: RoomDef[] = [
  {
    // 0 · Atrium — start. Right (rows 16-18) → Shaft; floor hole (cols 8-9) → Roots.
    name: 'Atrium',
    exits: { right: 1, down: 2 },
    rows: [
      B, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,
      ER,
      '#  @' + ' '.repeat(36),
      ER,
      HOLE, HOLE, HOLE,
    ],
  },
  {
    // 1 · Shaft — dash boots 'D' on the floor; three ledges, each a 4-tile
    // (128px) rise — above the single-jump ceiling. Top-right (rows 5-6) → Crown.
    name: 'Shaft',
    exits: { left: 0, right: 3 },
    rows: [
      B, E, E, E, E,
      ER,
      ER,
      '#' + ' '.repeat(31) + '#######' + '#', // ledge3: cols 32-38, top y=224
      E, E, E,
      '#' + ' '.repeat(19) + '#######' + ' '.repeat(12) + '#', // ledge2: cols 20-26, top y=352
      E, E, E,
      '#' + ' '.repeat(7) + '#######' + ' '.repeat(24) + '#', // ledge1: cols 8-14, top y=480
      EL,
      EL,
      ' ' + ' '.repeat(28) + 'D' + ' '.repeat(9) + '#', // left open; D at col 29
      B, B, B,
    ],
  },
  {
    // 2 · Roots — the seed 'J' beyond spike patches; a staircase of 3-tile
    // (96px, single-jumpable) rises leads back to the ceiling hole (cols 8-9).
    name: 'Roots',
    exits: { up: 0 },
    rows: [
      HOLE,
      E, E, E,
      '#' + ' '.repeat(5) + '####' + ' '.repeat(29) + '#', // step5: cols 6-9, top 128
      E, E,
      '#' + ' ' + '####' + ' '.repeat(33) + '#', // step4: cols 2-5, top 224
      E, E,
      '#' + ' '.repeat(5) + '####' + ' '.repeat(29) + '#', // step3: cols 6-9, top 320
      E, E,
      '#' + ' ' + '####' + ' '.repeat(33) + '#', // step2: cols 2-5, top 416
      E, E,
      '#' + ' '.repeat(5) + '####' + ' '.repeat(29) + '#', // step1: cols 6-9, top 512
      E,
      '#' + ' '.repeat(27) + 'J' + ' '.repeat(10) + '#', // J at col 28
      '#'.repeat(14) + '^^^' + '#'.repeat(23), // spikes cols 14-16 guard the seed
      B, B,
    ],
  },
  {
    // 3 · Crown — enter high (rows 5-6), drop to a low corridor (64px of
    // headroom) with a 5-tile gap over spikes: dash or die. 'H' beyond.
    name: 'Crown',
    exits: { left: 1 },
    rows: [
      B, E, E, E, E,
      EL,
      EL,
      '#########' + ' '.repeat(30) + '#', // entry ledge: cols 1-8, top 224
      E, E,
      '#' + ' '.repeat(11) + '#'.repeat(27) + '#', // corridor ceiling: cols 12-38
      E,
      '#' + ' '.repeat(31) + 'H' + ' '.repeat(6) + '#', // H at col 32
      '#'.repeat(22) + ' '.repeat(5) + '#'.repeat(13), // corridor floor, gap cols 22-26
      '#'.repeat(22) + ' '.repeat(5) + '#'.repeat(13),
      '#'.repeat(22) + ' '.repeat(5) + '#'.repeat(13),
      '#'.repeat(22) + ' '.repeat(5) + '#'.repeat(13),
      '#'.repeat(22) + '^^^^^' + '#'.repeat(13), // spike bed of the gap
      B, B, B, B,
    ],
  },
];
