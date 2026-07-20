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
    const { width, height } = this.scale;
    this.paintBackdrop(width, height);

    // Brand-first: Harborline is the hero signal.
    this.add
      .text(width / 2, height * 0.28, GAME_TITLE, {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: "78px",
        color: COLORS.accent,
        stroke: "#0a1420",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.42, "Harbor city. Open streets. One more job.", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: COLORS.uiText,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.58, "ENTER — start  ·  keyboard-first (mouse optional)", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#d8e6ff",
        backgroundColor: "#00000066",
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.9, GAME_VERSION_LABEL, {
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
    let musicPrimed = false;
    const primeMusic = (): void => {
      if (musicPrimed) return;
      musicPrimed = true;
      void audioBus.unlock().then(() => {
        if (!started) audioBus.setBed("title");
      });
    };
    const start = (): void => {
      if (started) return;
      started = true;
      void audioBus.unlock().then(() => {
        audioBus.playSfx("ui");
        audioBus.setBed("city");
        this.scene.start("GameScene");
      });
    };

    const onKeyDown = (event: KeyboardEvent): void => {
      primeMusic();
      if (event.key === "Enter") start();
    };
    window.addEventListener("keydown", onKeyDown);
    this.removeKeyListener = () => window.removeEventListener("keydown", onKeyDown);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.removeKeyListener?.();
      this.removeKeyListener = null;
    });

    this.input.keyboard?.once("keydown-ENTER", start);
    this.input.on("pointerdown", () => {
      primeMusic();
    });
    this.input.once("pointerdown", start);
  }

  private paintBackdrop(width: number, height: number): void {
    // Night harbor gradient — not flat, not purple-glow AI default.
    const g = this.add.graphics();
    g.fillGradientStyle(0x0c1a2e, 0x0c1a2e, 0x1a3048, 0x243a28, 1);
    g.fillRect(0, 0, width, height);

    // Soft water band.
    g.fillStyle(0x1a3a55, 0.55);
    g.fillRect(0, height * 0.62, width, height * 0.38);

    // Interim faux skyline (top-down 3D preview cue: block heights).
    const blocks = [
      { x: 40, h: 90, c: 0x4a6478 },
      { x: 110, h: 140, c: 0x6a6558 },
      { x: 190, h: 70, c: 0x7a5538 },
      { x: 250, h: 160, c: 0x4a6a42 },
      { x: width - 320, h: 120, c: 0x5a4a3a },
      { x: width - 240, h: 180, c: 0x4a6478 },
      { x: width - 150, h: 95, c: 0x7a6a52 },
      { x: width - 70, h: 130, c: 0x6a4030 },
    ];
    const base = height * 0.72;
    for (const b of blocks) {
      g.fillStyle(0x0a1018, 0.55);
      g.fillRect(b.x + 6, base - b.h + 8, 48, b.h);
      g.fillStyle(b.c, 1);
      g.fillRect(b.x, base - b.h, 48, b.h);
      g.fillStyle(0xffffff, 0.08);
      g.fillRect(b.x + 8, base - b.h + 12, 12, 10);
    }

    // Pier line.
    g.fillStyle(0xc8b84a, 0.35);
    g.fillRect(0, base + 2, width, 3);
  }
}
