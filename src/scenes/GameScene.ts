import Phaser from "phaser";
import { COLORS, PLAYER, TILE_SIZE } from "../config/gameConfig";
import { patchDebugSnapshot } from "../systems/debugSnapshot";

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private readonly keysDown = new Set<string>();
  private readonly worldPixels = 128 * TILE_SIZE;
  private removeKeyListeners: (() => void) | null = null;

  constructor() {
    super("GameScene");
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.sky);
    this.physics.world.setBounds(0, 0, this.worldPixels, this.worldPixels);
    this.cameras.main.setBounds(0, 0, this.worldPixels, this.worldPixels);

    this.add
      .rectangle(
        this.worldPixels / 2,
        this.worldPixels / 2,
        this.worldPixels,
        this.worldPixels,
        COLORS.ground,
      )
      .setDepth(0);

    // Placeholder "roads" so the scaffold reads as a city grid, not a blank room.
    for (let i = 0; i < 128; i += 8) {
      const p = i * TILE_SIZE + TILE_SIZE * 4;
      this.add.rectangle(this.worldPixels / 2, p, this.worldPixels, TILE_SIZE * 2, COLORS.road).setDepth(1);
      this.add.rectangle(p, this.worldPixels / 2, TILE_SIZE * 2, this.worldPixels, COLORS.road).setDepth(1);
    }

    for (let y = 2; y < 126; y += 10) {
      for (let x = 2; x < 126; x += 10) {
        if (x % 8 === 4 || y % 8 === 4) continue;
        this.add
          .rectangle(
            x * TILE_SIZE + TILE_SIZE,
            y * TILE_SIZE + TILE_SIZE,
            TILE_SIZE * 2.2,
            TILE_SIZE * 2.2,
            COLORS.building,
          )
          .setDepth(2);
      }
    }

    const spawnX = 20 * TILE_SIZE;
    const spawnY = 20 * TILE_SIZE;
    this.player = this.add
      .rectangle(spawnX, spawnY, PLAYER.radius * 2, PLAYER.radius * 2, COLORS.player)
      .setDepth(10);
    this.physics.add.existing(this.player);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(1);

    const onKeyDown = (event: KeyboardEvent): void => {
      this.keysDown.add(event.key.toLowerCase());
      if (event.key === "Escape") {
        this.scene.start("TitleScene");
      }
    };
    const onKeyUp = (event: KeyboardEvent): void => {
      this.keysDown.delete(event.key.toLowerCase());
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    this.removeKeyListeners = () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.removeKeyListeners?.();
      this.removeKeyListeners = null;
      this.keysDown.clear();
    });

    this.add
      .text(12, 12, "Harborline scaffold — WASD/Arrows move · Shift sprint · Esc title", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: COLORS.uiText,
        backgroundColor: "#00000088",
        padding: { x: 8, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(100);

    patchDebugSnapshot({
      bootCompleted: true,
      scene: "GameScene",
      player: { x: spawnX, y: spawnY },
      inVehicle: false,
      vehicle: null,
      heat: 0,
      mission: { id: null, objective: null },
      counts: { pedestrians: 0, traffic: 0, police: 0 },
    });
  }

  update(_time: number, _delta: number): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    let vx = 0;
    let vy = 0;
    const sprint = this.keysDown.has("shift");
    const speed = sprint ? PLAYER.sprintSpeed : PLAYER.walkSpeed;

    if (this.keysDown.has("a") || this.keysDown.has("arrowleft")) vx -= 1;
    if (this.keysDown.has("d") || this.keysDown.has("arrowright")) vx += 1;
    if (this.keysDown.has("w") || this.keysDown.has("arrowup")) vy -= 1;
    if (this.keysDown.has("s") || this.keysDown.has("arrowdown")) vy += 1;

    if (vx !== 0 && vy !== 0) {
      const inv = Math.SQRT1_2;
      vx *= inv;
      vy *= inv;
    }

    body.setVelocity(vx * speed, vy * speed);

    patchDebugSnapshot({
      scene: "GameScene",
      player: { x: this.player.x, y: this.player.y },
      fps: Math.round(this.game.loop.actualFps),
    });
  }
}
