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
  markers: Array<{ x: number; y: number; label: string }>;
  timeLimitMs?: number;
  targetVehicleId?: string;
  destroyTargetId?: string;
}

export interface MissionRuntimeState {
  def: MissionDef;
  status: MissionStatus;
  objective: string | null;
  markerIndex: number;
  startedAt: number;
  timerMs: number | null;
}
