import type { GameDebugSnapshot } from "../src/types/debug";

declare global {
  interface Window {
    __GAME_DEBUG__?: Readonly<GameDebugSnapshot>;
  }
}

export {};
