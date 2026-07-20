import type { MissionDef } from "./types";

/** Five missions — exactly one of each required type. */
export function buildMissionDefs(spawnX: number, spawnY: number): MissionDef[] {
  return [
    {
      id: "intro-courier",
      type: "courier",
      title: "Pier Packet",
      briefing: "Grab the packet near the plaza and hit the timed drop before the clock runs.",
      rewardCash: 120,
      timeLimitMs: 90_000,
      markers: [
        { x: spawnX + 20, y: spawnY - 80, label: "Packet" },
        { x: spawnX + 220, y: spawnY + 40, label: "Drop" },
      ],
    },
    {
      id: "cab-boost",
      type: "steal_deliver",
      title: "Yellow Line",
      briefing: "Boost the Harbor Cab and deliver it to the Freight Cut drop.",
      rewardCash: 180,
      targetVehicleId: "veh-taxi",
      markers: [{ x: spawnX - 40, y: spawnY + 260, label: "Cab Drop" }],
    },
    {
      id: "cool-off",
      type: "escape_heat",
      title: "Cool Off",
      briefing: "Kick up heat, then stay unseen until the heat meter clears.",
      rewardCash: 150,
      markers: [{ x: spawnX, y: spawnY, label: "Stay free" }],
    },
    {
      id: "harbor-hops",
      type: "multi_stop",
      title: "Harbor Hops",
      briefing: "Hit three package stops in order around Midstack.",
      rewardCash: 200,
      markers: [
        { x: spawnX + 160, y: spawnY - 20, label: "Stop 1" },
        { x: spawnX + 40, y: spawnY + 180, label: "Stop 2" },
        { x: spawnX - 120, y: spawnY + 40, label: "Stop 3" },
      ],
    },
    {
      id: "crate-crack",
      type: "destruction",
      title: "Crate Crack",
      briefing: "Smash the marked crate target near the plaza.",
      rewardCash: 160,
      destroyTargetId: "mission-crate",
      markers: [{ x: spawnX + 180, y: spawnY + 120, label: "Crate" }],
    },
  ];
}
