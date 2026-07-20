import Phaser from "phaser";
import { loadPixelAtlases } from "../art/pixelAtlases";
import { COLORS, GAME_TITLE } from "../config/gameConfig";
import { patchDebugSnapshot } from "../systems/debugSnapshot";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload(): void {
    loadPixelAtlases(this);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.sky);
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2, `${GAME_TITLE}\nbooting…`, {
        fontFamily: "monospace",
        fontSize: "28px",
        color: COLORS.uiText,
        align: "center",
      })
      .setOrigin(0.5);

    patchDebugSnapshot({ bootCompleted: false, scene: "BootScene" });

    this.time.delayedCall(250, () => {
      this.scene.start("TitleScene");
    });
  }
}
