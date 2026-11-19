import { expect, test } from "@playwright/test";

for (const [path, name] of [["/travel", "Travel"], ["/life", "Life"]]) {
  test(`${name} shows a temporary construction screen`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: `${name} is under construction.` })).toBeVisible();
    await expect(page.getByRole("link", { name: "Explore Tech" })).toHaveAttribute("href", "/tech");
    await expect(page.getByRole("link", { name: /Back to Home/ })).toHaveAttribute("href", "/");
    await expect(page.locator(".under-construction__panel")).toBeVisible();
    await expect(page.locator(".travel-collections, .life-rhythm")).toHaveCount(0);
  });
}

test("navigation changes routes without a page transition", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The navigation check runs once in the desktop project.");
  await page.goto("/tech");
  await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Travel" }).click();
  await expect(page).toHaveURL(/\/travel$/);
  await expect(page.getByRole("heading", { level: 1, name: "Travel is under construction." })).toBeVisible();
  await expect(page.locator(".page-transition-layer")).toHaveCount(0);
  await expect(page.locator("html.is-page-leaving")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await expect(page.locator(".page-transition-source-hidden")).toHaveCount(0);
});

test("reduced motion uses the destination immediately", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The reduced-motion route check runs once.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/tech");
  await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Life" }).click();
  await expect(page).toHaveURL(/\/life$/);
  await expect(page.getByRole("heading", { level: 1, name: "Life is under construction." })).toBeVisible();
  await expect(page.locator(".page-transition-layer")).toHaveCount(0);
});
