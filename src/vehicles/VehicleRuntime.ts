import Phaser from "phaser";
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
  view: Phaser.GameObjects.Rectangle;
  brakeLight: Phaser.GameObjects.Rectangle;
}

export class VehicleRuntime {
  readonly vehicles: RuntimeVehicle[] = [];
  activeId: string | null = null;
  /** Cleared by GameScene after juice (camera nudge / skid). */
  lastImpact: { impactSpeed: number; damage: number; x: number; y: number } | null = null;

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
    ];

    for (const p of placements) {
      const def = VEHICLE_DEFS[p.id];
      const state = createVehicleState(`veh-${p.id}`, def, p.x, p.y, p.heading);
      const view = this.scene.add
        .rectangle(p.x, p.y, def.width, def.height, def.color)
        .setDepth(8)
        .setRotation(p.heading);
      this.scene.physics.add.existing(view);
      const body = view.body as Phaser.Physics.Arcade.Body;
      body.setImmovable(true);
      body.setAllowGravity(false);
      const brakeLight = this.scene.add
        .rectangle(p.x, p.y, 8, 4, 0xff3030, 0)
        .setDepth(9);
      this.vehicles.push({ state, def, view, brakeLight });
    }
  }

  get active(): RuntimeVehicle | null {
    if (!this.activeId) return null;
    return this.vehicles.find((v) => v.state.id === this.activeId) ?? null;
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
        // Soft world bounds.
        const max = this.world.width * this.world.tileSize - 8;
        v.state.x = Math.max(8, Math.min(max, v.state.x));
        v.state.y = Math.max(8, Math.min(max, v.state.y));
        const hit = resolveVehicleWorldCollision(v.state, v.def, this.world, prevX, prevY);
        if (hit.hit) {
          const dmg = impactDamageFromSpeed(hit.impactSpeed, v.def.collisionDamage);
          if (dmg > 0) applyVehicleDamage(v.state, dmg);
          // Brief impact flash on the body.
          v.view.setFillStyle(0xffeeaa);
          this.lastImpact = {
            impactSpeed: hit.impactSpeed,
            damage: dmg,
            x: v.state.x,
            y: v.state.y,
          };
          // Sparks at impact point.
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
        // Handbrake skid marks at speed (arcade juice, not physics tire model).
        if (input.handbrake && Math.abs(v.state.speed) > 70) {
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
        }
      }
      const braking =
        isActive && (input.handbrake || input.throttle < 0 || Math.abs(v.state.speed) < 8);
      this.syncView(v, braking);
    }
  }

  /** Debug smash for tests / missions later. */
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
    v.view.setPosition(v.state.x, v.state.y);
    v.view.setRotation(v.state.heading);
    // Don't overwrite a same-frame impact flash (pale yellow).
    if (v.view.fillColor !== 0xffeeaa) {
      v.view.setFillStyle(stageTint(v.def.color, stage));
    }
    v.view.setVisible(!v.state.destroyed || stage === "destroyed");
    if (stage === "critical") {
      v.view.setAlpha(0.75 + 0.25 * Math.sin(Date.now() / 90));
    } else if (stage === "destroyed") {
      v.view.setAlpha(0.85);
    } else {
      v.view.setAlpha(1);
    }
    if (v.state.destroyed) {
      v.view.setFillStyle(0x442222);
      v.brakeLight.setAlpha(0);
    } else {
      const backX = v.state.x - Math.cos(v.state.heading) * (v.def.width * 0.35);
      const backY = v.state.y - Math.sin(v.state.heading) * (v.def.width * 0.35);
      v.brakeLight.setPosition(backX, backY);
      v.brakeLight.setRotation(v.state.heading);
      v.brakeLight.setDisplaySize(braking ? 14 : 8, braking ? 6 : 4);
      v.brakeLight.setFillStyle(braking ? 0xff1818 : 0xaa2020);
      v.brakeLight.setAlpha(braking || v.state.speed < -10 ? 1 : 0.2);
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
