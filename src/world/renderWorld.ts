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

/**
 * Paint the city once into a RenderTexture (one draw call at runtime).
 * District ground tint modulates grass/park underlays slightly.
 */
export function paintWorldTexture(scene: Phaser.Scene, world: GeneratedWorld): Phaser.GameObjects.Image {
  const key = `world-${world.seed}-${world.fingerprint}`;
  const w = world.width * world.tileSize;
  const h = world.height * world.tileSize;

  if (scene.textures.exists(key)) {
    scene.textures.remove(key);
  }

  const rt = scene.make.renderTexture({ width: w, height: h }, false);
  const g = scene.make.graphics({ x: 0, y: 0 }, false);

  for (let ty = 0; ty < world.height; ty += 1) {
    for (let tx = 0; tx < world.width; tx += 1) {
      const tile = world.tiles[ty * world.width + tx]!;
      let color = TILE_COLORS[tile] ?? 0x222222;
      if (tile === Tile.Grass || tile === Tile.Park) {
        const d = districtAt(world, tx, ty);
        if (d) {
          // Soft blend toward district ground color.
          color = blend(color, d.groundColor, 0.35);
        }
      }
      // Building facade variation by district.
      if (tile === Tile.Building) {
        const d = districtAt(world, tx, ty);
        if (d?.id === "pier-ward") color = 0x4a5a68;
        else if (d?.id === "freight-cut") color = 0x6a5038;
        else if (d?.id === "ridge-hollow") color = 0x6a5a4a;
        else if (d?.id === "greenbelt") color = 0x4a5a3a;
      }
      g.fillStyle(color, 1);
      g.fillRect(tx * world.tileSize, ty * world.tileSize, world.tileSize, world.tileSize);
    }
  }

  // Road center lines (visual only).
  g.fillStyle(0xc8b84a, 0.35);
  for (let ty = 0; ty < world.height; ty += 1) {
    for (let tx = 0; tx < world.width; tx += 1) {
      if (world.tiles[ty * world.width + tx] !== Tile.Road) continue;
      const px = tx * world.tileSize + world.tileSize / 2 - 1;
      const py = ty * world.tileSize + world.tileSize / 2 - 1;
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
