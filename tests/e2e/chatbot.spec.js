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
  await expect(dialog.getByText("Zenith", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Ask about the portfolio")).toBeFocused();
  await expect(launcher).toHaveAttribute("data-mascot-state", "listening");
  await expect(dialog.getByText("Listening", { exact: true })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(launcher).toBeFocused();
});

test("portfolio assistant offers a private contact form without exposing it on admin", async ({ page }) => {
  await page.goto("/travel", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Open Zenith" }).click();
  await page.getByRole("button", { name: "Send Reggie a message" }).click();
  await expect(page.getByRole("heading", { name: "Ask about Reggie's work" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send securely" })).toBeVisible();
  await expect(page.getByLabel("Name")).toBeVisible();

  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: /portfolio assistant/i })).toHaveCount(0);
});

test("Zenith answers locally and exposes the temporary live-chat entry", async ({ page }) => {
  await page.goto("/life", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Open Zenith" }).click();
  await page.getByRole("button", { name: "What kind of work does Reggie build?" }).click();
  await expect(page.getByText(/Tech, Travel, and Life pages/)).toBeVisible();
  await page.getByRole("button", { name: "Chat with Reggie" }).click();
  await expect(page.getByText("Temporary messages expire one hour after the latest reply.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Start temporary chat" })).toBeVisible();
});
