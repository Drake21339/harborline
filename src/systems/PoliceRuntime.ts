import Phaser from "phaser";
import { PIXEL_ATLAS } from "../art/pixelAtlases";
import { HEAT, policeCapForHeat } from "./heat";

interface Cop {
  view: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Ellipse;
  x: number;
  y: number;
  inCar: boolean;
  active: boolean;
  near: boolean;
  frame: number;
}

const MAX_POOL = 5;

export class PoliceRuntime {
  private readonly units: Cop[] = [];
  private seenPlayer = false;
  private overlayVisible = true;

  constructor(scene: Phaser.Scene) {
    for (let i = 0; i < MAX_POOL; i += 1) {
      const inCar = i % 2 === 1;
      const frame = inCar ? i % 6 : i % 10;
      const atlas = inCar ? PIXEL_ATLAS.carsPolice : PIXEL_ATLAS.swat;
      const view = scene.add
        .image(0, 0, atlas, frame)
        .setDepth(9)
        .setVisible(false)
        .setDisplaySize(inCar ? 62 : 22, inCar ? 32 : 22);
      const glow = scene.add
        .ellipse(0, 0, inCar ? 70 : 28, inCar ? 40 : 28, 0xff2244, 0)
        .setDepth(8.5)
        .setVisible(false);
      this.units.push({
        view,
        glow,
        x: 0,
        y: 0,
        inCar,
        active: false,
        near: false,
        frame,
      });
    }
  }

  get activeCount(): number {
    return this.units.filter((u) => u.active).length;
  }

  get positions(): Array<{ x: number; y: number; inCar: boolean; heading: number }> {
    return this.units
      .filter((u) => u.active)
      .map((u) => ({
        x: u.x,
        y: u.y,
        inCar: u.inCar,
        heading: u.view.rotation,
      }));
  }

  get isPlayerSeen(): boolean {
    return this.seenPlayer;
  }

  get inArrestRange(): boolean {
    return this.units.some((u) => u.active && u.near);
  }

  setOverlayVisible(visible: boolean): void {
    this.overlayVisible = visible;
    for (const u of this.units) {
      u.view.setAlpha(visible && u.active ? 1 : 0);
      u.glow.setAlpha(0);
    }
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
      u.view.setRotation(Math.atan2(dy, dx));
      u.glow.setPosition(u.x, u.y);
      if (!this.overlayVisible) {
        u.view.setAlpha(0);
        u.glow.setAlpha(0);
        continue;
      }
      // Siren ground tint + pursuit readability.
      if (u.near) {
        u.view.setTint(0xff6666);
        u.view.setScale(1.12);
        u.glow.setFillStyle(0xff3333, 0.35);
        u.glow.setVisible(true);
      } else if (heatLevel >= 3 && Math.floor(now / 160) % 2 === 0) {
        u.view.clearTint();
        u.view.setScale(1.05);
        u.glow.setFillStyle(0x2244ff, 0.28);
        u.glow.setVisible(u.inCar);
      } else if (heatLevel >= 3) {
        u.view.setTint(0xffaaaa);
        u.view.setScale(1.05);
        u.glow.setFillStyle(0xff2244, 0.28);
        u.glow.setVisible(u.inCar);
      } else {
        u.view.clearTint();
        u.view.setScale(1);
        u.glow.setVisible(false);
      }
      u.view.setAlpha(1);
    }
  }

  clearAll(): void {
    for (const u of this.units) {
      u.active = false;
      u.near = false;
      u.view.setVisible(false);
      u.glow.setVisible(false);
    }
    this.seenPlayer = false;
  }

  private maintainCap(cap: number, playerX: number, playerY: number): void {
    let active = this.units.filter((u) => u.active).length;
    while (active > cap) {
      const u = this.units.find((x) => x.active);
      if (!u) break;
      u.active = false;
      u.view.setVisible(false);
      u.glow.setVisible(false);
      active -= 1;
    }
    while (active < cap) {
      const u = this.units.find((x) => !x.active);
      if (!u) break;
      const ang = Math.random() * Math.PI * 2;
      const dist = 220 + Math.random() * 160;
      u.x = playerX + Math.cos(ang) * dist;
      u.y = playerY + Math.sin(ang) * dist;
      u.active = true;
      u.view.setVisible(true);
      u.view.setPosition(u.x, u.y);
      u.view.clearTint();
      active += 1;
    }
  }
}
