import { describe, expect, it } from "vitest";
import { MissionManager } from "./missionManager";

function hooks(
  partial: Partial<{
    playerX: number;
    playerY: number;
    inVehicle: boolean;
    vehicleId: string | null;
    heat: number;
    now: number;
    destroyTargetAlive: boolean;
    targetVehiclePresent: boolean;
  }> = {},
) {
  return {
    playerX: 0,
    playerY: 0,
    inVehicle: false,
    vehicleId: null,
    heat: 0,
    now: 1000,
    destroyTargetAlive: true,
    targetVehiclePresent: true,
    ...partial,
  };
}

function unlock(mgr: MissionManager, id: string): void {
  const m = mgr.missions.find((x) => x.def.id === id)!;
  m.status = "available";
}

describe("MissionManager", () => {
  it("accepts intro and completes courier checkpoints", () => {
    const mgr = new MissionManager(100, 100);
    expect(mgr.intro.status).toBe("available");
    expect(mgr.accept("intro-courier", 1000)).toBe(true);
    expect(mgr.active?.status).toBe("active");
    expect(mgr.active?.objective).toContain("Packet");

    const packet = mgr.intro.def.markers[0]!;
    mgr.tick(
      hooks({
        playerX: packet.x,
        playerY: packet.y,
        now: 2000,
      }),
    );
    expect(mgr.active?.objective).toContain("Drop");

    const drop = mgr.intro.def.markers[1]!;
    const done = mgr.tick(
      hooks({
        playerX: drop.x,
        playerY: drop.y,
        now: 3000,
      }),
    );
    expect(done?.status).toBe("success");
    expect(done?.reward).toBe(120);
    expect(mgr.missions[1]?.status).toBe("available");
  });

  it("shows accept points for available missions and accepts nearest via tryAcceptNearby", () => {
    const mgr = new MissionManager(0, 0);
    expect(mgr.listAcceptable()).toHaveLength(1);
    expect(mgr.nearestAcceptable(0, 0)?.def.id).toBe("intro-courier");
    expect(mgr.tryAcceptNearby(0, 0, 500)).toBe(true);
    expect(mgr.active?.def.id).toBe("intro-courier");

    // Finish intro to unlock next.
    const packet = mgr.intro.def.markers[0]!;
    const drop = mgr.intro.def.markers[1]!;
    mgr.tick(hooks({ playerX: packet.x, playerY: packet.y, now: 600 }));
    mgr.tick(hooks({ playerX: drop.x, playerY: drop.y, now: 700 }));
    expect(mgr.missions[1]?.status).toBe("available");

    const cab = mgr.missions[1]!;
    expect(mgr.nearestAcceptable(cab.def.acceptX, cab.def.acceptY)?.def.id).toBe("cab-boost");
    expect(mgr.tryAcceptNearby(cab.def.acceptX, cab.def.acceptY, 800)).toBe(true);
    expect(mgr.active?.def.id).toBe("cab-boost");
  });

  it("fails courier on timeout and allows retry", () => {
    const mgr = new MissionManager(0, 0);
    mgr.accept("intro-courier", 0);
    const failed = mgr.tick(hooks({ now: 100_000 }));
    expect(failed?.status).toBe("failed");
    mgr.retry("intro-courier");
    expect(mgr.intro.status).toBe("available");
  });

  it("steal-deliver succeeds after taking target vehicle to drop", () => {
    const mgr = new MissionManager(0, 0);
    unlock(mgr, "cab-boost");
    expect(mgr.accept("cab-boost", 1000)).toBe(true);
    mgr.tick(
      hooks({
        inVehicle: false,
        vehicleId: null,
        now: 1100,
      }),
    );
    expect(mgr.active?.objective).toContain("Steal");

    const drop = mgr.missions.find((m) => m.def.id === "cab-boost")!.def.markers[0]!;
    const done = mgr.tick(
      hooks({
        inVehicle: true,
        vehicleId: "veh-taxi",
        playerX: drop.x,
        playerY: drop.y,
        now: 2000,
      }),
    );
    expect(done?.status).toBe("success");
    expect(done?.reward).toBe(180);
  });

  it("steal-deliver fails when target vehicle is missing (no soft-lock)", () => {
    const mgr = new MissionManager(0, 0);
    unlock(mgr, "cab-boost");
    mgr.accept("cab-boost", 0);
    const failed = mgr.tick(
      hooks({
        targetVehiclePresent: false,
        now: 100,
      }),
    );
    expect(failed?.status).toBe("failed");
    expect(failed?.reward).toBe(0);
    expect(mgr.missions.find((m) => m.def.id === "cab-boost")?.objective).toMatch(/missing/i);
  });

  it("escape-heat succeeds only after heat was raised then cleared", () => {
    const mgr = new MissionManager(0, 0);
    unlock(mgr, "cool-off");
    mgr.accept("cool-off", 1000);
    mgr.tick(hooks({ heat: 2, now: 2000 }));
    const done = mgr.tick(hooks({ heat: 0, now: 4000 }));
    expect(done?.status).toBe("success");
  });

  it("escape-heat does not instantly win when heat never rises", () => {
    const mgr = new MissionManager(0, 0);
    unlock(mgr, "cool-off");
    mgr.accept("cool-off", 1000);
    const stuck = mgr.tick(hooks({ heat: 0, now: 5000 }));
    expect(stuck).toBeNull();
    expect(mgr.active?.def.id).toBe("cool-off");
    expect(mgr.active?.objective).toMatch(/Raise heat/i);
  });

  it("multi-stop completes all ordered markers", () => {
    const mgr = new MissionManager(0, 0);
    unlock(mgr, "harbor-hops");
    mgr.accept("harbor-hops", 0);
    const hops = mgr.missions.find((m) => m.def.id === "harbor-hops")!;
    for (let i = 0; i < hops.def.markers.length; i += 1) {
      const marker = hops.def.markers[i]!;
      const result = mgr.tick(
        hooks({
          playerX: marker.x,
          playerY: marker.y,
          now: (i + 1) * 1000,
        }),
      );
      if (i < hops.def.markers.length - 1) {
        expect(result).toBeNull();
        expect(mgr.active?.markerIndex).toBe(i + 1);
      } else {
        expect(result?.status).toBe("success");
        expect(result?.reward).toBe(200);
      }
    }
  });

  it("destruction completes when target is gone with auto-complete message (no soft-lock)", () => {
    const mgr = new MissionManager(0, 0);
    unlock(mgr, "crate-crack");
    mgr.accept("crate-crack", 0);
    const done = mgr.tick(
      hooks({
        destroyTargetAlive: false,
        now: 100,
      }),
    );
    expect(done?.status).toBe("success");
    const dest = mgr.missions.find((m) => m.def.id === "crate-crack")!;
    expect(dest.objective).toMatch(/already destroyed|auto-complete/i);
  });

  it("destruction succeeds after target destroyed mid-mission", () => {
    const mgr = new MissionManager(0, 0);
    unlock(mgr, "crate-crack");
    mgr.accept("crate-crack", 0);
    expect(mgr.tick(hooks({ destroyTargetAlive: true, now: 100 }))).toBeNull();
    const done = mgr.tick(hooks({ destroyTargetAlive: false, now: 500 }));
    expect(done?.status).toBe("success");
  });
});
