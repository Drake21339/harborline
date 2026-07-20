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

    // Brand-first: Harborline is the only hero-level signal.
    const brand = this.add
      .text(width / 2, height * 0.3, GAME_TITLE, {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: "86px",
        color: "#9ef0c0",
        stroke: "#061018",
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(20);

    // Soft brand underglow (warm sodium, not purple neon).
    const glow = this.add
      .ellipse(width / 2, height * 0.32, 420, 48, 0xc8a060, 0.12)
      .setDepth(19);
    this.tweens.add({
      targets: glow,
      alpha: 0.22,
      yoyo: true,
      duration: 2200,
      repeat: -1,
    });
    this.tweens.add({
      targets: brand,
      y: brand.y - 4,
      yoyo: true,
      duration: 2800,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.add
      .text(width / 2, height * 0.44, "Harbor city. Open streets. One more job.", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#d8e2f0",
      })
      .setOrigin(0.5)
      .setDepth(20);

    const cta = this.add
      .text(width / 2, height * 0.58, "ENTER — start", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#f2e6c8",
        backgroundColor: "#0a1420cc",
        padding: { x: 18, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(20);
    this.tweens.add({
      targets: cta,
      alpha: 0.72,
      yoyo: true,
      duration: 900,
      repeat: -1,
    });

    this.add
      .text(width / 2, height * 0.66, "keyboard-first  ·  mouse optional", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: COLORS.uiMuted,
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.add
      .text(width / 2, height * 0.92, GAME_VERSION_LABEL, {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#7a8aa0",
      })
      .setOrigin(0.5)
      .setDepth(20);

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
    // Night harbor: cool sky → sodium mid → dark water. No purple-glow slop.
    const g = this.add.graphics().setDepth(0);
    g.fillGradientStyle(0x081426, 0x081426, 0x1a2e40, 0x1e3428, 1);
    g.fillRect(0, 0, width, height);

    // Sodium haze band.
    g.fillStyle(0xc89040, 0.07);
    g.fillRect(0, height * 0.35, width, height * 0.25);

    // Water with specular ticks.
    g.fillStyle(0x16384f, 0.85);
    g.fillRect(0, height * 0.64, width, height * 0.36);
    g.fillStyle(0xffffff, 0.06);
    for (let i = 0; i < 14; i += 1) {
      const x = 40 + i * 90;
      g.fillRect(x, height * 0.72 + (i % 3) * 10, 28, 2);
    }

    // Faux skyline — height/facade/shadow read under locked “camera.”
    const blocks = [
      { x: 36, h: 100, w: 44, c: 0x4a6478, win: 0xa8d0e8 },
      { x: 96, h: 155, w: 52, c: 0x6a6558, win: 0xe8d8a8 },
      { x: 168, h: 78, w: 40, c: 0x8a5a38, win: 0xffc070 },
      { x: 230, h: 170, w: 48, c: 0x4a6a42, win: 0xb8e898 },
      { x: width - 340, h: 125, w: 50, c: 0x6e6858, win: 0xe8d8a8 },
      { x: width - 260, h: 195, w: 56, c: 0x4a6478, win: 0xa8d0e8 },
      { x: width - 170, h: 105, w: 44, c: 0x8a7250, win: 0xf0d090 },
      { x: width - 90, h: 145, w: 48, c: 0x6a4030, win: 0xffc070 },
    ];
    const base = height * 0.72;
    for (const b of blocks) {
      g.fillStyle(0x040810, 0.55);
      g.fillRect(b.x + 8, base - b.h + 10, b.w, b.h);
      g.fillStyle(blend(b.c, 0x000000, 0.35), 1);
      g.fillRect(b.x, base - b.h, b.w, 10);
      g.fillStyle(b.c, 1);
      g.fillRect(b.x, base - b.h + 10, b.w, b.h - 10);
      g.fillStyle(b.win, 0.4);
      g.fillRect(b.x + 10, base - b.h + 28, 8, 7);
      g.fillRect(b.x + 24, base - b.h + 48, 8, 7);
    }

    // Pier / harborline rule — brand motif.
    g.fillStyle(0xc8b84a, 0.55);
    g.fillRect(0, base + 2, width, 3);
    g.fillStyle(0xffffff, 0.08);
    g.fillRect(0, base + 5, width, 1);

    // Title wordmark sits above pier; buoy blink.
    const buoy = this.add.circle(width * 0.18, height * 0.78, 4, 0xffcc66, 0.9).setDepth(5);
    this.tweens.add({
      targets: buoy,
      alpha: 0.2,
      yoyo: true,
      duration: 700,
      repeat: -1,
    });
  }
}

function blend(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}
