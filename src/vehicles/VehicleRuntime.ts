import Phaser from "phaser";
import type { GeneratedWorld } from "../world/types";
import { VEHICLE_DEFS, type VehicleArchetypeId, type VehicleDef } from "./defs";
import {
  applyVehicleDamage,
  createVehicleState,
  damageStage,
  findNearestVehicle,
  findSafeExit,
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
    for (const v of this.vehicles) {
      const isActive = active?.state.id === v.state.id;
      if (isActive && !v.state.destroyed) {
        stepVehicle(v.state, v.def, input, dtSec);
        // Soft world bounds.
        const max = this.world.width * this.world.tileSize - 8;
        v.state.x = Math.max(8, Math.min(max, v.state.x));
        v.state.y = Math.max(8, Math.min(max, v.state.y));
        // Impact damage when slamming while damaged path — simple speed scrape.
        if (Math.abs(v.state.speed) > v.def.maxSpeed * 0.95 && input.handbrake) {
          applyVehicleDamage(v.state, v.def.collisionDamage * 0.02);
        }
      }
      this.syncView(v, isActive && input.handbrake);
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
    v.view.setFillStyle(stageTint(v.def.color, stage));
    v.view.setVisible(!v.state.destroyed || stage === "destroyed");
    if (v.state.destroyed) {
      v.view.setFillStyle(0x442222);
      v.brakeLight.setAlpha(0);
    } else {
      const backX = v.state.x - Math.cos(v.state.heading) * (v.def.width * 0.35);
      const backY = v.state.y - Math.sin(v.state.heading) * (v.def.width * 0.35);
      v.brakeLight.setPosition(backX, backY);
      v.brakeLight.setRotation(v.state.heading);
      v.brakeLight.setAlpha(braking || v.state.speed < -10 ? 0.9 : 0.15);
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
