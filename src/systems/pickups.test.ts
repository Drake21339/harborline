import { describe, expect, it } from "vitest";
import { createPlayerCombat } from "./playerCombat";
import {
  applyPickupToPlayer,
  createWallet,
  defaultPlazaPickups,
  refreshPickups,
  respawnAtSafehouse,
  tryCollectPickup,
} from "./pickups";

describe("pickups", () => {
  it("applies health ammo cash and repair amounts", () => {
    const combat = createPlayerCombat(100);
    combat.health = 40;
    combat.weapons.ammo.pistol = 2;
    combat.ammo = 2;
    const wallet = createWallet();
    applyPickupToPlayer("health", 30, combat, wallet);
    applyPickupToPlayer("ammo", 10, combat, wallet);
    const repair = applyPickupToPlayer("cash", 25, combat, wallet);
    expect(combat.health).toBe(70);
    expect(combat.ammo).toBe(12);
    expect(wallet.cash).toBe(25);
    expect(repair.vehicleRepair).toBe(0);
    expect(applyPickupToPlayer("repair", 40, combat, wallet).vehicleRepair).toBe(40);
  });

  it("grants SMG and shotgun pickups", () => {
    const combat = createPlayerCombat(100);
    const wallet = createWallet();
    applyPickupToPlayer("weapon_smg", 40, combat, wallet);
    expect(combat.weapons.owned.smg).toBe(true);
    expect(combat.weapons.active).toBe("smg");
    applyPickupToPlayer("weapon_shotgun", 8, combat, wallet);
    expect(combat.weapons.owned.shotgun).toBe(true);
    expect(combat.weapons.active).toBe("shotgun");
  });

  it("collects then respawns after timer", () => {
    const [p] = defaultPlazaPickups(0, 0);
    expect(tryCollectPickup(p!, 0, p!.x, p!.y, 20)).toBe(true);
    expect(tryCollectPickup(p!, 100, p!.x, p!.y, 20)).toBe(false);
    refreshPickups([p!], p!.availableAt);
    expect(p!.collected).toBe(false);
    expect(tryCollectPickup(p!, p!.availableAt, p!.x, p!.y, 20)).toBe(true);
  });

  it("respawns player at safehouse with restored health", () => {
    const combat = createPlayerCombat(100);
    combat.health = 0;
    combat.weapons.ammo.pistol = 0;
    combat.ammo = 0;
    const pos = respawnAtSafehouse(combat, 100, 200);
    expect(pos).toEqual({ x: 100, y: 200 });
    expect(combat.health).toBe(100);
    expect(combat.ammo).toBeGreaterThan(0);
  });
});
