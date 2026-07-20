export type MissionType =
  | "courier"
  | "steal_deliver"
  | "escape_heat"
  | "multi_stop"
  | "destruction";

export type MissionStatus =
  | "locked"
  | "available"
  | "briefing"
  | "active"
  | "success"
  | "failed"
  | "cleanup";

/** Distinct stop flavors for Harbor Hops (not three identical circles). */
export type MissionMarkerKind = "pickup" | "drop" | "default" | "timed" | "vehicle" | "contested";

export interface MissionMarker {
  x: number;
  y: number;
  label: string;
  kind?: MissionMarkerKind;
  /** For timed stops: ms from stop activation to fail. */
  timeLimitMs?: number;
  /** For contested: ms standing in zone required. */
  holdMs?: number;
}

export interface MissionDef {
  id: string;
  type: MissionType;
  title: string;
  briefing: string;
  rewardCash: number;
  /** World accept point (plaza board) — player presses E nearby. */
  acceptX: number;
  acceptY: number;
  /** Objective markers in world pixels. */
  markers: MissionMarker[];
  timeLimitMs?: number;
  targetVehicleId?: string;
  destroyTargetId?: string;
  /** Steal-deliver: cab must stay above this HP to drop. */
  vehicleHealthFloor?: number;
}

export interface MissionRuntimeState {
  def: MissionDef;
  status: MissionStatus;
  objective: string | null;
  markerIndex: number;
  startedAt: number;
  timerMs: number | null;
  /** Courier: holding the hot parcel. */
  carrying: boolean;
  /** Escape: heat was raised at least once. */
  heatRaised: boolean;
  /** Steal: entered the target vehicle once (heat spike applied). */
  stoleTarget: boolean;
  /** Multi-stop: deadline for current timed/contested stop (epoch ms). */
  stopDeadline: number | null;
  /** Multi-stop contested: accumulated hold in zone. */
  contestedHoldMs: number;
  /** Destruction: heat already reported for smash. */
  smashHeatReported: boolean;
}
