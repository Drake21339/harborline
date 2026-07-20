import Phaser from "phaser";
import { VEHICLE_FRAME } from "../art/pixelAtlases";
import type { GeneratedWorld } from "../world/types";
import { VEHICLE_DEFS, type VehicleArchetypeId, type VehicleDef } from "./defs";
import {
  applyVehicleDamage,
  createVehicleState,
  damageStage,
  findNearestVehicle,
  findSafeExit,
  impactDamageFromSpeed,
  resolveVehicleWorldCollision,
  stageTint,
  stepVehicle,
  type VehicleSimState,
} from "./vehicleSim";

export interface RuntimeVehicle {
  state: VehicleSimState;
  def: VehicleDef;
  /** Invisible physics proxy (arcade body). */
  view: Phaser.GameObjects.Rectangle;
  /** HD pixel body sprite. */
  sprite: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Ellipse;
  brakeLight: Phaser.GameObjects.Rectangle;
}

export class VehicleRuntime {
  readonly vehicles: RuntimeVehicle[] = [];
  activeId: string | null = null;
  /** Cleared by GameScene after juice (camera nudge / skid). */
  lastImpact: { impactSpeed: number; damage: number; x: number; y: number } | null = null;
  private lastSkidAt = 0;
  private overlayVisible = true;
  private readonly paintColors = new Map<string, number>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly world: GeneratedWorld,
  ) {}

  /** Park one of each archetype; compact sits at spawn for enter/exit e2e. */
  spawnFleet(spawnX: number, spawnY: number): void {
    const placements: Array<{ id: VehicleArchetypeId; x: number; y: number; heading: number }> = [
      { id: "compact", x: spawnX + 48, y: spawnY + 8, heading: 0 },
      { id: "sedan", x: spawnX - 64, y: spawnY + 40, heading: -0.2 },
      { id: "sports", x: spawnX + 120, y: spawnY + 90, heading: 0.4 },
      { id: "van", x: spawnX - 20, y: spawnY + 110, heading: Math.PI },
      { id: "taxi", x: spawnX + 200, y: spawnY - 20, heading: 1.2 },
      { id: "police", x: spawnX - 140, y: spawnY - 60, heading: -1.0 },
      { id: "ambulance", x: spawnX + 160, y: spawnY + 40, heading: 0.6 },
    ];

    for (const p of placements) {
      const def = VEHICLE_DEFS[p.id];
      const state = createVehicleState(`veh-${p.id}`, def, p.x, p.y, p.heading);
      const frameInfo = VEHICLE_FRAME[p.id] ?? VEHICLE_FRAME.sedan!;
      const shadow = this.scene.add
        .ellipse(p.x + 4, p.y + 6, def.width * 0.95, def.height * 0.7, 0x000000, 0.35)
        .setDepth(7)
        .setRotation(p.heading);
      const sprite = this.scene.add
        .image(p.x, p.y, frameInfo.atlas, frameInfo.frame)
        .setDepth(8)
        .setRotation(p.heading)
        .setDisplaySize(def.width + 18, def.height + 14);
      const view = this.scene.add
        .rectangle(p.x, p.y, def.width, def.height, 0xffffff, 0)
        .setDepth(8.1)
        .setRotation(p.heading);
      this.scene.physics.add.existing(view);
      const body = view.body as Phaser.Physics.Arcade.Body;
      body.setImmovable(true);
      body.setAllowGravity(false);
      const brakeLight = this.scene.add
        .rectangle(p.x, p.y, 8, 4, 0xff3030, 0)
        .setDepth(10);
      this.vehicles.push({ state, def, view, sprite, shadow, brakeLight });
    }
  }

  get active(): RuntimeVehicle | null {
    if (!this.activeId) return null;
    return this.vehicles.find((v) => v.state.id === this.activeId) ?? null;
  }

  setOverlayVisible(visible: boolean): void {
    this.overlayVisible = visible;
    for (const v of this.vehicles) {
      v.sprite.setVisible(visible);
      v.shadow.setVisible(visible);
      v.brakeLight.setVisible(visible);
      v.view.setAlpha(0);
    }
  }

  setPaintColor(vehicleId: string, color: number): void {
    this.paintColors.set(vehicleId, color);
    const v = this.vehicles.find((x) => x.state.id === vehicleId);
    if (v) {
      v.def = { ...v.def, color };
      v.sprite.setTint(color);
    }
  }

  paintActiveOrNearest(x: number, y: number, color: number): string | null {
    const active = this.active;
    if (active) {
      this.setPaintColor(active.state.id, color);
      return active.state.id;
    }
    let best: RuntimeVehicle | null = null;
    let bestD = 70;
    for (const v of this.vehicles) {
      if (v.state.destroyed) continue;
      const d = Math.hypot(v.state.x - x, v.state.y - y);
      if (d < bestD) {
        bestD = d;
        best = v;
      }
    }
    if (!best) return null;
    this.setPaintColor(best.state.id, color);
    return best.state.id;
  }

  get bodyColor(): (id: string) => number {
    return (id: string) => {
      const painted = this.paintColors.get(id);
      if (painted !== undefined) return painted;
      return this.vehicles.find((v) => v.state.id === id)?.def.color ?? 0xffffff;
    };
  }

  tryEnter(playerX: number, playerY: number): boolean {
    if (this.activeId) return false;
    const near = findNearestVehicle(
      this.vehicles.map((v) => v.state),
      playerX,
      playerY,
      46,
    );
    if (!near) return false;
    this.activeId = near.id;
    return true;
  }

  tryExit(): { x: number; y: number } | null {
    const active = this.active;
    if (!active) return null;
    const exit = findSafeExit(
      this.world,
      active.state.x,
      active.state.y,
      active.state.heading,
    );
    active.state.speed = 0;
    this.activeId = null;
    this.syncView(active, false);
    return exit;
  }

  update(
    dtSec: number,
    input: { throttle: number; steer: number; handbrake: boolean },
  ): void {
    const active = this.active;
    this.lastImpact = null;
    for (const v of this.vehicles) {
      const isActive = active?.state.id === v.state.id;
      if (isActive && !v.state.destroyed) {
        const prevX = v.state.x;
        const prevY = v.state.y;
        stepVehicle(v.state, v.def, input, dtSec);
        const max = this.world.width * this.world.tileSize - 8;
        v.state.x = Math.max(8, Math.min(max, v.state.x));
        v.state.y = Math.max(8, Math.min(max, v.state.y));
        const hit = resolveVehicleWorldCollision(v.state, v.def, this.world, prevX, prevY);
        if (hit.hit) {
          const dmg = impactDamageFromSpeed(hit.impactSpeed, v.def.collisionDamage);
          if (dmg > 0) applyVehicleDamage(v.state, dmg);
          v.sprite.setTint(0xffeeaa);
          this.lastImpact = {
            impactSpeed: hit.impactSpeed,
            damage: dmg,
            x: v.state.x,
            y: v.state.y,
          };
          if (dmg > 0) {
            const spark = this.scene.add.circle(v.state.x, v.state.y, 8, 0xffe08a, 0.9).setDepth(11);
            this.scene.tweens.add({
              targets: spark,
              alpha: 0,
              scale: 2.4,
              duration: 180,
              onComplete: () => spark.destroy(),
            });
          }
        }
        const nowMs = Date.now();
        if (input.handbrake && Math.abs(v.state.speed) > 70 && nowMs - this.lastSkidAt > 90) {
          this.lastSkidAt = nowMs;
          const mark = this.scene.add
            .rectangle(v.state.x, v.state.y, 10, 4, 0x1a1a1a, 0.35)
            .setDepth(3)
            .setRotation(v.state.heading);
          this.scene.tweens.add({
            targets: mark,
            alpha: 0,
            duration: 900,
            onComplete: () => mark.destroy(),
          });
          // Tire smoke puff
          const smoke = this.scene.add.circle(v.state.x, v.state.y, 10, 0xc8c8c8, 0.45).setDepth(9);
          this.scene.tweens.add({
            targets: smoke,
            alpha: 0,
            scale: 2.6,
            y: v.state.y - 8,
            duration: 420,
            onComplete: () => smoke.destroy(),
          });
        }
      }
      const braking =
        isActive && (input.handbrake || input.throttle < 0 || Math.abs(v.state.speed) < 8);
      this.syncView(v, braking);
    }
  }

  damageActive(amount: number): void {
    const active = this.active;
    if (!active) return;
    applyVehicleDamage(active.state, amount);
    this.syncView(active, false);
  }

  repairActive(amount: number): void {
    const active = this.active;
    if (!active || active.state.destroyed) return;
    active.state.health = Math.min(active.state.maxHealth, active.state.health + amount);
    this.syncView(active, false);
  }

  repairNearest(x: number, y: number, amount: number, maxDist = 70): boolean {
    let best: RuntimeVehicle | null = null;
    let bestD = maxDist;
    for (const v of this.vehicles) {
      if (v.state.destroyed) continue;
      const d = Math.hypot(v.state.x - x, v.state.y - y);
      if (d < bestD) {
        bestD = d;
        best = v;
      }
    }
    if (!best) return false;
    best.state.health = Math.min(best.state.maxHealth, best.state.health + amount);
    this.syncView(best, false);
    return true;
  }

  private syncView(v: RuntimeVehicle, braking: boolean): void {
    const stage = damageStage(v.state.health, v.state.maxHealth);
    const c = Math.cos(v.state.heading);
    const s = Math.sin(v.state.heading);
    v.shadow.setPosition(v.state.x + 5, v.state.y + 6);
    v.shadow.setRotation(v.state.heading);
    v.view.setPosition(v.state.x, v.state.y);
    v.view.setRotation(v.state.heading);
    v.sprite.setPosition(v.state.x, v.state.y);
    v.sprite.setRotation(v.state.heading);

    const baseColor = this.paintColors.get(v.state.id) ?? v.def.color;
    const flashTint = v.sprite.tintTopLeft === 0xffeeaa;
    if (!flashTint) {
      if (this.paintColors.has(v.state.id)) {
        v.sprite.setTint(stageTint(baseColor, stage));
      } else if (stage === "destroyed") {
        v.sprite.setTint(0x442222);
      } else if (stage === "critical") {
        v.sprite.setTint(stageTint(0xffffff, stage));
      } else {
        v.sprite.clearTint();
      }
    }

    const show = !v.state.destroyed || stage === "destroyed";
    v.view.setVisible(true);
    v.view.setAlpha(0);
    v.sprite.setVisible(this.overlayVisible && show);
    v.shadow.setVisible(this.overlayVisible && show);

    if (this.overlayVisible) {
      if (stage === "critical") {
        const a = 0.75 + 0.25 * Math.sin(Date.now() / 90);
        v.sprite.setAlpha(a);
      } else if (stage === "destroyed") {
        v.sprite.setAlpha(0.85);
      } else {
        v.sprite.setAlpha(1);
      }
    } else {
      v.sprite.setAlpha(0);
    }

    if (v.state.destroyed) {
      v.sprite.setTint(0x442222);
      v.brakeLight.setAlpha(0);
    } else if (this.overlayVisible) {
      const backX = v.state.x - c * (v.def.width * 0.35);
      const backY = v.state.y - s * (v.def.width * 0.35);
      v.brakeLight.setPosition(backX, backY);
      v.brakeLight.setRotation(v.state.heading);
      v.brakeLight.setDisplaySize(braking ? 14 : 8, braking ? 6 : 4);
      v.brakeLight.setFillStyle(braking ? 0xff1818 : 0xaa2020);
      v.brakeLight.setAlpha(braking || v.state.speed < -10 ? 1 : 0.15);
    } else {
      v.brakeLight.setAlpha(0);
    }

    const body = v.view.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
      body.reset(v.state.x, v.state.y);
      body.setImmovable(!this.activeId || this.activeId !== v.state.id);
      if (this.activeId === v.state.id) {
        body.setVelocity(0, 0);
      }
    }
  }
}
