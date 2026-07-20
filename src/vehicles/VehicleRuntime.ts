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
  roof: Phaser.GameObjects.Rectangle;
  shadow: Phaser.GameObjects.Rectangle;
  headlight: Phaser.GameObjects.Rectangle;
  brakeLight: Phaser.GameObjects.Rectangle;
}

export class VehicleRuntime {
  readonly vehicles: RuntimeVehicle[] = [];
  activeId: string | null = null;
  /** Cleared by GameScene after juice (camera nudge / skid). */
  lastImpact: { impactSpeed: number; damage: number; x: number; y: number } | null = null;
  private lastSkidAt = 0;

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
      const shadow = this.scene.add
        .rectangle(p.x + 4, p.y + 5, def.width, def.height, 0x000000, 0.35)
        .setDepth(7)
        .setRotation(p.heading);
      const view = this.scene.add
        .rectangle(p.x, p.y, def.width, def.height, def.color)
        .setDepth(8)
        .setRotation(p.heading);
      const roof = this.scene.add
        .rectangle(p.x, p.y, def.width * 0.62, def.height * 0.42, blend(def.color, 0x102030, 0.35))
        .setDepth(9)
        .setRotation(p.heading);
      const headlight = this.scene.add
        .rectangle(p.x, p.y, 5, 4, 0xfff2c0, 0.95)
        .setDepth(10)
        .setRotation(p.heading);
      this.scene.physics.add.existing(view);
      const body = view.body as Phaser.Physics.Arcade.Body;
      body.setImmovable(true);
      body.setAllowGravity(false);
      const brakeLight = this.scene.add
        .rectangle(p.x, p.y, 8, 4, 0xff3030, 0)
        .setDepth(10);
      this.vehicles.push({ state, def, view, roof, shadow, headlight, brakeLight });
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
        // Handbrake skid marks at speed (rate-limited — avoid tween spam).
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
    const c = Math.cos(v.state.heading);
    const s = Math.sin(v.state.heading);
    v.shadow.setPosition(v.state.x + 5, v.state.y + 6);
    v.shadow.setRotation(v.state.heading);
    v.view.setPosition(v.state.x, v.state.y);
    v.view.setRotation(v.state.heading);
    // Cabin sits slightly aft of nose for silhouette readability.
    v.roof.setPosition(v.state.x - c * 2, v.state.y - s * 2);
    v.roof.setRotation(v.state.heading);
    // Don't overwrite a same-frame impact flash (pale yellow).
    if (v.view.fillColor !== 0xffeeaa) {
      const bodyColor = stageTint(v.def.color, stage);
      v.view.setFillStyle(bodyColor);
      v.roof.setFillStyle(blend(bodyColor, 0x0a1520, 0.4));
    }
    const show = !v.state.destroyed || stage === "destroyed";
    v.view.setVisible(show);
    v.roof.setVisible(show && stage !== "destroyed");
    v.shadow.setVisible(show);
    v.headlight.setVisible(show && stage !== "destroyed");
    if (stage === "critical") {
      const a = 0.75 + 0.25 * Math.sin(Date.now() / 90);
      v.view.setAlpha(a);
      v.roof.setAlpha(a);
    } else if (stage === "destroyed") {
      v.view.setAlpha(0.85);
    } else {
      v.view.setAlpha(1);
      v.roof.setAlpha(1);
    }
    if (v.state.destroyed) {
      v.view.setFillStyle(0x442222);
      v.roof.setVisible(false);
      v.headlight.setVisible(false);
      v.brakeLight.setAlpha(0);
    } else {
      const noseX = v.state.x + c * (v.def.width * 0.38);
      const noseY = v.state.y + s * (v.def.width * 0.38);
      v.headlight.setPosition(noseX, noseY);
      v.headlight.setRotation(v.state.heading);
      v.headlight.setAlpha(0.85);
      const backX = v.state.x - c * (v.def.width * 0.35);
      const backY = v.state.y - s * (v.def.width * 0.35);
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
