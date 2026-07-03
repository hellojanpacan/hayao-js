// Tilemaps: grid collision geometry authored as ASCII. Plain data + pure
// functions (house style) so maps serialize, hash, and diff cleanly.

export const TILE = {
  EMPTY: 0,
  SOLID: 1,
  /** Passable from below/sides; solid only when landing on its top edge. */
  ONEWAY: 2,
  HAZARD: 3,
} as const;
export type TileId = (typeof TILE)[keyof typeof TILE];

export interface TilemapData {
  /** Size in tiles. */
  cols: number;
  rows: number;
  /** Tile edge in design-space px. */
  tileSize: number;
  /** Row-major tile ids, length cols*rows. */
  tiles: number[];
}

/** Default ASCII vocabulary: `#` solid, `-` one-way, `^` hazard, else empty. */
export const DEFAULT_TILE_CHARS: Record<string, TileId> = {
  '#': TILE.SOLID,
  '-': TILE.ONEWAY,
  '^': TILE.HAZARD,
};

/**
 * Build a tilemap from ASCII rows. Unknown characters are EMPTY, so level
 * strings can carry entity markers (`@` spawn, `*` shard…) for game code to
 * read separately via `asciiEntities`.
 */
export function tilemapFromAscii(rowsAscii: string[], tileSize = 32, chars: Record<string, TileId> = DEFAULT_TILE_CHARS): TilemapData {
  const rows = rowsAscii.length;
  const cols = Math.max(...rowsAscii.map((r) => r.length));
  const tiles = new Array<number>(cols * rows).fill(TILE.EMPTY);
  rowsAscii.forEach((row, ty) => {
    for (let tx = 0; tx < row.length; tx++) tiles[ty * cols + tx] = chars[row[tx]] ?? TILE.EMPTY;
  });
  return { cols, rows, tileSize, tiles };
}

/** Extract entity markers (any char not in the tile vocabulary, not space/dot). */
export function asciiEntities(rowsAscii: string[], tileSize = 32, chars: Record<string, TileId> = DEFAULT_TILE_CHARS): { char: string; tx: number; ty: number; x: number; y: number }[] {
  const out: { char: string; tx: number; ty: number; x: number; y: number }[] = [];
  rowsAscii.forEach((row, ty) => {
    for (let tx = 0; tx < row.length; tx++) {
      const c = row[tx];
      if (c === ' ' || c === '.' || chars[c] !== undefined) continue;
      out.push({ char: c, tx, ty, x: (tx + 0.5) * tileSize, y: (ty + 0.5) * tileSize });
    }
  });
  return out;
}

/** Tile id at tile coords; out-of-bounds reads as SOLID (levels are sealed). */
export function tileAt(map: TilemapData, tx: number, ty: number): number {
  if (tx < 0 || ty < 0 || tx >= map.cols || ty >= map.rows) return TILE.SOLID;
  return map.tiles[ty * map.cols + tx];
}

export function tileAtPoint(map: TilemapData, x: number, y: number): number {
  return tileAt(map, Math.floor(x / map.tileSize), Math.floor(y / map.tileSize));
}

export const mapWidth = (map: TilemapData): number => map.cols * map.tileSize;
export const mapHeight = (map: TilemapData): number => map.rows * map.tileSize;
