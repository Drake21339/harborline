import Phaser from "phaser";
import type { GeneratedWorld } from "./types";
import { Tile } from "./tileTypes";
import { districtAt } from "./types";

const TILE_COLORS: Record<number, number> = {
  [Tile.Grass]: 0x2a3828,
  [Tile.Road]: 0x32323a,
  [Tile.Sidewalk]: 0x585860,
  [Tile.Building]: 0x5a4a3a,
  [Tile.Park]: 0x2f5e34,
  [Tile.Water]: 0x1e3f5c,
  [Tile.Fence]: 0x6a5a4a,
  [Tile.Plaza]: 0x484850,
};

/** Per-district building facade + roof-edge cues (faux top-down 3D). */
const DISTRICT_BUILDING: Record<
  string,
  {
    face: number;
    roof: number;
    trim: number;
    shadow: number;
    window: number;
    /** Extra roof pixels for height read (0–10). */
    mass: number;
    /** Warm window chance 0–1. */
    litChance: number;
  }
> = {
  "pier-ward": {
    face: 0x3e5a6e,
    roof: 0x152433,
    trim: 0x9ec4d8,
    shadow: 0x081018,
    window: 0xb8e0f0,
    mass: 2,
    litChance: 0.55,
  },
  midstack: {
    face: 0x8a8068,
    roof: 0x1a1810,
    trim: 0xe8dcac,
    shadow: 0x080604,
    window: 0xffe8a0,
    mass: 12,
    litChance: 0.8,
  },
  "ridge-hollow": {
    face: 0x8e7450,
    roof: 0x322414,
    trim: 0xe8c080,
    shadow: 0x160e08,
    window: 0xf4d898,
    mass: 5,
    litChance: 0.48,
  },
  "freight-cut": {
    face: 0x8a5230,
    roof: 0x28180c,
    trim: 0xf0a040,
    shadow: 0x120a06,
    window: 0xffb060,
    mass: 1,
    litChance: 0.35,
  },
  greenbelt: {
    face: 0x45683e,
    roof: 0x162816,
    trim: 0xa0d888,
    shadow: 0x0a140c,
    window: 0xc0f0a0,
    mass: 0,
    litChance: 0.28,
  },
};

export type RoadClass = "arterial" | "intersection" | "local" | "waterfront" | "freight";

function roadNeighbor(
  tiles: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
): boolean {
  if (x < 0 || y < 0 || x >= width || y >= height) return false;
  return tiles[y * width + x] === Tile.Road;
}

function runLengthH(
  tiles: Uint8Array,
  width: number,
  height: number,
  tx: number,
  ty: number,
): number {
  let run = 1;
  for (let x = tx - 1; x >= 0 && roadNeighbor(tiles, width, height, x, ty); x -= 1) run += 1;
  for (let x = tx + 1; x < width && roadNeighbor(tiles, width, height, x, ty); x += 1) run += 1;
  return run;
}

function runLengthV(
  tiles: Uint8Array,
  width: number,
  height: number,
  tx: number,
  ty: number,
): number {
  let run = 1;
  for (let y = ty - 1; y >= 0 && roadNeighbor(tiles, width, height, tx, y); y -= 1) run += 1;
  for (let y = ty + 1; y < height && roadNeighbor(tiles, width, height, tx, y); y += 1) run += 1;
  return run;
}

/** Visual-only road class from neighborhood (does not change collision/layout). */
export function classifyRoad(
  world: GeneratedWorld,
  tx: number,
  ty: number,
): RoadClass {
  const { tiles, width, height } = world;
  // 2-tile-wide corridors always have a partner on one axis — require a true
  // cross (runs ≥3 on BOTH axes) before calling it an intersection.
  const runH = runLengthH(tiles, width, height, tx, ty);
  const runV = runLengthV(tiles, width, height, tx, ty);
  if (runH >= 3 && runV >= 3) return "intersection";

  const d = districtAt(world, tx, ty);
  if (d?.id === "freight-cut") return "freight";

  // Water abutting any cardinal → dock / waterfront street.
  const nearWaterOffsets: Array<[number, number]> = [
    [0, -1],
    [0, 1],
    [1, 0],
    [-1, 0],
    [1, 1],
    [-1, -1],
  ];
  const nearWater = nearWaterOffsets.some(([dx, dy]) => {
    const x = tx + dx;
    const y = ty + dy;
    if (x < 0 || y < 0 || x >= width || y >= height) return false;
    return tiles[y * width + x] === Tile.Water;
  });
  if (nearWater || d?.id === "pier-ward") return "waterfront";

  const run = Math.max(runH, runV);
  return run >= 10 ? "arterial" : "local";
}

/**
 * Paint the city once into a RenderTexture (one draw call at runtime).
 * District ground tint + building silhouettes for glanceable identity.
 */
export function paintWorldTexture(scene: Phaser.Scene, world: GeneratedWorld): Phaser.GameObjects.Image {
  const key = `world-${world.seed}-${world.fingerprint}`;
  const w = world.width * world.tileSize;
  const h = world.height * world.tileSize;
  const ts = world.tileSize;

  if (scene.textures.exists(key)) {
    scene.textures.remove(key);
  }

  const rt = scene.make.renderTexture({ width: w, height: h }, false);
  const g = scene.make.graphics({ x: 0, y: 0 }, false);

  // Deep harbor night wash (cool teal-navy — not purple).
  g.fillStyle(0x081420, 1);
  g.fillRect(0, 0, w, h);

  for (let ty = 0; ty < world.height; ty += 1) {
    for (let tx = 0; tx < world.width; tx += 1) {
      const tile = world.tiles[ty * world.width + tx]!;
      const d = districtAt(world, tx, ty);
      let color = TILE_COLORS[tile] ?? 0x222222;
      const px = tx * ts;
      const py = ty * ts;
      const hash = (tx * 17 + ty * 31) & 255;

      if (tile === Tile.Grass || tile === Tile.Park) {
        if (d) color = blend(color, d.groundColor, 0.72);
        // District ground character.
        if (d?.id === "greenbelt") color = blend(color, 0x1a7a38, 0.35);
        if (d?.id === "ridge-hollow") color = blend(color, 0x7a5a28, 0.28);
        if (d?.id === "freight-cut") color = blend(color, 0x5a2818, 0.3);
        g.fillStyle(color, 1);
        g.fillRect(px, py, ts, ts);
        if (tile === Tile.Park || (d?.id === "greenbelt" && hash % 5 === 0)) {
          g.fillStyle(blend(color, 0xa8e888, 0.4), 0.5);
          g.fillRect(px + 6 + (hash % 5), py + 8 + (hash % 4), 7, 6);
          g.fillStyle(0x1a2a14, 0.35);
          g.fillRect(px + 10 + (hash % 3), py + 14, 3, 5);
        } else if (hash % 9 === 0) {
          g.fillStyle(blend(color, 0x90c878, 0.3), 0.45);
          g.fillRect(px + 8, py + 10, 5, 4);
        }
        continue;
      }

      if (tile === Tile.Sidewalk || tile === Tile.Plaza) {
        if (d) color = blend(color, d.groundColor, 0.38);
        if (tile === Tile.Plaza) color = blend(color, 0x6a6870, 0.35);
        if (d?.id === "pier-ward") color = blend(color, 0x6a7a88, 0.25);
        g.fillStyle(color, 1);
        g.fillRect(px, py, ts, ts);
        // Curb lip + paving joints.
        g.fillStyle(blend(color, 0xffffff, 0.16), 0.75);
        g.fillRect(px, py, ts, 2);
        g.fillStyle(0x000000, 0.2);
        g.fillRect(px, py + ts - 2, ts, 2);
        if (tile === Tile.Plaza && hash % 3 === 0) {
          g.fillStyle(0xffffff, 0.06);
          g.fillRect(px + 4, py + 4, ts - 8, 1);
        }
        // Pier boardwalk planks.
        if (d?.id === "pier-ward" && tile === Tile.Sidewalk) {
          g.fillStyle(0x3a2a18, 0.25);
          g.fillRect(px + 2, py + 8, ts - 4, 2);
          g.fillRect(px + 2, py + 18, ts - 4, 2);
        }
        continue;
      }

      if (tile === Tile.Road) {
        paintRoadTile(g, world, tx, ty, px, py, ts, hash);
        continue;
      }

      if (tile === Tile.Water) {
        const wave = blend(0x143a58, 0x2a6a8a, (hash % 6) * 0.07);
        g.fillStyle(wave, 1);
        g.fillRect(px, py, ts, ts);
        // Depth bands + sparkle.
        g.fillStyle(0x0a2438, 0.35);
        g.fillRect(px, py + ts - 8, ts, 8);
        if (hash % 7 === 0) {
          g.fillStyle(0xffffff, 0.1);
          g.fillRect(px + 3, py + 9, 16, 2);
        }
        if (hash % 11 === 0) {
          g.fillStyle(0xa8d8f0, 0.18);
          g.fillRect(px + 12, py + 18, 6, 2);
        }
        continue;
      }

      if (tile === Tile.Building) {
        paintBuilding(g, world, tx, ty, px, py, ts, hash);
        continue;
      }

      if (tile === Tile.Fence) {
        g.fillStyle(0x3a2e22, 1);
        g.fillRect(px, py, ts, ts);
        g.fillStyle(0xc8a060, 0.55);
        g.fillRect(px + 1, py + 8, ts - 2, 3);
        g.fillStyle(0x8a7040, 0.4);
        g.fillRect(px + 4, py + 4, 3, ts - 8);
        g.fillRect(px + ts - 8, py + 4, 3, ts - 8);
        continue;
      }

      g.fillStyle(color, 1);
      g.fillRect(px, py, ts, ts);
    }
  }

  // Soft sodium pools near denser midstack blocks (baked, cheap).
  for (let ty = 4; ty < world.height; ty += 7) {
    for (let tx = 4; tx < world.width; tx += 9) {
      if (world.tiles[ty * world.width + tx] !== Tile.Sidewalk) continue;
      const d = districtAt(world, tx, ty);
      if (!d || (d.id !== "midstack" && d.id !== "pier-ward")) continue;
      const px = tx * ts + 10;
      const py = ty * ts + 10;
      g.fillStyle(d.id === "pier-ward" ? 0x6a9ab0 : 0xd0a040, 0.07);
      g.fillRect(px - 14, py - 14, 36, 36);
      g.fillStyle(0xf0e0a0, 0.35);
      g.fillRect(px, py, 3, 3);
    }
  }

  // Ambient night vignette (cool, not purple).
  g.fillStyle(0x040c14, 0.28);
  g.fillRect(0, 0, w, 56);
  g.fillRect(0, h - 56, w, 56);
  g.fillRect(0, 0, 40, h);
  g.fillRect(w - 40, 0, 40, h);

  rt.draw(g, 0, 0);
  g.destroy();
  rt.saveTexture(key);
  rt.destroy();

  return scene.add.image(0, 0, key).setOrigin(0, 0).setDepth(0);
}

function paintRoadTile(
  g: Phaser.GameObjects.Graphics,
  world: GeneratedWorld,
  tx: number,
  ty: number,
  px: number,
  py: number,
  ts: number,
  hash: number,
): void {
  const cls = classifyRoad(world, tx, ty);
  let asphalt = 0x2e2e36;
  if (cls === "waterfront") asphalt = 0x2a323c;
  if (cls === "freight") asphalt = 0x2a2420;
  if (cls === "local") asphalt = 0x34343c;
  if (cls === "intersection") asphalt = 0x383840;
  asphalt = blend(asphalt, hash % 2 === 0 ? 0x26262e : 0x3a3a44, 0.2);
  g.fillStyle(asphalt, 1);
  g.fillRect(px, py, ts, ts);

  // Shoulder grit.
  g.fillStyle(0x000000, 0.12);
  g.fillRect(px, py, 2, ts);
  g.fillRect(px + ts - 2, py, 2, ts);

  if (cls === "intersection") {
    // Crosswalk bars.
    g.fillStyle(0xe8e0c8, 0.55);
    for (let i = 0; i < 4; i += 1) {
      g.fillRect(px + 4 + i * 7, py + 6, 4, ts - 12);
    }
    // Stop bar.
    g.fillStyle(0xf0e8d0, 0.4);
    g.fillRect(px + 2, py + 2, ts - 4, 3);
    return;
  }

  if (cls === "arterial") {
    // Double center dashes (gold).
    g.fillStyle(0xd4c050, 0.55);
    if ((tx + ty) % 2 === 0) {
      g.fillRect(px + ts / 2 - 3, py + 5, 2, 10);
      g.fillRect(px + ts / 2 + 1, py + 5, 2, 10);
    }
    g.fillStyle(0xffffff, 0.1);
    g.fillRect(px + 1, py, 1, ts);
    g.fillRect(px + ts - 2, py, 1, ts);
    return;
  }

  if (cls === "waterfront") {
    g.fillStyle(0xa8c8d8, 0.22);
    if ((tx + ty) % 2 === 0) {
      g.fillRect(px + ts / 2 - 1, py + 6, 2, 8);
    }
    // Wet sheen strip.
    g.fillStyle(0xffffff, 0.06);
    g.fillRect(px + 4, py + 14, ts - 8, 2);
    return;
  }

  if (cls === "freight") {
    g.fillStyle(0xe09830, 0.35);
    if ((tx + ty) % 3 === 0) {
      g.fillRect(px + ts / 2 - 2, py + 4, 4, 12);
    }
    g.fillStyle(0x000000, 0.15);
    g.fillRect(px, py + ts - 4, ts, 3);
    return;
  }

  // Local — faint single dash.
  g.fillStyle(0xb0a868, 0.28);
  if ((tx + ty) % 2 === 0) {
    g.fillRect(px + ts / 2 - 1, py + 8, 2, 6);
  }
}

function paintBuilding(
  g: Phaser.GameObjects.Graphics,
  world: GeneratedWorld,
  tx: number,
  ty: number,
  px: number,
  py: number,
  ts: number,
  hash: number,
): void {
  const d = districtAt(world, tx, ty);
  const style = (d && DISTRICT_BUILDING[d.id]) || {
    face: 0x5a4a3a,
    roof: 0x2a2218,
    trim: 0xa09070,
    shadow: 0x0a0806,
    window: 0xd0c090,
    mass: 4,
    litChance: 0.5,
  };

  // Extruded faux-3D: visible south + east walls under an inset roof plate.
  // Height scales by district mass so Midstack towers vs Freight sheds.
  const wallH = Math.min(22, 10 + style.mass + (hash % 4));
  const shadowOx = 7 + Math.floor(style.mass / 2);
  const shadowOy = 8 + Math.floor(style.mass / 2);

  // Drop shadow south-east (locked light from NW).
  g.fillStyle(style.shadow, 0.82);
  g.fillRect(px + shadowOx, py + shadowOy, ts + 2, ts + 2);

  // East wall (darker vertical band — side of the box).
  const eastFace = blend(style.face, 0x000000, 0.35);
  g.fillStyle(eastFace, 1);
  g.fillRect(px + ts - 6, py + 4, 6 + Math.min(4, wallH / 3), ts - 2 + wallH * 0.15);

  // South wall (lit facade) — primary depth cue under orthographic camera.
  const face = blend(style.face, 0xffffff, 0.16);
  g.fillStyle(face, 1);
  g.fillRect(px, py + ts - wallH, ts - 4, wallH + 2);
  g.fillStyle(style.face, 1);
  g.fillRect(px + 1, py + ts - wallH + 1, ts - 6, wallH);

  // Window rows on south face.
  const lit = (hash % 100) / 100 < style.litChance;
  const rows = Math.max(1, Math.floor(wallH / 8));
  for (let row = 0; row < rows; row += 1) {
    const wy = py + ts - wallH + 3 + row * 7;
    if (lit) {
      g.fillStyle(style.window, 0.55 + (hash % 4) * 0.1);
    } else {
      g.fillStyle(0x0a1018, 0.55);
    }
    g.fillRect(px + 4, wy, 8, 5);
    g.fillRect(px + 15, wy, 8, 5);
  }

  // Roof plate inset north of the south wall.
  const roofY = py;
  const roofH = ts - wallH + 2;
  g.fillStyle(style.roof, 1);
  g.fillRect(px, roofY, ts - 5, roofH);
  // Parapet rim + highlight.
  g.fillStyle(blend(style.roof, 0xffffff, 0.22), 1);
  g.fillRect(px + 2, roofY + 2, ts - 14, 3);
  g.fillStyle(style.trim, 0.7);
  g.fillRect(px, roofY + roofH - 2, ts - 5, 2);

  // Roof furniture on taller midstack.
  if (style.mass >= 6 && hash % 3 === 0) {
    g.fillStyle(blend(style.roof, 0x708898, 0.45), 1);
    g.fillRect(px + ts - 16, roofY + 4, 7, 6);
  }

  // District signature stripes.
  if (d?.id === "freight-cut") {
    g.fillStyle(0xe08830, 0.45);
    g.fillRect(px + 2, roofY + 3, ts - 10, 3);
  }
  if (d?.id === "pier-ward") {
    g.fillStyle(0x9ec8d8, 0.4);
    g.fillRect(px + 3, roofY + roofH - 5, ts - 12, 3);
  }
  if (d?.id === "greenbelt") {
    g.fillStyle(0x2a4a28, 0.5);
    g.fillRect(px + 4, roofY + 4, ts - 14, roofH - 8);
  }
}

function blend(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

/** Create static arcade bodies from merged collision rects (top-left pixel space). */
export function createCollisionBodies(
  scene: Phaser.Scene,
  world: GeneratedWorld,
): Phaser.Physics.Arcade.StaticGroup {
  const group = scene.physics.add.staticGroup();
  for (const r of world.collisionRects) {
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    const rect = scene.add.rectangle(cx, cy, r.w, r.h, 0x000000, 0);
    group.add(rect);
  }
  return group;
}
