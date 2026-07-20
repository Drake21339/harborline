import { describe, expect, it } from "vitest";
import {
  applyDamage,
  canFireRanged,
  canMelee,
  consumeMelee,
  consumeRangedShot,
  createPlayerCombat,
} from "./playerCombat";

describe("playerCombat", () => {
  it("applies damage with i-frames then ignores until window ends", () => {
    const s = createPlayerCombat(100);
    const first = applyDamage(s, 20, 1000);
    expect(first.applied).toBe(true);
    expect(s.health).toBe(80);
    const blocked = applyDamage(s, 20, 1100);
    expect(blocked.applied).toBe(false);
    expect(s.health).toBe(80);
    const after = applyDamage(s, 20, 2000);
    expect(after.applied).toBe(true);
    expect(s.health).toBe(60);
  });

  it("ranged consumes ammo; melee is fallback when empty", () => {
    const s = createPlayerCombat(100);
    s.ammo = 1;
    expect(canFireRanged(s, 0)).toBe(true);
    consumeRangedShot(s, 0);
    expect(s.ammo).toBe(0);
    expect(canFireRanged(s, 500)).toBe(false);
    expect(canMelee(s, 500)).toBe(true);
    consumeMelee(s, 500);
    expect(canMelee(s, 600)).toBe(false);
  });

  it("reports killed at zero health", () => {
    const s = createPlayerCombat(10);
    const r = applyDamage(s, 50, 0);
    expect(r.killed).toBe(true);
    expect(s.health).toBe(0);
  });
});
