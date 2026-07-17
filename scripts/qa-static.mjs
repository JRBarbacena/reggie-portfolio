import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const pages = ["index.html", "tech.html", "travel.html", "life.html", "designs.html", "404.html"];
const missing = [];
const invalidHeadings = [];
const responsiveContractIssues = [];

for (const page of pages) {
  const source = readFileSync(resolve(root, page), "utf8");
  const references = [...source.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((reference) => !/^(https?:|mailto:|#)/.test(reference))
    .map((reference) => {
      const [pathOnly] = reference.split(/[?#]/);
      return pathOnly;
    });

  for (const reference of references) {
    const cleanRoute = reference.match(/^\/(?:([a-z0-9-]+))?$/i);
    const target = cleanRoute
      ? cleanRoute[1] ? `${cleanRoute[1]}.html` : "index.html"
      : reference.startsWith("/") ? reference.slice(1) : reference;
    if (!existsSync(resolve(root, target))) missing.push(`${page}: ${reference}`);
  }

  const h1Count = [...source.matchAll(/<h1\b/g)].length;
  if (h1Count !== 1) invalidHeadings.push(`${page}: expected one h1, found ${h1Count}`);

  if (page === "tech.html") {
    const hasExperienceLog = source.includes('class="experience-log tech-experience card"');
    const hasCurrentTime = source.includes('class="experience-log__time">Current</p>');
    const hasLegacyCurrentBuild = source.includes('class="current-build card"');

    if (!hasExperienceLog || !hasCurrentTime) {
      responsiveContractIssues.push(`${page}: education and experience must use the shared simple experience log markup`);
    }

    if (hasLegacyCurrentBuild) {
      responsiveContractIssues.push(`${page}: remove the expanded current-build markup`);
    }
  }
}

const cacheRegistration = resolve(root, "js/site-cache.js");
const serviceWorker = resolve(root, "sw.js");
if (!existsSync(cacheRegistration)) {
  responsiveContractIssues.push("js/site-cache.js: cache registration script is missing");
} else if (!readFileSync(cacheRegistration, "utf8").includes('navigator.serviceWorker.register("/sw.js"')) {
  responsiveContractIssues.push("js/site-cache.js: service worker registration is missing");
}

if (!existsSync(serviceWorker)) {
  responsiveContractIssues.push("sw.js: service worker is missing");
} else {
  const workerSource = readFileSync(serviceWorker, "utf8");
  for (const requiredSnippet of ["CACHE_NAME", "APP_SHELL", 'request.mode === "navigate"']) {
    if (!workerSource.includes(requiredSnippet)) {
      responsiveContractIssues.push(`sw.js: missing cache contract ${requiredSnippet}`);
    }
  }
}

if (missing.length || invalidHeadings.length || responsiveContractIssues.length) {
  console.error("Static QA failed.");
  for (const issue of [...missing, ...invalidHeadings, ...responsiveContractIssues]) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(`Static QA passed for ${pages.length} pages.`);
