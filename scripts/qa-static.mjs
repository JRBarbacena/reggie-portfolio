import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const pages = ["index.html", "tech.html", "travel.html", "life.html", "designs.html", "404.html"];
const missing = [];
const invalidHeadings = [];

for (const page of pages) {
  const source = readFileSync(resolve(root, page), "utf8");
  const references = [...source.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((reference) => !/^(https?:|mailto:|#)/.test(reference));

  for (const reference of references) {
    const cleanRoute = reference.match(/^\/(?:([a-z0-9-]+))?$/i);
    const target = cleanRoute
      ? cleanRoute[1] ? `${cleanRoute[1]}.html` : "index.html"
      : reference.startsWith("/") ? reference.slice(1) : reference;
    if (!existsSync(resolve(root, target))) missing.push(`${page}: ${reference}`);
  }

  const h1Count = [...source.matchAll(/<h1\b/g)].length;
  if (h1Count !== 1) invalidHeadings.push(`${page}: expected one h1, found ${h1Count}`);
}

if (missing.length || invalidHeadings.length) {
  console.error("Static QA failed.");
  for (const issue of [...missing, ...invalidHeadings]) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(`Static QA passed for ${pages.length} pages.`);
