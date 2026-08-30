import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { expect, test as base } from "@playwright/test";
import { ENGINE_EVIDENCE_REPORTER_VERSION } from "../../scripts/engine-evidence-reporter.mjs";

const require = createRequire(import.meta.url);
const rootPackage = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
const routeContract = JSON.parse(readFileSync(new URL("./route-contract.json", import.meta.url), "utf8"));
const corePackagePath = require.resolve("playwright-core/package.json");
const browserManifest = JSON.parse(
  readFileSync(join(dirname(corePackagePath), "browsers.json"), "utf8"),
);

function packageVersion(name) {
  let current = dirname(require.resolve(name));
  while (true) {
    const candidate = join(current, "package.json");
    if (existsSync(candidate)) {
      const metadata = JSON.parse(readFileSync(candidate, "utf8"));
      if (metadata.name === name) return metadata.version;
    }
    const parent = dirname(current);
    if (parent === current) throw new Error(`Cannot find package metadata for ${name}`);
    current = parent;
  }
}

const PINNED_TOOLS = [
  "@playwright/test",
  "playwright",
  "playwright-core",
  "@axe-core/playwright",
  "vitest",
  "fast-check",
  "jsdom",
  "ajv",
  "lighthouse",
];

const tools = Object.fromEntries(PINNED_TOOLS.map((name) => {
  const pinnedVersion = rootPackage.devDependencies[name];
  if (!/^\d+\.\d+\.\d+(?:[-+].+)?$/.test(pinnedVersion ?? "")) {
    throw new Error(`${name} must be pinned to an exact version`);
  }

  const installedVersion = packageVersion(name);
  if (installedVersion !== pinnedVersion) {
    throw new Error(`${name} installed ${installedVersion}, expected pinned ${pinnedVersion}`);
  }
  return [name, installedVersion];
}));

tools["engine-evidence-reporter"] = ENGINE_EVIDENCE_REPORTER_VERSION;

export const PRODUCT_ROUTES = Object.freeze(routeContract.products.map(({ path, h1 }) => ({ path, h1 })));

if (PRODUCT_ROUTES.length !== 4 || new Set(PRODUCT_ROUTES.map(({ path }) => path)).size !== 4) {
  throw new Error("Engine harness requires exactly four distinct product routes");
}

function browserRecord(browserName, browser) {
  const manifest = browserManifest.browsers.find(({ name }) => name === browserName);
  if (!manifest) throw new Error(`No pinned browser manifest entry for ${browserName}`);

  const executablePath = browser.browserType().executablePath();
  const revisionMatch = executablePath.replaceAll("\\", "/").match(
    /(?:chromium|chromium_headless_shell|headless_shell|firefox|webkit)-(\d+)/,
  );
  if (!existsSync(executablePath) || !revisionMatch) {
    throw new Error(`Cannot verify installed ${browserName} revision`);
  }

  const recordedRevisions = [
    String(manifest.revision),
    ...Object.values(manifest.revisionOverrides ?? {}).map(String),
  ].sort();
  const installedRevision = revisionMatch[1];
  if (!recordedRevisions.includes(installedRevision)) {
    throw new Error(
      `${browserName} installed revision ${installedRevision}, expected a Playwright-recorded revision`,
    );
  }

  const runtimeBrowserVersion = browser.version();
  if (!runtimeBrowserVersion) {
    throw new Error(`Cannot record the runtime ${browserName} version`);
  }

  return {
    manifestRevision: String(manifest.revision),
    recordedRevisions,
    installedRevision,
    manifestBrowserVersion: manifest.browserVersion,
    runtimeBrowserVersion,
    host: `${process.platform}-${process.arch}`,
  };
}

export const test = base.extend({
  engineEvidence: async ({ browser, browserName }, use, testInfo) => {
    let route;
    await use({
      async recordRoute(value) {
        if (route) throw new Error("A harness test may record only one clean route");
        route = value;
      },
    });

    if (!route) throw new Error(`No route evidence recorded by ${testInfo.title}`);
    await testInfo.attach("engine-evidence", {
      body: JSON.stringify({
        project: testInfo.project.name,
        engine: browserName,
        browser: browserRecord(browserName, browser),
        tools,
        route,
      }),
      contentType: "application/json",
    });
  },
});

export { expect };
