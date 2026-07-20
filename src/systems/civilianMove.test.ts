import { describe, expect, it } from "vitest";
import { WORLD_SEED } from "../config/gameConfig";
import { generateWorld } from "../world/generateWorld";
import { Tile } from "../world/tileTypes";
import {
  biasedCivilianStep,
  graphCivilianStep,
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
    const sample = (tx: number, _ty: number) => {
      if (tx === 5) return Tile.Sidewalk;
      if (tx === 6) return Tile.Road;
      if (tx < 0 || tx > 10) return Tile.Building;
      return Tile.Grass;
    };
    let x = 5 * 32 + 16;
    let y = 16;
    let heading = Math.PI / 2;
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
      heading: 0,
      speed: 130,
      dtSec: 0.1,
      tileSize: 32,
      kind: "ped",
      fleeing: true,
      sampleTile: sample,
    });
    expect(step.x).toBeGreaterThan(5 * 32 + 16);
  });
});

describe("graphCivilianStep", () => {
  it("moves traffic along the vehicle graph without sticking to the top rim", () => {
    const world = generateWorld(WORLD_SEED);
    const edge = world.nav.vehicleEdges[10] ?? world.nav.vehicleEdges[0]!;
    const from = world.nav.nodes[edge.from]!;
    let state: {
      x: number;
      y: number;
      heading: number;
      edge: typeof edge | null;
      t: number;
      destNodeId: number | null;
    } = {
      x: from.x,
      y: from.y,
      heading: 0,
      edge,
      t: 0,
      destNodeId: edge.to,
    };
    const worldW = world.width * world.tileSize;
    const worldH = world.height * world.tileSize;
    let rimFrames = 0;
    for (let i = 0; i < 240; i += 1) {
      const step = graphCivilianStep({
        state,
        graph: world.nav,
        kind: "car",
        speed: 110,
        dtSec: 0.05,
        fleeing: false,
        worldW,
        worldH,
        rng: () => 0.3,
      });
      state = {
        x: step.x,
        y: step.y,
        heading: step.heading,
        edge: step.edge,
        t: step.t,
        destNodeId: step.destNodeId,
      };
      if (state.y < 24) rimFrames += 1;
    }
    // Must travel meaningfully and not live on the top clamp.
    expect(Math.hypot(state.x - from.x, state.y - from.y)).toBeGreaterThan(40);
    expect(rimFrames).toBeLessThan(40);
    expect(state.y).toBeGreaterThan(16);
  });

  it("keeps cars on road tiles for most graph steps", () => {
    const world = generateWorld(WORLD_SEED);
    const edge = world.nav.vehicleEdges[20] ?? world.nav.vehicleEdges[0]!;
    const from = world.nav.nodes[edge.from]!;
    let state: {
      x: number;
      y: number;
      heading: number;
      edge: typeof edge | null;
      t: number;
      destNodeId: number | null;
    } = {
      x: from.x,
      y: from.y,
      heading: 0,
      edge,
      t: 0,
      destNodeId: edge.to,
    };
    const worldW = world.width * world.tileSize;
    const worldH = world.height * world.tileSize;
    let onRoad = 0;
    const total = 120;
    for (let i = 0; i < total; i += 1) {
      const step = graphCivilianStep({
        state,
        graph: world.nav,
        kind: "car",
        speed: 110,
        dtSec: 0.05,
        fleeing: false,
        worldW,
        worldH,
        rng: () => 0.5,
      });
      state = {
        x: step.x,
        y: step.y,
        heading: step.heading,
        edge: step.edge,
        t: step.t,
        destNodeId: step.destNodeId,
      };
      const tx = Math.floor(state.x / world.tileSize);
      const ty = Math.floor(state.y / world.tileSize);
      if (world.tiles[ty * world.width + tx] === Tile.Road) onRoad += 1;
    }
    expect(onRoad / total).toBeGreaterThan(0.7);
  });
});
