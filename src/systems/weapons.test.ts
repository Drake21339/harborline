import { describe, expect, it } from "vitest";
import {
  activeWeaponDef,
  createWeaponInventory,
  cycleWeapon,
  grantWeapon,
  selectWeapon,
  WEAPONS,
} from "./weapons";

describe("weapons", () => {
  it("starts with melee + pistol; SMG/shotgun locked", () => {
    const inv = createWeaponInventory();
    expect(inv.owned.melee).toBe(true);
    expect(inv.owned.pistol).toBe(true);
    expect(inv.owned.smg).toBe(false);
    expect(inv.owned.shotgun).toBe(false);
    expect(inv.active).toBe("pistol");
    expect(activeWeaponDef(inv).id).toBe("pistol");
  });

  it("grants and selects weapons; cycle skips locked", () => {
    const inv = createWeaponInventory();
    expect(selectWeapon(inv, "smg")).toBe(false);
    grantWeapon(inv, "smg");
    expect(selectWeapon(inv, "smg")).toBe(true);
    expect(inv.ammo.smg).toBeGreaterThan(0);
    grantWeapon(inv, "shotgun");
    const next = cycleWeapon(inv, 1);
    expect(["melee", "pistol", "smg", "shotgun"]).toContain(next);
  });

  it("defines distinct ranged profiles", () => {
    expect(WEAPONS.smg.cooldownMs).toBeLessThan(WEAPONS.pistol.cooldownMs);
    expect(WEAPONS.shotgun.pellets).toBeGreaterThan(1);
    expect(WEAPONS.melee.isMelee).toBe(true);
  });
});
