import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.env.REACT_QA_URL ?? "http://127.0.0.1:5174";
const outputDirectory = path.resolve("artifacts", "visual-acceptance");
const routes = [
  { name: "home", path: "/" },
  { name: "tech", path: "/tech" },
  { name: "travel", path: "/travel" },
  { name: "life", path: "/life" },
  { name: "admin", path: "/admin" },
];
const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
];

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
  await context.addInitScript(() => sessionStorage.setItem("reggie-portfolio-home-entry-seen", "true"));
  for (const route of routes) {
    const page = await context.newPage();
    await page.goto(`${baseUrl}${route.path}`, { waitUntil: "networkidle" });
    await page.screenshot({
      path: path.join(outputDirectory, `${route.name}-${viewport.name}.png`),
      fullPage: true,
    });
    await page.close();
  }
  await context.close();
}

await browser.close();
console.log(`Visual acceptance captures written to ${outputDirectory}`);
