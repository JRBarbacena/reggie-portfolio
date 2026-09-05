import { expect, test } from "@playwright/test";

test("portfolio assistant opens, accepts focus, and restores launcher focus on Escape", async ({ page }) => {
  await page.goto("/tech", { waitUntil: "domcontentloaded" });
  const launcher = page.locator(".chatbot-launcher");

  await expect(launcher).toBeVisible();
  await expect(launcher).toHaveAccessibleName("Open Zenith");
  const launcherBounds = await launcher.boundingBox();
  expect(launcherBounds?.x ?? Number.POSITIVE_INFINITY).toBeLessThan(200);
  await launcher.click();
  const dialog = page.getByRole("dialog", { name: "Ask about Reggie's work" });
  await expect(dialog).toBeVisible();
  await expect(page.locator("html")).toHaveClass(/chatbot-scroll-locked/);
  await expect(dialog.getByText("Zenith", { exact: true }).first()).toBeVisible();
  await expect(page.getByLabel("Ask about the portfolio")).toBeFocused();
  await expect(launcher).toHaveAttribute("data-mascot-state", "listening");
  await expect(dialog.getByText("Listening", { exact: true })).toBeVisible();
  const dialogBounds = await dialog.boundingBox();
  const openLauncherBounds = await launcher.boundingBox();
  expect((openLauncherBounds?.y ?? 0) - ((dialogBounds?.y ?? 0) + (dialogBounds?.height ?? 0))).toBeLessThanOrEqual(12);

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveClass(/chatbot-scroll-locked/);
  await expect(launcher).toBeFocused();
});

test("portfolio assistant offers a human handoff without appearing on admin", async ({ page }) => {
  await page.goto("/travel", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Open Zenith" }).click();
  await page.getByLabel("Ask about the portfolio").fill("Can I talk to Reggie?");
  await page.getByLabel("Ask about the portfolio").press("Enter");
  await expect(page.getByRole("button", { name: "Talk to Reggie" })).toBeVisible();

  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: /portfolio assistant/i })).toHaveCount(0);
});

test("mouse dismissal removes focus and keeps background scrolling paused", async ({ page }) => {
  await page.goto("/tech", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => window.scrollTo(0, 360));
  await page.waitForTimeout(350);
  const launcher = page.getByRole("button", { name: "Open Zenith" });
  await launcher.click();
  await expect(page.getByRole("dialog", { name: "Ask about Reggie's work" })).toBeVisible();

  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.mouse.move(1200, 340);
  await page.mouse.wheel(0, 700);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);

  await page.locator(".chatbot-backdrop").click({ position: { x: 1200, y: 300 } });
  await expect(page.getByRole("dialog", { name: "Ask about Reggie's work" })).toHaveCount(0);
  await expect(launcher).not.toBeFocused();
});

test("Zenith answers locally and exposes the temporary live-chat entry", async ({ page }) => {
  await page.goto("/life", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Open Zenith" }).click();
  await expect(page.getByRole("button", { name: "Hi", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Hello", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Hi", exact: true }).click();
  await expect(page.getByText(/Hello! I’m Zenith/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Hi", exact: true })).toHaveCount(0);
  await page.getByLabel("Ask about the portfolio").fill("I want to talk to Reggie");
  await page.getByLabel("Ask about the portfolio").press("Enter");
  await page.getByRole("button", { name: "Talk to Reggie" }).click();
  await expect(page.getByText("Temporary messages expire one hour after the latest reply.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Start temporary chat" })).toBeVisible();
  await expect(page.getByAltText("John Reggie Barbacena")).toBeVisible();
});

test("Zenith stays compact and fully inside a small viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 667 });
  await page.goto("/travel", { waitUntil: "domcontentloaded" });
  const launcher = page.getByRole("button", { name: "Open Zenith" });
  const launcherBounds = await launcher.boundingBox();
  expect(launcherBounds?.width ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(56);
  expect(await launcher.evaluate((node) => getComputedStyle(node).backgroundColor)).toBe("rgba(0, 0, 0, 0)");
  expect(await launcher.evaluate((node) => getComputedStyle(node).borderTopWidth)).toBe("0px");

  await launcher.click();
  const dialog = page.getByRole("dialog", { name: "Ask about Reggie's work" });
  const bounds = await dialog.boundingBox();
  expect(bounds?.x ?? -1).toBeGreaterThanOrEqual(0);
  expect(bounds?.y ?? -1).toBeGreaterThanOrEqual(0);
  expect((bounds?.x ?? 0) + (bounds?.width ?? Number.POSITIVE_INFINITY)).toBeLessThanOrEqual(390);
  expect((bounds?.y ?? 0) + (bounds?.height ?? Number.POSITIVE_INFINITY)).toBeLessThanOrEqual(667);
});

test("a live reply identifies Reggie with his photo", async ({ page }) => {
  const expiresAt = new Date(Date.now() + 60 * 60_000).toISOString();
  let messages = [];
  await page.route("**/api/live-chat", async (route) => {
    const body = route.request().postDataJSON();
    if (body.action === "presence") return route.fulfill({ json: { presence: "online" } });
    if (body.action === "start") return route.fulfill({ status: 201, json: { sessionId: "00000000-0000-4000-8000-000000000001", token: "a".repeat(43), expiresAt, presence: "online", messages: [] } });
    if (body.action === "send") {
      messages = [
        { id: "visitor-1", sender: "visitor", body: body.message, created_at: new Date().toISOString() },
        { id: "admin-1", sender: "admin", body: "Hi, Reggie here. How can I help?", created_at: new Date().toISOString() },
      ];
    }
    return route.fulfill({ json: { messages, expiresAt, presence: "online" } });
  });

  await page.goto("/tech", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Open Zenith" }).click();
  await page.getByLabel("Ask about the portfolio").fill("Talk to Reggie");
  await page.getByLabel("Ask about the portfolio").press("Enter");
  await page.getByRole("button", { name: "Talk to Reggie" }).click();
  await page.getByLabel("Name").fill("Alex");
  await page.getByRole("button", { name: "Start temporary chat" }).click();
  await page.getByLabel("Message Reggie").fill("Hello Reggie");
  await page.getByRole("button", { name: "Send live message" }).click();

  const reply = page.locator('article[aria-label^="Reggie:"]');
  await expect(reply).toContainText("Reggie here");
  await expect(reply.locator("img")).toBeVisible();
});

test("the launcher mascot subtly follows mouse movement", async ({ page }) => {
  await page.goto("/life", { waitUntil: "domcontentloaded" });
  const mascot = page.locator(".chatbot-launcher .chatbot-mascot");
  await page.mouse.move(1100, 120);
  await page.waitForTimeout(250);
  const movement = await mascot.evaluate((node) => ({
    x: Number.parseFloat(getComputedStyle(node).getPropertyValue("--mascot-follow-x")),
    y: Number.parseFloat(getComputedStyle(node).getPropertyValue("--mascot-follow-y")),
  }));
  expect(Math.abs(movement.x)).toBeGreaterThan(1);
  expect(Math.abs(movement.y)).toBeGreaterThan(1);
});
