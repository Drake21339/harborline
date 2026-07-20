import { CITY_SIZE_TILES, TILE_SIZE, WORLD_SEED } from "../config/gameConfig";
import { SeededRng, hashString } from "../config/seededRng";
import { mergeSolidRects } from "./collisionMerge";
import { Tile } from "./tileTypes";
import type { DistrictDef, GeneratedWorld, WorldSpawn } from "./types";

const DISTRICTS: DistrictDef[] = [
  {
    id: "pier-ward",
    name: "Pier Ward",
    groundColor: 0x2a4860,
    x0: 0,
    y0: 0,
    x1: 48,
    y1: 56,
  },
  {
    id: "midstack",
    name: "Midstack",
    groundColor: 0x454838,
    x0: 48,
    y0: 0,
    x1: 96,
    y1: 72,
  },
  {
    id: "ridge-hollow",
    name: "Ridge Hollow",
    groundColor: 0x5a4a30,
    x0: 96,
    y0: 0,
    x1: 128,
    y1: 72,
  },
  {
    id: "freight-cut",
    name: "Freight Cut",
    groundColor: 0x6a4030,
    x0: 0,
    y0: 56,
    x1: 80,
    y1: 128,
  },
  {
    id: "greenbelt",
    name: "Greenbelt",
    groundColor: 0x1e5a32,
    x0: 80,
    y0: 72,
    x1: 128,
    y1: 128,
  },
];

function setTile(tiles: Uint8Array, width: number, x: number, y: number, tile: number): void {
  if (x < 0 || y < 0 || x >= width || y >= width) return;
  tiles[y * width + x] = tile;
}

function getTile(tiles: Uint8Array, width: number, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= width || y >= width) return Tile.Water;
  return tiles[y * width + x]!;
}

function paintRect(
  tiles: Uint8Array,
  width: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  tile: number,
  onlyIf?: (cur: number) => boolean,
): void {
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      if (onlyIf && !onlyIf(getTile(tiles, width, x, y))) continue;
      setTile(tiles, width, x, y, tile);
    }
  }
}

function paintRoadH(tiles: Uint8Array, width: number, y: number, x0: number, x1: number): void {
  for (let x = x0; x < x1; x += 1) {
    setTile(tiles, width, x, y, Tile.Road);
    setTile(tiles, width, x, y + 1, Tile.Road);
    if (y > 0 && getTile(tiles, width, x, y - 1) !== Tile.Road) {
      setTile(tiles, width, x, y - 1, Tile.Sidewalk);
    }
    if (y + 2 < width && getTile(tiles, width, x, y + 2) !== Tile.Road) {
      setTile(tiles, width, x, y + 2, Tile.Sidewalk);
    }
  }
}

function paintRoadV(tiles: Uint8Array, width: number, x: number, y0: number, y1: number): void {
  for (let y = y0; y < y1; y += 1) {
    setTile(tiles, width, x, y, Tile.Road);
    setTile(tiles, width, x + 1, y, Tile.Road);
    if (x > 0 && getTile(tiles, width, x - 1, y) !== Tile.Road) {
      setTile(tiles, width, x - 1, y, Tile.Sidewalk);
    }
    if (x + 2 < width && getTile(tiles, width, x + 2, y) !== Tile.Road) {
      setTile(tiles, width, x + 2, y, Tile.Sidewalk);
    }
  }
}

function placeBlockBuildings(
  tiles: Uint8Array,
  width: number,
  rng: SeededRng,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  density: number,
): void {
  for (let y = y0; y < y1 - 3; y += 4) {
    for (let x = x0; x < x1 - 3; x += 4) {
      // Skip if roads already claim the cell.
      let blocked = false;
      for (let dy = 0; dy < 3 && !blocked; dy += 1) {
        for (let dx = 0; dx < 3 && !blocked; dx += 1) {
          const t = getTile(tiles, width, x + dx, y + dy);
          if (t === Tile.Road || t === Tile.Water || t === Tile.Fence || t === Tile.Plaza) {
            blocked = true;
          }
        }
      }
      if (blocked) continue;
      if (rng.next() > density) continue;
      const bw = rng.nextInt(2, 4);
      const bh = rng.nextInt(2, 4);
      paintRect(tiles, width, x, y, Math.min(x + bw, x1), Math.min(y + bh, y1), Tile.Building, (cur) =>
        cur === Tile.Grass || cur === Tile.Sidewalk || cur === Tile.Park,
      );
    }
  }
}

function fingerprintTiles(tiles: Uint8Array): string {
  // Stable short fingerprint: FNV-ish over subsampled tiles + length.
  let h = 2166136261 >>> 0;
  h = Math.imul(h ^ tiles.length, 16777619) >>> 0;
  for (let i = 0; i < tiles.length; i += 17) {
    h = Math.imul(h ^ tiles[i]!, 16777619) >>> 0;
  }
  // Also mix corners + spawn neighborhood samples.
  for (const i of [0, tiles.length - 1, (tiles.length / 2) | 0, 64 * 128 + 64]) {
    if (i >= 0 && i < tiles.length) h = Math.imul(h ^ tiles[i]!, 16777619) >>> 0;
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function findSpawn(tiles: Uint8Array, width: number, tileSize: number): WorldSpawn {
  // Prefer plaza / open Midstack area near known plaza paint.
  const candidates: Array<{ x: number; y: number }> = [];
  for (let y = 18; y < 36; y += 1) {
    for (let x = 52; x < 72; x += 1) {
      const t = getTile(tiles, width, x, y);
      if (t === Tile.Plaza || t === Tile.Road || t === Tile.Grass || t === Tile.Sidewalk) {
        // Require a small clear pad for future parked vehicles.
        let clear = true;
        for (let dy = -2; dy <= 2 && clear; dy += 1) {
          for (let dx = -2; dx <= 2 && clear; dx += 1) {
            const ct = getTile(tiles, width, x + dx, y + dy);
            if (ct === Tile.Building || ct === Tile.Water || ct === Tile.Fence) clear = false;
          }
        }
        if (clear) candidates.push({ x, y });
      }
    }
  }
  const pick = candidates[Math.floor(candidates.length / 2)] ?? { x: 60, y: 24 };
  return {
    tileX: pick.x,
    tileY: pick.y,
    pixelX: pick.x * tileSize + tileSize / 2,
    pixelY: pick.y * tileSize + tileSize / 2,
  };
}

export function generateWorld(seed: string = WORLD_SEED): GeneratedWorld {
  const width = CITY_SIZE_TILES;
  const height = CITY_SIZE_TILES;
  const tileSize = TILE_SIZE;
  const rng = new SeededRng(seed);
  // Warm the RNG with a fixed number of draws tied to seed hash so layout
  // choices stay seed-stable even if we tweak call order later carefully.
  const warm = hashString(seed) % 17;
  for (let i = 0; i < warm; i += 1) rng.next();

  const tiles = new Uint8Array(width * height);

  // Base fill by district grass tint zones (tile type Grass everywhere first).
  paintRect(tiles, width, 0, 0, width, height, Tile.Grass);

  // Greenbelt parks.
  paintRect(tiles, width, 88, 80, 120, 118, Tile.Park);
  paintRect(tiles, width, 100, 90, 114, 108, Tile.Park);

  // Arterial grid (deterministic, lightly jittered offsets from rng).
  const hRoads = [8, 20, 32, 44, 56, 68, 84, 100, 116];
  const vRoads = [8, 20, 32, 44, 56, 68, 80, 96, 112];
  for (const y of hRoads) {
    const jitter = rng.nextInt(0, 2);
    paintRoadH(tiles, width, Math.min(height - 3, y + jitter), 0, width);
  }
  for (const x of vRoads) {
    const jitter = rng.nextInt(0, 2);
    paintRoadV(tiles, width, Math.min(width - 3, x + jitter), 0, height);
  }

  // Midstack spawn plaza — open parked-vehicle-ready pad.
  paintRect(tiles, width, 54, 18, 70, 34, Tile.Plaza);
  // Keep plaza road access.
  paintRoadH(tiles, width, 24, 48, 80);
  paintRoadV(tiles, width, 60, 12, 40);

  // Pier Ward water boundary (south-west coast + channel).
  paintRect(tiles, width, 0, 0, 12, 56, Tile.Water);
  paintRect(tiles, width, 0, 48, 40, 56, Tile.Water);
  // Harbor finger.
  paintRect(tiles, width, 12, 40, 28, 48, Tile.Water);

  // Freight Cut rail fence corridor along south edge + cut.
  for (let x = 0; x < 80; x += 1) {
    setTile(tiles, width, x, height - 2, Tile.Fence);
    setTile(tiles, width, x, height - 1, Tile.Fence);
  }
  for (let y = 90; y < height; y += 1) {
    setTile(tiles, width, 40, y, Tile.Fence);
  }

  // Buildings by district density.
  placeBlockBuildings(tiles, width, rng, 14, 4, 46, 46, 0.55); // Pier Ward
  placeBlockBuildings(tiles, width, rng, 48, 4, 94, 68, 0.62); // Midstack
  placeBlockBuildings(tiles, width, rng, 98, 4, 124, 68, 0.5); // Ridge Hollow
  placeBlockBuildings(tiles, width, rng, 4, 58, 78, 118, 0.58); // Freight Cut
  // Sparse Greenbelt sheds.
  placeBlockBuildings(tiles, width, rng, 82, 74, 124, 120, 0.22);

  // Re-assert plaza openness after building pass.
  paintRect(tiles, width, 54, 18, 70, 34, Tile.Plaza);
  paintRoadH(tiles, width, 24, 48, 80);
  paintRoadV(tiles, width, 60, 12, 40);

  // Ensure water/fence not overwritten by plaza/roads incorrectly near coast.
  paintRect(tiles, width, 0, 0, 12, 56, Tile.Water);
  paintRect(tiles, width, 0, 48, 40, 56, Tile.Water);

  const spawn = findSpawn(tiles, width, tileSize);
  const collisionTileRects = mergeSolidRects(tiles, width, height);
  const collisionRects = collisionTileRects.map((r) => ({
    x: r.x * tileSize,
    y: r.y * tileSize,
    w: r.w * tileSize,
    h: r.h * tileSize,
  }));

  return {
    seed,
    width,
    height,
    tileSize,
    tiles,
    districts: DISTRICTS.map((d) => ({ ...d })),
    spawn,
    collisionRects,
    fingerprint: fingerprintTiles(tiles),
  };
}

/** Convenience for tests — count tiles of a kind. */
export function countTiles(world: GeneratedWorld, tile: number): number {
  let n = 0;
  for (let i = 0; i < world.tiles.length; i += 1) {
    if (world.tiles[i] === tile) n += 1;
  }
  return n;
}
