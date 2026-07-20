export interface GameDebugSnapshot {
  bootCompleted: boolean;
  scene: string;
  player: { x: number; y: number; health?: number; ammo?: number; facing?: number };
  inVehicle: boolean;
  vehicle: { speed: number; health: number } | null;
  heat: number;
  mission: { id: string | null; objective: string | null };
  counts: { pedestrians: number; traffic: number; police: number };
  fps: number;
  civBias?: {
    pedPreferred: number;
    pedTotal: number;
    carPreferred: number;
    carTotal: number;
  };
}

export interface HarborTestHooks {
  movePlayer: (x: number, y: number) => void;
  completeActiveMission: () => number;
  acceptNearby: () => boolean;
  acceptPoint: (missionId: string) => { x: number; y: number } | null;
  moveNearFleet: () => void;
  setZoom: (z: number) => void;
  signalDanger: () => void;
  sfxKinds: () => string[];
  moveNearPickup: () => void;
}

declare global {
  interface Window {
    __GAME_DEBUG__?: Readonly<GameDebugSnapshot>;
    __HARBOR_TEST__?: HarborTestHooks;
  }
}

export {};
