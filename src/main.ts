import Phaser from "phaser";
import {
  GAME_HEIGHT,
  GAME_TITLE,
  GAME_WIDTH,
} from "./config/gameConfig";
import { BootScene } from "./scenes/BootScene";
import { GameScene } from "./scenes/GameScene";
import { TitleScene } from "./scenes/TitleScene";
import { patchDebugSnapshot, resetDebugSnapshot } from "./systems/debugSnapshot";
import { installInputGuard } from "./systems/inputGuard";
import "./types/debug";

document.title = GAME_TITLE;
resetDebugSnapshot();
installInputGuard();

const parent = document.getElementById("game-root");
if (!parent) {
  throw new Error("#game-root missing");
}

const game = new Phaser.Game({
  // Canvas is more reliable than WebGL in headless e2e.
  // HD pixel path: opaque night clear (Three.js city retired — ADR-010).
  type: Phaser.CANVAS,
  parent,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#0b1220",
  clearBeforeRender: true,
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, TitleScene, GameScene],
});

game.events.once("ready", () => {
  patchDebugSnapshot({ bootCompleted: false, scene: "ready" });
});
