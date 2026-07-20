export interface GameDebugSnapshot {
  bootCompleted: boolean;
  scene: string;
  player: { x: number; y: number };
  inVehicle: boolean;
  vehicle: { speed: number; health: number } | null;
  heat: number;
  mission: { id: string | null; objective: string | null };
  counts: { pedestrians: number; traffic: number; police: number };
  fps: number;
}

declare global {
  interface Window {
    __GAME_DEBUG__?: Readonly<GameDebugSnapshot>;
  }
}

export {};
