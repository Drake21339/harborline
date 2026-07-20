import Phaser from "phaser";
import type { GeneratedWorld } from "../world/types";
import { Tile } from "../world/tileTypes";
import { tileAt } from "../world/types";

/**
 * Minimap with a cached static road/water layer (paint once per expand mode)
 * and cheap per-frame dynamic markers.
 */
export class Minimap {
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly frame: Phaser.GameObjects.Rectangle;
  private readonly base: Phaser.GameObjects.RenderTexture;
  private expanded = false;
  private cachedExpanded: boolean | null = null;
  private readonly miniSize = 168;
  private readonly expandSize = 440;

  constructor(
    scene: Phaser.Scene,
    private readonly world: GeneratedWorld,
  ) {
    this.frame = scene.add
      .rectangle(0, 0, this.miniSize + 8, this.miniSize + 8, 0x061018, 0.88)
      .setScrollFactor(0)
      .setDepth(110)
      .setOrigin(1, 0)
      .setStrokeStyle(2, 0x3ad0ff, 0.75);
    this.base = scene.add
      .renderTexture(0, 0, this.expandSize, this.expandSize)
      .setScrollFactor(0)
      .setDepth(110.5)
      .setOrigin(0, 0);
    this.g = scene.add.graphics().setScrollFactor(0).setDepth(111);
    this.layout(scene.scale.width);
  }

  toggleExpanded(): void {
    this.expanded = !this.expanded;
  }

  get isExpanded(): boolean {
    return this.expanded;
  }

  layout(viewW: number): void {
    const size = this.expanded ? this.expandSize : this.miniSize;
    const x = viewW - 12;
    const y = 12;
    this.frame.setPosition(x, y);
    this.frame.setSize(size + 6, size + 6);
  }

  draw(
    viewW: number,
    playerX: number,
    playerY: number,
    facing: number,
    police: Array<{ x: number; y: number }>,
    markers: Array<{ x: number; y: number }>,
  ): void {
    const size = this.expanded ? this.expandSize : this.miniSize;
    this.layout(viewW);
    const left = viewW - 12 - size;
    const top = 14;

    if (this.cachedExpanded !== this.expanded) {
      this.repaintBase(size);
      this.cachedExpanded = this.expanded;
    }

    this.base.setPosition(left, top);
    this.base.setDisplaySize(size, size);
    this.base.setVisible(true);

    this.g.clear();
    const worldPx = this.world.width * this.world.tileSize;
    const scale = size / worldPx;

    for (const m of markers) {
      this.g.fillStyle(0x9ef0c0, 1);
      this.g.fillCircle(left + m.x * scale, top + m.y * scale, this.expanded ? 6 : 4);
      this.g.lineStyle(1, 0xffffff, 0.85);
      this.g.strokeCircle(left + m.x * scale, top + m.y * scale, this.expanded ? 8 : 6);
    }
    for (const p of police) {
      this.g.fillStyle(0xff5555, 1);
      this.g.fillCircle(left + p.x * scale, top + p.y * scale, this.expanded ? 5 : 3.5);
    }

    const px = left + playerX * scale;
    const py = top + playerY * scale;
    this.g.fillStyle(0xf2c14e, 1);
    this.g.fillTriangle(
      px + Math.cos(facing) * 7,
      py + Math.sin(facing) * 7,
      px + Math.cos(facing + 2.4) * 6,
      py + Math.sin(facing + 2.4) * 6,
      px + Math.cos(facing - 2.4) * 6,
      py + Math.sin(facing - 2.4) * 6,
    );
  }

  private repaintBase(size: number): void {
    const g = this.base.scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x0c1826, 0.96);
    g.fillRect(0, 0, size, size);

    const worldPx = this.world.width * this.world.tileSize;
    const scale = size / worldPx;
    const step = this.expanded ? 2 : 3;

    for (let ty = 0; ty < this.world.height; ty += step) {
      for (let tx = 0; tx < this.world.width; tx += step) {
        const t = tileAt(this.world, tx, ty);
        const x = tx * this.world.tileSize * scale;
        const y = ty * this.world.tileSize * scale;
        const cell = this.expanded ? 3.2 : 2.4;
        if (t === Tile.Water) {
          g.fillStyle(0x2a6a9a, 1);
          g.fillRect(x, y, cell, cell);
        } else if (t === Tile.Park || t === Tile.Grass) {
          g.fillStyle(0x3a8a44, 1);
          g.fillRect(x, y, cell, cell);
        } else if (t === Tile.Road) {
          g.fillStyle(0xc8ced8, 1);
          g.fillRect(x, y, cell + 0.4, cell + 0.4);
        } else if (t === Tile.Building) {
          g.fillStyle(0x5a4a38, 0.75);
          g.fillRect(x, y, cell * 0.85, cell * 0.85);
        } else if (t === Tile.Plaza || t === Tile.Sidewalk) {
          g.fillStyle(0x6a7080, 0.7);
          g.fillRect(x, y, cell * 0.9, cell * 0.9);
        }
      }
    }

    this.base.clear();
    this.base.resize(size, size);
    this.base.draw(g, 0, 0);
    g.destroy();
  }
}
