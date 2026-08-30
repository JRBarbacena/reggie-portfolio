import { spawn } from "node:child_process";
import path from "node:path";
import { createPreviewServer } from "./preview-server.mjs";

const [script, ...args] = process.argv.slice(2);
if (!script) throw new Error("A Node script path is required.");

const server = createPreviewServer();
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});
const baseUrl = `http://127.0.0.1:${server.address().port}`;
const child = spawn(process.execPath, [path.resolve(script), ...args], {
  cwd: process.cwd(),
  env: { ...process.env, REACT_QA_URL: baseUrl },
  stdio: "inherit",
});

const exitCode = await new Promise((resolve, reject) => {
  child.once("error", reject);
  child.once("exit", (code) => resolve(code ?? 1));
}).finally(() => new Promise((resolve, reject) => {
  server.close((error) => (error ? reject(error) : resolve()));
}));

process.exitCode = exitCode;
