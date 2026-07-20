import { describe, expect, it } from "vitest";
import { createHeatState, reportOffense } from "./heat";
import { nearestPaintShop, tryUsePaintShop } from "./paintShop";
import { createWallet } from "./pickups";

describe("paintShop", () => {
  it("finds nearest shop in radius", () => {
    const shops = [
      { id: "a", x: 0, y: 0, fee: 150 },
      { id: "b", x: 200, y: 0, fee: 150 },
    ];
    expect(nearestPaintShop(shops, 10, 0)?.id).toBe("a");
    expect(nearestPaintShop(shops, 1000, 0)).toBeNull();
  });

  it("charges fee, recolors, and clears heat", () => {
    const wallet = createWallet();
    wallet.cash = 200;
    const heat = createHeatState();
    reportOffense(heat, "attack", 0);
    expect(heat.level).toBe(1);
    const result = tryUsePaintShop({
      wallet,
      heat,
      fee: 150,
      rng: () => 0.1,
    });
    expect(result.ok).toBe(true);
    expect(wallet.cash).toBe(50);
    expect(result.heat.level).toBe(0);
    expect(result.color).not.toBeNull();
  });

  it("refuses when broke", () => {
    const wallet = createWallet();
    wallet.cash = 20;
    const heat = createHeatState();
    reportOffense(heat, "steal", 0);
    const result = tryUsePaintShop({
      wallet,
      heat,
      fee: 150,
      rng: () => 0,
    });
    expect(result.ok).toBe(false);
    expect(wallet.cash).toBe(20);
    expect(heat.level).toBe(1);
  });
});
