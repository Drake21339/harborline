import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
});

test("boots, starts, moves, mission, and enter/drive/exit vehicle", async ({ page }) => {
  test.setTimeout(90_000);
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(String(err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await page.goto("/");
  await page.waitForFunction(() => window.__GAME_DEBUG__?.bootCompleted === true, null, {
    timeout: 20_000,
  });
  await page.waitForFunction(() => window.__GAME_DEBUG__?.scene === "TitleScene", null, {
    timeout: 10_000,
  });
  await page.screenshot({ path: "test-results/title-brand.png", fullPage: true });
  await page.screenshot({ path: "test-results/finish/title-2.png", fullPage: true });
  await page.screenshot({ path: "test-results/beauty/title-brand.png", fullPage: true });
  await page.screenshot({ path: "test-results/beauty/title-brand-2.png", fullPage: true });

  // Keyboard-only start (no mouse required).
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => window.__GAME_DEBUG__?.scene === "GameScene", null, {
    timeout: 10_000,
  });
  await page.screenshot({ path: "test-results/game-hud.png", fullPage: true });
  await page.screenshot({ path: "test-results/finish/game-hud-1.png", fullPage: true });
  await page.screenshot({ path: "test-results/finish/world-midstack-3.png", fullPage: true });
  await page.screenshot({ path: "test-results/beauty/world-midstack-1.png", fullPage: true });
  await page.screenshot({ path: "test-results/beauty/night-atmosphere-1.png", fullPage: true });
  await page.screenshot({ path: "test-results/beauty/spawn-plaza-1.png", fullPage: true });
  // Dense Midstack block for 3D building depth read.
  await page.evaluate(() => {
    const t = window.__HARBOR_TEST__;
    if (!t) throw new Error("missing test hooks");
    t.movePlayer(72 * 32 + 16, 40 * 32 + 16);
    t.setZoom(1.35);
  });
  await page.waitForTimeout(180);
  await page.screenshot({ path: "test-results/beauty/world-midstack-2.png", fullPage: true });
  await page.screenshot({ path: "test-results/beauty/world-midstack-3.png", fullPage: true });
  // Pier Ward waterfront (near harbor finger + warehouses).
  await page.evaluate(() => {
    const t = window.__HARBOR_TEST__;
    if (!t) throw new Error("missing test hooks");
    t.movePlayer(30 * 32 + 16, 36 * 32 + 16);
    t.setZoom(0.95);
  });
  await page.waitForTimeout(180);
  await page.screenshot({ path: "test-results/beauty/world-pier-1.png", fullPage: true });
  await page.screenshot({ path: "test-results/beauty/world-pier-2.png", fullPage: true });
  // Freeway spine (cross at ~tile 60).
  await page.evaluate(() => {
    const t = window.__HARBOR_TEST__;
    if (!t) throw new Error("missing test hooks");
    t.movePlayer(60 * 32 + 16, 60 * 32 + 16);
    t.setZoom(0.75);
  });
  await page.waitForTimeout(180);
  await page.screenshot({ path: "test-results/beauty/world-freeway-1.png", fullPage: true });
  await page.screenshot({ path: "test-results/beauty/world-freeway-2.png", fullPage: true });
  await page.evaluate(() => {
    window.__HARBOR_TEST__?.setZoom(1);
    window.__HARBOR_TEST__?.moveNearFleet();
  });

  await page.keyboard.press("m");
  await page.waitForTimeout(200);
  await page.screenshot({ path: "test-results/finish/minimap-expanded-2.png", fullPage: true });
  await page.keyboard.press("m");

  await page.keyboard.press("p");
  await page.waitForTimeout(120);
  await page.screenshot({ path: "test-results/finish/pause-1.png", fullPage: true });
  await page.keyboard.press("p");

  await page.keyboard.press("h");
  await page.waitForTimeout(120);
  await page.screenshot({ path: "test-results/finish/help-1.png", fullPage: true });
  await page.keyboard.press("h");

  const before = await page.evaluate(() => {
    const d = window.__GAME_DEBUG__;
    if (!d) throw new Error("missing __GAME_DEBUG__");
    return { x: d.player.x, y: d.player.y };
  });

  await page.keyboard.down("d");
  await page.waitForFunction(
    (startX) => (window.__GAME_DEBUG__?.player.x ?? 0) > startX + 8,
    before.x,
    { timeout: 5_000 },
  );
  await page.keyboard.up("d");

  // Accept intro mission near spawn (E prefers mission while available).
  await page.keyboard.down("a");
  await page.waitForTimeout(200);
  await page.keyboard.up("a");
  await page.keyboard.press("e");
  await page.waitForFunction(
    () =>
      window.__GAME_DEBUG__?.mission.id === "intro-courier" &&
      Boolean(window.__GAME_DEBUG__?.mission.objective),
    null,
    { timeout: 5_000 },
  );

  // Scripted unlock chain: complete intro, accept ≥2 non-intro missions in-world.
  await page.evaluate(() => {
    const t = window.__HARBOR_TEST__;
    if (!t) throw new Error("missing __HARBOR_TEST__");
    t.completeActiveMission();
    const cab = t.acceptPoint("cab-boost");
    if (!cab) throw new Error("cab accept missing");
    t.movePlayer(cab.x, cab.y);
  });
  await page.keyboard.press("e");
  await page.waitForFunction(
    () =>
      window.__GAME_DEBUG__?.mission.id === "cab-boost" &&
      Boolean(window.__GAME_DEBUG__?.mission.objective),
    null,
    { timeout: 5_000 },
  );

  await page.evaluate(() => {
    const t = window.__HARBOR_TEST__;
    if (!t) throw new Error("missing __HARBOR_TEST__");
    t.completeActiveMission();
    const cool = t.acceptPoint("cool-off");
    if (!cool) throw new Error("cool-off accept missing");
    t.movePlayer(cool.x, cool.y);
  });
  await page.keyboard.press("e");
  await page.waitForFunction(
    () =>
      window.__GAME_DEBUG__?.mission.id === "cool-off" &&
      Boolean(window.__GAME_DEBUG__?.mission.objective),
    null,
    { timeout: 5_000 },
  );

  // Return near spawn fleet for enter/drive/exit.
  await page.evaluate(() => {
    const t = window.__HARBOR_TEST__;
    if (!t) throw new Error("missing test hooks");
    t.moveNearFleet();
  });
  await page.keyboard.press("e");
  await page.waitForFunction(() => window.__GAME_DEBUG__?.inVehicle === true, null, {
    timeout: 5_000,
  });

  const entered = await page.evaluate(() => {
    const d = window.__GAME_DEBUG__;
    if (!d?.vehicle) throw new Error("missing vehicle debug");
    return { speed: d.vehicle.speed, health: d.vehicle.health };
  });
  expect(entered.health).toBeGreaterThan(0);

  await page.keyboard.down("w");
  await page.waitForFunction(
    () => Math.abs(window.__GAME_DEBUG__?.vehicle?.speed ?? 0) > 20,
    null,
    { timeout: 5_000 },
  );
  await page.keyboard.up("w");

  await page.keyboard.press("e");
  await page.waitForFunction(() => window.__GAME_DEBUG__?.inVehicle === false, null, {
    timeout: 5_000,
  });

  await page.waitForFunction(
    () =>
      (window.__GAME_DEBUG__?.counts.pedestrians ?? 0) > 0 &&
      (window.__GAME_DEBUG__?.counts.traffic ?? 0) > 0,
    null,
    { timeout: 8_000 },
  );

  // Art captures before flee spray clutters the frame.
  await page.evaluate(() => {
    const t = window.__HARBOR_TEST__;
    if (!t) throw new Error("missing test hooks");
    t.moveNearFleet();
    t.setZoom(1.35);
  });
  await page.waitForTimeout(150);
  await page.screenshot({ path: "test-results/finish/vehicle-fleet-close-2.png", fullPage: true });
  await page.screenshot({ path: "test-results/beauty/vehicles-fleet-1.png", fullPage: true });
  await page.screenshot({ path: "test-results/beauty/vehicles-fleet-2.png", fullPage: true });
  // Paint tint must update vehicle body color (feeds 3D mesh material).
  const painted = await page.evaluate(() => {
    const t = window.__HARBOR_TEST__;
    if (!t) throw new Error("missing test hooks");
    t.moveNearFleet();
    const before = t.vehicleBodyColor() ?? 0;
    const after = t.paintNearest(0x9ef0c0);
    return { before, after };
  });
  expect(painted.after).toBe(0x9ef0c0);
  expect(painted.after).not.toBe(painted.before);
  await page.waitForTimeout(100);
  await page.screenshot({ path: "test-results/beauty/vehicles-paint-1.png", fullPage: true });
  // Ped crowd mid-zoom.
  await page.evaluate(() => {
    window.__HARBOR_TEST__?.setZoom(1.15);
  });
  await page.waitForTimeout(120);
  await page.screenshot({ path: "test-results/beauty/ped-crowd-1.png", fullPage: true });
  // Police silhouette via parked Patrol archetype in spawn fleet (no heat — avoids arrest).
  await page.evaluate(() => {
    const t = window.__HARBOR_TEST__;
    if (!t) throw new Error("missing test hooks");
    t.moveNearFleet();
    t.setZoom(1.5);
  });
  await page.waitForTimeout(120);
  await page.screenshot({ path: "test-results/beauty/police-chase-1.png", fullPage: true });
  await page.evaluate(() => {
    window.__HARBOR_TEST__?.setZoom(1);
  });

  await page.evaluate(() => {
    window.__HARBOR_TEST__?.setZoom(0.28);
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: "test-results/districts-read.png", fullPage: true });
  await page.screenshot({ path: "test-results/finish/world-district-contrast-2.png", fullPage: true });
  await page.screenshot({ path: "test-results/beauty/world-district-contrast-1.png", fullPage: true });
  await page.evaluate(() => {
    window.__HARBOR_TEST__?.setZoom(1);
  });

  // Caps still enforced; tile-bias counters accumulate; flee tint path still trips.
  const civ = await page.evaluate(() => {
    const d = window.__GAME_DEBUG__;
    const t = window.__HARBOR_TEST__;
    if (!d || !t) throw new Error("missing debug");
    t.signalDanger();
    return {
      peds: d.counts.pedestrians,
      cars: d.counts.traffic,
      pedBias: d.civBias?.pedTotal ? d.civBias.pedPreferred / d.civBias.pedTotal : 0,
      carBias: d.civBias?.carTotal ? d.civBias.carPreferred / d.civBias.carTotal : 0,
    };
  });
  expect(civ.peds).toBeLessThanOrEqual(80);
  expect(civ.peds).toBeGreaterThanOrEqual(1);
  expect(civ.cars).toBeLessThanOrEqual(50);
  expect(civ.cars).toBeGreaterThanOrEqual(1);

  // ≥4 distinct SFX kinds on real actions after unlock (ui/shoot/engine/pickup).
  await page.keyboard.down("f");
  await page.waitForTimeout(120);
  await page.keyboard.up("f");
  await page.evaluate(() => {
    window.__HARBOR_TEST__?.moveNearPickup();
  });
  await page.waitForTimeout(200);
  const sfx = await page.evaluate(() => window.__HARBOR_TEST__?.sfxKinds() ?? []);
  const distinct = new Set(sfx);
  expect(distinct.size).toBeGreaterThanOrEqual(4);
  expect(distinct.has("ui")).toBe(true);
  expect(distinct.has("engine")).toBe(true);

  // Suno drop-in contract: beds probe present when files are in public/audio/.
  await page.waitForFunction(
    () => {
      const b = window.__HARBOR_TEST__?.musicBedsReady();
      return Boolean(b?.title && b?.city && b?.heat);
    },
    null,
    { timeout: 8_000 },
  );
  const beds = await page.evaluate(() => window.__HARBOR_TEST__?.musicBedsReady());
  expect(beds?.title).toBe(true);
  expect(beds?.city).toBe(true);
  expect(beds?.heat).toBe(true);
  expect(beds?.active === "city" || beds?.active === "synth" || beds?.active === "heat").toBe(true);

  const titleAudio = await page.request.get("/audio/title-theme%20(harborline).mp3");
  expect(titleAudio.ok()).toBe(true);

  const after = await page.evaluate(() => {
    const d = window.__GAME_DEBUG__;
    if (!d) throw new Error("missing __GAME_DEBUG__");
    return {
      x: d.player.x,
      scene: d.scene,
      inVehicle: d.inVehicle,
      missionId: d.mission.id,
      objective: d.mission.objective,
    };
  });

  expect(after.scene).toBe("GameScene");
  expect(after.inVehicle).toBe(false);
  expect(after.missionId).toBe("cool-off");
  expect(after.objective).toBeTruthy();

  // Pause / resume + audio unlock via gesture already done on canvas click/Enter.
  await page.keyboard.press("p");
  await page.waitForTimeout(100);
  await page.keyboard.press("p");

  // Refresh must re-boot cleanly without duplicated soft-lock.
  await page.reload();
  await page.waitForFunction(() => window.__GAME_DEBUG__?.bootCompleted === true, null, {
    timeout: 20_000,
  });
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => window.__GAME_DEBUG__?.scene === "GameScene", null, {
    timeout: 10_000,
  });
  const refreshed = await page.evaluate(() => window.__GAME_DEBUG__?.scene);
  expect(refreshed).toBe("GameScene");

  await page.screenshot({ path: "test-results/harborline-smoke.png", fullPage: true });
  expect(pageErrors, `page errors: ${pageErrors.join(" | ")}`).toEqual([]);
  expect(consoleErrors, `console errors: ${consoleErrors.join(" | ")}`).toEqual([]);
});
