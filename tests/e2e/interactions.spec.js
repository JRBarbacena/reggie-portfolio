import { expect, test } from "@playwright/test";

async function dismissEntryGate(page) {
  await page.locator("main h1").waitFor();
  const enter = page.getByRole("button", { name: "Enter portfolio" });
  if (await enter.isVisible().catch(() => false)) {
    await enter.click();
    await expect(page.locator(".site-preloader")).toHaveCount(0);
  }
}

test("mobile navigation removes closed links from focus and restores the trigger", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/life", { waitUntil: "domcontentloaded" });

  const toggle = page.getByRole("button", { name: "Toggle navigation menu" });
  const menu = page.locator("#site-nav-menu");
  await expect(menu).toHaveAttribute("inert", "");

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(menu).not.toHaveAttribute("inert", "");
  await expect(menu).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(menu).toHaveAttribute("inert", "");
  await expect(toggle).toBeFocused();
});

test("navigation uses native clean-route GET requests without HEAD preflights", async ({ page }) => {
  const methods = [];
  page.on("request", (request) => methods.push(request.method()));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await dismissEntryGate(page);
  await page.getByRole("link", { name: "Tech", exact: true }).click();
  await page.waitForURL("**/tech");

  expect(methods).not.toContain("HEAD");
  await expect(page.locator("h1")).toContainText("Turning ideas");
});

test("navigation fades the current page before opening another page", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await dismissEntryGate(page);

  const destination = page.waitForURL("**/travel");
  await page.getByRole("link", { name: "Travel", exact: true }).click({ noWaitAfter: true });
  await expect(page.locator("html")).toHaveClass(/is-page-leaving/);
  await expect(page.locator(".route-transition")).toHaveCount(0);
  await destination;
  await expect(page.locator("h1")).toContainText("Drifting around the world");
});

test("interior navigation becomes a blurred surface only after scrolling", async ({ page }) => {
  await page.goto("/tech", { waitUntil: "domcontentloaded" });
  const header = page.locator(".site-header");

  await expect(header).not.toHaveClass(/is-scrolled/);
  await page.evaluate(() => window.scrollTo({ top: 320, behavior: "instant" }));
  await expect(header).toHaveClass(/is-scrolled/);
  await page.waitForTimeout(350);
  await expect(header).toHaveCSS("backdrop-filter", /blur\(18px\)/);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(header).not.toHaveClass(/is-scrolled/);
});

test("Home hero and lane cards use bounded entrance choreography", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await dismissEntryGate(page);

  await expect(page.locator("html")).toHaveClass(/portfolio-entered/);
  await expect(page.locator(".hero__center")).toHaveCSS("animation-name", "home-element-in");
  await expect(page.locator(".photo-window").first()).toHaveCSS("animation-name", "home-element-in");
  await expect(page.locator(".hero-chip").first()).toHaveCSS("animation-name", "home-element-in");

  const lanes = page.locator(".home-section--lanes");
  await lanes.scrollIntoViewIfNeeded();
  await expect(lanes.locator(".section-head")).toHaveClass(/is-revealed/);
  await expect(lanes.locator(".gallery__item").first()).toHaveClass(/is-revealed/);
});

test("Home Ballpit pauses offscreen and resumes when the hero returns", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await dismissEntryGate(page);
  const ballpit = page.locator(".hero-ballpit__canvas");

  await expect(ballpit).toHaveAttribute("data-animation-state", "running");
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await expect(ballpit).toHaveAttribute("data-animation-state", "paused");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(ballpit).toHaveAttribute("data-animation-state", "running");
});

test("social dock exposes a visible vector icon for every social profile", async ({ page }) => {
  await page.goto("/tech", { waitUntil: "domcontentloaded" });
  const links = page.locator(".social-dock__link");
  const icons = page.locator(".social-dock__brand");

  await expect(links).toHaveCount(4);
  await expect(icons).toHaveCount(4);
  for (let index = 0; index < 4; index += 1) {
    await expect(icons.nth(index)).toBeVisible();
  }
});

test("mouse clicks create a brief non-blocking spark", async ({ page }) => {
  await page.goto("/tech", { waitUntil: "domcontentloaded" });
  const spark = page.locator(".click-spark");

  await expect(spark).toHaveCSS("pointer-events", "none");
  await expect(spark).toHaveAttribute("data-enabled", "true");
  await page.mouse.click(600, 300);
  await expect(spark).toHaveAttribute("data-active", "true");
  await expect(spark).toHaveAttribute("data-active", "false", { timeout: 1000 });
});

test("desktop wheel scrolling uses the lightweight smooth-motion layer", async ({ page }) => {
  await page.goto("/tech", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("data-scroll-motion", "smooth");

  await page.mouse.wheel(0, 500);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});

test("mobile typography stays readable and inside every released page", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of ["/", "/tech", "/travel", "/life"]) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await dismissEntryGate(page);
    const metrics = await page.locator("main").evaluate((main) => {
      const paragraphs = [...main.querySelectorAll("p")]
        .filter((element) => element.getBoundingClientRect().width > 0);
      const invalidLineHeight = paragraphs.find((paragraph) => {
        const style = getComputedStyle(paragraph);
        return Number.parseFloat(style.lineHeight) / Number.parseFloat(style.fontSize) < 1.5;
      });
      return {
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        invalidLineHeight: invalidLineHeight?.textContent.trim().slice(0, 60) ?? null,
      };
    });

    expect(metrics.overflow, `${route} horizontal overflow`).toBeLessThanOrEqual(1);
    expect(metrics.invalidLineHeight, `${route} cramped paragraph`).toBeNull();
  }
});

test("hero chip visual state follows aria-expanded and Escape returns focus", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await dismissEntryGate(page);
  const chip = page.locator(".hero-chip").first();
  const detail = chip.locator(".hero-chip__detail");

  await expect(chip).toHaveAttribute("aria-expanded", "false");
  await expect(detail).toHaveCSS("visibility", "hidden");
  await chip.click();
  await expect(chip).toHaveAttribute("aria-expanded", "true");
  await expect(detail).toHaveCSS("visibility", "visible");

  await page.keyboard.press("Escape");
  await expect(chip).toHaveAttribute("aria-expanded", "false");
  await expect(chip).toBeFocused();
  await expect(detail).toHaveCSS("visibility", "visible");
});

test("album section exposes a usable database-backed state", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/tech", { waitUntil: "domcontentloaded" });
  const contentState = page.locator(".tech-community :is(.album-empty, .album-card)").first();
  await expect(contentState).toBeVisible();
  expect(pageErrors).toEqual([]);
});

for (const route of ["/", "/tech", "/travel", "/life"]) {
  test(`${route} exposes final content immediately with reduced motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("data-scroll-motion", "native");

    const problems = await page.locator("body").evaluate(() => {
      const issues = [];
      for (const element of document.querySelectorAll("[data-reveal]")) {
        const style = getComputedStyle(element);
        if (style.opacity !== "1") issues.push(`${element.tagName}: opacity ${style.opacity}`);
      }
      for (const element of document.querySelectorAll("*")) {
        const style = getComputedStyle(element);
        const durations = `${style.animationDuration},${style.transitionDuration}`
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
          .map((value) => value.endsWith("ms") ? Number.parseFloat(value) : Number.parseFloat(value) * 1000);
        if (durations.some((duration) => Number.isFinite(duration) && duration > 1)) {
          issues.push(`${element.tagName}.${element.className}: motion exceeds 1ms`);
        }
      }
      return issues.slice(0, 20);
    });

    expect(problems).toEqual([]);
  });
}
