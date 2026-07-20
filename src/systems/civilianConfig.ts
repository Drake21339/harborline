export const CIVILIAN_CAPS = {
  pedestrians: 64,
  traffic: 40,
} as const;

export const CIVILIAN = {
  pedSpeed: 55,
  pedFleeSpeed: 130,
  trafficSpeed: 110,
  trafficFleeSpeed: 180,
  spawnRadius: 900,
  cullRadius: 1200,
  reactRadius: 220,
  fleeDurationMs: 4200,
} as const;
