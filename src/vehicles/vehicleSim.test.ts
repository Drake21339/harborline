import { describe, expect, it } from "vitest";
import { generateWorld } from "../world/generateWorld";
import { WORLD_SEED } from "../config/gameConfig";
import { VEHICLE_DEFS } from "./defs";
import {
  applyVehicleDamage,
  createVehicleState,
  damageStage,
  findNearestVehicle,
  findSafeExit,
  stepVehicle,
} from "./vehicleSim";

describe("vehicleSim", () => {
  it("enters nearest undestroyed vehicle within range", () => {
    const a = createVehicleState("a", VEHICLE_DEFS.compact, 100, 100);
    const b = createVehicleState("b", VEHICLE_DEFS.sedan, 200, 100);
    expect(findNearestVehicle([a, b], 110, 100, 40)?.id).toBe("a");
    applyVehicleDamage(a, 999);
    expect(findNearestVehicle([a, b], 110, 100, 40)).toBeNull();
    expect(findNearestVehicle([a, b], 190, 100, 40)?.id).toBe("b");
  });

  it("applies damage stages and destroys at zero", () => {
    const v = createVehicleState("v", VEHICLE_DEFS.van, 0, 0);
    expect(damageStage(v.health, v.maxHealth)).toBe("pristine");
    applyVehicleDamage(v, v.maxHealth * 0.6);
    expect(damageStage(v.health, v.maxHealth)).toBe("battered");
    applyVehicleDamage(v, 999);
    expect(v.destroyed).toBe(true);
    expect(damageStage(v.health, v.maxHealth)).toBe("destroyed");
  });

  it("throttle increases speed; handbrake bleeds speed", () => {
    const def = VEHICLE_DEFS.sports;
    const v = createVehicleState("s", def, 0, 0);
    for (let i = 0; i < 30; i += 1) {
      stepVehicle(v, def, { throttle: 1, steer: 0, handbrake: false }, 1 / 60);
    }
    expect(v.speed).toBeGreaterThan(80);
    const before = v.speed;
    stepVehicle(v, def, { throttle: 0, steer: 0, handbrake: true }, 0.2);
    expect(v.speed).toBeLessThan(before);
  });

  it("finds a walkable exit near spawn plaza vehicle", () => {
    const world = generateWorld(WORLD_SEED);
    const exit = findSafeExit(world, world.spawn.pixelX, world.spawn.pixelY, 0);
    expect(exit).not.toBeNull();
    expect(exit!.x).toBeGreaterThan(0);
    expect(exit!.y).toBeGreaterThan(0);
  });
});
