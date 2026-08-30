import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createPreviewServer } from "./preview-server.mjs";

const args = process.argv.slice(2);
const isSmoke = args.some((argument) => argument.includes("playwright.smoke.config.js"));
const port = Number(process.env.PORTFOLIO_TEST_PORT || (isSmoke ? 4174 : 4173));
const server = createPreviewServer();

await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(port, "127.0.0.1", resolve);
});

const cli = fileURLToPath(new URL("../node_modules/@playwright/test/cli.js", import.meta.url));
const child = spawn(process.execPath, [cli, "test", ...args], {
  cwd: process.cwd(),
  env: { ...process.env, PLAYWRIGHT_EXTERNAL_SERVER: "1" },
  stdio: "inherit",
});

const exitCode = await new Promise((resolve, reject) => {
  child.once("error", reject);
  child.once("exit", (code) => resolve(code ?? 1));
}).finally(() => new Promise((resolve, reject) => {
  server.close((error) => (error ? reject(error) : resolve()));
}));

process.exitCode = exitCode;
