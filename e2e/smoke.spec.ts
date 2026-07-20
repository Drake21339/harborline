import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
});

test("boots, starts, and moves the player", async ({ page }) => {
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

  // Focus the game canvas so Phaser receives keyboard events.
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

  const after = await page.evaluate(() => {
    const d = window.__GAME_DEBUG__;
    if (!d) throw new Error("missing __GAME_DEBUG__");
    return { x: d.player.x, y: d.player.y, scene: d.scene };
  });

  expect(after.scene).toBe("GameScene");
  expect(after.x).toBeGreaterThan(before.x);

  await page.screenshot({ path: "test-results/harborline-scaffold-smoke.png", fullPage: true });
  expect(pageErrors, `page errors: ${pageErrors.join(" | ")}`).toEqual([]);
  expect(consoleErrors, `console errors: ${consoleErrors.join(" | ")}`).toEqual([]);
});
