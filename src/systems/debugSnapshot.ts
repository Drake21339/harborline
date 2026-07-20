import type { GameDebugSnapshot } from "../types/debug";

const defaultSnapshot = (): GameDebugSnapshot => ({
  bootCompleted: false,
  scene: "none",
  player: { x: 0, y: 0 },
  inVehicle: false,
  vehicle: null,
  heat: 0,
  mission: { id: null, objective: null },
  counts: { pedestrians: 0, traffic: 0, police: 0 },
  fps: 0,
});

let snapshot: GameDebugSnapshot = defaultSnapshot();

export function resetDebugSnapshot(): void {
  snapshot = defaultSnapshot();
  publish();
}

export function patchDebugSnapshot(partial: Partial<GameDebugSnapshot>): void {
  snapshot = {
    ...snapshot,
    ...partial,
    player: partial.player ?? snapshot.player,
    vehicle: partial.vehicle === undefined ? snapshot.vehicle : partial.vehicle,
    mission: partial.mission ?? snapshot.mission,
    counts: partial.counts ?? snapshot.counts,
  };
  publish();
}

export function getDebugSnapshot(): Readonly<GameDebugSnapshot> {
  return snapshot;
}

function publish(): void {
  if (typeof window !== "undefined") {
    window.__GAME_DEBUG__ = snapshot;
  }
}
