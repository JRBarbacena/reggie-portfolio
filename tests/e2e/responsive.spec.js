import { expect, test } from "@playwright/test";

const routes = ["/", "/tech", "/travel", "/life", "/admin", "/missing-page"];

for (const route of routes) {
  test(`${route} renders without horizontal overflow`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route, { waitUntil: "domcontentloaded" });

    await expect(page.locator("main#main:not(.route-loading)")).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  });
}

test("social dock stays anchored to the viewport", async ({ page }) => {
  await page.goto("/tech", { waitUntil: "domcontentloaded" });

  const dock = page.getByRole("navigation", { name: "Social links" });
  await expect(dock).toBeVisible();
  await expect.poll(() => dock.evaluate((element) => element.getBoundingClientRect().right))
    .toBeLessThanOrEqual(page.viewportSize().width);

  const bounds = await dock.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { top: rect.top, right: rect.right, bottom: rect.bottom, viewportWidth: innerWidth, viewportHeight: innerHeight };
  });

  expect(bounds.top).toBeGreaterThanOrEqual(0);
  expect(bounds.right).toBeLessThanOrEqual(bounds.viewportWidth);
  expect(bounds.viewportHeight - bounds.bottom).toBeGreaterThanOrEqual(0);
  expect(bounds.viewportHeight - bounds.bottom).toBeLessThan(64);
});

test("touch viewports skip the cinematic entry and expose home content immediately", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "desktop", "The cinematic entry remains a desktop experience.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.locator(".home-entry-preloader")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Welcome to my little space on the internet" })).toBeVisible();
});
