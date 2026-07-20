import { CITY_SIZE_TILES, TILE_SIZE, WORLD_SEED } from "../config/gameConfig";
import { SeededRng, hashString } from "../config/seededRng";
import { mergeSolidRects } from "./collisionMerge";
import { buildNavGraph } from "./navGraph";
import { RoadClass, ROAD_WIDTH_TILES, type RoadClassName } from "./roadTypes";
import { Tile } from "./tileTypes";
import type { DistrictDef, GeneratedWorld, PaintShop, WorldSpawn } from "./types";

const DISTRICTS: DistrictDef[] = [
  {
    id: "pier-ward",
    name: "Pier Ward",
    groundColor: 0x1e4a68,
    x0: 0,
    y0: 0,
    x1: 48,
    y1: 56,
  },
  {
    id: "midstack",
    name: "Midstack",
    groundColor: 0x4a4a38,
    x0: 48,
    y0: 0,
    x1: 96,
    y1: 72,
  },
  {
    id: "ridge-hollow",
    name: "Ridge Hollow",
    groundColor: 0x6a5230,
    x0: 96,
    y0: 0,
    x1: 128,
    y1: 72,
  },
  {
    id: "freight-cut",
    name: "Freight Cut",
    groundColor: 0x7a3820,
    x0: 0,
    y0: 56,
    x1: 80,
    y1: 128,
  },
  {
    id: "greenbelt",
    name: "Greenbelt",
    groundColor: 0x146a2e,
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

function setClass(
  roadClass: Uint8Array,
  width: number,
  x: number,
  y: number,
  cls: number,
): void {
  if (x < 0 || y < 0 || x >= width || y >= width) return;
  const i = y * width + x;
  // Keep the higher class when overlapping.
  if ((roadClass[i] ?? 0) < cls) roadClass[i] = cls;
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

function classId(name: RoadClassName): number {
  if (name === "freeway") return RoadClass.Freeway;
  if (name === "arterial") return RoadClass.Arterial;
  return RoadClass.Local;
}

/** Horizontal road band: `roadW` driveable tiles + sidewalks north/south. Freeway cuts a median. */
function paintRoadH(
  tiles: Uint8Array,
  roadClass: Uint8Array,
  width: number,
  yStart: number,
  x0: number,
  x1: number,
  cls: RoadClassName,
): void {
  const roadW = ROAD_WIDTH_TILES[cls];
  const cid = classId(cls);
  const median = cls === "freeway" ? Math.floor(roadW / 2) : -1;
  for (let x = x0; x < x1; x += 1) {
    for (let dy = 0; dy < roadW; dy += 1) {
      const y = yStart + dy;
      if (dy === median) {
        // Median strip — grass barrier, not driveable.
        setTile(tiles, width, x, y, Tile.Grass);
        continue;
      }
      setTile(tiles, width, x, y, Tile.Road);
      setClass(roadClass, width, x, y, cid);
    }
    const yNorth = yStart - 1;
    const ySouth = yStart + roadW;
    if (yNorth >= 0 && getTile(tiles, width, x, yNorth) !== Tile.Road) {
      setTile(tiles, width, x, yNorth, Tile.Sidewalk);
    }
    if (ySouth < width && getTile(tiles, width, x, ySouth) !== Tile.Road) {
      setTile(tiles, width, x, ySouth, Tile.Sidewalk);
    }
  }
}

/** Vertical road band. */
function paintRoadV(
  tiles: Uint8Array,
  roadClass: Uint8Array,
  width: number,
  xStart: number,
  y0: number,
  y1: number,
  cls: RoadClassName,
): void {
  const roadW = ROAD_WIDTH_TILES[cls];
  const cid = classId(cls);
  const median = cls === "freeway" ? Math.floor(roadW / 2) : -1;
  for (let y = y0; y < y1; y += 1) {
    for (let dx = 0; dx < roadW; dx += 1) {
      const x = xStart + dx;
      if (dx === median) {
        setTile(tiles, width, x, y, Tile.Grass);
        continue;
      }
      setTile(tiles, width, x, y, Tile.Road);
      setClass(roadClass, width, x, y, cid);
    }
    const xWest = xStart - 1;
    const xEast = xStart + roadW;
    if (xWest >= 0 && getTile(tiles, width, xWest, y) !== Tile.Road) {
      setTile(tiles, width, xWest, y, Tile.Sidewalk);
    }
    if (xEast < width && getTile(tiles, width, xEast, y) !== Tile.Road) {
      setTile(tiles, width, xEast, y, Tile.Sidewalk);
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
  for (let y = y0; y < y1 - 4; y += 5) {
    for (let x = x0; x < x1 - 4; x += 5) {
      let blocked = false;
      for (let dy = 0; dy < 4 && !blocked; dy += 1) {
        for (let dx = 0; dx < 4 && !blocked; dx += 1) {
          const t = getTile(tiles, width, x + dx, y + dy);
          if (t === Tile.Road || t === Tile.Water || t === Tile.Fence || t === Tile.Plaza) {
            blocked = true;
          }
        }
      }
      if (blocked) continue;
      if (rng.next() > density) continue;
      const bw = rng.nextInt(2, 5);
      const bh = rng.nextInt(2, 5);
      paintRect(tiles, width, x, y, Math.min(x + bw, x1), Math.min(y + bh, y1), Tile.Building, (cur) =>
        cur === Tile.Grass || cur === Tile.Sidewalk || cur === Tile.Park,
      );
    }
  }
}

function fingerprintTiles(tiles: Uint8Array, roadClass: Uint8Array): string {
  let h = 2166136261 >>> 0;
  h = Math.imul(h ^ tiles.length, 16777619) >>> 0;
  for (let i = 0; i < tiles.length; i += 17) {
    h = Math.imul(h ^ tiles[i]!, 16777619) >>> 0;
  }
  for (let i = 0; i < roadClass.length; i += 23) {
    h = Math.imul(h ^ roadClass[i]!, 16777619) >>> 0;
  }
  for (const i of [0, tiles.length - 1, (tiles.length / 2) | 0, 64 * 128 + 64]) {
    if (i >= 0 && i < tiles.length) h = Math.imul(h ^ tiles[i]!, 16777619) >>> 0;
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function findSpawn(tiles: Uint8Array, width: number, tileSize: number): WorldSpawn {
  const candidates: Array<{ x: number; y: number }> = [];
  for (let y = 18; y < 36; y += 1) {
    for (let x = 52; x < 72; x += 1) {
      const t = getTile(tiles, width, x, y);
      if (t === Tile.Plaza || t === Tile.Road || t === Tile.Grass || t === Tile.Sidewalk) {
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

function placePaintShops(
  tiles: Uint8Array,
  width: number,
  tileSize: number,
  spawn: WorldSpawn,
): PaintShop[] {
  const spots: Array<{ id: string; tx: number; ty: number }> = [
    { id: "paint-midstack", tx: 58, ty: 28 },
    { id: "paint-pier", tx: 22, ty: 22 },
    { id: "paint-freight", tx: 30, ty: 88 },
  ];
  const shops: PaintShop[] = [];
  for (const s of spots) {
    // Prefer sidewalk / plaza / grass near roads.
    let tx = s.tx;
    let ty = s.ty;
    let found = false;
    for (let r = 0; r < 6 && !found; r += 1) {
      for (let dy = -r; dy <= r && !found; dy += 1) {
        for (let dx = -r; dx <= r && !found; dx += 1) {
          const x = s.tx + dx;
          const y = s.ty + dy;
          const t = getTile(tiles, width, x, y);
          if (t === Tile.Sidewalk || t === Tile.Plaza || t === Tile.Grass) {
            tx = x;
            ty = y;
            found = true;
          }
        }
      }
    }
    shops.push({
      id: s.id,
      x: tx * tileSize + tileSize / 2,
      y: ty * tileSize + tileSize / 2,
      fee: 150,
    });
  }
  // Guarantee at least one near spawn.
  if (!shops.some((p) => Math.hypot(p.x - spawn.pixelX, p.y - spawn.pixelY) < 400)) {
    shops[0] = {
      id: "paint-spawn",
      x: spawn.pixelX + 100,
      y: spawn.pixelY + 40,
      fee: 150,
    };
  }
  return shops;
}

export function generateWorld(seed: string = WORLD_SEED): GeneratedWorld {
  const width = CITY_SIZE_TILES;
  const height = CITY_SIZE_TILES;
  const tileSize = TILE_SIZE;
  const rng = new SeededRng(seed);
  const warm = hashString(seed) % 17;
  for (let i = 0; i < warm; i += 1) rng.next();

  const tiles = new Uint8Array(width * height);
  const roadClass = new Uint8Array(width * height);

  paintRect(tiles, width, 0, 0, width, height, Tile.Grass);

  // Greenbelt parks.
  paintRect(tiles, width, 88, 80, 120, 118, Tile.Park);
  paintRect(tiles, width, 100, 90, 114, 108, Tile.Park);

  // --- Freeway spines (6 lanes + median) — inset from map edge so NPCs aren't rim-trapped ---
  paintRoadH(tiles, roadClass, width, 60, 4, width - 4, "freeway");
  paintRoadV(tiles, roadClass, width, 60, 4, height - 4, "freeway");

  // --- Arterial 4-lane grid ---
  const hArterial = [16, 36, 84, 104];
  const vArterial = [16, 36, 84, 104];
  for (const y of hArterial) {
    const jitter = rng.nextInt(0, 2);
    paintRoadH(tiles, roadClass, width, Math.min(height - 8, y + jitter), 4, width - 4, "arterial");
  }
  for (const x of vArterial) {
    const jitter = rng.nextInt(0, 2);
    paintRoadV(tiles, roadClass, width, Math.min(width - 8, x + jitter), 4, height - 4, "arterial");
  }

  // --- Local 2-lane connectors (denser, inset from edges) ---
  const hLocal = [24, 48, 72, 92, 112];
  const vLocal = [24, 48, 72, 92, 112];
  for (const y of hLocal) {
    const jitter = rng.nextInt(0, 2);
    paintRoadH(tiles, roadClass, width, Math.min(height - 5, y + jitter), 6, width - 6, "local");
  }
  for (const x of vLocal) {
    const jitter = rng.nextInt(0, 2);
    paintRoadV(tiles, roadClass, width, Math.min(width - 5, x + jitter), 6, height - 6, "local");
  }

  // Midstack spawn plaza — open parked-vehicle-ready pad.
  paintRect(tiles, width, 54, 18, 70, 34, Tile.Plaza);
  paintRoadH(tiles, roadClass, width, 24, 48, 80, "local");
  paintRoadV(tiles, roadClass, width, 60, 12, 40, "local");

  // Pier Ward water boundary.
  paintRect(tiles, width, 0, 0, 12, 56, Tile.Water);
  paintRect(tiles, width, 0, 48, 40, 56, Tile.Water);
  paintRect(tiles, width, 12, 40, 28, 48, Tile.Water);

  // Freight Cut rail fence corridor.
  for (let x = 0; x < 80; x += 1) {
    setTile(tiles, width, x, height - 2, Tile.Fence);
    setTile(tiles, width, x, height - 1, Tile.Fence);
  }
  for (let y = 90; y < height; y += 1) {
    setTile(tiles, width, 40, y, Tile.Fence);
  }

  placeBlockBuildings(tiles, width, rng, 14, 4, 46, 46, 0.55);
  placeBlockBuildings(tiles, width, rng, 48, 4, 94, 68, 0.62);
  placeBlockBuildings(tiles, width, rng, 98, 4, 124, 68, 0.5);
  placeBlockBuildings(tiles, width, rng, 4, 58, 78, 118, 0.58);
  placeBlockBuildings(tiles, width, rng, 82, 74, 124, 120, 0.22);

  // Re-assert plaza + access after buildings.
  paintRect(tiles, width, 54, 18, 70, 34, Tile.Plaza);
  paintRoadH(tiles, roadClass, width, 24, 48, 80, "local");
  paintRoadV(tiles, roadClass, width, 60, 12, 40, "local");

  // Re-assert water.
  paintRect(tiles, width, 0, 0, 12, 56, Tile.Water);
  paintRect(tiles, width, 0, 48, 40, 56, Tile.Water);

  // Clear roadClass on non-road tiles (water/buildings may have overwritten).
  for (let i = 0; i < tiles.length; i += 1) {
    if (tiles[i] !== Tile.Road) roadClass[i] = RoadClass.None;
  }

  const spawn = findSpawn(tiles, width, tileSize);
  const collisionTileRects = mergeSolidRects(tiles, width, height);
  const collisionRects = collisionTileRects.map((r) => ({
    x: r.x * tileSize,
    y: r.y * tileSize,
    w: r.w * tileSize,
    h: r.h * tileSize,
  }));

  const fingerprint = fingerprintTiles(tiles, roadClass);
  const paintShops = placePaintShops(tiles, width, tileSize, spawn);
  const stub = {
    seed,
    width,
    height,
    tileSize,
    tiles,
    roadClass,
    districts: DISTRICTS.map((d) => ({ ...d })),
    spawn,
    collisionRects,
    paintShops,
    fingerprint,
    nav: {
      nodes: [],
      vehicleEdges: [],
      pedEdges: [],
      vehicleOut: new Map<number, number[]>(),
      pedOut: new Map<number, number[]>(),
    },
  } satisfies GeneratedWorld;

  const nav = buildNavGraph(stub, 2);
  return { ...stub, nav };
}

/** Convenience for tests — count tiles of a kind. */
export function countTiles(world: GeneratedWorld, tile: number): number {
  let n = 0;
  for (let i = 0; i < world.tiles.length; i += 1) {
    if (world.tiles[i] === tile) n += 1;
  }
  return n;
}

/** Count road cells of a given class. */
export function countRoadClass(world: GeneratedWorld, cls: number): number {
  let n = 0;
  for (let i = 0; i < world.roadClass.length; i += 1) {
    if (world.roadClass[i] === cls && world.tiles[i] === Tile.Road) n += 1;
  }
  return n;
}
