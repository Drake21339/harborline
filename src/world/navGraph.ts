import { RoadClass, type RoadClassId, type RoadClassName, roadClassName } from "./roadTypes";
import { Tile } from "./tileTypes";
import type { GeneratedWorld } from "./types";

export interface NavNode {
  id: number;
  tileX: number;
  tileY: number;
  x: number;
  y: number;
}

export interface NavEdge {
  id: number;
  from: number;
  to: number;
  roadClass: RoadClassName;
  length: number;
}

export interface NavGraph {
  nodes: NavNode[];
  vehicleEdges: NavEdge[];
  pedEdges: NavEdge[];
  /** node id → indices into vehicleEdges */
  vehicleOut: Map<number, number[]>;
  /** node id → indices into pedEdges */
  pedOut: Map<number, number[]>;
}

function key(tx: number, ty: number): string {
  return `${tx},${ty}`;
}

function isRoad(tile: number): boolean {
  return tile === Tile.Road;
}

function isPedWalk(tile: number): boolean {
  return (
    tile === Tile.Sidewalk ||
    tile === Tile.Plaza ||
    tile === Tile.Park ||
    tile === Tile.Grass
  );
}

/**
 * Build a coarse navigation graph from the tile map.
 * Vehicle nodes sit on road tiles every `step` cells; ped nodes on walk tiles.
 */
export function buildNavGraph(world: GeneratedWorld, step = 2): NavGraph {
  const nodes: NavNode[] = [];
  const nodeAt = new Map<string, number>();
  const ts = world.tileSize;

  const ensureNode = (tx: number, ty: number): number => {
    const k = key(tx, ty);
    const existing = nodeAt.get(k);
    if (existing !== undefined) return existing;
    const id = nodes.length;
    nodes.push({
      id,
      tileX: tx,
      tileY: ty,
      x: tx * ts + ts / 2,
      y: ty * ts + ts / 2,
    });
    nodeAt.set(k, id);
    return id;
  };

  const vehicleEdges: NavEdge[] = [];
  const pedEdges: NavEdge[] = [];

  const classAt = (tx: number, ty: number): RoadClassName => {
    const raw = world.roadClass[ty * world.width + tx] ?? RoadClass.None;
    return roadClassName(raw as RoadClassId) ?? "local";
  };

  for (let ty = 0; ty < world.height; ty += step) {
    for (let tx = 0; tx < world.width; tx += step) {
      const t = world.tiles[ty * world.width + tx]!;
      if (isRoad(t)) {
        const from = ensureNode(tx, ty);
        for (const [dx, dy] of [
          [step, 0],
          [0, step],
          [-step, 0],
          [0, -step],
        ] as const) {
          const nx = tx + dx;
          const ny = ty + dy;
          if (nx < 0 || ny < 0 || nx >= world.width || ny >= world.height) continue;
          if (!isRoad(world.tiles[ny * world.width + nx]!)) continue;
          const to = ensureNode(nx, ny);
          const a = nodes[from]!;
          const b = nodes[to]!;
          vehicleEdges.push({
            id: vehicleEdges.length,
            from,
            to,
            roadClass: classAt(tx, ty),
            length: Math.hypot(b.x - a.x, b.y - a.y),
          });
        }
      }
      if (isPedWalk(t)) {
        const from = ensureNode(tx, ty);
        for (const [dx, dy] of [
          [step, 0],
          [0, step],
          [-step, 0],
          [0, -step],
        ] as const) {
          const nx = tx + dx;
          const ny = ty + dy;
          if (nx < 0 || ny < 0 || nx >= world.width || ny >= world.height) continue;
          if (!isPedWalk(world.tiles[ny * world.width + nx]!)) continue;
          const to = ensureNode(nx, ny);
          const a = nodes[from]!;
          const b = nodes[to]!;
          pedEdges.push({
            id: pedEdges.length,
            from,
            to,
            roadClass: "local",
            length: Math.hypot(b.x - a.x, b.y - a.y),
          });
        }
      }
    }
  }

  const vehicleOut = new Map<number, number[]>();
  for (let i = 0; i < vehicleEdges.length; i += 1) {
    const e = vehicleEdges[i]!;
    const list = vehicleOut.get(e.from) ?? [];
    list.push(i);
    vehicleOut.set(e.from, list);
  }
  const pedOut = new Map<number, number[]>();
  for (let i = 0; i < pedEdges.length; i += 1) {
    const e = pedEdges[i]!;
    const list = pedOut.get(e.from) ?? [];
    list.push(i);
    pedOut.set(e.from, list);
  }

  return { nodes, vehicleEdges, pedEdges, vehicleOut, pedOut };
}

export function nearestNode(
  graph: NavGraph,
  x: number,
  y: number,
  kind: "vehicle" | "ped",
): NavNode | null {
  const edges = kind === "vehicle" ? graph.vehicleEdges : graph.pedEdges;
  if (edges.length === 0) return null;
  const used = new Set<number>();
  for (const e of edges) {
    used.add(e.from);
    used.add(e.to);
  }
  let best: NavNode | null = null;
  let bestD = Infinity;
  for (const id of used) {
    const n = graph.nodes[id];
    if (!n) continue;
    const d = Math.hypot(n.x - x, n.y - y);
    if (d < bestD) {
      bestD = d;
      best = n;
    }
  }
  return best;
}

/** Prefer continuing roughly forward; small RNG spice for variety. */
export function pickOutgoingEdge(
  graph: NavGraph,
  nodeId: number,
  kind: "vehicle" | "ped",
  preferHeading: number,
  rng: () => number,
): NavEdge | null {
  const outIdx = (kind === "vehicle" ? graph.vehicleOut : graph.pedOut).get(nodeId);
  if (!outIdx || outIdx.length === 0) return null;
  const edges = kind === "vehicle" ? graph.vehicleEdges : graph.pedEdges;
  let best: NavEdge | null = null;
  let bestScore = -Infinity;
  for (const idx of outIdx) {
    const e = edges[idx];
    if (!e) continue;
    const from = graph.nodes[e.from]!;
    const to = graph.nodes[e.to]!;
    const h = Math.atan2(to.y - from.y, to.x - from.x);
    let dh = h - preferHeading;
    while (dh > Math.PI) dh -= Math.PI * 2;
    while (dh < -Math.PI) dh += Math.PI * 2;
    const score = Math.cos(dh) + rng() * 0.2;
    if (score > bestScore) {
      bestScore = score;
      best = e;
    }
  }
  return best;
}

export function graphConnected(graph: NavGraph, kind: "vehicle" | "ped"): boolean {
  const edges = kind === "vehicle" ? graph.vehicleEdges : graph.pedEdges;
  const out = kind === "vehicle" ? graph.vehicleOut : graph.pedOut;
  if (edges.length === 0) return false;
  const start = edges[0]!.from;
  const seen = new Set<number>([start]);
  const q = [start];
  while (q.length) {
    const n = q.pop()!;
    for (const idx of out.get(n) ?? []) {
      const e = edges[idx]!;
      if (!seen.has(e.to)) {
        seen.add(e.to);
        q.push(e.to);
      }
    }
  }
  // Connected enough: reach a large share of edge endpoints.
  const endpoints = new Set<number>();
  for (const e of edges) {
    endpoints.add(e.from);
    endpoints.add(e.to);
  }
  return seen.size >= Math.max(8, Math.floor(endpoints.size * 0.35));
}
