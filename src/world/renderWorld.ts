import Phaser from "phaser";
import type { GeneratedWorld } from "./types";
import { Tile } from "./tileTypes";
import { districtAt } from "./types";

const TILE_COLORS: Record<number, number> = {
  [Tile.Grass]: 0x2f3b2f,
  [Tile.Road]: 0x3a3a42,
  [Tile.Sidewalk]: 0x5a5a62,
  [Tile.Building]: 0x5a4a3a,
  [Tile.Park]: 0x3a6b3e,
  [Tile.Water]: 0x2a4a6a,
  [Tile.Fence]: 0x6a5a4a,
  [Tile.Plaza]: 0x4a4a52,
};

/** Per-district building facade + roof-edge cues (interim faux height). */
const DISTRICT_BUILDING: Record<string, { face: number; roof: number; trim: number }> = {
  "pier-ward": { face: 0x4a6478, roof: 0x2a3848, trim: 0x8ab0c8 },
  midstack: { face: 0x6a6558, roof: 0x3a3830, trim: 0xc4b898 },
  "ridge-hollow": { face: 0x7a6a52, roof: 0x4a3a28, trim: 0xd0b070 },
  "freight-cut": { face: 0x7a5538, roof: 0x3a2818, trim: 0xe0a060 },
  greenbelt: { face: 0x4a6a42, roof: 0x243828, trim: 0x90c878 },
};

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

  for (let ty = 0; ty < world.height; ty += 1) {
    for (let tx = 0; tx < world.width; tx += 1) {
      const tile = world.tiles[ty * world.width + tx]!;
      const d = districtAt(world, tx, ty);
      let color = TILE_COLORS[tile] ?? 0x222222;
      const px = tx * ts;
      const py = ty * ts;

      if (tile === Tile.Grass || tile === Tile.Park) {
        if (d) color = blend(color, d.groundColor, 0.55);
        g.fillStyle(color, 1);
        g.fillRect(px, py, ts, ts);
        continue;
      }

      if (tile === Tile.Sidewalk || tile === Tile.Plaza) {
        if (d) color = blend(color, d.groundColor, 0.28);
        g.fillStyle(color, 1);
        g.fillRect(px, py, ts, ts);
        continue;
      }

      if (tile === Tile.Building) {
        const style = (d && DISTRICT_BUILDING[d.id]) || {
          face: 0x5a4a3a,
          roof: 0x2a2218,
          trim: 0xa09070,
        };
        // Faux top-down 3D: dark roof band north, lit facade south, trim east edge.
        g.fillStyle(style.roof, 1);
        g.fillRect(px, py, ts, 7);
        g.fillStyle(style.face, 1);
        g.fillRect(px, py + 7, ts, ts - 7);
        g.fillStyle(style.trim, 0.55);
        g.fillRect(px + ts - 4, py + 8, 3, ts - 10);
        // Speckle for facade variety (deterministic from coords).
        if ((tx * 17 + ty * 31) % 5 === 0) {
          g.fillStyle(blend(style.face, 0xffffff, 0.12), 1);
          g.fillRect(px + 6, py + 12, 8, 6);
        }
        continue;
      }

      g.fillStyle(color, 1);
      g.fillRect(px, py, ts, ts);
    }
  }

  // Road center lines (visual only).
  g.fillStyle(0xc8b84a, 0.35);
  for (let ty = 0; ty < world.height; ty += 1) {
    for (let tx = 0; tx < world.width; tx += 1) {
      if (world.tiles[ty * world.width + tx] !== Tile.Road) continue;
      const px = tx * ts + ts / 2 - 1;
      const py = ty * ts + ts / 2 - 1;
      g.fillRect(px, py, 2, 2);
    }
  }

  rt.draw(g, 0, 0);
  g.destroy();
  rt.saveTexture(key);
  rt.destroy();

  return scene.add.image(0, 0, key).setOrigin(0, 0).setDepth(0);
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
