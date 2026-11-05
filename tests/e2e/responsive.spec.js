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

test("album viewer separates the title and description responsively", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/tech", { waitUntil: "domcontentloaded" });

  const albumButton = page.getByRole("button", { name: /DevDays at Microsoft/ });
  await albumButton.scrollIntoViewIfNeeded();
  await albumButton.click();

  const dialog = page.getByRole("dialog", { name: "DevDays at Microsoft" });
  const description = dialog.locator(".album-masonry-modal__description");
  await expect(dialog).toBeVisible();
  await expect(description).toContainText("developer conversations");

  const bounds = await dialog.locator(".album-masonry-modal__details").evaluate((details) => {
    const title = details.querySelector(".album-masonry-modal__title-block").getBoundingClientRect();
    const copy = details.querySelector(".album-masonry-modal__description").getBoundingClientRect();
    return {
      title: { top: title.top, right: title.right, bottom: title.bottom },
      copy: { top: copy.top, left: copy.left },
      viewportWidth: innerWidth,
    };
  });

  if (bounds.viewportWidth <= 700) {
    expect(bounds.copy.top).toBeGreaterThan(bounds.title.bottom);
  } else {
    // Both columns share a grid row; this tolerance only allows subpixel layout rounding.
    expect(Math.abs(bounds.copy.top - bounds.title.top)).toBeLessThan(2);
    expect(bounds.copy.left).toBeGreaterThan(bounds.title.right);
  }

  await dialog.getByRole("button", { name: "Close photo album" }).click();
  await expect(albumButton).toBeFocused();
});
