import Phaser from "phaser";
import { COLORS } from "../config/gameConfig";
import { MissionManager } from "./missionManager";

export class MissionRuntime {
  readonly manager: MissionManager;
  private readonly markerViews: Phaser.GameObjects.Arc[] = [];
  private readonly markerLabels: Phaser.GameObjects.Text[] = [];
  private introPrompt!: Phaser.GameObjects.Text;
  private objectiveHud!: Phaser.GameObjects.Text;
  crate!: Phaser.GameObjects.Rectangle;
  crateAlive = true;

  constructor(scene: Phaser.Scene, spawnX: number, spawnY: number) {
    this.manager = new MissionManager(spawnX, spawnY);

    for (let i = 0; i < 4; i += 1) {
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

    this.introPrompt = scene.add
      .text(12, 96, "", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: COLORS.accent,
        backgroundColor: "#00000088",
        padding: { x: 8, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.objectiveHud = scene.add
      .text(12, 122, "", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: COLORS.uiText,
        backgroundColor: "#00000088",
        padding: { x: 8, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(100);
  }

  damageCrate(amount: number): void {
    if (!this.crateAlive) return;
    // Simple one/two hit destroy.
    (this.crate as Phaser.GameObjects.Rectangle & { hp?: number }).hp ??= 40;
    const c = this.crate as Phaser.GameObjects.Rectangle & { hp: number };
    c.hp -= amount;
    if (c.hp <= 0) {
      this.crateAlive = false;
      this.crate.setFillStyle(0x333333);
      this.crate.setAlpha(0.4);
    } else {
      this.crate.setFillStyle(0xffcc66);
    }
  }

  tryAcceptIntro(playerX: number, playerY: number, now: number): boolean {
    if (!this.manager.canAcceptIntro(playerX, playerY)) return false;
    if (this.manager.intro.status === "failed") {
      this.manager.retry("intro-courier");
    }
    this.manager.offerBriefing("intro-courier");
    return this.manager.accept("intro-courier", now);
  }

  update(
    playerX: number,
    playerY: number,
    now: number,
    hooks: {
      inVehicle: boolean;
      vehicleId: string | null;
      heat: number;
    },
    onReward: (cash: number) => void,
  ): void {
    const result = this.manager.tick({
      playerX,
      playerY,
      inVehicle: hooks.inVehicle,
      vehicleId: hooks.vehicleId,
      heat: hooks.heat,
      now,
      destroyTargetAlive: this.crateAlive,
    });
    if (result?.status === "success" && result.reward > 0) {
      onReward(result.reward);
    }
    if (result?.status === "failed") {
      // stay failed until retry via E near spawn
    }

    const active = this.manager.active;
    // Markers
    for (let i = 0; i < this.markerViews.length; i += 1) {
      this.markerViews[i]!.setVisible(false);
      this.markerLabels[i]!.setVisible(false);
    }
    if (active && active.status === "active") {
      const marker = active.def.markers[active.markerIndex];
      if (marker) {
        this.markerViews[0]!.setPosition(marker.x, marker.y).setVisible(true);
        this.markerLabels[0]!.setPosition(marker.x, marker.y - 22)
          .setText(marker.label)
          .setVisible(true);
      }
      if (active.def.type === "destruction" && this.crateAlive) {
        this.markerViews[1]!.setPosition(this.crate.x, this.crate.y).setVisible(true);
      }
    } else if (this.manager.intro.status === "available" || this.manager.intro.status === "failed") {
      this.markerViews[0]!.setPosition(this.manager.intro.def.markers[0]!.x, this.manager.intro.def.markers[0]!.y)
        .setVisible(true);
      this.markerLabels[0]!
        .setPosition(
          this.manager.intro.def.markers[0]!.x,
          this.manager.intro.def.markers[0]!.y - 22,
        )
        .setText("INTRO")
        .setVisible(true);
    }

    if (this.manager.canAcceptIntro(playerX, playerY) && !active) {
      const intro = this.manager.intro;
      this.introPrompt.setText(
        intro.status === "failed"
          ? `E: Retry ${intro.def.title}`
          : `E: Accept mission — ${intro.def.title}`,
      );
    } else {
      this.introPrompt.setText("");
    }

    const obj = active?.objective ?? this.manager.intro.objective;
    this.objectiveHud.setText(obj ? `OBJ: ${obj}` : "");
  }
}
