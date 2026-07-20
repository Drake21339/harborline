import { describe, expect, it } from "vitest";
import { Tile } from "../world/tileTypes";
import {
  biasedCivilianStep,
  isPedPreferredTile,
  isTrafficPreferredTile,
} from "./civilianMove";

describe("civilianMove tile bias", () => {
  it("classifies preferred tiles", () => {
    expect(isPedPreferredTile(Tile.Sidewalk)).toBe(true);
    expect(isPedPreferredTile(Tile.Road)).toBe(false);
    expect(isTrafficPreferredTile(Tile.Road)).toBe(true);
    expect(isTrafficPreferredTile(Tile.Sidewalk)).toBe(false);
  });

  it("keeps most ped steps on sidewalk/plaza/park/grass", () => {
    // Corridor: sidewalk column with road beside it.
    const sample = (tx: number, _ty: number) => {
      if (tx === 5) return Tile.Sidewalk;
      if (tx === 6) return Tile.Road;
      if (tx < 0 || tx > 10) return Tile.Building;
      return Tile.Grass;
    };
    let x = 5 * 32 + 16;
    let y = 16;
    let heading = Math.PI / 2; // south along sidewalk
    let preferred = 0;
    const total = 80;
    for (let i = 0; i < total; i += 1) {
      const step = biasedCivilianStep({
        x,
        y,
        heading,
        speed: 55,
        dtSec: 0.05,
        tileSize: 32,
        kind: "ped",
        fleeing: false,
        sampleTile: sample,
        jitter: i % 7 === 0 ? 0.4 : 0,
      });
      x = step.x;
      y = step.y;
      heading = step.heading;
      if (step.preferred) preferred += 1;
    }
    expect(preferred / total).toBeGreaterThan(0.7);
  });

  it("keeps most traffic steps on road", () => {
    const sample = (tx: number, _ty: number) => {
      if (tx === 8) return Tile.Road;
      if (tx === 7 || tx === 9) return Tile.Sidewalk;
      return Tile.Building;
    };
    let x = 8 * 32 + 16;
    let y = 16;
    let heading = Math.PI / 2;
    let preferred = 0;
    const total = 80;
    for (let i = 0; i < total; i += 1) {
      const step = biasedCivilianStep({
        x,
        y,
        heading,
        speed: 110,
        dtSec: 0.05,
        tileSize: 32,
        kind: "car",
        fleeing: false,
        sampleTile: sample,
        jitter: i % 9 === 0 ? 0.35 : 0,
      });
      x = step.x;
      y = step.y;
      heading = step.heading;
      if (step.preferred) preferred += 1;
    }
    expect(preferred / total).toBeGreaterThan(0.7);
  });

  it("allows leaving preferred tiles while fleeing", () => {
    const sample = (tx: number) => (tx <= 5 ? Tile.Sidewalk : Tile.Road);
    const step = biasedCivilianStep({
      x: 5 * 32 + 16,
      y: 16,
      heading: 0, // east onto road
      speed: 130,
      dtSec: 0.1,
      tileSize: 32,
      kind: "ped",
      fleeing: true,
      sampleTile: sample,
    });
    // Fleeing may accept road; just ensure we moved and did not stick.
    expect(step.x).toBeGreaterThan(5 * 32 + 16);
  });
});
