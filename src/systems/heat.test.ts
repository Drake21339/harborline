import { describe, expect, it } from "vitest";
import {
  applyArrestPenalties,
  createHeatState,
  policeCapForHeat,
  reportOffense,
  tickHeat,
  HEAT,
} from "./heat";

describe("heat", () => {
  it("gains levels from offenses and caps at 5", () => {
    const s = createHeatState();
    reportOffense(s, "attack", 1000);
    expect(s.level).toBe(1);
    reportOffense(s, "destroy", 2000);
    expect(s.level).toBe(4); // 1 + 2 + reoffend 1
    reportOffense(s, "destroy", 3000);
    reportOffense(s, "crash", 3500);
    expect(s.level).toBe(5);
  });

  it("decays only after unseen timer", () => {
    const s = createHeatState();
    reportOffense(s, "steal", 0);
    expect(s.level).toBe(1);
    tickHeat(s, HEAT.decayUnseenMs - 1, false, false);
    expect(s.level).toBe(1);
    tickHeat(s, 2, false, false);
    expect(s.level).toBe(0);
  });

  it("does not decay while seen; arrests after hold", () => {
    const s = createHeatState();
    reportOffense(s, "attack", 0);
    tickHeat(s, 5000, true, false);
    expect(s.level).toBe(1);
    let arrested = false;
    for (let i = 0; i < 20; i += 1) {
      const r = tickHeat(s, 200, true, true);
      if (r.arrested) arrested = true;
    }
    expect(arrested).toBe(true);
  });

  it("maps unit caps and arrest money penalty", () => {
    expect(policeCapForHeat(0)).toBe(0);
    expect(policeCapForHeat(3)).toBe(3);
    expect(policeCapForHeat(5)).toBe(5);
    expect(applyArrestPenalties(200).cash).toBeLessThan(200);
  });
});
