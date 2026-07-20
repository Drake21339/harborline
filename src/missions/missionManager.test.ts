import { describe, expect, it } from "vitest";
import { MissionManager } from "./missionManager";

describe("MissionManager", () => {
  it("accepts intro and completes courier checkpoints", () => {
    const mgr = new MissionManager(100, 100);
    expect(mgr.intro.status).toBe("available");
    expect(mgr.accept("intro-courier", 1000)).toBe(true);
    expect(mgr.active?.status).toBe("active");
    expect(mgr.active?.objective).toContain("Packet");

    const packet = mgr.intro.def.markers[0]!;
    mgr.tick({
      playerX: packet.x,
      playerY: packet.y,
      inVehicle: false,
      vehicleId: null,
      heat: 0,
      now: 2000,
      destroyTargetAlive: true,
    });
    expect(mgr.active?.objective).toContain("Drop");

    const drop = mgr.intro.def.markers[1]!;
    const done = mgr.tick({
      playerX: drop.x,
      playerY: drop.y,
      inVehicle: false,
      vehicleId: null,
      heat: 0,
      now: 3000,
      destroyTargetAlive: true,
    });
    expect(done?.status).toBe("success");
    expect(done?.reward).toBe(120);
    expect(mgr.missions[1]?.status).toBe("available");
  });

  it("fails courier on timeout and allows retry", () => {
    const mgr = new MissionManager(0, 0);
    mgr.accept("intro-courier", 0);
    const failed = mgr.tick({
      playerX: 0,
      playerY: 0,
      inVehicle: false,
      vehicleId: null,
      heat: 0,
      now: 100_000,
      destroyTargetAlive: true,
    });
    expect(failed?.status).toBe("failed");
    mgr.retry("intro-courier");
    expect(mgr.intro.status).toBe("available");
  });

  it("escape-heat succeeds after heat clears post-raise", () => {
    const mgr = new MissionManager(0, 0);
    // Unlock escape mission directly for unit test.
    const esc = mgr.missions.find((m) => m.def.type === "escape_heat")!;
    esc.status = "available";
    mgr.accept(esc.def.id, 1000);
    mgr.tick({
      playerX: 0,
      playerY: 0,
      inVehicle: false,
      vehicleId: null,
      heat: 2,
      now: 2000,
      destroyTargetAlive: true,
    });
    const done = mgr.tick({
      playerX: 0,
      playerY: 0,
      inVehicle: false,
      vehicleId: null,
      heat: 0,
      now: 4000,
      destroyTargetAlive: true,
    });
    expect(done?.status).toBe("success");
  });

  it("destruction completes when target is gone (no soft-lock)", () => {
    const mgr = new MissionManager(0, 0);
    const dest = mgr.missions.find((m) => m.def.type === "destruction")!;
    dest.status = "available";
    mgr.accept(dest.def.id, 0);
    const done = mgr.tick({
      playerX: 0,
      playerY: 0,
      inVehicle: false,
      vehicleId: null,
      heat: 0,
      now: 100,
      destroyTargetAlive: false,
    });
    expect(done?.status).toBe("success");
  });
});
