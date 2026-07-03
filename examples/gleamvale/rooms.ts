// Gleamvale — four 40×22 top-down rooms in a 2×2 grid.
// Markers: '@' spawn · 'c' chaser · 'd' darter · 's' sentry · 'H' heart container.
// The room1→room3 passage is barred by a DOOR (a solid rect over the opening)
// until the key — dropped by clearing room 2 — is used on it.

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
const HTOP = '#'.repeat(19) + '  ' + '#'.repeat(19); // cols 19-20 open

export const ROOMS: RoomDef[] = [
  {
    // 0 · Meadow Gate — one chaser to learn the sword on.
    name: 'Meadow Gate',
    exits: { right: 1, down: 2 },
    rows: [
      B, E, E, E,
      '#' + ' '.repeat(8) + '##' + ' '.repeat(28) + '#',
      E, E,
      '#  @' + ' '.repeat(25) + 'c' + ' '.repeat(9) + '#',
      E,
      ER, ER, ER,
      E, E,
      '#' + ' '.repeat(28) + '##' + ' '.repeat(8) + '#',
      E, E, E, E, E, E,
      HTOP,
    ],
  },
  {
    // 1 · Shrine Court — darters lunge, a sentry lobs orbs; the south door.
    name: 'Shrine Court',
    exits: { left: 0, down: 3 },
    rows: [
      B, E, E,
      '#' + ' '.repeat(12) + 'd' + ' '.repeat(25) + '#',
      E, E,
      '#' + ' '.repeat(30) + 's' + ' '.repeat(7) + '#',
      E, E,
      EL, EL, EL,
      E, E,
      '#' + ' '.repeat(20) + 'd' + ' '.repeat(17) + '#',
      E,
      '#' + ' '.repeat(10) + '##' + ' '.repeat(26) + '#',
      E, E, E, E,
      HTOP,
    ],
  },
  {
    // 2 · Barrow Pit — the gauntlet; clearing it drops the KEY.
    name: 'Barrow Pit',
    exits: { up: 0 },
    rows: [
      HTOP,
      E, E,
      '#' + ' '.repeat(9) + 'c' + ' '.repeat(19) + 'c' + ' '.repeat(8) + '#',
      E, E,
      '#' + ' '.repeat(11) + '##' + ' '.repeat(25) + '#', // cover, clear of the exit lane

      E, E,
      '#' + ' '.repeat(19) + 'd' + ' '.repeat(18) + '#',
      E, E,
      '#' + ' '.repeat(9) + 'c' + ' '.repeat(28) + '#',
      E, E, E, E, E, E, E, E,
      B,
    ],
  },
  {
    // 3 · Heart Vault — the guarded prize.
    name: 'Heart Vault',
    exits: { up: 1 },
    rows: [
      HTOP,
      E, E,
      '#' + ' '.repeat(19) + 's' + ' '.repeat(18) + '#',
      E, E,
      '#' + ' '.repeat(11) + 'c' + ' '.repeat(15) + 'c' + ' '.repeat(10) + '#',
      E, E, E, E,
      '#' + ' '.repeat(16) + '##' + '  ' + '##' + ' '.repeat(16) + '#',
      E, E,
      '#' + ' '.repeat(19) + 'H' + ' '.repeat(18) + '#',
      E, E, E, E, E, E,
      B,
    ],
  },
];

/** The door barring room1's south opening (room-local px rect, both sides). */
export const DOOR_RECT = { x: 19 * 32, y: 21 * 32, w: 64, h: 32 };
