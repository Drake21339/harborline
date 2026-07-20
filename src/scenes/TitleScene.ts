import Phaser from "phaser";
import { COLORS, GAME_TITLE } from "../config/gameConfig";
import { audioBus } from "../systems/audioBus";
import { patchDebugSnapshot } from "../systems/debugSnapshot";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.sky);
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height * 0.32, GAME_TITLE, {
        fontFamily: "monospace",
        fontSize: "64px",
        color: COLORS.accent,
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height * 0.48,
        "Clean-room arcade city sandbox\nPress Enter or click to start",
        {
          fontFamily: "monospace",
          fontSize: "20px",
          color: COLORS.uiText,
          align: "center",
        },
      )
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height * 0.72,
        "WASD move · E missions/vehicles · P pause · F1 help",
        {
          fontFamily: "monospace",
          fontSize: "16px",
          color: COLORS.uiMuted,
          align: "center",
        },
      )
      .setOrigin(0.5);

    patchDebugSnapshot({
      bootCompleted: true,
      scene: "TitleScene",
      player: { x: 0, y: 0 },
      inVehicle: false,
      vehicle: null,
      heat: 0,
      mission: { id: null, objective: null },
      counts: { pedestrians: 0, traffic: 0, police: 0 },
    });

    const start = (): void => {
      void audioBus.unlock();
      this.scene.start("GameScene");
    };

    this.input.keyboard?.once("keydown-ENTER", start);
    this.input.once("pointerdown", start);
  }
}
