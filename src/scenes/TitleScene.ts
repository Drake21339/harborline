import Phaser from "phaser";
import { COLORS, GAME_TITLE } from "../config/gameConfig";
import { GAME_VERSION_LABEL } from "../config/version";
import { audioBus } from "../systems/audioBus";
import { patchDebugSnapshot } from "../systems/debugSnapshot";

export class TitleScene extends Phaser.Scene {
  private removeKeyListener: (() => void) | null = null;

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
        "Clean-room arcade city sandbox\nPress Enter to start (mouse optional)",
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
        "Keyboard-first · WASD · F fire · E interact · mouse aim optional",
        {
          fontFamily: "monospace",
          fontSize: "16px",
          color: COLORS.uiMuted,
          align: "center",
        },
      )
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.88, GAME_VERSION_LABEL, {
        fontFamily: "monospace",
        fontSize: "14px",
        color: COLORS.uiMuted,
      })
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

    let started = false;
    const start = (): void => {
      if (started) return;
      started = true;
      void audioBus.unlock();
      this.scene.start("GameScene");
    };

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Enter") start();
    };
    window.addEventListener("keydown", onKeyDown);
    this.removeKeyListener = () => window.removeEventListener("keydown", onKeyDown);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.removeKeyListener?.();
      this.removeKeyListener = null;
    });

    this.input.keyboard?.once("keydown-ENTER", start);
    this.input.once("pointerdown", start);
  }
}
