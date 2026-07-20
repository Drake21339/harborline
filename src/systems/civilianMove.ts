import type { NavEdge, NavGraph } from "../world/navGraph";
import { nearestNode, pickOutgoingEdge } from "../world/navGraph";
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

export interface GraphAgentState {
  x: number;
  y: number;
  heading: number;
  edge: NavEdge | null;
  /** 0..1 progress along current edge. */
  t: number;
  destNodeId: number | null;
}

export interface MoveSample {
  x: number;
  y: number;
  heading: number;
  preferred: boolean;
  edge: NavEdge | null;
  t: number;
  destNodeId: number | null;
}

function advanceOnEdge(
  graph: NavGraph,
  edge: NavEdge,
  t: number,
  dist: number,
): { x: number; y: number; heading: number; t: number; arrived: boolean } {
  const from = graph.nodes[edge.from]!;
  const to = graph.nodes[edge.to]!;
  const len = Math.max(1, edge.length);
  const nt = t + dist / len;
  const heading = Math.atan2(to.y - from.y, to.x - from.x);
  if (nt >= 1) {
    return { x: to.x, y: to.y, heading, t: 1, arrived: true };
  }
  return {
    x: from.x + (to.x - from.x) * nt,
    y: from.y + (to.y - from.y) * nt,
    heading,
    t: nt,
    arrived: false,
  };
}

/**
 * Graph-following step for peds/traffic. Agents travel along nav edges to
 * destinations; at the rim they reverse instead of milling on the clamp.
 */
export function graphCivilianStep(args: {
  state: GraphAgentState;
  graph: NavGraph;
  kind: "ped" | "car";
  speed: number;
  dtSec: number;
  fleeing: boolean;
  worldW: number;
  worldH: number;
  rng: () => number;
}): MoveSample {
  const kind = args.kind === "car" ? "vehicle" : "ped";
  let { x, y, heading, edge, t, destNodeId } = args.state;
  const dist = args.speed * args.dtSec;
  const margin = 48;
  const nearEdge =
    x < margin || y < margin || x > args.worldW - margin || y > args.worldH - margin;

  // Flee: cut away from current heading briefly, then rejoin graph.
  if (args.fleeing) {
    const nx = x + Math.cos(heading) * dist;
    const ny = y + Math.sin(heading) * dist;
    const clampedX = Math.max(8, Math.min(args.worldW - 8, nx));
    const clampedY = Math.max(8, Math.min(args.worldH - 8, ny));
    // If we hit the rim while fleeing, reverse heading hard.
    if (clampedX !== nx || clampedY !== ny) {
      heading += Math.PI;
    }
    return {
      x: clampedX,
      y: clampedY,
      heading,
      preferred: false,
      edge: null,
      t: 0,
      destNodeId: null,
    };
  }

  if (!edge) {
    const node = nearestNode(args.graph, x, y, kind);
    if (!node) {
      return { x, y, heading, preferred: false, edge: null, t: 0, destNodeId: null };
    }
    // Pull onto the node, then pick an outgoing edge.
    const pull = Math.min(1, dist / Math.max(1, Math.hypot(node.x - x, node.y - y)));
    x += (node.x - x) * pull;
    y += (node.y - y) * pull;
    const prefer = nearEdge ? heading + Math.PI : heading;
    edge = pickOutgoingEdge(args.graph, node.id, kind, prefer, args.rng);
    t = 0;
    destNodeId = edge?.to ?? null;
    if (!edge) {
      return { x, y, heading, preferred: true, edge: null, t: 0, destNodeId: null };
    }
  }

  let remaining = dist;
  let guard = 0;
  while (remaining > 0 && edge && guard < 4) {
    guard += 1;
    const step = advanceOnEdge(args.graph, edge, t, remaining);
    x = step.x;
    y = step.y;
    heading = step.heading;
    if (!step.arrived) {
      t = step.t;
      remaining = 0;
      break;
    }
    // Arrived at node — pick next edge (prefer forward; reverse if near map rim).
    remaining -= edge.length * (1 - t);
    t = 0;
    const prefer = nearEdge ? heading + Math.PI : heading;
    const next = pickOutgoingEdge(args.graph, edge.to, kind, prefer, args.rng);
    if (!next) {
      // Dead end: reverse along the edge we came from if possible.
      const reverse = pickOutgoingEdge(args.graph, edge.to, kind, heading + Math.PI, args.rng);
      edge = reverse;
      destNodeId = reverse?.to ?? null;
      break;
    }
    // Avoid immediate U-turn unless near edge.
    if (next.to === edge.from && !nearEdge && args.rng() > 0.15) {
      const alt = pickOutgoingEdge(args.graph, edge.to, kind, heading + 0.4, args.rng);
      edge = alt ?? next;
    } else {
      edge = next;
    }
    destNodeId = edge?.to ?? null;
  }

  // Soft world clamp — never park on the rim; bounce heading if clamped.
  const cx = Math.max(16, Math.min(args.worldW - 16, x));
  const cy = Math.max(16, Math.min(args.worldH - 16, y));
  if (cx !== x || cy !== y) {
    heading += Math.PI;
    edge = null;
    t = 0;
    destNodeId = null;
  }

  return {
    x: cx,
    y: cy,
    heading,
    preferred: true,
    edge,
    t,
    destNodeId,
  };
}

/**
 * Legacy heading-bias step kept for unit tests / flee fallbacks.
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
  jitter?: number;
}): Omit<MoveSample, "edge" | "t" | "destNodeId"> {
  let heading = args.heading + (args.fleeing ? 0 : (args.jitter ?? 0));
  const dist = args.speed * args.dtSec;
  const prefer = args.kind === "ped" ? isPedPreferredTile : isTrafficPreferredTile;

  const tryPos = (h: number) => {
    const nx = args.x + Math.cos(h) * dist;
    const ny = args.y + Math.sin(h) * dist;
    const t = args.sampleTile(Math.floor(nx / args.tileSize), Math.floor(ny / args.tileSize));
    return { nx, ny, t, blocked: isBlockedTile(t), preferred: prefer(t) };
  };

  let best = tryPos(heading);
  if (best.blocked) {
    heading += Math.PI * 0.65;
    best = tryPos(heading);
    if (best.blocked) {
      return {
        x: args.x + Math.cos(heading) * 8,
        y: args.y + Math.sin(heading) * 8,
        heading,
        preferred: false,
      };
    }
  }

  if (!best.preferred && !args.fleeing) {
    const deltas = [0.45, -0.45, 0.9, -0.9, 1.4, -1.4, Math.PI * 0.5, -Math.PI * 0.5, Math.PI];
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
