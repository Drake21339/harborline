import { describe, expect, it } from "vitest";
import { generateWorld } from "./generateWorld";
import { classifyRoad } from "./renderWorld";
import { Tile } from "./tileTypes";

describe("classifyRoad (beauty G1)", () => {
  const world = generateWorld("harborline-1997");

  it("marks true cross junctions as intersection", () => {
    let found: { x: number; y: number } | null = null;
    let intersections = 0;
    for (let y = 8; y < world.height - 8; y += 1) {
      for (let x = 8; x < world.width - 8; x += 1) {
        if (world.tiles[y * world.width + x] !== Tile.Road) continue;
        if (classifyRoad(world, x, y) === "intersection") {
          intersections += 1;
          if (!found) found = { x, y };
        }
      }
    }
    expect(found).not.toBeNull();
    expect(intersections).toBeGreaterThan(20);
    expect(classifyRoad(world, found!.x, found!.y)).toBe("intersection");
  });

  it("classifies some pier-ward roads as waterfront", () => {
    let waterfront = 0;
    for (let y = 0; y < 56; y += 2) {
      for (let x = 0; x < 48; x += 2) {
        if (world.tiles[y * world.width + x] !== Tile.Road) continue;
        if (classifyRoad(world, x, y) === "waterfront") waterfront += 1;
      }
    }
    expect(waterfront).toBeGreaterThan(10);
  });

  it("classifies freight-cut roads as freight when not intersections", () => {
    let freight = 0;
    for (let y = 60; y < 120; y += 2) {
      for (let x = 4; x < 70; x += 2) {
        if (world.tiles[y * world.width + x] !== Tile.Road) continue;
        if (classifyRoad(world, x, y) === "freight") freight += 1;
      }
    }
    expect(freight).toBeGreaterThan(5);
  });
});
