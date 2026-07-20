import Phaser from "phaser";
import type { GeneratedWorld } from "../world/types";
import { Tile } from "../world/tileTypes";
import { tileAt } from "../world/types";

export class Minimap {
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly frame: Phaser.GameObjects.Rectangle;
  private expanded = false;
  private readonly miniSize = 168;
  private readonly expandSize = 440;

  constructor(
    scene: Phaser.Scene,
    private readonly world: GeneratedWorld,
  ) {
    this.frame = scene.add
      .rectangle(0, 0, this.miniSize + 6, this.miniSize + 6, 0x000000, 0.65)
      .setScrollFactor(0)
      .setDepth(110)
      .setOrigin(1, 0)
      .setStrokeStyle(1, 0x7dffa8, 0.35);
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
    this.g.clear();
    this.g.fillStyle(0x121c2a, 0.92);
    this.g.fillRect(left, top, size, size);

    const worldPx = this.world.width * this.world.tileSize;
    const scale = size / worldPx;
    const step = this.expanded ? 2 : 3;

    // Water / parks for district read, then roads on top.
    for (let ty = 0; ty < this.world.height; ty += step) {
      for (let tx = 0; tx < this.world.width; tx += step) {
        const t = tileAt(this.world, tx, ty);
        const x = left + tx * this.world.tileSize * scale;
        const y = top + ty * this.world.tileSize * scale;
        if (t === Tile.Water) {
          this.g.fillStyle(0x2a4a6a, 1);
          this.g.fillRect(x, y, 2, 2);
        } else if (t === Tile.Park || t === Tile.Grass) {
          this.g.fillStyle(0x2f5a36, 0.7);
          this.g.fillRect(x, y, 2, 2);
        } else if (t === Tile.Road) {
          this.g.fillStyle(0x6a7080, 1);
          this.g.fillRect(x, y, 2.5, 2.5);
        }
      }
    }

    for (const m of markers) {
      this.g.fillStyle(0x7dffa8, 1);
      this.g.fillCircle(left + m.x * scale, top + m.y * scale, this.expanded ? 5 : 4);
      this.g.lineStyle(1, 0xffffff, 0.7);
      this.g.strokeCircle(left + m.x * scale, top + m.y * scale, this.expanded ? 7 : 5);
    }
    for (const p of police) {
      this.g.fillStyle(0x4a6cff, 1);
      this.g.fillCircle(left + p.x * scale, top + p.y * scale, this.expanded ? 4 : 3);
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
}
