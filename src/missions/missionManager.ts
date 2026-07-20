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
}

export class MissionManager {
  readonly missions: MissionRuntimeState[];
  activeId: string | null = null;
  private readonly spawnX: number;
  private readonly spawnY: number;

  constructor(spawnX: number, spawnY: number) {
    this.spawnX = spawnX;
    this.spawnY = spawnY;
    const defs = buildMissionDefs(spawnX, spawnY);
    this.missions = defs.map((def, i) => ({
      def,
      status: i === 0 ? "available" : "locked",
      objective: null,
      markerIndex: 0,
      startedAt: 0,
      timerMs: null,
    }));
  }

  get active(): MissionRuntimeState | null {
    if (!this.activeId) return null;
    return this.missions.find((m) => m.def.id === this.activeId) ?? null;
  }

  get intro(): MissionRuntimeState {
    return this.missions[0]!;
  }

  /** Near spawn marker for intro accept. */
  canAcceptIntro(playerX: number, playerY: number): boolean {
    const intro = this.intro;
    if (
      intro.status !== "available" &&
      intro.status !== "briefing" &&
      intro.status !== "failed"
    ) {
      return false;
    }
    return Math.hypot(playerX - this.spawnX, playerY - this.spawnY) < 90;
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
    m.status = "active";
    m.startedAt = now;
    m.markerIndex = 0;
    m.timerMs = m.def.timeLimitMs ?? null;
    m.objective = this.objectiveFor(m);
    this.activeId = id;
    return true;
  }

  retry(id: string): void {
    const m = this.byId(id);
    if (!m) return;
    m.status = "available";
    m.objective = null;
    m.markerIndex = 0;
    m.timerMs = null;
    if (this.activeId === id) this.activeId = null;
  }

  tick(hooks: MissionWorldHooks): { reward: number; status: MissionStatus } | null {
    const m = this.active;
    if (!m || m.status !== "active") return null;

    if (m.timerMs !== null) {
      m.timerMs = Math.max(0, (m.def.timeLimitMs ?? 0) - (hooks.now - m.startedAt));
      if (hooks.now - m.startedAt > (m.def.timeLimitMs ?? 0)) {
        return this.fail(m, "Time expired");
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
    const marker = m.def.markers[m.markerIndex];
    if (!marker) return this.succeed(m);
    if (Math.hypot(hooks.playerX - marker.x, hooks.playerY - marker.y) < 40) {
      m.markerIndex += 1;
      if (m.markerIndex >= m.def.markers.length) return this.succeed(m);
      m.objective = this.objectiveFor(m);
    }
    return null;
  }

  private tickSteal(m: MissionRuntimeState, hooks: MissionWorldHooks) {
    const need = m.def.targetVehicleId;
    if (!hooks.inVehicle || hooks.vehicleId !== need) {
      m.objective = `Steal ${need ?? "target vehicle"}`;
      return null;
    }
    const drop = m.def.markers[0];
    if (!drop) return this.succeed(m);
    m.objective = `Deliver to ${drop.label}`;
    if (Math.hypot(hooks.playerX - drop.x, hooks.playerY - drop.y) < 50) {
      return this.succeed(m);
    }
    return null;
  }

  private tickEscape(m: MissionRuntimeState, hooks: MissionWorldHooks) {
    if (hooks.heat <= 0 && hooks.now - m.startedAt > 1500) {
      // Must have raised heat at least once during mission — tracked via markerIndex flag.
      if (m.markerIndex >= 1) return this.succeed(m);
    }
    if (hooks.heat > 0) m.markerIndex = 1;
    m.objective = hooks.heat > 0 ? "Escape until heat clears" : "Raise heat, then escape";
    return null;
  }

  private tickMulti(m: MissionRuntimeState, hooks: MissionWorldHooks) {
    return this.tickCourier(m, hooks);
  }

  private tickDestroy(m: MissionRuntimeState, hooks: MissionWorldHooks) {
    m.objective = "Destroy the marked crate";
    if (!hooks.destroyTargetAlive) {
      return this.succeed(m);
    }
    // Soft-lock guard: if target already gone at start, succeed.
    return null;
  }

  private succeed(m: MissionRuntimeState) {
    m.status = "success";
    m.objective = "Complete — reward paid";
    this.activeId = null;
    const reward = m.def.rewardCash;
    this.cleanup(m.def.id);
    return { reward, status: "success" as const };
  }

  private fail(m: MissionRuntimeState, reason: string) {
    m.status = "failed";
    m.objective = `Failed: ${reason} (retry near marker)`;
    this.activeId = null;
    return { reward: 0, status: "failed" as const };
  }

  private objectiveFor(m: MissionRuntimeState): string {
    const marker = m.def.markers[m.markerIndex];
    if (marker) return `Go to ${marker.label}`;
    return m.def.title;
  }

  private byId(id: string): MissionRuntimeState | null {
    return this.missions.find((m) => m.def.id === id) ?? null;
  }
}

export type { MissionDef };
