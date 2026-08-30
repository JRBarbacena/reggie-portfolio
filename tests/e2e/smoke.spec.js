import { expect, PRODUCT_ROUTES, test } from "../fixtures/engine-test.js";

for (const route of PRODUCT_ROUTES) {
  test(`${route.path} loads as a distinct clean route`, async ({ engineEvidence, page }) => {
    const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });

    expect(response?.status()).toBe(200);
    expect(new URL(page.url()).pathname).toBe(route.path);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText(route.h1);
    await expect(page.locator("main")).toBeVisible();

    await engineEvidence.recordRoute({
      path: route.path,
      h1: await page.locator("h1").innerText(),
      status: response.status(),
    });
  });
}