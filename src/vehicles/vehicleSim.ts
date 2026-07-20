import { isWalkableTile } from "../world/tileTypes";
import type { GeneratedWorld } from "../world/types";
import { tileAt } from "../world/types";
import type { VehicleDef } from "./defs";

export type DamageStage = "pristine" | "scuffed" | "battered" | "critical" | "destroyed";

export interface VehicleSimState {
  id: string;
  defId: VehicleDef["id"];
  x: number;
  y: number;
  heading: number;
  speed: number;
  health: number;
  maxHealth: number;
  destroyed: boolean;
}

export interface DriveInput {
  throttle: number; // -1..1
  steer: number; // -1..1
  handbrake: boolean;
}

export function createVehicleState(
  id: string,
  def: VehicleDef,
  x: number,
  y: number,
  heading = 0,
): VehicleSimState {
  return {
    id,
    defId: def.id,
    x,
    y,
    heading,
    speed: 0,
    health: def.durability,
    maxHealth: def.durability,
    destroyed: false,
  };
}

export function damageStage(health: number, maxHealth: number): DamageStage {
  if (health <= 0) return "destroyed";
  const r = health / maxHealth;
  if (r > 0.75) return "pristine";
  if (r > 0.5) return "scuffed";
  if (r > 0.25) return "battered";
  return "critical";
}

export function stageTint(base: number, stage: DamageStage): number {
  if (stage === "pristine") return base;
  if (stage === "scuffed") return darken(base, 0.12);
  if (stage === "battered") return darken(base, 0.28);
  if (stage === "critical") return darken(base, 0.45);
  return 0x333333;
}

function darken(color: number, amount: number): number {
  const r = Math.round(((color >> 16) & 0xff) * (1 - amount));
  const g = Math.round(((color >> 8) & 0xff) * (1 - amount));
  const b = Math.round((color & 0xff) * (1 - amount));
  return (r << 16) | (g << 8) | b;
}

export function applyVehicleDamage(state: VehicleSimState, amount: number): void {
  if (state.destroyed) return;
  state.health = Math.max(0, state.health - amount);
  if (state.health <= 0) {
    state.destroyed = true;
    state.speed = 0;
  }
}

export function stepVehicle(
  state: VehicleSimState,
  def: VehicleDef,
  input: DriveInput,
  dtSec: number,
): void {
  if (state.destroyed) {
    state.speed = 0;
    return;
  }

  const throttle = PhaserMathClamp(input.throttle, -1, 1);
  const steer = PhaserMathClamp(input.steer, -1, 1);

  if (throttle > 0) {
    state.speed += def.accel * throttle * dtSec;
  } else if (throttle < 0) {
    if (state.speed > 8) {
      state.speed += def.accel * throttle * 1.4 * dtSec; // brake
    } else {
      state.speed += def.reverse * throttle * dtSec;
    }
  } else {
    state.speed *= Math.pow(0.15, dtSec); // coast drag
  }

  if (input.handbrake) {
    state.speed *= Math.pow(0.02, dtSec);
  }

  const max = def.maxSpeed;
  const min = -def.reverse * 0.55;
  state.speed = PhaserMathClamp(state.speed, min, max);

  const speedFactor = Math.min(1, Math.abs(state.speed) / Math.max(1, max));
  const steerEff = def.steer * (input.handbrake ? 1.35 : 1) * (0.35 + 0.65 * speedFactor) * def.grip;
  if (Math.abs(state.speed) > 4) {
    const turnDir = state.speed >= 0 ? 1 : -1;
    state.heading += steer * steerEff * turnDir * dtSec;
  }

  state.x += Math.cos(state.heading) * state.speed * dtSec;
  state.y += Math.sin(state.heading) * state.speed * dtSec;
}

function PhaserMathClamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function findNearestVehicle(
  vehicles: VehicleSimState[],
  x: number,
  y: number,
  maxDist: number,
): VehicleSimState | null {
  let best: VehicleSimState | null = null;
  let bestD = maxDist;
  for (const v of vehicles) {
    if (v.destroyed) continue;
    const d = Math.hypot(v.x - x, v.y - y);
    if (d < bestD) {
      bestD = d;
      best = v;
    }
  }
  return best;
}

/** Search ring around vehicle for a walkable exit cell; returns pixel center. */
export function findSafeExit(
  world: GeneratedWorld,
  fromX: number,
  fromY: number,
  heading: number,
): { x: number; y: number } | null {
  const ts = world.tileSize;
  const sideAngles = [heading + Math.PI / 2, heading - Math.PI / 2, heading + Math.PI, heading];
  const distances = [36, 48, 60, 28, 72];

  for (const dist of distances) {
    for (const ang of sideAngles) {
      const px = fromX + Math.cos(ang) * dist;
      const py = fromY + Math.sin(ang) * dist;
      const tx = Math.floor(px / ts);
      const ty = Math.floor(py / ts);
      if (isWalkableTile(tileAt(world, tx, ty))) {
        // Require immediate neighbors mostly walkable.
        let ok = true;
        for (let dy = -1; dy <= 1 && ok; dy += 1) {
          for (let dx = -1; dx <= 1 && ok; dx += 1) {
            if (!isWalkableTile(tileAt(world, tx + dx, ty + dy))) ok = false;
          }
        }
        if (ok) {
          return { x: tx * ts + ts / 2, y: ty * ts + ts / 2 };
        }
      }
    }
  }
  return { x: fromX + Math.cos(heading + Math.PI / 2) * 40, y: fromY + Math.sin(heading + Math.PI / 2) * 40 };
}
