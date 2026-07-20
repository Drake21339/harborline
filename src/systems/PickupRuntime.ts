import Phaser from "phaser";
import { audioBus } from "./audioBus";
import type { CombatantState } from "./combatTypes";
import {
  applyPickupToPlayer,
  defaultPlazaPickups,
  refreshPickups,
  tryCollectPickup,
  type PickupRuntimeState,
  type WalletState,
} from "./pickups";

const COLORS: Record<string, number> = {
  health: 0x4cff8a,
  ammo: 0xffe066,
  cash: 0x7dffa8,
  repair: 0x66b3ff,
};

export class PickupRuntime {
  readonly pickups: PickupRuntimeState[];
  private readonly views = new Map<string, Phaser.GameObjects.Rectangle>();
  private flashText: Phaser.GameObjects.Text | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    spawnX: number,
    spawnY: number,
  ) {
    this.pickups = defaultPlazaPickups(spawnX, spawnY);
    for (const p of this.pickups) {
      const view = scene.add
        .rectangle(p.x, p.y, 16, 16, COLORS[p.kind] ?? 0xffffff)
        .setDepth(5);
      this.views.set(p.id, view);
    }
  }

  update(
    now: number,
    playerX: number,
    playerY: number,
    combat: CombatantState,
    wallet: WalletState,
    onRepair: (amount: number) => void,
  ): void {
    refreshPickups(this.pickups, now);
    for (const p of this.pickups) {
      const view = this.views.get(p.id);
      if (!view) continue;
      const available = !p.collected || now >= p.availableAt;
      // collected flag cleared by refresh; show when not waiting.
      const show = !p.collected;
      view.setVisible(show);
      if (!show) continue;
      if (tryCollectPickup(p, now, playerX, playerY, 22)) {
        const result = applyPickupToPlayer(p.kind, p.amount, combat, wallet);
        if (result.vehicleRepair > 0) onRepair(result.vehicleRepair);
        audioBus.playSfx("pickup");
        this.pulseFeedback(p.kind);
        view.setVisible(false);
      }
      // idle bob
      if (available) {
        view.setScale(1 + Math.sin(now / 200 + p.x) * 0.08);
      }
    }
  }

  private pulseFeedback(kind: string): void {
    if (this.flashText) this.flashText.destroy();
    this.flashText = this.scene.add
      .text(12, 70, `Picked up ${kind}`, {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#7dffa8",
        backgroundColor: "#00000088",
        padding: { x: 8, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(102);
    this.scene.time.delayedCall(900, () => {
      this.flashText?.destroy();
      this.flashText = null;
    });
  }
}
