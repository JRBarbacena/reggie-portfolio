/**
 * Local accessibility gate (mirrors LHCI a11y minScore 0.9).
 * Uses npx lighthouse so @lhci/cli never enters package-lock / npm audit.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pages = ["/index.html", "/tech.html", "/travel.html", "/life.html", "/designs.html"];
const port = 5199;
const minA11y = 0.9;
const outDir = path.join(root, ".lighthouseci");

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function resolveFile(urlPath) {
  let rel = decodeURIComponent((urlPath || "/").split("?")[0]);
  if (rel === "/") rel = "/index.html";
  return path.join(root, rel);
}

const server = http.createServer((req, res) => {
  const file = resolveFile(req.url);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  res.writeHead(200, {
    "Content-Type": mime[path.extname(file).toLowerCase()] || "application/octet-stream",
  });
  fs.createReadStream(file).pipe(res);
});

function runLighthouse(url, index) {
  const out = path.join(outDir, `a11y-${index}.json`);
  fs.mkdirSync(outDir, { recursive: true });
  if (fs.existsSync(out)) fs.unlinkSync(out);

  const cmd =
    `npx --yes lighthouse@12.6.1 "${url}" ` +
    `--only-categories=accessibility ` +
    `--chrome-flags="--headless --no-sandbox --disable-dev-shm-usage" ` +
    `--output=json --output-path="${out}" --quiet`;

  return new Promise((resolve) => {
    const child = spawn(cmd, { cwd: root, env: process.env, shell: true, stdio: "inherit" });
    child.on("close", () => {
      if (!fs.existsSync(out)) {
        resolve({ url, score: null, failed: [], err: "no report written" });
        return;
      }
      try {
        const report = JSON.parse(fs.readFileSync(out, "utf8"));
        const failed = Object.values(report.audits || {})
          .filter(
            (a) =>
              a.score !== null &&
              a.score < 1 &&
              a.scoreDisplayMode !== "manual" &&
              a.scoreDisplayMode !== "notApplicable" &&
              a.scoreDisplayMode !== "informative"
          )
          .map((a) => `${a.id}(${a.score})`);
        resolve({
          url,
          score: report.categories?.accessibility?.score ?? null,
          failed,
          err: report.runtimeError?.message || "",
        });
      } catch (e) {
        resolve({ url, score: null, failed: [], err: String(e) });
      }
    });
  });
}

fs.mkdirSync(outDir, { recursive: true });
await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
console.log(`Serving on http://127.0.0.1:${port}`);

const results = [];
for (let i = 0; i < pages.length; i++) {
  const url = `http://127.0.0.1:${port}${pages[i]}`;
  console.log(`Auditing ${url} ...`);
  const result = await runLighthouse(url, i);
  results.push(result);
  console.log(`  accessibility=${result.score} failed=[${result.failed.join(", ")}]`);
  if (result.err) console.log(`  note: ${result.err.slice(0, 240)}`);
}
server.close();

const bad = results.filter((r) => r.score === null || r.score < minA11y);
if (bad.length) {
  console.error(`FAILED: ${bad.length} page(s) below ${minA11y}`);
  process.exit(1);
}
console.log(`PASSED: all pages accessibility >= ${minA11y}`);
