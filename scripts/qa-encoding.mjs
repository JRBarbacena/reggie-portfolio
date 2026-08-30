import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const ignoredDirectories = new Set([
  ".git", ".vercel", "artifacts", "coverage", "dist-react", "node_modules",
  "playwright-report", "test-results",
]);
const textExtensions = new Set([
  ".css", ".html", ".js", ".json", ".jsx", ".md", ".mjs", ".sql", ".svg", ".txt", ".yml", ".yaml",
]);
const suspiciousSequences = [
  { label: "replacement character", pattern: /\uFFFD/u },
  { label: "UTF-8 decoded as Windows-1252", pattern: /(?:\u00C2[\u0080-\u00BF]|\u00C3[\u0080-\u00BF]|\u00E2(?:[\u0080-\u00BF]|\u20AC|\u2018|\u2019|\u201C|\u201D|\u2022|\u2026))/u },
  { label: "common mojibake marker", pattern: /(?:\u00EF\u00BF\u00BD|\u00F0\u0178|\u00E2\u20AC|\u00E2\u20AC\u2122|\u00E2\u20AC\u0153|\u00E2\u20AC\u009D|\u00C2\s)/u },
];
const decoder = new TextDecoder("utf-8", { fatal: true });
const failures = [];

async function inspectDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await inspectDirectory(absolute);
      continue;
    }
    if (!entry.isFile() || !textExtensions.has(path.extname(entry.name))) continue;

    const relative = path.relative(root, absolute).replaceAll(path.sep, "/");
    let source;
    try {
      source = decoder.decode(await readFile(absolute));
    } catch {
      failures.push(`${relative}: invalid UTF-8 bytes`);
      continue;
    }
    const lines = source.split(/\r?\n/u);
    for (let index = 0; index < lines.length; index += 1) {
      for (const { label, pattern } of suspiciousSequences) {
        if (pattern.test(lines[index])) failures.push(`${relative}:${index + 1}: ${label}`);
      }
    }
  }
}

await inspectDirectory(root);
if (failures.length) {
  console.error(`Encoding QA failed:\n${failures.map((failure) => `- ${failure}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log("Encoding QA passed: checked text files are valid UTF-8 with no known mojibake markers.");
}
