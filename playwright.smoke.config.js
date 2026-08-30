import { defineConfig } from "@playwright/test";

const testPort = Number(process.env.PORTFOLIO_TEST_PORT || 4174);
const testBaseUrl = `http://127.0.0.1:${testPort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "artifacts/playwright-failures",
  preserveOutput: "failures-only",
  globalTimeout: 3 * 60_000,
  timeout: 20_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: "list",
  use: {
    baseURL: testBaseUrl,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 5_000,
    navigationTimeout: 10_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: process.env.PLAYWRIGHT_EXTERNAL_SERVER ? undefined : {
    command: `node node_modules/vite/bin/vite.js preview --config react.vite.config.js --host 127.0.0.1 --port ${testPort} --strictPort`,
    url: `${testBaseUrl}/`,
    env: { ...process.env, PORT: String(testPort) },
    reuseExistingServer: false,
    timeout: 15_000,
  },
  projects: [
    { name: "chromium-engine", use: { browserName: "chromium" } },
  ],
});
