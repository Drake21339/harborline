import type { GameDebugSnapshot } from "../src/types/debug";

declare global {
  interface Window {
    __GAME_DEBUG__?: Readonly<GameDebugSnapshot>;
    __HARBOR_TEST__?: {
      movePlayer: (x: number, y: number) => void;
      completeActiveMission: () => number;
      acceptNearby: () => boolean;
      acceptPoint: (missionId: string) => { x: number; y: number } | null;
      moveNearFleet: () => void;
      setZoom: (z: number) => void;
      signalDanger: () => void;
      sfxKinds: () => string[];
      moveNearPickup: () => void;
    };
  }
}

export {};
