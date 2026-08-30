import { expect, test } from "@playwright/test";

async function expectUsableHome(page) {
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator("main")).not.toHaveAttribute("inert", "");
}

async function enterPortfolio(page) {
  const gate = page.getByRole("dialog", { name: "Welcome" });
  await expect(gate).toBeVisible();
  await expect(gate.locator("h1, h2, h3, h4, h5, h6")).toHaveCount(0);
  await expect(gate.locator(".site-preloader__copy")).toHaveCount(0);
  await expect(page.locator("#root")).toHaveAttribute("inert", "");
  const enter = gate.getByRole("button", { name: "Enter portfolio" });
  await expect(enter).toBeFocused();
  await enter.click();
  await expect(gate).toHaveCount(0, { timeout: 1000 });
  await expectUsableHome(page);
  await expect(page.locator("main")).toBeFocused();
  await expect(page.locator(".skip-link")).not.toBeFocused();
}

test("first direct Home entry shows the accessible portfolio gate", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await enterPortfolio(page);
});

test("a real Home reload shows the gate again", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await enterPortfolio(page);
  await page.reload({ waitUntil: "domcontentloaded" });
  await enterPortfolio(page);
});

test("same-origin navigation to Home does not interrupt the journey", async ({ page }) => {
  await page.goto("/tech", { waitUntil: "domcontentloaded" });
  await page.locator(".site-nav__brand").click();
  await page.waitForURL(/\/$/);
  await expect(page.locator(".site-preloader")).toHaveCount(0);
  await expectUsableHome(page);
});

test("reduced motion skips the optional entry gate", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".site-preloader")).toHaveCount(0);
  await expectUsableHome(page);
});

test("save-data skips the optional entry gate", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: { saveData: true },
    });
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".site-preloader")).toHaveCount(0);
  await expectUsableHome(page);
});

test("a failed preloader logo does not block the Enter action", async ({ page }) => {
  await page.route("**/images/brand/pwa-192.png", (route) => route.abort());
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await enterPortfolio(page);
});

test("blocked storage fails open to usable Home content", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error("storage blocked"); };
    Storage.prototype.setItem = () => { throw new Error("storage blocked"); };
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".site-preloader")).toHaveCount(0);
  await expectUsableHome(page);
});
