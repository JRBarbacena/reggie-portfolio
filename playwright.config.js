import { defineConfig } from "@playwright/test";

const engineUse = {
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
  isMobile: false,
  hasTouch: false,
};

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "artifacts/playwright-failures",
  preserveOutput: "failures-only",
  globalTimeout: 5 * 60_000,
  timeout: 20_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: [["list"], ["./scripts/engine-evidence-reporter.mjs"]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    actionTimeout: 5_000,
    navigationTimeout: 10_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: process.env.PLAYWRIGHT_EXTERNAL_SERVER ? undefined : {
    command: "node node_modules/vite/bin/vite.js preview --config react.vite.config.js --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173/",
    reuseExistingServer: false,
    timeout: 15_000,
  },
  projects: [
    { name: "chromium-engine", use: { ...engineUse, browserName: "chromium" } },
    { name: "firefox-engine", use: { ...engineUse, browserName: "firefox" } },
    { name: "webkit-engine", use: { ...engineUse, browserName: "webkit" } },
  ],
});
