import Phaser from "phaser";
import { COLORS } from "../config/gameConfig";
import { MissionManager, type MissionWorldHooks } from "./missionManager";

export class MissionRuntime {
  readonly manager: MissionManager;
  private readonly markerViews: Phaser.GameObjects.Arc[] = [];
  private readonly markerLabels: Phaser.GameObjects.Text[] = [];
  private acceptPrompt!: Phaser.GameObjects.Text;
  private objectiveHud!: Phaser.GameObjects.Text;
  crate!: Phaser.GameObjects.Rectangle;
  crateAlive = true;
  /** Set true when crate takes damage; consumed by mission tick. */
  crateDamagedThisFrame = false;

  constructor(scene: Phaser.Scene, spawnX: number, spawnY: number) {
    this.manager = new MissionManager(spawnX, spawnY);

    for (let i = 0; i < 8; i += 1) {
      this.markerViews.push(
        scene.add.circle(0, 0, 18, 0x7dffa8, 0.35).setDepth(4).setVisible(false),
      );
      this.markerLabels.push(
        scene.add
          .text(0, 0, "", {
            fontFamily: "monospace",
            fontSize: "12px",
            color: COLORS.accent,
          })
          .setOrigin(0.5)
          .setDepth(12)
          .setVisible(false),
      );
    }

    this.crate = scene.add
      .rectangle(spawnX + 180, spawnY + 120, 30, 30, 0xc48a3a)
      .setDepth(8);
    scene.physics.add.existing(this.crate, true);

    this.acceptPrompt = scene.add
      .text(16, 88, "", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: COLORS.accent,
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.objectiveHud = scene.add
      .text(16, 112, "", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#e8d8b0",
      })
      .setScrollFactor(0)
      .setDepth(100);
  }

  damageCrate(amount: number): void {
    if (!this.crateAlive) return;
    // Simple one/two hit destroy.
    (this.crate as Phaser.GameObjects.Rectangle & { hp?: number }).hp ??= 40;
    const c = this.crate as Phaser.GameObjects.Rectangle & { hp: number };
    const before = c.hp;
    c.hp -= amount;
    if (c.hp < before) this.crateDamagedThisFrame = true;
    if (c.hp <= 0) {
      this.crateAlive = false;
      this.crate.setFillStyle(0x333333);
      this.crate.setAlpha(0.4);
    } else {
      this.crate.setFillStyle(0xffcc66);
    }
  }

  tryAcceptNearby(playerX: number, playerY: number, now: number): boolean {
    return this.manager.tryAcceptNearby(playerX, playerY, now);
  }

  /** @deprecated use tryAcceptNearby */
  tryAcceptIntro(playerX: number, playerY: number, now: number): boolean {
    return this.tryAcceptNearby(playerX, playerY, now);
  }

  update(
    playerX: number,
    playerY: number,
    now: number,
    hooks: Omit<
      MissionWorldHooks,
      "playerX" | "playerY" | "now" | "destroyTargetAlive" | "crateDamaged"
    >,
    onReward: (cash: number) => void,
    onFail?: () => void,
    onSideEffect?: (kind: "stealHeat" | "smashHeat") => void,
  ): void {
    const crateDamaged = this.crateDamagedThisFrame;
    this.crateDamagedThisFrame = false;

    const result = this.manager.tick({
      playerX,
      playerY,
      now,
      destroyTargetAlive: this.crateAlive,
      crateDamaged,
      ...hooks,
    });
    if (result?.stealHeat) onSideEffect?.("stealHeat");
    if (result?.smashHeat) onSideEffect?.("smashHeat");
    if (result?.status === "success" && result.reward > 0) {
      onReward(result.reward);
    }
    if (result?.status === "failed") {
      onFail?.();
    }

    const active = this.manager.active;
    for (let i = 0; i < this.markerViews.length; i += 1) {
      this.markerViews[i]!.setVisible(false);
      this.markerLabels[i]!.setVisible(false);
    }

    let slot = 0;
    if (active && active.status === "active") {
      const marker = active.def.markers[active.markerIndex];
      if (marker && slot < this.markerViews.length) {
        const tint =
          marker.kind === "timed"
            ? 0xffcc66
            : marker.kind === "vehicle"
              ? 0x66cfff
              : marker.kind === "contested"
                ? 0xff8877
                : 0x7dffa8;
        this.markerViews[slot]!.setFillStyle(tint, 0.4).setPosition(marker.x, marker.y).setVisible(true);
        this.markerLabels[slot]!
          .setPosition(marker.x, marker.y - 22)
          .setText(marker.label)
          .setVisible(true);
        slot += 1;
      }
      if (active.def.type === "destruction" && this.crateAlive && slot < this.markerViews.length) {
        this.markerViews[slot]!.setFillStyle(0xc48a3a, 0.45).setPosition(this.crate.x, this.crate.y).setVisible(true);
        slot += 1;
      }
      if (active.carrying && slot < this.markerViews.length) {
        // Parcel indicator floats on player.
        this.markerViews[slot]!
          .setFillStyle(0xffe08a, 0.55)
          .setPosition(playerX, playerY - 28)
          .setVisible(true);
        this.markerLabels[slot]!
          .setPosition(playerX, playerY - 44)
          .setText("PARCEL")
          .setVisible(true);
        slot += 1;
      }
    } else {
      // World markers for every available / failed mission accept point.
      for (const m of this.manager.listAcceptable()) {
        if (slot >= this.markerViews.length) break;
        this.markerViews[slot]!.setFillStyle(0x7dffa8, 0.35).setPosition(m.def.acceptX, m.def.acceptY).setVisible(true);
        this.markerLabels[slot]!
          .setPosition(m.def.acceptX, m.def.acceptY - 22)
          .setText(m.status === "failed" ? `RETRY` : m.def.title)
          .setVisible(true);
        slot += 1;
      }
    }

    const near = !active ? this.manager.nearestAcceptable(playerX, playerY) : null;
    if (near) {
      this.acceptPrompt.setText(
        near.status === "failed"
          ? `E: Retry ${near.def.title}`
          : `E: Accept mission — ${near.def.title}`,
      );
    } else {
      this.acceptPrompt.setText("");
    }

    const obj =
      active?.objective ??
      this.manager.missions.find((m) => m.objective && m.status !== "locked")?.objective ??
      null;
    this.objectiveHud.setText(obj ? `OBJ: ${obj}` : "");
  }
}
