import { expect, test } from "@playwright/test";

const routes = ["/", "/tech", "/travel", "/life", "/privacy", "/admin", "/missing-page"];

async function visibleViewportOffenders(page) {
  return page.evaluate(() => [...document.body.querySelectorAll("*")].flatMap((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    let ancestor = element.parentElement;
    let ancestorIsHidden = false;
    while (ancestor && !ancestorIsHidden) {
      const ancestorStyle = getComputedStyle(ancestor);
      ancestorIsHidden = ancestorStyle.display === "none"
        || ancestorStyle.visibility === "hidden"
        || Number(ancestorStyle.opacity) === 0;
      ancestor = ancestor.parentElement;
    }
    const isHidden = style.display === "none"
      || style.visibility === "hidden"
      || Number(style.opacity) === 0
      || ancestorIsHidden
      || element instanceof SVGElement
      || (element.closest(".drift-wall") && !element.matches(".drift-wall"))
      || element.closest("dialog:not([open])")
      || element.matches(".visually-hidden, .sr-only, .skip-link:not(:focus)");
    const isOutsideVerticalView = rect.bottom <= 0 || rect.top >= innerHeight;
    const clipsViewport = rect.left < -1 || rect.right > innerWidth + 1;
    if (isHidden || isOutsideVerticalView || !clipsViewport || rect.width < 2 || rect.height < 2) return [];
    return [{
      element: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${[...element.classList].slice(0, 2).map((name) => `.${name}`).join("")}`,
      left: Math.round(rect.left * 10) / 10,
      right: Math.round(rect.right * 10) / 10,
      viewportWidth: innerWidth,
    }];
  }).slice(0, 12));
}

async function expectResponsiveAtCurrentViewport(page, route) {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await expect(page.locator("main#main:not(.route-loading)")).toBeVisible();
  const scrollPositions = await page.evaluate(() => {
    const last = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    return [...new Set([0, Math.round(last / 2), last])];
  });
  for (const top of scrollPositions) {
    await page.evaluate((nextTop) => window.scrollTo({ top: nextTop, behavior: "instant" }), top);
    await page.waitForTimeout(50);
    expect(await visibleViewportOffenders(page), `${route} clips visible content at scroll position ${top}`).toEqual([]);
  }
}

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
    expect(await visibleViewportOffenders(page)).toEqual([]);
  });
}

const explicitViewports = [
  { name: "small phone", width: 320, height: 568 },
  { name: "narrow phone", width: 360, height: 800 },
  { name: "compact phone", width: 375, height: 667 },
  { name: "standard phone", width: 393, height: 852 },
  { name: "large phone", width: 430, height: 932 },
  { name: "compact tablet", width: 600, height: 960 },
  { name: "small portrait tablet", width: 744, height: 1133 },
  { name: "small tablet", width: 768, height: 1024 },
  { name: "portrait tablet", width: 834, height: 1194 },
  { name: "tablet landscape", width: 1024, height: 768 },
  { name: "large portrait tablet", width: 1024, height: 1366 },
  { name: "large tablet landscape", width: 1180, height: 820 },
  { name: "small desktop", width: 1280, height: 800 },
  { name: "large desktop", width: 1920, height: 1080 },
];

for (const viewport of explicitViewports) {
  test(`${viewport.name} ${viewport.width}x${viewport.height} preserves route reflow`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The explicit matrix runs once instead of repeating per project.");
    test.setTimeout(120_000);
    const browserErrors = [];
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") browserErrors.push(message.text()); });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize(viewport);
    for (const route of routes) await expectResponsiveAtCurrentViewport(page, route);
    expect(browserErrors).toEqual([]);
  });
}

test("phone landscape keeps primary content and controls in view", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The explicit landscape check runs once.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const viewport of [{ width: 667, height: 375 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    for (const route of ["/", "/tech", "/travel", "/life"]) await expectResponsiveAtCurrentViewport(page, route);
  }
});

test("layout reflows through repeated browser resizing without a reload", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The resize sequence runs once.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  for (const viewport of [
    { width: 600, height: 900 },
    { width: 390, height: 844 },
    { width: 1024, height: 768 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(page.locator(".collage .photo-window:visible")).toHaveCount(6);
    expect(await visibleViewportOffenders(page)).toEqual([]);
  }
});

test("Home keeps every photo and personal detail available on touch layouts", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "desktop", "This is a touch-layout contract.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".collage .photo-window")).toHaveCount(6);
  await expect(page.locator(".collage .photo-window:visible")).toHaveCount(6);
  await expect(page.locator(".collage .hero-chip:visible")).toHaveCount(5);
  const laptop = page.getByRole("button", { name: /Laptop/ });
  await laptop.click();
  await expect(laptop).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#chip-laptop")).toContainText("Acer Nitro 5");
});

test("mobile navigation opens, closes, and restores focus", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "The menu collapses only at the mobile breakpoint.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/tech", { waitUntil: "domcontentloaded" });
  const toggle = page.getByRole("button", { name: "Toggle navigation menu" });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
});

test("touch carousel controls expose comfortable hit areas", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "tablet", "The fan controls remain a tablet interaction.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator(".home-section--lanes").scrollIntoViewIfNeeded();
  const dots = page.locator(".home-lane-carousel__dots button");
  await expect(dots).toHaveCount(3);
  for (const dot of await dots.all()) {
    const box = await dot.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
});

test("phone Home uses a one-tap scroll-snap destination rail", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "This interaction is specific to phone widths.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator(".home-section--lanes").scrollIntoViewIfNeeded();
  const rail = page.locator(".home-lane-carousel.is-phone-rail .home-lane-carousel__stage");
  await expect(rail).toBeVisible();
  await expect(rail).toHaveCSS("scroll-snap-type", /x/);
  await expect(page.locator(".home-lane-card__copy strong")).toHaveCount(3);
  await page.getByRole("link", { name: /View Tech/ }).click();
  await expect(page).toHaveURL(/\/tech$/);
});

test("compact tablet keeps the primary navigation inline", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The breakpoint boundary runs once.");
  await page.setViewportSize({ width: 744, height: 1133 });
  await page.goto("/tech", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".site-nav__mobile-toggle")).toBeHidden();
  await expect(page.getByRole("link", { name: "Travel" })).toBeVisible();
});

test("Zenith stays inside compact touch viewports with touch-sized actions", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "desktop", "This is a compact coarse-pointer contract.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/tech", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Open Zenith" }).click();
  const panel = page.getByRole("dialog", { name: "Ask about Reggie's work" });
  await expect(panel).toBeVisible();
  const bounds = await panel.boundingBox();
  const viewport = page.viewportSize();
  expect(bounds?.x).toBeGreaterThanOrEqual(0);
  expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(viewport.width);
  expect(bounds?.y).toBeGreaterThanOrEqual(0);
  expect((bounds?.y ?? 0) + (bounds?.height ?? 0)).toBeLessThanOrEqual(viewport.height);
  const quickActions = panel.locator(".chatbot-panel__quick-actions button");
  await expect(quickActions.first()).toBeVisible();
  for (const action of await quickActions.all()) {
    const box = await action.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
});

test("social links stay fixed and usable near the lower right", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/tech", { waitUntil: "domcontentloaded" });

  const dock = page.getByRole("navigation", { name: "Social links" });
  await expect(dock).toBeVisible();
  const viewport = page.viewportSize();
  const position = await dock.evaluate((element) => getComputedStyle(element).position);

  expect(position).toBe("fixed");
  for (const link of await dock.locator("a").all()) {
    const box = await link.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
    await expect(link).toHaveAttribute("href", /^https:\/\//);
  }
  const bounds = await dock.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { top: rect.top, right: rect.right, bottom: rect.bottom, viewportWidth: innerWidth, viewportHeight: innerHeight };
  });

  expect(bounds.top).toBeGreaterThanOrEqual(0);
  expect(bounds.right).toBeLessThanOrEqual(bounds.viewportWidth);
  expect(bounds.viewportHeight - bounds.bottom).toBeGreaterThanOrEqual(0);
  expect(bounds.viewportHeight - bounds.bottom).toBeLessThan(viewport.width <= 1180 ? 120 : 64);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const afterScroll = await dock.boundingBox();
  expect(Math.abs(afterScroll.y - bounds.top)).toBeLessThan(2);
});

test("Privacy keeps a readable measure and Admin setup stays grouped", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The geometry check runs once.");
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto("/privacy", { waitUntil: "domcontentloaded" });
  const privacyWidth = await page.locator(".privacy-page > .card").evaluate((element) => element.getBoundingClientRect().width);
  expect(privacyWidth).toBeLessThanOrEqual(832);

  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  const setup = page.locator(".react-admin__setup");
  await expect(setup).toBeVisible();
  const setupGeometry = await setup.evaluate((element) => {
    const heading = element.querySelector("h1").getBoundingClientRect();
    const copy = element.querySelector(".react-muted").getBoundingClientRect();
    return { gap: copy.top - heading.bottom, width: element.getBoundingClientRect().width };
  });
  expect(setupGeometry.gap).toBeLessThan(32);
  expect(setupGeometry.width).toBeLessThanOrEqual(576);
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
    const descriptionStyle = await description.evaluate((element) => ({
      clientHeight: element.clientHeight,
      lineClamp: getComputedStyle(element).webkitLineClamp,
      scrollHeight: element.scrollHeight,
    }));
    expect(descriptionStyle.lineClamp).toBe("none");
    expect(descriptionStyle.scrollHeight).toBeLessThanOrEqual(descriptionStyle.clientHeight + 1);
  } else {
    // Both columns share a grid row; this tolerance only allows subpixel layout rounding.
    expect(Math.abs(bounds.copy.top - bounds.title.top)).toBeLessThan(2);
    expect(bounds.copy.left).toBeGreaterThan(bounds.title.right);
  }

  await dialog.getByRole("button", { name: "Close photo album" }).click();
  await expect(albumButton).toBeFocused();
});
