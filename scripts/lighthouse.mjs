import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import { createPreviewServer } from "./preview-server.mjs";

const ROUTES = ["/", "/tech", "/travel", "/life"];
const RUNS = 3;
const OUTPUT_DIR = path.resolve(".lighthouseci");
const CHROME_PROFILE_DIR = path.join(OUTPUT_DIR, "chrome-profile");
const CATEGORY_POLICY = {
  performance: { minimum: 0.7, severity: "warn" },
  accessibility: { minimum: 0.9, severity: "error" },
  "best-practices": { minimum: 0.85, severity: "warn" },
  seo: { minimum: 0.8, severity: "warn" },
};

function median(values) {
  const ordered = [...values].sort((left, right) => left - right);
  return ordered[Math.floor(ordered.length / 2)];
}

function routeName(route) {
  return route === "/" ? "home" : route.slice(1);
}

const server = createPreviewServer();
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});
const serverPort = server.address().port;
let chrome;

try {
  await rm(OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(OUTPUT_DIR, { recursive: true });
  await mkdir(CHROME_PROFILE_DIR, { recursive: true });
  chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"],
    userDataDir: CHROME_PROFILE_DIR,
  });

  const summary = { runs: RUNS, routes: {}, policy: CATEGORY_POLICY };
  const failures = [];
  for (const route of ROUTES) {
    const categoryRuns = Object.fromEntries(Object.keys(CATEGORY_POLICY).map((category) => [category, []]));
    for (let run = 1; run <= RUNS; run += 1) {
      const result = await lighthouse(
        `http://127.0.0.1:${serverPort}${route}`,
        {
          port: chrome.port,
          output: "json",
          logLevel: "error",
          onlyCategories: Object.keys(CATEGORY_POLICY),
        },
      );
      await writeFile(
        path.join(OUTPUT_DIR, `${routeName(route)}-${run}.json`),
        result.report,
        "utf8",
      );
      for (const category of Object.keys(CATEGORY_POLICY)) {
        categoryRuns[category].push(result.lhr.categories[category].score);
      }
    }

    summary.routes[route] = Object.fromEntries(
      Object.entries(categoryRuns).map(([category, scores]) => [category, {
        scores,
        median: median(scores),
      }]),
    );
    for (const [category, { minimum, severity }] of Object.entries(CATEGORY_POLICY)) {
      const score = summary.routes[route][category].median;
      if (!Number.isFinite(score)) {
        failures.push(`${route} ${category} did not return a numeric Lighthouse score`);
        continue;
      }
      if (score >= minimum) continue;
      const message = `${route} ${category} median ${score.toFixed(2)} is below ${minimum.toFixed(2)}`;
      if (severity === "error") failures.push(message);
      else console.warn(`Lighthouse warning: ${message}`);
    }
  }

  await writeFile(
    path.join(OUTPUT_DIR, "summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8",
  );
  if (failures.length) throw new Error(`Lighthouse policy failed:\n- ${failures.join("\n- ")}`);
  console.log(`Lighthouse passed ${ROUTES.length} routes across ${RUNS} runs; reports: ${OUTPUT_DIR}`);
} finally {
  try {
    await chrome?.kill();
  } catch (error) {
    console.warn(`Lighthouse Chrome cleanup warning: ${error.message}`);
  }
  try {
    await rm(CHROME_PROFILE_DIR, { recursive: true, force: true, maxRetries: 10 });
  } catch (error) {
    console.warn(`Lighthouse profile cleanup warning: ${error.message}`);
  }
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}
