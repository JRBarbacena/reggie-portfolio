import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { JSDOM } from "jsdom";

const root = process.cwd();
const manifest = JSON.parse(readFileSync(resolve(root, "config/site-manifest.json"), "utf8"));
const routes = new Map([
  ...manifest.pages.map(({ route, document }) => [route, document]),
  ...manifest.utilities.map(({ route, document }) => [route, document]),
]);
const documents = [...manifest.pages, ...manifest.utilities];
const issues = [];

function localTarget(documentName, reference) {
  const clean = reference.split(/[?#]/, 1)[0];
  if (!clean || /^(?:https?:|mailto:|tel:|data:|#)/i.test(clean)) return null;
  if (routes.has(clean)) return routes.get(clean);
  if (clean === "/") return routes.get("/");
  return clean.startsWith("/")
    ? clean.slice(1)
    : resolve(dirname(documentName), clean);
}

for (const { id, document: documentName } of documents) {
  const documentPath = resolve(root, documentName);
  if (!existsSync(documentPath)) {
    issues.push(`${id}: missing document ${documentName}`);
    continue;
  }

  const source = readFileSync(documentPath, "utf8");
  const document = new JSDOM(source).window.document;
  const headings = document.querySelectorAll("h1");
  if (headings.length !== 1) {
    issues.push(`${documentName}: expected exactly one h1, found ${headings.length}`);
  }
  if (!document.querySelector("main#main")) {
    issues.push(`${documentName}: missing main#main landmark`);
  }

  for (const element of document.querySelectorAll("[src], [href]")) {
    const attribute = element.hasAttribute("src") ? "src" : "href";
    const reference = element.getAttribute(attribute);
    const target = localTarget(documentName, reference);
    if (!target) continue;
    const targetPath = resolve(root, target);
    if (!existsSync(targetPath)) {
      issues.push(`${documentName}: unresolved ${attribute}="${reference}"`);
    }
  }

  if (manifest.pages.some((page) => page.id === id)) {
    for (const selector of [
      'meta[name="viewport"]',
      'link[href$="css/main.css"]',
      'script[src$="js/site-cache.js"]',
      'script[src$="js/site-nav.js"]',
      'script[src$="js/site-footer.js"]',
      'script[src$="js/motion.js"]',
      "site-nav",
      "site-footer",
      'a.skip-link[href="#main"]',
    ]) {
      if (!document.querySelector(selector)) issues.push(`${documentName}: missing ${selector}`);
    }
  }
}

const navigationSource = readFileSync(resolve(root, "js/site-nav.js"), "utf8");
if (/\bHEAD\b|method:\s*["']HEAD["']|\.html[`"']/.test(navigationSource)) {
  issues.push("js/site-nav.js: native clean-route navigation must not use HEAD preflights or guessed .html fallbacks");
}
if (!navigationSource.includes('toggleAttribute("inert"')) {
  issues.push("js/site-nav.js: closed navigation disclosures must remove descendants from keyboard navigation");
}

const registrationSource = readFileSync(resolve(root, "js/site-cache.js"), "utf8");
if (!registrationSource.includes('navigator.serviceWorker.register("/sw.js"')) {
  issues.push("js/site-cache.js: service-worker registration is missing");
}
if (!registrationSource.includes("controllerchange") || !registrationSource.includes("PORTFOLIO_ACTIVATE")) {
  issues.push("js/site-cache.js: waiting-worker refresh lifecycle is incomplete");
}

const workerSource = readFileSync(resolve(root, "sw.js"), "utf8");
for (const contract of [
  'from "./js/cache-policy.js"',
  'request.mode === "navigate"',
  "REQUIRED_SHELL",
  "OPTIONAL_SHELL",
  "PORTFOLIO_ACTIVATE",
]) {
  if (!workerSource.includes(contract)) issues.push(`sw.js: missing cache contract ${contract}`);
}

if (issues.length) {
  console.error("Static QA failed.");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(`Static QA passed for ${documents.length} manifest documents.`);
