import Phaser from "phaser";
import { COLORS, GAME_WIDTH, PLAYER, WORLD_SEED } from "../config/gameConfig";
import { patchDebugSnapshot } from "../systems/debugSnapshot";
import { generateWorld } from "../world/generateWorld";
import { createCollisionBodies, paintWorldTexture } from "../world/renderWorld";
import { districtAt, type GeneratedWorld } from "../world/types";

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private world!: GeneratedWorld;
  private readonly keysDown = new Set<string>();
  private removeKeyListeners: (() => void) | null = null;
  private districtToast!: Phaser.GameObjects.Text;
  private lastDistrictId: string | null = null;
  private toastUntil = 0;

  constructor() {
    super("GameScene");
  }

  create(): void {
    this.world = generateWorld(WORLD_SEED);
    const worldPixels = this.world.width * this.world.tileSize;

    this.cameras.main.setBackgroundColor(COLORS.sky);
    this.physics.world.setBounds(0, 0, worldPixels, worldPixels);
    this.cameras.main.setBounds(0, 0, worldPixels, worldPixels);

    paintWorldTexture(this, this.world);
    const solids = createCollisionBodies(this, this.world);

    const spawnX = this.world.spawn.pixelX;
    const spawnY = this.world.spawn.pixelY;
    this.player = this.add
      .rectangle(spawnX, spawnY, PLAYER.radius * 2, PLAYER.radius * 2, COLORS.player)
      .setDepth(10);
    this.physics.add.existing(this.player);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, solids);

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
      .text(12, 12, "Harborline — WASD/Arrows move · Shift sprint · Esc title", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: COLORS.uiText,
        backgroundColor: "#00000088",
        padding: { x: 8, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.districtToast = this.add
      .text(GAME_WIDTH / 2, 64, "", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: COLORS.accent,
        backgroundColor: "#000000aa",
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(101)
      .setAlpha(0);

    const startDistrict = districtAt(
      this.world,
      this.world.spawn.tileX,
      this.world.spawn.tileY,
    );
    if (startDistrict) {
      this.showDistrictToast(startDistrict.name, startDistrict.id);
    }

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

    const tileX = Math.floor(this.player.x / this.world.tileSize);
    const tileY = Math.floor(this.player.y / this.world.tileSize);
    const district = districtAt(this.world, tileX, tileY);
    if (district && district.id !== this.lastDistrictId) {
      this.showDistrictToast(district.name, district.id);
    }

    if (this.districtToast.alpha > 0 && this.time.now > this.toastUntil) {
      this.districtToast.setAlpha(Math.max(0, this.districtToast.alpha - 0.04));
    }

    patchDebugSnapshot({
      scene: "GameScene",
      player: { x: this.player.x, y: this.player.y },
      fps: Math.round(this.game.loop.actualFps),
    });
  }

  private showDistrictToast(name: string, id: string): void {
    this.lastDistrictId = id;
    this.districtToast.setText(name);
    this.districtToast.setAlpha(1);
    this.toastUntil = this.time.now + 2200;
  }
}
