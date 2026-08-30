import { expect, test } from "../fixtures/engine-test.js";

const FORBIDDEN_COPY = /\b(?:placeholder|dummy|lorem ipsum)\b|\bcoming[\s-]+soon\b/i;

for (const route of ["/", "/tech"]) {
  test(`${route} renders only approved local content`, async ({ page }) => {
    await page.goto(route, { waitUntil: "load" });

    await expect(page.locator("body")).toHaveAttribute("data-release-state", "release-ready");
    await expect(page.locator('a[href="#"]')).toHaveCount(0);
    expect(await page.locator("body").innerText()).not.toMatch(FORBIDDEN_COPY);

    const imageProblems = await page.locator("main img").evaluateAll((images) => images.flatMap((image) => {
      const problems = [];
      if (!image.hasAttribute("alt")) problems.push(`${image.src}: missing alt`);
      if (!(Number(image.getAttribute("width")) > 0) || !(Number(image.getAttribute("height")) > 0)) {
        problems.push(`${image.src}: missing dimensions`);
      }
      if (!image.complete || image.naturalWidth === 0) problems.push(`${image.src}: unresolved`);
      if (new URL(image.src).origin !== window.location.origin) problems.push(`${image.src}: non-local`);
      return problems;
    }));
    expect(imageProblems).toEqual([]);
  });
}

test("Tech omits unavailable career and job types without empty sections", async ({ page }) => {
  await page.goto("/tech", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".tech-path")).toHaveCount(1);
  await expect(page.locator("[data-tech-type='career-history']")).toHaveCount(0);
  await expect(page.locator("[data-tech-type='job-information']")).toHaveCount(0);
});
