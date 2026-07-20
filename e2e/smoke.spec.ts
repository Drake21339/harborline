import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
});

test("boots, starts, moves, mission, and enter/drive/exit vehicle", async ({ page }) => {
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

  await page.locator("canvas").click({ position: { x: 10, y: 10 } });
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => window.__GAME_DEBUG__?.scene === "GameScene", null, {
    timeout: 10_000,
  });

  await page.locator("canvas").click({ position: { x: 40, y: 40 } });

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

  // Walk toward parked compact and enter/drive/exit.
  await page.keyboard.down("d");
  await page.waitForTimeout(450);
  await page.keyboard.up("d");
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

  const after = await page.evaluate(() => {
    const d = window.__GAME_DEBUG__;
    if (!d) throw new Error("missing __GAME_DEBUG__");
    return {
      x: d.player.x,
      scene: d.scene,
      inVehicle: d.inVehicle,
      missionId: d.mission.id,
    };
  });

  expect(after.scene).toBe("GameScene");
  expect(after.inVehicle).toBe(false);
  expect(after.missionId).toBe("intro-courier");

  // Pause / resume + audio unlock via gesture already done on canvas click/Enter.
  await page.keyboard.press("p");
  await page.waitForTimeout(100);
  await page.keyboard.press("p");

  await page.screenshot({ path: "test-results/harborline-vehicle-smoke.png", fullPage: true });
  expect(pageErrors, `page errors: ${pageErrors.join(" | ")}`).toEqual([]);
  expect(consoleErrors, `console errors: ${consoleErrors.join(" | ")}`).toEqual([]);
});
