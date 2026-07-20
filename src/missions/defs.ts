import type { MissionDef } from "./types";

/** Five missions — exactly one of each required type. */
export function buildMissionDefs(spawnX: number, spawnY: number): MissionDef[] {
  return [
    {
      id: "intro-courier",
      type: "courier",
      title: "Pier Packet",
      briefing:
        "Hot parcel run: pick up the packet, keep it through hits/arrests, and drop before the clock.",
      rewardCash: 120,
      timeLimitMs: 90_000,
      acceptX: spawnX,
      acceptY: spawnY,
      markers: [
        { x: spawnX + 20, y: spawnY - 80, label: "Packet", kind: "pickup" },
        { x: spawnX + 220, y: spawnY + 40, label: "Drop", kind: "drop" },
      ],
    },
    {
      id: "cab-boost",
      type: "steal_deliver",
      title: "Yellow Line",
      briefing:
        "Boost the Harbor Cab (spikes heat), keep it above wreck floor, drop only when not in arrest range.",
      rewardCash: 180,
      targetVehicleId: "veh-taxi",
      vehicleHealthFloor: 35,
      acceptX: spawnX + 72,
      acceptY: spawnY - 48,
      markers: [{ x: spawnX - 40, y: spawnY + 260, label: "Cab Drop", kind: "drop" }],
    },
    {
      id: "cool-off",
      type: "escape_heat",
      title: "Cool Off",
      briefing:
        "Cause trouble, then hide — heat cools faster near safehouse/park, slower on open road with cops near.",
      rewardCash: 150,
      acceptX: spawnX - 72,
      acceptY: spawnY - 48,
      markers: [{ x: spawnX, y: spawnY, label: "Stay free", kind: "default" }],
    },
    {
      id: "harbor-hops",
      type: "multi_stop",
      title: "Harbor Hops",
      briefing: "Three mixed stops: timed pickup, vehicle stop, then contested hold.",
      rewardCash: 200,
      acceptX: spawnX + 72,
      acceptY: spawnY + 56,
      markers: [
        {
          x: spawnX + 160,
          y: spawnY - 20,
          label: "Timed Pick",
          kind: "timed",
          timeLimitMs: 45_000,
        },
        {
          x: spawnX + 40,
          y: spawnY + 180,
          label: "Drive-by",
          kind: "vehicle",
        },
        {
          x: spawnX - 120,
          y: spawnY + 40,
          label: "Hold Zone",
          kind: "contested",
          holdMs: 2500,
        },
      ],
    },
    {
      id: "crate-crack",
      type: "destruction",
      title: "Crate Crack",
      briefing: "Ram or shoot the marked crate — smashing it raises heat. Soft-lock if already gone.",
      rewardCash: 160,
      destroyTargetId: "mission-crate",
      acceptX: spawnX - 72,
      acceptY: spawnY + 56,
      markers: [{ x: spawnX + 180, y: spawnY + 120, label: "Crate", kind: "default" }],
    },
  ];
}
