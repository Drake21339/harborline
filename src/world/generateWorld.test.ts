import { describe, expect, it } from "vitest";
import { WORLD_SEED } from "../config/gameConfig";
import { countRoadClass, countTiles, generateWorld } from "./generateWorld";
import { graphConnected } from "./navGraph";
import { RoadClass } from "./roadTypes";
import { Tile } from "./tileTypes";
import { districtAt, tileAt } from "./types";

describe("generateWorld", () => {
  it("is deterministic for harborline-1997", () => {
    const a = generateWorld(WORLD_SEED);
    const b = generateWorld(WORLD_SEED);
    expect(a.fingerprint).toBe(b.fingerprint);
    expect(a.tiles).toEqual(b.tiles);
    expect(a.roadClass).toEqual(b.roadClass);
    expect(a.spawn).toEqual(b.spawn);
    expect(a.collisionRects.length).toBe(b.collisionRects.length);
    expect(a.nav.vehicleEdges.length).toBe(b.nav.vehicleEdges.length);
  });

  it("produces a full 128×128 map with solids and multi-lane roads", () => {
    const world = generateWorld(WORLD_SEED);
    expect(world.width).toBe(128);
    expect(world.height).toBe(128);
    expect(world.tiles.length).toBe(128 * 128);
    expect(countTiles(world, Tile.Road)).toBeGreaterThan(800);
    expect(countTiles(world, Tile.Building)).toBeGreaterThan(150);
    expect(countTiles(world, Tile.Water)).toBeGreaterThan(50);
    expect(countTiles(world, Tile.Fence)).toBeGreaterThan(50);
    expect(world.collisionRects.length).toBeGreaterThan(20);

    expect(countRoadClass(world, RoadClass.Local)).toBeGreaterThan(100);
    expect(countRoadClass(world, RoadClass.Arterial)).toBeGreaterThan(100);
    expect(countRoadClass(world, RoadClass.Freeway)).toBeGreaterThan(100);
  });

  it("emits a connected vehicle nav graph and paint shops", () => {
    const world = generateWorld(WORLD_SEED);
    expect(world.nav.nodes.length).toBeGreaterThan(50);
    expect(world.nav.vehicleEdges.length).toBeGreaterThan(50);
    expect(world.nav.pedEdges.length).toBeGreaterThan(50);
    expect(graphConnected(world.nav, "vehicle")).toBe(true);
    expect(world.paintShops.length).toBeGreaterThanOrEqual(2);
    expect(world.paintShops.every((p) => p.fee > 0)).toBe(true);
  });

  it("has at least three named districts and a clear spawn pad", () => {
    const world = generateWorld(WORLD_SEED);
    expect(world.districts.length).toBeGreaterThanOrEqual(3);
    const names = new Set(world.districts.map((d) => d.name));
    expect(names.size).toBe(world.districts.length);

    const spawnDistrict = districtAt(world, world.spawn.tileX, world.spawn.tileY);
    expect(spawnDistrict).not.toBeNull();

    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        const t = tileAt(world, world.spawn.tileX + dx, world.spawn.tileY + dy);
        expect([Tile.Building, Tile.Water, Tile.Fence]).not.toContain(t);
      }
    }
  });

  it("changes fingerprint when seed changes", () => {
    const a = generateWorld(WORLD_SEED);
    const b = generateWorld("harborline-other");
    expect(a.fingerprint).not.toBe(b.fingerprint);
  });
});
