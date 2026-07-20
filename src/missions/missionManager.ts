import { buildMissionDefs } from "./defs";
import type { MissionDef, MissionRuntimeState, MissionStatus } from "./types";

export interface MissionWorldHooks {
  playerX: number;
  playerY: number;
  inVehicle: boolean;
  vehicleId: string | null;
  heat: number;
  now: number;
  destroyTargetAlive: boolean;
  /** False when steal target id is not present in the world fleet. */
  targetVehiclePresent: boolean;
  /** Player took damage this frame (courier drop). */
  playerDamaged: boolean;
  /** Arrest resolved this frame. */
  arrested: boolean;
  /** Police currently in arrest range. */
  inArrestRange: boolean;
  /** Active vehicle health (null if on foot). */
  vehicleHealth: number | null;
  /** Near safehouse pad (escape decay boost). */
  nearSafehouse: boolean;
  /** Standing on park/grass (escape decay boost). */
  nearPark: boolean;
  /** On road tile with cops nearby (escape decay slow). */
  onOpenRoadWithCops: boolean;
  /** Crate took damage this frame (destruction heat). */
  crateDamaged: boolean;
  /** Frame delta ms for contested hold. */
  dtMs: number;
}

export interface MissionTickResult {
  reward: number;
  status: MissionStatus;
  stealHeat?: boolean;
  smashHeat?: boolean;
}

const ACCEPT_RADIUS = 90;
const COURIER_PICK_RADIUS = 40;
const COURIER_DROP_RADIUS = 40;
const STEAL_DROP_RADIUS = 50;
const MULTI_STOP_RADIUS = 42;

export class MissionManager {
  readonly missions: MissionRuntimeState[];
  activeId: string | null = null;

  constructor(spawnX: number, spawnY: number) {
    const defs = buildMissionDefs(spawnX, spawnY);
    this.missions = defs.map((def, i) => this.freshState(def, i === 0 ? "available" : "locked"));
  }

  get active(): MissionRuntimeState | null {
    if (!this.activeId) return null;
    return this.missions.find((m) => m.def.id === this.activeId) ?? null;
  }

  get intro(): MissionRuntimeState {
    return this.missions[0]!;
  }

  /** Available / failed / briefing missions the player can accept near. */
  listAcceptable(): MissionRuntimeState[] {
    return this.missions.filter(
      (m) => m.status === "available" || m.status === "briefing" || m.status === "failed",
    );
  }

  /** Nearest acceptable mission within accept radius, or null. */
  nearestAcceptable(playerX: number, playerY: number): MissionRuntimeState | null {
    let best: MissionRuntimeState | null = null;
    let bestDist = ACCEPT_RADIUS;
    for (const m of this.listAcceptable()) {
      const d = Math.hypot(playerX - m.def.acceptX, playerY - m.def.acceptY);
      if (d < bestDist) {
        best = m;
        bestDist = d;
      }
    }
    return best;
  }

  /** @deprecated Prefer nearestAcceptable — kept for intro spawn checks. */
  canAcceptIntro(playerX: number, playerY: number): boolean {
    const near = this.nearestAcceptable(playerX, playerY);
    return near?.def.id === "intro-courier";
  }

  offerBriefing(id: string): void {
    const m = this.byId(id);
    if (!m) return;
    if (m.status === "available" || m.status === "failed") {
      m.status = "briefing";
      m.objective = m.def.briefing;
    }
  }

  accept(id: string, now: number): boolean {
    const m = this.byId(id);
    if (!m) return false;
    if (m.status !== "briefing" && m.status !== "available" && m.status !== "failed") {
      return false;
    }
    // Only one active.
    if (this.activeId && this.activeId !== id) return false;
    this.resetRuntime(m, now);
    m.status = "active";
    m.objective = this.objectiveFor(m);
    this.activeId = id;
    // Multi-stop timed: arm first stop deadline on accept.
    this.armStopDeadline(m, now);
    return true;
  }

  /** Accept nearest available/failed mission if player is in range. */
  tryAcceptNearby(playerX: number, playerY: number, now: number): boolean {
    const near = this.nearestAcceptable(playerX, playerY);
    if (!near) return false;
    if (near.status === "failed") {
      this.retry(near.def.id);
    }
    this.offerBriefing(near.def.id);
    return this.accept(near.def.id, now);
  }

  /** E2E/debug helper: pay reward + unlock next without walking objectives. */
  forceSucceedActive(): number {
    const m = this.active;
    if (!m || m.status !== "active") return 0;
    return this.succeed(m).reward;
  }

  retry(id: string): void {
    const m = this.byId(id);
    if (!m) return;
    this.resetRuntime(m, 0);
    m.status = "available";
    m.objective = null;
    if (this.activeId === id) this.activeId = null;
  }

  /**
   * Escape-heat decay multiplier for GameScene heat tick.
   * Faster near safehouse/park; slower on open road with cops near.
   */
  escapeDecayMultiplier(hooks: Pick<
    MissionWorldHooks,
    "nearSafehouse" | "nearPark" | "onOpenRoadWithCops"
  >): number {
    const m = this.active;
    if (!m || m.def.type !== "escape_heat" || m.status !== "active") return 1;
    if (hooks.nearSafehouse || hooks.nearPark) return 1.85;
    if (hooks.onOpenRoadWithCops) return 0.45;
    return 1;
  }

  tick(hooks: MissionWorldHooks): MissionTickResult | null {
    const m = this.active;
    if (!m || m.status !== "active") return null;

    if (m.timerMs !== null) {
      m.timerMs = Math.max(0, (m.def.timeLimitMs ?? 0) - (hooks.now - m.startedAt));
      if (hooks.now - m.startedAt > (m.def.timeLimitMs ?? 0)) {
        return this.fail(m, "Clock ran out — packet run failed");
      }
    }

    switch (m.def.type) {
      case "courier":
        return this.tickCourier(m, hooks);
      case "steal_deliver":
        return this.tickSteal(m, hooks);
      case "escape_heat":
        return this.tickEscape(m, hooks);
      case "multi_stop":
        return this.tickMulti(m, hooks);
      case "destruction":
        return this.tickDestroy(m, hooks);
      default:
        return null;
    }
  }

  cleanup(id: string): void {
    const m = this.byId(id);
    if (!m) return;
    m.status = "cleanup";
    m.objective = null;
    if (this.activeId === id) this.activeId = null;
    // Unlock next locked mission.
    const next = this.missions.find((x) => x.status === "locked");
    if (next) next.status = "available";
    m.status = "success";
  }

  private tickCourier(m: MissionRuntimeState, hooks: MissionWorldHooks) {
    // Damage / arrest drops the hot parcel while carrying.
    if (m.carrying && (hooks.playerDamaged || hooks.arrested)) {
      return this.fail(
        m,
        hooks.arrested ? "Arrested — parcel confiscated" : "Hit hard — parcel dropped",
      );
    }

    const marker = m.def.markers[m.markerIndex];
    if (!marker) return this.succeed(m);

    if (marker.kind === "pickup" || m.markerIndex === 0) {
      if (Math.hypot(hooks.playerX - marker.x, hooks.playerY - marker.y) < COURIER_PICK_RADIUS) {
        m.carrying = true;
        m.markerIndex = 1;
        m.objective = this.objectiveFor(m);
      } else {
        m.objective = "Pick up the hot parcel";
      }
      return null;
    }

    // Drop only if carrying.
    if (!m.carrying) {
      m.objective = "Recover the parcel (re-accept if failed)";
      return null;
    }
    m.objective =
      m.timerMs !== null
        ? `Deliver parcel (${Math.ceil(m.timerMs / 1000)}s)`
        : "Deliver the hot parcel";
    if (Math.hypot(hooks.playerX - marker.x, hooks.playerY - marker.y) < COURIER_DROP_RADIUS) {
      return this.succeed(m, "Parcel delivered — reward paid");
    }
    return null;
  }

  private tickSteal(m: MissionRuntimeState, hooks: MissionWorldHooks) {
    const need = m.def.targetVehicleId;
    if (need && !hooks.targetVehiclePresent) {
      return this.fail(m, "Target cab missing — job soft-locked");
    }

    let stealHeat = false;
    if (!hooks.inVehicle || hooks.vehicleId !== need) {
      m.objective = `Steal the Harbor Cab (${need ?? "taxi"})`;
      return null;
    }

    if (!m.stoleTarget) {
      m.stoleTarget = true;
      stealHeat = true;
    }

    const floor = m.def.vehicleHealthFloor ?? 35;
    if (hooks.vehicleHealth !== null && hooks.vehicleHealth < floor) {
      return this.fail(m, `Cab too wrecked (need ≥${floor} HP)`);
    }

    const drop = m.def.markers[0];
    if (!drop) return this.succeed(m);

    if (hooks.inArrestRange) {
      m.objective = "Shake arrest range, then deliver the cab";
      return stealHeat ? { reward: 0, status: m.status, stealHeat } : null;
    }

    m.objective = `Deliver cab to ${drop.label} (keep HP ≥${floor})`;
    if (Math.hypot(hooks.playerX - drop.x, hooks.playerY - drop.y) < STEAL_DROP_RADIUS) {
      const done = this.succeed(m, "Cab delivered — reward paid");
      return stealHeat ? { ...done, stealHeat } : done;
    }
    return stealHeat ? { reward: 0, status: m.status, stealHeat } : null;
  }

  private tickEscape(m: MissionRuntimeState, hooks: MissionWorldHooks) {
    if (hooks.heat > 0) m.heatRaised = true;
    if (hooks.heat <= 0 && hooks.now - m.startedAt > 1500 && m.heatRaised) {
      return this.succeed(m, "Heat cleared — you cooled off");
    }
    if (!m.heatRaised) {
      m.objective = "Raise heat (attack / steal / crash), then hide";
    } else if (hooks.nearSafehouse || hooks.nearPark) {
      m.objective = "Hiding — heat decays faster here";
    } else if (hooks.onOpenRoadWithCops) {
      m.objective = "Open road + cops — heat sticks; find cover";
    } else {
      m.objective = "Stay unseen until heat clears";
    }
    return null;
  }

  private tickMulti(m: MissionRuntimeState, hooks: MissionWorldHooks) {
    const marker = m.def.markers[m.markerIndex];
    if (!marker) return this.succeed(m);

    const kind = marker.kind ?? "default";
    const dist = Math.hypot(hooks.playerX - marker.x, hooks.playerY - marker.y);

    if (kind === "timed") {
      if (m.stopDeadline !== null && hooks.now > m.stopDeadline) {
        return this.fail(m, `Missed ${marker.label} timer`);
      }
      const left =
        m.stopDeadline !== null ? Math.max(0, Math.ceil((m.stopDeadline - hooks.now) / 1000)) : 0;
      m.objective = `Reach ${marker.label} (${left}s)`;
      if (dist < MULTI_STOP_RADIUS) {
        m.markerIndex += 1;
        m.contestedHoldMs = 0;
        this.armStopDeadline(m, hooks.now);
        if (m.markerIndex >= m.def.markers.length) return this.succeed(m);
        m.objective = this.objectiveFor(m);
      }
      return null;
    }

    if (kind === "vehicle") {
      m.objective = `Drive to ${marker.label} (must be in a vehicle)`;
      if (dist < MULTI_STOP_RADIUS) {
        if (!hooks.inVehicle) {
          m.objective = `Enter a vehicle, then tag ${marker.label}`;
          return null;
        }
        m.markerIndex += 1;
        m.contestedHoldMs = 0;
        this.armStopDeadline(m, hooks.now);
        if (m.markerIndex >= m.def.markers.length) return this.succeed(m);
        m.objective = this.objectiveFor(m);
      }
      return null;
    }

    if (kind === "contested") {
      const need = marker.holdMs ?? 2500;
      const dt = Math.max(0, hooks.dtMs);
      if (dist < MULTI_STOP_RADIUS) {
        m.contestedHoldMs += dt;
        m.objective = `Hold ${marker.label} (${Math.min(100, Math.round((m.contestedHoldMs / need) * 100))}%)`;
        if (m.contestedHoldMs >= need) {
          return this.succeed(m, "Harbor hops complete — reward paid");
        }
      } else {
        // Contested: leaving zone bleeds progress.
        m.contestedHoldMs = Math.max(0, m.contestedHoldMs - dt * 1.5);
        m.objective = `Enter ${marker.label} and hold under pressure`;
      }
      return null;
    }

    // Fallback circle.
    if (dist < MULTI_STOP_RADIUS) {
      m.markerIndex += 1;
      if (m.markerIndex >= m.def.markers.length) return this.succeed(m);
      m.objective = this.objectiveFor(m);
    } else {
      m.objective = this.objectiveFor(m);
    }
    return null;
  }

  private tickDestroy(m: MissionRuntimeState, hooks: MissionWorldHooks) {
    let smashHeat = false;
    if (hooks.crateDamaged && !m.smashHeatReported) {
      m.smashHeatReported = true;
      smashHeat = true;
    }
    if (!hooks.destroyTargetAlive) {
      const msg =
        hooks.now - m.startedAt < 250
          ? "Target already gone — soft-lock cleared, reward paid"
          : "Crate smashed — heat up, reward paid";
      const done = this.succeed(m, msg);
      return smashHeat ? { ...done, smashHeat } : done;
    }
    m.objective = "Ram or shoot the marked crate (smash raises heat)";
    return smashHeat ? { reward: 0, status: m.status, smashHeat } : null;
  }

  private succeed(m: MissionRuntimeState, objective = "Complete — reward paid") {
    const reward = m.def.rewardCash;
    this.activeId = null;
    this.cleanup(m.def.id);
    // Keep result text after cleanup so soft-lock auto-complete is visible.
    m.objective = objective;
    return { reward, status: "success" as const };
  }

  private fail(m: MissionRuntimeState, reason: string) {
    m.status = "failed";
    m.carrying = false;
    m.objective = `Failed: ${reason} (retry near marker)`;
    this.activeId = null;
    return { reward: 0, status: "failed" as const };
  }

  private objectiveFor(m: MissionRuntimeState): string {
    const marker = m.def.markers[m.markerIndex];
    if (!marker) return m.def.title;
    switch (marker.kind) {
      case "pickup":
        return "Pick up the hot parcel";
      case "drop":
        return m.def.type === "courier" ? "Deliver the hot parcel" : `Deliver to ${marker.label}`;
      case "timed":
        return `Race to ${marker.label}`;
      case "vehicle":
        return `Drive to ${marker.label}`;
      case "contested":
        return `Hold ${marker.label}`;
      default:
        return `Go to ${marker.label}`;
    }
  }

  private armStopDeadline(m: MissionRuntimeState, now: number): void {
    const marker = m.def.markers[m.markerIndex];
    if (marker?.kind === "timed" && marker.timeLimitMs) {
      m.stopDeadline = now + marker.timeLimitMs;
    } else {
      m.stopDeadline = null;
    }
  }

  private resetRuntime(m: MissionRuntimeState, now: number): void {
    m.markerIndex = 0;
    m.startedAt = now;
    m.timerMs = m.def.timeLimitMs ?? null;
    m.carrying = false;
    m.heatRaised = false;
    m.stoleTarget = false;
    m.stopDeadline = null;
    m.contestedHoldMs = 0;
    m.smashHeatReported = false;
  }

  private freshState(def: MissionDef, status: MissionStatus): MissionRuntimeState {
    return {
      def,
      status,
      objective: null,
      markerIndex: 0,
      startedAt: 0,
      timerMs: null,
      carrying: false,
      heatRaised: false,
      stoleTarget: false,
      stopDeadline: null,
      contestedHoldMs: 0,
      smashHeatReported: false,
    };
  }

  private byId(id: string): MissionRuntimeState | null {
    return this.missions.find((m) => m.def.id === id) ?? null;
  }
}

export type { MissionDef };
