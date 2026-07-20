import Phaser from "phaser";
import { COLORS, GAME_HEIGHT, GAME_WIDTH, PLAYER, WORLD_SEED } from "../config/gameConfig";
import { WorldRenderer3D } from "../render3d/WorldRenderer3D";
import { COMBAT, syncAmmoMirror } from "../systems/combatTypes";
import { patchDebugSnapshot } from "../systems/debugSnapshot";
import {
  applyDamage,
  canFireRanged,
  canMelee,
  consumeMelee,
  consumeRangedShot,
  createPlayerCombat,
  facingFromMove,
  facingFromPoints,
} from "../systems/playerCombat";
import type { CombatantState } from "../systems/combatTypes";
import { MissionRuntime } from "../missions/MissionRuntime";
import { CivilianRuntime } from "../systems/CivilianRuntime";
import {
  applyArrestPenalties,
  createHeatState,
  HEAT,
  reportOffense,
  tickHeat,
  type HeatState,
} from "../systems/heat";
import { nearestPaintShop, tryUsePaintShop } from "../systems/paintShop";
import { PickupRuntime } from "../systems/PickupRuntime";
import { PoliceRuntime } from "../systems/PoliceRuntime";
import { audioBus } from "../systems/audioBus";
import { createWallet, isAtSafehouse, respawnAtSafehouse, type WalletState } from "../systems/pickups";
import { loadSave, resetSave, writeSave, type SaveData } from "../systems/save";
import {
  activeWeaponDef,
  cycleWeapon,
  selectWeapon,
  WEAPON_ORDER,
  type WeaponId,
} from "../systems/weapons";
import { Minimap } from "../ui/Minimap";
import { VehicleRuntime } from "../vehicles/VehicleRuntime";
import { generateWorld } from "../world/generateWorld";
import { createCollisionBodies, paintWorldTexture } from "../world/renderWorld";
import { Tile } from "../world/tileTypes";
import { districtAt, tileAt, type GeneratedWorld } from "../world/types";

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
  private police!: PoliceRuntime;
  private missions!: MissionRuntime;
  private heat!: HeatState;
  private wallet!: WalletState;
  private safehouse = { x: 0, y: 0 };
  private heatHud!: Phaser.GameObjects.Text;
  private reportedWreckIds = new Set<string>();
  private minimap!: Minimap;
  private save!: SaveData;
  private paused = false;
  private helpOpen = false;
  private pausePanel!: Phaser.GameObjects.Container;
  private helpPanel!: Phaser.GameObjects.Container;
  private readonly keysDown = new Set<string>();
  private removeKeyListeners: (() => void) | null = null;
  private districtToast!: Phaser.GameObjects.Text;
  private hudText!: Phaser.GameObjects.Text;
  private lastDistrictId: string | null = null;
  private toastUntil = 0;
  private pointerDown = false;
  private lastPointerX = Number.NaN;
  private lastPointerY = Number.NaN;
  private mouseAimUntil = 0;
  private hazard!: Phaser.GameObjects.Rectangle;
  private dummy!: DummyTarget;
  private projectiles!: Phaser.GameObjects.Group;
  private solids!: Phaser.Physics.Arcade.StaticGroup;
  private lastCombatHealth = 0;
  private arrestedThisFrame = false;
  private world3d: WorldRenderer3D | null = null;
  private worldImage: Phaser.GameObjects.Image | null = null;
  private paintPrompt!: Phaser.GameObjects.Text;
  private use3d = false;

  constructor() {
    super("GameScene");
  }

  create(): void {
    this.world = generateWorld(WORLD_SEED);
    this.combat = createPlayerCombat(PLAYER.maxHealth);
    this.save = loadSave();
    audioBus.setVolumes(this.save.masterVolume, this.save.sfxVolume, this.save.ambienceVolume);
    const worldPixels = this.world.width * this.world.tileSize;

    // Transparent clear so Three.js underlay is visible (do NOT paint COLORS.sky here).
    this.cameras.main.setBackgroundColor("rgba(0,0,0,0)");
    this.physics.world.setBounds(0, 0, worldPixels, worldPixels);
    this.cameras.main.setBounds(0, 0, worldPixels, worldPixels);

    this.worldImage = paintWorldTexture(this, this.world);
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
    this.police = new PoliceRuntime(this);

    // Top-down 3D mesh layer (Phaser keeps HUD/input/physics).
    const host = this.game.canvas.parentElement;
    if (host) {
      this.world3d = new WorldRenderer3D(host, this.world);
      this.use3d = this.world3d.active;
      if (this.use3d) {
        this.worldImage.setVisible(false);
        // Let Three.js city show through the Phaser canvas.
        this.cameras.main.setBackgroundColor("rgba(0,0,0,0)");
        const canvas = this.game.canvas;
        canvas.style.background = "transparent";
        // Canvas renderer: keep clear alpha so underlay WebGL city is visible.
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.globalCompositeOperation = "source-over";
        this.vehicles.setOverlayVisible(false);
        this.civilians.setOverlayVisible(false);
        this.police.setOverlayVisible(false);
        this.player.setAlpha(0.05);
        this.world3d.setViewSize(this.scale.width, this.scale.height);
      }
    }
    this.heat = createHeatState();
    this.wallet = createWallet();
    this.wallet.cash = this.save.cash;
    this.wallet.score = this.save.score;
    this.pickups = new PickupRuntime(this, spawnX, spawnY);
    this.missions = new MissionRuntime(this, spawnX, spawnY);
    this.lastCombatHealth = this.combat.health;
    this.wireTestHooks();
    this.minimap = new Minimap(this, this.world);
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

    for (const shop of this.world.paintShops) {
      this.add.rectangle(shop.x, shop.y, 44, 44, 0xff66aa, 0.28).setDepth(3);
      this.add
        .text(shop.x, shop.y - 30, "PAINT $150", {
          fontFamily: "monospace",
          fontSize: "11px",
          color: "#ffc0dd",
        })
        .setOrigin(0.5)
        .setDepth(12);
    }
    this.paintPrompt = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 36, "", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#ffc0dd",
        backgroundColor: "#00000099",
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(120)
      .setAlpha(0);

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
      void audioBus.unlock();

      if (key === "p" || event.key === "Escape") {
        if (this.helpOpen) {
          this.setHelp(false);
          return;
        }
        this.setPaused(!this.paused);
        return;
      }
      if (key === "f1" || key === "h") {
        this.setHelp(!this.helpOpen);
        return;
      }
      if (key === "m") {
        this.minimap.toggleExpanded();
        return;
      }
      if (this.paused || this.helpOpen) {
        if (this.paused && key === "[") {
          this.adjustVolume("master", -0.1);
        } else if (this.paused && key === "]") {
          this.adjustVolume("master", 0.1);
        } else if (this.paused && key === ";") {
          this.adjustVolume("sfx", -0.1);
        } else if (this.paused && key === "'") {
          this.adjustVolume("sfx", 0.1);
        } else if (this.paused && key === ",") {
          this.adjustVolume("ambience", -0.1);
        } else if (this.paused && key === ".") {
          this.adjustVolume("ambience", 0.1);
        } else if (this.paused && key === "x") {
          this.save = resetSave();
          this.wallet.cash = 0;
          this.wallet.score = 0;
          audioBus.setVolumes(this.save.masterVolume, this.save.sfxVolume, this.save.ambienceVolume);
          this.refreshPauseText();
          audioBus.playSfx("ui");
        }
        return;
      }

      // Fire is hold-to-shoot in update (F/J) so keyboard-only matches LMB.
      if (key === "e") {
        if (this.tryPaintShop()) {
          // painted
        } else if (
          !this.vehicles.activeId &&
          this.missions.tryAcceptNearby(this.player.x, this.player.y, this.time.now)
        ) {
          audioBus.playSfx("ui");
        } else {
          this.toggleVehicle();
        }
      }
      if (key === "r") {
        this.respawnStub();
      }
      if (key === "1" || key === "2" || key === "3" || key === "4") {
        const id = WEAPON_ORDER[Number(key) - 1] as WeaponId;
        if (selectWeapon(this.combat.weapons, id)) {
          syncAmmoMirror(this.combat);
          audioBus.playSfx("ui");
        }
      }
      if (key === "q") {
        cycleWeapon(this.combat.weapons, -1);
        syncAmmoMirror(this.combat);
        audioBus.playSfx("ui");
      }
      if (key === "tab") {
        event.preventDefault();
        cycleWeapon(this.combat.weapons, 1);
        syncAmmoMirror(this.combat);
        audioBus.playSfx("ui");
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
      void audioBus.unlock();
      if (this.paused || this.helpOpen) return;
      if (p.leftButtonDown()) {
        this.pointerDown = true;
        this.mouseAimUntil = this.time.now + 800;
      }
    });
    this.input.on("pointerup", () => {
      this.pointerDown = false;
    });
    this.input.on("pointermove", () => {
      this.mouseAimUntil = this.time.now + 600;
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.removeKeyListeners?.();
      this.removeKeyListeners = null;
      this.keysDown.clear();
      this.input.removeAllListeners();
      this.world3d?.destroy();
      this.world3d = null;
    });

    // Left HUD chrome — late-90s arcade stack, not SaaS cards.
    this.add
      .rectangle(8, 8, 430, 158, 0x0a121c, 0.72)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(99)
      .setStrokeStyle(1, 0xc8b84a, 0.35);
    this.add
      .rectangle(8, 8, 430, 3, 0xc8b84a, 0.7)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(99);

    this.add
      .text(16, 14, "WASD · E · 1–4 weapons · F/J fire · Space brake · M map · P pause · H help", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: COLORS.uiMuted,
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.buildPauseAndHelp();

    this.hudText = this.add
      .text(16, 36, "", {
        fontFamily: "monospace",
        fontSize: "15px",
        color: COLORS.uiText,
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.heatHud = this.add
      .text(16, 60, "", {
        fontFamily: "monospace",
        fontSize: "15px",
        color: "#ffb4b4",
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
    if (this.paused || this.helpOpen) {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0, 0);
      this.publishDebug();
      return;
    }
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
      const impact = this.vehicles.lastImpact;
      if (impact && impact.damage > 0) {
        const intensity = Math.min(0.012, 0.003 + impact.damage * 0.00025);
        this.cameras.main.shake(120, intensity);
        audioBus.playSfx("crash");
        if (impact.impactSpeed >= HEAT.crashSpeedThreshold) {
          reportOffense(this.heat, "crash", now);
        }
      }

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
      if (
        Number.isNaN(this.lastPointerX) ||
        pointer.x !== this.lastPointerX ||
        pointer.y !== this.lastPointerY
      ) {
        if (!Number.isNaN(this.lastPointerX)) {
          this.mouseAimUntil = now + 600;
        }
        this.lastPointerX = pointer.x;
        this.lastPointerY = pointer.y;
      }

      const useMouseAim = this.pointerDown || now < this.mouseAimUntil;
      if (useMouseAim) {
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.combat.facing = facingFromPoints(
          this.player.x,
          this.player.y,
          worldPoint.x,
          worldPoint.y,
        );
      } else {
        // Keyboard-only: face walk direction (twin-stick without a stick).
        this.combat.facing = facingFromMove(vx, vy, this.combat.facing);
      }
      this.aimLine.setPosition(this.player.x, this.player.y);
      this.aimLine.setRotation(this.combat.facing);

      const fireHeld =
        this.pointerDown || this.keysDown.has("f") || this.keysDown.has("j");
      if (fireHeld) this.tryAttack();

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
    this.police.update(this.heat.level, this.player.x, this.player.y, dt, now);
    if (this.heat.level >= 2) {
      this.civilians.signalSiren(now, 500);
    }
    const tileX = Math.floor(this.player.x / this.world.tileSize);
    const tileY = Math.floor(this.player.y / this.world.tileSize);
    const ground = tileAt(this.world, tileX, tileY);
    const nearSafehouse = isAtSafehouse(
      this.player.x,
      this.player.y,
      this.safehouse.x,
      this.safehouse.y,
    );
    const nearPark = ground === Tile.Park || ground === Tile.Grass;
    const onOpenRoadWithCops =
      ground === Tile.Road && this.police.activeCount > 0 && this.police.isPlayerSeen;
    const decayScale = this.missions.manager.escapeDecayMultiplier({
      nearSafehouse,
      nearPark,
      onOpenRoadWithCops,
    });

    const heatTick = tickHeat(
      this.heat,
      dt * 1000,
      this.police.isPlayerSeen,
      this.police.inArrestRange,
      decayScale,
    );
    this.arrestedThisFrame = false;
    if (heatTick.arrested) {
      this.arrestedThisFrame = true;
      this.handleArrest();
    }
    // Cleanup units when cold.
    if (this.heat.level === 0) this.police.clearAll();

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

    // Vehicle ram can smash mission crate.
    if (inVehicle && activeVeh && this.missions.crateAlive) {
      const speed = Math.abs(activeVeh.state.speed);
      if (
        speed > 55 &&
        Phaser.Geom.Intersects.RectangleToRectangle(
          activeVeh.view.getBounds(),
          this.missions.crate.getBounds(),
        )
      ) {
        this.missions.damageCrate(18 + speed * 0.08);
        this.spawnHitSpark(this.missions.crate.x, this.missions.crate.y);
      }
    }

    const playerDamaged = this.combat.health < this.lastCombatHealth;
    if (playerDamaged) {
      // Brief red flash so on-foot hits read without a UI dump.
      this.cameras.main.flash(90, 180, 40, 40);
    }
    this.lastCombatHealth = this.combat.health;

    const stealTargetId = this.missions.manager.active?.def.targetVehicleId ?? null;
    this.missions.update(
      this.player.x,
      this.player.y,
      now,
      {
        inVehicle: Boolean(this.vehicles.activeId),
        vehicleId: this.vehicles.active?.state.id ?? null,
        heat: this.heat.level,
        targetVehiclePresent: stealTargetId
          ? this.vehicles.vehicles.some((v) => v.state.id === stealTargetId && !v.state.destroyed)
          : true,
        playerDamaged,
        arrested: this.arrestedThisFrame,
        inArrestRange: this.police.inArrestRange,
        vehicleHealth: this.vehicles.active?.state.health ?? null,
        nearSafehouse,
        nearPark,
        onOpenRoadWithCops,
        dtMs: dt * 1000,
      },
      (cash) => {
        this.wallet.cash += cash;
        this.wallet.score += cash;
        audioBus.playSting("win");
      },
      () => {
        audioBus.playSting("fail");
      },
      (kind) => {
        if (kind === "stealHeat") reportOffense(this.heat, "steal", now);
        if (kind === "smashHeat") reportOffense(this.heat, "destroy", now);
      },
    );

    // Music beds: chase when heat is up, otherwise city cruise.
    if (audioBus.isUnlocked) {
      audioBus.setBed(this.heat.level >= 2 ? "heat" : "city");
    }

    const district = districtAt(this.world, tileX, tileY);
    if (district && district.id !== this.lastDistrictId) {
      this.showDistrictToast(district.name, district.id);
    }
    if (this.districtToast.alpha > 0 && now > this.toastUntil) {
      this.districtToast.setAlpha(Math.max(0, this.districtToast.alpha - 0.04));
    }

    const veh = this.vehicles.active;
    const money = `$${this.wallet.cash} · sc ${this.wallet.score}`;
    if (veh) {
      this.hudText.setText(
        `${veh.def.label} · HP ${Math.ceil(veh.state.health)} · spd ${Math.round(Math.abs(veh.state.speed))} · ${money}${
          veh.state.destroyed ? " · WRECKED" : ""
        }`,
      );
      if (veh.state.destroyed && !this.reportedWreckIds.has(veh.state.id)) {
        this.reportedWreckIds.add(veh.state.id);
        reportOffense(this.heat, "destroy", now);
      }
    } else if (this.combat.health <= 0) {
      this.hudText.setText(`DOWN — R safehouse · ${money}`);
    } else {
      const safe = isAtSafehouse(this.player.x, this.player.y, this.safehouse.x, this.safehouse.y)
        ? " · SAFEHOUSE"
        : "";
      const wdef = activeWeaponDef(this.combat.weapons);
      const ammoStr = wdef.isMelee ? "—" : String(this.combat.ammo);
      this.hudText.setText(
        `HP ${Math.ceil(this.combat.health)}/${this.combat.maxHealth} · ${wdef.label} ${ammoStr} · ${money}${safe}`,
      );
    }

    const shopNear = nearestPaintShop(
      this.world.paintShops,
      this.player.x,
      this.player.y,
    );
    if (shopNear) {
      this.paintPrompt.setText(`E — Paint job $${shopNear.fee} (clears heat)`);
      this.paintPrompt.setAlpha(1);
    } else {
      this.paintPrompt.setAlpha(0);
    }

    if (this.use3d && this.world3d) {
      this.syncWorld3d();
    }
    const pips = "●".repeat(this.heat.level) + "○".repeat(Math.max(0, 5 - this.heat.level));
    const arresting = this.police.inArrestRange;
    this.heatHud.setText(
      this.heat.level > 0
        ? `HEAT ${pips}  cops ${this.police.activeCount}${arresting ? " · ARRESTING" : ""}`
        : "HEAT ○○○○○",
    );
    if (arresting) {
      this.heatHud.setColor(Math.floor(now / 180) % 2 === 0 ? "#ffeeee" : "#ff5555");
    } else if (this.heat.level >= 3) {
      this.heatHud.setColor("#ffb4b4");
    } else {
      this.heatHud.setColor(this.heat.level > 0 ? "#ffc9a8" : "#c8c8c8");
    }

    const activeMission = this.missions.manager.active;
    const markers =
      activeMission && activeMission.status === "active"
        ? activeMission.def.markers.map((m) => ({ x: m.x, y: m.y }))
        : [];
    this.minimap.draw(
      this.scale.width,
      this.player.x,
      this.player.y,
      this.combat.facing,
      this.police.positions,
      markers,
    );

    // Persist lightly.
    this.save.cash = this.wallet.cash;
    this.save.score = this.wallet.score;
    if (Math.floor(now / 2000) !== Math.floor((now - dt * 1000) / 2000)) {
      writeSave(this.save);
    }

    this.publishDebug();
  }

  private buildPauseAndHelp(): void {
    const mkPanel = (lines: string[]): Phaser.GameObjects.Container => {
      const dim = this.add
        .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x040810, 0.55)
        .setScrollFactor(0);
      const bg = this.add
        .rectangle(GAME_WIDTH / 2, 360, 620, 400, 0x0c1826, 0.94)
        .setScrollFactor(0)
        .setStrokeStyle(2, 0xc8b84a, 0.55);
      const rule = this.add
        .rectangle(GAME_WIDTH / 2, 210, 520, 2, 0xc8b84a, 0.5)
        .setScrollFactor(0);
      const text = this.add
        .text(GAME_WIDTH / 2, 360, lines.join("\n"), {
          fontFamily: "monospace",
          fontSize: "17px",
          color: COLORS.uiText,
          align: "center",
          lineSpacing: 6,
        })
        .setOrigin(0.5)
        .setScrollFactor(0);
      return this.add
        .container(0, 0, [dim, bg, rule, text])
        .setDepth(200)
        .setScrollFactor(0)
        .setVisible(false);
    };

    this.pausePanel = mkPanel([""]);
    this.helpPanel = mkPanel([
      "HELP / CONTROLS",
      "",
      "WASD / Arrows — move or drive",
      "Shift — sprint   Space — handbrake",
      "E — enter/exit / missions / paint shop",
      "1–4 / Q / Tab — weapons (Fists, Pistol, SMG, Shotgun)",
      "Aim — mouse if moved, else face walk direction",
      "Fire — hold F or J (keyboard) or LMB (mouse)",
      "M — expand map   R — safehouse respawn",
      "P / Esc — pause   F1 / H — help",
      "",
      "Paint shops: pay $150 to recolor + clear heat",
      "Fully playable without a mouse",
    ]);
    this.refreshPauseText();
  }

  private refreshPauseText(): void {
    const text = this.pausePanel.list[3] as Phaser.GameObjects.Text;
    text.setText(
      [
        "PAUSED",
        "",
        `[ ] master  ${this.save.masterVolume.toFixed(1)}`,
        `; '  sfx    ${this.save.sfxVolume.toFixed(1)}`,
        `, .  ambience ${this.save.ambienceVolume.toFixed(1)}`,
        "",
        "X — reset save",
        "P / Esc — resume",
      ].join("\n"),
    );
  }

  private setPaused(on: boolean): void {
    this.paused = on;
    if (on) this.helpOpen = false;
    this.pausePanel.setVisible(on);
    this.helpPanel.setVisible(false);
    this.refreshPauseText();
    audioBus.playSfx("ui");
  }

  private setHelp(on: boolean): void {
    this.helpOpen = on;
    if (on) this.paused = false;
    this.helpPanel.setVisible(on);
    this.pausePanel.setVisible(false);
    audioBus.playSfx("ui");
  }

  private adjustVolume(bus: "master" | "sfx" | "ambience", delta: number): void {
    if (bus === "master") {
      this.save.masterVolume = Math.max(0, Math.min(1, this.save.masterVolume + delta));
    } else if (bus === "sfx") {
      this.save.sfxVolume = Math.max(0, Math.min(1, this.save.sfxVolume + delta));
    } else {
      this.save.ambienceVolume = Math.max(0, Math.min(1, this.save.ambienceVolume + delta));
    }
    audioBus.setVolumes(this.save.masterVolume, this.save.sfxVolume, this.save.ambienceVolume);
    writeSave(this.save);
    this.refreshPauseText();
    audioBus.playSfx("ui");
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
      audioBus.playSfx("engine");
      reportOffense(this.heat, "steal", this.time.now);
      this.civilians.signalDanger(this.player.x, this.player.y, this.time.now);
    }
  }

  private handleArrest(): void {
    const pen = applyArrestPenalties(this.wallet.cash);
    this.wallet.cash = pen.cash;
    this.wallet.score = Math.max(0, this.wallet.score - pen.scorePenalty);
    this.heat = createHeatState();
    this.police.clearAll();
    if (this.vehicles.activeId) this.vehicles.tryExit();
    const pos = respawnAtSafehouse(this.combat, this.safehouse.x, this.safehouse.y);
    this.player.setPosition(pos.x, pos.y);
    this.player.setVisible(true);
    this.aimLine.setVisible(true);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    audioBus.playSfx("arrest");
    audioBus.playSting("fail");
    writeSave({ ...this.save, cash: this.wallet.cash, score: this.wallet.score });
  }

  private tryAttack(): void {
    const now = this.time.now;
    if (this.combat.health <= 0) return;
    const def = activeWeaponDef(this.combat.weapons);

    if (canFireRanged(this.combat, now)) {
      consumeRangedShot(this.combat, now);
      for (let i = 0; i < def.pellets; i += 1) {
        const spread = (Math.random() - 0.5) * 2 * def.spread;
        this.spawnProjectile(def.projectileSpeed, def.damage, this.combat.facing + spread);
      }
      audioBus.playSfx("shoot");
      this.civilians.signalDanger(this.player.x, this.player.y, now);
      reportOffense(this.heat, "attack", now);
      return;
    }

    if (canMelee(this.combat, now)) {
      consumeMelee(this.combat, now);
      const melee = def.isMelee ? def : { range: COMBAT.meleeRange, damage: COMBAT.meleeDamage };
      this.flashMeleeArc();
      this.tryHitscanDummy(melee.range, melee.damage);
      this.civilians.signalDanger(this.player.x, this.player.y, now, 90);
      reportOffense(this.heat, "attack", now);
    }
  }

  private tryPaintShop(): boolean {
    const shop = nearestPaintShop(this.world.paintShops, this.player.x, this.player.y);
    if (!shop) return false;
    const result = tryUsePaintShop({
      wallet: this.wallet,
      heat: this.heat,
      fee: shop.fee,
      rng: () => Math.random(),
    });
    if (!result.ok) {
      audioBus.playSfx("ui");
      this.paintPrompt.setText("Need $150 for a paint job");
      this.paintPrompt.setAlpha(1);
      return true;
    }
    this.heat = result.heat;
    this.police.clearAll();
    if (result.color !== null) {
      this.vehicles.paintActiveOrNearest(this.player.x, this.player.y, result.color);
    }
    audioBus.playSfx("pickup");
    this.paintPrompt.setText("Painted — heat cleared");
    this.paintPrompt.setAlpha(1);
    writeSave({ ...this.save, cash: this.wallet.cash, score: this.wallet.score });
    return true;
  }

  private syncWorld3d(): void {
    if (!this.world3d) return;
    const cam = this.cameras.main;
    this.world3d.setViewSize(this.scale.width, this.scale.height);
    this.world3d.syncCamera(cam.scrollX + cam.width / 2, cam.scrollY + cam.height / 2, cam.zoom);
    const poses = [
      {
        id: "player",
        x: this.player.x,
        y: this.player.y,
        heading: this.combat.facing,
        kind: "player" as const,
        color: COLORS.player,
      },
      ...this.civilians.poses.map((p) => ({
        id: p.id,
        x: p.x,
        y: p.y,
        heading: p.heading,
        kind: p.kind === "car" ? ("car" as const) : ("ped" as const),
        color: p.kind === "car" ? 0x9aa3b5 : 0xb8c4a8,
        width: p.kind === "car" ? 48 : undefined,
        height: p.kind === "car" ? 24 : undefined,
        fleeing: p.fleeing,
      })),
      ...this.vehicles.vehicles.map((v) => ({
        id: v.state.id,
        x: v.state.x,
        y: v.state.y,
        heading: v.state.heading,
        kind: "vehicle" as const,
        color: this.vehicles.bodyColor(v.state.id),
        width: v.def.width,
        height: v.def.height,
        archetype: v.def.id,
      })),
      ...this.police.positions.map((p, i) =>
        p.inCar
          ? {
              id: `cop-${i}`,
              x: p.x,
              y: p.y,
              heading: p.heading,
              kind: "police" as const,
              color: 0x3a5cff,
              width: 52,
              height: 26,
              archetype: "police",
            }
          : {
              id: `cop-${i}`,
              x: p.x,
              y: p.y,
              heading: p.heading,
              kind: "police" as const,
              color: 0x3a5cff,
            },
      ),
    ];
    this.world3d.syncEntities(poses);
    this.world3d.render();
  }

  private spawnProjectile(
    speed: number = COMBAT.projectileSpeed,
    _damage: number = COMBAT.rangedDamage,
    facing: number = this.combat.facing,
  ): void {
    const cos = Math.cos(facing);
    const sin = Math.sin(facing);
    const muzzleX = this.player.x + cos * 14;
    const muzzleY = this.player.y + sin * 14;
    this.spawnMuzzleFlash(muzzleX, muzzleY);
    const bolt = this.add
      .rectangle(muzzleX + cos * 6, muzzleY + sin * 6, 12, 4, 0xffe08a)
      .setDepth(12)
      .setRotation(facing);
    (bolt as Phaser.GameObjects.Rectangle & { damage?: number }).damage = _damage;
    this.physics.add.existing(bolt);
    const b = bolt.body as Phaser.Physics.Arcade.Body;
    b.setAllowGravity(false);
    b.setVelocity(cos * speed, sin * speed);
    this.projectiles.add(bolt);
    this.time.delayedCall(700, () => {
      bolt.destroy();
    });
  }

  private spawnMuzzleFlash(x: number, y: number): void {
    const flash = this.add.circle(x, y, 14, 0xfff2a8, 0.95).setDepth(13);
    const ring = this.add.circle(x, y, 6, 0xffaa44, 0.7).setDepth(13);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2.2,
      duration: 110,
      onComplete: () => flash.destroy(),
    });
    this.tweens.add({
      targets: ring,
      alpha: 0,
      scale: 3,
      duration: 140,
      onComplete: () => ring.destroy(),
    });
  }

  private spawnHitSpark(x: number, y: number): void {
    const spark = this.add.rectangle(x, y, 14, 14, 0xffffff, 0.9).setDepth(14);
    this.tweens.add({
      targets: spark,
      alpha: 0,
      scaleX: 2.2,
      scaleY: 2.2,
      duration: 140,
      onComplete: () => spark.destroy(),
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
    this.dummy.body.setFillStyle(0xffffff);
    this.spawnHitSpark(this.dummy.body.x, this.dummy.body.y);
    this.time.delayedCall(80, () => {
      this.dummy.body.setFillStyle(this.dummy.health > 0 ? 0x8a6cff : 0x333333);
    });
  }

  private flashMeleeArc(): void {
    const cos = Math.cos(this.combat.facing);
    const sin = Math.sin(this.combat.facing);
    const arc = this.add
      .rectangle(
        this.player.x + cos * 26,
        this.player.y + sin * 26,
        36,
        20,
        0xfff8d0,
        0.75,
      )
      .setDepth(12)
      .setRotation(this.combat.facing);
    this.tweens.add({
      targets: arc,
      alpha: 0,
      scaleX: 1.35,
      duration: 160,
      onComplete: () => arc.destroy(),
    });
  }

  private updateProjectiles(): void {
    const bounds = this.dummy.body.getBounds();
    const crateBounds = this.missions.crate.getBounds();
    for (const obj of this.projectiles.getChildren()) {
      const bolt = obj as Phaser.GameObjects.Rectangle;
      if (!bolt.active) continue;
      const dmg =
        (bolt as Phaser.GameObjects.Rectangle & { damage?: number }).damage ?? COMBAT.rangedDamage;
      if (Phaser.Geom.Intersects.RectangleToRectangle(bolt.getBounds(), crateBounds)) {
        this.missions.damageCrate(dmg);
        this.spawnHitSpark(bolt.x, bolt.y);
        bolt.destroy();
        continue;
      }
      if (Phaser.Geom.Intersects.RectangleToRectangle(bolt.getBounds(), bounds)) {
        if (this.dummy.health > 0) {
          this.dummy.health = Math.max(0, this.dummy.health - dmg);
          this.dummy.label.setText(String(this.dummy.health));
          this.dummy.body.setFillStyle(0xffffff);
          this.spawnHitSpark(this.dummy.body.x, this.dummy.body.y);
          this.time.delayedCall(80, () => {
            this.dummy.body.setFillStyle(this.dummy.health > 0 ? 0x8a6cff : 0x333333);
          });
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
      heat: this.heat.level,
      mission: {
        id: this.missions.manager.active?.def.id ?? null,
        objective: this.missions.manager.active?.objective ?? null,
      },
      counts: {
        pedestrians: this.civilians.counts.pedestrians,
        traffic: this.civilians.counts.traffic,
        police: this.police.activeCount,
        fleeing: this.civilians.counts.fleeing,
      },
      fps: Math.round(this.game.loop.actualFps),
      use3d: this.use3d,
      civBias: {
        pedPreferred: this.civilians.bias.pedPreferred,
        pedTotal: this.civilians.bias.pedTotal,
        carPreferred: this.civilians.bias.carPreferred,
        carTotal: this.civilians.bias.carTotal,
      },
    });
  }

  /** Playwright-only helpers for mission depth proofs (not a public game API). */
  private wireTestHooks(): void {
    window.__HARBOR_TEST__ = {
      movePlayer: (x: number, y: number) => {
        this.player.setPosition(x, y);
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.reset(x, y);
      },
      completeActiveMission: () => {
        const reward = this.missions.manager.forceSucceedActive();
        if (reward > 0) {
          this.wallet.cash += reward;
          this.wallet.score += reward;
        }
        this.publishDebug();
        return reward;
      },
      acceptNearby: () => {
        const ok = this.missions.tryAcceptNearby(
          this.player.x,
          this.player.y,
          this.time.now,
        );
        this.publishDebug();
        return ok;
      },
      acceptPoint: (missionId: string) => {
        const m = this.missions.manager.missions.find((x) => x.def.id === missionId);
        if (!m) return null;
        return { x: m.def.acceptX, y: m.def.acceptY };
      },
      moveNearFleet: () => {
        const v = this.vehicles.vehicles[0];
        if (!v) return;
        const x = v.state.x - 24;
        const y = v.state.y;
        this.player.setPosition(x, y);
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.reset(x, y);
      },
      setZoom: (z: number) => {
        this.cameras.main.setZoom(z);
      },
      signalDanger: () => {
        this.civilians.signalDanger(this.player.x, this.player.y, this.time.now);
      },
      sfxKinds: () => [...audioBus.playedKinds],
      moveNearPickup: () => {
        const p = this.pickups.pickups.find((x) => !x.collected) ?? this.pickups.pickups[0];
        if (!p) return;
        this.player.setPosition(p.x, p.y);
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.reset(p.x, p.y);
      },
      musicBedsReady: () => ({
        title: audioBus.bedFileReady("title"),
        city: audioBus.bedFileReady("city"),
        heat: audioBus.bedFileReady("heat"),
        active: audioBus.activeBed,
      }),
      paintNearest: (color: number) => {
        const id = this.vehicles.paintActiveOrNearest(this.player.x, this.player.y, color);
        if (!id) return null;
        this.syncWorld3d();
        return this.vehicles.bodyColor(id);
      },
      vehicleBodyColor: (id?: string) => {
        const target = id ?? this.vehicles.vehicles[0]?.state.id;
        if (!target) return null;
        return this.vehicles.bodyColor(target);
      },
      bumpHeat: (level: number) => {
        this.heat.level = Math.max(0, Math.min(5, level));
        this.heat.lastOffenseAt = this.time.now;
        this.police.update(this.heat.level, this.player.x, this.player.y, 0.016, this.time.now);
        this.syncWorld3d();
        this.publishDebug();
      },
    };
  }
}
