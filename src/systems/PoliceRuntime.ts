import Phaser from "phaser";
import { HEAT, policeCapForHeat } from "./heat";

interface Cop {
  view: Phaser.GameObjects.Rectangle;
  x: number;
  y: number;
  inCar: boolean;
  active: boolean;
  near: boolean;
}

const MAX_POOL = 5;

export class PoliceRuntime {
  private readonly units: Cop[] = [];
  private seenPlayer = false;

  constructor(scene: Phaser.Scene) {
    for (let i = 0; i < MAX_POOL; i += 1) {
      const inCar = i % 2 === 1;
      const view = scene.add
        .rectangle(0, 0, inCar ? 26 : 14, 14, 0x3a5cff)
        .setDepth(9)
        .setVisible(false);
      this.units.push({
        view,
        x: 0,
        y: 0,
        inCar,
        active: false,
        near: false,
      });
    }
  }

  get activeCount(): number {
    return this.units.filter((u) => u.active).length;
  }

  get isPlayerSeen(): boolean {
    return this.seenPlayer;
  }

  get inArrestRange(): boolean {
    return this.units.some((u) => u.active && u.near);
  }

  update(
    heatLevel: number,
    playerX: number,
    playerY: number,
    dtSec: number,
    now: number,
  ): void {
    const cap = policeCapForHeat(heatLevel);
    this.maintainCap(cap, playerX, playerY);

    this.seenPlayer = false;
    for (const u of this.units) {
      u.near = false;
      if (!u.active) continue;
      const dx = playerX - u.x;
      const dy = playerY - u.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 520) this.seenPlayer = true;
      if (dist < HEAT.arrestRange) u.near = true;

      const speed = u.inCar ? 170 : 120;
      if (dist > 4) {
        u.x += (dx / dist) * speed * dtSec;
        u.y += (dy / dist) * speed * dtSec;
      }
      u.view.setPosition(u.x, u.y);
      if (heatLevel >= 4 && Math.floor(now / 200) % 2 === 0) {
        u.view.setFillStyle(0xffffff);
      } else {
        u.view.setFillStyle(u.near ? 0xff5555 : 0x3a5cff);
      }
    }
  }

  clearAll(): void {
    for (const u of this.units) {
      u.active = false;
      u.near = false;
      u.view.setVisible(false);
    }
    this.seenPlayer = false;
  }

  private maintainCap(cap: number, playerX: number, playerY: number): void {
    let active = this.units.filter((u) => u.active).length;
    while (active > cap) {
      const u = this.units.find((c) => c.active);
      if (!u) break;
      u.active = false;
      u.view.setVisible(false);
      active -= 1;
    }
    while (active < cap) {
      const u = this.units.find((c) => !c.active);
      if (!u) break;
      const ang = Math.random() * Math.PI * 2;
      const dist = 260 + Math.random() * 160;
      u.x = playerX + Math.cos(ang) * dist;
      u.y = playerY + Math.sin(ang) * dist;
      u.active = true;
      u.view.setVisible(true);
      u.view.setPosition(u.x, u.y);
      active += 1;
    }
  }
}
