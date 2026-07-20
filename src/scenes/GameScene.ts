import Phaser from "phaser";
import { COLORS, GAME_WIDTH, PLAYER, WORLD_SEED } from "../config/gameConfig";
import { COMBAT } from "../systems/combatTypes";
import { patchDebugSnapshot } from "../systems/debugSnapshot";
import {
  applyDamage,
  canFireRanged,
  canMelee,
  consumeMelee,
  consumeRangedShot,
  createPlayerCombat,
  facingFromPoints,
} from "../systems/playerCombat";
import type { CombatantState } from "../systems/combatTypes";
import { CivilianRuntime } from "../systems/CivilianRuntime";
import { PickupRuntime } from "../systems/PickupRuntime";
import { createWallet, isAtSafehouse, respawnAtSafehouse, type WalletState } from "../systems/pickups";
import { VehicleRuntime } from "../vehicles/VehicleRuntime";
import { generateWorld } from "../world/generateWorld";
import { createCollisionBodies, paintWorldTexture } from "../world/renderWorld";
import { districtAt, type GeneratedWorld } from "../world/types";

interface DummyTarget {
  body: Phaser.GameObjects.Rectangle;
  health: number;
  label: Phaser.GameObjects.Text;
}

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private aimLine!: Phaser.GameObjects.Rectangle;
  private world!: GeneratedWorld;
  private combat!: CombatantState;
  private vehicles!: VehicleRuntime;
  private civilians!: CivilianRuntime;
  private pickups!: PickupRuntime;
  private wallet!: WalletState;
  private safehouse = { x: 0, y: 0 };
  private readonly keysDown = new Set<string>();
  private removeKeyListeners: (() => void) | null = null;
  private districtToast!: Phaser.GameObjects.Text;
  private hudText!: Phaser.GameObjects.Text;
  private lastDistrictId: string | null = null;
  private toastUntil = 0;
  private pointerDown = false;
  private hazard!: Phaser.GameObjects.Rectangle;
  private dummy!: DummyTarget;
  private projectiles!: Phaser.GameObjects.Group;
  private solids!: Phaser.Physics.Arcade.StaticGroup;

  constructor() {
    super("GameScene");
  }

  create(): void {
    this.world = generateWorld(WORLD_SEED);
    this.combat = createPlayerCombat(PLAYER.maxHealth);
    const worldPixels = this.world.width * this.world.tileSize;

    this.cameras.main.setBackgroundColor(COLORS.sky);
    this.physics.world.setBounds(0, 0, worldPixels, worldPixels);
    this.cameras.main.setBounds(0, 0, worldPixels, worldPixels);

    paintWorldTexture(this, this.world);
    this.solids = createCollisionBodies(this, this.world);

    const spawnX = this.world.spawn.pixelX;
    const spawnY = this.world.spawn.pixelY;
    this.player = this.add
      .rectangle(spawnX, spawnY, PLAYER.radius * 2, PLAYER.radius * 2, COLORS.player)
      .setDepth(10);
    this.physics.add.existing(this.player);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.solids);

    this.vehicles = new VehicleRuntime(this, this.world);
    this.vehicles.spawnFleet(spawnX, spawnY);
    this.civilians = new CivilianRuntime(this, this.world);
    this.wallet = createWallet();
    this.pickups = new PickupRuntime(this, spawnX, spawnY);
    // Safehouse: Midstack plaza west pad.
    this.safehouse = { x: spawnX - 90, y: spawnY - 10 };
    this.add
      .rectangle(this.safehouse.x, this.safehouse.y, 40, 40, 0x7dffa8, 0.25)
      .setDepth(3);
    this.add
      .text(this.safehouse.x, this.safehouse.y - 28, "SAFEHOUSE", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: COLORS.accent,
      })
      .setOrigin(0.5)
      .setDepth(12);

    this.aimLine = this.add
      .rectangle(spawnX, spawnY, 22, 4, 0xffffff, 0.85)
      .setDepth(11)
      .setOrigin(0, 0.5);

    this.hazard = this.add
      .rectangle(spawnX + 96, spawnY + 64, 48, 48, 0xc23b3b, 0.55)
      .setDepth(3);
    this.physics.add.existing(this.hazard, true);

    const dummyRect = this.add
      .rectangle(spawnX + 140, spawnY - 40, 28, 28, 0x8a6cff)
      .setDepth(9);
    this.physics.add.existing(dummyRect, true);
    const dummyLabel = this.add
      .text(dummyRect.x, dummyRect.y - 22, "100", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(12);
    this.dummy = { body: dummyRect, health: 100, label: dummyLabel };

    this.projectiles = this.add.group();

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(1);

    const onKeyDown = (event: KeyboardEvent): void => {
      const key = event.key.toLowerCase();
      this.keysDown.add(key);
      if (event.key === "Escape") {
        this.scene.start("TitleScene");
      }
      if (key === "f" && !this.vehicles.activeId) {
        this.tryAttack();
      }
      if (key === "e") {
        this.toggleVehicle();
      }
      if (key === "r") {
        this.respawnStub();
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

    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (p.leftButtonDown()) {
        this.pointerDown = true;
        if (!this.vehicles.activeId) this.tryAttack();
      }
    });
    this.input.on("pointerup", () => {
      this.pointerDown = false;
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.removeKeyListeners?.();
      this.removeKeyListeners = null;
      this.keysDown.clear();
      this.input.removeAllListeners();
    });

    this.add
      .text(
        12,
        12,
        "WASD · Shift sprint · E enter/exit · Mouse aim · LMB/F fire · Space handbrake · Esc title",
        {
          fontFamily: "monospace",
          fontSize: "13px",
          color: COLORS.uiText,
          backgroundColor: "#00000088",
          padding: { x: 8, y: 6 },
        },
      )
      .setScrollFactor(0)
      .setDepth(100);

    this.hudText = this.add
      .text(12, 40, "", {
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

    this.publishDebug();
  }

  update(_time: number, delta: number): void {
    const now = this.time.now;
    const dt = Math.min(0.05, delta / 1000);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const inVehicle = Boolean(this.vehicles.activeId);
    const activeVeh = this.vehicles.active;

    if (inVehicle && activeVeh) {
      body.setVelocity(0, 0);
      this.player.setVisible(false);
      this.aimLine.setVisible(false);

      let throttle = 0;
      let steer = 0;
      if (this.keysDown.has("w") || this.keysDown.has("arrowup")) throttle += 1;
      if (this.keysDown.has("s") || this.keysDown.has("arrowdown")) throttle -= 1;
      if (this.keysDown.has("a") || this.keysDown.has("arrowleft")) steer -= 1;
      if (this.keysDown.has("d") || this.keysDown.has("arrowright")) steer += 1;
      const handbrake = this.keysDown.has(" ") || this.keysDown.has("space");

      this.vehicles.update(dt, { throttle, steer, handbrake });
      this.player.setPosition(activeVeh.state.x, activeVeh.state.y);
      this.cameras.main.startFollow(activeVeh.view, true, 0.14, 0.14);

      if (activeVeh.state.destroyed) {
        const exit = this.vehicles.tryExit();
        if (exit) {
          this.player.setPosition(exit.x, exit.y);
          this.player.setVisible(true);
          this.aimLine.setVisible(true);
          this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
        }
      }
    } else if (this.combat.health > 0) {
      this.player.setVisible(true);
      this.aimLine.setVisible(true);
      this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
      this.vehicles.update(dt, { throttle: 0, steer: 0, handbrake: false });

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

      const pointer = this.input.activePointer;
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.combat.facing = facingFromPoints(
        this.player.x,
        this.player.y,
        worldPoint.x,
        worldPoint.y,
      );
      this.aimLine.setPosition(this.player.x, this.player.y);
      this.aimLine.setRotation(this.combat.facing);

      if (this.pointerDown) this.tryAttack();

      const hz = this.hazard.getBounds();
      const pb = this.player.getBounds();
      if (Phaser.Geom.Intersects.RectangleToRectangle(hz, pb)) {
        applyDamage(this.combat, 12, now);
      }
    } else {
      body.setVelocity(0, 0);
      this.vehicles.update(dt, { throttle: 0, steer: 0, handbrake: false });
    }

    if (now < this.combat.flashUntil) {
      this.player.setFillStyle(0xffffff);
    } else if (now < this.combat.iFrameUntil) {
      this.player.setFillStyle(0xf2c14e, 0.55);
    } else if (this.combat.health <= 0) {
      this.player.setFillStyle(0x666666);
    } else {
      this.player.setFillStyle(COLORS.player);
    }

    this.updateProjectiles();
    this.civilians.update(now, this.player.x, this.player.y, dt);
    this.pickups.update(
      now,
      this.player.x,
      this.player.y,
      this.combat,
      this.wallet,
      (amount) => {
        if (this.vehicles.activeId) this.vehicles.repairActive(amount);
        else this.vehicles.repairNearest(this.player.x, this.player.y, amount);
      },
    );

    const tileX = Math.floor(this.player.x / this.world.tileSize);
    const tileY = Math.floor(this.player.y / this.world.tileSize);
    const district = districtAt(this.world, tileX, tileY);
    if (district && district.id !== this.lastDistrictId) {
      this.showDistrictToast(district.name, district.id);
    }
    if (this.districtToast.alpha > 0 && now > this.toastUntil) {
      this.districtToast.setAlpha(Math.max(0, this.districtToast.alpha - 0.04));
    }

    const veh = this.vehicles.active;
    if (veh) {
      this.hudText.setText(
        `${veh.def.label} · HP ${Math.ceil(veh.state.health)} · spd ${Math.round(Math.abs(veh.state.speed))}${
          veh.state.destroyed ? " · WRECKED" : ""
        }`,
      );
    } else if (this.combat.health <= 0) {
      this.hudText.setText("DOWN — press R for safehouse respawn");
    } else {
      const safe = isAtSafehouse(this.player.x, this.player.y, this.safehouse.x, this.safehouse.y)
        ? " · SAFEHOUSE"
        : "";
      this.hudText.setText(
        `HP ${Math.ceil(this.combat.health)}/${this.combat.maxHealth} · Ammo ${this.combat.ammo} · $${this.wallet.cash}${safe}`,
      );
    }
    this.publishDebug();
  }

  private toggleVehicle(): void {
    if (this.vehicles.activeId) {
      const exit = this.vehicles.tryExit();
      if (exit) {
        this.player.setPosition(exit.x, exit.y);
        this.player.setVisible(true);
        this.aimLine.setVisible(true);
        this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
      }
      return;
    }
    if (this.combat.health <= 0) return;
    if (this.vehicles.tryEnter(this.player.x, this.player.y)) {
      this.player.setVisible(false);
      this.aimLine.setVisible(false);
      const active = this.vehicles.active;
      if (active) this.cameras.main.startFollow(active.view, true, 0.14, 0.14);
    }
  }

  private tryAttack(): void {
    const now = this.time.now;
    if (this.combat.health <= 0) return;

    if (canFireRanged(this.combat, now)) {
      consumeRangedShot(this.combat, now);
      this.spawnProjectile();
      this.civilians.signalDanger(this.player.x, this.player.y, now);
      return;
    }

    if (this.combat.ammo <= 0 && canMelee(this.combat, now)) {
      consumeMelee(this.combat, now);
      this.flashMeleeArc();
      this.tryHitscanDummy(COMBAT.meleeRange, COMBAT.meleeDamage);
      this.civilians.signalDanger(this.player.x, this.player.y, now, 90);
    }
  }

  private spawnProjectile(): void {
    const cos = Math.cos(this.combat.facing);
    const sin = Math.sin(this.combat.facing);
    const bolt = this.add
      .rectangle(this.player.x + cos * 16, this.player.y + sin * 16, 10, 4, 0xffe08a)
      .setDepth(12)
      .setRotation(this.combat.facing);
    this.physics.add.existing(bolt);
    const b = bolt.body as Phaser.Physics.Arcade.Body;
    b.setAllowGravity(false);
    b.setVelocity(cos * COMBAT.projectileSpeed, sin * COMBAT.projectileSpeed);
    this.projectiles.add(bolt);
    this.time.delayedCall(700, () => {
      bolt.destroy();
    });
  }

  private tryHitscanDummy(range: number, damage: number): void {
    if (this.dummy.health <= 0) return;
    const dx = this.dummy.body.x - this.player.x;
    const dy = this.dummy.body.y - this.player.y;
    const dist = Math.hypot(dx, dy);
    if (dist > range) return;
    const ang = Math.atan2(dy, dx);
    let delta = Math.abs(ang - this.combat.facing);
    while (delta > Math.PI) delta -= Math.PI * 2;
    if (Math.abs(delta) > 0.55) return;
    this.dummy.health = Math.max(0, this.dummy.health - damage);
    this.dummy.label.setText(String(this.dummy.health));
    this.dummy.body.setFillStyle(this.dummy.health > 0 ? 0x8a6cff : 0x333333);
  }

  private flashMeleeArc(): void {
    const cos = Math.cos(this.combat.facing);
    const sin = Math.sin(this.combat.facing);
    const arc = this.add
      .rectangle(
        this.player.x + cos * 24,
        this.player.y + sin * 24,
        28,
        16,
        0xffffff,
        0.5,
      )
      .setDepth(12)
      .setRotation(this.combat.facing);
    this.tweens.add({
      targets: arc,
      alpha: 0,
      duration: 120,
      onComplete: () => arc.destroy(),
    });
  }

  private updateProjectiles(): void {
    const bounds = this.dummy.body.getBounds();
    for (const obj of this.projectiles.getChildren()) {
      const bolt = obj as Phaser.GameObjects.Rectangle;
      if (!bolt.active) continue;
      if (Phaser.Geom.Intersects.RectangleToRectangle(bolt.getBounds(), bounds)) {
        if (this.dummy.health > 0) {
          this.dummy.health = Math.max(0, this.dummy.health - COMBAT.rangedDamage);
          this.dummy.label.setText(String(this.dummy.health));
          this.dummy.body.setFillStyle(this.dummy.health > 0 ? 0x8a6cff : 0x333333);
        }
        bolt.destroy();
      }
    }
  }

  private respawnStub(): void {
    if (this.vehicles.activeId) {
      this.vehicles.tryExit();
    }
    const pos = respawnAtSafehouse(this.combat, this.safehouse.x, this.safehouse.y);
    this.player.setPosition(pos.x, pos.y);
    this.player.setFillStyle(COLORS.player);
    this.player.setVisible(true);
    this.aimLine.setVisible(true);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
  }

  private showDistrictToast(name: string, id: string): void {
    this.lastDistrictId = id;
    this.districtToast.setText(name);
    this.districtToast.setAlpha(1);
    this.toastUntil = this.time.now + 2200;
  }

  private publishDebug(): void {
    const veh = this.vehicles.active;
    patchDebugSnapshot({
      bootCompleted: true,
      scene: "GameScene",
      player: {
        x: this.player.x,
        y: this.player.y,
        health: this.combat.health,
        ammo: this.combat.ammo,
        facing: this.combat.facing,
      },
      inVehicle: Boolean(this.vehicles.activeId),
      vehicle: veh
        ? { speed: veh.state.speed, health: veh.state.health }
        : null,
      heat: 0,
      mission: { id: null, objective: null },
      counts: {
        pedestrians: this.civilians.counts.pedestrians,
        traffic: this.civilians.counts.traffic,
        police: 0,
      },
      fps: Math.round(this.game.loop.actualFps),
    });
  }
}
