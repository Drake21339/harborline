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
  { face: number; roof: number; trim: number; shadow: number; window: number }
> = {
  "pier-ward": {
    face: 0x4a6478,
    roof: 0x1e2c3a,
    trim: 0x8ab0c8,
    shadow: 0x0a1420,
    window: 0xa8d0e8,
  },
  midstack: {
    face: 0x6e6858,
    roof: 0x2e2c24,
    trim: 0xd0c4a0,
    shadow: 0x12100c,
    window: 0xe8d8a8,
  },
  "ridge-hollow": {
    face: 0x8a7250,
    roof: 0x3a2a18,
    trim: 0xe0b878,
    shadow: 0x181008,
    window: 0xf0d090,
  },
  "freight-cut": {
    face: 0x8a5a38,
    roof: 0x2e1c10,
    trim: 0xf0a850,
    shadow: 0x140c08,
    window: 0xffc070,
  },
  greenbelt: {
    face: 0x4a6e42,
    roof: 0x1a2c1c,
    trim: 0x98d080,
    shadow: 0x0c1810,
    window: 0xb8e898,
  },
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

  // Soft night wash under everything (cool harbor, not purple).
  g.fillStyle(0x0c1828, 1);
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
        if (d) color = blend(color, d.groundColor, 0.62);
        g.fillStyle(color, 1);
        g.fillRect(px, py, ts, ts);
        // Sparse canopy speckles.
        if (hash % 7 === 0) {
          g.fillStyle(blend(color, 0x90c878, 0.35), 0.55);
          g.fillRect(px + 8, py + 10, 6, 5);
        }
        continue;
      }

      if (tile === Tile.Sidewalk || tile === Tile.Plaza) {
        if (d) color = blend(color, d.groundColor, 0.32);
        g.fillStyle(color, 1);
        g.fillRect(px, py, ts, ts);
        // Curb lip on north edge for faux height.
        g.fillStyle(blend(color, 0xffffff, 0.12), 0.7);
        g.fillRect(px, py, ts, 2);
        g.fillStyle(0x000000, 0.18);
        g.fillRect(px, py + ts - 2, ts, 2);
        continue;
      }

      if (tile === Tile.Road) {
        const asphalt = blend(color, hash % 2 === 0 ? 0x2a2a32 : 0x3a3a44, 0.25);
        g.fillStyle(asphalt, 1);
        g.fillRect(px, py, ts, ts);
        continue;
      }

      if (tile === Tile.Water) {
        const wave = blend(color, 0x3a6a8a, (hash % 5) * 0.06);
        g.fillStyle(wave, 1);
        g.fillRect(px, py, ts, ts);
        if (hash % 9 === 0) {
          g.fillStyle(0xffffff, 0.08);
          g.fillRect(px + 4, py + 10, 14, 2);
        }
        continue;
      }

      if (tile === Tile.Building) {
        const style = (d && DISTRICT_BUILDING[d.id]) || {
          face: 0x5a4a3a,
          roof: 0x2a2218,
          trim: 0xa09070,
          shadow: 0x0a0806,
          window: 0xd0c090,
        };
        // Drop shadow south-east (locked top-down light from NW).
        g.fillStyle(style.shadow, 0.72);
        g.fillRect(px + 5, py + 7, ts - 1, ts - 1);

        // Roof plate (north) + lit facade (south) = faux height read at mid zoom.
        const roofH = 11 + (hash % 4);
        g.fillStyle(style.roof, 1);
        g.fillRect(px, py, ts, roofH);
        g.fillStyle(blend(style.roof, 0xffffff, 0.14), 1);
        g.fillRect(px + 2, py + 2, ts - 8, 3);

        // South face brighter than roof — the 3D cue.
        g.fillStyle(blend(style.face, 0xffffff, 0.08), 1);
        g.fillRect(px, py + roofH, ts, ts - roofH);
        g.fillStyle(style.face, 1);
        g.fillRect(px + 1, py + roofH + 1, ts - 2, ts - roofH - 2);

        // East trim / parapet catch-light.
        g.fillStyle(style.trim, 0.8);
        g.fillRect(px + ts - 5, py + roofH, 4, ts - roofH);

        // Windows — warm sodium vs cool harbor by district.
        g.fillStyle(style.window, 0.45 + (hash % 4) * 0.1);
        g.fillRect(px + 5, py + roofH + 5, 8, 6);
        if (ts - roofH > 16) {
          g.fillRect(px + 16, py + roofH + 13, 8, 6);
        }
        continue;
      }

      if (tile === Tile.Fence) {
        g.fillStyle(0x4a3a2a, 1);
        g.fillRect(px, py, ts, ts);
        g.fillStyle(0xc8a060, 0.45);
        g.fillRect(px + 2, py + 10, ts - 4, 3);
        continue;
      }

      g.fillStyle(color, 1);
      g.fillRect(px, py, ts, ts);
    }
  }

  // Road center dashes + lane edge (visual only).
  for (let ty = 0; ty < world.height; ty += 1) {
    for (let tx = 0; tx < world.width; tx += 1) {
      if (world.tiles[ty * world.width + tx] !== Tile.Road) continue;
      const px = tx * ts;
      const py = ty * ts;
      g.fillStyle(0xc8b84a, 0.4);
      if ((tx + ty) % 2 === 0) {
        g.fillRect(px + ts / 2 - 1, py + 6, 2, 8);
      }
      g.fillStyle(0xffffff, 0.06);
      g.fillRect(px, py, 1, ts);
    }
  }

  // Ambient night vignette corners (baked, cheap).
  g.fillStyle(0x061018, 0.22);
  g.fillRect(0, 0, w, 48);
  g.fillRect(0, h - 48, w, 48);

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
