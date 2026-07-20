import Phaser from "phaser";
import type { GeneratedWorld } from "../world/types";
import { Tile } from "../world/tileTypes";
import { tileAt } from "../world/types";

export class Minimap {
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly frame: Phaser.GameObjects.Rectangle;
  private expanded = false;
  private readonly miniSize = 160;
  private readonly expandSize = 420;

  constructor(
    scene: Phaser.Scene,
    private readonly world: GeneratedWorld,
  ) {
    this.frame = scene.add
      .rectangle(0, 0, this.miniSize + 4, this.miniSize + 4, 0x000000, 0.55)
      .setScrollFactor(0)
      .setDepth(110)
      .setOrigin(1, 0);
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
    this.frame.setSize(size + 4, size + 4);
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
    this.g.fillStyle(0x1a2433, 0.9);
    this.g.fillRect(left, top, size, size);

    const worldPx = this.world.width * this.world.tileSize;
    const scale = size / worldPx;

    // Roads subsample
    this.g.fillStyle(0x555a66, 1);
    for (let ty = 0; ty < this.world.height; ty += 4) {
      for (let tx = 0; tx < this.world.width; tx += 4) {
        if (tileAt(this.world, tx, ty) === Tile.Road) {
          this.g.fillRect(left + tx * this.world.tileSize * scale, top + ty * this.world.tileSize * scale, 2, 2);
        }
      }
    }

    for (const m of markers) {
      this.g.fillStyle(0x7dffa8, 1);
      this.g.fillCircle(left + m.x * scale, top + m.y * scale, 3);
    }
    for (const p of police) {
      this.g.fillStyle(0x3a5cff, 1);
      this.g.fillCircle(left + p.x * scale, top + p.y * scale, 2.5);
    }

    const px = left + playerX * scale;
    const py = top + playerY * scale;
    this.g.fillStyle(0xf2c14e, 1);
    this.g.fillTriangle(
      px + Math.cos(facing) * 6,
      py + Math.sin(facing) * 6,
      px + Math.cos(facing + 2.4) * 5,
      py + Math.sin(facing + 2.4) * 5,
      px + Math.cos(facing - 2.4) * 5,
      py + Math.sin(facing - 2.4) * 5,
    );
  }
}
