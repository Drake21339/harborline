import { describe, expect, it } from "vitest";
import { generateWorld } from "../world/generateWorld";
import { WORLD_SEED } from "../config/gameConfig";
import { VEHICLE_DEFS } from "./defs";
import { Tile } from "../world/tileTypes";
import {
  applyVehicleDamage,
  createVehicleState,
  damageStage,
  findNearestVehicle,
  findSafeExit,
  impactDamageFromSpeed,
  resolveVehicleWorldCollision,
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

  it("blocks driving through solid tiles and reports hard-impact damage", () => {
    const world = generateWorld(WORLD_SEED);
    // Find a building tile near spawn to collide into.
    let bx = -1;
    let by = -1;
    for (let y = 0; y < world.height && bx < 0; y += 1) {
      for (let x = 0; x < world.width; x += 1) {
        if (world.tiles[y * world.width + x] === Tile.Building) {
          bx = x;
          by = y;
          break;
        }
      }
    }
    expect(bx).toBeGreaterThanOrEqual(0);
    const def = VEHICLE_DEFS.compact;
    const prevX = bx * world.tileSize - 40;
    const prevY = by * world.tileSize + world.tileSize / 2;
    const v = createVehicleState("hit", def, prevX, prevY, 0);
    v.speed = 140;
    // Place center onto the building cell.
    v.x = bx * world.tileSize + world.tileSize / 2;
    v.y = by * world.tileSize + world.tileSize / 2;
    const beforeHp = v.health;
    const hit = resolveVehicleWorldCollision(v, def, world, prevX, prevY);
    expect(hit.hit).toBe(true);
    expect(hit.impactSpeed).toBe(140);
    expect(v.x).toBe(prevX);
    expect(v.y).toBe(prevY);
    expect(v.speed).toBe(0);
    const dmg = impactDamageFromSpeed(hit.impactSpeed, def.collisionDamage);
    expect(dmg).toBeGreaterThan(0);
    applyVehicleDamage(v, dmg);
    expect(v.health).toBeLessThan(beforeHp);
  });

  it("ignores soft scrapes below impact threshold", () => {
    expect(impactDamageFromSpeed(20, 12)).toBe(0);
    expect(impactDamageFromSpeed(80, 12)).toBeGreaterThan(0);
  });

  it("hard impacts scale damage with speed for consequential driving", () => {
    const soft = impactDamageFromSpeed(60, 14);
    const hard = impactDamageFromSpeed(180, 14);
    expect(hard).toBeGreaterThan(soft);
    expect(hard).toBeGreaterThan(10);
  });
});
