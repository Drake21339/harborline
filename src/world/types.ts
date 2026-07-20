import type { TileId } from "./tileTypes";

export interface DistrictDef {
  id: string;
  name: string;
  /** Soft fill color for ground tinting. */
  groundColor: number;
  /** Axis-aligned district claim in tile space (inclusive min, exclusive max). */
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface WorldSpawn {
  tileX: number;
  tileY: number;
  pixelX: number;
  pixelY: number;
}

export interface CollisionRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GeneratedWorld {
  seed: string;
  width: number;
  height: number;
  tileSize: number;
  tiles: Uint8Array;
  districts: DistrictDef[];
  spawn: WorldSpawn;
  /** Merged solid AABBs in pixel space (centered Phaser rects use x,y as center). */
  collisionRects: CollisionRect[];
  fingerprint: string;
}

export function tileAt(world: GeneratedWorld, x: number, y: number): TileId {
  if (x < 0 || y < 0 || x >= world.width || y >= world.height) {
    return 5; // Water outside
  }
  return world.tiles[y * world.width + x] as TileId;
}

export function districtAt(world: GeneratedWorld, tileX: number, tileY: number): DistrictDef | null {
  for (const d of world.districts) {
    if (tileX >= d.x0 && tileX < d.x1 && tileY >= d.y0 && tileY < d.y1) {
      return d;
    }
  }
  return null;
}
