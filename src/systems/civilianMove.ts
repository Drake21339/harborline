import { Tile, type TileId } from "../world/tileTypes";

export function isPedPreferredTile(tile: TileId): boolean {
  return (
    tile === Tile.Sidewalk ||
    tile === Tile.Plaza ||
    tile === Tile.Park ||
    tile === Tile.Grass
  );
}

export function isTrafficPreferredTile(tile: TileId): boolean {
  return tile === Tile.Road;
}

export function isBlockedTile(tile: TileId): boolean {
  return tile === Tile.Building || tile === Tile.Water || tile === Tile.Fence;
}

export interface MoveSample {
  x: number;
  y: number;
  heading: number;
  preferred: boolean;
}

/**
 * Step an agent with tile bias: prefer sidewalks/parks for peds and roads for traffic.
 * When fleeing, bias loosens so agents can cut across to escape.
 */
export function biasedCivilianStep(args: {
  x: number;
  y: number;
  heading: number;
  speed: number;
  dtSec: number;
  tileSize: number;
  kind: "ped" | "car";
  fleeing: boolean;
  sampleTile: (tileX: number, tileY: number) => TileId;
  /** Optional heading jitter (radians) applied when not fleeing. */
  jitter?: number;
}): MoveSample {
  let heading = args.heading + (args.fleeing ? 0 : (args.jitter ?? 0));
  const dist = args.speed * args.dtSec;
  const prefer = args.kind === "ped" ? isPedPreferredTile : isTrafficPreferredTile;

  const tryPos = (h: number) => {
    const nx = args.x + Math.cos(h) * dist;
    const ny = args.y + Math.sin(h) * dist;
    const t = args.sampleTile(Math.floor(nx / args.tileSize), Math.floor(ny / args.tileSize));
    return { nx, ny, t, blocked: isBlockedTile(t), preferred: prefer(t) };
  };

  // Primary heading.
  let best = tryPos(heading);
  if (best.blocked) {
    heading += Math.PI * 0.65;
    best = tryPos(heading);
    if (best.blocked) {
      // Nudge back out of solids.
      return {
        x: args.x + Math.cos(heading) * 8,
        y: args.y + Math.sin(heading) * 8,
        heading,
        preferred: false,
      };
    }
  }

  if (!best.preferred && !args.fleeing) {
    const deltas = [0.7, -0.7, 1.4, -1.4, Math.PI * 0.5, -Math.PI * 0.5];
    for (const d of deltas) {
      const cand = tryPos(heading + d);
      if (!cand.blocked && cand.preferred) {
        heading += d;
        best = cand;
        break;
      }
    }
  }

  return {
    x: best.nx,
    y: best.ny,
    heading,
    preferred: best.preferred,
  };
}
