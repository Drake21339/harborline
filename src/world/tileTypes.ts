/** Harborline tile kinds — original layout vocabulary only. */
export const Tile = {
  Grass: 0,
  Road: 1,
  Sidewalk: 2,
  Building: 3,
  Park: 4,
  Water: 5,
  Fence: 6,
  Plaza: 7,
} as const;

export type TileId = (typeof Tile)[keyof typeof Tile];

export function isSolidTile(tile: TileId): boolean {
  return tile === Tile.Building || tile === Tile.Water || tile === Tile.Fence;
}

export function isWalkableTile(tile: TileId): boolean {
  return !isSolidTile(tile);
}
