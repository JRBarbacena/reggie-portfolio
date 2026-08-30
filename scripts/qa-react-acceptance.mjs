import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

const baseUrl = process.env.REACT_QA_URL ?? "http://127.0.0.1:5174";
const routes = ["/", "/tech", "/travel", "/life", "/admin"];
const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
];
const report = { baseUrl, routes: [], home: {}, offline: {}, performance: {} };
const browser = await chromium.launch({ headless: true });

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport });
  await context.addInitScript(() => sessionStorage.setItem("reggie-portfolio-home-entry-seen", "true"));
  for (const route of routes) {
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const h1 = await page.locator("h1").first().innerText();
    assert.equal(overflow, 0, `${route} overflows horizontally at ${viewport.name}`);
    assert.deepEqual(errors, [], `${route} has runtime errors at ${viewport.name}`);
    let accessibilityViolations = [];
    if (viewport.name === "desktop") {
      accessibilityViolations = (await new AxeBuilder({ page }).analyze()).violations.map(({ id }) => id);
      assert.deepEqual(accessibilityViolations, [], `${route} has accessibility violations`);
    }
    report.routes.push({ route, viewport: viewport.name, h1, overflow, accessibilityViolations });
    await page.close();
  }
  await context.close();
}

const homeContext = await browser.newContext({ viewport: viewports[1] });
await homeContext.addInitScript(() => sessionStorage.setItem("reggie-portfolio-home-entry-seen", "true"));
const homePage = await homeContext.newPage();
await homePage.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
await homePage.waitForTimeout(900);
const navLabels = await homePage.locator(".site-nav__list .site-nav__link").allTextContents();
const headerStyle = await homePage.locator(".site-header--home").evaluate((node) => ({
  backdropFilter: getComputedStyle(node).backdropFilter,
  backgroundImage: getComputedStyle(node).backgroundImage,
}));
const ballpit = homePage.locator(".hero-ballpit canvas");
assert.deepEqual(navLabels, ["Home", "Tech", "Travel", "Life"]);
assert.equal(await homePage.getByRole("button", { name: "More pages" }).count(), 0);
assert.equal(await ballpit.getAttribute("data-ball-count"), "65");
assert.equal(await ballpit.getAttribute("data-follow-cursor"), "false");
assert.deepEqual(headerStyle, { backdropFilter: "none", backgroundImage: "none" });
await homePage.evaluate(() => { window.__acceptanceCanvas = document.querySelector(".hero-ballpit canvas"); });
await homePage.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
await homePage.waitForTimeout(180);
await homePage.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
await homePage.waitForTimeout(250);
assert.equal(await homePage.evaluate(() => window.__acceptanceCanvas === document.querySelector(".hero-ballpit canvas")), true);
report.home = { navLabels, headerStyle, balls: 65, followCursor: false, persistentCanvas: true };
await homeContext.close();

const reducedContext = await browser.newContext({ viewport: viewports[0], reducedMotion: "reduce" });
const reducedPage = await reducedContext.newPage();
await reducedPage.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
assert.equal(await reducedPage.locator(".hero-ballpit canvas").count(), 0);
assert.equal(await reducedPage.locator("#hero-title").isVisible(), true);
report.home.reducedMotionCanvas = 0;
await reducedContext.close();

const retiredContext = await browser.newContext();
const retiredPage = await retiredContext.newPage();
await retiredPage.goto(`${baseUrl}/designs`, { waitUntil: "networkidle" });
assert.equal(await retiredPage.locator("h1").innerText(), "Page not found.");
report.retiredDesigns = true;
await retiredContext.close();

const preloaderContext = await browser.newContext({ viewport: viewports[1] });
const preloaderPage = await preloaderContext.newPage();
await preloaderPage.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
assert.equal(await preloaderPage.locator(".site-preloader").isVisible(), true);
await preloaderPage.getByRole("button", { name: "Enter portfolio" }).click();
await preloaderPage.waitForTimeout(400);
await preloaderPage.getByRole("link", { name: "Tech", exact: true }).click();
await preloaderPage.waitForURL("**/tech");
await preloaderPage.getByRole("link", { name: "Home", exact: true }).click();
await preloaderPage.waitForURL(new RegExp(`${baseUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/?$`));
await preloaderPage.locator("#hero-title").waitFor();
assert.equal(await preloaderPage.locator(".site-preloader").count(), 0);
await preloaderPage.reload({ waitUntil: "networkidle" });
assert.equal(await preloaderPage.locator(".site-preloader").isVisible(), true);
report.home.preloader = { firstVisit: true, navigationReturn: false, homeReload: true };
await preloaderContext.close();

const performanceContext = await browser.newContext({ viewport: viewports[1] });
await performanceContext.addInitScript(() => {
  sessionStorage.setItem("reggie-portfolio-home-entry-seen", "true");
  window.__qaVitals = { cls: 0, lcp: 0, longTasks: 0 };
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) window.__qaVitals.lcp = entry.startTime;
  }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__qaVitals.cls += entry.value;
  }).observe({ type: "layout-shift", buffered: true });
  new PerformanceObserver((list) => { window.__qaVitals.longTasks += list.getEntries().length; })
    .observe({ type: "longtask", buffered: true });
});
const performancePage = await performanceContext.newPage();
await performancePage.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
await performancePage.waitForTimeout(2500);
report.performance = await performancePage.evaluate(() => ({
  ...window.__qaVitals,
  resourcesKiB: Math.round(performance.getEntriesByType("resource").reduce((sum, entry) => sum + (entry.transferSize || 0), 0) / 1024),
}));
assert.ok(report.performance.lcp < 4000, `Home LCP signal is ${report.performance.lcp}ms`);
assert.ok(report.performance.cls < 0.1, `Home CLS signal is ${report.performance.cls}`);
await performanceContext.close();

const offlineContext = await browser.newContext({ viewport: viewports[1] });
await offlineContext.addInitScript(() => sessionStorage.setItem("reggie-portfolio-home-entry-seen", "true"));
const offlinePage = await offlineContext.newPage();
await offlinePage.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
await offlinePage.evaluate(async () => {
  await navigator.serviceWorker.ready;
});
await offlinePage.waitForTimeout(3000);
await offlineContext.setOffline(true);
await offlinePage.goto(`${baseUrl}/life`, { waitUntil: "domcontentloaded" });
report.offline.lifeHeading = await offlinePage.locator("h1").innerText();
assert.match(report.offline.lifeHeading, /Life feels better/i);
const offlineAdmin = await offlineContext.newPage();
await offlineAdmin.goto(`${baseUrl}/admin`, { waitUntil: "domcontentloaded" });
report.offline.adminHeading = await offlineAdmin.locator("h1").innerText();
assert.match(report.offline.adminHeading, /needs a connection/i);
await offlineContext.close();

await browser.close();
console.log(JSON.stringify(report, null, 2));
