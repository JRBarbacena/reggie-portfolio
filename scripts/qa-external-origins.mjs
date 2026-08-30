import { readFile } from "node:fs/promises";

const pages = ["index.html", "tech.html", "travel.html", "life.html", "404.html", "offline.html"];
const forbidden = [];
for (const page of pages) {
  const source = await readFile(page, "utf8");
  for (const match of source.matchAll(/(?:src|href)=["'](https?:\/\/[^"']+)/g)) forbidden.push(`${page}: ${match[1]}`);
}
if (forbidden.length) {
  console.error("Runtime external origins are prohibited:\n" + forbidden.map((value) => `- ${value}`).join("\n"));
  process.exit(1);
}
console.log(`External-origin policy passed for ${pages.length} documents.`);
