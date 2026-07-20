/** Road hierarchy for Harborline city streets. */
export const RoadClass = {
  None: 0,
  Local: 1,
  Arterial: 2,
  Freeway: 3,
} as const;

export type RoadClassId = (typeof RoadClass)[keyof typeof RoadClass];

export type RoadClassName = "local" | "arterial" | "freeway";

export function roadClassName(id: RoadClassId): RoadClassName | null {
  if (id === RoadClass.Local) return "local";
  if (id === RoadClass.Arterial) return "arterial";
  if (id === RoadClass.Freeway) return "freeway";
  return null;
}

/** Lane count (driveable) by class — excludes sidewalks / median. */
export const ROAD_LANE_COUNT: Record<RoadClassName, number> = {
  local: 2,
  arterial: 4,
  freeway: 6,
};

/** Driveable road width in tiles (not including sidewalks). Freeway includes 1-tile median. */
export const ROAD_WIDTH_TILES: Record<RoadClassName, number> = {
  local: 2,
  arterial: 4,
  freeway: 7, // 3 + median + 3
};
